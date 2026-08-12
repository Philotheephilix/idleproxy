import Link from "next/link";
import SplitText from "@/components/reactbits/SplitText/SplitText";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SettlementRail } from "@/components/SettlementRail";
import { StartCta } from "@/components/StartCta";
import { FeatureCards } from "@/components/FeatureCards";
import { OnboardingFlow } from "@/components/OnboardingFlow";

const TRUST = ["login stays on your machine", "you set the daily caps", "kill switch on every node"];

const STEPS = [
  {
    n: "01",
    title: "You run one command",
    body: "npx idleproxy node reports your machine idle. Your claude login is read locally and never transmitted — the router sees a prompt in and a response out.",
  },
  {
    n: "02",
    title: "The router meters demand",
    body: "Clients pay before anything runs. The router verifies the x402 payment, checks your caps and reserve, picks an idle node and records the job.",
  },
  {
    n: "03",
    title: "KeeperHub settles both ways",
    body: "KeeperHub broadcasts the transferWithAuthorization in, and a solvency-gated workflow pays providers out. Application code signs nothing.",
  },
];

const BANDS = [
  { id: "S", tokens: "≤ 256", price: "$0.02", yours: "$0.016" },
  { id: "M", tokens: "≤ 1,024", price: "$0.05", yours: "$0.040" },
  { id: "L", tokens: "≤ 4,096", price: "$0.15", yours: "$0.120" },
];

const CONSUMER_SNIPPET = `$ curl -sS "$ROUTER/v1/messages" \\
    -H 'content-type: application/json' \\
    -d '{"model":"claude-sonnet-4-5","max_tokens":1024, …}'

402 payment_required
accepts: [{ scheme: "exact", network: "base-sepolia",
            asset: <usdc>, payTo: <treasury>,
            maxAmountRequired: "50000" }]

$ # sign the transfer authorisation, replay with X-PAYMENT
200 OK   band=M  job metered  settlement → KeeperHub`;

export default function Home() {
  return (
    <>
      <SiteNav />

      <main className="flex-1">
        {/* ---- hero ------------------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-line">
          <div aria-hidden className="rule-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative mx-auto grid max-w-[1180px] items-center gap-14 px-6 pt-14 pb-16 lg:grid-cols-12 lg:gap-12 lg:pt-20 lg:pb-24">
            <div className="min-w-0 lg:col-span-5">
              <p className="eyebrow flex items-center gap-2.5">
                <span className="live-dot size-1.5 rounded-full bg-cap" />
                Provider network · testnet
              </p>

              <h1 className="mt-6 font-display text-[38px] leading-[1.06] font-semibold tracking-[-0.025em] sm:text-[46px]">
                <SplitText
                  tag="span"
                  text="Sell the hours your coding agent"
                  className="block text-fg"
                  textAlign="left"
                  splitType="words"
                  delay={38}
                  duration={0.85}
                  from={{ opacity: 0, y: 26 }}
                  to={{ opacity: 1, y: 0 }}
                />
                <SplitText
                  tag="span"
                  text="sits idle."
                  className="block text-cap"
                  textAlign="left"
                  splitType="words"
                  delay={38}
                  duration={0.85}
                  from={{ opacity: 0, y: 26 }}
                  to={{ opacity: 1, y: 0 }}
                />
              </h1>

              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-muted">
                IdleProxy meters that capacity out to clients that pay per call — priced in USDC,
                settled onchain through KeeperHub.
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                <StartCta />
                <a
                  href="#how"
                  className="rounded-xl border border-line-2 px-5 py-3.5 text-center font-display text-[15px] font-medium text-fg transition-colors hover:border-cap hover:text-cap"
                >
                  See how a call flows
                </a>
              </div>

              <ul className="mt-8 flex flex-col gap-2">
                {TRUST.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 font-mono text-[11.5px] text-dim">
                    <span className="size-1 rounded-full bg-cap" />
                    {t}
                  </li>
                ))}
              </ul>

              <p className="mt-8 max-w-[46ch] border-l-2 border-pay/50 pl-4 text-[12.5px] leading-relaxed text-dim">
                Relaying your own subscription likely violates your provider&apos;s resale terms. This
                runs on the team&apos;s own accounts, on Base Sepolia testnet, at the team&apos;s own
                risk.
              </p>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <SettlementRail />
            </div>
          </div>
        </section>

        {/* ---- how it works ----------------------------------------------- */}
        <section id="how" className="border-b border-line">
          <div className="mx-auto max-w-[1180px] px-6 py-20 lg:py-24">
            <div className="max-w-2xl">
              <p className="eyebrow">How a call flows</p>
              <h2 className="mt-4 font-display text-[30px] leading-tight font-semibold tracking-[-0.02em] sm:text-[36px]">
                Three moving parts, one metered path.
              </h2>
            </div>

            <div className="mt-12 grid divide-y divide-line border-y border-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              {STEPS.map((s) => (
                <div key={s.n} className="px-0 py-8 lg:px-8 lg:py-10 lg:first:pl-0 lg:last:pr-0">
                  <span className="font-mono text-[11px] tracking-widest text-cap">{s.n}</span>
                  <h3 className="mt-4 font-display text-[19px] font-semibold tracking-tight text-fg">{s.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                </div>
              ))}
            </div>

            {/* bands + consumer surface */}
            <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="min-w-0 lg:col-span-5">
                <p className="eyebrow">What a call is worth</p>
                <h3 className="mt-4 font-display text-[24px] font-semibold tracking-tight">
                  Flat bands, paid before generation.
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  Price is fixed by the <code className="font-mono text-[13px] text-fg">max_tokens</code> ceiling,
                  not by what the model emits. You keep 80% of the band; the rest is protocol fee.
                </p>

                <table className="mt-7 w-full text-left font-mono text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-[10.5px] tracking-widest text-dim uppercase">
                      <th className="py-2.5 font-normal">Band</th>
                      <th className="py-2.5 font-normal">max_tokens</th>
                      <th className="py-2.5 font-normal">Price</th>
                      <th className="py-2.5 text-right font-normal">You keep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BANDS.map((b) => (
                      <tr key={b.id} className="border-b border-line/70">
                        <td className="py-3 text-fg">{b.id}</td>
                        <td className="py-3 text-muted">{b.tokens}</td>
                        <td className="py-3 text-muted">{b.price}</td>
                        <td className="py-3 text-right text-cap">{b.yours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="min-w-0 lg:col-span-7">
                <p className="eyebrow">The demand side</p>
                <h3 className="mt-4 font-display text-[24px] font-semibold tracking-tight">
                  An Anthropic-shaped endpoint that charges at the door.
                </h3>
                <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-muted">
                  Point an existing SDK at the router. The first call returns a 402 with an x402
                  quote — pay and replay, or top up a prepaid key and skip the handshake.
                </p>

                <div className="mt-7 overflow-hidden rounded-xl border border-line bg-panel">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                    <span className="font-mono text-[10.5px] tracking-widest text-dim uppercase">consumer</span>
                    <span className="font-mono text-[10.5px] text-dim">x402 · base-sepolia</span>
                  </div>
                  <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.7] text-muted">
                    {CONSUMER_SNIPPET}
                  </pre>
                </div>

                <Link
                  href="/try"
                  className="group mt-6 inline-flex items-center gap-2.5 rounded-xl border border-pay/40 px-5 py-3 font-display text-[14.5px] font-medium text-pay transition-colors hover:border-pay hover:bg-pay-deep/40"
                >
                  Run that handshake in the browser
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M2 8h11m0 0-4.2-4.2M13 8l-4.2 4.2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---- onboarding -------------------------------------------------- */}
        <section id="start" className="border-b border-line">
          <div className="mx-auto max-w-[1180px] px-6 py-20 lg:py-24">
            <div className="max-w-2xl">
              <p className="eyebrow">Start earning</p>
              <h2 className="mt-4 font-display text-[30px] leading-tight font-semibold tracking-[-0.02em] sm:text-[36px]">
                Four steps. The last one is a command.
              </h2>
            </div>

            <div className="mt-12">
              <OnboardingFlow />
            </div>
          </div>
        </section>

        {/* ---- keeperhub surfaces ------------------------------------------ */}
        <section id="surfaces">
          <div className="mx-auto max-w-[1180px] px-6 py-20 lg:py-24">
            <div className="max-w-2xl">
              <p className="eyebrow">Built on KeeperHub</p>
              <h2 className="mt-4 font-display text-[30px] leading-tight font-semibold tracking-[-0.02em] sm:text-[36px]">
                Settlement is not application code.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Every USDC transfer, in and out, is broadcast by a KeeperHub workflow. The router
                holds no signing key for the treasury.
              </p>
            </div>

            <div className="mt-12">
              <FeatureCards />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
