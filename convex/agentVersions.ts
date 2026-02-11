import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id, Doc } from './_generated/dataModel';
import { computeGenomeHash, verifyGenomeIntegrity } from './lib/genomeHash';

export const create = mutation({
  args: {
    templateId: v.id('agentTemplates'),
    tenantId: v.id('tenants'),
    versionLabel: v.string(),
    genome: v.any(),
    parentVersionId: v.optional(v.id('agentVersions')),
  },
  handler: async (ctx, args) => {
    // Compute hash
    const genomeHash = await computeGenomeHash(args.genome);

    const versionId = await ctx.db.insert('agentVersions', {
      templateId: args.templateId,
      tenantId: args.tenantId,
      versionLabel: args.versionLabel,
      genome: args.genome,
      genomeHash,
      lifecycleState: 'DRAFT',
      evalStatus: 'NOT_RUN',
      parentVersionId: args.parentVersionId,
    });

    // Write ChangeRecord
    await ctx.db.insert('changeRecords', {
      tenantId: args.tenantId,
      type: 'VERSION_CREATED',
      targetEntity: 'agentVersion',
      targetId: versionId,
      payload: { versionLabel: args.versionLabel, genomeHash },
      timestamp: Date.now(),
    });

    return versionId;
  },
});

export const get = query({
  args: { versionId: v.id('agentVersions') },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) return null;

    // Verify integrity on detail read
    const isValid = await verifyGenomeIntegrity(
      version.genome,
      version.genomeHash,
    );

    // Note: Queries cannot write to the database, so integrity verification
    // results are returned but not logged. Use a mutation to log integrity events.

    return {
      ...version,
      integrityStatus: isValid ? 'VERIFIED' : 'TAMPERED',
    };
  },
});

export const list = query({
  args: { tenantId: v.id('tenants') },
  handler: (ctx, args) =>
    // NO hash verification on list for performance
    ctx.db
      .query('agentVersions')
      .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
      .collect()
  ,
});

export const listByTemplate = query({
  args: { templateId: v.id('agentTemplates') },
  handler: (ctx, args) => ctx.db
    .query('agentVersions')
    .withIndex('by_template', (q) => q.eq('templateId', args.templateId))
    .collect(),
});

export const getLineage = query({
  args: { versionId: v.id('agentVersions') },
  handler: async (ctx, args) => {
    const lineage: Doc<'agentVersions'>[] = [];
    let currentId: Id<'agentVersions'> | undefined = args.versionId;

    while (currentId) {
      const version = await ctx.db.get(currentId) as Doc<'agentVersions'> | null;
      if (!version) break;
      lineage.push(version);
      currentId = version.parentVersionId;
    }

    return lineage;
  },
});

export const transition = mutation({
  args: {
    versionId: v.id('agentVersions'),
    newState: v.union(
      v.literal('DRAFT'),
      v.literal('TESTING'),
      v.literal('CANDIDATE'),
      v.literal('APPROVED'),
      v.literal('DEPRECATED'),
      v.literal('RETIRED'),
    ),
    approvalId: v.optional(v.id('approvalRecords')),
  },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error('Version not found');

    // State machine validation (imported from lib/approvalEngine)
    const { validateVersionTransition } = await import('./lib/approvalEngine');
    const validation = validateVersionTransition(
      version.lifecycleState,
      args.newState,
      version.evalStatus,
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if approval required (P1.2 - basic check, full integration later)
    // For now, we'll allow transitions without approval enforcement
    // Full approval enforcement will be added when instance policies are attached

    await ctx.db.patch(args.versionId, {
      lifecycleState: args.newState,
    });

    // Write ChangeRecord
    await ctx.db.insert('changeRecords', {
      tenantId: version.tenantId,
      type: 'VERSION_TRANSITIONED',
      targetEntity: 'agentVersion',
      targetId: args.versionId,
      payload: {
        from: version.lifecycleState,
        to: args.newState,
        approvalId: args.approvalId,
      },
      timestamp: Date.now(),
    });

    // P2.0: Auto-trigger evaluation when transitioning to TESTING
    // Note: This creates a pending run that will be picked up by the evaluation runner
    if (args.newState === 'TESTING') {
      // Find a default evaluation suite for this tenant
      const defaultSuite = await ctx.db
        .query('evaluationSuites')
        .withIndex('by_tenant', (q) => q.eq('tenantId', version.tenantId))
        .first();

      if (defaultSuite) {
        // Create evaluation run
        await ctx.db.insert('evaluationRuns', {
          tenantId: version.tenantId,
          suiteId: defaultSuite._id,
          versionId: args.versionId,
          status: 'PENDING',
        });

        // Update version evalStatus to RUNNING
        await ctx.db.patch(args.versionId, {
          evalStatus: 'RUNNING',
        });
      }
    }

    return args.versionId;
  },
});
