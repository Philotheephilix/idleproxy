import { formatMicrosUsd } from "@/lib/format";

const STATUS_TONE: Record<string, string> = {
  settled: "text-cap",
  completed: "text-cap",
  failed: "text-danger",
  refunded: "text-pay",
};

export function JobsTable({ jobs }: { jobs: Array<{ id: string; model: string; band: string; status: string; cost_usd_micros: number | null }> }) {
  if (jobs.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line bg-panel/50 p-6 text-[14px] text-muted">No jobs yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
      <table className="w-full min-w-[520px] text-left font-mono text-[13px]">
        <thead>
          <tr className="border-b border-line text-[10.5px] tracking-widest text-dim uppercase">
            <th className="px-5 py-3 font-normal">Model</th>
            <th className="px-5 py-3 font-normal">Band</th>
            <th className="px-5 py-3 font-normal">Status</th>
            <th className="px-5 py-3 text-right font-normal">Cost</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-b border-line/60 last:border-0">
              <td className="px-5 py-3 text-fg">{j.model}</td>
              <td className="px-5 py-3 text-muted">{j.band}</td>
              <td className={`px-5 py-3 ${STATUS_TONE[j.status] ?? "text-muted"}`}>{j.status}</td>
              <td className="px-5 py-3 text-right tabular-nums text-muted">
                {j.cost_usd_micros === null ? "—" : formatMicrosUsd(j.cost_usd_micros)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
