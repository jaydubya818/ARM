/**
 * Audit Logs
 * 
 * Query and export audit trail.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List audit logs for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
    severity: v.optional(v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("ERROR")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc");

    if (args.severity) {
      query = query.filter((q) => q.eq(q.field("severity"), args.severity));
    }

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get audit logs for a specific operator
 */
export const getByOperator = query({
  args: {
    operatorId: v.id("operators"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get audit logs by time range
 */
export const getByTimeRange = query({
  args: {
    tenantId: v.id("tenants"),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", (q) => q.eq("timestamp", args.startTime))
      .filter((q) =>
        q.and(
          q.eq(q.field("tenantId"), args.tenantId),
          q.gte(q.field("timestamp"), args.startTime),
          q.lte(q.field("timestamp"), args.endTime)
        )
      )
      .collect();
  },
});

/**
 * Get audit logs by severity
 */
export const getBySeverity = query({
  args: {
    tenantId: v.id("tenants"),
    severity: v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("ERROR")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_severity", (q) =>
        q.eq("tenantId", args.tenantId).eq("severity", args.severity)
      )
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Search audit logs
 */
export const search = query({
  args: {
    tenantId: v.id("tenants"),
    action: v.optional(v.string()),
    resource: v.optional(v.string()),
    operatorId: v.optional(v.id("operators")),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .collect();

    // Apply filters
    if (args.action) {
      logs = logs.filter((log) => log.action === args.action);
    }

    if (args.resource) {
      const resourceFilter = args.resource;
      logs = logs.filter((log) => log.resource.includes(resourceFilter));
    }

    if (args.operatorId) {
      logs = logs.filter((log) => log.operatorId === args.operatorId);
    }

    if (args.startTime) {
      logs = logs.filter((log) => log.timestamp >= args.startTime!);
    }

    if (args.endTime) {
      logs = logs.filter((log) => log.timestamp <= args.endTime!);
    }

    // Apply limit
    if (args.limit) {
      logs = logs.slice(0, args.limit);
    }

    return logs;
  },
});

/**
 * Get audit statistics
 */
export const getStatistics = query({
  args: {
    tenantId: v.id("tenants"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Apply time filter
    if (args.startTime) {
      logs = logs.filter((log) => log.timestamp >= args.startTime!);
    }

    if (args.endTime) {
      logs = logs.filter((log) => log.timestamp <= args.endTime!);
    }

    // Calculate statistics
    const totalEvents = logs.length;
    const accessGranted = logs.filter((log) => log.action === "ACCESS_GRANTED").length;
    const accessDenied = logs.filter((log) => log.action === "ACCESS_DENIED").length;

    const bySeverity = {
      INFO: logs.filter((log) => log.severity === "INFO").length,
      WARNING: logs.filter((log) => log.severity === "WARNING").length,
      ERROR: logs.filter((log) => log.severity === "ERROR").length,
    };

    const byAction: Record<string, number> = {};
    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
    }

    return {
      totalEvents,
      accessGranted,
      accessDenied,
      bySeverity,
      byAction,
      timeRange: {
        start: args.startTime || logs[logs.length - 1]?.timestamp,
        end: args.endTime || logs[0]?.timestamp,
      },
    };
  },
});

/**
 * Write an audit log entry
 */
export const write = mutation({
  args: {
    tenantId: v.id("tenants"),
    operatorId: v.optional(v.id("operators")),
    action: v.string(),
    resource: v.string(),
    details: v.object({
      permission: v.optional(v.string()),
      reason: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    }),
    severity: v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("ERROR")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
