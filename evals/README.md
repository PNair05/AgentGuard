# AgentGuard WebMCP evals

`webmcp-evals.json` follows the `messages` + `expectedCall` structure shown in Chrome's WebMCP eval documentation, with small AgentGuard-specific fields for policy and journey assertions.

The fixtures cover:

- direct tool selection and argument mapping;
- policy-awareness queries;
- dynamic cart-state tools;
- multi-step shopping order;
- data-disclosure denial;
- over-parameterized tool trust warnings and income blocking;
- remote versus local approval routing;
- prompt-injection resilience at the deterministic execution layer.

Run the deterministic companion coverage with:

```bash
npm run test:run
```

For probabilistic browser evaluation, open GuardMart with Chrome's WebMCP testing flag enabled, install the Model Context Tool Inspector, reset the in-memory app state, and run each user message several times. Record tool choice, arguments, order, final UI state, and AgentGuard decision separately.
