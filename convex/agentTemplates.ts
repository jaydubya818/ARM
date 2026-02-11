import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    owners: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.atomic(async (tx) => {
      const templateId = await tx.insert("agentTemplates", args);
      
      // Write ChangeRecord
      await tx.insert("changeRecords", {
        tenantId: args.tenantId,
        type: "TEMPLATE_CREATED",
        targetEntity: "agentTemplate",
        targetId: templateId,
        payload: { name: args.name },
        timestamp: Date.now(),
      });
      
      return templateId;
    });
  },
});

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentTemplates")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const get = query({
  args: { templateId: v.id("agentTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

export const update = mutation({
  args: {
    templateId: v.id("agentTemplates"),
    description: v.optional(v.string()),
    owners: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.atomic(async (tx) => {
      const { templateId, ...updates } = args;
      const template = await tx.get(templateId);
      if (!template) throw new Error("Template not found");
      
      await tx.patch(templateId, updates);
      
      // Write ChangeRecord
      await tx.insert("changeRecords", {
        tenantId: template.tenantId,
        type: "TEMPLATE_UPDATED",
        targetEntity: "agentTemplate",
        targetId: templateId,
        payload: updates,
        timestamp: Date.now(),
      });
      
      return templateId;
    });
  },
});
