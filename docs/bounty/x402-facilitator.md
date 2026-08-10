# Being your own x402 facilitator on KeeperHub

x402 needs a facilitator: something that takes a signed EIP-3009 `TransferWithAuthorization` from a
payer and actually settles it onchain. Most x402 write-ups assume you either run your own facilitator
service or delegate to Coinbase's. This walks through a third option that isn't documented anywhere in
KeeperHub's own docs: **using KeeperHub's Direct Execution API as the facilitator directly** — no
separate service, no separate signer infrastructure. `POST /api/execute/contract-call` becomes the
`settle` step of x402.

Run it yourself in one command, zero setup, zero funding required:

```
npx idleproxy facilitator-demo
```

That generates a throwaway wallet, signs a zero-value `TransferWithAuthorization`, and settles it
through KeeperHub — printing a real Base Sepolia transaction link. Here's what it's doing and the
three traps that aren't in KeeperHub's docs.

## The shape of the problem

x402's `exact` scheme is a three-party dance: a payer signs an EIP-3009 authorization (never
broadcasting it themselves), a facilitator verifies the signature and broadcasts it, and the resource
server responds once settlement is confirmed. KeeperHub is not built as an x402 facilitator, but
`/api/execute/contract-call` is a generic "call any contract function through our org wallet" endpoint
— and `transferWithAuthorization` is just a contract function. If KeeperHub's org wallet has no stake
in the transfer (it's moving token A's balance from address X to address Y, not KeeperHub's own
funds), there's nothing facilitator-specific KeeperHub needs to support. It already does the job.

The pattern, end to end:

```ts
// 1. Verify the signature yourself, locally — KeeperHub doesn't do this part.
const domain = { name, version, chainId, verifyingContract: usdcAddress }; // read name()/version() from the contract
const valid = await viem.verifyTypedData({ address: auth.from, domain, types, primaryType: "TransferWithAuthorization", message: auth, signature });

// 2. Build the contract-call body — this is the whole "facilitator" logic.
const call = {
  contractAddress: usdcAddress,
  chainId,
  functionName: "transferWithAuthorization",
  functionArgs: JSON.stringify([auth.from, auth.to, auth.value, auth.validAfter, auth.validBefore, auth.nonce, v, r, s]),
  abi: TRANSFER_WITH_AUTHORIZATION_ABI, // see trap 1
};

// 3. Simulate, then broadcast with the nonce as the idempotency key.
const sim = await keeperhub.simulateContractCall(call);
if (sim.wouldRevert) throw new Error(sim.revertReason);
const broadcast = await keeperhub.contractCall(call, auth.nonce); // Idempotency-Key = the nonce
const result = await keeperhub.pollToTerminal(broadcast.executionId);
```

That's the entire facilitator. No separate service, no separate hot wallet for gas (KeeperHub sponsors
it), no separate settlement infrastructure. `idleproxy`'s own consumer payment path
(`src/x402.ts` + `src/keeperhub.ts` in this repo) is exactly this, wired into an HTTP 402 flow.

## Three traps, found running this for real

**1. The ABI must contain only the `(v,r,s)` overload.** FiatToken v2.2 (Circle's USDC implementation)
exposes *two* `transferWithAuthorization` overloads — one taking `(v, r, s)` as three separate
parameters, the other taking a packed `bytes signature`. KeeperHub's docs don't say how `functionName`
disambiguates between overloads when you pass an ABI containing both. The safe answer: don't let it
guess. Pass an ABI JSON string containing **only** the `(v,r,s)` signature, and there's nothing to
disambiguate.

**2. `functionArgs` and `abi` are JSON-encoded strings, not raw arrays/objects** — this part *is*
documented, but it's an easy trap to hit anyway on your first `contract-call` request, because every
other JSON API you've used takes structured bodies. `functionArgs: [...]` fails; `functionArgs:
JSON.stringify([...])` works. Numeric args go in as decimal strings, `nonce`/`r`/`s` as `0x`-prefixed
hex.

**3. A revert during simulation is an HTTP 400, not a 200 with a flag.** `POST .../contract-call` with
`simulate: true` returns `200` when the call would succeed and **`400`** when it would revert — with
the decoded reason in the body (`wouldRevert: true, revertReason: "..."`). A generic "non-2xx means
throw" HTTP wrapper discards exactly the information you need. Parse the body for `wouldRevert` before
deciding whether a 400 is an error or an answer.

## Why the EIP-712 domain has to be read from the chain, not hardcoded

The one thing this pattern gets wrong if you guess instead of check: Base Sepolia's and Base mainnet's
USDC deployments (and Ethereum's, for that matter) don't necessarily share the same EIP-712 domain
`name` and `version`. A hardcoded `"USD Coin"` will make every signature verify perfectly *locally*
(your own `verifyTypedData` call uses the same wrong domain, so it's self-consistent) and then revert
on-chain, because the contract computes the domain separator from its own `name()`/`version()`, not
from whatever your code assumed. Read both at boot:

```ts
const [name, version] = await Promise.all([
  client.readContract({ address: usdcAddress, abi, functionName: "name" }),
  client.readContract({ address: usdcAddress, abi, functionName: "version" }),
]);
```

Measured on Base Sepolia's USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`): `name="USDC"`,
`version="2"` — not the `"USD Coin"` you'll see written in some other x402 references, which is Base
**mainnet**'s value. This is exactly the kind of thing that works in a demo against one network and
silently breaks the moment someone points the same code at another.

## Try it

```
git clone <this repo>
cd idleproxy
cp .env.example .env   # fill in KEEPERHUB_API_KEY
npm install
npx tsx src/cli.ts facilitator-demo
```

No faucet, no funded wallet, no KeeperHub workflow to build first — the zero-value transfer proves the
whole path (signature verification, domain resolution, overload disambiguation, simulate/broadcast/
poll) without needing a single cent of test-USDC. Swap in a real signed authorization from a funded
wallet and the same code path settles real payments — it's the exact settlement primitive `idleproxy`
uses for every paid `/v1/messages` call.
