/**
 * A/B Experiments
 *
 * Experiment management and variant assignment.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get assigned variant for operator (or assign if not yet assigned)
 */
export const getVariant = query({
  args: {
    experimentId: v.id("experiments"),
    operatorId: v.id("operators"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_experiment_operator", (q) =>
        q.eq("experimentId", args.experimentId).eq("operatorId", args.operatorId)
      )
      .first();

    return assignment?.variantId ?? null;
  },
});

/**
 * Assign variant to operator (called by mutation when needed)
 */
export const assignVariant = mutation({
  args: {
    experimentId: v.id("experiments"),
    operatorId: v.id("operators"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_experiment_operator", (q) =>
        q.eq("experimentId", args.experimentId).eq("operatorId", args.operatorId)
      )
      .first();

    if (existing) return existing.variantId;

    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment || experiment.status !== "RUNNING") return null;

    const variant = selectVariant(experiment.variants, args.operatorId);
    if (!variant) return null;

    await ctx.db.insert("experimentAssignments", {
      experimentId: args.experimentId,
      operatorId: args.operatorId,
      variantId: variant.id,
      assignedAt: Date.now(),
    });

    return variant.id;
  },
});

/**
 * Track experiment event (conversion, engagement, etc.)
 */
export const trackEvent = mutation({
  args: {
    experimentId: v.id("experiments"),
    operatorId: v.id("operators"),
    variantId: v.string(),
    eventType: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("experimentEvents", {
      experimentId: args.experimentId,
      operatorId: args.operatorId,
      variantId: args.variantId,
      eventType: args.eventType,
      payload: args.payload,
      timestamp: Date.now(),
    });
  },
});

/**
 * List experiments
 */
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("experiments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

/**
 * Get experiment
 */
export const get = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => ctx.db.get(args.experimentId),
});

/**
 * Create experiment
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    variants: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        weight: v.number(),
        config: v.optional(v.any()),
      })
    ),
    metrics: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.union(
            v.literal("conversion"),
            v.literal("engagement"),
            v.literal("custom")
          ),
        })
      )
    ),
    createdBy: v.id("operators"),
  },
  handler: async (ctx, args) => {
    const totalWeight = args.variants.reduce((s, v) => s + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error("Variant weights must sum to 100");
    }

    return await ctx.db.insert("experiments", {
      tenantId: args.tenantId,
      key: args.key,
      name: args.name,
      description: args.description,
      status: "DRAFT",
      variants: args.variants,
      metrics: args.metrics,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Start experiment
 */
export const start = mutation({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) throw new Error("Experiment not found");
    if (experiment.status !== "DRAFT")
      throw new Error("Only draft experiments can be started");

    await ctx.db.patch(args.experimentId, {
      status: "RUNNING",
      startDate: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get experiment results
 */
export const getResults = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("experimentEvents")
      .withIndex("by_experiment", (q) =>
        q.eq("experimentId", args.experimentId)
      )
      .collect();

    const byVariant: Record<
      string,
      { events: number; conversions: number; uniqueOperators: Set<string> }
    > = {};

    for (const e of events) {
      if (!byVariant[e.variantId]) {
        byVariant[e.variantId] = {
          events: 0,
          conversions: 0,
          uniqueOperators: new Set(),
        };
      }
      byVariant[e.variantId].events++;
      byVariant[e.variantId].uniqueOperators.add(e.operatorId);
      if (e.eventType === "conversion") {
        byVariant[e.variantId].conversions++;
      }
    }

    return Object.entries(byVariant).map(([variantId, data]) => ({
      variantId,
      eventCount: data.events,
      conversionCount: data.conversions,
      uniqueOperators: data.uniqueOperators.size,
    }));
  },
});

/**
 * Deterministic variant selection by operator ID
 */
function selectVariant(
  variants: Array<{ id: string; weight: number }>,
  operatorId: string
): (typeof variants)[0] | null {
  const hash = hashString(operatorId);
  const bucket = hash % 100;
  let acc = 0;
  for (const v of variants) {
    acc += v.weight;
    if (bucket < acc) return v;
  }
  return variants[variants.length - 1] ?? null;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
