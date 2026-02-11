# Agent Runtime: Policy Evaluation & Cost Recording

Use `policyEnvelopes.evaluateAndRecordCost` from your agent runtime to enforce policy and record cost when tool calls are allowed.

**Runnable examples:** See `examples/agent-runtime-policy-cost/` in this repo.

## Overview

Before executing a tool call, your runtime should:

1. Evaluate the request against the policy (allowed tools, cost limits)
2. If the decision is `ALLOW`, proceed with the tool
3. Cost is recorded automatically when you pass `estimatedCost` or `tokensUsed`

## Convex Client Setup

In your agent runtime (Node.js, Python, etc.), use the Convex HTTP API or the `convex` npm package:

```bash
npm install convex
```

The agent runtime project should either:
- Be a Convex-linked package (run `npx convex dev` once) so you get generated `api`, or
- Call the Convex HTTP API directly (see [Convex HTTP API](https://docs.convex.dev/http-api))

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";  // from this repo or a shared package

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);
```

## Example: Evaluate Before Tool Execution

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";
import type { Id } from "./convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

async function executeWithPolicy(
  policyId: Id<"policyEnvelopes">,
  toolId: string,
  toolParams: Record<string, unknown>,
  estimatedCost?: number,
  tokensUsed?: number
) {
  const result = await convex.action(api.policyEnvelopes.evaluateAndRecordCost, {
    policyId,
    toolId,
    toolParams,
    estimatedCost,
    tokensUsed,
    versionId: process.env.AGENT_VERSION_ID,  // optional
    instanceId: process.env.AGENT_INSTANCE_ID, // optional
  });

  if (result.decision === "DENY") {
    throw new Error(`Policy denied: ${result.reason}`);
  }
  if (result.decision === "NEEDS_APPROVAL") {
    return { status: "needs_approval", reason: result.reason };
  }

  // ALLOW - proceed with tool execution
  // Cost is already recorded when estimatedCost or tokensUsed was provided
  return { status: "allowed" };
}
```

## Example: After LLM Inference

When your agent completes an LLM call, record cost:

```typescript
// After receiving LLM response
const tokensUsed = response.usage?.total_tokens ?? 0;
const estimatedCost = (tokensUsed / 1_000_000) * 2; // ~$2/1M tokens

await convex.action(api.policyEnvelopes.evaluateAndRecordCost, {
  policyId,
  toolId: "llm_completion",
  tokensUsed,
  estimatedCost,
});
```

Or use `costLedger.record` directly for post-hoc cost recording:

```typescript
await convex.mutation(api.costLedger.record, {
  tenantId,
  tokensUsed,
  estimatedCost,
  source: "inference",
  versionId,
  policyId,
  metadata: { model: "gpt-4", toolId: "llm_completion" },
});
```

## API Reference

See [API_REFERENCE.md](./API_REFERENCE.md#policyenvelopesevaluateandrecordcost) for full `evaluateAndRecordCost` arguments and return shape.
