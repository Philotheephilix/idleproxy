import { loadEnv, resolveChainProfile } from "./config.js";
import { openDb } from "./db.js";
import { KeeperHubClient } from "./keeperhub.js";
import { buildServer, startServer } from "./server.js";
import { generateNodeKeypair } from "./attest.js";
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

  const app = buildServer({
    env,
    chainProfile,
    db,
    keeperhub,
    houseNodeKeypair,
    credentialsPath: env.CLAUDE_CREDENTIALS_PATH,
  });

  startServer(app, env.PORT);
}

async function cmdDoctor(): Promise<void> {
  const { runDoctor } = await import("./doctor.js");
  await runDoctor();
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
      console.error("idleproxy node: not yet implemented in this build");
      process.exit(1);
    case "treasurer":
      console.error("idleproxy treasurer: not yet implemented in this build");
      process.exit(1);
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
