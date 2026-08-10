# Provider disclosure

Exact text a provider must see and check-to-accept during onboarding, before any capacity is
connected. Backend-agnostic. Rendered in the web UI at the step between SIWE sign-in and the caps
form — not linked, not collapsed, not a FAQ entry.

---

> **Before you connect capacity, understand what you are agreeing to.**
>
> 1. **You are offering your own paid coding-assistant subscription (Claude Code, Codex, or another
>    you configure) to anonymous third parties for payment.** IdleProxy runs the coding-assistant
>    program *you already installed and logged into*, on your machine, under your account. Your
>    login/OAuth token is never read, copied, or transmitted by IdleProxy — we only start the program
>    you installed. But the requests it answers are billed to *your* subscription and count against
>    *your* limits.
>
> 2. **This may violate your provider's Terms of Service.** Anthropic's and OpenAI's terms restrict
>    reselling, sharing, or providing subscription capacity to third parties. Running this can put
>    your account at risk of suspension or ban, with no recourse from IdleProxy. You are solely
>    responsible for your account. Do not connect an account you cannot afford to lose.
>
> 3. **Consumers reach the network through an Anthropic-compatible API and may request a model by an
>    Anthropic name** (e.g. `claude-opus-5`). Their requests are served by *your* coding-assistant
>    program, not by Anthropic's or OpenAI's own API. IdleProxy labels every response as a relay —
>    namespaced model id, disclosure headers, and docs — and claims no affiliation with Anthropic or
>    OpenAI. The trademark and affiliation exposure of presenting an Anthropic-shaped API is a known
>    risk of this project.
>
> 4. **Your program's own configuration can shape — and leak into — consumer outputs.** Custom system
>    prompts, `CLAUDE.md`, project instructions, or stored memory in the account you connect may
>    influence responses sent to strangers. Running tool-free with `--bare` minimizes this, but do not
>    connect an account whose local configuration contains anything you would not want a consumer to
>    see.
>
> 5. **Consumers send prompts you cannot see in advance, and you cannot control their content.** Your
>    account will generate responses to whatever anonymous users ask, within the caps you set. This
>    can include content that violates your provider's usage policies and could flag or ban your
>    account.
>
> 6. **Default execution is tool-free** — the assistant answers as a plain model with no file, shell,
>    or network access to your machine. If you opt in to tool-enabled execution, those jobs run in an
>    isolated container, but isolation is not perfect; enable it only if you accept the residual risk
>    of code from strangers running near your system.
>
> 7. **You set hard caps** per backend (5-hour, weekly, per-day, dollar, invocation, and a reserve you
>    keep for yourself). IdleProxy will not schedule work past them, but cap enforcement is best-effort
>    and based on usage figures the assistant program self-reports; treat the caps as a strong bound,
>    not a guarantee. Use the kill switch anytime.
>
> 8. **This is testnet.** You are paid in Base Sepolia test-USDC, which has no monetary value. Payouts
>    are a demonstration.
>
> 9. **IdleProxy is custodial software in this version.** The broker mediates payment and records what
>    you are owed; you are trusting it. Payout transactions are executed on-chain via KeeperHub and
>    are independently verifiable.
>
> ☐ I have read the above. I understand I may be violating my provider's Terms of Service, that my
> account is at risk, and that my account's own configuration may influence responses shown to
> strangers. I am responsible for my own account, and I accept these risks.

---

## Where the matching disclosures go

| Audience | Text | Placement |
|---|---|---|
| Provider | The above, in full | Onboarding, check-to-accept, before caps |
| Reader of the repo | Condensed version — points 2, 5, 8 | README, **directly under the intro paragraph**, above architecture |
| Consumer | Prompts are visible in plaintext to the provider's machine; model identity is self-reported by the provider's CLI and not cryptographically verified | API docs, and the `x-idleproxy-backend` response header on every call |
| Judge, if asked | Relaying a consumer subscription likely does violate most providers' resale terms, which is why the demo runs exclusively on our own accounts at our own risk, and why the relay is deliberately backend-agnostic — providers plug in capacity they actually have the right to share. What's submitted is the metering and settlement rail, which doesn't care what sits behind the adapter | Prepared card. Volunteer it if the panel goes quiet on it |

Burying any of these reads evasive, and a panel that finds an undisclosed risk itself will weight it
far more heavily than one that was told up front.
