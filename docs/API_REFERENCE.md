# API Reference

**ARM Backend API Documentation**  
**Last Updated:** February 10, 2026  
**Backend:** Convex  
**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Tenants](#tenants)
- [Environments](#environments)
- [Operators](#operators)
- [Providers](#providers)
- [Agent Templates](#agent-templates)
- [Agent Versions](#agent-versions)
- [Agent Instances](#agent-instances)
- [Policy Envelopes](#policy-envelopes)
- [Approval Records](#approval-records)
- [Change Records](#change-records)
- [Cost Ledger](#cost-ledger)
- [Error Handling](#error-handling)

---

## Authentication

ARM uses Convex's built-in authentication. All mutations require authentication context.

```typescript
// In Convex functions
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error("Unauthorized")
```

---

## Tenants

### `tenants.list`

**Type:** Query  
**Description:** List all tenants

**Returns:**
```typescript
Array<{
  _id: Id<"tenants">
  name: string
  slug: string
  settings?: any
  _creationTime: number
}>
```

**Example:**
```typescript
const tenants = useQuery(api.tenants.list)
```

---

## Environments

### `environments.list`

**Type:** Query  
**Description:** List all environments for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"environments">
  tenantId: Id<"tenants">
  name: string
  slug: string
  config?: any
  _creationTime: number
}>
```

---

## Operators

### `operators.list`

**Type:** Query  
**Description:** List all operators for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"operators">
  tenantId: Id<"tenants">
  authIdentity: string
  email: string
  name: string
  role: string
  _creationTime: number
}>
```

---

## Providers

### `providers.list`

**Type:** Query  
**Description:** List all providers for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"providers">
  tenantId: Id<"tenants">
  name: string
  type: "local" | "federated"
  federationConfig?: any
  healthEndpoint?: string
  metadata?: any
  _creationTime: number
}>
```

---

## Agent Templates

### `agentTemplates.list`

**Type:** Query  
**Description:** List all agent templates for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"agentTemplates">
  tenantId: Id<"tenants">
  name: string
  description?: string
  owners: string[]
  tags: string[]
  _creationTime: number
}>
```

### `agentTemplates.create`

**Type:** Mutation  
**Description:** Create a new agent template

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
  name: string
  description?: string
  owners: string[]
  tags: string[]
}
```

**Returns:** `Id<"agentTemplates">`

**Validation:**
- `name` must be unique within tenant
- `owners` must be valid email addresses
- Writes `TEMPLATE_CREATED` change record

**Example:**
```typescript
const templateId = await createTemplate({
  tenantId,
  name: "Customer Support Agent",
  description: "Handles customer inquiries",
  owners: ["ops@company.com"],
  tags: ["support", "customer-facing"]
})
```

---

## Agent Versions

### `agentVersions.list`

**Type:** Query  
**Description:** List all agent versions for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"agentVersions">
  templateId: Id<"agentTemplates">
  tenantId: Id<"tenants">
  versionLabel: string
  genome: {
    modelConfig: any
    promptBundleHash: string
    toolManifest: any[]
    provenance?: any
  }
  genomeHash: string
  lifecycleState: "DRAFT" | "TESTING" | "CANDIDATE" | "APPROVED" | "DEPRECATED" | "RETIRED"
  evalStatus: "NOT_RUN" | "RUNNING" | "PASS" | "FAIL"
  parentVersionId?: Id<"agentVersions">
  _creationTime: number
}>
```

### `agentVersions.create`

**Type:** Mutation  
**Description:** Create a new agent version

**Arguments:**
```typescript
{
  templateId: Id<"agentTemplates">
  tenantId: Id<"tenants">
  versionLabel: string
  genome: {
    modelConfig: any
    promptBundleHash: string
    toolManifest: any[]
    provenance?: any
  }
  parentVersionId?: Id<"agentVersions">
}
```

**Returns:** `Id<"agentVersions">`

**Validation:**
- Computes SHA-256 genome hash automatically
- Sets initial lifecycle state to `DRAFT`
- Sets initial eval status to `NOT_RUN`
- Writes `VERSION_CREATED` change record

**Example:**
```typescript
const versionId = await createVersion({
  templateId,
  tenantId,
  versionLabel: "v1.0.0",
  genome: {
    modelConfig: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.5
    },
    promptBundleHash: "abc123...",
    toolManifest: [
      { toolId: "zendesk_search", schemaVersion: "1.0" }
    ]
  }
})
```

### `agentVersions.get`

**Type:** Query  
**Description:** Get a specific agent version by ID with integrity verification

**Arguments:**
```typescript
{
  versionId: Id<"agentVersions">
}
```

**Returns:**
```typescript
{
  version: AgentVersion
  integrityStatus: "VALID" | "MISMATCH"
  computedHash: string
  storedHash: string
}
```

**Notes:**
- Recomputes genome hash and verifies against stored hash
- Writes `INTEGRITY_FAILED` change record if mismatch detected

### `agentVersions.getLineage`

**Type:** Query  
**Description:** Get version lineage (parent chain)

**Arguments:**
```typescript
{
  versionId: Id<"agentVersions">
}
```

**Returns:** `Array<AgentVersion>`

### `agentVersions.transition`

**Type:** Mutation  
**Description:** Transition version to a new lifecycle state

**Arguments:**
```typescript
{
  versionId: Id<"agentVersions">
  newState: "DRAFT" | "TESTING" | "CANDIDATE" | "APPROVED" | "DEPRECATED" | "RETIRED"
  approvalId?: Id<"approvalRecords">
}
```

**Returns:** `Id<"agentVersions">`

**Validation:**
- Validates state transition is allowed
- Guards: TESTING → CANDIDATE requires `evalStatus === "PASS"`
- Writes `VERSION_TRANSITIONED` change record

**State Machine:**
```
DRAFT → TESTING
TESTING → CANDIDATE (requires PASS eval)
TESTING → DRAFT
CANDIDATE → APPROVED
CANDIDATE → DRAFT
APPROVED → DEPRECATED
DEPRECATED → RETIRED
```

---

## Agent Instances

### `agentInstances.list`

**Type:** Query  
**Description:** List all agent instances for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"agentInstances">
  versionId: Id<"agentVersions">
  tenantId: Id<"tenants">
  environmentId: Id<"environments">
  providerId: Id<"providers">
  state: "PROVISIONING" | "ACTIVE" | "PAUSED" | "READONLY" | "DRAINING" | "QUARANTINED" | "RETIRED"
  identityPrincipal?: string
  secretRef?: string
  policyEnvelopeId?: string
  heartbeatAt?: number
  metadata?: any
  _creationTime: number
}>
```

### `agentInstances.create`

**Type:** Mutation  
**Description:** Create a new agent instance

**Arguments:**
```typescript
{
  versionId: Id<"agentVersions">
  tenantId: Id<"tenants">
  environmentId: Id<"environments">
  providerId: Id<"providers">
  policyEnvelopeId?: string
  identityPrincipal?: string
  secretRef?: string
  metadata?: any
}
```

**Returns:** `Id<"agentInstances">`

**Validation:**
- Sets initial state to `PROVISIONING`
- Writes `INSTANCE_CREATED` change record

---

## Policy Envelopes

### `policyEnvelopes.list`

**Type:** Query  
**Description:** List all policy envelopes for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"policyEnvelopes">
  tenantId: Id<"tenants">
  name: string
  autonomyTier: number // 0-5
  allowedTools: string[]
  costLimits?: {
    dailyTokens?: number
    monthlyCost?: number
  }
  _creationTime: number
}>
```

### `policyEnvelopes.create`

**Type:** Mutation  
**Description:** Create a new policy envelope

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
  name: string
  autonomyTier: number // 0-5
  allowedTools: string[]
  costLimits?: {
    dailyTokens?: number
    monthlyCost?: number
  }
}
```

**Returns:** `Id<"policyEnvelopes">`

**Validation:**
- `autonomyTier` must be 0-5
- `name` must be unique within tenant
- Writes `POLICY_CREATED` change record

**Autonomy Tiers:**
- **0**: No autonomy (all actions require approval)
- **1**: Minimal autonomy (critical/high risk require approval)
- **2**: Low autonomy (critical requires approval)
- **3**: Medium autonomy (no approval required for standard operations)
- **4**: High autonomy (all operations allowed)
- **5**: Full autonomy (all operations allowed, no restrictions)

### `policyEnvelopes.update`

**Type:** Mutation  
**Description:** Update a policy envelope

**Arguments:**
```typescript
{
  policyId: Id<"policyEnvelopes">
  name?: string
  autonomyTier?: number
  allowedTools?: string[]
  costLimits?: {
    dailyTokens?: number
    monthlyCost?: number
  }
}
```

**Returns:** `Id<"policyEnvelopes">`

**Validation:**
- Validates autonomy tier if provided
- Checks name uniqueness if changing name
- Writes `POLICY_UPDATED` change record

### `policyEnvelopes.remove`

**Type:** Mutation  
**Description:** Delete a policy envelope

**Arguments:**
```typescript
{
  policyId: Id<"policyEnvelopes">
}
```

**Returns:** `Id<"policyEnvelopes">`

**Validation:**
- Cannot delete if attached to any instances
- Writes `POLICY_DELETED` change record

### `policyEnvelopes.evaluateAndRecordCost`

**Type:** Action  
**Description:** Evaluate a tool call against a policy envelope and optionally record cost when the decision is ALLOW. Use from agent runtimes or inference gateways when enforcing policy and tracking usage.

**Arguments:**
```typescript
{
  policyId: Id<"policyEnvelopes">
  toolId: string
  toolParams?: any
  estimatedCost?: number   // USD
  tokensUsed?: number
  dailyTokensUsed?: number
  monthlyCostUsed?: number
  versionId?: Id<"agentVersions">
  instanceId?: Id<"agentInstances">
}
```

**Returns:**
```typescript
{
  decision: "ALLOW" | "DENY" | "NEEDS_APPROVAL"
  reason: string
  riskLevel: "low" | "medium" | "high" | "critical"
  violations: string[]
}
```

**Behavior:**
- Evaluates the tool call against the policy (allowed tools, cost limits).
- When decision is ALLOW and `estimatedCost` or `tokensUsed` is provided, records an entry in the cost ledger with source `"policy_eval"`.

**Integration:** See [AGENT_RUNTIME_POLICY_COST.md](./AGENT_RUNTIME_POLICY_COST.md) and [examples/agent-runtime-policy-cost/](../examples/agent-runtime-policy-cost/) for usage and runnable scripts.

---

## Approval Records

### `approvalRecords.list`

**Type:** Query  
**Description:** List approval records for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
  status?: string // "PENDING" | "APPROVED" | "DENIED" | "CANCELLED"
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"approvalRecords">
  tenantId: Id<"tenants">
  requestType: string
  targetId: string
  status: string
  requestedBy: Id<"operators">
  decidedBy?: Id<"operators">
  requesterName: string
  requesterEmail: string
  deciderName?: string
  deciderEmail?: string
  _creationTime: number
}>
```

### `approvalRecords.create`

**Type:** Mutation  
**Description:** Create a new approval request

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
  requestType: string
  targetId: string
  requestedBy: Id<"operators">
  justification?: string
  context?: any
}
```

**Returns:** `Id<"approvalRecords">`

**Validation:**
- Sets initial status to `PENDING`
- Writes `APPROVAL_REQUESTED` change record

### `approvalRecords.decide`

**Type:** Mutation  
**Description:** Approve or deny an approval request

**Arguments:**
```typescript
{
  approvalId: Id<"approvalRecords">
  decision: "APPROVED" | "DENIED"
  decidedBy: Id<"operators">
  reason?: string
}
```

**Returns:**
```typescript
{
  approvalId: Id<"approvalRecords">
  decision: "APPROVED" | "DENIED"
  record: ApprovalRecord
}
```

**Validation:**
- Can only decide on `PENDING` approvals
- Writes `APPROVAL_DECIDED` change record

### `approvalRecords.cancel`

**Type:** Mutation  
**Description:** Cancel a pending approval request

**Arguments:**
```typescript
{
  approvalId: Id<"approvalRecords">
  cancelledBy: Id<"operators">
  reason?: string
}
```

**Returns:** `Id<"approvalRecords">`

**Validation:**
- Can only cancel `PENDING` approvals
- Only requester can cancel
- Writes `APPROVAL_CANCELLED` change record

### `approvalRecords.getPendingCount`

**Type:** Query  
**Description:** Get count of pending approvals for a tenant

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
}
```

**Returns:** `number`

---

## Change Records

### `changeRecords.list`

**Type:** Query (not exposed, internal use)  
**Description:** List change records for audit trail

**Schema:**
```typescript
{
  _id: Id<"changeRecords">
  tenantId: Id<"tenants">
  type: string // Event type (e.g., "TEMPLATE_CREATED", "VERSION_TRANSITIONED")
  targetEntity: string // Entity type (e.g., "agentTemplate", "agentVersion")
  targetId: string // Entity ID
  operatorId?: Id<"operators">
  payload: any // Event-specific data
  timestamp: number
  _creationTime: number
}
```

**Event Types:**
- `TEMPLATE_CREATED`
- `VERSION_CREATED`
- `VERSION_TRANSITIONED`
- `INSTANCE_CREATED`
- `INSTANCE_TRANSITIONED`
- `POLICY_CREATED`
- `POLICY_UPDATED`
- `POLICY_DELETED`
- `APPROVAL_REQUESTED`
- `APPROVAL_DECIDED`
- `APPROVAL_CANCELLED`
- `INTEGRITY_FAILED`

---

## Cost Ledger

### `costLedger.record`

**Type:** Mutation  
**Description:** Record token usage and cost. Used by evaluations, manual entry, or **external inference services** (call via Convex client when tracking LLM usage).

**Arguments:**
```typescript
{
  tenantId: Id<"tenants">
  tokensUsed: number
  estimatedCost: number  // USD
  source: string         // e.g. "inference", "evaluation", "manual"
  versionId?: Id<"agentVersions">
  instanceId?: Id<"agentInstances">
  policyId?: Id<"policyEnvelopes">
  metadata?: any
}
```

### `costLedger.getSummary`

**Type:** Query  
**Arguments:** `{ tenantId, period?: "day" | "week" | "month" }`  
**Returns:** `{ totalTokens, totalCost, entryCount, period }`

---

## Error Handling

All Convex functions throw errors with descriptive messages:

```typescript
try {
  await createVersion({ ... })
} catch (error) {
  // Error message will be descriptive:
  // "Version label must be unique within template"
  // "Cannot transition from DRAFT to APPROVED"
  // "Policy not found"
  console.error(error.message)
}
```

**Common Error Patterns:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Not found" | Entity doesn't exist | Check ID is correct |
| "Must be unique" | Duplicate name/label | Choose different name |
| "Cannot transition" | Invalid state change | Check state machine rules |
| "Cannot delete" | Entity has dependencies | Remove dependencies first |
| "Unauthorized" | Missing auth context | Ensure user is authenticated |

---

## Rate Limits

Convex has built-in rate limiting:
- **Queries:** No limit (reactive)
- **Mutations:** 1000/minute per user
- **Database reads:** 1M/month (free tier)
- **Database writes:** 100K/month (free tier)

For production, upgrade to Convex Pro for higher limits.

---

## Best Practices

### 1. Use Optimistic Updates

```typescript
const updateStatus = useMutation(api.agentVersions.transition)

// Optimistic UI update
setLocalState("TESTING")
try {
  await updateStatus({ versionId, newState: "TESTING" })
} catch (error) {
  setLocalState(originalState) // Rollback
  toast.error(error.message)
}
```

### 2. Handle Loading States

```typescript
const versions = useQuery(api.agentVersions.list, { tenantId })

if (versions === undefined) {
  return <LoadingSpinner />
}

if (versions.length === 0) {
  return <EmptyState />
}

return <VersionList versions={versions} />
```

### 3. Batch Related Queries

```typescript
// Good: Single component, multiple queries
const templates = useQuery(api.agentTemplates.list, { tenantId })
const versions = useQuery(api.agentVersions.list, { tenantId })
const instances = useQuery(api.agentInstances.list, { tenantId })

// Bad: Nested queries in loops (causes waterfalls)
```

### 4. Use Change Records for Audit

```typescript
// All mutations automatically write change records
// Query them for audit trail:
const changes = await ctx.db
  .query("changeRecords")
  .withIndex("by_target", (q) =>
    q.eq("targetEntity", "agentVersion").eq("targetId", versionId)
  )
  .collect()
```

---

## Support

For API questions or issues:
- **Documentation:** [docs/](../docs/)
- **GitHub Issues:** [github.com/your-org/arm/issues](https://github.com)
- **Convex Docs:** [docs.convex.dev](https://docs.convex.dev)

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0  
**Maintainer:** ARM Team
