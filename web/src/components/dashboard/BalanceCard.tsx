export function BalanceCard({ balance }: { balance: { accrued_micros: string; paid_out_micros: string } | null }) {
  if (!balance) return <p className="text-sm text-gray-500">No balance yet.</p>;
  return (
    <p className="text-sm text-gray-300">
      Accrued: {balance.accrued_micros} µUSD · Paid out: {balance.paid_out_micros} µUSD
    </p>
  );
}
