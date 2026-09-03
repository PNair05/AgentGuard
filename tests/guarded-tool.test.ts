import { describe, expect, it, vi } from "vitest";
import { ApprovalBroker } from "@/lib/agentguard/approval-broker";
import { DEFAULT_POLICY } from "@/lib/agentguard/default-policy";
import { guardedWebMCPTool } from "@/lib/agentguard/guarded-tool";
import type { AuditEvent } from "@/lib/agentguard/types";

function harness() {
  const broker = new ApprovalBroker();
  const events: AuditEvent[] = [];
  const appendAudit = (event: AuditEvent) => events.push(event);
  const updateAudit = (id: string, patch: Partial<AuditEvent>) => {
    const index = events.findIndex((event) => event.id === id);
    if (index >= 0) events[index] = { ...events[index], ...patch };
  };
  return { broker, events, appendAudit, updateAudit };
}

describe("guardedWebMCPTool", () => {
  it("never executes an action when approval is aborted", async () => {
    const { broker, events, appendAudit, updateAudit } = harness();
    const controller = new AbortController();
    let executions = 0;
    const execute = guardedWebMCPTool(
      {
        toolName: "checkout_cart",
        classify: () => ({
          type: "PURCHASE" as const,
          toolName: "checkout_cart",
          label: "Purchase NovaSound X1",
          amount: 279,
          refundable: true
        }),
        execute: () => {
          executions += 1;
          return { status: "completed" };
        }
      },
      {
        getPolicy: () => DEFAULT_POLICY,
        getContext: () => ({ userId: "test-user", sessionSpent: 0 }),
        requestApproval: broker.request.bind(broker),
        appendAudit,
        updateAudit
      }
    );

    const pending = execute({}, controller.signal);
    await vi.waitFor(() => expect(broker.getSnapshot()?.action.amount).toBe(279));
    controller.abort();
    const result = await pending;

    expect(executions).toBe(0);
    expect(result).toMatchObject({ status: "cancelled" });
    expect(events[0].result).toBe("CANCELLED");
    expect(broker.getSnapshot()).toBeNull();
  });

  it("executes exactly once after explicit approval", async () => {
    const { broker, events, appendAudit, updateAudit } = harness();
    let executions = 0;
    const execute = guardedWebMCPTool(
      {
        toolName: "checkout_cart",
        classify: () => ({
          type: "PURCHASE" as const,
          toolName: "checkout_cart",
          label: "Purchase NovaSound X1",
          amount: 279,
          refundable: true,
          resourceId: "headphones-x1:1"
        }),
        getCurrentAction: () => ({
          type: "PURCHASE" as const,
          toolName: "checkout_cart",
          label: "Purchase NovaSound X1",
          amount: 279,
          refundable: true,
          resourceId: "headphones-x1:1"
        }),
        execute: () => ({ status: "completed", count: ++executions })
      },
      {
        getPolicy: () => DEFAULT_POLICY,
        getContext: () => ({ userId: "test-user", sessionSpent: 0 }),
        requestApproval: broker.request.bind(broker),
        appendAudit,
        updateAudit
      }
    );

    const pending = execute({});
    await vi.waitFor(() => expect(broker.getSnapshot()).not.toBeNull());
    const approval = broker.getSnapshot();
    expect(approval).not.toBeNull();
    broker.respond(approval!.id, true);
    const result = await pending;

    expect(result).toEqual({ status: "completed", count: 1 });
    expect(executions).toBe(1);
    expect(events[0]).toMatchObject({ result: "EXECUTED", humanDecision: "APPROVED" });
  });

  it("invalidates approval when the protected action changes", async () => {
    const { broker, events, appendAudit, updateAudit } = harness();
    let amount = 279;
    let executions = 0;
    const action = () => ({
      type: "PURCHASE" as const,
      toolName: "checkout_cart",
      label: "Purchase cart",
      amount,
      refundable: true,
      resourceId: `cart:${amount}`
    });
    const execute = guardedWebMCPTool(
      { toolName: "checkout_cart", classify: action, getCurrentAction: action, execute: () => ++executions },
      {
        getPolicy: () => DEFAULT_POLICY,
        getContext: () => ({ userId: "test-user", sessionSpent: 0 }),
        requestApproval: broker.request.bind(broker),
        appendAudit,
        updateAudit
      }
    );

    const pending = execute({});
    await vi.waitFor(() => expect(broker.getSnapshot()).not.toBeNull());
    amount = 299;
    broker.respond(broker.getSnapshot()!.id, true);
    const result = await pending;

    expect(executions).toBe(0);
    expect(result).toMatchObject({ status: "invalid_state", reasonCodes: ["ACTION_CHANGED"] });
    expect(events[0].result).toBe("BLOCKED");
  });

  it("expires an approval without running the protected side effect", async () => {
    const { events, appendAudit, updateAudit } = harness();
    const broker = new ApprovalBroker({ timeoutMs: 10 });
    let executions = 0;
    const execute = guardedWebMCPTool(
      {
        toolName: "checkout_cart",
        classify: () => ({ type: "PURCHASE" as const, toolName: "checkout_cart", label: "Purchase", amount: 279 }),
        execute: () => ++executions
      },
      {
        getPolicy: () => DEFAULT_POLICY,
        getContext: () => ({ userId: "test-user", sessionSpent: 0 }),
        requestApproval: broker.request.bind(broker),
        appendAudit,
        updateAudit
      }
    );

    const result = await execute({});
    expect(result).toMatchObject({ status: "expired", recoverable: true });
    expect(executions).toBe(0);
    expect(events[0]).toMatchObject({ result: "EXPIRED", executionStatus: "NOT_STARTED" });
  });

  it("records postcondition verification separately from execution", async () => {
    const { events, appendAudit, updateAudit } = harness();
    const execute = guardedWebMCPTool(
      {
        toolName: "add_to_cart",
        classify: () => ({ type: "REVERSIBLE_WRITE" as const, toolName: "add_to_cart", label: "Add item" }),
        execute: () => ({ added: true }),
        verify: () => ({ success: true, message: "Cart state contains the item." })
      },
      {
        getPolicy: () => DEFAULT_POLICY,
        getContext: () => ({ userId: "test-user", sessionSpent: 0 }),
        requestApproval: async () => "approved",
        appendAudit,
        updateAudit
      }
    );

    await execute({});
    expect(events[0]).toMatchObject({
      result: "EXECUTED",
      executionStatus: "SUCCESS",
      verificationStatus: "SUCCESS"
    });
    expect(events[0].reasonCodes).toContain("VERIFICATION_SUCCESS");
  });
});
