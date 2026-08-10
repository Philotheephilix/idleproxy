/**
 * Flat price bands, pay-before-generate, hard max_tokens cap. SPEC.md D5, §6.
 * Bands are set against the measured 7.7k-token Claude Code preamble floor
 * (SPEC.md §1 V2), not against a bare API call.
 */

export type BandId = "S" | "M" | "L";

export interface Band {
  id: BandId;
  maxTokens: number;
  priceMicros: bigint; // USDC atomic units (6 decimals)
  providerShareMicros: bigint; // 80%
}

const PROTOCOL_FEE_NUM = 80n; // provider keeps 80%
const PROTOCOL_FEE_DEN = 100n;

function band(id: BandId, maxTokens: number, priceMicros: bigint): Band {
  return { id, maxTokens, priceMicros, providerShareMicros: (priceMicros * PROTOCOL_FEE_NUM) / PROTOCOL_FEE_DEN };
}

export const BANDS: Band[] = [
  band("S", 256, 20_000n), // $0.02
  band("M", 1024, 50_000n), // $0.05
  band("L", 4096, 150_000n), // $0.15
];

export class PricingError extends Error {
  constructor(message: string, public readonly httpStatus: number) {
    super(message);
  }
}

/**
 * Resolves the band for a model + max_tokens. Opus is priced one band up
 * from the same max_tokens ceiling; requests above the largest band's
 * ceiling are rejected outright because an unbounded request cannot be
 * priced before generation.
 */
export function bandFor(model: string, maxTokens: number): Band {
  if (maxTokens > BANDS[BANDS.length - 1].maxTokens) {
    throw new PricingError(
      `max_tokens ${maxTokens} exceeds the largest band ceiling of ${BANDS[BANDS.length - 1].maxTokens}`,
      400,
    );
  }

  const baseIndex = BANDS.findIndex((b) => maxTokens <= b.maxTokens);
  if (baseIndex === -1) {
    throw new PricingError(`no band covers max_tokens ${maxTokens}`, 400);
  }

  const isOpus = /opus/i.test(model);
  const index = isOpus ? Math.min(baseIndex + 1, BANDS.length - 1) : baseIndex;
  return BANDS[index];
}
