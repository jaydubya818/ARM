import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const create = mutation({
  args: {
    versionId: v.id('agentVersions'),
    tenantId: v.id('tenants'),
    environmentId: v.id('environments'),
    providerId: v.id('providers'),
    identityPrincipal: v.optional(v.string()),
    secretRef: v.optional(v.string()),
    policyEnvelopeId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const instanceId = await ctx.db.insert('agentInstances', {
      ...args,
      state: 'PROVISIONING',
      heartbeatAt: Date.now(),
    });

    // Write ChangeRecord
    await ctx.db.insert('changeRecords', {
      tenantId: args.tenantId,
      type: 'INSTANCE_CREATED',
      targetEntity: 'agentInstance',
      targetId: instanceId,
      payload: { versionId: args.versionId, environmentId: args.environmentId },
      timestamp: Date.now(),
    });

    return instanceId;
  },
});

export const list = query({
  args: { tenantId: v.id('tenants') },
  handler: (ctx, args) => ctx.db
    .query('agentInstances')
    .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
    .collect(),
});

export const get = query({
  args: { instanceId: v.id('agentInstances') },
  handler: (ctx, args) => ctx.db.get(args.instanceId),
});

export const listByVersion = query({
  args: { versionId: v.id('agentVersions') },
  handler: (ctx, args) => ctx.db
    .query('agentInstances')
    .withIndex('by_version', (q) => q.eq('versionId', args.versionId))
    .collect(),
});

export const transition = mutation({
  args: {
    instanceId: v.id('agentInstances'),
    newState: v.union(
      v.literal('PROVISIONING'),
      v.literal('ACTIVE'),
      v.literal('PAUSED'),
      v.literal('READONLY'),
      v.literal('DRAINING'),
      v.literal('QUARANTINED'),
      v.literal('RETIRED'),
    ),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error('Instance not found');

    await ctx.db.patch(args.instanceId, {
      state: args.newState,
    });

    // Write ChangeRecord
    await ctx.db.insert('changeRecords', {
      tenantId: instance.tenantId,
      type: 'INSTANCE_TRANSITIONED',
      targetEntity: 'agentInstance',
      targetId: args.instanceId,
      payload: {
        from: instance.state,
        to: args.newState,
      },
      timestamp: Date.now(),
    });

    return args.instanceId;
  },
});

export const heartbeat = mutation({
  args: { instanceId: v.id('agentInstances') },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error('Instance not found');

    await ctx.db.patch(args.instanceId, {
      heartbeatAt: Date.now(),
    });

    return args.instanceId;
  },
});
