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

Payout-side of M1 (an agent executing a payout via `execute_transfer`) is the next real test, once
`treasurer.ts` exists.

