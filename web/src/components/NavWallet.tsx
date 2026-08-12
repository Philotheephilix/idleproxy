"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/api";
import { StartCta } from "./StartCta";

/**
 * Wallet state in the nav, on every page that renders <SiteNav />.
 *
 * The connected address is the source of truth rather than the router
 * session: /try connects a wallet without ever creating one, and a nav that
 * still said "Connect wallet" there would be lying. Disconnecting tears down
 * both — the Privy session and the router session token.
 */
export function NavWallet({ dashboard = false }: { dashboard?: boolean }) {
  const { logout, authenticated, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // `authenticated` is what logout() actually flips. An injected wallet keeps
  // its site permission after a logout — MetaMask has no programmatic
  // disconnect — so `wallets` alone would keep claiming a connection that the
  // user has just ended.
  const wallet = ready && authenticated && walletsReady ? wallets[0] : undefined;
  const address = wallet?.address;

  if (!address) {
    // The dashboard has its own "Back to site" affordance and redirects when
    // there is no session, so it does not need a connect button here.
    return dashboard ? null : <StartCta variant="nav" />;
  }

  function copy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      clearSession();
      // No-ops on wallets without a programmatic disconnect (MetaMask), which
      // is why the logout below is what the UI keys off.
      wallet?.disconnect();
      await logout();
      if (pathname?.startsWith("/dashboard")) router.push("/");
    } finally {
      setDisconnecting(false);
    }
  }

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copy}
        title={address}
        aria-label={`Copy wallet address ${address}`}
        data-testid="nav-copy-address"
        className="inline-flex items-center gap-2 rounded-lg border border-line-2 bg-elev px-3 py-2 font-mono text-xs text-fg transition-colors hover:border-cap hover:text-cap"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-cap" />
        {copied ? "Copied" : short}
      </button>
      <button
        onClick={disconnect}
        disabled={disconnecting}
        data-testid="nav-disconnect"
        className="rounded-lg border border-line px-3 py-2 font-mono text-xs text-muted transition-colors hover:border-danger hover:text-danger disabled:text-dim"
      >
        {disconnecting ? "…" : "Disconnect"}
      </button>
    </div>
  );
}
