/**
 * Evaluation Cron Jobs
 * 
 * Internal functions called by Convex cron scheduler.
 */

import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Process pending evaluation runs for all tenants
 * 
 * Called by cron job every 5 minutes.
 * Processes up to 5 pending runs per tenant.
 */
interface CronTenantResult {
  tenantId: string;
  tenantName: string;
  processed?: number;
  error?: string;
}

export const processPendingEvaluations = internalAction({
  handler: async (ctx): Promise<{ totalProcessed: number; tenants: CronTenantResult[]; timestamp: number }> => {
    console.log("Processing pending evaluations...");

    // Get all tenants
    const tenants = await ctx.runQuery(api.tenants.list);

    let totalProcessed = 0;
    const results: CronTenantResult[] = [];

    // Process pending runs for each tenant
    for (const tenant of tenants) {
      try {
        const result = await ctx.runAction(api.evaluationActions.processPendingRuns, {
          tenantId: tenant._id,
          limit: 5, // Process up to 5 runs per tenant
        });

        totalProcessed += result.processed;
        results.push({
          tenantId: tenant._id,
          tenantName: tenant.name,
          processed: result.processed,
        });

        console.log(`Processed ${result.processed} runs for tenant: ${tenant.name}`);
      } catch (error) {
        console.error(`Error processing tenant ${tenant.name}:`, error);
        results.push({
          tenantId: tenant._id,
          tenantName: tenant.name,
          error: (error as Error).message,
        });
      }
    }

    console.log(`Cron complete: ${totalProcessed} total runs processed`);

    return {
      totalProcessed,
      tenants: results,
      timestamp: Date.now(),
    };
  },
});

/**
 * Clean up old evaluation runs (future implementation)
 * 
 * Archives completed runs older than 90 days.
 */
export const cleanupOldRuns = internalMutation({
  handler: async (ctx): Promise<{ totalArchived: number; timestamp: number }> => {
    console.log("Cleaning up old evaluation runs...");

    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    // Get all tenants
    const tenants = await ctx.db.query("tenants").collect();

    let totalArchived = 0;

    for (const tenant of tenants) {
      // Find old completed runs
      const oldRuns = await ctx.db
        .query("evaluationRuns")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("status"), "COMPLETED"),
            q.lt(q.field("completedAt"), ninetyDaysAgo)
          )
        )
        .collect();

      // Archive runs (for now, just log - future: move to archive table)
      for (const run of oldRuns) {
        console.log(`Would archive run: ${run._id} (completed: ${new Date(run.completedAt || 0).toISOString()})`);
        totalArchived++;
      }
    }

    console.log(`Cleanup complete: ${totalArchived} runs would be archived`);

    return {
      totalArchived,
      timestamp: Date.now(),
    };
  },
});

/**
 * Health check for evaluation system
 * 
 * Monitors pending runs and alerts if backlog is growing.
 */
interface HealthCheckResult {
  tenantId: string;
  tenantName: string;
  status: "HEALTHY" | "WARNING";
  pendingCount: number;
  runningCount: number;
}

export const healthCheck = internalAction({
  handler: async (ctx): Promise<{ overall: string; tenants: HealthCheckResult[]; timestamp: number }> => {
    console.log("Evaluation system health check...");

    const tenants = await ctx.runQuery(api.tenants.list);

    const health: HealthCheckResult[] = [];

    for (const tenant of tenants) {
      const pending = await ctx.runQuery(api.evaluationRuns.getPending, {
        tenantId: tenant._id,
        limit: 100,
      });

      const running = await ctx.runQuery(api.evaluationRuns.list, {
        tenantId: tenant._id,
        status: "RUNNING",
      });

      const status: "HEALTHY" | "WARNING" = pending.length > 20 ? "WARNING" : "HEALTHY";

      health.push({
        tenantId: tenant._id as string,
        tenantName: tenant.name,
        status,
        pendingCount: pending.length,
        runningCount: running?.length || 0,
      });

      if (status === "WARNING") {
        console.warn(`High pending count for ${tenant.name}: ${pending.length} runs`);
      }
    }

    return {
      overall: health.every(h => h.status === "HEALTHY") ? "HEALTHY" : "WARNING",
      tenants: health,
      timestamp: Date.now(),
    };
  },
});

/**
 * One-time backfill: normalize legacy passRate values (>1 treated as 0-100 scale).
 * Run manually via: npx convex run internal:evaluationCron:normalizeLegacyPassRates
 */
export const normalizeLegacyPassRates = internalAction({
  args: {
    tenantId: v.optional(v.id("tenants")),
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenants = await ctx.runQuery(api.tenants.list);
    const targetTenants = args.tenantId
      ? tenants.filter((tenant) => tenant._id === args.tenantId)
      : tenants;

    if (args.tenantId && targetTenants.length === 0) {
      throw new Error("Tenant not found for normalization");
    }

    const results: Array<{
      tenantId: string;
      tenantName: string;
      normalizedRuns: number;
      normalizedMetrics: number;
    }> = [];

    for (const tenant of targetTenants) {
      const result = await ctx.runMutation(
        internal.evaluationCron.normalizeLegacyPassRatesForTenant,
        {
          tenantId: tenant._id,
          dryRun: args.dryRun,
          limit: args.limit,
        }
      );

      results.push({
        tenantId: tenant._id,
        tenantName: tenant.name,
        normalizedRuns: result.normalizedRuns,
        normalizedMetrics: result.normalizedMetrics,
      });
    }

    return {
      dryRun: args.dryRun ?? false,
      totalRuns: results.reduce((sum, r) => sum + r.normalizedRuns, 0),
      totalMetrics: results.reduce((sum, r) => sum + r.normalizedMetrics, 0),
      tenants: results,
      timestamp: Date.now(),
    };
  },
});

export const normalizeLegacyPassRatesForTenant = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("evaluationRuns")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const runsToNormalize = runs.filter(
      (run) => typeof run.passRate === "number" && Math.abs(run.passRate) > 1
    );

    const runTargets = args.limit ? runsToNormalize.slice(0, args.limit) : runsToNormalize;

    for (const run of runTargets) {
      const normalized = normalizeRate(run.passRate as number);
      if (!args.dryRun) {
        await ctx.db.patch(run._id, { passRate: normalized });
      }
    }

    const metrics = await ctx.db
      .query("evaluationMetrics")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const metricsToNormalize = metrics.filter(
      (metric) => Math.abs(metric.metrics.passRate) > 1
    );

    const metricTargets = args.limit ? metricsToNormalize.slice(0, args.limit) : metricsToNormalize;

    for (const metric of metricTargets) {
      const normalized = normalizeRate(metric.metrics.passRate);
      if (!args.dryRun) {
        await ctx.db.patch(metric._id, {
          metrics: {
            ...metric.metrics,
            passRate: normalized,
          },
        });
      }
    }

    return {
      normalizedRuns: runTargets.length,
      normalizedMetrics: metricTargets.length,
      dryRun: args.dryRun ?? false,
    };
  },
});

function normalizeRate(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.abs(value) > 1 ? value / 100 : value;
}
