import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new approval request
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    requestType: v.string(),
    targetId: v.string(),
    requestedBy: v.id("operators"),
    justification: v.optional(v.string()),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Insert approval record
    const approvalId = await ctx.db.insert("approvalRecords", {
      tenantId: args.tenantId,
      requestType: args.requestType,
      targetId: args.targetId,
      status: "PENDING",
      requestedBy: args.requestedBy,
    });

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "APPROVAL_REQUESTED",
      targetEntity: "approvalRecord",
      targetId: approvalId,
      operatorId: args.requestedBy,
      payload: {
        requestType: args.requestType,
        targetId: args.targetId,
        justification: args.justification,
        context: args.context,
      },
      timestamp: Date.now(),
    });

    return approvalId;
  },
});

/**
 * List approval records (optionally filter by status)
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("approvalRecords")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const records = await query.collect();

    // Enrich with operator details
    const enriched = await Promise.all(
      records.map(async (record) => {
        const requester = await ctx.db.get(record.requestedBy);
        const decider = record.decidedBy
          ? await ctx.db.get(record.decidedBy)
          : null;

        return {
          ...record,
          requesterName: requester?.name || "Unknown",
          requesterEmail: requester?.email || "",
          deciderName: decider?.name,
          deciderEmail: decider?.email,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get a specific approval record by ID
 */
export const get = query({
  args: {
    approvalId: v.id("approvalRecords"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.approvalId);

    if (!record) {
      return null;
    }

    // Enrich with operator details
    const requester = await ctx.db.get(record.requestedBy);
    const decider = record.decidedBy
      ? await ctx.db.get(record.decidedBy)
      : null;

    // Get related change records
    const changeRecords = await ctx.db
      .query("changeRecords")
      .withIndex("by_target", (q) =>
        q.eq("targetEntity", "approvalRecord").eq("targetId", args.approvalId)
      )
      .collect();

    return {
      ...record,
      requesterName: requester?.name || "Unknown",
      requesterEmail: requester?.email || "",
      deciderName: decider?.name,
      deciderEmail: decider?.email,
      changeRecords,
    };
  },
});

/**
 * Decide on an approval request (approve or deny)
 */
export const decide = mutation({
  args: {
    approvalId: v.id("approvalRecords"),
    decision: v.union(v.literal("APPROVED"), v.literal("DENIED")),
    decidedBy: v.id("operators"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.approvalId);

    if (!record) {
      throw new Error("Approval record not found");
    }

    if (record.status !== "PENDING") {
      throw new Error(
        `Cannot decide on approval with status: ${record.status}`
      );
    }

    // Update approval record
    await ctx.db.patch(args.approvalId, {
      status: args.decision,
      decidedBy: args.decidedBy,
    });

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: record.tenantId,
      type: "APPROVAL_DECIDED",
      targetEntity: "approvalRecord",
      targetId: args.approvalId,
      operatorId: args.decidedBy,
      payload: {
        decision: args.decision,
        reason: args.reason,
        requestType: record.requestType,
        targetId: record.targetId,
      },
      timestamp: Date.now(),
    });

    return {
      approvalId: args.approvalId,
      decision: args.decision,
      record,
    };
  },
});

/**
 * Cancel a pending approval request
 */
export const cancel = mutation({
  args: {
    approvalId: v.id("approvalRecords"),
    cancelledBy: v.id("operators"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.approvalId);

    if (!record) {
      throw new Error("Approval record not found");
    }

    if (record.status !== "PENDING") {
      throw new Error(
        `Cannot cancel approval with status: ${record.status}`
      );
    }

    // Only requester can cancel
    if (record.requestedBy !== args.cancelledBy) {
      throw new Error("Only the requester can cancel an approval request");
    }

    // Update approval record
    await ctx.db.patch(args.approvalId, {
      status: "CANCELLED",
    });

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: record.tenantId,
      type: "APPROVAL_CANCELLED",
      targetEntity: "approvalRecord",
      targetId: args.approvalId,
      operatorId: args.cancelledBy,
      payload: {
        reason: args.reason,
        requestType: record.requestType,
        targetId: record.targetId,
      },
      timestamp: Date.now(),
    });

    return args.approvalId;
  },
});

/**
 * Get pending approvals count for a tenant
 */
export const getPendingCount = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("approvalRecords")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .collect();

    return pending.length;
  },
});
