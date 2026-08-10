# Anthropic-compatible API surface

**Superseded by the actual implementation.** This is the pre-build design sketch, kept for the
reasoning trail (`summary.md`'s document map). The authoritative wire shapes are `src/server.ts`
(SPEC.md §10): response headers are `x-idleproxy-attestation` / `x-idleproxy-node` /
`x-idleproxy-settlement-tx` (not `x-declaude-*`-named headers below), the MCP surface is `POST /mcp`
with a single `relay_prompt` tool (not a `/mcp/estimate_tokens`-style path), and there is no separate
token-estimate endpoint. Where this document and the code disagree, the code is right.

What the relay exposes to consumers. Target: **point any Anthropic SDK at our base URL and it works** —
`ANTHROPIC_BASE_URL=https://api.idleproxy.xyz` and nothing else changes.

Wire shapes below are taken from the current Anthropic API reference (via the `claude-api` skill,
2026-08-09), not from memory. Where we deviate, the deviation is stated and justified — silent
divergence from a spec you claim to implement is the one thing that makes a compatible API useless.

---

## 0. The three hard problems

| Problem | Resolution |
|---|---|
| **Anthropic auth is `x-api-key`; x402 is a 402-challenge retry loop.** An unmodified SDK cannot pay a 402 — it raises `AuthenticationError` and stops | **Dual auth.** `x-api-key: dcl_…` prepaid key (SDK-compatible path) **or** unauthenticated → 402 x402 challenge (agent-wallet path). Both hit the same handler. Without this, "point your SDK at us" is a lie |
| **We are not serving the raw API.** Output comes through a coding-agent CLI with its own system prompt and tool scaffolding, so it differs from `api.anthropic.com` for the same `model` and prompt | **Namespaced model IDs.** We never serve `claude-opus-5` under that name. `GET /v1/models` returns `claude-code/opus` etc., and the README says plainly what the difference is |
| **Params we cannot honor** (`temperature`, `tools`, `stream`) | **400, never silent ignore.** A client that sent `temperature: 0` and got sampled output is worse off than one that got an error |

---

## 1. `POST /v1/messages`

### Request fields

| Field | Support | Notes |
|---|---|---|
| `model` | ✅ required | Namespaced ID from `/v1/models`. Unknown → `404 not_found_error` |
| `messages` | ✅ required | `role` ∈ `user`/`assistant`. A trailing `assistant` turn (prefill) → **400** — matches upstream, where prefill is removed on Opus 5 / Fable 5 / Sonnet 5 / the 4.6–4.8 family |
| `max_tokens` | ⚠️ required, **advisory** | Selects the price band and a soft budget; we post-truncate and set `stop_reason: "max_tokens"`. **We cannot hard-cap** — neither `claude -p` nor `codex exec` exposes an output limit. Absent → 400, matching upstream |
| `system` | ⚠️ best-effort | `--append-system-prompt` on Claude Code, prepended on Codex. `--system-prompt` would *replace* the harness prompt but can break the run, so we append — meaning **residual harness prompt remains**. This is the honesty problem in §6 |
| `stream` | ✅ always honored | See §2 |
| `stop_sequences` | ✅ | Enforced relay-side on the output text |
| `tools` / `tool_choice` | ❌ v1 → **400** | The backend CLI owns its own tool loop; we cannot expose a second one coherently. Roadmap |
| `thinking` | ⚠️ accepted, normalized | `{type:"adaptive"}` accepted and ignored (the CLI decides). `{type:"enabled", budget_tokens}` → **400**, matching upstream removal |
| `temperature`, `top_p`, `top_k` | ❌ **400** | Upstream rejects these on Opus 5 / Fable 5 / Opus 4.8 / 4.7, and rejects non-default values on Sonnet 5. We have no knob to honor them with either — rejecting is both compatible *and* honest |
| `metadata` | ✅ accepted, ignored | |

### Response

```json
{ "id": "msg_…", "type": "message", "role": "assistant",
  "content": [{"type": "text", "text": "…"}],
  "model": "claude-code/opus",
  "stop_reason": "end_turn", "stop_sequence": null,
  "usage": {"input_tokens": 1234, "output_tokens": 567} }
```

`stop_reason` values we emit: `end_turn`, `max_tokens`, `stop_sequence`. We never emit `tool_use`
(no tools in v1) or `pause_turn` (no server tools). **`refusal` we pass through** when the backend
declines — dropping it would misreport a decline as an empty success.

`usage` is read from the backend CLI's own reported usage, not estimated. If a backend cannot report
it, the field is present with the relay's `count_tokens` estimate and the response carries
`x-idleproxy-usage-estimated: true` — an honest header beats a confident wrong number.

---

## 2. Streaming

SSE event sequence, in order: `message_start` → `content_block_start` → `content_block_delta`
(`text_delta`) × N → `content_block_stop` → `message_delta` (carries `stop_reason` + cumulative
`usage.output_tokens`) → `message_stop`. `ping` may be interleaved. `error` terminates.

**`stream: true` is always honored. Never refused.** Refusing forces every client to special-case us
and breaks the one-URL promise, which is the whole point of the surface.

| Backend | Mapping |
|---|---|
| Claude Code (`--output-format stream-json --verbose`) | Native. Its `assistant`/`stream_event` text deltas → `content_block_delta`; its final `result` → `message_delta` (`stop_reason`, `usage`) + `message_stop`. Real token-by-token |
| Codex (`--json`) | JSONL `item.*` incremental text → `content_block_delta`; `turn.completed` (carries token usage) → `message_delta` + `message_stop` |
| Any backend that only returns a final blob | Buffer, then emit one `content_block_delta` carrying the whole text. Send `ping` every ~15 s while buffering to keep the connection and the SDK's stream timeout alive |

The buffered form is a **valid** Anthropic stream — the SDK's stream helper reassembles it correctly
and the client is not misled about content, only about arrival timing, which `GET /v1/models`
discloses via `capabilities.streaming`. Degrading silently and correctly beats an error that makes
the client write a branch for us.

On mid-generation failure: emit an SSE `error` event, and **do not settle payment**.

---

## 3. `GET /v1/models`

Reflects **what the network can actually serve right now**. A model with no healthy node with
remaining capacity is not listed — listing it produces a 503 on first call, which is worse than
absence.

```json
{ "data": [ { "type": "model",
    "id": "claude-code/opus",
    "display_name": "Claude Code (Opus 5) via IdleProxy",
    "created_at": "2026-08-…",
    "max_input_tokens": 1000000,
    "max_tokens": 64000,
    "capabilities": {
      "streaming": {"supported": true},
      "image_input": {"supported": false},
      "tool_use": {"supported": false},
      "thinking": {"supported": true, "types": {"adaptive": {"supported": true}}}
    },
    "idleproxy": {"backend": "claude-code", "nodes_available": 3, "price_usdc": "0.03"} } ],
  "has_more": false, "first_id": "…", "last_id": "…" }
```

Field names match upstream exactly: `max_input_tokens` is the context window and `max_tokens` the
output cap — **there is no `context_window` field** upstream and we don't invent one. Our additions
live under a single `idleproxy` key so a strict client can ignore them wholesale.

`GET /v1/models/{id}` returns one such object; unknown ID → `404 not_found_error`.

**Naming rule:** `<backend>/<model>` — `claude-code/opus`, `codex/gpt-5-codex`. `/` never appears in a
real Anthropic model ID, so there is no collision, and a Codex-backed node is never `claude-*`.
Namespacing is the whole reason a consumer can trust the list.

**Aliases, input-side only.** `POST /v1/messages` *accepts* a bare upstream ID (`claude-opus-5`) and
resolves it to the best available `claude-code/<family>` node, so a stock SDK with an unmodified
`model` string runs. But `/v1/models` never *lists* a bare ID, and the response always echoes the
namespaced one — so a caller who sent the alias still sees the truth in the reply. Accepting aliases
maximizes drop-in compatibility and sharpens the trademark question; listing them would make the
relay's output indistinguishable from first-party and is not done.

---

## 4. `POST /v1/messages/count_tokens`

**Returns `404 not_found_error`**, with the message *"token counting is not supported by this relay;
sizing is approximate and billed per price band."*

We cannot implement it truthfully: the real endpoint runs Anthropic's server-side tokenizer for a
specific model, we don't have that tokenizer, and the CLI exposes no count-only mode — running the
model to count would cost a real inference and still not match.

The tempting alternative is to return a heuristic estimate in `input_tokens`. **Rejected:** the wire
shape has no field to mark a number as approximate, so the caller cannot tell. That is precisely the
silent lie this document exists to prevent. A 404 is an optional pre-flight call failing, which SDK
clients degrade past gracefully.

If a pre-flight estimate is wanted later it goes at `/idleproxy/estimate_tokens` — a non-Anthropic
path, where it can never masquerade as the real endpoint.

---

## 5. Auth and errors

**Path A — prepaid key (SDK-compatible).** `x-api-key: dcl_…`, balance topped up via x402 out of
band. This is what makes an unmodified SDK work.

**Path B — x402 per call.** No key → `402` with the x402 challenge. The agentic wallet hook signs,
retries, gets the completion. Zero registration.

`anthropic-version` is accepted and required-ish: missing → warn header, not a hard 400 (upstream is
strict; we are lenient inbound because rejecting on it helps nobody).

Errors use the upstream envelope verbatim, so SDK typed exceptions (`RateLimitError`,
`NotFoundError`, …) resolve correctly:

```json
{ "type": "error",
  "error": {"type": "invalid_request_error", "message": "…"},
  "request_id": "req_…" }
```

| HTTP | `error.type` | When |
|---|---|---|
| 400 | `invalid_request_error` | Unsupported param, prefill, `stream` on a non-streaming backend |
| 401 | `authentication_error` | Bad `dcl_` key |
| 402 | — | x402 challenge (our addition; not an upstream status) |
| 404 | `not_found_error` | Unknown model |
| 413 | `request_too_large` | Over the band's input cap |
| 429 | `rate_limit_error` | Consumer throttled, or no node with capacity. `retry-after` set |
| 500 | `api_error` | Relay fault |
| 529 | `overloaded_error` | All nodes for that model busy |

---

## 6. The honesty problem — stated, not buried

A consumer calling `claude-code/opus` is **not** getting a plain Anthropic API call. The
request is executed by a provider's local coding-agent CLI, which carries its own system prompt and
tool scaffolding. Outputs will differ from the same prompt sent to `api.anthropic.com`.

Three places this is disclosed, because one is not enough:

1. **Model ID** — the `claude-code/` backend prefix carries it into every log and every response body.
2. **Response header** — `x-idleproxy-backend: claude-code` on every response.
3. **README, above the quickstart** — a paragraph, not a footnote.

Also disclosed in the same place: **the provider's machine sees the prompt in plaintext.** That is
inherent to the design, not a bug to be fixed later, and a consumer choosing this over a first-party
API is entitled to know before their first call rather than after.

---

## 7. Also exposed

- `POST /v1/chat/completions` — OpenAI-compatible, same dispatch path, for clients that speak that
  shape instead.
- MCP tool at `https://api.idleproxy.xyz/mcp` — one typed tool, for agents that prefer tool-selection
  over base-URL swapping.

Both are thin adapters over the same router. The Anthropic surface is the primary one.
