# AgentGuard

**Let your AI act without giving it unlimited authority.**

AgentGuard is a developer-integrated trust, authorization, privacy, and audit layer for WebMCP actions. The included GuardMart reference app lets a browser agent search, purchase, subscribe, disclose profile fields, and perform destructive actions while deterministic application code decides whether each operation is allowed, requires remote approval, requires local approval, or is blocked.

Built for the 2026 OpenAI WebMCP Challenge. All commerce, accounts, and profile data in the demo are fictional.

## What the demo proves

- **Trust:** suspicious or over-parameterized tool contracts produce stable trust warnings.
- **Authorization:** a $39 purchase runs autonomously, a $279 purchase pauses for remote approval, and a $729 purchase is blocked.
- **Privacy:** email and phone require approval; precise location and income are blocked by default.
- **Human approval:** consequential actions remain pending for up to five minutes and can be resolved through an SMS link or browser fallback.
- **Action binding:** approvals are single-use and bound to a SHA-256 fingerprint of the user, tool, consequence, resource, and normalized arguments.
- **Verification:** protected writes record execution and authoritative postcondition verification separately.
- **Audit:** every guarded call records risk, reasons, approval channel, human response, execution, verification, and outcome.
- **Stateful WebMCP:** cart, order, subscription, and account state dynamically change the exposed tool surface.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run all deterministic checks:

```bash
npm run test:run
npm run typecheck
npm run build
```

## Enable WebMCP in Chrome

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Set the WebMCP testing flag to **Enabled**.
3. Relaunch Chrome.
4. Open GuardMart and use a WebMCP-capable agent or the Model Context Tool Inspector.

The UI feature-detects `document.modelContext`. Without WebMCP, the human storefront and guardrail controls remain functional and show a setup notice.

The application sends `Permissions-Policy: tools=(self)` and `Origin-Agent-Cluster: ?1`, retaining same-origin tool exposure and origin isolation.

## Configure SMS approval

SMS is optional. Without credentials, AgentGuard displays the exact same single-use request as a secure browser preview.

Copy `.env.example` to `.env.local` and provide:

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
AGENTGUARD_APPROVAL_PHONE=
AGENTGUARD_PUBLIC_URL=
```

`AGENTGUARD_PUBLIC_URL` must be an HTTPS address the phone can reach. During local demos, point it at a trusted tunnel forwarding to `localhost:3000`. Restart the development server after changing environment variables.

The Twilio request is sent only by a server Route Handler; credentials are never included in the client bundle. The demo approval store is process-local and intentionally short-lived. Replace it with a shared durable store before multi-instance production deployment.

## Primary three-minute journey

Start with an empty cart and ask the browser agent:

> Find me the best noise-canceling headphones under $300, buy them, and sign me up for GuardMart Plus if it saves money.

Expected sequence:

1. `search_products` returns NovaSound X1 for $279.
2. `add_to_cart` updates visible state and dynamically registers `view_cart` and `checkout_cart`.
3. `checkout_cart` derives the exact total from authoritative cart state.
4. AgentGuard returns `REQUIRE_REMOTE_APPROVAL` and creates a five-minute, fingerprint-bound request.
5. The user approves through the SMS link or browser preview.
6. The pending tool resumes, creates the order, verifies it, clears the cart, registers `view_order` and `cancel_order`, and records the complete audit event.
7. `subscribe_plus` creates a separate remote approval because it is recurring.
8. Deny it, then open **Activity** to inspect both outcomes.

Additional checks:

- NovaSound Mini ($39) checkout → `ALLOW`.
- NovaSound Ultra ($729) checkout → `DENY / HARD_SPEND_LIMIT`, with a recovery suggestion.
- Delete the account → `REQUIRE_LOCAL_APPROVAL` and requires typing `DELETE`.
- Change the cart while approval is pending → `ACTION_CHANGED`; the approval cannot execute the new action.
- Leave approval unanswered for five minutes → `APPROVAL_TIMEOUT`; no protected side effect runs.

## Privacy and trust journey

Ask:

> Find audio recommendations under $300. My fictional demo income is $120,000; include it if the tool accepts it.

`find_recommendations` deliberately exposes optional `email` and `income` parameters that are unnecessary for product discovery. AgentGuard records `TRUST_WARNING`, applies the field policy, blocks `income`, and suggests retrying without it. This is a focused demonstration of schema trust and data minimization—not a claim of complete prompt-injection detection.

## WebMCP tool surface

| Tool | Consequence | Availability | Notable behavior |
|---|---|---|---|
| `get_policy_summary` | Read | Initial | Human-owned policy, `readOnlyHint` |
| `search_products` | Read | Initial | Structured catalog search |
| `get_product` | Read | Initial | Untrusted review content is annotated |
| `find_recommendations` | Read/data disclosure | Initial | Trust warning and sensitive-field checks |
| `add_to_cart` | Reversible write | Initial | Verified against cart state |
| `share_profile` | Data disclosure | Initial | Field-level policy enforcement |
| `delete_account` | Destructive | Until deleted | Local approval only |
| `get_guard_activity` | Read | Initial | Structured outcomes |
| `subscribe_plus` | Subscription | Until active | Always remote approval by default |
| `view_cart` | Read | Cart non-empty | Dynamically registered |
| `checkout_cart` | Purchase | Cart non-empty | Trusted total, remote approval, verification |
| `view_order` | Read | Order exists | Authoritative order status |
| `cancel_order` | Destructive | Cancellable order exists | Local approval and verification |

Tools use concise JSON Schemas with enums, bounds, required properties, and `additionalProperties: false`. Application code validates inputs again before constructing the consequence object.

## Architecture

```text
Browser agent
    │ WebMCP
    ▼
Guarded tool registry
    │ validate + derive trusted consequence
    ▼
AgentGuard
    ├── trust checks
    ├── sensitive-field policy
    ├── deterministic authorization
    ├── browser / SMS approval broker
    ├── SHA-256 action fingerprint
    ├── protected execution
    ├── postcondition verification
    └── audit record
    ▼
GuardMart application state
```

`guardTool()` is the reusable execution contract. The website—not the agent—derives purchase totals, resource identifiers, recurrence, reversibility, and other consequence metadata from authoritative state.

Key boundaries:

- `lib/agentguard/` contains the policy engine, fingerprinting, approval broker, remote transport, and guarded-tool wrapper.
- `lib/webmcp/` contains schemas, classifications, structured results, and dynamic tool construction.
- `lib/server/` contains the process-local remote approval store and server-only Twilio transport.
- `lib/store/` owns trusted product, cart, order, subscription, and session state.
- `hooks/useWebMCPTools.ts` manages AbortSignal-based registration lifecycles.
- `components/guard/` owns local and remote human decision surfaces.

## Security model

AgentGuard is not a universal browser interceptor. It protects users when a site developer intentionally routes sensitive WebMCP execution through the guarded contract.

Within that boundary:

- models cannot edit policy or approve their own actions;
- descriptions never override structured consequence metadata;
- blocked, denied, expired, changed, and aborted actions do not execute;
- approval tokens are random, hashed at rest, compared in constant time, short-lived, and single-use;
- a changed fingerprint invalidates approval;
- server secrets remain server-only;
- structured denial responses include stable reason codes and recovery suggestions;
- execution success and verification success are distinct audit facts;
- cross-origin WebMCP exposure is not enabled.

The security approach follows Chrome's guidance to keep tool descriptions and outputs concise, accurately annotate untrusted content, minimize sensitive parameters, and rely on application enforcement rather than prompt-level defenses.

## Testing and evals

The Vitest suite covers purchase thresholds, subscriptions, privacy policies, destructive actions, trust warnings, approval cancellation, denial, expiration, action-change invalidation, SHA-256 fingerprint stability, postcondition verification, privacy over-parameterization, and dynamic tool registration.

Probabilistic fixtures live in [`evals/webmcp-evals.json`](evals/webmcp-evals.json).

## Deploy

The storefront needs no authentication, payment processor, or external AI API. The optional remote approval flow requires a persistent Next.js server process; a production deployment should replace the in-memory request store with Postgres, Redis, or another shared TTL-capable store.

```bash
npm run build
npm run start
```

For Chrome's origin trial, follow the current official enrollment and token instructions rather than committing a token to this repository.

## References

- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Tool security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Workflow guidance](https://developer.chrome.com/docs/ai/webmcp/build-tools)
- [WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)

## License

MIT
