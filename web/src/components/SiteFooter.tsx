import Link from "next/link";
import { Wordmark } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-panel/40">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Wordmark />
          <p className="mt-4 max-w-[38ch] text-[13.5px] leading-relaxed text-muted">
            Idle coding-agent capacity, metered out per call and settled onchain through KeeperHub.
          </p>
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow">Provider</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px] text-muted">
            <li>
              <Link href="/#how" className="transition-colors hover:text-fg">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/#start" className="transition-colors hover:text-fg">
                Start earning
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-fg">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className="eyebrow">Onchain</p>
          <dl className="mt-4 space-y-2.5 font-mono text-[12.5px]">
            {[
              ["network", "base-sepolia"],
              ["asset", "USDC (6dp)"],
              ["payment", "x402 · transferWithAuthorization"],
              ["automation", "KeeperHub workflows"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line pb-2.5">
                <dt className="shrink-0 text-dim">{k}</dt>
                <dd className="min-w-0 break-all text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1180px] px-6 py-5 text-[12px] leading-relaxed text-dim">
          Testnet only. Reselling subscription capacity likely violates your provider&apos;s terms —
          this runs on the team&apos;s own accounts, at the team&apos;s own risk.
        </div>
      </div>
    </footer>
  );
}
