"use client";

import SpotlightCard from "./reactbits/SpotlightCard/SpotlightCard";

const SURFACES = [
  {
    kicker: "POST /api/execute/contract-call",
    title: "x402 settlement",
    body: "The router verifies the payment authorisation locally, then hands the transfer to KeeperHub to broadcast. No transaction touches the chain outside it.",
    tone: "pay",
  },
  {
    kicker: "Webhook workflow",
    title: "Payout workflow",
    body: "Trigger → Check Treasury Balance → Solvency Gate → Pay Provider. The solvency check and the transfer both live in KeeperHub, not in application code.",
    tone: "pay",
  },
  {
    kicker: "Block trigger",
    title: "Solvency watchdog",
    body: "Check Treasury Balance → Read USDC Decimals → Condition, on every block. Treasury monitoring runs independently of the router being up.",
    tone: "cap",
  },
  {
    kicker: "MCP · kh_ header auth",
    title: "Treasurer agent",
    body: "execute_workflow and get_execution over MCP. A real Claude Code agent runs the payouts and reads back the executions — not a cron job.",
    tone: "cap",
  },
] as const;

export function FeatureCards() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {SURFACES.map((s) => (
        <SpotlightCard
          key={s.title}
          className="rounded-2xl! border-line! bg-panel! p-7! transition-colors hover:border-line-2!"
          spotlightColor={s.tone === "cap" ? "rgba(53, 224, 161, 0.12)" : "rgba(245, 178, 92, 0.12)"}
        >
          <span
            className="font-mono text-[10.5px] tracking-widest uppercase"
            style={{ color: s.tone === "cap" ? "var(--color-cap)" : "var(--color-pay)" }}
          >
            {s.kicker}
          </span>
          <h3 className="mt-3.5 font-display text-[19px] font-semibold tracking-tight text-fg">{s.title}</h3>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{s.body}</p>
        </SpotlightCard>
      ))}
    </div>
  );
}
