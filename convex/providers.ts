import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    name: v.string(),
    type: v.union(v.literal('local'), v.literal('federated')),
    federationConfig: v.optional(v.any()),
    healthEndpoint: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => await ctx.db.insert('providers', args),
});

export const list = query({
  args: { tenantId: v.id('tenants') },
  handler: async (ctx, args) => await ctx.db
    .query('providers')
    .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
    .collect(),
});

export const update = mutation({
  args: {
    id: v.id('providers'),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal('local'), v.literal('federated'))),
    federationConfig: v.optional(v.any()),
    healthEndpoint: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error('Provider not found');
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;
    if (Object.keys(clean).length === 0) throw new Error('No updates provided');
    await ctx.db.patch(id, clean);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id('providers') },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) throw new Error('Provider not found');
    await ctx.db.delete(args.id);
    return args.id;
  },
});
