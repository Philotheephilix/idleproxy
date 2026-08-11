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
        appearance: { theme: "dark", accentColor: "#5eead4" },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
