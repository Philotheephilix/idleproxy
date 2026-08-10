import { spawn } from "node:child_process";
import { mkdtemp, mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";

/**
 * Tier 0 — throwaway-HOME tool-free runner. SPEC.md §5, V1: `--bare` fails
 * auth even with a valid credential, so isolation is done with a fresh HOME
 * instead. That also strips CLAUDE.md/plugins/skills/history and cuts
 * measured cost 3.6x (SPEC.md §1 V2) — a strictly better substitute.
 */

const DISALLOWED_TOOLS = "Bash,Read,Edit,Write,WebFetch,WebSearch,Glob,Grep,NotebookEdit,Task,TodoWrite";

export interface Tier0Job {
  jobId: string;
  prompt: string;
  model: string; // "sonnet" | "opus" | "haiku" or a full model id
  maxBudgetUsd: number; // caps generation cost to the priced band — SPEC.md D5
  credentialsPath: string; // resolved path to ~/.claude/.credentials.json
  timeoutMs?: number;
}

export interface Tier0Result {
  ok: boolean;
  text?: string;
  modelReported?: string;
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  numTurns?: number;
  durationMs?: number;
  error?: string;
  rawExitCode?: number | null;
}

function expandHome(p: string): string {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : p;
}

export async function runTier0(job: Tier0Job): Promise<Tier0Result> {
  const base = await mkdtemp(join(tmpdir(), "idleproxy-tier0-"));
  const home = join(base, "home");
  const work = join(base, "work");

  try {
    await mkdir(join(home, ".claude"), { recursive: true });
    await mkdir(work, { recursive: true });
    await copyFile(expandHome(job.credentialsPath), join(home, ".claude", ".credentials.json"));
    await writeFile(join(home, ".claude", "settings.json"), "{}\n");

    const args = [
      "-p",
      job.prompt,
      "--model",
      job.model,
      "--output-format",
      "json",
      "--strict-mcp-config",
      "--disallowed-tools",
      DISALLOWED_TOOLS,
      "--max-budget-usd",
      job.maxBudgetUsd.toString(),
    ];

    const result = await new Promise<Tier0Result>((resolve) => {
      const child = spawn("claude", args, {
        cwd: work,
        env: { HOME: home, PATH: process.env.PATH ?? "" },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
      }, job.timeoutMs ?? 60_000);

      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));

      child.on("close", (code) => {
        clearTimeout(timeout);
        if (!stdout.trim()) {
          resolve({ ok: false, error: stderr || `no output, exit ${code}`, rawExitCode: code });
          return;
        }
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.is_error) {
            resolve({ ok: false, error: parsed.result ?? "unknown error", rawExitCode: code });
            return;
          }
          const modelKeys = Object.keys(parsed.modelUsage ?? {});
          const primaryModel = modelKeys[modelKeys.length - 1] ?? job.model;
          resolve({
            ok: true,
            text: parsed.result,
            modelReported: primaryModel,
            costUsd: parsed.total_cost_usd,
            inputTokens: parsed.usage?.input_tokens,
            outputTokens: parsed.usage?.output_tokens,
            cacheCreationInputTokens: parsed.usage?.cache_creation_input_tokens,
            cacheReadInputTokens: parsed.usage?.cache_read_input_tokens,
            numTurns: parsed.num_turns,
            durationMs: parsed.duration_ms,
            rawExitCode: code,
          });
        } catch (e) {
          resolve({ ok: false, error: `unparseable output: ${(e as Error).message}`, rawExitCode: code });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ ok: false, error: `spawn failed: ${err.message}` });
      });
    });

    return result;
  } finally {
    await rm(base, { recursive: true, force: true }).catch(() => {});
  }
}
