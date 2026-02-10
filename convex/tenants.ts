import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      settings: {},
    });
    return tenantId;
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tenants").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});
