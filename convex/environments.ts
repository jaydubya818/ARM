import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    name: v.string(),
    slug: v.string(),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => await ctx.db.insert('environments', args),
});

export const list = query({
  args: { tenantId: v.id('tenants') },
  handler: async (ctx, args) => await ctx.db
    .query('environments')
    .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
    .collect(),
});
