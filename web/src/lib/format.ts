/** USDC has 6 decimals, so the router's µUSD integers are USDC atomic units. */
export function formatMicrosUsd(micros: string | number | null | undefined): string {
  if (micros === null || micros === undefined) return "$0.0000";
  const n = Number(micros);
  if (!Number.isFinite(n)) return "$0.0000";
  return `$${(n / 1_000_000).toFixed(4)}`;
}
