import { verifyTypedData, getAddress, type Address, type Hex } from "viem";
import type { Eip712Domain } from "./config.js";

/**
 * x402 challenge + EIP-3009 TransferWithAuthorization verification.
 * SPEC.md §6: verify locally, dedupe the nonce before dispatch, settle
 * through KeeperHub only after both pass.
 */

export interface X402Challenge {
  scheme: "exact";
  network: "base-sepolia";
  asset: Address;
  maxAmountRequired: string; // atomic units, decimal string
  payTo: Address;
  nonce: Hex;
  validBefore: number; // unix seconds
}

export function buildChallenge(opts: {
  asset: Address;
  payTo: Address;
  amountMicros: bigint; // USDC atomic units (6 decimals)
  ttlSeconds?: number;
}): X402Challenge {
  const nonce = randomNonce();
  const validBefore = Math.floor(Date.now() / 1000) + (opts.ttlSeconds ?? 300);
  return {
    scheme: "exact",
    network: "base-sepolia",
    asset: opts.asset,
    maxAmountRequired: opts.amountMicros.toString(),
    payTo: opts.payTo,
    nonce,
    validBefore,
  };
}

function randomNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ("0x" + Buffer.from(bytes).toString("hex")) as Hex;
}

export interface TransferAuthorization {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
}

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export interface VerifiedPayment {
  ok: boolean;
  reason?: string;
  auth?: TransferAuthorization;
}

/**
 * Verifies the EIP-3009 signature against the on-chain-resolved domain and
 * checks recipient/amount/window. Does NOT check nonce reuse — that is a
 * stateful concern the caller (server.ts, backed by db.ts) owns so this
 * function stays a pure check.
 */
export async function verifyPayment(
  auth: TransferAuthorization,
  signature: Hex,
  domain: Eip712Domain,
  expected: { payTo: Address; minValue: bigint },
): Promise<VerifiedPayment> {
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (getAddress(auth.to) !== getAddress(expected.payTo)) {
    return { ok: false, reason: "recipient mismatch" };
  }
  if (auth.value < expected.minValue) {
    return { ok: false, reason: "insufficient value" };
  }
  if (now < auth.validAfter || now > auth.validBefore) {
    return { ok: false, reason: "authorization outside valid window" };
  }

  const valid = await verifyTypedData({
    address: auth.from,
    domain: {
      name: domain.name,
      version: domain.version,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message: auth,
    signature,
  });

  if (!valid) return { ok: false, reason: "signature invalid" };
  return { ok: true, auth };
}

/** Splits a `v,r,s` sig from a 65-byte hex signature, as required by the FiatToken v2.2 (v,r,s) overload. */
export function splitSignature(signature: Hex): { v: number; r: Hex; s: Hex } {
  const sig = signature.slice(2);
  const r = ("0x" + sig.slice(0, 64)) as Hex;
  const s = ("0x" + sig.slice(64, 128)) as Hex;
  let v = parseInt(sig.slice(128, 130), 16);
  if (v < 27) v += 27;
  return { v, r, s };
}

/** The (v,r,s) overload only — SPEC.md §9 R1: FiatToken v2.2 exposes two overloads and passing an
 * ABI with only this one avoids the undocumented functionName disambiguation. */
const TRANSFER_WITH_AUTHORIZATION_ABI = JSON.stringify([
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "validAfter", type: "uint256" },
      { internalType: "uint256", name: "validBefore", type: "uint256" },
      { internalType: "bytes32", name: "nonce", type: "bytes32" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "transferWithAuthorization",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]);

export interface ContractCallPayload {
  contractAddress: string;
  chainId: number;
  functionName: "transferWithAuthorization";
  functionArgs: string;
  abi: string;
}

/** Builds the KeeperHub contract-call body for settling a verified authorization. */
export function buildSettlementCall(
  auth: TransferAuthorization,
  signature: Hex,
  usdcAddress: Address,
  chainId: number,
): ContractCallPayload {
  const { v, r, s } = splitSignature(signature);
  const functionArgs = JSON.stringify([
    auth.from,
    auth.to,
    auth.value.toString(),
    auth.validAfter.toString(),
    auth.validBefore.toString(),
    auth.nonce,
    v,
    r,
    s,
  ]);
  return {
    contractAddress: usdcAddress,
    chainId,
    functionName: "transferWithAuthorization",
    functionArgs,
    abi: TRANSFER_WITH_AUTHORIZATION_ABI,
  };
}
