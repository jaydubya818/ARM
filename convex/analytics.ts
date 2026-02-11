/**
 * Analytics & Metrics
 *
 * Time-series tracking, comparisons, and trend analysis.
 */

import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

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
      passRate: acc.passRate + normalizeRate(m.metrics.passRate),
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
    },
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
