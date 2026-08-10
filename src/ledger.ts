import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import type { Band } from "./pricing.js";

/**
 * Provider balances, fee split, and deterministic payout keying.
 * SPEC.md §6: 80% to the provider on delivery, batched payout at threshold.
 */

export function creditProvider(db: Database.Database, providerId: string, band: Band): void {
  const now = Date.now();
  db.prepare(
    `INSERT INTO provider_balances (provider_id, accrued_micros, paid_out_micros, updated_at)
     VALUES (?, ?, 0, ?)
     ON CONFLICT(provider_id) DO UPDATE SET
       accrued_micros = accrued_micros + excluded.accrued_micros,
       updated_at = excluded.updated_at`,
  ).run(providerId, band.providerShareMicros.toString(), now);
}

export interface PendingPayout {
  providerId: string;
  wallet: string;
  accruedMicros: bigint;
}

/** Providers whose accrued balance meets the payout threshold. */
export function pendingPayouts(db: Database.Database, thresholdMicros: bigint): PendingPayout[] {
  const rows = db
    .prepare(
      `SELECT pb.provider_id AS providerId, p.wallet AS wallet, pb.accrued_micros AS accruedMicros
       FROM provider_balances pb
       JOIN providers p ON p.id = pb.provider_id
       WHERE pb.accrued_micros >= ?`,
    )
    .all(thresholdMicros.toString()) as Array<{ providerId: string; wallet: string; accruedMicros: string }>;

  return rows.map((r) => ({ providerId: r.providerId, wallet: r.wallet, accruedMicros: BigInt(r.accruedMicros) }));
}

/**
 * Deterministic idempotency key for a payout: sha256 of the tuple named in
 * SPEC.md §6, so a retried payout for the same provider+period always hits
 * the same KeeperHub idempotency record instead of double-paying.
 */
export function payoutIdempotencyKey(opts: {
  providerId: string;
  period: string;
  chainId: number;
  address: string;
  amountMicros: bigint;
  token: string;
}): string {
  const canonical = [
    "payout",
    opts.providerId,
    opts.period,
    String(opts.chainId),
    opts.address.toLowerCase(),
    opts.amountMicros.toString(),
    opts.token.toLowerCase(),
  ].join("|");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/** Existing payout status for an idempotency key, or null if never recorded. Callers use this to
 * skip re-triggering work that already landed — the KeeperHub workflow trigger has no idempotency
 * key of its own, so this local check is what stops a retried "same period, same amount" payout
 * from double-paying a provider. */
export function existingPayoutStatus(db: Database.Database, idempotencyKey: string): string | null {
  const row = db.prepare(`SELECT status FROM payouts WHERE idempotency_key = ?`).get(idempotencyKey) as
    | { status: string }
    | undefined;
  return row?.status ?? null;
}

/** Returns false (no-op) if this idempotency key was already recorded — a retry of the same
 * provider+period+amount, not a new payout. */
export function recordPayoutBroadcast(
  db: Database.Database,
  row: {
    id: string;
    providerId: string;
    period: string;
    amountMicros: bigint;
    idempotencyKey: string;
    executionId: string;
  },
): boolean {
  const result = db
    .prepare(
      `INSERT INTO payouts (id, provider_id, period, amount_micros, idempotency_key, execution_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'broadcast', ?)
       ON CONFLICT(idempotency_key) DO NOTHING`,
    )
    .run(row.id, row.providerId, row.period, row.amountMicros.toString(), row.idempotencyKey, row.executionId, Date.now());
  return result.changes > 0;
}

export function finalizePayout(
  db: Database.Database,
  idempotencyKey: string,
  result: { transactionLink?: string; sponsored?: boolean; verified: boolean },
): void {
  db.prepare(
    `UPDATE payouts SET
       transaction_link = ?,
       sponsored = ?,
       verified = ?,
       status = ?
     WHERE idempotency_key = ?`,
  ).run(
    result.transactionLink ?? null,
    result.sponsored ? 1 : 0,
    result.verified ? 1 : 0,
    result.verified ? "verified" : "failed",
    idempotencyKey,
  );

  if (result.verified) {
    const payout = db.prepare(`SELECT provider_id AS providerId, amount_micros AS amountMicros FROM payouts WHERE idempotency_key = ?`).get(idempotencyKey) as
      | { providerId: string; amountMicros: string }
      | undefined;
    if (payout) {
      db.prepare(
        `UPDATE provider_balances SET
           accrued_micros = accrued_micros - ?,
           paid_out_micros = paid_out_micros + ?,
           updated_at = ?
         WHERE provider_id = ?`,
      ).run(payout.amountMicros, payout.amountMicros, Date.now(), payout.providerId);
    }
  }
}
