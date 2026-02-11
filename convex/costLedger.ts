/**
 * Cost Ledger - Token usage and cost tracking
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Record a cost entry (used by evaluations, manual entry, or external inference services)
 */
export const record = mutation({
  args: {
    tenantId: v.id("tenants"),
    tokensUsed: v.number(),
    estimatedCost: v.number(),
    source: v.string(),
    versionId: v.optional(v.id("agentVersions")),
    instanceId: v.optional(v.id("agentInstances")),
    policyId: v.optional(v.id("policyEnvelopes")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("costLedger", {
      tenantId: args.tenantId,
      versionId: args.versionId,
      instanceId: args.instanceId,
      policyId: args.policyId,
      tokensUsed: args.tokensUsed,
      estimatedCost: args.estimatedCost,
      source: args.source,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

/**
 * List cost entries for a tenant with optional filters
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("costLedger")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc");

    let results = args.limit ? await q.take(args.limit) : await q.collect();

    if (args.startTime || args.endTime) {
      results = results.filter((r) => {
        if (args.startTime && r.timestamp < args.startTime) return false;
        if (args.endTime && r.timestamp > args.endTime) return false;
        return true;
      });
    }

    return results;
  },
});

/**
 * Get cost summary for a tenant (daily, weekly, monthly)
 */
export const getSummary = query({
  args: {
    tenantId: v.id("tenants"),
    period: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ms = { day: 86400e3, week: 604800e3, month: 2592e6 }[
      args.period ?? "month"
    ];
    const startTime = now - ms;

    const entries = await ctx.db
      .query("costLedger")
      .withIndex("by_tenant_time", (q) =>
        q.eq("tenantId", args.tenantId).gte("timestamp", startTime)
      )
      .collect();

    const totalTokens = entries.reduce((s, e) => s + e.tokensUsed, 0);
    const totalCost = entries.reduce((s, e) => s + e.estimatedCost, 0);

    return {
      totalTokens,
      totalCost,
      entryCount: entries.length,
      period: args.period ?? "month",
    };
  },
});
