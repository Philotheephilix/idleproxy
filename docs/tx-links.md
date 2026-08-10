# Transaction links

Evidence for the settlement primitive (SPEC.md D1, §9 R1) and the sponsored-transfer rehearsal.
Chain: Base Sepolia 84532. All broadcast by KeeperHub, org wallet `0x30b748f458ab37957d0b6a291e6d64dff10f94a3`.

| Date (UTC) | What | Tx | Notes |
|---|---|---|---|
| 2026-08-10 | Free rehearsal: sponsored zero-value self-transfer, `POST /api/execute/transfer` | [`0xe323160a...a3d1100f`](https://sepolia.basescan.org/tx/0xe323160a23b6c28c9154a978a6da82f1e525f4add86316314fe6bc20a3d1100f) | `sponsored: true`, `verified: true`. Proved auth + safe-write sequence at zero cost |
| 2026-08-10 | **THE SPIKE** — real EIP-3009 `TransferWithAuthorization` (1 atomic unit, $0.000001 USDC), consumer EOA `0x26523a...49c6e9` → org wallet, settled via `POST /api/execute/contract-call` | [`0x23ace185...29f4ffd507e`](https://sepolia.basescan.org/tx/0x23ace185a4501ba789113395d1c8fab74909a93cf15cc6c0fd83029f4ffd507e) | `sponsored: true`, `verified: true`, `reverted: false`. Domain resolved live: `name="USDC", version="2"`. Function signature `transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)` — the `(v,r,s)` overload, no ambiguity hit. **R1 retired: SPEC D1's design holds.** |

**R1 verdict: primary path confirmed working, no fallback needed.** The Block-trigger fallback in
SPEC §9 R1 is dead weight — not built.

## M1 — full money spine, live

| Date (UTC) | What | Tx | Notes |
|---|---|---|---|
| 2026-08-10 | **First real paid inference call.** `POST /v1/messages` (band S, $0.02) → 402 → consumer signs EIP-3009 → router verifies + dedupes nonce → dispatches to Tier-0 Claude Code → settles via KeeperHub `contract-call` → responds | [`0xf38d212d...ae6a38fe5d9f2564`](https://sepolia.basescan.org/tx/0xf38d212d393ca3d05c35a1c90ce7b8b0b66430b6728d3890ae6a38fe5d9f2564) | End to end in 7.68s. On-chain `Transfer` event confirms exactly 20000 atomic units (`$0.02`) moved consumer → org wallet, `status: 0x1`. Provider (house) credited $0.016 (80%). Job, payment, and nonce rows all recorded correctly in sqlite. **M1 exit gate met on the money-in half.** |

| 2026-08-10 | **First agent-executed payout** (v1, raw `execute_transfer`). `idleproxy treasurer` spawns Claude Code with the KeeperHub MCP server attached; the agent itself calls `execute_transfer` (simulate → broadcast → poll) to pay the house provider its accrued $0.016 | [`0x5abbf02f...c65b74313f58`](https://sepolia.basescan.org/tx/0x5abbf02ff9b55a54d15abe7216416d52d4756e3b3c23a349e454c65b74313f58) | `sponsored: true`. Consumer/provider test wallet balance moved by exactly 16000 atomic units (`$0.016`), confirmed independently via `balanceOf` before/after and the tx receipt (`status: 0x1`). **M1 exit gate fully met — both halves, real funds, real chain.** Superseded by the workflow-native path below |

## Bounty: `idleproxy facilitator-demo`

| Date (UTC) | What | Tx | Notes |
|---|---|---|---|
| 2026-08-10 | `npx idleproxy facilitator-demo` — throwaway wallet (freshly generated, never funded), zero-value EIP-3009 authorization settled through KeeperHub | [`0x534724b2...780e18e43217594`](https://sepolia.basescan.org/tx/0x534724b246bf9fd4fffd330fde5ef5df7cd3ad7b2c86a0d3a780e18e43217594) | Worked on the first run, zero funding, zero setup beyond an API key. `sponsored: true`, receipt `status: 0x1`. Tutorial: `docs/bounty/x402-facilitator.md` |

## Solvency Watchdog — a second, independent KeeperHub workflow

Block trigger (900-block cadence, 84532) → `Check Treasury Balance` (`web3/check-token-balance`) →
`Read USDC Decimals` (`web3/read-contract`, generic ABI call) → `Below Safety Floor` (Condition,
balance < $1). Workflow id: `bl4hcmn2vy3dvpmkx7ydc`.

Manually executed for real (execution `jbmk6iudycd6ew6zfsxvu`) — every node logged real on-chain
data, not placeholders:

| Node | Output |
|---|---|
| Check Treasury Balance | `balance: "0.207001"`, `symbol: "USDC"` |
| Read USDC Decimals | `result: "6"` |
| Below Safety Floor | `condition: true` (correctly — the treasury really is under $1 after this session's test payouts) |

**A real platform constraint, found by testing rather than assumed:** the original design had this
workflow push a Discord/webhook alert on drift. Tested directly — `webhook/send-webhook`, the system
`HTTP Request` action, and `code/run-code` **all three** return
`{"error":"This workflow uses features that require a paid plan.","code":"upgrade_required","requiredPlan":"pro"}`
on this org's tier. Every outbound-HTTP-capable action in KeeperHub is paid-plan gated — there is no
free-tier way for a workflow to call out. Adapted rather than faked: `GET /api/audit` now pulls this
workflow's execution history directly via `GET /workflows/{id}/executions` and surfaces
`solvencyWatchdog` in the dashboard — KeeperHub's own Executions API becomes the alert surface. The
same constraint is why the "Schedule trigger → HTTP POST to `/internal/settlement/run`" design was
dropped: a KeeperHub Schedule workflow cannot reach an external endpoint at all on this tier. The
endpoint itself still exists and is still HMAC/token-authed; it's driven by `idleproxy treasurer` (or
an external cron) instead.

A real ngrok tunnel (`https://6cb8-161-118-166-4.ngrok-free.app`) was stood up specifically to test
whether a KeeperHub-side outbound call could reach the local router at all — confirmed reachable
(`curl` through the tunnel hit `/v1/models` and got a real 200) before the paid-plan gate was found
on the KeeperHub side. The reachability wasn't the blocker; the account tier was.

## Payout, upgraded to a KeeperHub workflow

Money movement moved out of application code and into a KeeperHub workflow — `Payout Request`
(Webhook trigger) → `Check Treasury Balance` (`web3/check-token-balance`) → `Solvency Gate`
(Condition, true branch only) → `Pay Provider` (`web3/transfer-token`). The solvency check and the
transfer are now native KeeperHub steps, not a REST call our code makes; `treasurer.ts` drives the
agent to call `execute_workflow` + `get_execution` over MCP instead of `execute_transfer` directly.
Workflow id: `9ujfl46sgqte26n2mho7k`.

| Date (UTC) | What | Tx | Notes |
|---|---|---|---|
| 2026-08-10 | Manual-execute smoke test of the payout workflow (0.001 USDC, bypassing the agent to validate the workflow itself) | [`0x2f7de5fd...6e9cbc3c02c1f6`](https://sepolia.basescan.org/tx/0x2f7de5fd5f57acff1fcb5883257d3ba245b8f3e8042a519fa76e9cbc3c02c1f6) | `sponsored: true`, `receiptStatus: success`. Confirms the Condition's balance comparison and the transfer step both resolve correctly from webhook-shaped input |
| 2026-08-10 | **Agent-driven payout through the workflow.** `idleproxy treasurer` → Claude Code + KeeperHub MCP → `execute_workflow("9ujfl46sgqte26n2mho7k", {body:{to,amount,providerId}})` → `get_execution` polled to terminal | [`0x5ff4369d...11c3535290b96752`](https://sepolia.basescan.org/tx/0x5ff4369d01cde56e7481132554a3e04efa2d54f56952db6811c3535290b96752) | Agent's own report: "Solvency gate pass (balance 0.023001 >= 0.016000), transfer verified on-chain, sponsored gas." **This is the payout path going forward** — replaces the v1 raw `execute_transfer` call above |

## Prepaid keys (D9) and Tier 1 (container), first real runs

| Date (UTC) | What | Tx | Notes |
|---|---|---|---|
| 2026-08-10 | `POST /api/keys`: real x402 top-up (60000 micros) mints an `ipx_sk_` key; the key then pays for a `/v1/messages` call with **no 402** | [`0x00a98eca...61fd7290b33`](https://sepolia.basescan.org/tx/0x00a98ecaed769d53955938f95589bd6d4b243627326f31fb7d26661fd7290b33) | Balance correctly debited 60000 → 40000 after one band-S call. Confirms D9: "change one env var and your SDK works" is real on the prepaid path |

Tier 1 (containerized, tool-enabled) verified live, no chain transaction involved — this is the
isolation proof, not a settlement:

- A real job ran `PONG` through the container end to end (`docker run` → bwrap-sandboxed Claude Code
  → `--allowed-tools Bash,Read,Edit,Write,Glob,Grep`).
- **Egress-lock proof:** a job instructed to run `fetch('https://example.com')` from inside the
  container via the Bash tool got `BLOCKED: fetch failed` — the `ipx-jobnet` internal Docker network
  genuinely has no route to the internet except through the `ipx-egress` squid proxy, which itself
  only allows `CONNECT api.anthropic.com:443`.

Six real bugs surfaced getting Tier 1 working, documented in SPEC.md §5 rather than repeated here:
missing `bubblewrap`/`socat` in the job image, `/tmp` needing its own tmpfs, every tmpfs needing
explicit `uid=10001,gid=10001` ownership, `.claude` specifically needing its **own** tmpfs (not left
to auto-create root-owned under `/home/job`), `--permission-mode bypassPermissions` silently forced
off under the CLI's own hardening (fixed with an explicit `--allowed-tools` list instead), and
`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` needing to be **off** — it nests a bubblewrap namespace Docker's
default seccomp refuses, and protects against a threat that doesn't apply here.

A real bug surfaced and was fixed during this test: `payoutIdempotencyKey`'s `period` was a
date-only string, but SPEC.md §6 runs the treasurer on a $-threshold as well as daily, so two
threshold-triggered batches on the same calendar day for the same amount collided on the same key —
the second run crashed on the local `payouts.idempotency_key` UNIQUE constraint instead of being
handled as an answer. Fixed by using a full timestamp per invocation (`cli.ts`) and by making
`ledger.recordPayoutBroadcast` an `ON CONFLICT DO NOTHING` upsert with a new
`ledger.existingPayoutStatus` check that skips already-verified or in-flight payouts instead of
re-triggering the workflow — the workflow's own trigger carries no idempotency key, so this local
check is what stops a retry from double-paying for real.

