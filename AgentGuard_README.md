# AgentGuard

> **Let agents act — within bounds humans control.**
>
> A programmable consent and policy-enforcement layer for high-impact WebMCP actions.

---

## Instructions to the coding agent

You are the lead engineer for **AgentGuard**, a submission to the 2026 WebMCP Challenge. Treat this README as the product specification and implementation brief.

Your job is to **build the working application**, not merely describe it.

Work incrementally, keep the app runnable after each milestone, and prefer a smaller polished end-to-end product over broad unfinished features.

Before making major architectural changes, preserve the core thesis:

> WebMCP gives agents reliable ways to act on a website. AgentGuard gives the website and its user a reliable way to decide **which agent actions may happen automatically, which require explicit human approval, and which must be blocked**.

The final project must demonstrate genuine, non-trivial use of WebMCP and must visibly show a human and an agent collaborating through the same web interface.

---

# 1. Hackathon context

AgentGuard is being built for the **OpenAI WebMCP Challenge**.

The project is evaluated equally on:

1. **WebMCP Leverage** — thorough, skillful, non-trivial WebMCP usage.
2. **Execution** — a complete, coherent, runnable product experience.
3. **Potential Impact** — a credible problem, real audience, and solution demonstrated in the product.
4. **Creativity & Ambition** — novelty and differentiation from existing concepts.

WebMCP Leverage is especially important because it is also the first tie-break criterion in the challenge rules.

Submission requirements include a live URL, a public open-source code repository, and a demo video under three minutes.

Hackathon rules:
https://webmcp.devpost.com/rules

---

# 2. Why AgentGuard should exist

WebMCP lets a website expose structured JavaScript tools to an AI agent. This is substantially more reliable than having an agent infer intent from DOM elements and simulate clicks.

However, reliable actuation creates a second problem:

> Once an agent can reliably call powerful website actions, how much authority should it actually have?

The current WebMCP security draft explicitly discusses a trust gap around high-privilege tools. A website tool can potentially make purchases, transfer funds, modify account settings, share private information, or delete user content while operating inside an already authenticated session.

AgentGuard explores an application-level answer to that problem.

It gives users a simple set of **delegation policies**, and gives WebMCP developers a reusable execution wrapper that enforces those policies before a sensitive tool is allowed to complete.

Important reference material:

- WebMCP overview: https://developer.chrome.com/docs/ai/webmcp
- WebMCP imperative API: https://developer.chrome.com/docs/ai/webmcp/imperative-api
- WebMCP tool security: https://developer.chrome.com/docs/ai/webmcp/secure-tools
- WebMCP workflow guidance: https://developer.chrome.com/docs/ai/webmcp/build-tools
- WebMCP evals: https://developer.chrome.com/docs/ai/webmcp/evals
- Current WebMCP draft: https://webmachinelearning.github.io/webmcp/

Use the current API on `document.modelContext`. Do **not** build new code around the deprecated `navigator.modelContext` API.

---

# 3. Product thesis

AgentGuard is best described as:

> **A policy firewall for WebMCP actions.**

A normal WebMCP tool answers:

> “Can the agent perform this action on the site?”

AgentGuard adds a second question:

> “Given this user’s rules and the current context, should the agent be allowed to perform this action automatically?”

Every guarded action receives one of three decisions:

```text
ALLOW
    Execute immediately.

REQUIRE_APPROVAL
    Pause execution, show the human exactly what will happen and why approval is required, then continue only after explicit approval.

DENY
    Do not execute. Return a structured explanation the agent can understand and recover from.
```

The product should make that decision process highly visible.

---

# 4. Precise claim — and what AgentGuard is NOT

Do not overclaim.

AgentGuard is **not** a browser security boundary and it cannot universally intercept arbitrary WebMCP tools on unrelated websites.

WebMCP tools are page-scoped and cross-origin access is intentionally permission-gated.

AgentGuard is instead:

1. A **developer-integrated policy layer** for websites that expose high-impact WebMCP tools.
2. A reusable reference implementation showing how websites can keep humans in control while still giving agents meaningful autonomy.
3. A prototype for richer consent-management patterns in the agentic web.

It protects users when the website developer intentionally integrates the AgentGuard execution layer.

It does **not** claim to protect users from a fully malicious website owner who bypasses AgentGuard entirely.

This limitation should be stated clearly in the project documentation. Precision makes the project more credible.

---

# 5. Target audience

## Primary developer audience

Web developers exposing consequential actions through WebMCP, especially in:

- commerce,
- fintech,
- SaaS account administration,
- marketplaces,
- subscriptions,
- productivity applications,
- data-sharing workflows.

## End-user audience

People who want to delegate useful work to AI agents without granting unlimited authority.

The core user need is:

> “I want my agent to handle routine tasks automatically, but I want clear boundaries around money, subscriptions, personal information, and destructive actions.”

---

# 6. Reference product: GuardMart

The public demo should contain a polished fictional commerce/account application called **GuardMart**, powered by AgentGuard.

GuardMart is not the product thesis by itself. It is the reference application that makes AgentGuard easy to understand in under three minutes.

The site should feel like a real product rather than a developer console.

A user can browse products, manage a cart, purchase items, enroll in a fictional membership, share profile information with a fictional partner, and manage their account.

All data and transactions are simulated. No real payments should occur.

The agent can use WebMCP tools to perform these workflows.

AgentGuard sits between the WebMCP tool invocation and the underlying application action.

---

# 7. The demo story

The default user policy should be easy to understand:

```text
Autonomous one-time purchases
    Up to $50: allowed automatically

Purchases above $50
    Require approval

Hard purchase ceiling
    Above $500: blocked

Recurring subscriptions
    Always require approval

Non-refundable purchases
    Always require approval

Personal data sharing
    Email: require approval
    Location: blocked

Destructive account actions
    Always require approval

Session spending cap
    $350
```

A strong demo prompt is:

> “Find me the best noise-canceling headphones under $300, buy them, and sign me up for GuardMart Plus if it saves money.”

Expected flow:

1. The agent discovers the currently available WebMCP tools.
2. It calls `search_products`.
3. It selects a suitable product.
4. It calls `add_to_cart`.
5. It calls `view_cart`.
6. It calls `checkout_cart`.
7. AgentGuard evaluates the purchase.
8. Because the purchase exceeds the autonomous $50 limit, the WebMCP execution pauses.
9. A human approval modal appears with:
   - action,
   - merchant,
   - amount,
   - refundability,
   - policy rule triggered,
   - what the agent is attempting to do.
10. The human clicks **Approve once**.
11. The pending WebMCP tool resumes and creates the simulated order.
12. The agent then calls `subscribe_plus`.
13. AgentGuard requires approval because the action creates a recurring charge.
14. The human clicks **Deny**.
15. The agent receives a structured denial result and continues without breaking the workflow.
16. The Activity/Audit screen shows the full history of tool calls and AgentGuard decisions.

This single journey should communicate the entire project thesis.

---

# 8. Product principles

## 8.1 Human guardrails are not agent-editable

The agent must never be able to weaken its own permissions.

Policy editing must be available only through normal human UI controls.

Do **not** expose tools such as:

```text
set_spending_limit
turn_off_approvals
allow_all_actions
```

The agent may inspect a safe summary of its current boundaries, but it may not modify them.

## 8.2 Policies are enforced during execution

Do not rely on the language model voluntarily respecting a policy described in text.

The guard must execute deterministically in application code before the protected side effect happens.

## 8.3 Approval is specific and contextual

Avoid generic prompts like:

> “Allow agent action?”

Instead show:

```text
Agent wants to purchase
NovaSound X1 Headphones
$279.00

Why approval is required
• Purchase exceeds your $50 autonomous spending limit

Effect
• One-time charge: $279.00
• Refundable for 30 days

[Deny] [Approve once]
```

## 8.4 Denials must help the agent recover

A blocked tool should not throw a generic error.

Return a concise structured response such as:

```json
{
  "status": "blocked",
  "decision": "DENY",
  "reasonCodes": ["HARD_SPEND_LIMIT"],
  "message": "Purchase blocked because $729 exceeds the user's $500 hard limit.",
  "recoverable": true,
  "suggestion": "Choose an alternative costing $500 or less."
}
```

This follows WebMCP guidance to make failures actionable for the agent.

---

# 9. Core action model

Create these action classes:

```ts
type GuardActionType =
  | "READ"
  | "LOW_RISK_MUTATION"
  | "ONE_TIME_PURCHASE"
  | "RECURRING_PURCHASE"
  | "DATA_DISCLOSURE"
  | "DESTRUCTIVE_ACTION";
```

A guarded action should resolve into metadata similar to:

```ts
interface GuardAction {
  type: GuardActionType;
  label: string;
  toolName: string;
  amount?: number;
  currency?: "USD";
  recurring?: boolean;
  refundable?: boolean;
  dataFields?: string[];
  destructive?: boolean;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}
```

The WebMCP natural-language description is **not** the security policy.

The guard action metadata is a separate internal contract used by AgentGuard.

---

# 10. Policy model

Implement a deterministic policy object.

Suggested shape:

```ts
interface AgentPolicy {
  autonomousPurchaseLimit: number;
  hardPurchaseLimit: number;
  sessionSpendLimit: number;

  requireApprovalForRecurring: boolean;
  requireApprovalForNonRefundable: boolean;
  requireApprovalForDestructive: boolean;

  dataRules: Record<
    string,
    "ALLOW" | "REQUIRE_APPROVAL" | "DENY"
  >;
}
```

Default demo policy:

```ts
const DEFAULT_POLICY: AgentPolicy = {
  autonomousPurchaseLimit: 50,
  hardPurchaseLimit: 500,
  sessionSpendLimit: 350,

  requireApprovalForRecurring: true,
  requireApprovalForNonRefundable: true,
  requireApprovalForDestructive: true,

  dataRules: {
    email: "REQUIRE_APPROVAL",
    location: "DENY",
    phone: "DENY"
  }
};
```

Store policies locally for the hackathon demo. `localStorage` is acceptable and keeps the experience fast and deterministic.

No authentication or backend is required for the MVP.

---

# 11. Policy engine

Implement a pure deterministic function:

```ts
function evaluateAction(
  action: GuardAction,
  policy: AgentPolicy,
  context: GuardContext
): GuardDecision
```

Suggested decision shape:

```ts
type Decision = "ALLOW" | "REQUIRE_APPROVAL" | "DENY";

interface GuardDecision {
  decision: Decision;
  reasonCodes: string[];
  reasons: string[];
  action: GuardAction;
}
```

Suggested rules:

## READ

Always allow.

## LOW_RISK_MUTATION

Allow by default.

Examples:

- adding to cart,
- changing sort order,
- selecting a product option.

## ONE_TIME_PURCHASE

1. If amount exceeds `hardPurchaseLimit` → `DENY`.
2. If cumulative session spending would exceed `sessionSpendLimit` → `REQUIRE_APPROVAL` or `DENY`; use `REQUIRE_APPROVAL` for the demo unless the hard limit is exceeded.
3. If item is non-refundable and policy requires approval → `REQUIRE_APPROVAL`.
4. If amount exceeds `autonomousPurchaseLimit` → `REQUIRE_APPROVAL`.
5. Otherwise → `ALLOW`.

## RECURRING_PURCHASE

Require approval when `requireApprovalForRecurring` is enabled.

## DATA_DISCLOSURE

Evaluate every requested field.

Any `DENY` field blocks the disclosure.

Any `REQUIRE_APPROVAL` field causes approval if no denied field exists.

## DESTRUCTIVE_ACTION

Require approval by default.

---

# 12. The AgentGuard execution wrapper

This is the most important technical part of the repository.

Create a reusable helper such as:

```ts
guardedWebMCPTool({
  tool,
  classify,
  execute
})
```

Conceptual API:

```ts
interface GuardedToolConfig<TInput, TResult> {
  tool: {
    name: string;
    title?: string;
    description: string;
    inputSchema: object;
    annotations?: {
      readOnlyHint?: boolean;
      untrustedContentHint?: boolean;
    };
  };

  classify: (
    input: TInput,
    appState: AppState
  ) => GuardAction;

  execute: (
    input: TInput,
    context: ExecutionContext
  ) => Promise<TResult>;
}
```

Execution pipeline:

```text
WebMCP tool called
        ↓
Validate input
        ↓
Create GuardAction
        ↓
Policy engine evaluates action
        ↓
Write audit event
        ↓
┌─────────────────────────────────────────┐
│ ALLOW            → execute immediately │
│ REQUIRE_APPROVAL → request human input │
│ DENY             → return explanation │
└─────────────────────────────────────────┘
        ↓
Write final audit event
        ↓
Return concise structured output to agent
```

The protected side effect must never run before the decision completes.

---

# 13. Human approval broker

Because the application must work with the actual current WebMCP API, do not depend on a browser feature that may not exist in the current implementation.

Implement approval inside the page.

A sensitive tool's `execute` callback may return a Promise. For a `REQUIRE_APPROVAL` decision:

1. Create a pending approval object.
2. Render a modal in the shared human UI.
3. Await a Promise tied to that approval object.
4. If the user clicks **Approve once**, resolve `true` and continue execution.
5. If the user clicks **Deny**, resolve `false` and return a denial result.
6. Respect the WebMCP execution `AbortSignal`. If the agent/user cancels execution, dismiss the modal and clean up the pending request.

Suggested interface:

```ts
interface PendingApproval {
  id: string;
  action: GuardAction;
  decision: GuardDecision;
  createdAt: number;
  resolve: (approved: boolean) => void;
}
```

Only the human UI can resolve an approval.

Do not register an `approve_action` WebMCP tool, because that would let the agent approve itself.

---

# 14. WebMCP implementation requirements

The hackathon rewards deep WebMCP leverage. Use the API intentionally.

## 14.1 Use the imperative API directly

Use:

```ts
document.modelContext.registerTool(...)
```

Feature-detect it first.

Provide a clear UI warning if WebMCP is unavailable and link the user to local setup instructions.

## 14.2 Use structured JSON Schemas

Every tool should have:

- clear name,
- concise description,
- well-defined properties,
- required fields,
- enums where appropriate,
- helpful parameter descriptions.

Avoid vague or overlapping schemas.

## 14.3 Use annotations correctly

Use:

```ts
annotations: {
  readOnlyHint: true | false,
  untrustedContentHint: true | false
}
```

Examples:

- `search_products` → `readOnlyHint: true`
- `view_cart` → `readOnlyHint: true`
- `checkout_cart` → `readOnlyHint: false`
- a tool returning external/user-generated review content → `untrustedContentHint: true`

## 14.4 Register tools based on application state

This is a key WebMCP leverage feature.

Do not expose every possible tool at all times.

Examples:

- Register `checkout_cart` only when the cart is non-empty.
- Register `cancel_order` only after an order exists and is cancellable.
- Remove tools when the corresponding state is no longer valid.

Use `AbortController`-based registration lifecycles so old tools unregister safely.

This should naturally trigger WebMCP `toolchange` behavior.

## 14.5 Respect cancellation

Use the `signal` passed into a tool execution.

If a tool is waiting for approval and the signal aborts:

- remove pending UI,
- resolve/cleanup the approval promise,
- avoid performing the side effect.

## 14.6 Keep descriptions and outputs concise

Chrome's current security guidance recommends concise tool descriptions and outputs.

Avoid giant payloads.

Tool outputs should contain only the information necessary for the agent to understand the result and choose the next action.

---

# 15. WebMCP tools

Implement approximately these tools.

Do not blindly expose all of them simultaneously; follow the state rules above.

## 15.1 `get_policy_summary`

Read-only.

Purpose:

Let the agent understand its current boundaries without exposing sensitive internal implementation details.

Example output:

```json
{
  "autonomousPurchaseLimit": 50,
  "hardPurchaseLimit": 500,
  "recurringPurchases": "approval_required",
  "locationSharing": "blocked"
}
```

The policy is read-only from the agent's perspective.

---

## 15.2 `search_products`

Read-only.

Input:

```json
{
  "query": "noise canceling headphones",
  "maxPrice": 300
}
```

Return a compact list of matching product IDs, names, prices, ratings, and refundability.

---

## 15.3 `get_product`

Read-only.

Input:

```json
{
  "productId": "headphones-x1"
}
```

Return only necessary product details.

Optional stretch goal: include a user-generated review field and mark the tool output with `untrustedContentHint: true`.

---

## 15.4 `add_to_cart`

Low-risk mutation.

Input:

```json
{
  "productId": "headphones-x1",
  "quantity": 1
}
```

AgentGuard should classify this as `LOW_RISK_MUTATION` and allow it.

---

## 15.5 `view_cart`

Read-only.

Return:

- line items,
- total,
- whether all items are refundable.

---

## 15.6 `checkout_cart`

High-value guarded action.

No arbitrary amount should be accepted from the agent. The app must calculate the true cart total from application state.

Classify as `ONE_TIME_PURCHASE`.

The guard action should contain:

```ts
{
  type: "ONE_TIME_PURCHASE",
  amount: cart.total,
  currency: "USD",
  refundable: cart.items.every(item => item.refundable),
  label: "Purchase cart"
}
```

Only create the simulated order after AgentGuard returns `ALLOW` or the human approves.

---

## 15.7 `subscribe_plus`

Guarded recurring transaction.

Classify as `RECURRING_PURCHASE`.

Use a fictional price such as `$9.99/month`.

Default policy requires human approval.

---

## 15.8 `share_profile`

Guarded data disclosure.

Input should request a limited enum of fields rather than accepting arbitrary data:

```json
{
  "partnerId": "travel-partner",
  "fields": ["email", "location"]
}
```

AgentGuard evaluates the requested field names against `dataRules`.

The actual values must come from app state; the agent should not supply them.

This prevents the schema from encouraging unnecessary over-parameterization.

---

## 15.9 `delete_account`

Guarded destructive action.

This is simulated only.

Always require explicit human confirmation.

For extra clarity, the approval UI may require the human to type `DELETE` before enabling the final confirmation button.

The agent must not be able to supply that human confirmation through a WebMCP parameter.

---

## 15.10 `get_guard_activity`

Read-only.

Return the most recent small set of guard events so the agent can understand why a previous action was blocked.

Do not return a huge audit history.

---

# 16. Dynamic WebMCP state

The application should make stateful tool availability visible to the judges.

Suggested state behavior:

```text
Initial state
    search_products
    get_product
    add_to_cart
    get_policy_summary
    share_profile
    delete_account
    get_guard_activity

Cart becomes non-empty
    + view_cart
    + checkout_cart

Order is completed
    - checkout_cart if cart is emptied
    + cancel_order

Subscription becomes active
    - subscribe_plus
```

This demonstrates that WebMCP is not being used merely as a thin RPC wrapper. The available agent capabilities evolve with the product state.

---

# 17. Audit log

Every guarded tool invocation should produce audit events.

Suggested model:

```ts
interface AuditEvent {
  id: string;
  timestamp: number;
  toolName: string;
  actionType: GuardActionType;
  label: string;
  decision: "ALLOW" | "REQUIRE_APPROVAL" | "DENY";
  reasonCodes: string[];
  humanDecision?: "APPROVED" | "DENIED";
  result?: "EXECUTED" | "BLOCKED" | "CANCELLED" | "FAILED";
  amount?: number;
}
```

The Activity UI should visually distinguish:

- automatically allowed,
- approval requested,
- approved by human,
- denied by human,
- blocked by policy.

This is essential for the product's trust story.

---

# 18. UI and product experience

Build a polished interface that a judge can understand without reading code.

Recommended primary navigation:

```text
AgentGuard

Store | Guardrails | Activity | How it Works
```

## Store

A clean storefront containing approximately six fictional products with varied prices and refundability.

Include at least:

- one product below $50,
- one product around $250-$300,
- one product above $500,
- one non-refundable item.

Also show GuardMart Plus membership.

## Guardrails

Use human-friendly controls:

```text
Autonomous spending
$50

Hard purchase limit
$500

Session spending cap
$350

Recurring charges
[ Always ask me ]

Non-refundable purchases
[ Always ask me ]

Personal data
Email      Ask me
Location   Never
Phone      Never

Destructive actions
[ Always ask me ]
```

Add a small security note:

> These controls are human-only and are never exposed as agent-modifiable WebMCP tools.

## Activity

Timeline/card list showing every tool attempt and policy result.

Example:

```text
12:31:04 PM
checkout_cart
$279 purchase
Approval required
Reason: Above $50 autonomous limit
Human: Approved
Result: Executed
```

## How it Works

Simple flow diagram:

```text
Agent
  ↓ WebMCP
Guarded tool
  ↓
AgentGuard policy engine
  ↓
ALLOW / ASK / DENY
  ↓
Application action
```

Also explain the project's security model and limitations.

---

# 19. Approval modal requirements

This is the hero UI moment.

It must look intentional and trustworthy.

Show:

1. What the agent is trying to do.
2. Consequence.
3. Amount / recurrence / data fields when relevant.
4. Which user policy triggered approval.
5. Primary human controls.

Example:

```text
Agent action needs approval

Purchase NovaSound X1
$279.00 one-time
Refundable for 30 days

Why you're seeing this
This exceeds your $50 autonomous purchase limit.

[Deny]            [Approve once]
```

Do not allow background action execution while this modal is pending.

---

# 20. Suggested technology stack

Use a stack optimized for speed, reliability, and a polished demo.

Recommended:

- Next.js with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- Native `document.modelContext` WebMCP API
- `webmcp-types` for WebMCP TypeScript typings if useful
- React Context or a lightweight local store for app state
- `localStorage` for policies and audit history
- Vercel for deployment

Avoid unnecessary infrastructure.

Do not add a database, authentication system, payment processor, queue, or external AI API unless a concrete requirement appears.

The browser agent is the intelligence layer. AgentGuard itself should be mostly deterministic.

---

# 21. Suggested repository structure

```text
agentguard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── store/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── CartPanel.tsx
│   ├── guard/
│   │   ├── ApprovalModal.tsx
│   │   ├── GuardrailsPanel.tsx
│   │   ├── ActivityTimeline.tsx
│   │   ├── GuardDecisionBadge.tsx
│   │   └── WebMCPStatus.tsx
│   └── navigation/
│       └── Header.tsx
│
├── lib/
│   ├── agentguard/
│   │   ├── types.ts
│   │   ├── default-policy.ts
│   │   ├── policy-engine.ts
│   │   ├── guarded-tool.ts
│   │   ├── approval-broker.ts
│   │   ├── audit-store.ts
│   │   └── reason-codes.ts
│   │
│   ├── webmcp/
│   │   ├── register-tool.ts
│   │   ├── feature-detect.ts
│   │   ├── tool-schemas.ts
│   │   └── tools/
│   │       ├── search-products.ts
│   │       ├── get-product.ts
│   │       ├── add-to-cart.ts
│   │       ├── view-cart.ts
│   │       ├── checkout-cart.ts
│   │       ├── subscribe-plus.ts
│   │       ├── share-profile.ts
│   │       ├── delete-account.ts
│   │       └── get-guard-activity.ts
│   │
│   └── store/
│       ├── catalog.ts
│       ├── state.ts
│       └── selectors.ts
│
├── hooks/
│   ├── useWebMCPTool.ts
│   └── useAgentGuard.ts
│
├── evals/
│   ├── webmcp-evals.json
│   └── README.md
│
├── tests/
│   ├── policy-engine.test.ts
│   └── guarded-tool.test.ts
│
├── public/
│   └── ...
│
├── README.md
├── LICENSE
└── package.json
```

Adjust naming if needed, but preserve separation between:

- WebMCP registration,
- deterministic policy evaluation,
- approval UI,
- underlying application actions.

---

# 22. WebMCP registration hook

Create a small lifecycle-safe React hook.

Conceptually:

```ts
useEffect(() => {
  if (!document.modelContext) return;

  const controller = new AbortController();

  document.modelContext.registerTool(tool, {
    signal: controller.signal
  });

  return () => controller.abort();
}, [toolDependencyState]);
```

Be careful about duplicate registration and changing schemas.

Only register client-side.

Keep tool objects stable where possible.

---

# 23. Browser configuration

The project must be easy for judges to test.

WebMCP currently supports local testing through Chrome's WebMCP testing flag, and the hackathon rules state judges may test through ChatGPT's in-app browser or Chrome with WebMCP enabled.

Add a `WebMCPStatus` component that detects support:

```ts
const supported =
  typeof document !== "undefined" &&
  "modelContext" in document;
```

When unsupported, display concise setup guidance.

For hosting, ensure the app is served in a configuration compatible with WebMCP's origin-isolation and permissions requirements.

Review the current Chrome documentation while implementing headers. Prefer explicit secure defaults such as self-only tool permissions.

---

# 24. Testing requirements

## Deterministic unit tests

At minimum test the policy engine.

Cases:

1. $20 refundable purchase → `ALLOW`.
2. $279 refundable purchase → `REQUIRE_APPROVAL`.
3. $729 purchase → `DENY`.
4. $20 non-refundable purchase → `REQUIRE_APPROVAL`.
5. recurring subscription → `REQUIRE_APPROVAL`.
6. share email → `REQUIRE_APPROVAL`.
7. share location → `DENY`.
8. destructive action → `REQUIRE_APPROVAL`.
9. session spending cap is enforced.
10. aborted approval never executes the underlying action.

## WebMCP evals

Create eval fixtures for agent/tool behavior.

Examples:

### Search intent

User:

> “Find noise-canceling headphones under $300.”

Expected first relevant call:

```json
{
  "functionName": "search_products",
  "arguments": {
    "query": "noise canceling headphones",
    "maxPrice": 300
  }
}
```

### Purchase flow

User:

> “Buy the NovaSound X1 in my cart.”

Expected tool:

```text
checkout_cart
```

The application, not the agent, computes the price.

### Policy awareness

User:

> “What are you allowed to buy without asking me?”

Expected tool:

```text
get_policy_summary
```

### Data sharing

User:

> “Share my email and location with the travel partner.”

Expected tool:

```text
share_profile
```

AgentGuard then blocks or asks based on the deterministic data policy.

### Wrong-order behavior

If the agent calls `checkout_cart` with an empty cart, return an actionable result such as:

```json
{
  "status": "invalid_state",
  "message": "The cart is empty. Add an item before checkout."
}
```

Prefer state-based tool removal so this case is uncommon, but still guard the underlying action.

---

# 25. Reason codes

Use stable machine-readable codes.

Suggested set:

```text
AUTO_LIMIT_EXCEEDED
HARD_SPEND_LIMIT
SESSION_SPEND_LIMIT
RECURRING_CHARGE
NON_REFUNDABLE
DATA_FIELD_REQUIRES_APPROVAL
DATA_FIELD_BLOCKED
DESTRUCTIVE_ACTION
USER_DENIED
EXECUTION_CANCELLED
INVALID_STATE
```

Return human-readable reasons alongside the codes.

---

# 26. Security requirements

1. Never let the agent modify policies.
2. Never trust agent-supplied prices or account data.
3. Derive sensitive facts from application state.
4. Validate every tool input against its schema and business logic.
5. Respect WebMCP origin exposure defaults; do not broadly expose tools cross-origin.
6. Use `readOnlyHint` accurately.
7. Use `untrustedContentHint` when returning external or user-generated content.
8. Keep tool output concise.
9. Never perform sensitive side effects before policy evaluation completes.
10. A denied or cancelled action must produce no hidden side effect.
11. Approval tokens are one-time and scoped to the exact pending action.
12. Changing the action after approval invalidates the approval.
13. Do not store real payment credentials or real sensitive personal information.

---

# 27. Optional high-value stretch goals

Only implement these after the core demo is excellent.

## 27.1 Risk preview

Show a compact pre-execution card for approval-required actions with consequence metadata.

## 27.2 Session approvals

Add a human option such as:

> “Allow purchases up to $100 for this session.”

Do not let the agent create or modify this grant.

## 27.3 Red-team product content

Add a clearly labeled security demo containing untrusted product/review text with attempted prompt injection.

Mark relevant WebMCP output with `untrustedContentHint: true`.

The deterministic AgentGuard execution policy should still prevent an unauthorized side effect.

Do not make the entire demo depend on a particular model falling for prompt injection.

## 27.4 Cross-origin partner demo

If time permits, create a separate trusted partner origin and demonstrate WebMCP's explicit cross-origin exposure controls.

This is technically impressive but is not required for the MVP.

Do not sacrifice execution quality for it.

## 27.5 Developer SDK extraction

After the wrapper stabilizes, expose a clean reusable API such as:

```ts
createGuardedWebMCPTool(...)
```

Document how another website could integrate it.

This strengthens the impact story beyond GuardMart.

---

# 28. Features to avoid

Do not dilute the product with generic AI functionality.

Avoid:

- an embedded chatbot unless absolutely required,
- RAG,
- generic AI recommendations,
- a large backend,
- real financial transactions,
- authentication,
- a browser extension for the MVP,
- complex multi-user permissions,
- speculative blockchain components,
- policy generation by an LLM,
- an agent-accessible policy editor.

The key technical innovation is **safe execution of WebMCP actions**, not another AI assistant.

---

# 29. Judging-criteria strategy

## WebMCP Leverage

Target: excellent.

The implementation should visibly demonstrate:

- multiple meaningful WebMCP tools,
- JSON schemas,
- read-only vs mutating actions,
- annotations,
- application-state-dependent tool registration,
- tool lifecycle management,
- execution cancellation,
- multi-step agent journeys,
- graceful recovery from denials,
- WebMCP eval cases,
- actual state changes in the UI.

The project should be difficult to reproduce convincingly without WebMCP.

## Execution

Target: polished end-to-end product.

A judge should be able to:

1. open the live app,
2. understand the policy in seconds,
3. ask an agent to shop,
4. see an approval appear,
5. approve or deny it,
6. see the action complete or stop,
7. inspect a clear audit log.

No dead screens or fake buttons.

## Potential Impact

The pitch should focus on a specific emerging need:

> Websites need a practical way to expose powerful agent actions without forcing users into all-or-nothing trust.

AgentGuard provides a developer pattern for contextual delegation across money, recurring charges, data sharing, and destructive actions.

Do not claim universal browser security.

## Creativity & Ambition

The novel element is not merely “agent permissions.”

The differentiator is:

> **Policy-aware execution contracts layered directly around WebMCP tools, with deterministic runtime enforcement and human approval inside the shared web experience.**

The project explores a consent primitive that could become increasingly important as websites expose more consequential actions to agents.

---

# 30. Recommended build sequence

Build in this order.

## Milestone 1 — App shell

- Next.js + TypeScript + Tailwind.
- Header/navigation.
- Seeded product catalog.
- Cart state.
- Guardrails UI.
- Activity UI shell.

Verification:

Human-only site works correctly without WebMCP.

## Milestone 2 — Policy engine

- types,
- default policy,
- deterministic evaluator,
- reason codes,
- unit tests.

Verification:

All policy unit tests pass.

## Milestone 3 — Approval broker

- pending request store,
- approval modal,
- approve/deny,
- cancellation cleanup.

Verification:

A mocked protected action waits and cannot execute until approved.

## Milestone 4 — WebMCP registration layer

- feature detection,
- lifecycle hook,
- first read-only tool,
- first mutating tool.

Verification:

Tools appear in the WebMCP inspector and execute successfully.

## Milestone 5 — Core GuardMart tools

Implement:

- `get_policy_summary`,
- `search_products`,
- `get_product`,
- `add_to_cart`,
- `view_cart`,
- `checkout_cart`.

Verification:

The agent can complete the shopping flow.

## Milestone 6 — Guarded high-impact tools

Implement:

- `subscribe_plus`,
- `share_profile`,
- `delete_account`.

Verification:

Each action receives the expected ALLOW / ASK / DENY behavior.

## Milestone 7 — Dynamic state and audit

- state-dependent tool registration,
- unregister tools with AbortController lifecycle,
- Activity timeline,
- cancellation handling.

Verification:

Tool availability changes appropriately as state changes.

## Milestone 8 — Evals and polish

- WebMCP eval fixtures,
- empty/error states,
- mobile/desktop polish,
- accessibility,
- loading states,
- concise tool outputs,
- README cleanup.

## Milestone 9 — Submission readiness

- public deployment,
- public source repository,
- open-source license,
- testing instructions,
- final demo script,
- under-three-minute video.

---

# 31. Three-minute demo outline

Aim for approximately:

## 0:00–0:25 — Problem

Explain:

> WebMCP lets agents act reliably on websites. But a reliable purchase or account action still needs boundaries. AgentGuard lets users define those boundaries once and enforces them deterministically whenever an agent calls a sensitive WebMCP tool.

Show Guardrails screen briefly.

## 0:25–1:40 — Main agent workflow

Prompt:

> “Find me the best noise-canceling headphones under $300, buy them, and join Plus if it saves money.”

Show:

- search tool,
- cart state,
- checkout tool,
- $279 approval modal,
- human approval,
- completed order,
- recurring subscription approval,
- human denial.

## 1:40–2:20 — Why this is WebMCP-native

Show inspector/tool list or a small code view.

Call out:

- structured tool schemas,
- dynamic state-based tools,
- annotations,
- guarded execution,
- AbortSignal cancellation,
- structured denial recovery.

## 2:20–2:45 — Auditability

Show Activity timeline.

Explain that every attempted action has a policy decision, reason, human response, and final outcome.

## 2:45–3:00 — Vision

End with:

> “WebMCP gives agents hands. AgentGuard explores how websites can give humans durable control over what those hands are allowed to do.”

---

# 32. Acceptance criteria for the MVP

The MVP is complete only when all of these are true:

- [ ] Live site is polished and understandable without developer context.
- [ ] WebMCP support is feature-detected.
- [ ] At least six meaningful WebMCP tools work.
- [ ] At least three tools modify application state.
- [ ] At least three action classes are enforced by AgentGuard.
- [ ] `checkout_cart` uses application-calculated total, not agent-supplied price.
- [ ] A purchase below the autonomous limit can complete automatically.
- [ ] A medium purchase pauses for human approval and resumes after approval.
- [ ] A purchase above the hard limit is blocked without side effects.
- [ ] A recurring subscription requires approval.
- [ ] At least one data field can be blocked by policy.
- [ ] Policies cannot be edited through WebMCP.
- [ ] Tool registration changes with application state.
- [ ] WebMCP tool execution cancellation is handled.
- [ ] Audit events visibly record policy decisions.
- [ ] Denied actions return actionable structured responses.
- [ ] Core policy engine has deterministic tests.
- [ ] WebMCP eval fixtures cover major user journeys.
- [ ] Repository contains an open-source license.
- [ ] README contains run and WebMCP setup instructions.
- [ ] Public deployment works in a WebMCP-capable browser.

---

# 33. Definition of success

The product should leave a judge with one immediate thought:

> “If agents are going to perform consequential actions on websites, something like this needs to exist.”

The project wins when WebMCP is visibly central to the experience, the human approval moment feels natural rather than bolted on, and AgentGuard is presented as a credible reusable pattern rather than a one-off shopping demo.

---

# 34. Start coding now

Begin with **Milestone 1** and **Milestone 2**.

Create the application shell, seeded GuardMart catalog, shared state model, Guardrails screen, AgentGuard types, deterministic policy engine, reason codes, and unit tests.

Then implement the approval broker before registering sensitive WebMCP actions.

Do not skip directly to flashy UI or external APIs.

After each milestone:

1. run the app,
2. run tests,
3. fix TypeScript errors,
4. verify the previous workflow still works,
5. summarize what changed and what should be built next.

