/**
 * Consumer-side x402: quote -> authorize -> replay.
 *
 * The provider flow in `api.ts` talks to the router with a SIWE session token.
 * Paying for a call is the other side of the product and involves no session
 * at all: the router answers an unpaid request with a 402 quote, the wallet
 * signs an EIP-3009 `TransferWithAuthorization` for exactly that amount, and
 * the same request is replayed with the authorization in `X-PAYMENT`. So
 * these are plain `fetch()` calls, deliberately not `apiFetch`.
 */

import { createWalletClient, custom, UserRejectedRequestError, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";

const ROUTER_URL = process.env.NEXT_PUBLIC_ROUTER_URL;
if (!ROUTER_URL) {
  throw new Error("NEXT_PUBLIC_ROUTER_URL is not set");
}

/** How long the signed authorization stays spendable. Long enough for the
 *  router to verify, dispatch and settle; short enough that an abandoned
 *  signature is not a standing claim on the payer's balance. */
const AUTHORIZATION_TTL_SECONDS = 300;

/** The x402 `network` strings the router can quote, mapped to the chain they
 *  name. An unknown network is refused rather than guessed — signing against
 *  the wrong chainId produces an authorization that verifies nowhere. */
const NETWORKS: Record<string, typeof baseSepolia> = {
  "base-sepolia": baseSepolia,
};

/**
 * USDC's EIP-712 domain. The router resolves `name()`/`version()` off the
 * token contract at boot (src/config.ts) because the Base Sepolia and mainnet
 * FiatToken deployments disagree; both live deployments this app talks to
 * report USDC/2, and a mismatch fails loudly at verification rather than
 * silently mis-settling.
 */
const USDC_DOMAIN_NAME = "USDC";
const USDC_DOMAIN_VERSION = "2";

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

/** One entry of the router's 402 `accepts` array — the x402 challenge. */
export interface X402Accept {
  scheme: string;
  network: string;
  asset: Address;
  maxAmountRequired: string; // USDC atomic units (6 decimals)
  payTo: Address;
}

export interface ChatRequest {
  model: string;
  max_tokens: number;
  messages: Array<{ role: "user"; content: string }>;
}

export interface CallSuccess {
  text: string;
  /** Only readable when the router exposes the header to browsers via CORS. */
  settlementTx: string | null;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null;
}

/**
 * A refusal the router itself issued, classified so the UI can say what
 * actually happened. `no_capacity` in particular is a normal outcome on a
 * live network with no provider node connected, not a bug.
 */
export type RouterErrorKind =
  | "no_capacity"
  | "settlement"
  | "payment"
  | "rate_limited"
  | "bad_request"
  | "unreachable"
  | "unknown";

export class RouterError extends Error {
  constructor(
    message: string,
    readonly kind: RouterErrorKind,
  ) {
    super(message);
    this.name = "RouterError";
  }
}

/** Minimal EIP-1193 surface — what Privy's `wallet.getEthereumProvider()` returns. */
type Eip1193Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

/**
 * Step 1 — POST with no payment. The router prices the call from its
 * `max_tokens` ceiling and answers 402 with the quote.
 */
export async function requestQuote(body: ChatRequest): Promise<X402Accept> {
  const res = await post(body);

  if (res.status !== 402) {
    // This endpoint never serves an unpaid request, so a 200 here would mean
    // the router gave work away; anything else is a genuine refusal.
    if (res.ok) throw new RouterError("router served an unpaid request — refusing to continue", "unknown");
    throw await routerError(res);
  }

  const payload = (await res.json()) as { accepts?: X402Accept[] };
  const accept = payload.accepts?.[0];
  if (!accept) throw new RouterError("router asked for payment but sent no x402 quote", "unknown");
  return accept;
}

/**
 * Step 2 — sign an EIP-3009 authorization for exactly the quoted amount.
 * Nothing moves onchain here: the signature is a bearer claim the router
 * hands to KeeperHub to broadcast, and it simply expires if unused.
 */
export async function signPayment(
  provider: Eip1193Provider,
  address: Address,
  accept: X402Accept,
): Promise<string> {
  const chain = NETWORKS[accept.network];
  if (!chain) throw new RouterError(`router quoted an unsupported network: ${accept.network}`, "unknown");

  const now = Math.floor(Date.now() / 1000);
  const auth = {
    from: address,
    to: accept.payTo,
    value: BigInt(accept.maxAmountRequired),
    // BigInt(0) rather than 0n: this package targets ES2017, where the literal
    // syntax is a compile error even though every browser it ships to has BigInt.
    validAfter: BigInt(0),
    validBefore: BigInt(now + AUTHORIZATION_TTL_SECONDS),
    nonce: randomNonce(),
  };

  const wallet = createWalletClient({ account: address, chain, transport: custom(provider) });
  const signature = await wallet.signTypedData({
    domain: {
      name: USDC_DOMAIN_NAME,
      version: USDC_DOMAIN_VERSION,
      chainId: chain.id,
      verifyingContract: accept.asset,
    },
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message: auth,
  });

  // BigInts are not JSON-serializable, and the router parses these back with
  // BigInt()/getAddress(), so decimal strings are the wire form.
  return base64({
    from: auth.from,
    to: auth.to,
    value: auth.value.toString(),
    validAfter: auth.validAfter.toString(),
    validBefore: auth.validBefore.toString(),
    nonce: auth.nonce,
    signature,
  });
}

/**
 * Step 3 — replay the identical request carrying the authorization. The
 * router verifies it, dispatches to a node, settles through KeeperHub and
 * only then returns the completion.
 */
export async function sendPaidCall(body: ChatRequest, paymentHeader: string): Promise<CallSuccess> {
  const res = await post(body, paymentHeader);
  if (!res.ok) throw await routerError(res);

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: CallSuccess["usage"];
  };

  return {
    text: payload.choices?.[0]?.message?.content ?? "",
    settlementTx: res.headers.get("x-idleproxy-settlement-tx"),
    usage: payload.usage ?? null,
  };
}

/** Block-explorer link for a settlement transaction on the quoted network. */
export function explorerTxUrl(network: string, txHash: string): string | null {
  const explorer = NETWORKS[network]?.blockExplorers?.default.url;
  return explorer ? `${explorer}/tx/${txHash}` : null;
}

/** True when the wallet owner declined to sign, rather than anything failing. */
export function isUserRejection(e: unknown): boolean {
  if (e instanceof UserRejectedRequestError) return true;
  const err = e as { code?: number; name?: string; message?: string; cause?: { code?: number } };
  if (err?.code === 4001 || err?.cause?.code === 4001) return true;
  if (err?.name === "UserRejectedRequestError") return true;
  return /user rejected|user denied|request rejected/i.test(err?.message ?? "");
}

// --- internals ------------------------------------------------------------

async function post(body: ChatRequest, paymentHeader?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (paymentHeader) headers["X-PAYMENT"] = paymentHeader;

  try {
    return await fetch(`${ROUTER_URL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new RouterError(`could not reach the router at ${ROUTER_URL}`, "unreachable");
  }
}

async function routerError(res: Response): Promise<RouterError> {
  let message = `router responded ${res.status}`;
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body.error?.message) message = body.error.message;
  } catch {
    // Non-JSON body (a proxy error page, say) — the status line is all we have.
  }

  if (res.status === 429) return new RouterError(message, "rate_limited");
  if (res.status === 400) return new RouterError(message, "bad_request");
  if (res.status === 402) return new RouterError(message, "payment");
  if (res.status === 502) {
    // Both dispatch failure and settlement failure surface as 502 api_error.
    // They mean opposite things to the payer — one costs nothing, the other
    // means the authorization was signed but never broadcast — so split them.
    const noNode = /no (tier 1 |)node|fallback unavailable|generation failed/i.test(message);
    return new RouterError(message, noNode ? "no_capacity" : "settlement");
  }
  return new RouterError(message, "unknown");
}

/** 32 random bytes. The router rejects a nonce it has already settled, so
 *  reuse is a replay, not a retry. */
function randomNonce(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** The payload is hex and decimal digits only, so btoa is safe here. */
function base64(payload: Record<string, string>): string {
  return btoa(JSON.stringify(payload));
}
