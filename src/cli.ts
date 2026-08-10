import { loadEnv, resolveChainProfile } from "./config.js";
import { openDb } from "./db.js";
import { KeeperHubClient } from "./keeperhub.js";
import { buildServer, startServer, attachNodeServer } from "./server.js";
import { NodeRegistry } from "./dispatch.js";
import { generateNodeKeypair } from "./attest.js";
import { buildPayoutPlan, recordPlannedPayouts, runTreasurer } from "./treasurer.js";
import { finalizePayout, existingPayoutStatus } from "./ledger.js";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const HOUSE_KEY_PATH = "./idleproxy-house.key";

async function loadOrCreateHouseKeypair(): Promise<{ publicKeyHex: string; privateKeyDer: Buffer }> {
  if (existsSync(HOUSE_KEY_PATH)) {
    const raw = JSON.parse(await readFile(HOUSE_KEY_PATH, "utf8"));
    return { publicKeyHex: raw.publicKeyHex, privateKeyDer: Buffer.from(raw.privateKeyDerHex, "hex") };
  }
  const kp = generateNodeKeypair();
  await writeFile(
    HOUSE_KEY_PATH,
    JSON.stringify({ publicKeyHex: kp.publicKeyHex, privateKeyDerHex: kp.privateKeyDer.toString("hex") }),
  );
  return kp;
}

async function cmdServe(): Promise<void> {
  const env = loadEnv();
  console.log("resolving chain profile...");
  const chainProfile = await resolveChainProfile(env);
  console.log(`chain profile: chainId=${chainProfile.chainId} usdc=${chainProfile.usdcAddress} domain=${JSON.stringify(chainProfile.eip712Domain)}`);

  const db = openDb(env.DATABASE_PATH);
  const keeperhub = new KeeperHubClient(env);
  const houseNodeKeypair = await loadOrCreateHouseKeypair();
  const registry = new NodeRegistry(db);

  const app = buildServer({
    env,
    chainProfile,
    db,
    keeperhub,
    houseNodeKeypair,
    credentialsPath: env.CLAUDE_CREDENTIALS_PATH,
    registry,
  });

  const httpServer = startServer(app, env.PORT);
  attachNodeServer(httpServer, registry, db);
  console.log(`provider nodes dial ws://localhost:${env.PORT}/node`);
}

async function cmdDoctor(): Promise<void> {
  const { runDoctor } = await import("./doctor.js");
  await runDoctor();
}

async function cmdTreasurer(): Promise<void> {
  const env = loadEnv();
  const chainProfile = await resolveChainProfile(env);
  const db = openDb(env.DATABASE_PATH);
  // Full timestamp, not a date slice: SPEC.md §6 runs the treasurer on a
  // threshold as well as daily, so two batches can legitimately happen on
  // the same calendar day. A date-only period would give them the same
  // idempotency key and the second batch would read as an already-paid
  // replay of the first.
  const period = new Date().toISOString();

  const thresholdArg = process.argv.find((a) => a.startsWith("--threshold="));
  const thresholdMicros = thresholdArg ? BigInt(Math.round(Number(thresholdArg.split("=")[1]) * 1_000_000)) : 0n;

  const fullPlan = buildPayoutPlan(db, chainProfile, thresholdMicros, period);
  if (fullPlan.length === 0) {
    console.log("no pending payouts at or above threshold");
    return;
  }

  // Same provider + period + amount already paid (or in flight) — skip, don't re-trigger the
  // workflow. The workflow trigger itself carries no idempotency key, so this local check is what
  // stops a retried run from double-paying (see ledger.existingPayoutStatus).
  const plan = fullPlan.filter((p) => {
    const status = existingPayoutStatus(db, p.idempotencyKey);
    if (status === "verified") {
      console.log(`skip ${p.providerId}: already paid this period (key ${p.idempotencyKey.slice(0, 12)}...)`);
      return false;
    }
    if (status === "broadcast") {
      console.log(`skip ${p.providerId}: payout already in flight this period (key ${p.idempotencyKey.slice(0, 12)}...)`);
      return false;
    }
    return true;
  });

  if (plan.length === 0) {
    console.log("nothing new to pay out");
    return;
  }

  console.log(`treasurer: ${plan.length} pending payout(s):`);
  for (const p of plan) console.log(`  ${p.providerId} -> ${p.wallet}: $${p.amountUsdcDecimal} (key ${p.idempotencyKey.slice(0, 12)}...)`);

  recordPlannedPayouts(db, plan);

  console.log("spawning treasurer agent (Claude Code + KeeperHub MCP)...");
  const result = await runTreasurer(env, plan);

  if (!result.ok) {
    console.error("treasurer agent failed:", result.error);
    process.exitCode = 1;
    return;
  }

  console.log("agent report:\n" + result.rawText);

  if (!result.parsed) {
    console.warn("could not parse structured summary from agent output — payouts recorded as broadcast, not finalized. Reconcile manually.");
    return;
  }

  for (const entry of result.parsed) {
    const p = plan[entry.providerIndex - 1];
    if (!p) continue;
    finalizePayout(db, p.idempotencyKey, {
      transactionLink: entry.transactionHash ? `${chainProfile.explorerBase}/tx/${entry.transactionHash}` : undefined,
      sponsored: entry.sponsored ?? undefined,
      verified: entry.status === "completed",
    });
    console.log(`${p.providerId}: ${entry.status} ${entry.transactionHash ?? ""}`);
  }
}

function argValue(flag: string, fallback: string): string {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`));
  return arg ? arg.slice(flag.length + 1) : fallback;
}

async function cmdNode(): Promise<void> {
  const env = loadEnv();
  const { runNode } = await import("./node/agent.js");

  const wallet = argValue("--wallet", process.env.CONSUMER_TEST_ADDRESS ?? "");
  if (!wallet) {
    console.error("idleproxy node: --wallet=0x... is required");
    process.exit(1);
  }

  await runNode({
    routerWsUrl: env.ROUTER_WS_URL,
    wallet,
    adapter: "claude-code",
    models: argValue("--models", "sonnet,opus,haiku").split(","),
    credentialsPath: env.CLAUDE_CREDENTIALS_PATH,
    dailyUsdCap: Number(argValue("--daily-usd-cap", "5")),
    dailyRequestCap: Number(argValue("--daily-request-cap", "500")),
    maxConcurrency: Number(argValue("--max-concurrency", "1")),
    reserveFraction: Number(argValue("--reserve-fraction", "0.2")),
    keyPath: argValue("--key-path", "./idleproxy-node.key"),
    usageLogPath: argValue("--usage-log", "./usage.jsonl"),
  });
}

async function main(): Promise<void> {
  const [, , cmd] = process.argv;
  switch (cmd) {
    case "serve":
      await cmdServe();
      break;
    case "doctor":
      await cmdDoctor();
      break;
    case "node":
      await cmdNode();
      break;
    case "treasurer":
      await cmdTreasurer();
      break;
    case "facilitator-demo":
      console.error("idleproxy facilitator-demo: not yet implemented in this build");
      process.exit(1);
    default:
      console.error("usage: idleproxy <serve|node|treasurer|doctor|facilitator-demo>");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
