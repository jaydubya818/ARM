import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    name: v.string(),
    description: v.optional(v.string()),
    owners: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert('agentTemplates', args);

    // Write ChangeRecord
    await ctx.db.insert('changeRecords', {
      tenantId: args.tenantId,
      type: 'TEMPLATE_CREATED',
      targetEntity: 'agentTemplate',
      targetId: templateId,
      payload: { name: args.name },
      timestamp: Date.now(),
    });

    return templateId;
  },
});

export const list = query({
  args: { tenantId: v.id('tenants') },
  handler: (ctx, args) => ctx.db
    .query('agentTemplates')
    .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
    .collect(),
});

export const get = query({
  args: { templateId: v.id('agentTemplates') },
  handler: (ctx, args) => ctx.db.get(args.templateId),
});

export const update = mutation({
  args: {
    templateId: v.id('agentTemplates'),
    description: v.optional(v.string()),
    owners: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error('Template not found');

    await ctx.db.patch(templateId, updates);

    // Write ChangeRecord
    await ctx.db.insert('changeRecords', {
      tenantId: template.tenantId,
      type: 'TEMPLATE_UPDATED',
      targetEntity: 'agentTemplate',
      targetId: templateId,
      payload: updates,
      timestamp: Date.now(),
    });

    return templateId;
  },
});
