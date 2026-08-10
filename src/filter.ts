/**
 * Input filter applied before dispatch on both the x402 and prepaid paths.
 * SPEC.md §6, §7: defense in depth, not the control — Tier 0 already has no
 * tools and never puts the credential in the model's context, so this
 * catches abuse patterns and blatant exfil attempts rather than being load-
 * bearing for credential safety.
 */

export interface FilterResult {
  allowed: boolean;
  reason?: string;
}

const MAX_PROMPT_CHARS = 32_000;

// Patterns that target the host credential/file surface directly. Tier 1's
// container isolation is the real control (SPEC.md §5); this is a cheap
// pre-filter that stops the obvious case before it burns a paid job.
const CREDENTIAL_EXFIL_PATTERNS: RegExp[] = [
  /\.claude\/\.credentials\.json/i,
  /\.codex\/auth\.json/i,
  /~\/\.aws\/credentials/i,
  /~\/\.ssh\/id_(rsa|ed25519|ecdsa)/i,
  /\benv\s*\|\s*curl\b/i,
  /\bcat\s+.*\.env\b/i,
  /process\.env\s*\)\s*.*fetch\(/i,
];

export function filterInput(prompt: string): FilterResult {
  if (prompt.length === 0) {
    return { allowed: false, reason: "empty prompt" };
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return { allowed: false, reason: `prompt exceeds ${MAX_PROMPT_CHARS} chars` };
  }
  for (const pattern of CREDENTIAL_EXFIL_PATTERNS) {
    if (pattern.test(prompt)) {
      return { allowed: false, reason: `matched credential-exfil pattern: ${pattern.source}` };
    }
  }
  return { allowed: true };
}
