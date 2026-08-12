"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { Address } from "viem";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { formatMicrosUsdShort } from "@/lib/format";
import {
  RouterError,
  explorerTxUrl,
  isUserRejection,
  requestQuote,
  sendPaidCall,
  signPayment,
  type CallSuccess,
  type RouterErrorKind,
  type X402Accept,
} from "@/lib/x402";

/**
 * The paying side of the product, end to end in a browser: quote, sign,
 * replay, response. Deliberately not a JSON console — every stage of the x402
 * handshake is shown as the thing it is, and the receipt at the end links the
 * settlement transaction on Basescan.
 *
 * There is no session and no SIWE here. The provider flow proves who owns an
 * address; a consumer only has to be able to sign a spend authorization, so
 * this page uses Privy for the wallet connection and nothing else.
 */

const MODEL = "claude-code/sonnet";
/** Band S — the router prices a call from the max_tokens ceiling it is asked
 *  for, so this is what fixes the quote at roughly two cents. */
const MAX_TOKENS = 256;

const EXAMPLE_PROMPT =
  "In two sentences, explain what an EIP-3009 transferWithAuthorization lets a payer do that a plain ERC-20 approve does not.";

type Phase = "idle" | "quote" | "sign" | "settle" | "done";
const ORDER: Phase[] = ["quote", "sign", "settle", "done"];

const STAGES: Array<{ id: Phase; label: string; running: string; settled: string }> = [
  { id: "quote", label: "Ask the price", running: "Requesting price…", settled: "402 quote received" },
  { id: "sign", label: "Authorize payment", running: "Waiting for signature…", settled: "Authorization signed" },
  { id: "settle", label: "Pay and dispatch", running: "Paying and dispatching…", settled: "Settled onchain" },
];

type Failure = { kind: RouterErrorKind | "rejected"; message: string };

export default function TryPage() {
  const { login, authenticated, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  // Gated on `authenticated` so that disconnecting from the nav — which logs
  // out of Privy, but cannot revoke an injected wallet's site permission —
  // really does drop the payer here too.
  const wallet = authenticated && walletsReady ? wallets[0] : undefined;

  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [phase, setPhase] = useState<Phase>("idle");
  const [failedAt, setFailedAt] = useState<Phase | null>(null);
  const [quote, setQuote] = useState<X402Accept | null>(null);
  const [result, setResult] = useState<CallSuccess | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const running = phase !== "idle" && phase !== "done" && !failure;
  const canSend = Boolean(wallet) && prompt.trim().length > 0 && !running;

  async function send() {
    if (!wallet) return;

    setQuote(null);
    setResult(null);
    setFailure(null);
    setFailedAt(null);

    const body = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user" as const, content: prompt.trim() }],
    };

    // `phase` is state, so it is stale inside this closure's catch — track the
    // stage that was in flight locally as well, to mark the right one failed.
    let at: Phase = "quote";
    const enter = (p: Phase) => {
      at = p;
      setPhase(p);
    };

    try {
      enter("quote");
      const accept = await requestQuote(body);
      setQuote(accept);

      enter("sign");
      const provider = await wallet.getEthereumProvider();
      const paymentHeader = await signPayment(provider, wallet.address as Address, accept);

      enter("settle");
      setResult(await sendPaidCall(body, paymentHeader));
      setPhase("done");
    } catch (e) {
      // Leave `phase` on the stage that failed rather than resetting: the
      // stages before it really did happen, and the rail should keep saying so.
      setFailedAt(at);
      if (isUserRejection(e)) {
        setFailure({ kind: "rejected", message: "You declined the authorization, so nothing was paid or sent." });
      } else if (e instanceof RouterError) {
        setFailure({ kind: e.kind, message: e.message });
      } else {
        setFailure({ kind: "unknown", message: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  const current = ORDER.indexOf(phase);
  const settlementUrl =
    quote && result?.settlementTx ? explorerTxUrl(quote.network, result.settlementTx) : null;

  return (
    <>
      <SiteNav />

      <main className="flex-1">
        {/* ---- header ------------------------------------------------------ */}
        <section className="relative overflow-hidden border-b border-line">
          <div aria-hidden className="rule-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative mx-auto max-w-[1180px] px-6 pt-14 pb-12 lg:pt-18 lg:pb-14">
            <p className="eyebrow flex items-center gap-2.5">
              <span className="live-dot size-1.5 rounded-full bg-pay" />
              Demand side · live testnet
            </p>

            <h1 className="mt-6 max-w-[16ch] font-display text-[38px] leading-[1.06] font-semibold tracking-[-0.025em] sm:text-[44px]">
              Pay for one call, <span className="text-pay">watch it settle</span>.
            </h1>

            <p className="mt-6 max-w-[64ch] text-[16px] leading-relaxed text-muted">
              Ask the router for a completion, get a 402 back with a price, sign a USDC spend
              authorization for exactly that amount, and replay. The response comes from a real
              provider node; KeeperHub broadcasts the payment onchain before you see a word of it.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-2">
              {[
                "no account, no API key",
                "you sign a spend authorization, not a transaction",
                "test USDC on Base Sepolia",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 font-mono text-[11.5px] text-dim">
                  <span className="size-1 rounded-full bg-pay" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- the flow ---------------------------------------------------- */}
        <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-14 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="min-w-0 space-y-5 lg:col-span-7">
            {/* step 01 — wallet */}
            <section className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
              <p className="eyebrow">Step 01</p>
              <h2 className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-fg">
                Connect a wallet holding test USDC
              </h2>
              <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-muted">
                The wallet only authorizes a single payment of the quoted amount, and that
                authorization expires unused if the call never happens.
              </p>

              {wallet ? (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-elev px-4 py-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-cap" />
                  <span className="font-mono text-[10.5px] tracking-widest text-dim uppercase">payer</span>
                  <span className="min-w-0 font-mono text-[12.5px] break-all text-fg">{wallet.address}</span>
                </div>
              ) : (
                <button
                  onClick={() => login()}
                  disabled={!ready || (authenticated && !walletsReady)}
                  className="mt-5 rounded-xl bg-pay px-5 py-3 font-display text-[14.5px] font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-elev disabled:text-dim"
                >
                  {authenticated ? "Waiting for wallet…" : "Connect wallet"}
                </button>
              )}
            </section>

            {/* step 02 — prompt */}
            <section className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
              <p className="eyebrow">Step 02</p>
              <h2 className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-fg">
                Write the prompt you want to buy
              </h2>
              <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-muted">
                Price is set by the <code className="font-mono text-[13px] text-fg">max_tokens</code>{" "}
                ceiling, not by what comes back — so you know the cost before anything runs.
              </p>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={running}
                rows={4}
                spellCheck={false}
                placeholder="Ask the network something…"
                className="mt-5 w-full resize-y rounded-xl border border-line bg-elev px-4 py-3.5 font-mono text-[13px] leading-relaxed text-fg placeholder:text-dim focus:border-pay focus:outline-none disabled:text-muted"
              />

              <dl className="mt-4 flex flex-wrap gap-x-7 gap-y-2 font-mono text-[11.5px]">
                {[
                  ["model", MODEL],
                  ["max_tokens", String(MAX_TOKENS)],
                  ["band", "S"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-dim">{k}</dt>
                    <dd className="text-muted">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={send}
                  disabled={!canSend}
                  className="rounded-xl bg-pay px-6 py-3.5 font-display text-[15px] font-semibold text-ink shadow-[0_12px_32px_-18px_var(--color-pay)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-elev disabled:text-dim disabled:shadow-none"
                >
                  {running ? "Working…" : result ? "Send another & pay" : "Send & pay"}
                </button>
                {!wallet && (
                  <span className="font-mono text-[12px] text-dim">connect a wallet first</span>
                )}
              </div>
            </section>

            {/* outcome */}
            {failure && <FailurePanel failure={failure} />}

            {result && (
              <section className="rounded-2xl border border-cap/30 bg-panel p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="eyebrow text-cap">Response</p>
                  {result.usage && (
                    <p className="font-mono text-[11.5px] text-dim">
                      {result.usage.prompt_tokens} in · {result.usage.completion_tokens} out
                    </p>
                  )}
                </div>
                <p className="mt-4 text-[15px] leading-[1.75] whitespace-pre-wrap text-fg">
                  {result.text || "(the node returned an empty completion)"}
                </p>
              </section>
            )}
          </div>

          {/* meter / receipt */}
          <div className="min-w-0 lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <section className="overflow-hidden rounded-2xl border border-line bg-panel">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="font-mono text-[10.5px] tracking-widest text-dim uppercase">
                    x402 handshake
                  </span>
                  <span className="font-mono text-[10.5px] text-dim">
                    {quote?.network ?? "base-sepolia"}
                  </span>
                </div>

                <ol className="px-5 py-5">
                  {STAGES.map((s, i) => {
                    const state =
                      failedAt === s.id
                        ? "failed"
                        : current > i
                          ? "done"
                          : current === i
                            ? "active"
                            : "todo";
                    return (
                      <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < STAGES.length - 1 && (
                          <span
                            aria-hidden
                            className={`absolute top-7 left-[13px] h-[calc(100%-1.75rem)] w-px ${
                              state === "done" ? "bg-pay/50" : "bg-line"
                            }`}
                          />
                        )}
                        <span
                          className={`z-10 grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${
                            state === "failed"
                              ? "border-danger/60 bg-elev text-danger"
                              : state === "done"
                                ? "border-pay/50 bg-pay-deep text-pay"
                                : state === "active"
                                  ? "border-pay bg-pay text-ink"
                                  : "border-line bg-elev text-dim"
                          }`}
                        >
                          {state === "failed" ? "!" : state === "done" ? "✓" : `0${i + 1}`}
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span
                            className={`block text-[14px] ${
                              state === "todo"
                                ? "text-dim"
                                : state === "failed"
                                  ? "text-danger"
                                  : state === "active"
                                    ? "text-fg"
                                    : "text-muted"
                            }`}
                          >
                            {s.label}
                          </span>
                          <span className="mt-1 block font-mono text-[11.5px] text-dim">
                            {state === "active" ? s.running : state === "done" ? s.settled : ""}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <dl className="space-y-2.5 border-t border-line px-5 py-5 font-mono text-[12px]">
                  <Row label="price" accent={Boolean(quote)}>
                    {quote ? (
                      <>
                        {formatMicrosUsdShort(quote.maxAmountRequired)}{" "}
                        <span className="text-dim">({quote.maxAmountRequired} µUSDC)</span>
                      </>
                    ) : (
                      "quoted on send"
                    )}
                  </Row>
                  <Row label="pay to">{quote?.payTo ?? "—"}</Row>
                  <Row label="asset">{quote ? `USDC ${quote.asset}` : "USDC (6dp)"}</Row>
                  <Row label="settlement" accent={Boolean(settlementUrl)}>
                    {settlementUrl && result?.settlementTx ? (
                      <a
                        href={settlementUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-pay/40 underline-offset-4 transition-colors hover:text-pay"
                      >
                        {result.settlementTx}
                      </a>
                    ) : result ? (
                      "paid — hash not exposed by this router"
                    ) : (
                      "—"
                    )}
                  </Row>
                </dl>
              </section>

              <p className="mt-4 text-[12.5px] leading-relaxed text-dim">
                Signing costs no gas and moves nothing on its own. The router only hands the payment
                to KeeperHub once the job is dispatched — a call that never runs is never charged.
              </p>

              <p className="mt-4 text-[12.5px] leading-relaxed text-dim">
                Have spare capacity instead?{" "}
                <Link href="/#start" className="text-muted underline underline-offset-4 hover:text-cap">
                  Run a node and get paid
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Row({
  label,
  accent = false,
  children,
}: {
  label: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line pb-2.5 last:border-0 last:pb-0">
      <dt className="shrink-0 text-dim">{label}</dt>
      <dd className={`min-w-0 break-all text-right ${accent ? "text-pay" : "text-muted"}`}>{children}</dd>
    </div>
  );
}

/** Each refusal means something different to a payer — whether they were
 *  charged, and whether retrying is worth anything — so none of them collapse
 *  into a generic error banner. */
function FailurePanel({ failure }: { failure: Failure }) {
  const copy: Record<string, { title: string; body: string; tone: "danger" | "muted" }> = {
    no_capacity: {
      title: "No provider capacity right now",
      body: "No provider node is free to take this job right now. Nothing was paid — the authorization you signed simply expires. Try again shortly.",
      tone: "muted",
    },
    rejected: {
      title: "Authorization declined",
      body: "You dismissed the signature request in your wallet. Nothing was paid and no call was made.",
      tone: "muted",
    },
    settlement: {
      title: "Payment could not be settled",
      body: "The router accepted the authorization but the onchain settlement failed — most often a wallet without enough test USDC to cover the quote. Check the connected address on Base Sepolia and try again.",
      tone: "danger",
    },
    payment: {
      title: "The router rejected the payment",
      body: "The authorization did not pass verification. Nothing was charged.",
      tone: "danger",
    },
    rate_limited: {
      title: "Too many calls from this address",
      body: "The router caps requests per payer per minute. Wait a minute and try again.",
      tone: "muted",
    },
    bad_request: {
      title: "The router would not price this request",
      body: "The prompt or its parameters were rejected before any payment was asked for.",
      tone: "danger",
    },
    unreachable: {
      title: "Could not reach the router",
      body: "The request never got there. Check that the router this page points at is up.",
      tone: "danger",
    },
    unknown: {
      title: "The call failed",
      body: "Something went wrong that this page does not have a specific explanation for.",
      tone: "danger",
    },
  };

  const c = copy[failure.kind] ?? copy.unknown;
  const danger = c.tone === "danger";

  return (
    <section
      className={`rounded-2xl border p-6 sm:p-7 ${danger ? "border-danger/40 bg-panel" : "border-line-2 bg-panel"}`}
    >
      <p className={`eyebrow ${danger ? "text-danger" : "text-pay"}`}>
        {danger ? "Failed" : "Nothing charged"}
      </p>
      <h3 className="mt-2.5 font-display text-[19px] font-semibold tracking-tight text-fg">{c.title}</h3>
      <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-muted">{c.body}</p>
      {/* A declined signature has no detail beyond what the copy already says. */}
      {failure.kind !== "rejected" && (
        <p className="mt-4 font-mono text-[11.5px] break-all text-dim">detail: {failure.message}</p>
      )}
    </section>
  );
}
