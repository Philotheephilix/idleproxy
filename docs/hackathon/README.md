<!-- source: https://dorahacks.io/hackathon/agents-onchain/detail (scraped 2026-08-09) -->

# KeeperHub — Agents Onchain Hackathon (DoraHacks)

**Page:** https://dorahacks.io/hackathon/agents-onchain/detail
**Host:** KeeperHub · **Platform:** DoraHacks · **Format:** Virtual
**Prize pool:** 5,000 USD (paid in stablecoins)
**Hackers registered at scrape time:** 434 · **Bounties:** 1

**Tags:** Blockchain, Web3, DeFi, AI Agents, Onchain, MCP, Autonomous Agents, Infrastructure
**Web3 ecosystem:** KeeperHub, MCP, x402, MPP, Ethereum

---

## The premise — "The Last Mile"

Most agent hackathons reward reasoning: an agent that decides something clever. The harder
problem is what happens next. Agents can detect and decide, but they all hit the same wall when
they need to move value onchain: failed transactions, gas spikes, MEV, no observability, no
guarantees.

KeeperHub is the execution and reliability layer that fills that gap — the last mile between what
your agent decides and a transaction that acts onchain.

> "We reward agents that execute onchain. A working transaction that executes through KeeperHub
> beats a polished demo that never touches a chain."

## What to build

**Hard requirement: every project must use KeeperHub as its onchain execution layer.** That is the
only requirement. Any agent framework is allowed — ElizaOS, OpenClaw, Hermes, CrewAI, LangChain,
AutoGPT, or your own. KeeperHub handles the actual execution.

## The KeeperHub stack (as pitched by the host)

| Surface | What it gives you | Docs |
|---|---|---|
| MCP server / CLI | How your agent discovers and calls KeeperHub execution capabilities natively | https://docs.keeperhub.com/ai-tools/mcp-server |
| x402 / MPP | Pay-per-execution over HTTP, settled onchain, indexed on x402scan.com. Autonomous payments via Tempo and Stripe. Dual-protocol routing auto-selects x402 vs MPP | https://docs.keeperhub.com/ai-tools/agentic-wallet |
| Smart Gas Estimation | Gas pricing that adapts to congestion with exponential backoff, so transactions execute instead of getting stuck | — |
| Private routing | MEV protection via non-public submission paths | — |
| Audit trail | Every action logged: trigger, simulation result, submitted transaction, gas used, outcome, timestamp | — |
| Gas sponsorship | KeeperHub sponsors gas on Ethereum mainnet | — |

KeeperHub is open source, so the execution path is inspectable.

## Timeline (all times UTC+2)

| When | What |
|---|---|
| 2026-07-02 10:00 | Pre-registration opens (DoraHacks listing) |
| 2026-07-27 12:00 | Hackathon opens / build phase starts |
| 2026-07-27 → 2026-08-13 | Build phase (~2.5 weeks) with office hours |
| **2026-08-13 12:00** | **Submission deadline** — registrations and BUIDL submissions close |
| 2026-08-13 → 2026-08-20 | Judging |
| 2026-08-17 → 2026-08-19 | Finalist pitches — 10 shortlisted teams present live to the panel |
| 2026-08-20 | Winners announced |

DoraHacks listing also shows the submission window opening `2026/07/27 05:01` and deadline
`2026/08/13 10:00` in the platform's own timezone rendering.

## Prizes — $5,000 cash

**Grand Prize.** One overall ranking judged across every submission. The top three can come from
anywhere, including the same topic area. What matters is that the agent executes real transactions
onchain through KeeperHub.

| Place | Amount |
|---|---|
| 1st | $2,000 |
| 2nd | $1,200 |
| 3rd | $800 |

**Bounties — $1,000 total, split between two winners.**
Category: **Best Onboarding UX Improvement.** Rewards whatever most improves the new-builder
experience — getting someone from zero to their first executed transaction faster. Accepted forms:
a merged PR to the KeeperHub repo, a starter template, a tutorial, or a clear teardown of where you
got stuck with proposed fixes.

Bounties are awarded separately and are **stackable** with the Grand Prize — a project can place
top three and still win a bounty.

Cash prizes distributed via stablecoins.

## Eligibility

- Open worldwide, solo or teams, **18+**.
- Must ship a working agent that executes through KeeperHub.
- Participants from regions under applicable sanctions (including OFAC-restricted jurisdictions)
  are not eligible, per DoraHacks platform terms.
- Every submission must use KeeperHub as its onchain execution layer. How the agent reasons and
  decides is entirely up to you.

## Judging criteria

Execution is weighted heavily, because that is the point.

1. **Does it execute onchain via KeeperHub?** Working transactions, not mockups. Every team links a
   transaction their agent has executed.
2. **Use of KeeperHub surfaces** — MCP server, CLI, x402, MPP, workflow builder, audit trail.
3. **Reliability and observability** — does the build show it understands failure modes? Retries,
   gas handling, audit-trail usage all count.
4. **Originality and real-world usefulness** — would anyone actually run this?
5. **Integration quality and developer experience** — how cleanly is it built?

## How judging runs

Two stages. First the KeeperHub team reviews every submission against the criteria to select a
shortlist of **10 finalists**. Finalists are invited to present live to the judging panel in a short
pitch session during the judging window. Final rankings come from those live pitches alongside the
scored review. Shortlisted teams are contacted with format and slot.

## Submission requirements

Submit the BUIDL on the DoraHacks page before the deadline. Each submission requires:

- [ ] A link to source code on **GitHub** (GitHub/GitLab/Bitbucket link required by the platform)
- [ ] A short **demo video** showing the agent executing onchain through KeeperHub
- [ ] A link to a **transaction the agent executed via KeeperHub**

Incomplete submissions cannot be judged.

## Support

- Link tree: https://keeperhub.com/links
- Discord (`general` / `help` channels, KeeperHub engineers hold office hours): https://discord.gg/keeperhub
- Docs: https://docs.keeperhub.com/

## About KeeperHub

KeeperHub is the execution and reliability layer for AI agents operating onchain. It does not
replace or compete with agent frameworks — it is the infrastructure they plug into when they need
to actually transact onchain with guarantees.

---

Raw scrape of the DoraHacks page: [`dorahacks-detail.raw.txt`](./dorahacks-detail.raw.txt) ·
outbound links: [`dorahacks-links.txt`](./dorahacks-links.txt)
