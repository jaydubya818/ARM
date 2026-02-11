#!/usr/bin/env node
/**
 * Example: Record cost directly (e.g. after LLM inference).
 * Run from project root: node examples/agent-runtime-policy-cost/record-cost-direct.js
 *
 * Requires: CONVEX_URL, TENANT_ID env vars
 * Optional: VERSION_ID, POLICY_ID for attribution
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
const TENANT_ID = process.env.TENANT_ID;

if (!CONVEX_URL) {
  console.error("Set CONVEX_URL");
  process.exit(1);
}
if (!TENANT_ID) {
  console.error("Set TENANT_ID (from ARM tenant, e.g. from tenants.list)");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("Recording cost to ledger...");
  await client.mutation(api.costLedger.record, {
    tenantId: TENANT_ID,
    tokensUsed: parseInt(process.env.TOKENS_USED || "1000", 10),
    estimatedCost: parseFloat(process.env.ESTIMATED_COST || "0.002"),
    source: process.env.SOURCE || "inference",
    versionId: process.env.VERSION_ID || undefined,
    policyId: process.env.POLICY_ID || undefined,
    metadata: { example: true },
  });
  console.log("Cost recorded successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
