import { formatMicrosUsd } from "@/lib/format";

const STATUS_TONE: Record<string, string> = {
  paid: "text-cap",
  pending: "text-pay",
  failed: "text-danger",
};

export function PayoutsTable({ payouts }: { payouts: Array<{ id: string; amount_micros: number; status: string; transaction_link: string | null }> }) {
  if (payouts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-panel/50 p-6 text-[14px] text-muted">
        No payouts yet. The KeeperHub payout workflow settles accrued balance out to your wallet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
      <table className="w-full min-w-[440px] text-left font-mono text-[13px]">
        <thead>
          <tr className="border-b border-line text-[10.5px] tracking-widest text-dim uppercase">
            <th className="px-5 py-3 font-normal">Amount</th>
            <th className="px-5 py-3 font-normal">Status</th>
            <th className="px-5 py-3 text-right font-normal">Transaction</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id} className="border-b border-line/60 last:border-0">
              <td className="px-5 py-3 tabular-nums text-fg">{formatMicrosUsd(p.amount_micros)}</td>
              <td className={`px-5 py-3 ${STATUS_TONE[p.status] ?? "text-muted"}`}>{p.status}</td>
              <td className="px-5 py-3 text-right">
                {p.transaction_link ? (
                  <a
                    className="text-cap underline decoration-cap/40 underline-offset-4 transition-colors hover:decoration-cap"
                    href={p.transaction_link}
                    target="_blank"
                    rel="noopener"
                  >
                    view
                  </a>
                ) : (
                  <span className="text-dim">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
