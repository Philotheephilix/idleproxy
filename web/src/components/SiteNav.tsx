import Link from "next/link";
import { Wordmark } from "./Brand";
import { NavWallet } from "./NavWallet";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#start", label: "Start earning" },
  { href: "/try", label: "Buy a call" },
  { href: "/#surfaces", label: "KeeperHub" },
];

export function SiteNav({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-8 px-6">
        <Link href="/" className="rounded-md">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13.5px] text-muted transition-colors hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[10.5px] tracking-widest text-dim sm:inline-flex">
            <span className="live-dot size-1.5 rounded-full bg-cap" />
            BASE SEPOLIA
          </span>
          {dashboard && (
            <Link
              href="/"
              className="rounded-lg border border-line-2 bg-elev px-3.5 py-2 font-mono text-xs text-fg transition-colors hover:border-cap hover:text-cap"
            >
              Back to site
            </Link>
          )}
          <NavWallet dashboard={dashboard} />
        </div>
      </div>
    </header>
  );
}
