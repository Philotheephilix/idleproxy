# Provider dashboard: migrate to a separately-hosted Next.js app

**2026-08-11 · Design doc**

## Why

The current provider UI (`public/index.html` + `public/app.js`) is vanilla ESM served by the router
itself (`src/server.ts`'s `serveStatic`), per SPEC.md D10's monolith preference. That's staying true
for the router/node binary — this change is scoped to the UI layer only. Reasons for the split:

1. The router (`idleproxy serve`) and the provider node (`idleproxy node`) are meant to be run via
   `npx` on a provider's own machine — an npm package, not a hosted web app. Bundling a marketing
   landing page into that binary conflates two different deployment targets.
2. A hosted landing page (wallet connect → disclosure → caps → dashboard) is what a judge or a new
   provider actually visits first. It benefits from a real design system (React Bits) that a
   no-build vanilla-JS page can't easily carry.

## Scope

**In scope:** a new `web/` Next.js app replacing `public/`'s UI functionality one-for-one, plus the
router-side change needed to serve it remotely (CORS).

**Out of scope:** any change to the router/node binary's actual behavior, endpoints, auth model, or
money-moving logic. `src/server.ts`'s routes are otherwise untouched.

## Architecture

```
web/                          (new, separate Next.js 15 app — App Router, TypeScript, Tailwind)
  package.json                own dependency tree, deployed separately (e.g. Vercel)
  src/app/page.tsx             "/" — landing + onboarding (client-side step state)
  src/app/dashboard/page.tsx   "/dashboard" — session-gated
  src/components/...
  .env.local                   NEXT_PUBLIC_ROUTER_URL=..., NEXT_PUBLIC_PRIVY_APP_ID=...

src/server.ts                 (existing router, in this repo)
  - serveStatic + public/ REMOVED
  - Hono cors() middleware added, wildcard origin, on /api/* and /v1/* (the routes the
    frontend actually calls — /internal/settlement/run is backend-to-backend, HMAC/token-authed,
    not browser-originated, so it isn't a CORS concern)
  - every other route: unchanged
```

The Next.js app is a pure REST client. No server components fetch from the router; no SSR data
loading. Every request is a client-side `fetch()` against `NEXT_PUBLIC_ROUTER_URL`, exactly mirroring
what `app.js` does today — this keeps the router's existing session-Bearer-token auth model valid
unmodified (it's a header, not a cookie, so cross-origin wildcard CORS is sufficient; no
`credentials: 'include'` complexity).

**Session persistence.** Today's `app.js` holds the Bearer session token in a page-scoped JS
variable, fine because the router serves the same page it manages sessions for. Once hosted
separately, a reload needs it to survive: the session token moves to `localStorage`
(`idleproxy_session`), read on mount, written on successful `/api/siwe/verify`, cleared on kill
switch.

## Pages

**`/` — landing + onboarding.** One page, client-side step state mirroring the existing flow:
1. Hero section: `DotGrid` animated background (`ogl`/`gsap` dep per the catalog — confirm exact dep
   at fetch time, not from memory), `ShinyText` headline, tagline, the provider-terms note directly
   under it (unchanged copy from `SPEC.md` §8 / current `index.html`).
2. `WalletConnect` — **Privy** (`@privy-io/react-auth`) provides the connect UX: multi-wallet picker,
   embedded-wallet option for a user with no wallet installed, `usePrivy()`/`useWallets()` hooks.
   Privy handles the *connection and signing UI only* — once a wallet is connected, the component
   fetches `GET /api/siwe/nonce`, has Privy's wallet sign that exact message (`personal_sign` under
   the hood via Privy's wallet interface), and posts the result to `POST /api/siwe/verify` exactly as
   today. The router's session/Bearer-token model is unchanged, and no untested surface is
   introduced — Privy never talks to the router directly, and the router never sees or verifies a
   Privy token. `PrivyProvider` wraps the app in `layout.tsx` with `NEXT_PUBLIC_PRIVY_APP_ID`.
3. `DisclosureAccept` — same 7-point text (fetched live from `GET /api/provider/disclosure`, not
   hardcoded — matches today's `app.js` behavior of loading it from the API), separate Tier-1
   checkbox, accept button disabled until the main checkbox is checked.
4. `CapsForm` — same four fields (daily USD cap, daily request cap, max concurrency, reserve
   fraction) → `POST /api/provider/node-token`.
5. `NodeCommand` — displays the returned `npx idleproxy node --wallet=... --token=...` command with
   a copy button.
6. A feature/surfaces section further down the landing page using `TiltedCard` per card — content:
   the KeeperHub-surfaces-used list already written for `README.md`.

**`/dashboard`** — redirects to `/` if no session in `localStorage`. Calls `GET /api/provider/me` on
mount and on a manual refresh action. Renders:
- `NodesList` — adapter + online/offline pill per node (same as today).
- `BalanceCard` — accrued/paid-out micros.
- `JobsTable` — model/band/status/cost, last 20.
- `PayoutsTable` — amount/status/tx link, last 20.
- `KillSwitch` — `POST /api/provider/kill-switch`, closes the provider's live node connections
  server-side same as today.

## Components

`web/src/components/`: `WalletConnect.tsx`, `DisclosureAccept.tsx`, `CapsForm.tsx`,
`NodeCommand.tsx`, `dashboard/NodesList.tsx`, `dashboard/BalanceCard.tsx`, `dashboard/JobsTable.tsx`,
`dashboard/PayoutsTable.tsx`, `dashboard/KillSwitch.tsx`. Each is a focused client component with one
job, calling one or two router endpoints — same boundary discipline as the rest of this codebase.
Functional form controls (disclosure checkboxes, caps inputs, dashboard tables) stay plain and
accessible; the React Bits treatment (`DotGrid`, `ShinyText`, `TiltedCard`) is confined to the
landing page's hero and feature-card sections, not buried inside the forms themselves.

## Router change

One addition to `src/server.ts`: Hono's built-in `cors()` middleware, wildcard origin (confirmed
choice — tighten to a specific `CORS_ORIGIN` later if needed, not now). `serveStatic` and its
`public/` root are removed; `public/index.html`, `app.js`, `style.css` are deleted from the repo —
the Next.js app is now the only UI.

## Testing

Same core pattern already proven for the vanilla UI in this session: a Playwright script injects a
`window.ethereum` stub backed by the real funded test wallet's signer (`viem`) *before* Privy's SDK
loads, so Privy's connect modal detects it as an available external-wallet option — Privy supports
connecting an already-injected EIP-1193 provider, it isn't limited to its own embedded wallets. This
is a real assumption to verify at implementation time, not proven yet: if Privy's modal doesn't
surface an injected provider the way expected in a headless/automated context, the fallback is
testing the post-connect flow (disclosure → caps → command → dashboard) directly against a
manually-obtained session token, and calling that out honestly rather than claiming full-flow
browser coverage that doesn't exist. Either way, checked for real, not assumed: zero console errors,
correct step transitions.

After the migration lands, the full live E2E test suite (real paid `/v1/messages` call, real
settlement, real Tier 1 dispatch) gets re-run against the router to confirm the CORS/static-removal
change didn't regress anything on the backend side — explicitly requested, not being skipped.

## What doesn't change

Everything in `SPEC.md` §5–§7 (adapters, money flow, trust model), the CLI (`idleproxy serve | node |
treasurer | doctor | facilitator-demo`), the database schema, and every non-UI endpoint's behavior.
