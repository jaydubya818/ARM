/**
 * Audit Logs
 * 
 * Query and export audit trail.
 * 
 * GDPR/CCPA Compliance:
 * - IP addresses and user agents are anonymized before storage
 * - Configurable retention policy (default: 90 days)
 * - Legal basis: Legitimate interest for security and compliance
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { anonymizeIpAddress, anonymizeUserAgent } from "./utils/pii";

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
 * Clean up old audit logs based on retention policy
 * 
 * GDPR/CCPA Compliance:
 * - Implements data retention limits
 * - Default retention: 90 days
 * - Can be configured per tenant
 */
export const cleanupOldLogs = mutation({
  args: {
    tenantId: v.id("tenants"),
    retentionDays: v.optional(v.number()), // Default: 90 days
  },
  handler: async (ctx, args) => {
    const retentionDays = args.retentionDays || 90;
    const cutoffTimestamp = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    // Query old logs
    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.lt(q.field("timestamp"), cutoffTimestamp))
      .collect();
    
    // Delete old logs
    let deletedCount = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }
    
    return {
      deletedCount,
      cutoffTimestamp,
      retentionDays,
    };
  },
});

/**
 * Write an audit log entry
 * 
 * GDPR/CCPA Compliance:
 * - IP addresses are anonymized (last octet zeroed for IPv4, last 80 bits for IPv6)
 * - User agents are anonymized (version numbers and specific identifiers removed)
 * - Retention: Audit logs are subject to configurable TTL (default 90 days)
 * - Legal basis: Legitimate interest for security monitoring and compliance
 * 
 * IMPORTANT: ipAddress and userAgent fields are treated as sensitive PII
 * and are automatically anonymized before persistence. Do not use these
 * fields for user identification or tracking purposes.
 */
export const write = mutation({
  args: {
    tenantId: v.id("tenants"),
    operatorId: v.optional(v.id("operators")),
    action: v.string(),
    resource: v.string(),
    // Details can be any object - common fields are documented below
    // Standard fields: permission, reason, ipAddress (will be anonymized), userAgent (will be anonymized)
    // PII-safe fields: pseudonymousId, emailMasked, emailUpdated, roleUpdated, etc.
    details: v.any(),
    severity: v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("ERROR")
    ),
  },
  handler: async (ctx, args) => {
    // Anonymize PII fields if present in details
    const details = { ...args.details };
    
    // Anonymize IP address if present (e.g., 192.168.1.100 -> 192.168.1.0)
    if (details.ipAddress && typeof details.ipAddress === 'string') {
      details.ipAddress = anonymizeIpAddress(details.ipAddress);
    }
    
    // Anonymize user agent if present (remove version numbers and identifiers)
    if (details.userAgent && typeof details.userAgent === 'string') {
      details.userAgent = anonymizeUserAgent(details.userAgent);
    }
    
    const timestamp = Date.now();
    
    // Note: Retention policy enforcement
    // Audit logs older than the configured retention period (default: 90 days)
    // should be purged by a scheduled cleanup job (see evaluationCron.ts or similar)
    // Retention period can be configured per tenant in tenant settings
    
    return await ctx.db.insert("auditLogs", {
      tenantId: args.tenantId,
      operatorId: args.operatorId,
      action: args.action,
      resource: args.resource,
      details,
      severity: args.severity,
      timestamp,
    });
  },
});
