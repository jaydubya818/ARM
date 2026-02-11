/**
 * Auth module - operator resolution from Clerk identity
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current operator for the authenticated user.
 * Uses identity.subject from Clerk JWT to look up operator by authIdentity.
 * Returns null if not authenticated or no operator exists.
 */
export const getCurrentOperator = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;

    const operator = await ctx.db
      .query("operators")
      .withIndex("by_auth", (q) => q.eq("authIdentity", identity.subject))
      .first();

    return operator;
  },
});

/**
 * Ensure an operator exists for the current authenticated user.
 * Creates one in the first tenant if not found (for first-login flow).
 * Call this when user is Authenticated to sync Clerk → operators.
 */
export const ensureOperator = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("operators")
      .withIndex("by_auth", (q) => q.eq("authIdentity", identity.subject))
      .first();

    if (existing) return existing._id;

    const firstTenant = await ctx.db.query("tenants").first();
    if (!firstTenant) {
      throw new Error("No tenant found - run seedARM first");
    }

    const operatorId = await ctx.db.insert("operators", {
      tenantId: firstTenant._id,
      authIdentity: identity.subject,
      email: identity.email ?? `user-${identity.subject.slice(0, 8)}@unknown`,
      name: identity.name ?? identity.email ?? "User",
      role: "Admin",
    });

    await ctx.db.insert("auditLogs", {
      tenantId: firstTenant._id,
      operatorId,
      action: "OPERATOR_CREATED",
      resource: "operators",
      details: { source: "clerk_first_login" },
      timestamp: Date.now(),
      severity: "INFO",
    });

    return operatorId;
  },
});
