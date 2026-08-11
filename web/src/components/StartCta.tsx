"use client";

import { usePrivy } from "@privy-io/react-auth";

/**
 * The page's primary affordance. It opens the same Privy modal the onboarding
 * step below uses, and scrolls the setup panel into view so the next step is
 * on screen when the modal closes. The SIWE exchange itself still happens in
 * exactly one place — <WalletConnect /> inside <OnboardingFlow /> — so this
 * button never duplicates a signature request.
 */
export function StartCta({ variant = "primary" }: { variant?: "primary" | "nav" }) {
  const { login, authenticated, ready } = usePrivy();

  function start() {
    document.getElementById("start")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (ready && !authenticated) login();
  }

  const label = authenticated ? "Continue setup" : "Connect wallet";

  if (variant === "nav") {
    return (
      <button
        onClick={start}
        className="rounded-lg border border-line-2 bg-elev px-3.5 py-2 font-mono text-xs text-fg transition-colors hover:border-cap hover:text-cap"
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={start}
      className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-cap px-6 py-3.5 font-display text-[15px] font-semibold text-ink shadow-[0_12px_32px_-18px_var(--color-cap)] transition-transform hover:-translate-y-0.5"
    >
      {label}
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
    </button>
  );
}
