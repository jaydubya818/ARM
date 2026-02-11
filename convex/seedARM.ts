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
    
    // 0. Seed permissions registry (P3.0)
    console.log("📋 Seeding permissions registry...");
    const permissionsList = [
      // Core Resources - Templates
      { resource: "templates", action: "read", description: "View agent templates", category: "core" },
      { resource: "templates", action: "write", description: "Create/update templates", category: "core" },
      { resource: "templates", action: "delete", description: "Delete templates", category: "core" },
      // Core Resources - Versions
      { resource: "versions", action: "read", description: "View agent versions", category: "core" },
      { resource: "versions", action: "write", description: "Create/update versions", category: "core" },
      { resource: "versions", action: "delete", description: "Delete versions", category: "core" },
      { resource: "versions", action: "approve", description: "Approve version transitions", category: "core" },
      { resource: "versions", action: "transition", description: "Trigger lifecycle transitions", category: "core" },
      // Core Resources - Instances
      { resource: "instances", action: "read", description: "View agent instances", category: "core" },
      { resource: "instances", action: "write", description: "Create/update instances", category: "core" },
      { resource: "instances", action: "delete", description: "Delete instances", category: "core" },
      { resource: "instances", action: "start", description: "Start instances", category: "core" },
      { resource: "instances", action: "stop", description: "Stop instances", category: "core" },
      // Evaluation
      { resource: "evaluations", action: "read", description: "View evaluation suites and runs", category: "evaluation" },
      { resource: "evaluations", action: "write", description: "Create/update suites", category: "evaluation" },
      { resource: "evaluations", action: "delete", description: "Delete suites", category: "evaluation" },
      { resource: "evaluations", action: "execute", description: "Trigger evaluation runs", category: "evaluation" },
      { resource: "evaluations", action: "cancel", description: "Cancel running evaluations", category: "evaluation" },
      // Policies
      { resource: "policies", action: "read", description: "View policy envelopes", category: "policies" },
      { resource: "policies", action: "write", description: "Create/update policies", category: "policies" },
      { resource: "policies", action: "delete", description: "Delete policies", category: "policies" },
      { resource: "policies", action: "evaluate", description: "Evaluate policy decisions", category: "policies" },
      // Approvals
      { resource: "approvals", action: "read", description: "View approval requests", category: "approvals" },
      { resource: "approvals", action: "write", description: "Create approval requests", category: "approvals" },
      { resource: "approvals", action: "approve", description: "Approve requests", category: "approvals" },
      { resource: "approvals", action: "reject", description: "Reject requests", category: "approvals" },
      // Administration
      { resource: "operators", action: "read", description: "View operators", category: "admin" },
      { resource: "operators", action: "write", description: "Create/update operators", category: "admin" },
      { resource: "operators", action: "delete", description: "Delete operators", category: "admin" },
      { resource: "roles", action: "read", description: "View roles", category: "admin" },
      { resource: "roles", action: "write", description: "Create/update roles", category: "admin" },
      { resource: "roles", action: "delete", description: "Delete roles", category: "admin" },
      { resource: "roles", action: "assign", description: "Assign roles to operators", category: "admin" },
      { resource: "roles", action: "revoke", description: "Revoke role assignments", category: "admin" },
      { resource: "permissions", action: "read", description: "View permissions", category: "admin" },
      { resource: "permissions", action: "manage", description: "Manage permission registry", category: "admin" },
      { resource: "tenant", action: "read", description: "View tenant details", category: "admin" },
      { resource: "tenant", action: "write", description: "Update tenant settings", category: "admin" },
      { resource: "tenant", action: "manage", description: "Full tenant administration", category: "admin" },
      // Audit
      { resource: "audit", action: "read", description: "View audit logs", category: "audit" },
      { resource: "audit", action: "export", description: "Export audit logs", category: "audit" },
      { resource: "metrics", action: "read", description: "View analytics metrics", category: "audit" },
      // Advanced
      { resource: "custom-functions", action: "read", description: "View custom scoring functions", category: "advanced" },
      { resource: "custom-functions", action: "write", description: "Create/update functions", category: "advanced" },
      { resource: "custom-functions", action: "delete", description: "Delete functions", category: "advanced" },
      { resource: "custom-functions", action: "execute", description: "Execute functions", category: "advanced" },
      { resource: "notifications", action: "read", description: "View notifications", category: "advanced" },
      { resource: "notifications", action: "write", description: "Create notifications", category: "advanced" },
      { resource: "notifications", action: "manage", description: "Manage notification settings", category: "advanced" },
    ];

    for (const permission of permissionsList) {
      await ctx.db.insert("permissions", permission);
    }
    console.log(`✅ Seeded ${permissionsList.length} permissions`);
    
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
    
    // 4. Create operator (P3.0)
    const operatorId = await ctx.db.insert("operators", {
      tenantId,
      email: "admin@arm-dev.com",
      name: "Admin User",
      status: "ACTIVE",
    });
    console.log("✅ Created operator:", operatorId);
    
    // 5. Create system roles (P3.0)
    console.log("🔐 Creating system roles...");
    
    const now = Date.now();
    
    // Admin role (full tenant access)
    const adminRoleId = await ctx.db.insert("roles", {
      tenantId,
      name: "Admin",
      description: "Full tenant administration access",
      permissions: [
        "read:templates", "write:templates", "delete:templates",
        "read:versions", "write:versions", "delete:versions", "approve:versions", "transition:versions",
        "read:instances", "write:instances", "delete:instances", "start:instances", "stop:instances",
        "read:evaluations", "write:evaluations", "delete:evaluations", "execute:evaluations", "cancel:evaluations",
        "read:policies", "write:policies", "delete:policies", "evaluate:policies",
        "read:approvals", "write:approvals", "approve:approvals", "reject:approvals",
        "read:operators", "write:operators", "delete:operators",
        "read:roles", "write:roles", "delete:roles", "assign:roles", "revoke:roles",
        "read:permissions", "read:tenant", "write:tenant",
        "read:audit", "export:audit", "read:metrics",
        "read:custom-functions", "write:custom-functions", "delete:custom-functions", "execute:custom-functions",
        "read:notifications", "write:notifications", "manage:notifications",
      ],
      isSystem: true,
      createdBy: operatorId,
      createdAt: now,
      updatedAt: now,
    });
    
    // Operator role (standard operations)
    const operatorRoleId = await ctx.db.insert("roles", {
      tenantId,
      name: "Operator",
      description: "Standard operational access",
      permissions: [
        "read:templates", "write:templates",
        "read:versions", "write:versions", "transition:versions",
        "read:instances", "write:instances", "start:instances", "stop:instances",
        "read:evaluations", "write:evaluations", "execute:evaluations",
        "read:policies", "evaluate:policies",
        "read:approvals", "write:approvals",
        "read:operators", "read:roles", "read:permissions", "read:tenant",
        "read:audit", "read:metrics",
        "read:custom-functions", "execute:custom-functions",
        "read:notifications",
      ],
      isSystem: true,
      createdBy: operatorId,
      createdAt: now,
      updatedAt: now,
    });
    
    // Viewer role (read-only)
    const viewerRoleId = await ctx.db.insert("roles", {
      tenantId,
      name: "Viewer",
      description: "Read-only access",
      permissions: [
        "read:templates",
        "read:versions",
        "read:instances",
        "read:evaluations",
        "read:policies",
        "read:approvals",
        "read:operators", "read:roles", "read:permissions", "read:tenant",
        "read:audit", "read:metrics",
        "read:custom-functions",
        "read:notifications",
      ],
      isSystem: true,
      createdBy: operatorId,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log("✅ Created system roles:", { adminRoleId, operatorRoleId, viewerRoleId });
    
    // 6. Assign Admin role to operator (P3.0)
    await ctx.db.insert("roleAssignments", {
      tenantId,
      operatorId,
      roleId: adminRoleId,
      assignedBy: operatorId,
      assignedAt: now,
    });
    console.log("✅ Assigned Admin role to operator");
    
    // 8. Create template
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
    
    // 9. Create version v1.0.0
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
    
    // 10. Create version v2.0.0 (with lineage)
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
    
    // 11. Create instance in prod
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
    
    // 12. Create evaluation suite (P2.0)
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

    // 13. Create sample evaluation run
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
      operatorId,
      adminRoleId,
      summary: {
        tenant: "ARM Dev Org",
        environments: 3,
        providers: 1,
        operators: 1,
        systemRoles: 3,
        templates: 1,
        versions: 2,
        instances: 1,
        evaluationSuites: 1,
        evaluationRuns: 1,
        permissions: permissionsList.length,
      },
    };
  },
});
