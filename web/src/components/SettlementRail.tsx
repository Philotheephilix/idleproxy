import type { CSSProperties } from "react";

/**
 * The settlement rail — the one drawing that explains IdleProxy.
 *
 * Demand on the left pays per call; the router in the middle verifies the
 * x402 payment, checks the provider's caps and dispatches to an idle node on
 * the right; KeeperHub underneath broadcasts the payment onchain and runs the
 * payout back out to the provider. The loop closes: money in on the left,
 * money out on the right.
 *
 * Pure SVG + CSS. One 8s clock in globals.css drives every moving part, so
 * the beats stay in lockstep and `prefers-reduced-motion` can stop all of it
 * in one place.
 */

/** Path length (px) and the beat this pulse belongs to (s into the 8s clock). */
function pulse(len: number, delay: number): CSSProperties {
  return { "--len": `${len}px`, animationDelay: `${delay}s` } as CSSProperties;
}

function lit(delay: number): CSSProperties {
  return { animationDelay: `${delay}s` };
}

const DEMAND = [
  { title: "Coding agent", sub: "POST /v1/messages", cy: 47 },
  { title: "Automation", sub: "x-api-key ipx_sk_…", cy: 91 },
  { title: "Any SDK client", sub: "X-PAYMENT header", cy: 135 },
];

const ROUTER_ROWS = [
  "verify x402 payment",
  "check caps + reserve",
  "dispatch to idle node",
  "meter cost, record job",
];

const NODES = [
  { name: "your machine", state: "idle", top: 26, mine: true },
  { name: "node-b2f0", state: "idle", top: 84, mine: false },
  { name: "node-c914", state: "busy", top: 142, mine: false },
];

const CAPTIONS = [
  { n: "01", label: "request + payment", tone: "var(--color-pay)", delay: 0 },
  { n: "02", label: "dispatch to idle node", tone: "var(--color-cap)", delay: 2 },
  { n: "03", label: "settle via KeeperHub", tone: "var(--color-pay)", delay: 4 },
  { n: "04", label: "payout to provider", tone: "var(--color-pay)", delay: 6 },
];

export function SettlementRail() {
  return (
    <figure className="m-0 min-w-0">
      <div className="relative min-w-0 rounded-2xl border border-line bg-panel/70 p-3 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-16 -z-10 rounded-full opacity-40 blur-3xl glow-drift"
          style={{
            background:
              "radial-gradient(40% 45% at 68% 22%, color-mix(in oklab, var(--color-cap) 26%, transparent), transparent 70%), radial-gradient(38% 40% at 30% 85%, color-mix(in oklab, var(--color-pay) 22%, transparent), transparent 70%)",
          }}
        />
        {/* Below ~600px the labels stop being legible if the diagram is scaled
            to fit, so it scrolls instead — the captions underneath carry the
            same story in readable text. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-3 right-3 bottom-3 z-10 w-12 rounded-r-xl bg-gradient-to-l from-[var(--color-panel)] to-transparent md:hidden"
        />
        <div className="overflow-x-auto">
        <svg
          viewBox="0 0 660 398"
          className="h-auto w-full min-w-[600px]"
          role="img"
          aria-label="A request from a paying client reaches the IdleProxy router, which verifies the x402 payment, checks provider caps and dispatches the job to an idle node. KeeperHub then broadcasts the payment onchain to Base Sepolia and runs the payout workflow back out to the provider."
        >
          {/* ---- column captions ---------------------------------------- */}
          <g fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.4" fill="var(--color-dim)">
            <text x="10" y="15">
              DEMAND
            </text>
            <text x="232" y="15">
              IDLEPROXY ROUTER
            </text>
            <text x="502" y="15">
              SUPPLY
            </text>
            <text x="232" y="290">
              SETTLEMENT
            </text>
          </g>

          {/* ---- wires (static) ------------------------------------------ */}
          <g className="wire">
            <path d="M158 47 H196 V91 H232" />
            <path d="M158 91 H232" />
            <path d="M158 135 H196 V91 H232" />
            <path d="M428 167 H466 V49 H502" />
            <path d="M330 232 V300" />
            <path d="M232 344 H158" />
            <path d="M428 362 H478 V231 H502" />
          </g>

          {/* ---- demand ---------------------------------------------------- */}
          {DEMAND.map((d) => (
            <g key={d.title}>
              <rect
                x="10"
                y={d.cy - 17}
                width="148"
                height="34"
                rx="7"
                fill="var(--color-elev)"
                stroke="var(--color-line)"
              />
              <text x="22" y={d.cy - 2} fontFamily="var(--font-display)" fontSize="11.5" fontWeight="500" fill="var(--color-fg)">
                {d.title}
              </text>
              <text x="22" y={d.cy + 11} fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-dim)">
                {d.sub}
              </text>
            </g>
          ))}

          {/* ---- router ---------------------------------------------------- */}
          <rect x="232" y="30" width="196" height="202" rx="10" fill="var(--color-panel)" stroke="var(--color-line-2)" />
          <rect
            x="232"
            y="30"
            width="196"
            height="202"
            rx="10"
            fill="none"
            stroke="var(--color-cap)"
            strokeWidth="1.25"
            className="stage-lit"
            style={lit(0)}
          />
          <circle cx="248" cy="49" r="3.5" fill="var(--color-cap)" />
          <text x="260" y="53" fontFamily="var(--font-display)" fontSize="13" fontWeight="600" fill="var(--color-fg)">
            IdleProxy
          </text>
          <line x1="232" y1="66" x2="428" y2="66" stroke="var(--color-line)" />
          {ROUTER_ROWS.map((row, i) => {
            const top = 72 + i * 38;
            return (
              <g key={row}>
                {i > 0 && <line x1="248" y1={top} x2="412" y2={top} stroke="var(--color-line)" />}
                <rect x="248" y={top + 15} width="5" height="5" rx="1" fill={i === 2 ? "var(--color-cap)" : "var(--color-line-2)"} />
                <text x="264" y={top + 23} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--color-muted)">
                  {row}
                </text>
              </g>
            );
          })}

          {/* ---- supply ---------------------------------------------------- */}
          {NODES.map((n) => (
            <g key={n.name}>
              <rect
                x="502"
                y={n.top}
                width="148"
                height="46"
                rx="8"
                fill="var(--color-elev)"
                stroke={n.mine ? "var(--color-cap-deep)" : "var(--color-line)"}
              />
              <text x="514" y={n.top + 19} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--color-fg)">
                {n.name}
              </text>
              <text
                x="638"
                y={n.top + 19}
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontSize="9"
                fill={n.state === "busy" ? "var(--color-pay)" : "var(--color-dim)"}
              >
                {n.state}
              </text>
              <rect x="514" y={n.top + 30} width="124" height="5" rx="2.5" fill="var(--color-line)" />
              {n.mine ? (
                <rect x="514" y={n.top + 30} width="124" height="5" rx="2.5" fill="var(--color-cap)" className="cap-bar" />
              ) : (
                <rect
                  x="514"
                  y={n.top + 30}
                  width="124"
                  height="5"
                  rx="2.5"
                  fill={n.state === "busy" ? "var(--color-pay)" : "var(--color-line-2)"}
                  style={{ transformBox: "fill-box", transformOrigin: "left center", transform: `scaleX(${n.state === "busy" ? 0.66 : 0.14})` }}
                />
              )}
            </g>
          ))}
          <rect
            x="502"
            y="26"
            width="148"
            height="46"
            rx="8"
            fill="none"
            stroke="var(--color-cap)"
            strokeWidth="1.25"
            className="stage-lit"
            style={lit(2)}
          />

          {/* provider payout destination */}
          <rect x="502" y="210" width="148" height="42" rx="8" fill="var(--color-elev)" stroke="var(--color-line)" />
          <text x="514" y="230" fontFamily="var(--font-display)" fontSize="11.5" fontWeight="500" fill="var(--color-fg)">
            Your wallet
          </text>
          <text x="514" y="243" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-dim)">
            USDC payout
          </text>
          <rect
            x="502"
            y="210"
            width="148"
            height="42"
            rx="8"
            fill="none"
            stroke="var(--color-pay)"
            strokeWidth="1.25"
            className="stage-lit"
            style={lit(6)}
          />

          {/* ---- settlement ------------------------------------------------ */}
          <rect x="232" y="300" width="196" height="84" rx="10" fill="var(--color-panel)" stroke="var(--color-line-2)" />
          <rect
            x="232"
            y="300"
            width="196"
            height="84"
            rx="10"
            fill="none"
            stroke="var(--color-pay)"
            strokeWidth="1.25"
            className="stage-lit"
            style={lit(4)}
          />
          <circle cx="248" cy="320" r="3.5" fill="var(--color-pay)" />
          <text x="260" y="324" fontFamily="var(--font-display)" fontSize="12.5" fontWeight="600" fill="var(--color-fg)">
            KeeperHub
          </text>
          <text x="248" y="348" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--color-muted)">
            transferWithAuthorization
          </text>
          <text x="248" y="366" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--color-muted)">
            payout workflow
          </text>

          <rect x="10" y="312" width="148" height="60" rx="8" fill="var(--color-elev)" stroke="var(--color-line)" />
          <text x="22" y="333" fontFamily="var(--font-display)" fontSize="11.5" fontWeight="500" fill="var(--color-fg)">
            Base Sepolia
          </text>
          <text x="146" y="333" textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-dim)">
            USDC
          </text>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={22 + i * 20}
              y="344"
              width="14"
              height="14"
              rx="2"
              fill="var(--color-elev)"
              stroke="var(--color-line-2)"
              className={i === 4 ? "block-new" : undefined}
            />
          ))}

          {/* ---- pulses (the 8s clock) ------------------------------------- */}
          <path d="M158 47 H196 V91 H232" className="pulse pulse-pay" style={pulse(118, 0.1)} />
          <path d="M158 91 H232" className="pulse pulse-pay" style={pulse(74, 0)} />
          <path d="M158 135 H196 V91 H232" className="pulse pulse-pay" style={pulse(118, 0.22)} />
          <path d="M428 167 H466 V49 H502" className="pulse pulse-cap" style={pulse(192, 2)} />
          <path d="M428 167 H466 V49 H502" className="pulse pulse-cap pulse-rev" style={pulse(192, 3.1)} />
          <path d="M330 232 V300" className="pulse pulse-pay" style={pulse(68, 4)} />
          <path d="M232 344 H158" className="pulse pulse-pay" style={pulse(74, 4.9)} />
          <path d="M428 362 H478 V231 H502" className="pulse pulse-pay" style={pulse(205, 6.2)} />
        </svg>
        </div>
      </div>

      <figcaption className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {CAPTIONS.map((c) => (
          <div key={c.n} className="stage-caption border-t pt-2 text-dim" style={lit(c.delay)}>
            <span className="font-mono text-[10px] tracking-widest" style={{ color: c.tone }}>
              {c.n}
            </span>
            <span className="mt-1 block text-[12px] leading-snug text-balance">{c.label}</span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
