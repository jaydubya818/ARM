# Agent Runtime: Policy Evaluation & Cost Recording

This example shows how to call ARM from an agent runtime to:

1. **Evaluate a tool call** against a policy (allowed tools, cost limits)
2. **Record cost** when the decision is ALLOW

## Setup

From project root:

```bash
cd examples/agent-runtime-policy-cost
pnpm install
cd ../..
```

Set environment variables:

```bash
export CONVEX_URL=https://your-project.convex.cloud
```

For the evaluate script, you also need a policy ID from your ARM tenant:

```bash
# Get policy ID from ARM UI (Policies view) or Convex dashboard
export POLICY_ID=jd7abc123...
```

## Usage

### 1. Evaluate before tool execution (recommended)

Evaluates a tool call and records cost when allowed. Run from project root:

```bash
cd examples/agent-runtime-policy-cost
CONVEX_URL=https://your-project.convex.cloud POLICY_ID=your_policy_id pnpm run evaluate
```

Or with custom args (edit `evaluate-and-record-cost.js` or pass env):

```bash
POLICY_ID=xxx TOOL_ID=web_search pnpm run evaluate
```

### 2. Record cost directly (post-hoc)

For recording cost after LLM inference or tool execution without policy evaluation:

```bash
pnpm run record-cost
```

## Integration Pattern

In your agent runtime, call `evaluateAndRecordCost` **before** executing a tool:

```javascript
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.CONVEX_URL);
const result = await convex.action(api.policyEnvelopes.evaluateAndRecordCost, {
  policyId,
  toolId: "web_search",
  toolParams: { query: "..." },
  estimatedCost: 0.001,
});

if (result.decision === "DENY") throw new Error(result.reason);
if (result.decision === "NEEDS_APPROVAL") return { status: "needs_approval" };
// ALLOW - proceed with tool
```

See [docs/AGENT_RUNTIME_POLICY_COST.md](../../docs/AGENT_RUNTIME_POLICY_COST.md) for full details.
