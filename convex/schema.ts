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
    email: v.string(),
    name: v.string(),
    role: v.string(),
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
});
