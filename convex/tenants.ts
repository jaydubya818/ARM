import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantId = await ctx.db.insert('tenants', {
      name: args.name,
      slug: args.slug,
      settings: {},
    });
    return tenantId;
  },
});

export const list = query({
  handler: async (ctx) => await ctx.db.query('tenants').collect(),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => await ctx.db
    .query('tenants')
    .withIndex('by_slug', (q) => q.eq('slug', args.slug))
    .first(),
});
