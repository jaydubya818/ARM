import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("changeRecords")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .take(100);
  },
});

export const listByTarget = query({
  args: {
    targetEntity: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("changeRecords")
      .withIndex("by_target", (q) =>
        q.eq("targetEntity", args.targetEntity).eq("targetId", args.targetId)
      )
      .order("desc")
      .collect();
  },
});
