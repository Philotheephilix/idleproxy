/** USDC has 6 decimals, so the router's µUSD integers are USDC atomic units. */
export function formatMicrosUsd(micros: string | number | null | undefined): string {
  if (micros === null || micros === undefined) return "$0.0000";
  const n = Number(micros);
  if (!Number.isFinite(n)) return "$0.0000";
  return `$${(n / 1_000_000).toFixed(4)}`;
}

/** Same units, trimmed for prose — "$0.02" where the band prices are round,
 *  falling back to four places for sub-cent amounts that would read as $0.00. */
export function formatMicrosUsdShort(micros: string | number): string {
  const n = Number(micros);
  if (!Number.isFinite(n)) return "$0.00";
  const usd = n / 1_000_000;
  return `$${usd.toFixed(usd > 0 && usd < 0.01 ? 4 : 2)}`;
}
