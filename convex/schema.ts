import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core Registry
  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    settings: v.optional(v.any()),
  }).index("by_slug", ["slug"]),

  environments: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    slug: v.string(),
    config: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"]),

  operators: defineTable({
    tenantId: v.id("tenants"),
    authIdentity: v.string(),
    email: v.string(), // Stored securely, access controlled, masked in responses
    name: v.string(),
    role: v.string(),
    // GDPR/CCPA compliance fields (optional for backward compatibility)
    consentGiven: v.optional(v.boolean()),
    consentTimestamp: v.optional(v.number()),
    dataRetentionDays: v.optional(v.number()), // Custom retention period
  }).index("by_tenant", ["tenantId"])
    .index("by_auth", ["authIdentity"]),

  providers: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    type: v.union(v.literal("local"), v.literal("federated")),
    federationConfig: v.optional(v.any()),
    healthEndpoint: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"]),

  agentTemplates: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    owners: v.array(v.string()),
    tags: v.array(v.string()),
  }).index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"]),

  agentVersions: defineTable({
    templateId: v.id("agentTemplates"),
    tenantId: v.id("tenants"),
    versionLabel: v.string(),
    genome: v.object({
      modelConfig: v.any(),
      promptBundleHash: v.string(),
      toolManifest: v.array(v.any()),
      provenance: v.optional(v.any()),
    }),
    genomeHash: v.string(),
    lifecycleState: v.union(
      v.literal("DRAFT"),
      v.literal("TESTING"),
      v.literal("CANDIDATE"),
      v.literal("APPROVED"),
      v.literal("DEPRECATED"),
      v.literal("RETIRED")
    ),
    evalStatus: v.union(
      v.literal("NOT_RUN"),
      v.literal("RUNNING"),
      v.literal("PASS"),
      v.literal("FAIL")
    ),
    parentVersionId: v.optional(v.id("agentVersions")),
  }).index("by_tenant", ["tenantId"])
    .index("by_template", ["templateId"])
    .index("by_state", ["tenantId", "lifecycleState"])
    .index("by_hash", ["genomeHash"]),

  agentInstances: defineTable({
    versionId: v.id("agentVersions"),
    tenantId: v.id("tenants"),
    environmentId: v.id("environments"),
    providerId: v.id("providers"),
    state: v.union(
      v.literal("PROVISIONING"),
      v.literal("ACTIVE"),
      v.literal("PAUSED"),
      v.literal("READONLY"),
      v.literal("DRAINING"),
      v.literal("QUARANTINED"),
      v.literal("RETIRED")
    ),
    identityPrincipal: v.optional(v.string()),
    secretRef: v.optional(v.string()),
    policyEnvelopeId: v.optional(v.string()),
    heartbeatAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"])
    .index("by_version", ["versionId"])
    .index("by_environment", ["tenantId", "environmentId"])
    .index("by_state", ["tenantId", "state"]),

  changeRecords: defineTable({
    tenantId: v.id("tenants"),
    type: v.string(),
    targetEntity: v.string(),
    targetId: v.string(),
    operatorId: v.optional(v.id("operators")),
    payload: v.any(),
    timestamp: v.number(),
  }).index("by_tenant", ["tenantId"])
    .index("by_target", ["targetEntity", "targetId"])
    .index("by_type", ["tenantId", "type"]),

  // P1.2 Schema (placeholders)
  policyEnvelopes: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    autonomyTier: v.number(),
    allowedTools: v.array(v.string()),
    costLimits: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"]),

  approvalRecords: defineTable({
    tenantId: v.id("tenants"),
    requestType: v.string(),
    targetId: v.string(),
    status: v.string(),
    requestedBy: v.id("operators"),
    decidedBy: v.optional(v.id("operators")),
  }).index("by_tenant", ["tenantId"]),

  // P2.0 Schema: Evaluation Orchestration
  evaluationSuites: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    testCases: v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      input: v.any(),
      expectedOutput: v.any(),
      scoringCriteria: v.optional(v.object({
        type: v.union(
          v.literal("exact_match"),
          v.literal("contains"),
          v.literal("similarity"),
          v.literal("custom")
        ),
        threshold: v.optional(v.number()),
        config: v.optional(v.any()),
      })),
    })),
    createdBy: v.id("operators"),
    tags: v.optional(v.array(v.string())),
  }).index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"]),

  evaluationRuns: defineTable({
    tenantId: v.id("tenants"),
    suiteId: v.id("evaluationSuites"),
    versionId: v.id("agentVersions"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("RUNNING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("CANCELLED")
    ),
    results: v.optional(v.array(v.object({
      testCaseId: v.string(),
      passed: v.boolean(),
      score: v.optional(v.number()),
      output: v.any(),
      error: v.optional(v.string()),
      executionTime: v.optional(v.number()),
    }))),
    overallScore: v.optional(v.number()),
    passRate: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    triggeredBy: v.optional(v.id("operators")),
  }).index("by_tenant", ["tenantId"])
    .index("by_version", ["versionId"])
    .index("by_suite", ["suiteId"])
    .index("by_status", ["tenantId", "status"]),

  // P3.0 Schema: RBAC (Role-Based Access Control)
  roles: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    isSystem: v.boolean(),
    createdBy: v.id("operators"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"])
    .index("by_system", ["isSystem"]),

  roleAssignments: defineTable({
    tenantId: v.id("tenants"),
    operatorId: v.id("operators"),
    roleId: v.id("roles"),
    assignedBy: v.id("operators"),
    assignedAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_operator", ["operatorId"])
    .index("by_role", ["roleId"])
    .index("by_tenant", ["tenantId"]),

  permissions: defineTable({
    resource: v.string(),
    action: v.string(),
    description: v.string(),
    category: v.string(),
  }).index("by_resource", ["resource"])
    .index("by_category", ["category"]),

  // P3.0 Schema: Audit Logging
  auditLogs: defineTable({
    tenantId: v.id("tenants"),
    operatorId: v.optional(v.id("operators")),
    action: v.string(),
    resource: v.string(),
    // Details can contain various fields depending on the action
    // Common fields: permission, reason, ipAddress (anonymized), userAgent (anonymized)
    // PII-safe fields: pseudonymousId, emailMasked, emailUpdated, etc.
    details: v.any(),
    timestamp: v.number(),
    severity: v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("ERROR")
    ),
  }).index("by_tenant", ["tenantId"])
    .index("by_operator", ["operatorId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_severity", ["tenantId", "severity"]),

  // P3.0 Schema: Analytics
  evaluationMetrics: defineTable({
    tenantId: v.id("tenants"),
    versionId: v.id("agentVersions"),
    suiteId: v.id("evaluationSuites"),
    runId: v.id("evaluationRuns"),
    timestamp: v.number(),
    metrics: v.object({
      overallScore: v.number(),
      passRate: v.number(),
      avgExecutionTime: v.number(),
      testCaseCount: v.number(),
      passedCount: v.number(),
      failedCount: v.number(),
    }),
    period: v.string(),
  }).index("by_tenant", ["tenantId"])
    .index("by_version", ["versionId"])
    .index("by_suite", ["suiteId"])
    .index("by_timestamp", ["tenantId", "timestamp"]),

  // P3.0 Schema: Custom Scoring Functions
  customScoringFunctions: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.string(),
    code: v.string(),
    language: v.string(),
    version: v.number(),
    isActive: v.boolean(),
    createdBy: v.id("operators"),
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.object({
      parameters: v.array(v.object({
        name: v.string(),
        type: v.string(),
        required: v.boolean(),
        default: v.optional(v.any()),
      })),
      returnType: v.string(),
      examples: v.array(v.object({
        input: v.any(),
        expectedOutput: v.any(),
        actualOutput: v.any(),
        score: v.number(),
      })),
    }),
  }).index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"])
    .index("by_active", ["tenantId", "isActive"]),

  // P3.0 Schema: Notifications
  notificationEvents: defineTable({
    tenantId: v.id("tenants"),
    type: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    payload: v.any(),
    timestamp: v.number(),
    processed: v.boolean(),
  }).index("by_tenant", ["tenantId"])
    .index("by_type", ["type"])
    .index("by_processed", ["processed"]),

  notifications: defineTable({
    tenantId: v.id("tenants"),
    operatorId: v.id("operators"),
    eventId: v.id("notificationEvents"),
    title: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("INFO"),
      v.literal("SUCCESS"),
      v.literal("WARNING"),
      v.literal("ERROR")
    ),
    read: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_operator", ["operatorId"])
    .index("by_read", ["operatorId", "read"])
    .index("by_created", ["operatorId", "createdAt"]),

  notificationPreferences: defineTable({
    operatorId: v.id("operators"),
    eventType: v.string(),
    enabled: v.boolean(),
    channels: v.array(v.string()),
    frequency: v.string(),
  }).index("by_operator", ["operatorId"])
    .index("by_event", ["operatorId", "eventType"]),
});
