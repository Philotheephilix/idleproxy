import Database from "better-sqlite3";

/**
 * One SQLite file, WAL mode, no migration toolchain — SPEC.md D10. Ten
 * tables, all created here in one pass. Money amounts are stored as integer
 * atomic units (6-decimal USDC atomic units, or micro-USD for notional
 * pricing) to avoid float drift; timestamps are epoch milliseconds.
 */
export function openDb(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS providers (
  id            TEXT PRIMARY KEY,
  wallet        TEXT NOT NULL,
  pubkey        TEXT,
  disclosure_accepted_at INTEGER,
  tier1_accepted_at       INTEGER,
  kill_switch   INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
  id            TEXT PRIMARY KEY,
  provider_id   TEXT NOT NULL REFERENCES providers(id),
  adapter       TEXT NOT NULL,               -- 'claude-code' | 'claude-code-tools'
  pubkey        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'offline', -- 'online' | 'offline'
  daily_usd_cap_micros    INTEGER NOT NULL,
  daily_request_cap       INTEGER NOT NULL,
  max_concurrency         INTEGER NOT NULL DEFAULT 1,
  reserve_fraction        REAL NOT NULL DEFAULT 0.2,
  last_heartbeat_at       INTEGER,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS node_capacity (
  node_id       TEXT PRIMARY KEY REFERENCES nodes(id),
  model         TEXT NOT NULL,
  available     INTEGER NOT NULL DEFAULT 1,
  headroom      REAL NOT NULL DEFAULT 1.0,
  reason        TEXT,
  reset_at      INTEGER,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS consumer_keys (
  key_hash      TEXT PRIMARY KEY,             -- sha256(ipx_sk_...)
  balance_micros INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments_in (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL,                -- 'x402' | 'prepaid_topup'
  amount_micros INTEGER NOT NULL,
  payer         TEXT,
  nonce         TEXT,
  settlement_tx TEXT,
  settlement_status TEXT NOT NULL DEFAULT 'pending', -- pending|settled|failed
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eip3009_nonces (
  nonce         TEXT PRIMARY KEY,
  used_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,
  node_id       TEXT REFERENCES nodes(id),
  payment_id    TEXT REFERENCES payments_in(id),
  model         TEXT NOT NULL,
  band          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|running|completed|failed
  cost_usd_micros INTEGER,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  attestation   TEXT,
  error         TEXT,
  created_at    INTEGER NOT NULL,
  completed_at  INTEGER
);

CREATE TABLE IF NOT EXISTS provider_balances (
  provider_id   TEXT PRIMARY KEY REFERENCES providers(id),
  accrued_micros INTEGER NOT NULL DEFAULT 0,
  paid_out_micros INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payouts (
  id                TEXT PRIMARY KEY,
  provider_id       TEXT NOT NULL REFERENCES providers(id),
  period            TEXT NOT NULL,
  amount_micros     INTEGER NOT NULL,
  idempotency_key   TEXT NOT NULL,
  execution_id      TEXT,
  transaction_link  TEXT,
  sponsored         INTEGER,
  verified          INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending|broadcast|verified|failed
  created_at        INTEGER NOT NULL,
  UNIQUE(idempotency_key)
);

CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kind          TEXT NOT NULL,
  payload       TEXT NOT NULL,                -- JSON
  created_at    INTEGER NOT NULL
);
`;
