# ARM - Backend Structure

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Platform:** Convex

---

## Database Schema

### Tables (9 Core + 2 P1.2)

#### 1. tenants
**Purpose:** Multi-tenant isolation root

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'tenants'> | Auto | Primary | Convex-generated ID |
| name | string | Yes | - | Tenant display name |
| slug | string | Yes | by_slug | URL-safe identifier |
| settings | object | No | - | Tenant configuration |
| _creationTime | number | Auto | - | Convex timestamp |

**Indexes:**
- `by_slug(slug)` - Unique tenant lookup

**Sample Data:**
```json
{
  "_id": "j12345678",
  "name": "ARM Dev Org",
  "slug": "arm-dev",
  "settings": {}
}
```

---

#### 2. environments
**Purpose:** Deployment targets (dev, staging, prod)

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'environments'> | Auto | Primary | Convex-generated ID |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| name | string | Yes | - | Display name |
| slug | string | Yes | - | URL-safe identifier |
| config | object | No | - | Environment config |

**Indexes:**
- `by_tenant(tenantId)` - List environments per tenant

**Sample Data:**
```json
{
  "_id": "j23456789",
  "tenantId": "j12345678",
  "name": "Production",
  "slug": "prod",
  "config": { "region": "us-east-1" }
}
```

---

#### 3. operators
**Purpose:** Human operators (ops engineers, admins)

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'operators'> | Auto | Primary | Convex-generated ID |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| authIdentity | string | Yes | by_auth | Convex auth ID |
| email | string | Yes | - | Operator email |
| name | string | Yes | - | Display name |
| role | string | Yes | - | admin, operator, viewer |

**Indexes:**
- `by_tenant(tenantId)` - List operators per tenant
- `by_auth(authIdentity)` - Lookup by Convex auth

**Sample Data:**
```json
{
  "_id": "j34567890",
  "tenantId": "j12345678",
  "authIdentity": "convex|abc123",
  "email": "ops@arm-dev.com",
  "name": "Ops Engineer",
  "role": "admin"
}
```

---

#### 4. providers
**Purpose:** Runtime provider registry (local, AWS, Azure, etc.)

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'providers'> | Auto | Primary | Convex-generated ID |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| name | string | Yes | by_name | Provider name |
| type | 'local' \| 'federated' | Yes | - | Provider type |
| federationConfig | object | No | - | Federation settings |
| healthEndpoint | string | No | - | Health check URL |
| metadata | object | No | - | Additional data |

**Indexes:**
- `by_tenant(tenantId)` - List providers per tenant
- `by_name(tenantId, name)` - Unique provider name per tenant

**Sample Data:**
```json
{
  "_id": "j45678901",
  "tenantId": "j12345678",
  "name": "local",
  "type": "local",
  "metadata": { "description": "Local runtime" }
}
```

---

#### 5. agentTemplates
**Purpose:** Agent family blueprints

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'agentTemplates'> | Auto | Primary | Convex-generated ID |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| name | string | Yes | by_name | Template name |
| description | string | No | - | Template description |
| owners | string[] | Yes | - | Owner emails |
| tags | string[] | Yes | - | Categorization tags |

**Indexes:**
- `by_tenant(tenantId)` - List templates per tenant
- `by_name(tenantId, name)` - Unique template name per tenant

**Sample Data:**
```json
{
  "_id": "j56789012",
  "tenantId": "j12345678",
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries",
  "owners": ["ops@arm-dev.com"],
  "tags": ["support", "customer-facing"]
}
```

---

#### 6. agentVersions ⭐ (Core Entity)
**Purpose:** Immutable agent builds with genome

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'agentVersions'> | Auto | Primary | Convex-generated ID |
| templateId | Id<'agentTemplates'> | Yes | by_template | Foreign key |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| versionLabel | string | Yes | - | Semver label (v1.0.0) |
| genome | Genome | Yes | - | **IMMUTABLE** genome object |
| genomeHash | string | Yes | by_hash | **IMMUTABLE** SHA-256 hash |
| lifecycleState | VersionLifecycleState | Yes | by_state | Current state |
| evalStatus | EvalStatus | Yes | - | Evaluation status |
| parentVersionId | Id<'agentVersions'> | No | - | Lineage parent |

**Indexes:**
- `by_tenant(tenantId)` - List versions per tenant
- `by_template(templateId)` - List versions per template
- `by_state(tenantId, lifecycleState)` - Filter by state
- `by_hash(genomeHash)` - Lookup by hash

**Genome Object:**
```typescript
{
  modelConfig: {
    provider: string,      // "anthropic", "openai", etc.
    model: string,         // "claude-3-5-sonnet-20241022"
    temperature?: number,  // 0-1
    maxTokens?: number     // Max output tokens
  },
  promptBundleHash: string,  // SHA-256 of prompt bundle
  toolManifest: [
    {
      toolId: string,              // "zendesk_search"
      schemaVersion: string,       // "1.0"
      requiredPermissions: string[] // ["zendesk:read"]
    }
  ],
  provenance?: {
    builtAt: string,        // ISO8601 timestamp
    builtBy: string,        // Operator email
    commitRef?: string,     // Git commit
    buildPipeline?: string, // CI/CD pipeline
    parentVersionId?: string // For lineage
  }
}
```

**Lifecycle States:**
```typescript
type VersionLifecycleState =
  | 'DRAFT'       // Initial state, editable metadata
  | 'TESTING'     // Evaluation in progress
  | 'CANDIDATE'   // Passed eval, awaiting approval
  | 'APPROVED'    // Production-ready
  | 'DEPRECATED'  // Superseded by newer version
  | 'RETIRED'     // No active instances, archived
```

**Eval Status:**
```typescript
type EvalStatus =
  | 'NOT_RUN'   // No evaluation yet
  | 'RUNNING'   // Evaluation in progress
  | 'PASS'      // Evaluation passed
  | 'FAIL'      // Evaluation failed
```

**Sample Data:**
```json
{
  "_id": "j67890123",
  "templateId": "j56789012",
  "tenantId": "j12345678",
  "versionLabel": "v2.0.0",
  "genome": {
    "modelConfig": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.5,
      "maxTokens": 8192
    },
    "promptBundleHash": "sha256:xyz789ghi012",
    "toolManifest": [
      {
        "toolId": "zendesk_search",
        "schemaVersion": "1.0",
        "requiredPermissions": ["zendesk:read"]
      }
    ],
    "provenance": {
      "builtAt": "2026-02-10T12:00:00Z",
      "builtBy": "ops@arm-dev.com",
      "commitRef": "def456",
      "parentVersionId": "j67890122"
    }
  },
  "genomeHash": "a1b2c3d4e5f6...",
  "lifecycleState": "APPROVED",
  "evalStatus": "PASS",
  "parentVersionId": "j67890122"
}
```

**CRITICAL RULES:**
- ❌ **NO mutation exists for genome or genomeHash**
- ❌ **NO update operation modifies these fields**
- ✅ **Any change requires creating new version with parentVersionId**
- ✅ **Hash verified on detail reads only (not list queries)**

---

#### 7. agentInstances
**Purpose:** Runtime deployments

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'agentInstances'> | Auto | Primary | Convex-generated ID |
| versionId | Id<'agentVersions'> | Yes | by_version | Foreign key |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| environmentId | Id<'environments'> | Yes | by_environment | Foreign key |
| providerId | Id<'providers'> | Yes | - | Foreign key |
| state | InstanceState | Yes | by_state | Current state |
| identityPrincipal | string | No | - | IAM role/service account |
| secretRef | string | No | - | Secret manager reference |
| policyEnvelopeId | string | No | - | Attached policy (P1.2) |
| heartbeatAt | number | No | - | Last heartbeat timestamp |
| metadata | object | No | - | Additional data |

**Indexes:**
- `by_tenant(tenantId)` - List instances per tenant
- `by_version(versionId)` - List instances per version
- `by_environment(tenantId, environmentId)` - Filter by environment
- `by_state(tenantId, state)` - Filter by state

**Instance States:**
```typescript
type InstanceState =
  | 'PROVISIONING'  // Initial setup
  | 'ACTIVE'        // Running normally
  | 'PAUSED'        // Temporarily stopped
  | 'READONLY'      // Read-only mode (degraded)
  | 'DRAINING'      // Graceful shutdown
  | 'QUARANTINED'   // Isolated due to incident
  | 'RETIRED'       // Permanently stopped
```

**Sample Data:**
```json
{
  "_id": "j78901234",
  "versionId": "j67890123",
  "tenantId": "j12345678",
  "environmentId": "j23456789",
  "providerId": "j45678901",
  "state": "ACTIVE",
  "identityPrincipal": "arn:aws:iam::123:role/support-agent",
  "heartbeatAt": 1707577200000,
  "metadata": {
    "region": "us-east-1",
    "deployedBy": "ops@arm-dev.com"
  }
}
```

---

#### 8. changeRecords
**Purpose:** Append-only audit log

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'changeRecords'> | Auto | Primary | Convex-generated ID |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| type | ChangeRecordType | Yes | by_type | Event type |
| targetEntity | string | Yes | by_target | Entity type |
| targetId | string | Yes | by_target | Entity ID |
| operatorId | Id<'operators'> | No | - | Who made change |
| payload | object | Yes | - | Event-specific data |
| timestamp | number | Yes | - | Event timestamp |

**Indexes:**
- `by_tenant(tenantId)` - List all changes per tenant
- `by_target(targetEntity, targetId)` - Changes for specific entity
- `by_type(tenantId, type)` - Filter by event type

**Change Record Types:**
```typescript
type ChangeRecordType =
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_UPDATED'
  | 'VERSION_CREATED'
  | 'VERSION_TRANSITIONED'
  | 'VERSION_INTEGRITY_VERIFIED'
  | 'VERSION_INTEGRITY_FAILED'
  | 'INSTANCE_CREATED'
  | 'INSTANCE_TRANSITIONED'
  | 'INSTANCE_HEARTBEAT'
  | 'DEPLOYMENT_UPDATED'
  | 'POLICY_ATTACHED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_DECIDED'
```

**Sample Data:**
```json
{
  "_id": "j89012345",
  "tenantId": "j12345678",
  "type": "VERSION_TRANSITIONED",
  "targetEntity": "agentVersion",
  "targetId": "j67890123",
  "operatorId": "j34567890",
  "payload": {
    "from": "CANDIDATE",
    "to": "APPROVED"
  },
  "timestamp": 1707577200000
}
```

---

#### 9. policyEnvelopes (P1.2 Schema)
**Purpose:** Governance rules

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'policyEnvelopes'> | Auto | Primary | Convex-generated ID |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| name | string | Yes | - | Policy name |
| autonomyTier | number | Yes | - | 0-5 scale |
| allowedTools | string[] | Yes | - | Tool whitelist |
| costLimits | object | No | - | Cost caps |

**Sample Data (P1.2):**
```json
{
  "_id": "j90123456",
  "tenantId": "j12345678",
  "name": "Standard Support Policy",
  "autonomyTier": 2,
  "allowedTools": ["zendesk_search", "slack_notify"],
  "costLimits": {
    "dailyTokens": 100000,
    "monthlyCost": 500
  }
}
```

---

#### 10. approvalRecords (P1.2 Schema)
**Purpose:** Human-in-the-loop approvals

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| _id | Id<'approvalRecords'> | Auto | Primary | Convex-generated ID |
| tenantId | Id<'tenants'> | Yes | by_tenant | Foreign key |
| requestType | string | Yes | - | VERSION_PROMOTION, etc. |
| targetId | string | Yes | - | Target entity ID |
| status | string | Yes | - | PENDING, APPROVED, DENIED |
| requestedBy | Id<'operators'> | Yes | - | Requester |
| decidedBy | Id<'operators'> | No | - | Approver |

---

## Convex Functions

### Query Pattern
```typescript
// convex/moduleName.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const functionName = query({
  args: {
    tenantId: v.id("tenants"),
    // ... other args
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tableName")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
```

### Mutation Pattern
```typescript
export const functionName = mutation({
  args: {
    tenantId: v.id("tenants"),
    // ... other args
  },
  handler: async (ctx, args) => {
    // 1. Validate
    // 2. Insert/update
    const id = await ctx.db.insert("tableName", data);
    
    // 3. Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "EVENT_TYPE",
      targetEntity: "entityName",
      targetId: id,
      payload: { /* event data */ },
      timestamp: Date.now(),
    });
    
    return id;
  },
});
```

---

## API Contracts

### agentTemplates Module

#### `create()`
**Input:**
```typescript
{
  tenantId: Id<'tenants'>,
  name: string,
  description?: string,
  owners: string[],
  tags: string[]
}
```

**Output:** `Id<'agentTemplates'>`

**Side Effects:**
- Inserts template
- Writes TEMPLATE_CREATED change record

---

#### `list()`
**Input:**
```typescript
{
  tenantId: Id<'tenants'>
}
```

**Output:** `AgentTemplate[]`

**Side Effects:** None

---

### agentVersions Module

#### `create()`
**Input:**
```typescript
{
  templateId: Id<'agentTemplates'>,
  tenantId: Id<'tenants'>,
  versionLabel: string,
  genome: Genome,
  parentVersionId?: Id<'agentVersions'>
}
```

**Output:** `Id<'agentVersions'>`

**Side Effects:**
- Computes genome hash (SHA-256)
- Inserts version with state=DRAFT, evalStatus=NOT_RUN
- Writes VERSION_CREATED change record

**Validation:**
- Version label unique for template
- Genome has required fields
- Parent version exists (if provided)

---

#### `get()`
**Input:**
```typescript
{
  versionId: Id<'agentVersions'>
}
```

**Output:**
```typescript
AgentVersion & {
  integrityStatus: 'VERIFIED' | 'TAMPERED'
}
```

**Side Effects:**
- Recomputes genome hash
- Compares with stored hash
- Writes VERSION_INTEGRITY_VERIFIED or VERSION_INTEGRITY_FAILED

**Performance:** O(1) lookup + O(n) hash computation (n = genome size)

---

#### `list()`
**Input:**
```typescript
{
  tenantId: Id<'tenants'>
}
```

**Output:** `AgentVersion[]`

**Side Effects:** None

**Performance:** O(n) where n = versions per tenant. NO hash verification.

---

#### `getLineage()`
**Input:**
```typescript
{
  versionId: Id<'agentVersions'>
}
```

**Output:** `AgentVersion[]` (ordered: current → parent → grandparent → ...)

**Side Effects:** None

**Performance:** O(d) where d = depth of lineage chain

---

#### `transition()`
**Input:**
```typescript
{
  versionId: Id<'agentVersions'>,
  newState: VersionLifecycleState
}
```

**Output:** `Id<'agentVersions'>`

**Side Effects:**
- Updates lifecycleState
- Writes VERSION_TRANSITIONED change record

**Validation (P1.2):**
- Transition allowed by state machine
- Guards satisfied (e.g., TESTING → CANDIDATE requires evalStatus=PASS)

---

### agentInstances Module

#### `create()`
**Input:**
```typescript
{
  versionId: Id<'agentVersions'>,
  tenantId: Id<'tenants'>,
  environmentId: Id<'environments'>,
  providerId: Id<'providers'>,
  identityPrincipal?: string,
  secretRef?: string,
  policyEnvelopeId?: string,
  metadata?: object
}
```

**Output:** `Id<'agentInstances'>`

**Side Effects:**
- Inserts instance with state=PROVISIONING
- Sets heartbeatAt to current time
- Writes INSTANCE_CREATED change record

---

#### `transition()`
**Input:**
```typescript
{
  instanceId: Id<'agentInstances'>,
  newState: InstanceState
}
```

**Output:** `Id<'agentInstances'>`

**Side Effects:**
- Updates state
- Writes INSTANCE_TRANSITIONED change record

---

#### `heartbeat()`
**Input:**
```typescript
{
  instanceId: Id<'agentInstances'>
}
```

**Output:** `Id<'agentInstances'>`

**Side Effects:**
- Updates heartbeatAt to current time
- No change record (too noisy)

---

## Genome Hashing

### Algorithm: SHA-256

**Implementation:** `convex/lib/genomeHash.ts`

#### `canonicalizeGenome(genome: Genome): string`
**Purpose:** Deterministic JSON serialization

**Steps:**
1. Deep sort all object keys alphabetically
2. Remove undefined values
3. Recursively process arrays and nested objects
4. Return JSON string

**Example:**
```typescript
Input: { b: 2, a: 1, c: undefined }
Output: '{"a":1,"b":2}'
```

---

#### `computeGenomeHash(genome: Genome): Promise<string>`
**Purpose:** Compute SHA-256 hash

**Steps:**
1. Canonicalize genome
2. Encode to UTF-8 bytes
3. Compute SHA-256 hash using Web Crypto API
4. Convert to hex string

**Example:**
```typescript
Input: { modelConfig: {...}, promptBundleHash: "...", toolManifest: [...] }
Output: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234"
```

---

#### `verifyGenomeIntegrity(genome: Genome, storedHash: string): Promise<boolean>`
**Purpose:** Verify genome not tampered

**Steps:**
1. Compute hash of current genome
2. Compare with stored hash
3. Return true if match, false otherwise

**Usage:**
- Called in `agentVersions.get()` only
- NOT called in `agentVersions.list()` (performance)

---

## Authentication (P1.1 - Configured, Not Enforced)

### Convex Built-in Auth
- **Provider:** Convex Auth
- **Status:** Configured but not enforced
- **P1.1:** All queries/mutations public
- **P1.2:** Add auth checks

### Future Auth Flow (P1.2)
```typescript
// In mutation handler
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");

const operator = await ctx.db
  .query("operators")
  .withIndex("by_auth", (q) => q.eq("authIdentity", identity.subject))
  .first();

if (!operator) throw new Error("Operator not found");
```

---

## Error Handling

### Query Errors
```typescript
// Return null for not found
export const get = query({
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    return item || null;  // Not undefined
  }
});
```

### Mutation Errors
```typescript
// Throw descriptive errors
export const create = mutation({
  handler: async (ctx, args) => {
    // Validation
    if (!args.name) {
      throw new Error("Name is required");
    }
    
    // Uniqueness check
    const existing = await ctx.db
      .query("agentTemplates")
      .withIndex("by_name", (q) => 
        q.eq("tenantId", args.tenantId).eq("name", args.name)
      )
      .first();
    
    if (existing) {
      throw new Error("Template name must be unique");
    }
    
    // Insert
    return await ctx.db.insert("agentTemplates", args);
  }
});
```

---

## Performance Optimization

### Indexing Strategy
- **Always index:** tenantId (multi-tenant isolation)
- **Index frequently queried fields:** status, state, type
- **Compound indexes:** (tenantId, name), (tenantId, lifecycleState)

### Query Optimization
```typescript
// ✅ Correct (uses index)
.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))

// ❌ Wrong (full table scan)
.filter((q) => q.eq(q.field("tenantId"), tenantId))
```

### Pagination (P1.2)
```typescript
// Use .paginate() for large datasets
export const list = query({
  args: {
    tenantId: v.id("tenants"),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentVersions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .paginate(args.paginationOpts);
  }
});
```

---

## Data Validation

### Required Fields
- Validate in mutation handler
- Throw clear error messages
- No silent failures

### Type Safety
```typescript
// ✅ Correct (Convex validators)
args: {
  name: v.string(),
  age: v.number(),
  tags: v.array(v.string())
}

// ❌ Wrong (any type)
args: {
  data: v.any()
}
```

### Business Logic Validation
```typescript
// Example: Version label must be semver
if (!/^v\d+\.\d+\.\d+$/.test(args.versionLabel)) {
  throw new Error("Version label must be semver format (e.g., v1.0.0)");
}
```

---

## Testing (P1.2+)

### Unit Tests
```typescript
// convex/lib/genomeHash.test.ts
import { describe, it, expect } from 'vitest'
import { canonicalizeGenome, computeGenomeHash } from './genomeHash'

describe('canonicalizeGenome', () => {
  it('sorts keys alphabetically', () => {
    const input = { b: 2, a: 1 }
    const output = canonicalizeGenome(input)
    expect(output).toBe('{"a":1,"b":2}')
  })
})
```

### Integration Tests
```typescript
// Test full flow: create version → verify integrity
```

---

## Migration Strategy

### Schema Changes
1. Add new field with `v.optional()`
2. Deploy schema change
3. Backfill existing records (if needed)
4. Make field required (if needed)

### Data Migrations
```typescript
// convex/migrations/001_backfill_field.ts
export default mutation({
  handler: async (ctx) => {
    const items = await ctx.db.query("tableName").collect();
    
    for (const item of items) {
      await ctx.db.patch(item._id, {
        newField: defaultValue
      });
    }
  }
});
```

---

## Monitoring (P2.0+)

### Metrics to Track
- Query latency (p50, p95, p99)
- Mutation success rate
- Change record volume
- Integrity check failures

### Alerts
- Integrity check failure rate >1%
- Query latency >1s
- Mutation error rate >5%

---

**Document Owner:** Backend Team  
**Last Review:** February 10, 2026  
**Next Review:** March 10, 2026
