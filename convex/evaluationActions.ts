/**
 * Evaluation Actions
 * 
 * Convex actions for executing evaluation runs.
 * Actions can call external APIs and run longer than mutations.
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { executeTestSuite, calculateMetrics } from "./lib/evaluationRunner";

/**
 * Execute an evaluation run
 * 
 * This action:
 * 1. Fetches the run, suite, and version
 * 2. Executes all test cases
 * 3. Calculates metrics
 * 4. Updates the run with results
 */
export const executeRun = action({
  args: {
    runId: v.id("evaluationRuns"),
  },
  handler: async (ctx, args) => {
    // Get run details
    const runData = await ctx.runQuery(api.evaluationRuns.get, {
      runId: args.runId,
    });

    if (!runData.run || !runData.suite || !runData.version) {
      throw new Error("Run, suite, or version not found");
    }

    const { run, suite, version } = runData;

    // Update status to RUNNING
    await ctx.runMutation(api.evaluationRuns.updateStatus, {
      runId: args.runId,
      status: "RUNNING",
    });

    try {
      // Execute test suite
      const results = await executeTestSuite(
        suite.testCases,
        version._id
      );

      // Calculate metrics
      const metrics = calculateMetrics(results);

      // Update run with results
      await ctx.runMutation(api.evaluationRuns.updateStatus, {
        runId: args.runId,
        status: "COMPLETED",
        results,
        overallScore: metrics.overallScore,
        passRate: metrics.passRate,
      });

      // Record metrics for analytics (P3.0)
      await ctx.runMutation(api.analytics.recordEvaluationMetrics, {
        tenantId: run.tenantId,
        versionId: run.versionId,
        suiteId: run.suiteId,
        runId: args.runId,
        metrics: {
          overallScore: metrics.overallScore,
          passRate: metrics.passRate,
          avgExecutionTime: metrics.avgExecutionTime,
          testCaseCount: metrics.totalTests,
          passedCount: metrics.passed,
          failedCount: metrics.failed,
        },
      });

      // Create notification event (P3.0)
      await ctx.runMutation(api.notifications.createEvent, {
        tenantId: run.tenantId,
        type: "EVAL_COMPLETED",
        resourceType: "evaluationRun",
        resourceId: args.runId,
        payload: {
          suiteName: suite.name,
          versionLabel: version.versionLabel,
          passRate: metrics.passRate,
          overallScore: metrics.overallScore,
        },
      });

      return {
        runId: args.runId,
        status: "COMPLETED",
        metrics,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Get run details for notification
      let failedRunData: { run: typeof runData.run; suite: typeof runData.suite } | null = null;
      try {
        const data = await ctx.runQuery(api.evaluationRuns.get, {
          runId: args.runId,
        });
        failedRunData = { run: data.run, suite: data.suite };
      } catch {
        // Ignore errors fetching run data during failure handling
      }

      // Mark run as failed
      await ctx.runMutation(api.evaluationRuns.updateStatus, {
        runId: args.runId,
        status: "FAILED",
      });

      // Create notification event (P3.0)
      if (failedRunData?.run && failedRunData?.suite) {
        await ctx.runMutation(api.notifications.createEvent, {
          tenantId: failedRunData.run.tenantId,
          type: "EVAL_FAILED",
          resourceType: "evaluationRun",
          resourceId: args.runId,
          payload: {
            suiteName: failedRunData.suite.name,
            error: errorMessage,
          },
        });
      }

      throw error;
    }
  },
});

/**
 * Process pending evaluation runs
 * 
 * This action is designed to be called by a cron job.
 * It picks up pending runs and executes them.
 */
interface RunResult {
  runId: string;
  status: string;
  metrics?: unknown;
  error?: string;
}

export const processPendingRuns = action({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ processed: number; results: RunResult[] }> => {
    // Get pending runs
    const pendingRuns = await ctx.runQuery(api.evaluationRuns.getPending, {
      tenantId: args.tenantId,
      limit: args.limit || 5, // Process up to 5 runs at a time
    });

    const results: RunResult[] = [];

    // Execute each pending run
    for (const run of pendingRuns) {
      try {
        const result = await ctx.runAction(api.evaluationActions.executeRun, {
          runId: run._id,
        });
        results.push(result as RunResult);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to execute run ${run._id}:`, error);
        results.push({
          runId: run._id as string,
          status: "FAILED",
          error: errorMessage,
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  },
});
