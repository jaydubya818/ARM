/**
 * Analytics & Metrics
 * 
 * Time-series tracking, comparisons, and trend analysis.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Record evaluation metrics (called after evaluation run completes)
 */
export const recordEvaluationMetrics = mutation({
  args: {
    tenantId: v.id("tenants"),
    versionId: v.id("agentVersions"),
    suiteId: v.id("evaluationSuites"),
    runId: v.id("evaluationRuns"),
    metrics: v.object({
      overallScore: v.number(),
      passRate: v.number(),
      avgExecutionTime: v.number(),
      testCaseCount: v.number(),
      passedCount: v.number(),
      failedCount: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const date = new Date(now);
    
    // Determine period (daily, weekly, monthly)
    const periods = [
      `daily-${date.toISOString().split('T')[0]}`,
      `weekly-${date.getFullYear()}-W${getWeekNumber(date)}`,
      `monthly-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    ];

    // Record metrics for each period
    for (const period of periods) {
      await ctx.db.insert("evaluationMetrics", {
        tenantId: args.tenantId,
        versionId: args.versionId,
        suiteId: args.suiteId,
        runId: args.runId,
        timestamp: now,
        metrics: args.metrics,
        period,
      });
    }

    return { success: true, periods };
  },
});

/**
 * Get metrics for a specific version
 */
export const getVersionMetrics = query({
  args: {
    versionId: v.id("agentVersions"),
    period: v.optional(v.string()), // "daily", "weekly", "monthly"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("evaluationMetrics")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .order("desc");

    if (args.limit) {
      const metrics = await query.take(args.limit);
      if (args.period) {
        return metrics.filter((m) => m.period.startsWith(args.period!));
      }
      return metrics;
    }

    const metrics = await query.collect();
    if (args.period) {
      return metrics.filter((m) => m.period.startsWith(args.period!));
    }
    return metrics;
  },
});

/**
 * Get metrics for a specific suite
 */
export const getSuiteMetrics = query({
  args: {
    suiteId: v.id("evaluationSuites"),
    period: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("evaluationMetrics")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .order("desc");

    if (args.limit) {
      const metrics = await query.take(args.limit);
      if (args.period) {
        return metrics.filter((m) => m.period.startsWith(args.period!));
      }
      return metrics;
    }

    const metrics = await query.collect();
    if (args.period) {
      return metrics.filter((m) => m.period.startsWith(args.period!));
    }
    return metrics;
  },
});

/**
 * Get metrics by time range
 */
export const getMetricsByTimeRange = query({
  args: {
    tenantId: v.id("tenants"),
    startTime: v.number(),
    endTime: v.number(),
    versionId: v.optional(v.id("agentVersions")),
    suiteId: v.optional(v.id("evaluationSuites")),
  },
  handler: async (ctx, args) => {
    let metrics = await ctx.db
      .query("evaluationMetrics")
      .withIndex("by_timestamp", (q) =>
        q.eq("tenantId", args.tenantId).gte("timestamp", args.startTime)
      )
      .filter((q) => q.lte(q.field("timestamp"), args.endTime))
      .collect();

    if (args.versionId) {
      metrics = metrics.filter((m) => m.versionId === args.versionId);
    }

    if (args.suiteId) {
      metrics = metrics.filter((m) => m.suiteId === args.suiteId);
    }

    return metrics;
  },
});

/**
 * Compare two versions
 */
export const compareVersions = query({
  args: {
    version1Id: v.id("agentVersions"),
    version2Id: v.id("agentVersions"),
    suiteId: v.optional(v.id("evaluationSuites")),
  },
  handler: async (ctx, args) => {
    // Get metrics for both versions
    const metrics1 = await ctx.db
      .query("evaluationMetrics")
      .withIndex("by_version", (q) => q.eq("versionId", args.version1Id))
      .collect();

    const metrics2 = await ctx.db
      .query("evaluationMetrics")
      .withIndex("by_version", (q) => q.eq("versionId", args.version2Id))
      .collect();

    // Filter by suite if specified
    const filtered1 = args.suiteId
      ? metrics1.filter((m) => m.suiteId === args.suiteId)
      : metrics1;

    const filtered2 = args.suiteId
      ? metrics2.filter((m) => m.suiteId === args.suiteId)
      : metrics2;

    // Calculate averages
    const avg1 = calculateAverages(filtered1);
    const avg2 = calculateAverages(filtered2);

    // Calculate deltas
    const deltas = {
      overallScore: avg2.overallScore - avg1.overallScore,
      passRate: avg2.passRate - avg1.passRate,
      avgExecutionTime: avg2.avgExecutionTime - avg1.avgExecutionTime,
    };

    return {
      version1: {
        id: args.version1Id,
        metrics: avg1,
        sampleSize: filtered1.length,
      },
      version2: {
        id: args.version2Id,
        metrics: avg2,
        sampleSize: filtered2.length,
      },
      deltas,
      improvement: {
        score: deltas.overallScore > 0,
        passRate: deltas.passRate > 0,
        speed: deltas.avgExecutionTime < 0, // Lower is better
      },
    };
  },
});

/**
 * Get trend analysis for a version
 */
export const getTrend = query({
  args: {
    versionId: v.id("agentVersions"),
    period: v.string(), // "daily", "weekly", "monthly"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allMetrics = await ctx.db
      .query("evaluationMetrics")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .order("desc")
      .collect();

    // Post-filter: startsWith is not available on Convex filter expressions
    const metrics = allMetrics.filter((m) => m.period.startsWith(args.period));

    const limited = args.limit ? metrics.slice(0, args.limit) : metrics;

    // Group by period
    const grouped: Record<string, typeof metrics> = {};
    for (const metric of limited) {
      if (!grouped[metric.period]) {
        grouped[metric.period] = [];
      }
      grouped[metric.period].push(metric);
    }

    // Calculate averages per period
    const trend = Object.entries(grouped).map(([period, periodMetrics]) => ({
      period,
      metrics: calculateAverages(periodMetrics),
      sampleSize: periodMetrics.length,
    }));

    // Sort by period
    trend.sort((a, b) => a.period.localeCompare(b.period));

    return trend;
  },
});

/**
 * Get aggregate statistics for tenant
 */
export const getTenantStatistics = query({
  args: {
    tenantId: v.id("tenants"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let metrics = await ctx.db
      .query("evaluationMetrics")
      .withIndex("by_timestamp", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Apply time filters
    if (args.startTime) {
      metrics = metrics.filter((m) => m.timestamp >= args.startTime!);
    }

    if (args.endTime) {
      metrics = metrics.filter((m) => m.timestamp <= args.endTime!);
    }

    // Calculate overall statistics
    const totalRuns = metrics.length;
    const uniqueVersions = new Set(metrics.map((m) => m.versionId)).size;
    const uniqueSuites = new Set(metrics.map((m) => m.suiteId)).size;

    const averages = calculateAverages(metrics);

    // Get top performing versions
    const versionScores: Record<string, { total: number; count: number }> = {};
    for (const metric of metrics) {
      const versionId = metric.versionId;
      if (!versionScores[versionId]) {
        versionScores[versionId] = { total: 0, count: 0 };
      }
      versionScores[versionId].total += metric.metrics.overallScore;
      versionScores[versionId].count += 1;
    }

    const topVersions = Object.entries(versionScores)
      .map(([versionId, data]) => ({
        versionId,
        avgScore: data.total / data.count,
        runCount: data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    return {
      totalRuns,
      uniqueVersions,
      uniqueSuites,
      averages,
      topVersions,
      timeRange: {
        start: args.startTime || metrics[metrics.length - 1]?.timestamp,
        end: args.endTime || metrics[0]?.timestamp,
      },
    };
  },
});

// Helper functions

function calculateAverages(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      overallScore: 0,
      passRate: 0,
      avgExecutionTime: 0,
      testCaseCount: 0,
      passedCount: 0,
      failedCount: 0,
    };
  }

  const sums = metrics.reduce(
    (acc, m) => ({
      overallScore: acc.overallScore + m.metrics.overallScore,
      passRate: acc.passRate + m.metrics.passRate,
      avgExecutionTime: acc.avgExecutionTime + m.metrics.avgExecutionTime,
      testCaseCount: acc.testCaseCount + m.metrics.testCaseCount,
      passedCount: acc.passedCount + m.metrics.passedCount,
      failedCount: acc.failedCount + m.metrics.failedCount,
    }),
    {
      overallScore: 0,
      passRate: 0,
      avgExecutionTime: 0,
      testCaseCount: 0,
      passedCount: 0,
      failedCount: 0,
    }
  );

  return {
    overallScore: sums.overallScore / metrics.length,
    passRate: sums.passRate / metrics.length,
    avgExecutionTime: sums.avgExecutionTime / metrics.length,
    testCaseCount: sums.testCaseCount / metrics.length,
    passedCount: sums.passedCount / metrics.length,
    failedCount: sums.failedCount / metrics.length,
  };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
