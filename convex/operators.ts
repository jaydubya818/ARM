import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all operators for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("operators")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

/**
 * Get operator by ID
 */
export const get = query({
  args: {
    id: v.id("operators"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get operator by auth identity
 */
export const getByAuth = query({
  args: {
    authIdentity: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("operators")
      .withIndex("by_auth", (q) => q.eq("authIdentity", args.authIdentity))
      .first();
  },
});

/**
 * Create a new operator
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    authIdentity: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate auth identity
    const existing = await ctx.db
      .query("operators")
      .withIndex("by_auth", (q) => q.eq("authIdentity", args.authIdentity))
      .first();

    if (existing) {
      throw new Error(`Operator with auth identity ${args.authIdentity} already exists`);
    }

    return await ctx.db.insert("operators", {
      tenantId: args.tenantId,
      authIdentity: args.authIdentity,
      email: args.email,
      name: args.name,
      role: args.role,
    });
  },
});

/**
 * Update operator details
 */
export const update = mutation({
  args: {
    id: v.id("operators"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error("No updates provided");
    }

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

/**
 * Delete an operator
 */
export const remove = mutation({
  args: {
    id: v.id("operators"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
