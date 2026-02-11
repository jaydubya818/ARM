/**
 * Analytics & Metrics
 *
 * Time-series tracking, comparisons, and trend analysis.
 */

import { v } from 'convex/values';
import { mutation } from './_generated/server';

function normalizeRate(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.abs(value) > 1 ? value / 100 : value;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper functions

import { query } from './_generated/server';

/**
 * Get tenant statistics
 */
export const getTenantStatistics = query({
  args: {
    tenantId: v.id('tenants'),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (_ctx, args) => {
    // Placeholder implementation
    return {
      totalRuns: 0,
      uniqueVersions: 0,
      uniqueSuites: 0,
      averages: {
        overallScore: 0,
        passRate: 0,
        avgExecutionTime: 0,
      },
      topVersions: [],
      timeRange: {
        start: args.startTime,
        end: args.endTime,
      },
    };
  },
});

/**
 * Get trend data for a specific version
 */
export const getTrend = query({
  args: {
    versionId: v.id('agentVersions'),
    period: v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly')),
    limit: v.number(),
  },
  handler: async (_ctx, args) => {
    // Placeholder implementation
    return [];
  },
});

/**
 * Compare two versions
 */
export const compareVersions = query({
  args: {
    version1Id: v.id('agentVersions'),
    version2Id: v.id('agentVersions'),
  },
  handler: async (_ctx, args) => {
    // Placeholder implementation
    return {
      version1: { id: args.version1Id, metrics: { overallScore: 0, passRate: 0, avgExecutionTime: 0 }, sampleSize: 0 },
      version2: { id: args.version2Id, metrics: { overallScore: 0, passRate: 0, avgExecutionTime: 0 }, sampleSize: 0 },
      deltas: { overallScore: 0, passRate: 0, avgExecutionTime: 0 },
      improvement: { score: false, passRate: false, speed: false },
    };
  },
});

/**
 * Record evaluation metrics (called after evaluation run completes)
 */
export const recordEvaluationMetrics = mutation({
  args: {
    tenantId: v.id('tenants'),
    versionId: v.id('agentVersions'),
    suiteId: v.id('evaluationSuites'),
    runId: v.id('evaluationRuns'),
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
    const normalizedMetrics = {
      ...args.metrics,
      passRate: normalizeRate(args.metrics.passRate),
    };

    // Determine period (daily, weekly, monthly)
    const periods = [
      `daily-${date.toISOString().split('T')[0]}`,
      `weekly-${date.getFullYear()}-W${getWeekNumber(date)}`,
      `monthly-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    ];

    // Record metrics for each period
    for (const period of periods) {
      await ctx.db.insert('evaluationMetrics', {
        tenantId: args.tenantId,
        versionId: args.versionId,
        suiteId: args.suiteId,
        runId: args.runId,
        timestamp: now,
        metrics: normalizedMetrics,
        period,
      });
    }

    return { success: true, periods };
  },
});
