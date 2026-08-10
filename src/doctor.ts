import { loadEnv, resolveChainProfile } from "./config.js";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/** `idleproxy doctor` — the environment gate. PLAN.md 0.1: written first so
 * Day 1 isn't a debugging session over an unverified environment. */

interface Check {
  name: string;
  run: () => Promise<{ ok: boolean; detail: string }>;
}

function expandHome(p: string): string {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : p;
}

async function checkClaudeOnPath(): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const child = spawn("claude", ["--version"]);
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("error", () => resolve({ ok: false, detail: "claude not found on PATH" }));
    child.on("close", (code) => resolve({ ok: code === 0, detail: out.trim() || `exit ${code}` }));
  });
}

async function checkCredentials(path: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const raw = JSON.parse(await readFile(expandHome(path), "utf8"));
    const oauth = raw.claudeAiOauth;
    if (!oauth?.expiresAt) return { ok: false, detail: "credentials file missing claudeAiOauth.expiresAt" };
    const expired = oauth.expiresAt < Date.now();
    return { ok: !expired, detail: expired ? "OAuth token expired — run claude /login" : `expires ${new Date(oauth.expiresAt).toISOString()}` };
  } catch (e) {
    return { ok: false, detail: `cannot read ${path}: ${(e as Error).message}` };
  }
}

async function checkClaudeRoundTrip(): Promise<{ ok: boolean; detail: string }> {
  const { runTier0 } = await import("./node/tier0.js");
  const env = loadEnv();
  const result = await runTier0({
    jobId: "doctor",
    prompt: "Reply with exactly: OK",
    model: "sonnet",
    maxBudgetUsd: 0.5,
    credentialsPath: env.CLAUDE_CREDENTIALS_PATH,
    timeoutMs: 30_000,
  });
  return { ok: result.ok, detail: result.ok ? `cost=$${result.costUsd}` : result.error ?? "unknown failure" };
}

async function checkDocker(): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const child = spawn("docker", ["info"]);
    child.on("error", () => resolve({ ok: false, detail: "docker not found" }));
    child.on("close", (code) => resolve({ ok: code === 0, detail: code === 0 ? "daemon reachable" : `exit ${code}` }));
  });
}

async function checkKeeperHub(): Promise<{ ok: boolean; detail: string }> {
  const env = loadEnv();
  if (!env.KEEPERHUB_API_KEY) return { ok: false, detail: "KEEPERHUB_API_KEY not set" };
  try {
    const res = await fetch(`${env.KEEPERHUB_API_BASE}/chains`, {
      headers: { Authorization: `Bearer ${env.KEEPERHUB_API_KEY}` },
    });
    return { ok: res.status === 200, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}

async function checkChainProfile(): Promise<{ ok: boolean; detail: string }> {
  const env = loadEnv();
  try {
    const profile = await resolveChainProfile(env);
    return { ok: true, detail: `${profile.eip712Domain.name} v${profile.eip712Domain.version} on ${profile.chainId}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}

export async function runDoctor(): Promise<void> {
  const checks: Check[] = [
    { name: "claude on PATH", run: checkClaudeOnPath },
    { name: "claude credentials", run: () => checkCredentials(loadEnv().CLAUDE_CREDENTIALS_PATH) },
    { name: "claude round-trip (real call)", run: checkClaudeRoundTrip },
    { name: "docker daemon", run: checkDocker },
    { name: "KeeperHub API key", run: checkKeeperHub },
    { name: "chain profile (on-chain domain read)", run: checkChainProfile },
  ];

  let allOk = true;
  for (const check of checks) {
    const result = await check.run();
    allOk &&= result.ok;
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${check.name.padEnd(35)} ${result.detail}`);
  }

  if (!allOk) process.exitCode = 1;
}
