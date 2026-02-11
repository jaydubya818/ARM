/**
 * Feature Flags
 *
 * Enables gradual rollouts, user targeting, and feature gating.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Deterministic hash to assign operator to rollout percentage
 */
function hashOperatorToPercent(
  operatorId: string,
  flagKey: string,
): number {
  const str = `${operatorId}_${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return Math.abs(hash % 100);
}

/**
 * Check if a feature flag is enabled for an operator
 */
export const isEnabled = query({
  args: {
    tenantId: v.id('tenants'),
    flagKey: v.string(),
    operatorId: v.optional(v.id('operators')),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const flag = await ctx.db
      .query('featureFlags')
      .withIndex('by_key', (q) => q.eq('tenantId', args.tenantId).eq('key', args.flagKey))
      .first();

    if (!flag || !flag.enabled) return false;

    // Check rollout percentage (deterministic by operator ID)
    if (args.operatorId) {
      if (flag.targetOperators?.length) {
        if (!flag.targetOperators.includes(args.operatorId)) return false;
      } else if (flag.rolloutPercentage < 100) {
        const hash = hashOperatorToPercent(args.operatorId, args.flagKey);
        if (hash >= flag.rolloutPercentage) return false;
      }
    } else if (flag.rolloutPercentage < 100) {
      return false;
    }

    // Check environment targeting
    if (
      flag.targetEnvironments?.length
      && args.environment
      && !flag.targetEnvironments.includes(args.environment)
    ) {
      return false;
    }

    return true;
  },
});

/**
 * Get all flags for an operator (batch check)
 */
export const getFlagsForOperator = query({
  args: {
    tenantId: v.id('tenants'),
    operatorId: v.optional(v.id('operators')),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const flags = await ctx.db
      .query('featureFlags')
      .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
      .collect();

    const result: Record<string, boolean> = {};
    for (const flag of flags) {
      if (!flag.enabled) {
        result[flag.key] = false;
        continue;
      }

      if (args.operatorId) {
        if (flag.targetOperators?.length) {
          result[flag.key] = flag.targetOperators.includes(args.operatorId);
        } else if (flag.rolloutPercentage < 100) {
          const hash = hashOperatorToPercent(
            args.operatorId,
            flag.key,
          );
          result[flag.key] = hash < flag.rolloutPercentage;
        } else {
          result[flag.key] = true;
        }
      } else {
        result[flag.key] = flag.rolloutPercentage === 100;
      }

      if (
        result[flag.key]
        && flag.targetEnvironments?.length
        && args.environment
        && !flag.targetEnvironments.includes(args.environment)
      ) {
        result[flag.key] = false;
      }
    }

    return result;
  },
});

/**
 * List all feature flags (admin)
 */
export const list = query({
  args: { tenantId: v.id('tenants') },
  handler: async (ctx, args) => await ctx.db
    .query('featureFlags')
    .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
    .collect(),
});

/**
 * Get single flag
 */
export const get = query({
  args: { flagId: v.id('featureFlags') },
  handler: async (ctx, args) => ctx.db.get(args.flagId),
});

/**
 * Create feature flag
 */
export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    rolloutPercentage: v.optional(v.number()),
    targetOperators: v.optional(v.array(v.id('operators'))),
    targetEnvironments: v.optional(v.array(v.string())),
    createdBy: v.id('operators'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('featureFlags')
      .withIndex('by_key', (q) => q.eq('tenantId', args.tenantId).eq('key', args.key))
      .first();

    if (existing) throw new Error('Feature flag with this key already exists');

    return await ctx.db.insert('featureFlags', {
      tenantId: args.tenantId,
      key: args.key,
      name: args.name,
      description: args.description,
      enabled: args.enabled ?? false,
      rolloutPercentage: args.rolloutPercentage ?? 0,
      targetOperators: args.targetOperators,
      targetEnvironments: args.targetEnvironments,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update feature flag
 */
export const update = mutation({
  args: {
    flagId: v.id('featureFlags'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    rolloutPercentage: v.optional(v.number()),
    targetOperators: v.optional(v.array(v.id('operators'))),
    targetEnvironments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { flagId, ...updates } = args;
    const flag = await ctx.db.get(flagId);
    if (!flag) throw new Error('Feature flag not found');

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;

    await ctx.db.patch(flagId, {
      ...filtered,
      updatedAt: Date.now(),
    });

    return flagId;
  },
});

/**
 * Delete feature flag
 */
export const remove = mutation({
  args: { flagId: v.id('featureFlags') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.flagId);
  },
});

/**
 * Deterministic hash to assign operator to rollout percentage
 */
function hashOperatorToPercent(
  operatorId: string,
  flagKey: string,
): number {
  const str = `${operatorId}_${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return Math.abs(hash % 100);
}
