export function JobsTable({ jobs }: { jobs: Array<{ id: string; model: string; band: string; status: string; cost_usd_micros: number | null }> }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-gray-500"><tr><th className="text-left">Model</th><th className="text-left">Band</th><th className="text-left">Status</th><th className="text-left">Cost (µUSD)</th></tr></thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id} className="border-t border-gray-800"><td>{j.model}</td><td>{j.band}</td><td>{j.status}</td><td>{j.cost_usd_micros ?? ""}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
