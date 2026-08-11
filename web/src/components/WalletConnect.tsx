"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { apiFetch, setSession } from "@/lib/api";

// login() in @privy-io/react-auth v3 opens a modal and returns void — it
// does NOT resolve when auth completes. Auth state arrives later via the
// reactive `authenticated`/`wallets` values, so the SIWE flow below is
// triggered from a useEffect watching those, not from an await chain.
export function WalletConnect({ onConnected }: { onConnected: (address: string) => void }) {
  const { login, authenticated, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const signedInRef = useRef(false);

  useEffect(() => {
    if (signedInRef.current) return;
    if (!authenticated || !walletsReady || wallets.length === 0) return;

    const wallet = wallets[0];
    signedInRef.current = true;

    (async () => {
      try {
        setStatus("Requesting nonce...");
        const nonceRes = await apiFetch("/api/siwe/nonce");
        const { nonce, message } = await nonceRes.json();

        setStatus("Waiting for signature...");
        const provider = await wallet.getEthereumProvider();
        const signature = await provider.request({
          method: "personal_sign",
          params: [message, wallet.address],
        });

        setStatus("Verifying...");
        const verifyRes = await apiFetch("/api/siwe/verify", {
          method: "POST",
          body: JSON.stringify({ address: wallet.address, nonce, signature }),
        });
        if (!verifyRes.ok) {
          const body = await verifyRes.json();
          setError(body.error?.message ?? "verification failed");
          signedInRef.current = false;
          return;
        }
        const { session } = await verifyRes.json();
        setSession(session);
        setStatus(`Signed in as ${wallet.address}`);
        onConnected(wallet.address);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        signedInRef.current = false;
      }
    })();
  }, [authenticated, walletsReady, wallets, onConnected]);

  return (
    <section className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
      <p className="eyebrow">Step 01</p>
      <h3 className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-fg">
        Connect the wallet you want paid to
      </h3>
      <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-muted">
        You sign a message to prove you hold the address. Payouts go to this address and nowhere
        else.
      </p>

      <button
        onClick={() => login()}
        disabled={!ready || authenticated}
        className="mt-5 rounded-xl bg-cap px-5 py-3 font-display text-[14.5px] font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-elev disabled:text-dim disabled:shadow-none"
      >
        {authenticated ? "Connected" : "Connect wallet"}
      </button>
      {status && <p className="mt-3 font-mono text-[12px] break-all text-muted">{status}</p>}
      {error && <p className="mt-3 font-mono text-[12px] text-danger">{error}</p>}
    </section>
  );
}
