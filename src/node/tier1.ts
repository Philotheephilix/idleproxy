import { spawn } from "node:child_process";
import { mkdtemp, mkdir, copyFile, rm, chmod } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";

/**
 * Tier 1 — tool-enabled, always containerized. SPEC.md §5/§6: Codex has no
 * clean no-tools switch (`--sandbox read-only` still reads
 * `~/.codex/auth.json`), so every tool-enabled job runs here regardless of
 * adapter. Fresh container per job, no host bind mounts except a read-only
 * credential copy, egress locked to the model API host via `ipx-egress`.
 */

const JOB_IMAGE = "idleproxy-job:latest";
const JOBNET = "ipx-jobnet";
const WALL_CLOCK_SECONDS = 180;

export interface Tier1Job {
  jobId: string;
  prompt: string;
  model: string;
  maxBudgetUsd: number;
  credentialsPath: string;
}

export interface Tier1Result {
  ok: boolean;
  text?: string;
  modelReported?: string;
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

function expandHome(p: string): string {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : p;
}

export async function runTier1(job: Tier1Job): Promise<Tier1Result> {
  const jobDir = await mkdtemp(join(tmpdir(), "idleproxy-tier1-"));
  const credsPath = join(jobDir, "creds.json");

  try {
    await mkdir(jobDir, { recursive: true });
    await copyFile(expandHome(job.credentialsPath), credsPath);
    // The source credential file is 0600 (owner-only). The container runs
    // as a different uid (10001), so the read-only bind mount needs the
    // copy to be world-readable — this is a throwaway temp-dir copy
    // deleted in the finally below, not the provider's real credential.
    await chmod(credsPath, 0o644);

    const args = [
      "run",
      "--rm",
      "--network",
      JOBNET,
      "--user",
      "10001:10001",
      "--memory",
      "2g",
      "--pids-limit",
      "256",
      "--cpus",
      "1.5",
      "--read-only",
      // uid/gid/mode explicit: a bare --tmpfs mounts root-owned, and the
      // job runs as uid 10001 — without this Claude Code can't create its
      // own session-env scratch dir under $HOME and Bash tool calls fail
      // before running anything.
      "--tmpfs",
      "/work:size=1g,uid=10001,gid=10001,mode=0700",
      "--tmpfs",
      "/home/ipxjob:size=256m,uid=10001,gid=10001,mode=0700",
      // Mounted separately, not left to auto-create under /home/ipxjob:
      // Docker creates a bind mount's missing parent directories as root
      // regardless of the enclosing tmpfs's declared uid, so without this
      // Claude Code's own mkdir of .claude/session-env at runtime fails
      // with EACCES even though $HOME itself is owned by the job user.
      "--tmpfs",
      "/home/ipxjob/.claude:size=64m,uid=10001,gid=10001,mode=0700",
      "--tmpfs",
      "/tmp:size=256m,uid=10001,gid=10001,mode=0700",
      "-e",
      "HOME=/home/ipxjob",
      "-e",
      "HTTPS_PROXY=http://ipx-egress:3128",
      // Disabled deliberately, not an oversight: this feature nests a
      // bubblewrap user namespace inside the container's own, which
      // Docker's default seccomp profile refuses without extra host
      // capabilities we don't want to grant ("No permissions to create new
      // namespace"). It's also redundant here — its job is protecting
      // Claude Code's subprocesses from inheriting sensitive env vars on a
      // SHARED host; nothing sensitive is in this container's env (the
      // credential is a mounted file, never an env var), and the real
      // Tier-1 isolation boundary is the container itself: fresh per job,
      // no host bind mounts, egress locked, tmpfs everywhere writable.
      "-e",
      "CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=0",
      "--mount",
      `type=bind,src=${credsPath},dst=/home/ipxjob/.claude/.credentials.json,readonly`,
      "--stop-timeout",
      String(WALL_CLOCK_SECONDS),
      JOB_IMAGE,
      "-p",
      job.prompt,
      "--model",
      job.model,
      "--output-format",
      "json",
      "--strict-mcp-config",
      // Explicit allow-list, not --permission-mode bypassPermissions: with
      // CLAUDE_CODE_SUBPROCESS_ENV_SCRUB set, the CLI's own hardening
      // forces permission mode back to default unless tools are declared
      // explicitly. WebFetch/WebSearch are left off — the egress lock
      // already blocks them, so there is no reason to let a job attempt
      // them at all.
      "--allowed-tools",
      "Bash,Read,Edit,Write,Glob,Grep",
      "--max-budget-usd",
      job.maxBudgetUsd.toString(),
    ];

    return await new Promise<Tier1Result>((resolve) => {
      const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => child.kill("SIGKILL"), (WALL_CLOCK_SECONDS + 10) * 1000);

      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));

      child.on("close", (code) => {
        clearTimeout(timeout);
        if (!stdout.trim()) {
          resolve({ ok: false, error: stderr || `container produced no output, exit ${code}` });
          return;
        }
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.is_error) {
            resolve({ ok: false, error: parsed.result ?? "unknown container error" });
            return;
          }
          const modelKeys = Object.keys(parsed.modelUsage ?? {});
          resolve({
            ok: true,
            text: parsed.result,
            modelReported: modelKeys[modelKeys.length - 1] ?? job.model,
            costUsd: parsed.total_cost_usd,
            inputTokens: parsed.usage?.input_tokens,
            outputTokens: parsed.usage?.output_tokens,
          });
        } catch (e) {
          resolve({ ok: false, error: `unparseable container output: ${(e as Error).message}` });
        }
      });

      child.on("error", (err) => resolve({ ok: false, error: `docker spawn failed: ${err.message}` }));
    });
  } finally {
    await rm(jobDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * One-time setup, idempotent: the internal job network, the egress proxy
 * image, and the running egress container. Job containers reach
 * `ipx-egress:3128` because both sit on `ipx-jobnet`; the egress container
 * additionally sits on the default `bridge` network so it has real
 * internet access to reach `api.anthropic.com` — job containers never get
 * that second NIC, which is what makes `--internal` meaningful.
 */
export async function ensureTier1Infra(): Promise<void> {
  await run(["network", "create", "--internal", JOBNET]).catch(() => {}); // already exists is fine

  const imageExists = await run(["image", "inspect", "idleproxy-egress:latest"])
    .then(() => true)
    .catch(() => false);
  if (!imageExists) {
    await run(["build", "-f", "Dockerfile.egress", "-t", "idleproxy-egress:latest", "."]);
  }

  const running = await run(["inspect", "-f", "{{.State.Running}}", "ipx-egress"])
    .then(() => true)
    .catch(() => false);
  if (!running) {
    await run(["run", "-d", "--name", "ipx-egress", "--network", JOBNET, "idleproxy-egress:latest"]);
    await run(["network", "connect", "bridge", "ipx-egress"]);
  }

  const jobImageExists = await run(["image", "inspect", JOB_IMAGE])
    .then(() => true)
    .catch(() => false);
  if (!jobImageExists) {
    await run(["build", "-f", "Dockerfile.job", "-t", JOB_IMAGE, "."]);
  }
}

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { stdio: "ignore" });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`docker ${args.join(" ")} exited ${code}`))));
    child.on("error", reject);
  });
}
