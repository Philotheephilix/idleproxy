#!/usr/bin/env node
import { loadEnv, resolveChainProfile } from "./config.js";
import { openDb } from "./db.js";
import { KeeperHubClient } from "./keeperhub.js";
import { buildServer, startServer, attachNodeServer } from "./server.js";
import { NodeRegistry } from "./dispatch.js";
import { generateNodeKeypair } from "./attest.js";
import { runPayoutBatch } from "./treasurer.js";
import { buildSettlementCall } from "./x402.js";
import { KeeperHubError } from "./keeperhub.js";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getAddress } from "viem";

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

/**
 * Bounty artifact (PLAN.md 2.3): being your own x402 facilitator on
 * KeeperHub. Generates a throwaway EOA, signs a zero-value EIP-3009
 * TransferWithAuthorization to the org wallet, and settles it through
 * KeeperHub's contract-call endpoint — the exact pattern the whole
 * settlement design (SPEC.md D1) rests on, in one command with zero setup.
 */
async function cmdFacilitatorDemo(): Promise<void> {
  const env = loadEnv();
  const chainProfile = await resolveChainProfile(env);
  const keeperhub = new KeeperHubClient(env);

  const throwaway = privateKeyToAccount(generatePrivateKey());
  console.log(`throwaway signer: ${throwaway.address}`);

  const now = Math.floor(Date.now() / 1000);
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = ("0x" + Buffer.from(nonceBytes).toString("hex")) as `0x${string}`;
  const auth = {
    from: throwaway.address,
    to: getAddress(env.PAY_TO_ADDRESS),
    value: 0n,
    validAfter: 0n,
    validBefore: BigInt(now + 300),
    nonce,
  };

  const signature = await throwaway.signTypedData({
    domain: chainProfile.eip712Domain,
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: auth,
  });

  const call = buildSettlementCall(auth, signature, chainProfile.usdcAddress, chainProfile.chainId);

  console.log("simulating...");
  const sim = await keeperhub.simulateContractCall(call);
  if (sim.wouldRevert) {
    console.error(`simulate says this would revert: ${sim.revertReason}`);
    process.exitCode = 1;
    return;
  }
  console.log(`simulate OK (gasEstimate=${sim.gasEstimate})`);

  console.log("broadcasting...");
  const broadcast = await keeperhub.contractCall(call, nonce);
  if ("kind" in broadcast) {
    console.error(`broadcast returned ${broadcast.kind}`);
    process.exitCode = 1;
    return;
  }

  console.log(`polling execution ${broadcast.executionId}...`);
  try {
    const final = await keeperhub.pollToTerminal(broadcast.executionId);
    if (final.status !== "completed" || !final.receipts.every((r) => r.verified)) {
      console.error("settlement did not verify:", JSON.stringify(final));
      process.exitCode = 1;
      return;
    }
    console.log(`\nSettled. This is a real KeeperHub-executed EIP-3009 TransferWithAuthorization:`);
    console.log(final.transactionLink ?? final.transactionHash);
    console.log(`sponsored: ${final.sponsored}`);
  } catch (e) {
    console.error(e instanceof KeeperHubError ? e.message : e);
    process.exitCode = 1;
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
  const token = argValue("--token", env.NODE_TOKEN);
  if (!wallet) {
    console.error("idleproxy node: --wallet=0x... is required");
    process.exit(1);
  }
  if (!token) {
    console.error("idleproxy node: --token=... is required (from POST /api/provider/node-token, after accepting the disclosure)");
    process.exit(1);
  }

  const tier1 = process.argv.includes("--tier1");

  await runNode({
    routerWsUrl: argValue("--router-ws-url", env.ROUTER_WS_URL),
    wallet,
    token,
    adapter: tier1 ? "claude-code-tools" : "claude-code",
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
      await cmdFacilitatorDemo();
      break;
    default:
      console.error("usage: idleproxy <serve|node|treasurer|doctor|facilitator-demo>");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
