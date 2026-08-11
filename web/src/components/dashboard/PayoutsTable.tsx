export function PayoutsTable({ payouts }: { payouts: Array<{ id: string; amount_micros: number; status: string; transaction_link: string | null }> }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-gray-500"><tr><th className="text-left">Amount (µUSD)</th><th className="text-left">Status</th><th className="text-left">Tx</th></tr></thead>
      <tbody>
        {payouts.map((p) => (
          <tr key={p.id} className="border-t border-gray-800">
            <td>{p.amount_micros}</td>
            <td>{p.status}</td>
            <td>{p.transaction_link ? <a className="text-teal-300 underline" href={p.transaction_link} target="_blank" rel="noopener">view</a> : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
