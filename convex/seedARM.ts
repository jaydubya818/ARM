import { mutation } from "./_generated/server";

/**
 * ARM Bootstrap Seed Script
 * Run with: npx convex run seedARM
 * 
 * Creates:
 * - Tenant "ARM Dev Org"
 * - Environments (dev, staging, prod)
 * - Provider "local"
 * - Template "Customer Support Agent"
 * - Two versions (v1.0.0, v2.0.0 with lineage)
 * - One active instance in prod
 */
export default mutation({
  handler: async (ctx) => {
    console.log("🚀 Starting ARM seed...");
    
    // 1. Create tenant
    const tenantId = await ctx.db.insert("tenants", {
      name: "ARM Dev Org",
      slug: "arm-dev",
      settings: {},
    });
    console.log("✅ Created tenant:", tenantId);
    
    // 2. Create environments
    const devEnvId = await ctx.db.insert("environments", {
      tenantId,
      name: "Development",
      slug: "dev",
      config: {},
    });
    
    const stagingEnvId = await ctx.db.insert("environments", {
      tenantId,
      name: "Staging",
      slug: "staging",
      config: {},
    });
    
    const prodEnvId = await ctx.db.insert("environments", {
      tenantId,
      name: "Production",
      slug: "prod",
      config: {},
    });
    console.log("✅ Created environments:", { devEnvId, stagingEnvId, prodEnvId });
    
    // 3. Create provider
    const providerId = await ctx.db.insert("providers", {
      tenantId,
      name: "local",
      type: "local",
      metadata: { description: "Local runtime provider" },
    });
    console.log("✅ Created provider:", providerId);
    
    // 4. Create template
    const templateId = await ctx.db.insert("agentTemplates", {
      tenantId,
      name: "Customer Support Agent",
      description: "Handles customer inquiries and support tickets",
      owners: ["ops@arm-dev.com"],
      tags: ["support", "customer-facing"],
    });
    console.log("✅ Created template:", templateId);
    
    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId,
      type: "TEMPLATE_CREATED",
      targetEntity: "agentTemplate",
      targetId: templateId,
      payload: { name: "Customer Support Agent" },
      timestamp: Date.now(),
    });
    
    // 5. Create version v1.0.0
    const genome1 = {
      modelConfig: {
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        temperature: 0.7,
        maxTokens: 4096,
      },
      promptBundleHash: "sha256:abc123def456",
      toolManifest: [
        {
          toolId: "zendesk_search",
          schemaVersion: "1.0",
          requiredPermissions: ["zendesk:read"],
        },
        {
          toolId: "slack_notify",
          schemaVersion: "1.0",
          requiredPermissions: ["slack:write"],
        },
      ],
      provenance: {
        builtAt: new Date().toISOString(),
        builtBy: "ops@arm-dev.com",
        commitRef: "abc123",
      },
    };
    
    // Compute hash (simplified for seed)
    const genomeHash1 = "hash_v1_" + Date.now();
    
    const version1Id = await ctx.db.insert("agentVersions", {
      templateId,
      tenantId,
      versionLabel: "v1.0.0",
      genome: genome1,
      genomeHash: genomeHash1,
      lifecycleState: "APPROVED",
      evalStatus: "PASS",
    });
    console.log("✅ Created version v1.0.0:", version1Id);
    
    await ctx.db.insert("changeRecords", {
      tenantId,
      type: "VERSION_CREATED",
      targetEntity: "agentVersion",
      targetId: version1Id,
      payload: { versionLabel: "v1.0.0", genomeHash: genomeHash1 },
      timestamp: Date.now(),
    });
    
    // 6. Create version v2.0.0 (with lineage)
    const genome2 = {
      modelConfig: {
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        temperature: 0.5, // Changed
        maxTokens: 8192, // Changed
      },
      promptBundleHash: "sha256:xyz789ghi012",
      toolManifest: [
        {
          toolId: "zendesk_search",
          schemaVersion: "1.0",
          requiredPermissions: ["zendesk:read"],
        },
        {
          toolId: "slack_notify",
          schemaVersion: "1.0",
          requiredPermissions: ["slack:write"],
        },
        {
          toolId: "jira_create_ticket", // New tool
          schemaVersion: "1.0",
          requiredPermissions: ["jira:write"],
        },
      ],
      provenance: {
        builtAt: new Date().toISOString(),
        builtBy: "ops@arm-dev.com",
        commitRef: "def456",
        parentVersionId: version1Id,
      },
    };
    
    const genomeHash2 = "hash_v2_" + Date.now();
    
    const version2Id = await ctx.db.insert("agentVersions", {
      templateId,
      tenantId,
      versionLabel: "v2.0.0",
      genome: genome2,
      genomeHash: genomeHash2,
      lifecycleState: "APPROVED",
      evalStatus: "PASS",
      parentVersionId: version1Id, // Lineage link
    });
    console.log("✅ Created version v2.0.0 with lineage:", version2Id);
    
    await ctx.db.insert("changeRecords", {
      tenantId,
      type: "VERSION_CREATED",
      targetEntity: "agentVersion",
      targetId: version2Id,
      payload: { versionLabel: "v2.0.0", genomeHash: genomeHash2, parentVersionId: version1Id },
      timestamp: Date.now(),
    });
    
    // 7. Create instance in prod
    const instanceId = await ctx.db.insert("agentInstances", {
      versionId: version2Id,
      tenantId,
      environmentId: prodEnvId,
      providerId,
      state: "ACTIVE",
      identityPrincipal: "arn:aws:iam::123456789:role/support-agent",
      heartbeatAt: Date.now(),
      metadata: {
        region: "us-east-1",
        deployedBy: "ops@arm-dev.com",
      },
    });
    console.log("✅ Created instance in prod:", instanceId);
    
    await ctx.db.insert("changeRecords", {
      tenantId,
      type: "INSTANCE_CREATED",
      targetEntity: "agentInstance",
      targetId: instanceId,
      payload: { versionId: version2Id, environment: "prod" },
      timestamp: Date.now(),
    });
    
    console.log("🎉 ARM seed complete!");
    
    return {
      tenantId,
      templateId,
      version1Id,
      version2Id,
      instanceId,
      summary: {
        tenant: "ARM Dev Org",
        environments: 3,
        providers: 1,
        templates: 1,
        versions: 2,
        instances: 1,
      },
    };
  },
});
