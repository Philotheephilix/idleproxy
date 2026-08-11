"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set — copy web/.env.example to web/.env.local and fill it in");
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Matches --color-cap in globals.css so Privy's own modal reads as
        // part of the site rather than a bolted-on third-party sheet.
        appearance: { theme: "dark", accentColor: "#35e0a1" },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
