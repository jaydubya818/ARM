/**
 * Custom Scoring Functions
 *
 * Registry and execution sandbox for custom JavaScript scoring functions.
 */

import { v } from 'convex/values';
import ivm from 'isolated-vm';
import { query, mutation, action } from './_generated/server';
import { api } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';

type ExecutionArgs = {
  input: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
};

type ExecutionResult = {
  success: boolean;
  score?: number;
  error?: string;
  executionTime: number;
};

type FunctionExample = Doc<'customScoringFunctions'>['metadata']['examples'][number];

async function runCustomFunction(
  func: Doc<'customScoringFunctions'>,
  args: ExecutionArgs,
): Promise<ExecutionResult> {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();
  const jail = context.global;
  await jail.set('global', jail.derefInto());

  const code = `
    "use strict";
    ${func.code}
  `;

  const script = await isolate.compileScript(code);

  const startTime = Date.now();
  try {
    await script.run(context, { timeout: 5000 });
    const result = await context.global.get('score');

    if (typeof result !== 'number') {
      throw new Error('Function must produce a numeric score');
    }

    if (result < 0 || result > 1) {
      throw new Error('Function must return a score between 0 and 1');
    }

    return {
      success: true,
      score: result,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      executionTime: Date.now() - startTime,
    };
  } finally {
    isolate.dispose();
  }
}

/**
 * List all custom scoring functions for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id('tenants'),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('customScoringFunctions')
      .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId));

    if (args.activeOnly) {
      return await query
        .filter((q) => q.eq(q.field('isActive'), true))
        .collect();
    }

    return await query.collect();
  },
});

/**
 * Get a specific custom function
 */
export const get = query({
  args: {
    functionId: v.id('customScoringFunctions'),
  },
  handler: async (ctx, args) => await ctx.db.get(args.functionId),
});

/**
 * Get function by name
 */
export const getByName = query({
  args: {
    tenantId: v.id('tenants'),
    name: v.string(),
  },
  handler: async (ctx, args) => await ctx.db
    .query('customScoringFunctions')
    .withIndex('by_name', (q) => q.eq('tenantId', args.tenantId).eq('name', args.name))
    .first(),
});

/**
 * Create a new custom scoring function
 */
export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    name: v.string(),
    description: v.string(),
    code: v.string(),
    createdBy: v.id('operators'),
    metadata: v.object({
      parameters: v.array(v.object({
        name: v.string(),
        type: v.string(),
        required: v.boolean(),
        default: v.optional(v.any()),
      })),
      returnType: v.string(),
      examples: v.array(v.object({
        input: v.any(),
        expectedOutput: v.any(),
        actualOutput: v.any(),
        score: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => await ctx.db.atomic(async (tx) => {
    // Validate function name
    if (!args.name.trim()) {
      throw new Error('Function name is required');
    }

    // Check for duplicate name
    const existing = await tx
      .query('customScoringFunctions')
      .withIndex('by_name', (q) => q.eq('tenantId', args.tenantId).eq('name', args.name))
      .first();

    if (existing) {
      throw new Error(`Function with name "${args.name}" already exists`);
    }

    // Validate code (basic syntax check)
    try {
      new Function(args.code);
    } catch (error) {
      throw new Error(`Invalid JavaScript code: ${(error as Error).message}`);
    }

    // Create function
    const now = Date.now();
    const functionId = await tx.insert('customScoringFunctions', {
      tenantId: args.tenantId,
      name: args.name,
      description: args.description,
      code: args.code,
      language: 'javascript',
      version: 1,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      metadata: args.metadata,
    });

    // Write change record
    await tx.insert('changeRecords', {
      tenantId: args.tenantId,
      type: 'CUSTOM_FUNCTION_CREATED',
      targetEntity: 'customScoringFunction',
      targetId: functionId,
      payload: {
        name: args.name,
        version: 1,
      },
      timestamp: now,
    });

    return functionId;
  }),
});

/**
 * Update a custom scoring function
 */
export const update = mutation({
  args: {
    functionId: v.id('customScoringFunctions'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    code: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    metadata: v.optional(v.object({
      parameters: v.array(v.object({
        name: v.string(),
        type: v.string(),
        required: v.boolean(),
        default: v.optional(v.any()),
      })),
      returnType: v.string(),
      examples: v.array(v.object({
        input: v.any(),
        expectedOutput: v.any(),
        actualOutput: v.any(),
        score: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => await ctx.db.atomic(async (tx) => {
    const func = await tx.get(args.functionId);
    if (!func) {
      throw new Error('Function not found');
    }

    // Validate code if provided
    if (args.code) {
      try {
        new Function(args.code);
      } catch (error) {
        throw new Error(`Invalid JavaScript code: ${(error as Error).message}`);
      }
    }

    // Check for duplicate name if changing name
    if (args.name && args.name !== func.name) {
      const existing = await tx
        .query('customScoringFunctions')
        .withIndex('by_name', (q) => q.eq('tenantId', func.tenantId).eq('name', args.name!))
        .first();

      if (existing) {
        throw new Error(`Function with name "${args.name}" already exists`);
      }
    }

    // Update function
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.code !== undefined) {
      updates.code = args.code;
      updates.version = func.version + 1;
    }
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    await tx.patch(args.functionId, updates);

    // Write change record
    await tx.insert('changeRecords', {
      tenantId: func.tenantId,
      type: 'CUSTOM_FUNCTION_UPDATED',
      targetEntity: 'customScoringFunction',
      targetId: args.functionId,
      payload: {
        name: args.name || func.name,
        version: updates.version || func.version,
      },
      timestamp: Date.now(),
    });

    return args.functionId;
  }),
});

/**
 * Delete a custom scoring function
 */
export const remove = mutation({
  args: {
    functionId: v.id('customScoringFunctions'),
  },
  handler: async (ctx, args) => await ctx.db.atomic(async (tx) => {
    const func = await tx.get(args.functionId);
    if (!func) {
      throw new Error('Function not found');
    }

    // Delete function
    await tx.delete(args.functionId);

    // Write change record
    await tx.insert('changeRecords', {
      tenantId: func.tenantId,
      type: 'CUSTOM_FUNCTION_DELETED',
      targetEntity: 'customScoringFunction',
      targetId: args.functionId,
      payload: {
        name: func.name,
        version: func.version,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  }),
});

/**
 * Execute a custom scoring function (sandboxed)
 */
export const execute = action({
  args: {
    functionId: v.id('customScoringFunctions'),
    input: v.any(),
    expectedOutput: v.any(),
    actualOutput: v.any(),
  },
  handler: async (ctx, args): Promise<ExecutionResult> => {
    // Get function via proper query reference
    const func = await ctx.runQuery(api.customScoringFunctions.get, {
      functionId: args.functionId,
    }) as Doc<'customScoringFunctions'> | null;

    if (!func) {
      throw new Error('Function not found');
    }

    if (!func.isActive) {
      throw new Error('Function is not active');
    }

    return await runCustomFunction(func, {
      input: args.input,
      expectedOutput: args.expectedOutput,
      actualOutput: args.actualOutput,
    });
  },
});

/**
 * Test a custom function with examples
 */
export const test = action({
  args: {
    functionId: v.id('customScoringFunctions'),
  },
  handler: async (ctx, args): Promise<{
    functionId: Id<'customScoringFunctions'>;
    functionName: string;
    totalTests: number;
    passed: number;
    failed: number;
    allPassed: boolean;
    results: Array<{
      example: FunctionExample;
      result: ExecutionResult;
      passed: boolean;
    }>;
  }> => {
    // Get function via proper query reference
    const func = await ctx.runQuery(api.customScoringFunctions.get, {
      functionId: args.functionId,
    }) as Doc<'customScoringFunctions'> | null;

    if (!func) {
      throw new Error('Function not found');
    }

    const results: Array<{
      example: FunctionExample;
      result: ExecutionResult;
      passed: boolean;
    }> = [];

    // Run all examples
    for (const example of func.metadata.examples) {
      const result = await runCustomFunction(func, {
        input: example.input,
        expectedOutput: example.expectedOutput,
        actualOutput: example.actualOutput,
      });

      results.push({
        example,
        result,
        passed: result.success && result.score !== undefined && Math.abs(result.score - example.score) < 0.01,
      });
    }

    const allPassed = results.every((r) => r.passed);

    return {
      functionId: args.functionId,
      functionName: func.name,
      totalTests: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      allPassed,
      results,
    };
  },
});
