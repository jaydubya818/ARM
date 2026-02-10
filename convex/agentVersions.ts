import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { computeGenomeHash, verifyGenomeIntegrity } from "./lib/genomeHash";

export const create = mutation({
  args: {
    templateId: v.id("agentTemplates"),
    tenantId: v.id("tenants"),
    versionLabel: v.string(),
    genome: v.any(),
    parentVersionId: v.optional(v.id("agentVersions")),
  },
  handler: async (ctx, args) => {
    // Compute hash
    const genomeHash = await computeGenomeHash(args.genome);
    
    const versionId = await ctx.db.insert("agentVersions", {
      templateId: args.templateId,
      tenantId: args.tenantId,
      versionLabel: args.versionLabel,
      genome: args.genome,
      genomeHash,
      lifecycleState: "DRAFT",
      evalStatus: "NOT_RUN",
      parentVersionId: args.parentVersionId,
    });
    
    // Write ChangeRecord
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "VERSION_CREATED",
      targetEntity: "agentVersion",
      targetId: versionId,
      payload: { versionLabel: args.versionLabel, genomeHash },
      timestamp: Date.now(),
    });
    
    return versionId;
  },
});

export const get = query({
  args: { versionId: v.id("agentVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) return null;
    
    // Verify integrity on detail read
    const isValid = await verifyGenomeIntegrity(
      version.genome,
      version.genomeHash
    );
    
    if (!isValid) {
      // Write integrity failure record
      await ctx.db.insert("changeRecords", {
        tenantId: version.tenantId,
        type: "VERSION_INTEGRITY_FAILED",
        targetEntity: "agentVersion",
        targetId: args.versionId,
        payload: { genomeHash: version.genomeHash },
        timestamp: Date.now(),
      });
    } else {
      // Write verification success
      await ctx.db.insert("changeRecords", {
        tenantId: version.tenantId,
        type: "VERSION_INTEGRITY_VERIFIED",
        targetEntity: "agentVersion",
        targetId: args.versionId,
        payload: { genomeHash: version.genomeHash },
        timestamp: Date.now(),
      });
    }
    
    return {
      ...version,
      integrityStatus: isValid ? "VERIFIED" : "TAMPERED",
    };
  },
});

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // NO hash verification on list for performance
    return await ctx.db
      .query("agentVersions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const listByTemplate = query({
  args: { templateId: v.id("agentTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentVersions")
      .withIndex("by_template", (q) => q.eq("templateId", args.templateId))
      .collect();
  },
});

export const getLineage = query({
  args: { versionId: v.id("agentVersions") },
  handler: async (ctx, args) => {
    const lineage = [];
    let currentId: string | undefined = args.versionId;
    
    while (currentId) {
      const version = await ctx.db.get(currentId as any);
      if (!version) break;
      lineage.push(version);
      currentId = version.parentVersionId;
    }
    
    return lineage;
  },
});

export const transition = mutation({
  args: {
    versionId: v.id("agentVersions"),
    newState: v.union(
      v.literal("DRAFT"),
      v.literal("TESTING"),
      v.literal("CANDIDATE"),
      v.literal("APPROVED"),
      v.literal("DEPRECATED"),
      v.literal("RETIRED")
    ),
  },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");
    
    // TODO: Add state machine validation here
    
    await ctx.db.patch(args.versionId, {
      lifecycleState: args.newState,
    });
    
    // Write ChangeRecord
    await ctx.db.insert("changeRecords", {
      tenantId: version.tenantId,
      type: "VERSION_TRANSITIONED",
      targetEntity: "agentVersion",
      targetId: args.versionId,
      payload: {
        from: version.lifecycleState,
        to: args.newState,
      },
      timestamp: Date.now(),
    });
    
    return args.versionId;
  },
});
