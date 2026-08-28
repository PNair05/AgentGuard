export interface WebMCPExecutionContext {
  signal?: AbortSignal;
}

export interface WebMCPToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: unknown, context: WebMCPExecutionContext) => unknown | Promise<unknown>;
}

export interface ModelContext extends EventTarget {
  registerTool(
    tool: WebMCPToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] }
  ): void | Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<unknown[]>;
  executeTool(tool: unknown, input: string, options?: { signal?: AbortSignal }): Promise<unknown>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}
