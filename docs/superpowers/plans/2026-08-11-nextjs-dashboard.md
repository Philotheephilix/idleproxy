# Next.js Provider Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `public/`'s vanilla-JS provider UI with a separately-hosted Next.js app (`web/`), using Privy for wallet-connect UX and React Bits for landing-page visual treatment, while the router keeps its existing REST/session model unchanged except for added CORS support.

**Architecture:** `web/` is a pure client-side REST consumer — every data call is `fetch()` against `NEXT_PUBLIC_ROUTER_URL`, no server components touch the router. Privy handles wallet connection/signing UI only; the signature still goes through the router's existing, already-tested `/api/siwe/nonce` → `/api/siwe/verify` flow. Session token moves from a page-scoped JS variable (today) to `localStorage`, since the UI no longer shares an origin with the router.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, `@privy-io/react-auth`, `viem` (read-only ABI/address helpers, no signing — Privy owns signing), React Bits components fetched live via the `react-bits` skill's `rb-add.mjs`, `hono/cors` on the router side.

## Global Constraints

- Router's existing endpoints, auth model, and money-moving logic do not change (spec "Out of scope"). Only `src/server.ts` gets `cors()` added and `serveStatic`/`public/` removed.
- Every React Bits component must be fetched live from the registry (`rb-add.mjs` or the raw registry JSON) — never written from memory. This is a hard rule from the react-bits skill, not a style preference.
- Privy handles connect/sign UI only. The router never sees a Privy token; it only ever verifies the same `personal_sign` signature it already verifies today via `verifyMessage` in `src/server.ts`.
- Session token key in `localStorage`: `idleproxy_session`.
- All functional forms (disclosure, caps, dashboard tables) stay plain and accessible; React Bits components (`DotGrid`, `ShinyText`, `TiltedCard`) are confined to the landing page's hero and feature-card sections only.
- `NEXT_PUBLIC_ROUTER_URL` and `NEXT_PUBLIC_PRIVY_APP_ID` are required env vars in `web/.env.local`, not hardcoded anywhere.

---

### Task 1: Router CORS + drop static serving

**Files:**
- Modify: `src/server.ts`
- Delete: `public/index.html`, `public/app.js`, `public/style.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: every existing router endpoint remains reachable, now cross-origin.

- [x] **Step 1: Install `hono`'s cors helper import (already bundled with `hono`, no new package)**

Confirm it's importable:
```bash
node -e "console.log(require.resolve('hono/cors'))" 2>&1 || npx tsx -e "import('hono/cors').then(m => console.log(Object.keys(m)))"
```
Expected: prints `['cors']` or a resolvable path — `hono/cors` ships inside the `hono` package already in `package.json`, no install needed.

- [x] **Step 2: Add the CORS middleware and remove static serving in `src/server.ts`**

Find the import block at the top of `src/server.ts` and add:
```typescript
import { cors } from "hono/cors";
```

Find this line (currently present near the top of `buildServer`):
```typescript
  ensureHouseProvider(db);
```
Add immediately after it:
```typescript
  ensureHouseProvider(db);

  // Wildcard for now (confirmed choice, spec "Router change") — the UI is
  // hosted separately and this needs to accept requests from wherever it
  // ends up deployed. Tighten to a specific CORS_ORIGIN later if needed.
  app.use("/api/*", cors());
  app.use("/v1/*", cors());
```

Find and delete this line near the bottom of `buildServer` (just before `return app;`):
```typescript
  app.use("/*", serveStatic({ root: "./public" }));
```

Remove the now-unused import at the top of the file:
```typescript
import { serveStatic } from "@hono/node-server/serve-static";
```

- [x] **Step 3: Delete the old static UI files**

```bash
rm -f public/index.html public/app.js public/style.css
rmdir public 2>/dev/null || true
```

- [x] **Step 4: Typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no output (clean).

- [x] **Step 5: Real test — boot the router, confirm CORS header present, confirm old static route is gone**

```bash
fuser -k 8787/tcp 2>/dev/null; sleep 1
cd /home/ubuntu/projects/declaude
set -a; source .env; set +a
nohup npx tsx src/cli.ts serve > /tmp/idleproxy-server.log 2>&1 &
disown
```
Wait for `listening on` in the log (use Monitor or poll), then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/v1/models
curl -s -D - -o /dev/null -X OPTIONS http://localhost:8787/v1/models -H "Origin: http://example.com" -H "Access-Control-Request-Method: GET" | grep -i "access-control-allow-origin"
curl -s -o /dev/null -w "root path now: %{http_code}\n" http://localhost:8787/
```
Expected: `200` for `/v1/models`, an `access-control-allow-origin: *` header on the OPTIONS preflight, and `404` for `/` (no more static index — this is the correct new behavior since the UI is no longer served here).

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: router CORS, drop static UI serving

Wildcard cors() on /api/* and /v1/* -- the UI moves to a separately-
hosted Next.js app (web/), so the router needs to accept cross-origin
requests from wherever that ends up deployed. serveStatic and
public/ removed; the router no longer serves any HTML.

Verified live: CORS preflight returns access-control-allow-origin: *,
GET / now correctly 404s (no static index left to serve), every
existing API route still reachable.
EOF
)"
```

---

### Task 2: Scaffold the Next.js app

**Files:**
- Create: `web/` (full Next.js scaffold via `create-next-app`)
- Create: `web/.env.local`, `web/.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/globals.css`, `web/tailwind.config.ts`, `web/package.json` — the base every later task builds on.

- [x] **Step 1: Scaffold with create-next-app**

```bash
cd /home/ubuntu/projects/declaude
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir=false --import-alias "@/*" --eslint=false --turbopack=false --use-npm --yes
```
Expected: `web/` created with `package.json`, `src/app/{layout.tsx,page.tsx,globals.css}`, `tailwind.config.ts`, `tsconfig.json`.

- [x] **Step 2: Install Privy and viem**

```bash
cd web
npm install @privy-io/react-auth viem
```
Expected: both added to `web/package.json` dependencies.

- [x] **Step 3: Create env files**

Create `web/.env.local`:
```
NEXT_PUBLIC_ROUTER_URL=http://localhost:8787
NEXT_PUBLIC_PRIVY_APP_ID=REPLACE_ME
```

Create `web/.env.example`:
```
NEXT_PUBLIC_ROUTER_URL=http://localhost:8787
NEXT_PUBLIC_PRIVY_APP_ID=
```

- [x] **Step 4: Confirm `.env.local` is gitignored**

```bash
cd /home/ubuntu/projects/declaude
git check-ignore -v web/.env.local || echo "NOT IGNORED - add web/.env.local to .gitignore"
```
Expected: `create-next-app` already writes `.env*.local` into `web/.gitignore` — this should print the ignore rule, not the warning. If it prints the warning, add `.env*.local` to `web/.gitignore` before continuing.

- [x] **Step 5: Real test — dev server boots**

```bash
cd web
timeout 15 npm run dev > /tmp/nextjs-boot.log 2>&1 &
disown
```
Wait ~5s, then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```
Expected: `200`. Kill the dev server after confirming (`fuser -k 3000/tcp`).

- [x] **Step 6: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/
git commit -m "$(cat <<'EOF'
chore: scaffold web/ -- Next.js 15 App Router + TypeScript + Tailwind

Own package.json/dependency tree, deployed separately from the router
per the design spec. @privy-io/react-auth + viem installed. Real dev
server boot confirmed (200 on localhost:3000) before committing.
EOF
)"
```

---

### Task 3: Privy provider wrapper

**Files:**
- Create: `web/src/components/PrivyProviderWrapper.tsx`
- Modify: `web/src/app/layout.tsx`

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_PRIVY_APP_ID`.
- Produces: `PrivyProviderWrapper` component wrapping `children`, used by every later page/component that calls `usePrivy()`/`useWallets()`.

- [x] **Step 1: Write `web/src/components/PrivyProviderWrapper.tsx`**

```typescript
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
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

- [x] **Step 2: Wrap `web/src/app/layout.tsx` with it**

Replace the body of the default `RootLayout` in `web/src/app/layout.tsx` so `children` is wrapped:
```typescript
import type { Metadata } from "next";
import "./globals.css";
import { PrivyProviderWrapper } from "@/components/PrivyProviderWrapper";

export const metadata: Metadata = {
  title: "IdleProxy — provider dashboard",
  description: "Meter idle coding-agent capacity out to agents that pay per call, settled onchain through KeeperHub.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
      </body>
    </html>
  );
}
```

- [x] **Step 3: Typecheck**

```bash
cd web
npx tsc --noEmit
```
Expected: no output. (This will fail if `NEXT_PUBLIC_PRIVY_APP_ID` is still the placeholder `REPLACE_ME` at *runtime*, but typecheck itself doesn't execute the throw — it only checks types, so this passes regardless of the env value.)

- [x] **Step 4: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/src/components/PrivyProviderWrapper.tsx web/src/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat: Privy provider wrapper, dark theme matching product accent

Wraps the whole app in layout.tsx. embeddedWallets: createOnLogin
covers a visitor with no wallet installed; accentColor matches the
existing #5eead4 teal from the vanilla UI's dark theme.
EOF
)"
```

---

### Task 4: `apiFetch` helper + session storage

**Files:**
- Create: `web/src/lib/api.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_ROUTER_URL`.
- Produces: `apiFetch(path: string, opts?: RequestInit): Promise<Response>`, `getSession(): string | null`, `setSession(token: string): void`, `clearSession(): void`. Every later component that talks to the router imports these.

- [x] **Step 1: Write `web/src/lib/api.ts`**

```typescript
const ROUTER_URL = process.env.NEXT_PUBLIC_ROUTER_URL;
if (!ROUTER_URL) {
  throw new Error("NEXT_PUBLIC_ROUTER_URL is not set");
}

const SESSION_KEY = "idleproxy_session";

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSession(token: string): void {
  window.localStorage.setItem(SESSION_KEY, token);
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (session) headers.Authorization = `Bearer ${session}`;

  return fetch(`${ROUTER_URL}${path}`, { ...opts, headers });
}
```

- [x] **Step 2: Typecheck**

```bash
cd web && npx tsc --noEmit
```
Expected: no output.

- [x] **Step 3: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/src/lib/api.ts
git commit -m "feat: apiFetch helper + localStorage session (web/src/lib/api.ts)"
```

---

### Task 5: Fetch React Bits components (real fetch, not written from memory)

**Files:**
- Create: `web/src/components/reactbits/DotGrid.tsx` (+ any sibling files the fetch produces)
- Create: `web/src/components/reactbits/ShinyText.tsx`
- Create: `web/src/components/reactbits/TiltedCard.tsx`

**Interfaces:**
- Consumes: nothing (these are self-contained visual components).
- Produces: whatever the fetched files actually export — **read each file's own prop types after fetching, don't assume**. Task 6 imports these.

- [x] **Step 1: Locate the fetch script**

```bash
find /home/ubuntu/.claude/plugins/cache/reactbits-dev-skill -name "rb-add.mjs"
```
Expected: a path like `.../react-bits/<hash>/react-bits/scripts/rb-add.mjs`. Use that exact path in the next step.

- [x] **Step 2: Fetch all three components, TS+Tailwind variant, real network call**

```bash
cd /home/ubuntu/projects/declaude/web
node <path-from-step-1> DotGrid ShinyText TiltedCard --variant TS-TW --dest src/components/reactbits
```
Expected: three (or more, if a component ships sibling files) real `.tsx` files written under `web/src/components/reactbits/`, plus a printed `npm install <deps>` line.

- [x] **Step 3: Install the printed dependencies**

Run whatever `npm install ...` line Step 2 printed (per the skill, `DotGrid` needs `gsap`, `ShinyText` needs `motion`, `TiltedCard` needs `motion` — but install the *exact* line the script printed, not this guess, in case the registry has since changed).

- [x] **Step 4: Read each fetched file's actual props before using them**

```bash
head -40 web/src/components/reactbits/DotGrid.tsx
head -40 web/src/components/reactbits/ShinyText.tsx
head -40 web/src/components/reactbits/TiltedCard.tsx
```
Note the real prop names/types from each — Task 6 wires them up using what's actually there, not assumed defaults.

- [x] **Step 5: Typecheck**

```bash
cd web && npx tsc --noEmit
```
Expected: no output. If a `verbatimModuleSyntax` type-import error appears (per the react-bits skill's known gotcha), split the offending `import { X, type Y }` into a separate `import type { Y }` line in that fetched file.

- [x] **Step 6: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/src/components/reactbits/ web/package.json web/package-lock.json
git commit -m "$(cat <<'EOF'
feat: fetch DotGrid, ShinyText, TiltedCard from the live React Bits registry

Real network fetch via rb-add.mjs, TS-TW variant -- not written from
memory, per the react-bits skill's hard rule. Dependencies installed
per the script's printed install line.
EOF
)"
```

---

### Task 6: Landing page hero + feature cards

**Files:**
- Modify: `web/src/app/page.tsx`
- Create: `web/src/components/FeatureCards.tsx`

**Interfaces:**
- Consumes: `DotGrid`, `ShinyText`, `TiltedCard` from Task 5 (exact props read from the fetched files, not guessed).
- Produces: the hero section markup — Task 7 (`WalletConnect`) mounts inside this page.

- [x] **Step 1: Write `web/src/components/FeatureCards.tsx`**

Use `TiltedCard` (imported from `./reactbits/TiltedCard`, props matching what Task 5 Step 4 found) to render this content — one card per KeeperHub surface, copied from `README.md`'s surfaces table:

```typescript
"use client";

const SURFACES = [
  { title: "x402 settlement", body: "POST /api/execute/contract-call -- verify locally, settle via KeeperHub, so no transaction touches the chain outside it." },
  { title: "Payout workflow", body: "Webhook trigger -> Check Treasury Balance -> Solvency Gate -> Pay Provider. Solvency check and transfer live in KeeperHub, not application code." },
  { title: "Solvency Watchdog", body: "Block trigger -> Check Treasury Balance -> Read USDC Decimals -> Condition. Independent treasury monitoring." },
  { title: "Treasurer agent", body: "MCP server, kh_ header auth -- execute_workflow + get_execution. A real Claude Code agent runs payouts, not a cron job." },
];

// NOTE: import path and prop names below must match what Task 5 Step 4
// actually found in the fetched TiltedCard.tsx -- adjust on implementation
// if they differ from this sketch.
import TiltedCard from "./reactbits/TiltedCard";

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
      {SURFACES.map((s) => (
        <TiltedCard key={s.title}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-teal-300">{s.title}</h3>
            <p className="mt-2 text-sm text-gray-300">{s.body}</p>
          </div>
        </TiltedCard>
      ))}
    </div>
  );
}
```

- [x] **Step 2: Write the hero section in `web/src/app/page.tsx`**

```typescript
import DotGrid from "@/components/reactbits/DotGrid";
import ShinyText from "@/components/reactbits/ShinyText";
import { FeatureCards } from "@/components/FeatureCards";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative h-[420px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <DotGrid />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <ShinyText text="IdleProxy" className="text-5xl font-bold" />
          <p className="mt-4 max-w-xl text-gray-300">
            You pay for a coding-agent subscription. Most hours it sits idle. IdleProxy meters that
            capacity out to agents that pay per call — settled onchain through KeeperHub.
          </p>
          <p className="mt-4 max-w-xl text-sm text-amber-300 border border-amber-800 rounded-md p-3">
            Relaying your own subscription like this likely violates your provider&apos;s resale
            terms. This demo runs on the team&apos;s own accounts, at the team&apos;s own risk.
          </p>
        </div>
      </div>

      <section className="py-16">
        <OnboardingFlow />
      </section>

      <section className="py-16 border-t border-gray-800">
        <h2 className="text-center text-2xl font-semibold mb-8">KeeperHub surfaces used</h2>
        <FeatureCards />
      </section>
    </main>
  );
}
```

Note: `DotGrid`'s and `ShinyText`'s actual prop names (e.g. whether `ShinyText` takes `text` or `children`) must match what Task 5 Step 4 found in the real fetched files — adjust this sketch at implementation time to the real API, don't guess.

`OnboardingFlow` doesn't exist yet — Task 7-9 build it. This task can stub it as an empty `<div />` first, confirm the hero renders, then wire the real component in once it exists (or do Task 6 and 7 in the same working session before committing Task 6, since `page.tsx` needs `OnboardingFlow` to compile). Recommended: do a throwaway stub for `OnboardingFlow` now so Task 6 can be tested and committed independently:

```bash
cat > web/src/components/OnboardingFlow.tsx <<'EOF'
"use client";
export function OnboardingFlow() {
  return <div className="text-center text-gray-500">Onboarding flow — Task 7 replaces this.</div>;
}
EOF
```

- [x] **Step 3: Typecheck**

```bash
cd web && npx tsc --noEmit
```
Expected: no output.

- [x] **Step 4: Real test — dev server renders the hero**

```bash
cd web
nohup npm run dev > /tmp/nextjs-dev.log 2>&1 &
disown
```
Wait for "Ready" in the log, then use Playwright (per the skill's pattern already proven in this session):

```bash
mkdir -p /tmp/webtest && cd /tmp/webtest
npm init -y >/dev/null 2>&1 && npm install playwright >/dev/null 2>&1
cat > test.mjs <<'EOF'
import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:3000");
await page.waitForLoadState("networkidle");
const heading = await page.locator("text=IdleProxy").first().isVisible();
console.log("heading visible:", heading);
console.log("console errors:", errors.length, errors);
await page.screenshot({ path: "/tmp/webtest/hero.png", fullPage: true });
await browser.close();
EOF
node test.mjs
```
Expected: `heading visible: true`, `console errors: 0`. View `/tmp/webtest/hero.png` to visually confirm the `DotGrid` background and cards render (not blank/broken).

- [x] **Step 5: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/src/app/page.tsx web/src/components/FeatureCards.tsx web/src/components/OnboardingFlow.tsx
git commit -m "$(cat <<'EOF'
feat: landing page hero (DotGrid + ShinyText) + KeeperHub feature cards

OnboardingFlow stubbed here, replaced by Task 7-9. Verified live in a
real headless browser: heading renders, zero console errors,
screenshot confirms the DotGrid background and TiltedCard grid
actually paint rather than rendering blank.
EOF
)"
```

---

### Task 7: WalletConnect (Privy) + SIWE verify

**Files:**
- Create: `web/src/components/WalletConnect.tsx`

**Interfaces:**
- Consumes: `usePrivy()`/`useWallets()` from `@privy-io/react-auth`, `apiFetch`/`setSession` from `web/src/lib/api.ts` (Task 4).
- Produces: `WalletConnect` component; calls `onConnected(address: string)` prop once a session is established. Task 9 (`OnboardingFlow`) consumes this callback to advance to the disclosure step.

- [x] **Step 1: Write `web/src/components/WalletConnect.tsx`**

```typescript
"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { apiFetch, setSession } from "@/lib/api";

export function WalletConnect({ onConnected }: { onConnected: (address: string) => void }) {
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function signIn() {
    setError("");
    try {
      if (!authenticated) {
        await login();
      }
      const wallet = wallets[0];
      if (!wallet) {
        setError("No wallet connected after login.");
        return;
      }

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
        return;
      }
      const { session } = await verifyRes.json();
      setSession(session);
      setStatus(`Signed in as ${wallet.address}`);
      onConnected(wallet.address);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <button
        onClick={signIn}
        disabled={!ready}
        className="rounded-md bg-teal-400 px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        Connect wallet
      </button>
      {status && <p className="mt-2 text-sm text-gray-400">{status}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
```

- [x] **Step 2: Typecheck**

```bash
cd web && npx tsc --noEmit
```
Expected: no output. If `wallet.getEthereumProvider()` or the `useWallets()` shape differs from this sketch (Privy's API surface should be confirmed against the installed package's own type defs, not assumed), fix the actual method/property names using `node_modules/@privy-io/react-auth`'s shipped `.d.ts` files as the source of truth.

- [x] **Step 3: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/src/components/WalletConnect.tsx
git commit -m "$(cat <<'EOF'
feat: WalletConnect -- Privy connect UX, router's existing SIWE verify

Privy owns the connect/sign UI (login(), useWallets(),
getEthereumProvider().request personal_sign). The signature still
goes through the router's existing, already-tested nonce -> verify
flow -- the router never sees a Privy token.
EOF
)"
```

---

### Task 8: DisclosureAccept, CapsForm, NodeCommand

**Files:**
- Create: `web/src/components/DisclosureAccept.tsx`
- Create: `web/src/components/CapsForm.tsx`
- Create: `web/src/components/NodeCommand.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Task 4).
- Produces: `DisclosureAccept({ onAccepted: () => void })`, `CapsForm({ onToken: (command: string) => void })`, `NodeCommand({ command: string })`. Task 9 sequences these three plus `WalletConnect`.

- [x] **Step 1: Write `web/src/components/DisclosureAccept.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function DisclosureAccept({ onAccepted }: { onAccepted: () => void }) {
  const [points, setPoints] = useState<string[]>([]);
  const [mainChecked, setMainChecked] = useState(false);
  const [tier1Checked, setTier1Checked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/provider/disclosure")
      .then((r) => r.json())
      .then((body) => setPoints(body.points ?? []));
  }, []);

  async function accept() {
    setError("");
    const res = await apiFetch("/api/provider/accept-disclosure", {
      method: "POST",
      body: JSON.stringify({ tier1Accepted: tier1Checked }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error?.message ?? "failed to accept disclosure");
      return;
    }
    onAccepted();
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Accept disclosure</h2>
      <div className="max-h-64 overflow-y-auto border border-gray-800 rounded-md p-4 text-sm text-gray-300">
        <ol className="list-decimal pl-4 space-y-2">
          {points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </div>
      <label className="flex items-start gap-2 mt-4 text-sm">
        <input type="checkbox" checked={mainChecked} onChange={(e) => setMainChecked(e.target.checked)} className="mt-1" />
        I have read and accept the above.
      </label>
      <label className="flex items-start gap-2 mt-2 text-sm">
        <input type="checkbox" checked={tier1Checked} onChange={(e) => setTier1Checked(e.target.checked)} className="mt-1" />
        Also enable Tier 1 (tool-enabled, containerized) — a materially larger exposure than the default tool-free tier.
      </label>
      <button
        onClick={accept}
        disabled={!mainChecked}
        className="mt-4 rounded-md bg-teal-400 px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        Accept and continue
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
```

- [x] **Step 2: Write `web/src/components/CapsForm.tsx`**

```typescript
"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export function CapsForm({ onToken }: { onToken: (command: string) => void }) {
  const [dailyUsdCap, setDailyUsdCap] = useState(5);
  const [dailyRequestCap, setDailyRequestCap] = useState(500);
  const [maxConcurrency, setMaxConcurrency] = useState(1);
  const [reserveFraction, setReserveFraction] = useState(0.2);
  const [error, setError] = useState("");

  async function requestToken() {
    setError("");
    const res = await apiFetch("/api/provider/node-token", {
      method: "POST",
      body: JSON.stringify({ dailyUsdCap, dailyRequestCap, maxConcurrency, reserveFraction }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error?.message ?? "failed to get node token");
      return;
    }
    const body = await res.json();
    onToken(body.command);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Set caps</h2>
      <label className="block text-sm text-gray-400 mt-2">Daily USD cap (notional)</label>
      <input type="number" value={dailyUsdCap} min={0.5} step={0.5} onChange={(e) => setDailyUsdCap(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <label className="block text-sm text-gray-400 mt-2">Daily request cap</label>
      <input type="number" value={dailyRequestCap} min={1} step={1} onChange={(e) => setDailyRequestCap(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <label className="block text-sm text-gray-400 mt-2">Max concurrency</label>
      <input type="number" value={maxConcurrency} min={1} step={1} onChange={(e) => setMaxConcurrency(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <label className="block text-sm text-gray-400 mt-2">Reserve fraction (0-1)</label>
      <input type="number" value={reserveFraction} min={0} max={0.9} step={0.05} onChange={(e) => setReserveFraction(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <button onClick={requestToken} className="mt-4 rounded-md bg-teal-400 px-4 py-2 font-semibold text-black">
        Get node command
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
```

- [x] **Step 3: Write `web/src/components/NodeCommand.tsx`**

```typescript
"use client";

export function NodeCommand({ command }: { command: string }) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Start earning</h2>
      <p className="text-sm text-gray-400">Run this on the machine with your claude login:</p>
      <pre className="mt-2 bg-gray-900 border border-gray-800 rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {command}
      </pre>
      <button
        onClick={() => navigator.clipboard.writeText(command)}
        className="mt-2 rounded-md border border-gray-700 px-4 py-2 text-sm"
      >
        Copy
      </button>
    </div>
  );
}
```

- [x] **Step 4: Typecheck**

```bash
cd web && npx tsc --noEmit
```
Expected: no output.

- [x] **Step 5: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/src/components/DisclosureAccept.tsx web/src/components/CapsForm.tsx web/src/components/NodeCommand.tsx
git commit -m "feat: DisclosureAccept, CapsForm, NodeCommand components"
```

---

### Task 9: OnboardingFlow (sequences Tasks 7 + 8) + Dashboard page

**Files:**
- Modify: `web/src/components/OnboardingFlow.tsx` (replaces Task 6's stub)
- Create: `web/src/app/dashboard/page.tsx`
- Create: `web/src/components/dashboard/{NodesList,BalanceCard,JobsTable,PayoutsTable,KillSwitch}.tsx`

**Interfaces:**
- Consumes: `WalletConnect` (Task 7), `DisclosureAccept`/`CapsForm`/`NodeCommand` (Task 8), `apiFetch`/`getSession`/`clearSession` (Task 4).
- Produces: complete onboarding flow on `/`, complete dashboard on `/dashboard`.

- [x] **Step 1: Replace the `OnboardingFlow` stub**

```typescript
"use client";

import { useState } from "react";
import { WalletConnect } from "./WalletConnect";
import { DisclosureAccept } from "./DisclosureAccept";
import { CapsForm } from "./CapsForm";
import { NodeCommand } from "./NodeCommand";

type Step = "connect" | "disclosure" | "caps" | "command";

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("connect");
  const [command, setCommand] = useState("");

  return (
    <div className="space-y-12">
      <WalletConnect onConnected={() => setStep((s) => (s === "connect" ? "disclosure" : s))} />
      {step !== "connect" && <DisclosureAccept onAccepted={() => setStep("caps")} />}
      {(step === "caps" || step === "command") && <CapsForm onToken={(cmd) => { setCommand(cmd); setStep("command"); }} />}
      {step === "command" && (
        <>
          <NodeCommand command={command} />
          <div className="text-center">
            <a href="/dashboard" className="text-teal-300 underline text-sm">Go to dashboard</a>
          </div>
        </>
      )}
    </div>
  );
}
```

- [x] **Step 2: Write the dashboard sub-components**

`web/src/components/dashboard/NodesList.tsx`:
```typescript
export function NodesList({ nodes }: { nodes: Array<{ id: string; adapter: string; status: string }> }) {
  if (nodes.length === 0) return <p className="text-sm text-gray-500">No nodes connected yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {nodes.map((n) => (
        <span key={n.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${n.status === "online" ? "bg-teal-900 text-teal-300" : "bg-gray-800 text-gray-400"}`}>
          {n.adapter}: {n.status}
        </span>
      ))}
    </div>
  );
}
```

`web/src/components/dashboard/BalanceCard.tsx`:
```typescript
export function BalanceCard({ balance }: { balance: { accrued_micros: string; paid_out_micros: string } | null }) {
  if (!balance) return <p className="text-sm text-gray-500">No balance yet.</p>;
  return (
    <p className="text-sm text-gray-300">
      Accrued: {balance.accrued_micros} µUSD · Paid out: {balance.paid_out_micros} µUSD
    </p>
  );
}
```

`web/src/components/dashboard/JobsTable.tsx`:
```typescript
export function JobsTable({ jobs }: { jobs: Array<{ id: string; model: string; band: string; status: string; cost_usd_micros: number | null }> }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-gray-500"><tr><th className="text-left">Model</th><th className="text-left">Band</th><th className="text-left">Status</th><th className="text-left">Cost (µUSD)</th></tr></thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id} className="border-t border-gray-800"><td>{j.model}</td><td>{j.band}</td><td>{j.status}</td><td>{j.cost_usd_micros ?? ""}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
```

`web/src/components/dashboard/PayoutsTable.tsx`:
```typescript
export function PayoutsTable({ payouts }: { payouts: Array<{ id: string; amount_micros: number; status: string; transaction_link: string | null }> }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-gray-500"><tr><th className="text-left">Amount (µUSD)</th><th className="text-left">Status</th><th className="text-left">Tx</th></tr></thead>
      <tbody>
        {payouts.map((p) => (
          <tr key={p.id} className="border-t border-gray-800">
            <td>{p.amount_micros}</td>
            <td>{p.status}</td>
            <td>{p.transaction_link ? <a className="text-teal-300 underline" href={p.transaction_link} target="_blank" rel="noopener">view</a> : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`web/src/components/dashboard/KillSwitch.tsx`:
```typescript
"use client";

import { apiFetch } from "@/lib/api";

export function KillSwitch({ onDone }: { onDone: () => void }) {
  async function trigger() {
    await apiFetch("/api/provider/kill-switch", { method: "POST", body: JSON.stringify({ enabled: true }) });
    onDone();
  }
  return (
    <button onClick={trigger} className="rounded-md bg-red-500 px-4 py-2 font-semibold text-black">
      Kill switch
    </button>
  );
}
```

- [x] **Step 3: Write `web/src/app/dashboard/page.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getSession } from "@/lib/api";
import { NodesList } from "@/components/dashboard/NodesList";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { PayoutsTable } from "@/components/dashboard/PayoutsTable";
import { KillSwitch } from "@/components/dashboard/KillSwitch";

interface MeResponse {
  provider: unknown;
  balance: { accrued_micros: string; paid_out_micros: string } | null;
  nodes: Array<{ id: string; adapter: string; status: string }>;
  jobs: Array<{ id: string; model: string; band: string; status: string; cost_usd_micros: number | null }>;
  payouts: Array<{ id: string; amount_micros: number; status: string; transaction_link: string | null }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);

  async function refresh() {
    const res = await apiFetch("/api/provider/me");
    if (!res.ok) {
      router.push("/");
      return;
    }
    setData(await res.json());
  }

  useEffect(() => {
    if (!getSession()) {
      router.push("/");
      return;
    }
    refresh();
  }, [router]);

  if (!data) return <main className="min-h-screen bg-black text-white p-8">Loading...</main>;

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <NodesList nodes={data.nodes} />
      <div>
        <h2 className="text-lg font-semibold mb-2">Accrued balance</h2>
        <BalanceCard balance={data.balance} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Recent jobs</h2>
        <JobsTable jobs={data.jobs} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Payout history</h2>
        <PayoutsTable payouts={data.payouts} />
      </div>
      <div className="flex gap-3">
        <KillSwitch onDone={refresh} />
        <button onClick={refresh} className="rounded-md border border-gray-700 px-4 py-2 text-sm">Refresh</button>
      </div>
    </main>
  );
}
```

- [x] **Step 4: Typecheck**

```bash
cd web && npx tsc --noEmit
```
Expected: no output.

- [x] **Step 5: Real test — full flow through a real browser against the real router**

Ensure the router is running (Task 1 Step 5 left it up, or restart it), ensure `web/.env.local` has a real `NEXT_PUBLIC_PRIVY_APP_ID` filled in (this task cannot be meaningfully tested end-to-end without one — if it's still `REPLACE_ME`, stop here and get the real value before proceeding), then:

```bash
cd web
nohup npm run dev > /tmp/nextjs-dev.log 2>&1 &
disown
```

Write and run a Playwright script following the exact pattern already proven for the vanilla UI in this session (`window.ethereum` stub backed by the real funded test wallet's `viem` signer, injected via `page.addInitScript` before Privy loads, `page.exposeFunction` for the signing callback) — drive: connect → sign → disclosure (check both checkboxes render, accept button disabled until main is checked) → caps → command (verify it contains `--wallet=` and `--token=` and the real connected address) → navigate to `/dashboard` → confirm it loads without redirecting to `/`. Check zero console errors throughout. This mirrors `test_ui_full.mjs` from earlier in this session almost exactly — same signer, same assertions, different app.

If Privy's modal doesn't detect the injected `window.ethereum` as expected (a real risk flagged in the spec's Testing section, not proven yet): fall back to testing the post-connect flow by calling `setSession()` directly in the page context with a token obtained via a real `curl` SIWE flow first, and note explicitly in the commit message that full-flow Privy-modal browser coverage wasn't achieved, rather than claiming it was.

- [x] **Step 6: Commit**

```bash
cd /home/ubuntu/projects/declaude
git add web/src/components/OnboardingFlow.tsx web/src/components/dashboard/ web/src/app/dashboard/
git commit -m "$(cat <<'EOF'
feat: OnboardingFlow (connect -> disclosure -> caps -> command) + dashboard

Sequences WalletConnect, DisclosureAccept, CapsForm, NodeCommand.
Dashboard redirects to / when no session in localStorage, otherwise
loads live data from GET /api/provider/me.

Verified per Step 5: state which of the two outcomes actually happened
before writing this commit --
(a) full real-browser flow, connect through dashboard, driven entirely
    through Privy's modal via the injected window.ethereum stub, or
(b) Privy's modal did not surface the injected provider, so the
    connect step was driven by a curl-obtained session token instead
    and only the post-connect flow (disclosure onward) got real
    browser coverage -- say so plainly, don't imply (a) happened.
EOF
)"
```

---

### Task 10: Gap check against the spec, fix loop

**Files:** whichever files the gap check finds issues in.

**Interfaces:** none new — this task verifies Tasks 1-9 against `docs/superpowers/specs/2026-08-11-nextjs-dashboard-design.md` line by line.

- [x] **Step 1: Walk the spec section by section, confirm each requirement has a corresponding, tested implementation**

Check against `docs/superpowers/specs/2026-08-11-nextjs-dashboard-design.md`:
- Architecture: `web/` is a pure REST client (no server components fetch from the router) — grep for any `fetch()` call outside a `"use client"` file.
- Session persistence: confirm `localStorage` key is exactly `idleproxy_session` everywhere it's referenced.
- Pages: both `/` and `/dashboard` exist and behave as specified (dashboard redirect-if-no-session).
- Router change: confirm `public/` is actually deleted, not just unused.
- Testing: confirm the full live E2E backend test suite (real paid `/v1/messages` call, real settlement, real Tier 1 dispatch) was re-run against the router per the spec's explicit requirement and the user's "run full live test again" instruction — this is a **repeat of tests already written earlier in this session**, re-run now to confirm the CORS/static-removal change in Task 1 didn't regress the backend. Use the same `e2e_chat.ts`/tier1 test patterns already proven; don't write new ones.

- [x] **Step 2: Run the full backend E2E suite one more time for real**

```bash
cd /home/ubuntu/projects/declaude
fuser -k 8787/tcp 2>/dev/null; sleep 1
set -a; source .env; set +a
nohup npx tsx src/cli.ts serve > /tmp/idleproxy-server.log 2>&1 &
disown
```
Wait for boot, then re-run a real paid `/v1/messages` call (same pattern as every prior real test in this session — sign an EIP-3009 authorization with `CONSUMER_TEST_PRIVATE_KEY`, hit `/v1/messages`, confirm `200` and a real settlement tx). Expected: identical behavior to every prior run in this session — the router's core money-moving logic wasn't touched, only CORS and static serving were added/removed.

- [x] **Step 3: Fix anything the gap check or the re-run surfaces, commit each fix separately**

Follow the same pattern used throughout this session: find a real discrepancy, fix it, verify with a real test, commit with an honest description of what was wrong and what the fix does.

- [x] **Step 4: Final commit noting the gap-check pass is complete**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: gap-check pass -- web/ migration against the design spec

Walked docs/superpowers/specs/2026-08-11-nextjs-dashboard-design.md
section by section against the implementation. Re-ran the full
backend E2E suite (real paid /v1/messages call, real settlement)
against the router post-CORS-change to confirm no regression.
EOF
)"
```
