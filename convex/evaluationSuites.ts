/**
 * Evaluation Suites
 * 
 * CRUD operations for evaluation suites (test case collections).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * List all evaluation suites for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const suites = await ctx.db
      .query("evaluationSuites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    return suites;
  },
});

/**
 * Get a specific evaluation suite by ID
 */
export const get = query({
  args: {
    suiteId: v.id("evaluationSuites"),
  },
  handler: async (ctx, args) => {
    const suite = await ctx.db.get(args.suiteId);
    if (!suite) {
      throw new Error("Evaluation suite not found");
    }
    return suite;
  },
});

/**
 * Create a new evaluation suite
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    testCases: v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      input: v.any(),
      expectedOutput: v.any(),
      scoringCriteria: v.optional(v.object({
        type: v.union(
          v.literal("exact_match"),
          v.literal("contains"),
          v.literal("similarity"),
          v.literal("custom")
        ),
        threshold: v.optional(v.number()),
        config: v.optional(v.any()),
      })),
    })),
    createdBy: v.id("operators"),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Validation
    if (!args.name.trim()) {
      throw new Error("Suite name is required");
    }

    if (args.testCases.length === 0) {
      throw new Error("At least one test case is required");
    }

    // Check for duplicate suite name
    const existing = await ctx.db
      .query("evaluationSuites")
      .withIndex("by_name", (q) =>
        q.eq("tenantId", args.tenantId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Evaluation suite with this name already exists");
    }

    // Validate test case IDs are unique
    const testCaseIds = args.testCases.map(tc => tc.id);
    const uniqueIds = new Set(testCaseIds);
    if (testCaseIds.length !== uniqueIds.size) {
      throw new Error("Test case IDs must be unique within suite");
    }

    // Create suite
    const suiteId = await ctx.db.insert("evaluationSuites", {
      tenantId: args.tenantId,
      name: args.name,
      description: args.description,
      testCases: args.testCases,
      createdBy: args.createdBy,
      tags: args.tags,
    });

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "EVAL_SUITE_CREATED",
      targetEntity: "evaluationSuite",
      targetId: suiteId,
      operatorId: args.createdBy,
      payload: {
        name: args.name,
        testCaseCount: args.testCases.length,
      },
      timestamp: Date.now(),
    });

    return suiteId;
  },
});

/**
 * Update an evaluation suite
 */
export const update = mutation({
  args: {
    suiteId: v.id("evaluationSuites"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    testCases: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      input: v.any(),
      expectedOutput: v.any(),
      scoringCriteria: v.optional(v.object({
        type: v.union(
          v.literal("exact_match"),
          v.literal("contains"),
          v.literal("similarity"),
          v.literal("custom")
        ),
        threshold: v.optional(v.number()),
        config: v.optional(v.any()),
      })),
    }))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const suite = await ctx.db.get(args.suiteId);
    if (!suite) {
      throw new Error("Evaluation suite not found");
    }

    const name = args.name;
    // Validate name if changing
    if (name && name !== suite.name) {
      if (!name.trim()) {
        throw new Error("Suite name is required");
      }

      const existing = await ctx.db
        .query("evaluationSuites")
        .withIndex("by_name", (q) =>
          q.eq("tenantId", suite.tenantId).eq("name", name)
        )
        .first();

      if (existing && existing._id !== args.suiteId) {
        throw new Error("Evaluation suite with this name already exists");
      }
    }

    // Validate test cases if provided
    if (args.testCases) {
      if (args.testCases.length === 0) {
        throw new Error("At least one test case is required");
      }

      const testCaseIds = args.testCases.map(tc => tc.id);
      const uniqueIds = new Set(testCaseIds);
      if (testCaseIds.length !== uniqueIds.size) {
        throw new Error("Test case IDs must be unique within suite");
      }
    }

    // Update suite
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.testCases !== undefined) updates.testCases = args.testCases;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.suiteId, updates);

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: suite.tenantId,
      type: "EVAL_SUITE_UPDATED",
      targetEntity: "evaluationSuite",
      targetId: args.suiteId,
      payload: {
        updates: Object.keys(updates),
      },
      timestamp: Date.now(),
    });

    return args.suiteId;
  },
});

/**
 * Delete an evaluation suite
 */
export const remove = mutation({
  args: {
    suiteId: v.id("evaluationSuites"),
  },
  handler: async (ctx, args) => {
    const suite = await ctx.db.get(args.suiteId);
    if (!suite) {
      throw new Error("Evaluation suite not found");
    }

    // Check if suite has any runs
    const runs = await ctx.db
      .query("evaluationRuns")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .first();

    if (runs) {
      throw new Error(
        "Cannot delete suite with existing evaluation runs. Archive runs first."
      );
    }

    // Delete suite
    await ctx.db.delete(args.suiteId);

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: suite.tenantId,
      type: "EVAL_SUITE_DELETED",
      targetEntity: "evaluationSuite",
      targetId: args.suiteId,
      payload: {
        name: suite.name,
      },
      timestamp: Date.now(),
    });

    return args.suiteId;
  },
});

/**
 * Get evaluation suites by tag
 */
export const getByTag = query({
  args: {
    tenantId: v.id("tenants"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const allSuites = await ctx.db
      .query("evaluationSuites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    return allSuites.filter(suite =>
      suite.tags?.includes(args.tag)
    );
  },
});

/**
 * Get test case statistics for a suite
 */
export const getStats = query({
  args: {
    suiteId: v.id("evaluationSuites"),
  },
  handler: async (ctx, args) => {
    const suite = await ctx.db.get(args.suiteId);
    if (!suite) {
      throw new Error("Evaluation suite not found");
    }

    // Get all runs for this suite
    const runs = await ctx.db
      .query("evaluationRuns")
      .withIndex("by_suite", (q) => q.eq("suiteId", args.suiteId))
      .collect();

    const completedRuns = runs.filter(r => r.status === "COMPLETED");
    const totalRuns = runs.length;
    const avgPassRate = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (r.passRate || 0), 0) / completedRuns.length
      : 0;

    return {
      suiteId: args.suiteId,
      name: suite.name,
      testCaseCount: suite.testCases.length,
      totalRuns,
      completedRuns: completedRuns.length,
      avgPassRate,
      lastRunAt: completedRuns.length > 0
        ? Math.max(...completedRuns.map(r => r.completedAt || 0))
        : undefined,
    };
  },
});
