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
    <div>
      <button
        onClick={() => login()}
        disabled={!ready || authenticated}
        className="rounded-md bg-teal-400 px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        {authenticated ? "Connected" : "Connect wallet"}
      </button>
      {status && <p className="mt-2 text-sm text-gray-400">{status}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
