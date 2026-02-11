#!/usr/bin/env node
/**
 * Example: Evaluate a tool call against ARM policy and record cost.
 * Run from project root: node examples/agent-runtime-policy-cost/evaluate-and-record-cost.js
 *
 * Requires: CONVEX_URL, POLICY_ID env vars
 * Get POLICY_ID from ARM UI → Policies, or convex dashboard
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
const POLICY_ID = process.env.POLICY_ID;

if (!CONVEX_URL) {
  console.error("Set CONVEX_URL (or VITE_CONVEX_URL)");
  process.exit(1);
}
if (!POLICY_ID) {
  console.error("Set POLICY_ID (from ARM Policies view)");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("Evaluating tool call against policy...");
  const result = await client.action(api.policyEnvelopes.evaluateAndRecordCost, {
    policyId: POLICY_ID,
    toolId: process.env.TOOL_ID || "example_tool",
    toolParams: { example: true },
    estimatedCost: 0.001,
    tokensUsed: 500,
  });
  console.log("Result:", result);
  if (result.decision === "ALLOW") {
    console.log("Cost recorded. Proceed with tool execution.");
  } else if (result.decision === "DENY") {
    console.error("Blocked:", result.reason);
  } else {
    console.log("Needs approval:", result.reason);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
