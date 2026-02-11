/**
 * Evaluation Runs
 * 
 * CRUD operations for evaluation runs (test suite executions).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * List evaluation runs for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let runsQuery = ctx.db
      .query("evaluationRuns")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));

    const runs = await runsQuery.collect();

    // Filter by status if provided
    if (args.status) {
      return runs.filter(r => r.status === args.status);
    }

    return runs;
  },
});

/**
 * Get evaluation runs for a specific version
 */
export const getByVersion = query({
  args: {
    versionId: v.id("agentVersions"),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("evaluationRuns")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .collect();

    return runs;
  },
});

/**
 * Get a specific evaluation run
 */
export const get = query({
  args: {
    runId: v.id("evaluationRuns"),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Evaluation run not found");
    }

    // Enrich with suite and version info
    const suite = await ctx.db.get(run.suiteId);
    const version = await ctx.db.get(run.versionId);

    return {
      run,
      suite,
      version,
    };
  },
});

/**
 * Create a new evaluation run
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    suiteId: v.id("evaluationSuites"),
    versionId: v.id("agentVersions"),
    triggeredBy: v.optional(v.id("operators")),
  },
  handler: async (ctx, args) => {
    // Verify suite exists
    const suite = await ctx.db.get(args.suiteId);
    if (!suite) {
      throw new Error("Evaluation suite not found");
    }

    // Verify version exists
    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error("Agent version not found");
    }

    // Check if there's already a pending/running evaluation for this version
    const existingRun = await ctx.db
      .query("evaluationRuns")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "PENDING"),
          q.eq(q.field("status"), "RUNNING")
        )
      )
      .first();

    if (existingRun) {
      throw new Error("Version already has a pending or running evaluation");
    }

    // Create run
    const runId = await ctx.db.insert("evaluationRuns", {
      tenantId: args.tenantId,
      suiteId: args.suiteId,
      versionId: args.versionId,
      status: "PENDING",
      triggeredBy: args.triggeredBy,
    });

    // Update version evalStatus to RUNNING
    await ctx.db.patch(args.versionId, {
      evalStatus: "RUNNING",
    });

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "EVAL_RUN_CREATED",
      targetEntity: "evaluationRun",
      targetId: runId,
      operatorId: args.triggeredBy,
      payload: {
        suiteId: args.suiteId,
        versionId: args.versionId,
        suiteName: suite.name,
        versionLabel: version.versionLabel,
      },
      timestamp: Date.now(),
    });

    return runId;
  },
});

/**
 * Update evaluation run status and results
 */
export const updateStatus = mutation({
  args: {
    runId: v.id("evaluationRuns"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("RUNNING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("CANCELLED")
    ),
    results: v.optional(v.array(v.object({
      testCaseId: v.string(),
      passed: v.boolean(),
      score: v.optional(v.number()),
      output: v.any(),
      error: v.optional(v.string()),
      executionTime: v.optional(v.number()),
    }))),
    overallScore: v.optional(v.number()),
    passRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Evaluation run not found");
    }

    const updates: any = {
      status: args.status,
    };

    // Set timestamps
    if (args.status === "RUNNING" && !run.startedAt) {
      updates.startedAt = Date.now();
    }

    if (args.status === "COMPLETED" || args.status === "FAILED" || args.status === "CANCELLED") {
      updates.completedAt = Date.now();
    }

    // Add results if provided
    if (args.results !== undefined) {
      updates.results = args.results;
    }

    if (args.overallScore !== undefined) {
      updates.overallScore = args.overallScore;
    }

    if (args.passRate !== undefined) {
      updates.passRate = args.passRate;
    }

    // Update run
    await ctx.db.patch(args.runId, updates);

    // Update version evalStatus based on run status
    if (args.status === "COMPLETED") {
      const passThreshold = 0.8; // 80% pass rate required (0-1)
      const evalStatus = (args.passRate || 0) >= passThreshold ? "PASS" : "FAIL";
      
      await ctx.db.patch(run.versionId, {
        evalStatus,
      });

      // Write change record for version eval status update
      await ctx.db.insert("changeRecords", {
        tenantId: run.tenantId,
        type: "VERSION_EVAL_COMPLETED",
        targetEntity: "agentVersion",
        targetId: run.versionId,
        payload: {
          runId: args.runId,
          evalStatus,
          passRate: args.passRate,
          overallScore: args.overallScore,
        },
        timestamp: Date.now(),
      });
    } else if (args.status === "FAILED") {
      await ctx.db.patch(run.versionId, {
        evalStatus: "FAIL",
      });
    } else if (args.status === "CANCELLED") {
      await ctx.db.patch(run.versionId, {
        evalStatus: "NOT_RUN",
      });
    }

    // Write change record for run status update
    await ctx.db.insert("changeRecords", {
      tenantId: run.tenantId,
      type: "EVAL_RUN_UPDATED",
      targetEntity: "evaluationRun",
      targetId: args.runId,
      payload: {
        status: args.status,
        passRate: args.passRate,
        overallScore: args.overallScore,
      },
      timestamp: Date.now(),
    });

    return args.runId;
  },
});

/**
 * Cancel a pending or running evaluation
 */
export const cancel = mutation({
  args: {
    runId: v.id("evaluationRuns"),
    cancelledBy: v.optional(v.id("operators")),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Evaluation run not found");
    }

    if (run.status !== "PENDING" && run.status !== "RUNNING") {
      throw new Error("Can only cancel pending or running evaluations");
    }

    // Update run status
    await ctx.db.patch(args.runId, {
      status: "CANCELLED",
      completedAt: Date.now(),
    });

    // Reset version evalStatus
    await ctx.db.patch(run.versionId, {
      evalStatus: "NOT_RUN",
    });

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: run.tenantId,
      type: "EVAL_RUN_CANCELLED",
      targetEntity: "evaluationRun",
      targetId: args.runId,
      operatorId: args.cancelledBy,
      payload: {
        previousStatus: run.status,
      },
      timestamp: Date.now(),
    });

    return args.runId;
  },
});

/**
 * Get pending evaluation runs (for runner to process)
 */
export const getPending = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("evaluationRuns")
      .withIndex("by_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "PENDING")
      )
      .take(args.limit || 10);

    return runs;
  },
});

/**
 * Get evaluation summary for a version
 */
export const getSummary = query({
  args: {
    versionId: v.id("agentVersions"),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("evaluationRuns")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .collect();

    const completed = runs.filter(r => r.status === "COMPLETED");
    const failed = runs.filter(r => r.status === "FAILED");
    const cancelled = runs.filter(r => r.status === "CANCELLED");
    const running = runs.filter(r => r.status === "RUNNING");
    const pending = runs.filter(r => r.status === "PENDING");

    const avgPassRate = completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.passRate || 0), 0) / completed.length
      : 0;

    const avgScore = completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completed.length
      : 0;

    return {
      versionId: args.versionId,
      totalRuns: runs.length,
      completed: completed.length,
      failed: failed.length,
      cancelled: cancelled.length,
      running: running.length,
      pending: pending.length,
      avgPassRate,
      avgScore,
      lastRunAt: runs.length > 0
        ? Math.max(...runs.map(r => r._creationTime))
        : undefined,
    };
  },
});
