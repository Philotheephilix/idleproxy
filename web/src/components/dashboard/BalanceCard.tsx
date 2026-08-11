import { formatMicrosUsd } from "@/lib/format";

export function BalanceCard({ balance }: { balance: { accrued_micros: string; paid_out_micros: string } | null }) {
  const accrued = balance?.accrued_micros ?? "0";
  const paidOut = balance?.paid_out_micros ?? "0";

  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
      <Figure label="Accrued" micros={accrued} tone="cap" empty={!balance} />
      <Figure label="Paid out" micros={paidOut} tone="pay" empty={!balance} />
    </div>
  );
}

function Figure({ label, micros, tone, empty }: { label: string; micros: string; tone: "cap" | "pay"; empty: boolean }) {
  return (
    <div className="bg-panel p-6">
      <p className="eyebrow">{label}</p>
      <p
        className="mt-3 font-display text-[30px] font-semibold tracking-tight tabular-nums"
        style={{ color: empty ? "var(--color-dim)" : `var(--color-${tone})` }}
      >
        {formatMicrosUsd(micros)}
      </p>
      <p className="mt-1 font-mono text-[11.5px] text-dim">{micros} µUSD</p>
    </div>
  );
}
