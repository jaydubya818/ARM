import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new policy envelope
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    autonomyTier: v.number(),
    allowedTools: v.array(v.string()),
    costLimits: v.optional(v.object({
      dailyTokens: v.optional(v.number()),
      monthlyCost: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate autonomy tier (0-5)
    if (args.autonomyTier < 0 || args.autonomyTier > 5) {
      throw new Error("Autonomy tier must be between 0 and 5");
    }

    // Check for duplicate name
    const existing = await ctx.db
      .query("policyEnvelopes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error("Policy name must be unique within tenant");
    }

    // Insert policy
    const policyId = await ctx.db.insert("policyEnvelopes", {
      tenantId: args.tenantId,
      name: args.name,
      autonomyTier: args.autonomyTier,
      allowedTools: args.allowedTools,
      costLimits: args.costLimits,
    });

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "POLICY_CREATED",
      targetEntity: "policyEnvelope",
      targetId: policyId,
      payload: {
        name: args.name,
        autonomyTier: args.autonomyTier,
        toolCount: args.allowedTools.length,
      },
      timestamp: Date.now(),
    });

    return policyId;
  },
});

/**
 * List all policy envelopes for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("policyEnvelopes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

/**
 * Get a specific policy envelope by ID
 */
export const get = query({
  args: {
    policyId: v.id("policyEnvelopes"),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    
    if (!policy) {
      return null;
    }

    return policy;
  },
});

/**
 * Update a policy envelope
 */
export const update = mutation({
  args: {
    policyId: v.id("policyEnvelopes"),
    name: v.optional(v.string()),
    autonomyTier: v.optional(v.number()),
    allowedTools: v.optional(v.array(v.string())),
    costLimits: v.optional(v.object({
      dailyTokens: v.optional(v.number()),
      monthlyCost: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    
    if (!policy) {
      throw new Error("Policy not found");
    }

    // Validate autonomy tier if provided
    if (args.autonomyTier !== undefined && (args.autonomyTier < 0 || args.autonomyTier > 5)) {
      throw new Error("Autonomy tier must be between 0 and 5");
    }

    // Check for duplicate name if changing name
    if (args.name && args.name !== policy.name) {
      const existing = await ctx.db
        .query("policyEnvelopes")
        .withIndex("by_tenant", (q) => q.eq("tenantId", policy.tenantId))
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();

      if (existing) {
        throw new Error("Policy name must be unique within tenant");
      }
    }

    // Build update object
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.autonomyTier !== undefined) updates.autonomyTier = args.autonomyTier;
    if (args.allowedTools !== undefined) updates.allowedTools = args.allowedTools;
    if (args.costLimits !== undefined) updates.costLimits = args.costLimits;

    // Update policy
    await ctx.db.patch(args.policyId, updates);

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: policy.tenantId,
      type: "POLICY_UPDATED",
      targetEntity: "policyEnvelope",
      targetId: args.policyId,
      payload: {
        changes: Object.keys(updates),
      },
      timestamp: Date.now(),
    });

    return args.policyId;
  },
});

/**
 * Delete a policy envelope
 */
export const remove = mutation({
  args: {
    policyId: v.id("policyEnvelopes"),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    
    if (!policy) {
      throw new Error("Policy not found");
    }

    // Check if policy is attached to any instances
    const attachedInstances = await ctx.db
      .query("agentInstances")
      .withIndex("by_tenant", (q) => q.eq("tenantId", policy.tenantId))
      .filter((q) => q.eq(q.field("policyEnvelopeId"), args.policyId))
      .collect();

    if (attachedInstances.length > 0) {
      throw new Error(`Cannot delete policy: attached to ${attachedInstances.length} instance(s)`);
    }

    // Delete policy
    await ctx.db.delete(args.policyId);

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: policy.tenantId,
      type: "POLICY_DELETED",
      targetEntity: "policyEnvelope",
      targetId: args.policyId,
      payload: {
        name: policy.name,
      },
      timestamp: Date.now(),
    });

    return args.policyId;
  },
});
