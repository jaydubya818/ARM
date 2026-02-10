/**
 * Evaluation Cron Jobs
 * 
 * Internal functions called by Convex cron scheduler.
 */

import { internalAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Process pending evaluation runs for all tenants
 * 
 * Called by cron job every 5 minutes.
 * Processes up to 5 pending runs per tenant.
 */
export const processPendingEvaluations = internalAction({
  handler: async (ctx) => {
    console.log("🔄 Processing pending evaluations...");

    // Get all tenants
    const tenants = await ctx.runQuery(api.tenants.list);

    let totalProcessed = 0;
    const results = [];

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

        console.log(`✅ Processed ${result.processed} runs for tenant: ${tenant.name}`);
      } catch (error) {
        console.error(`❌ Error processing tenant ${tenant.name}:`, error);
        results.push({
          tenantId: tenant._id,
          tenantName: tenant.name,
          error: (error as Error).message,
        });
      }
    }

    console.log(`🎉 Cron complete: ${totalProcessed} total runs processed`);

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
  handler: async (ctx) => {
    console.log("🧹 Cleaning up old evaluation runs...");

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
        console.log(`📦 Would archive run: ${run._id} (completed: ${new Date(run.completedAt || 0).toISOString()})`);
        totalArchived++;
      }
    }

    console.log(`🎉 Cleanup complete: ${totalArchived} runs would be archived`);

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
export const healthCheck = internalAction({
  handler: async (ctx) => {
    console.log("🏥 Evaluation system health check...");

    const tenants = await ctx.runQuery(api.tenants.list);

    const health = [];

    for (const tenant of tenants) {
      const pending = await ctx.runQuery(api.evaluationRuns.getPending, {
        tenantId: tenant._id,
        limit: 100,
      });

      const running = await ctx.runQuery(api.evaluationRuns.list, {
        tenantId: tenant._id,
        status: "RUNNING",
      });

      const status = pending.length > 20 ? "WARNING" : "HEALTHY";

      health.push({
        tenantId: tenant._id,
        tenantName: tenant.name,
        status,
        pendingCount: pending.length,
        runningCount: running?.length || 0,
      });

      if (status === "WARNING") {
        console.warn(`⚠️ High pending count for ${tenant.name}: ${pending.length} runs`);
      }
    }

    return {
      overall: health.every(h => h.status === "HEALTHY") ? "HEALTHY" : "WARNING",
      tenants: health,
      timestamp: Date.now(),
    };
  },
});
