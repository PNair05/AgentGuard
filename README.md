# AgentGuard

**Let agents act—within bounds humans control.**

AgentGuard is a developer-integrated policy firewall for consequential WebMCP actions. The included GuardMart reference app lets a browser agent search products, manage a cart, purchase, subscribe, disclose profile fields, and perform destructive account actions—while deterministic application code decides whether each action is allowed, must pause for a human, or is blocked.

Built for the 2026 OpenAI WebMCP Challenge.

## What the demo proves

- A low-cost, refundable purchase can execute autonomously.
- A $279 purchase pauses the actual WebMCP Promise until the person clicks **Approve once** or **Deny**.
- A purchase over the $500 hard ceiling returns a structured denial and creates no order.
- Recurring charges and destructive actions require human approval.
- Location and phone disclosure are blocked by the default policy.
- Available tools change with application state through AbortController-managed registration lifecycles.
- Every guarded call produces an explainable local audit event.
- User-generated review content is labeled with `untrustedContentHint`; it cannot bypass the deterministic policy engine.

All commerce, accounts, and profile data are fictional. No real payment or personal data is used.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful verification commands:

```bash
npm run test:run
npm run typecheck
npm run build
```

## Enable WebMCP in Chrome

WebMCP is currently available for local testing behind a Chrome flag:

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Set the flag to **Enabled**.
3. Relaunch Chrome.
4. Open GuardMart and use a WebMCP-capable agent or the Model Context Tool Inspector.

The UI feature-detects `document.modelContext`. When it is unavailable, GuardMart remains a functional human interface and shows a concise setup notice.

The production configuration sends `Permissions-Policy: tools=(self)` and `Origin-Agent-Cluster: ?1`, preserving a same-origin tool boundary and an origin-isolated context.

## Three-minute demo journey

Add no items manually, then ask the browser agent:

> Find me the best noise-canceling headphones under $300, buy them, and sign me up for GuardMart Plus if it saves money.

Expected sequence:

1. `search_products` returns the $279 NovaSound X1.
2. `add_to_cart` updates the visible cart and causes `view_cart` and `checkout_cart` to register.
3. `checkout_cart` derives the exact total from application state.
4. AgentGuard returns `REQUIRE_APPROVAL` because $279 exceeds the $50 autonomous limit.
5. Approve once; the pending tool resumes, creates the order, empties the cart, unregisters checkout, and registers `cancel_order`.
6. `subscribe_plus` requests a second approval because it is a recurring $9.99 charge.
7. Deny it; the agent receives a structured, recoverable response.
8. Open **Activity** to see the tool decisions, reason codes, human responses, and outcomes.

Other useful checks:

- Add ParcelTag Duo ($24), then ask the agent to checkout: `ALLOW`.
- Add Trekker One ($729), then checkout: `DENY / HARD_SPEND_LIMIT`.
- Ask to share email and location: `DENY / DATA_FIELD_BLOCKED`.
- Ask to delete the account: the modal requires the human to type `DELETE`.

## WebMCP tool surface

| Tool | Class | Availability | Annotation highlights |
|---|---|---|---|
| `get_policy_summary` | Read | Initial | `readOnlyHint` |
| `search_products` | Read | Initial | `readOnlyHint` |
| `get_product` | Read | Initial | `readOnlyHint`, `untrustedContentHint` |
| `add_to_cart` | Low-risk mutation | Initial | Mutating |
| `share_profile` | Data disclosure | Initial | Mutating, guarded |
| `delete_account` | Destructive | Until deleted | Mutating, guarded |
| `get_guard_activity` | Read | Initial | `readOnlyHint` |
| `subscribe_plus` | Recurring purchase | Until active | Mutating, guarded |
| `view_cart` | Read | Cart non-empty | `readOnlyHint`, dynamic |
| `checkout_cart` | One-time purchase | Cart non-empty | Mutating, guarded, dynamic |
| `cancel_order` | Destructive | Cancellable order exists | Mutating, guarded, dynamic |

Tools use concise JSON Schemas with enums, required properties, bounds, and `additionalProperties: false`. Business logic validates inputs again before policy classification.

## Architecture

```text
document.modelContext.registerTool
              ↓
       validate arguments
              ↓
 derive trusted GuardAction from app state
              ↓
  evaluateAction(action, policy, context)
              ↓
      ALLOW / REQUIRE_APPROVAL / DENY
              ↓
 approval broker Promise (when needed)
              ↓
 exact-action fingerprint check
              ↓
 application side effect + audit outcome
```

Key boundaries:

- `lib/agentguard/` contains the pure policy engine, approval broker, and reusable guarded-tool wrapper.
- `lib/webmcp/` contains WebMCP schemas, type declarations, classifications, outputs, and dynamic tool construction.
- `lib/store/` owns trusted product, cart, order, subscription, and session-spend state.
- `hooks/useWebMCPTools.ts` registers tools client-side and aborts old registrations when capabilities change.
- `components/guard/` contains the only UI capable of resolving a pending approval.

Policies and audit history persist in `localStorage`; transactional demo state stays in memory for a predictable fresh session.

## Security model

AgentGuard is **not** a browser security boundary and cannot intercept arbitrary WebMCP tools on unrelated websites. It is a pattern for sites whose developers intentionally route sensitive tool execution through the AgentGuard layer. A malicious site owner could bypass an application-level wrapper.

Within that integration boundary, AgentGuard guarantees:

- policy changes are human-only and no policy-editing WebMCP tool exists;
- prices, cart totals, order IDs, and profile values come from application state;
- the guarded side effect is after policy evaluation and any required human decision;
- approval is one-time and scoped to an exact action fingerprint;
- a changed action invalidates its approval;
- denied or aborted approval performs no protected side effect;
- tool cancellations remove pending approval UI;
- denials return stable reason codes, a concise explanation, and a recovery suggestion;
- cross-origin exposure is not enabled.

The security approach follows Chrome's guidance to keep descriptions and outputs concise, accurately annotate read-only and untrusted content, expose tools carefully, and treat model-level prompt injection defenses as insufficient on their own.

## Testing and evals

The Vitest suite covers the ten required deterministic policy cases, abort-before-side-effect behavior, explicit approval, action-change invalidation, and dynamic tool registration.

Probabilistic WebMCP fixtures live in [`evals/webmcp-evals.json`](evals/webmcp-evals.json). They cover direct selection, policy awareness, multi-step purchase order, data disclosure, and an untrusted-review scenario.

## Deploy

The app is static-friendly and requires no secrets, database, authentication, payment processor, or external AI API. Deploy to Vercel or another HTTPS host that preserves the response headers in `next.config.ts`.

```bash
npm run build
npm run start
```

For the Chrome origin trial, follow the current enrollment and token instructions in the official WebMCP documentation rather than committing a token to this repository.

## References

- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Tool security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Workflow guidance](https://developer.chrome.com/docs/ai/webmcp/build-tools)
- [WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)

## License

MIT
