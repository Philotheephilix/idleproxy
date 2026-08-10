import { loadEnv, resolveChainProfile } from "./config.js";
import { openDb } from "./db.js";
import { KeeperHubClient } from "./keeperhub.js";
import { buildServer, startServer, attachNodeServer } from "./server.js";
import { NodeRegistry } from "./dispatch.js";
import { generateNodeKeypair } from "./attest.js";
import { runPayoutBatch } from "./treasurer.js";
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

  const thresholdArg = process.argv.find((a) => a.startsWith("--threshold="));
  const thresholdMicros = thresholdArg ? BigInt(Math.round(Number(thresholdArg.split("=")[1]) * 1_000_000)) : 0n;

  const result = await runPayoutBatch(env, chainProfile, db, thresholdMicros);

  for (const s of result.skipped) console.log(`skip ${s.providerId}: payout already ${s.reason} this period`);
  if (result.error) {
    console.error("treasurer run failed:", result.error);
    process.exitCode = 1;
  }
  if (result.paid.length === 0 && result.skipped.length === 0 && !result.error) {
    console.log("no pending payouts at or above threshold");
  }
  for (const p of result.paid) console.log(`${p.providerId}: ${p.status} ${p.transactionHash ?? ""}`);
}

function argValue(flag: string, fallback: string): string {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`));
  return arg ? arg.slice(flag.length + 1) : fallback;
}

async function cmdNode(): Promise<void> {
  const env = loadEnv();
  const { runNode } = await import("./node/agent.js");

  const wallet = argValue("--wallet", process.env.CONSUMER_TEST_ADDRESS ?? "");
  const token = argValue("--token", env.NODE_TOKEN);
  if (!wallet) {
    console.error("idleproxy node: --wallet=0x... is required");
    process.exit(1);
  }
  if (!token) {
    console.error("idleproxy node: --token=... is required (from POST /api/provider/node-token, after accepting the disclosure)");
    process.exit(1);
  }

  await runNode({
    routerWsUrl: env.ROUTER_WS_URL,
    wallet,
    token,
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
