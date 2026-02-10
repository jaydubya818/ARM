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
    
    // 8. Create evaluation suite (P2.0)
    const suiteId = await ctx.db.insert("evaluationSuites", {
      tenantId,
      name: "Standard Agent Tests",
      description: "Basic test suite for agent functionality",
      testCases: [
        {
          id: "test-1",
          name: "Basic Response Test",
          description: "Agent should respond to simple queries",
          input: { prompt: "Hello, how are you?" },
          expectedOutput: { response: "Hello! I'm functioning well." },
          scoringCriteria: {
            type: "contains",
            threshold: 0.8,
          },
        },
        {
          id: "test-2",
          name: "Tool Usage Test",
          description: "Agent should use tools when appropriate",
          input: { prompt: "Search for recent tickets" },
          expectedOutput: { toolUsed: "zendesk_search" },
          scoringCriteria: {
            type: "exact_match",
          },
        },
        {
          id: "test-3",
          name: "Error Handling Test",
          description: "Agent should handle errors gracefully",
          input: { prompt: "Invalid command: @#$%" },
          expectedOutput: { error: null, response: "I don't understand" },
          scoringCriteria: {
            type: "similarity",
            threshold: 0.7,
          },
        },
      ],
      createdBy: operatorId,
      tags: ["standard", "smoke-test"],
    });
    console.log("✅ Created evaluation suite:", suiteId);

    await ctx.db.insert("changeRecords", {
      tenantId,
      type: "EVAL_SUITE_CREATED",
      targetEntity: "evaluationSuite",
      targetId: suiteId,
      operatorId,
      payload: { name: "Standard Agent Tests", testCaseCount: 3 },
      timestamp: Date.now(),
    });

    // 9. Create sample evaluation run
    const runId = await ctx.db.insert("evaluationRuns", {
      tenantId,
      suiteId,
      versionId: version1Id,
      status: "COMPLETED",
      results: [
        {
          testCaseId: "test-1",
          passed: true,
          score: 0.95,
          output: { response: "Hello! I'm functioning well." },
          executionTime: 234,
        },
        {
          testCaseId: "test-2",
          passed: true,
          score: 1.0,
          output: { toolUsed: "zendesk_search" },
          executionTime: 456,
        },
        {
          testCaseId: "test-3",
          passed: false,
          score: 0.6,
          output: { error: null, response: "Error processing request" },
          executionTime: 123,
        },
      ],
      overallScore: 0.85,
      passRate: 66.7,
      startedAt: Date.now() - 10000,
      completedAt: Date.now() - 1000,
      triggeredBy: operatorId,
    });
    console.log("✅ Created sample evaluation run:", runId);

    await ctx.db.insert("changeRecords", {
      tenantId,
      type: "EVAL_RUN_CREATED",
      targetEntity: "evaluationRun",
      targetId: runId,
      operatorId,
      payload: { suiteId, versionId: version1Id },
      timestamp: Date.now(),
    });
    
    console.log("🎉 ARM seed complete!");
    
    return {
      tenantId,
      templateId,
      version1Id,
      version2Id,
      instanceId,
      suiteId,
      runId,
      summary: {
        tenant: "ARM Dev Org",
        environments: 3,
        providers: 1,
        templates: 1,
        versions: 2,
        instances: 1,
        evaluationSuites: 1,
        evaluationRuns: 1,
      },
    };
  },
});
