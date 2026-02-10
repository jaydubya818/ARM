# ARM Architecture

**System Design Documentation**  
**Last Updated:** February 10, 2026  
**Version:** 1.0.0

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [Core Concepts](#core-concepts)
- [State Machines](#state-machines)
- [Security Model](#security-model)
- [Scalability](#scalability)
- [Design Decisions](#design-decisions)

---

## Overview

ARM (Agent Resource Management) is a **governance platform for AI agent fleets**. It provides:

- **Version Control**: Immutable agent versions with genome hashing
- **Lifecycle Management**: State machines for versions and instances
- **Policy Enforcement**: Autonomy tiers and resource limits
- **Approval Workflows**: Human-in-the-loop governance
- **Audit Trail**: Append-only change records
- **Multi-Tenancy**: Isolated tenant data

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ DirectoryView│  │PoliciesView │  │ApprovalsView│         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                 │                 │
│         └─────────────────┴─────────────────┘                │
│                           │                                   │
│                    React + Tailwind                          │
└───────────────────────────┼───────────────────────────────────┘
                            │
                    Convex React Client
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                      Convex Backend                           │
│                           │                                   │
│  ┌────────────────────────┴────────────────────────┐         │
│  │              Convex Functions                    │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │         │
│  │  │Templates │  │ Versions │  │Instances │      │         │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘      │         │
│  │       │             │              │             │         │
│  │  ┌────┴─────────────┴──────────────┴─────┐      │         │
│  │  │        Convex Database                 │      │         │
│  │  │  ┌──────────┐  ┌──────────┐           │      │         │
│  │  │  │  Schema  │  │  Indexes │           │      │         │
│  │  │  └──────────┘  └──────────┘           │      │         │
│  │  └────────────────────────────────────────┘      │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                │
│  ┌────────────────────────────────────────────────┐           │
│  │              Business Logic                     │           │
│  │  ┌──────────────┐  ┌──────────────┐           │           │
│  │  │genomeHash.ts │  │policyEval.ts │           │           │
│  │  └──────────────┘  └──────────────┘           │           │
│  │  ┌──────────────┐  ┌──────────────┐           │           │
│  │  │approvalEngine│  │stateMachine  │           │           │
│  │  └──────────────┘  └──────────────┘           │           │
│  └────────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

### Component Layers

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Presentation** | React + Tailwind | UI components, user interactions |
| **State Management** | Convex React Client | Reactive data binding, optimistic updates |
| **API Layer** | Convex Functions | Queries (reads), Mutations (writes) |
| **Business Logic** | TypeScript Utilities | Genome hashing, policy evaluation, state machines |
| **Data Layer** | Convex Database | Persistent storage, indexes, relationships |

---

## Data Model

### Entity Relationship Diagram

```
┌──────────────┐
│   Tenants    │
└──────┬───────┘
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
       ▼                                                 ▼
┌──────────────┐                                 ┌──────────────┐
│ Environments │                                 │  Operators   │
└──────────────┘                                 └──────────────┘
       │                                                 │
       │                                                 │
       ▼                                                 ▼
┌──────────────┐         ┌──────────────┐       ┌──────────────┐
│  Providers   │         │   Templates  │       │ChangeRecords│
└──────────────┘         └──────┬───────┘       └──────────────┘
       │                        │
       │                        ▼
       │                 ┌──────────────┐
       │                 │   Versions   │
       │                 └──────┬───────┘
       │                        │
       │                        ▼
       │                 ┌──────────────┐
       └────────────────>│  Instances   │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Policies   │
                         └──────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Approvals   │
                         └──────────────┘
```

### Core Tables

#### 1. Tenants
**Purpose:** Multi-tenant isolation root

```typescript
{
  _id: Id<"tenants">
  name: string
  slug: string
  settings?: any
}
```

**Indexes:**
- `by_slug`: Fast tenant lookup

#### 2. Agent Templates
**Purpose:** Agent type definitions

```typescript
{
  _id: Id<"agentTemplates">
  tenantId: Id<"tenants">
  name: string
  description?: string
  owners: string[]
  tags: string[]
}
```

**Indexes:**
- `by_tenant`: List templates for tenant
- `by_name`: Unique name enforcement

#### 3. Agent Versions
**Purpose:** Immutable agent configurations

```typescript
{
  _id: Id<"agentVersions">
  templateId: Id<"agentTemplates">
  tenantId: Id<"tenants">
  versionLabel: string
  genome: AgentGenome
  genomeHash: string // SHA-256
  lifecycleState: VersionState
  evalStatus: EvalStatus
  parentVersionId?: Id<"agentVersions">
}
```

**Indexes:**
- `by_tenant`: List versions for tenant
- `by_template`: List versions for template
- `by_state`: Filter by lifecycle state
- `by_hash`: Detect duplicate genomes

#### 4. Agent Instances
**Purpose:** Runtime agent deployments

```typescript
{
  _id: Id<"agentInstances">
  versionId: Id<"agentVersions">
  tenantId: Id<"tenants">
  environmentId: Id<"environments">
  providerId: Id<"providers">
  state: InstanceState
  policyEnvelopeId?: string
  heartbeatAt?: number
  metadata?: any
}
```

**Indexes:**
- `by_tenant`: List instances for tenant
- `by_version`: Find instances of a version
- `by_environment`: Filter by environment
- `by_state`: Filter by state

#### 5. Policy Envelopes
**Purpose:** Governance rules

```typescript
{
  _id: Id<"policyEnvelopes">
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

#### 6. Approval Records
**Purpose:** Human-in-the-loop workflows

```typescript
{
  _id: Id<"approvalRecords">
  tenantId: Id<"tenants">
  requestType: string
  targetId: string
  status: "PENDING" | "APPROVED" | "DENIED" | "CANCELLED"
  requestedBy: Id<"operators">
  decidedBy?: Id<"operators">
}
```

#### 7. Change Records
**Purpose:** Append-only audit trail

```typescript
{
  _id: Id<"changeRecords">
  tenantId: Id<"tenants">
  type: string // Event type
  targetEntity: string
  targetId: string
  operatorId?: Id<"operators">
  payload: any
  timestamp: number
}
```

---

## Core Concepts

### 1. Immutable Genome

**Principle:** Agent versions are write-once. Any change requires a new version.

**Implementation:**
```typescript
// ✅ Correct: Create new version
const newVersionId = await createVersion({
  templateId,
  versionLabel: "v1.0.1",
  genome: modifiedGenome,
  parentVersionId: oldVersionId, // Track lineage
})

// ❌ Wrong: Modify existing version (mutation doesn't exist)
await updateVersion({ versionId, genome: modifiedGenome })
```

**Why:**
- **Reproducibility**: Exact genome can be recreated
- **Auditability**: Full history of changes
- **Rollback**: Previous versions always available
- **Integrity**: SHA-256 hash prevents tampering

### 2. Genome Hashing

**Purpose:** Deterministic fingerprint of agent configuration

**Algorithm:**
1. Canonicalize genome (sorted keys, stable JSON)
2. Compute SHA-256 hash
3. Store hash with version
4. Verify on read

**Implementation:**
```typescript
// convex/lib/genomeHash.ts
export function computeGenomeHash(genome: AgentGenome): string {
  const canonical = canonicalizeGenome(genome)
  const hash = createHash('sha256')
  hash.update(canonical)
  return hash.digest('hex')
}
```

**Verification:**
```typescript
// On version read
const computed = computeGenomeHash(version.genome)
if (computed !== version.genomeHash) {
  // Write integrity failure record
  await ctx.db.insert("changeRecords", {
    type: "INTEGRITY_FAILED",
    targetEntity: "agentVersion",
    targetId: versionId,
    payload: { computed, stored: version.genomeHash },
    timestamp: Date.now(),
  })
}
```

### 3. State Machines

**Purpose:** Enforce valid lifecycle transitions

**Version Lifecycle:**
```
DRAFT ──> TESTING ──> CANDIDATE ──> APPROVED ──> DEPRECATED ──> RETIRED
  ▲         │            │
  └─────────┴────────────┘
```

**Instance Lifecycle:**
```
PROVISIONING ──> ACTIVE ──> PAUSED ──> RETIRED
                   │         │
                   ├────────>│
                   │         │
                   ▼         ▼
              READONLY   DRAINING ──> RETIRED
                   │         │
                   ▼         │
             QUARANTINED ────┘
```

**Guards:**
- `TESTING → CANDIDATE`: Requires `evalStatus === "PASS"`
- `QUARANTINED → ACTIVE`: Requires approval
- `CANDIDATE → APPROVED`: May require approval (based on autonomy tier)

### 4. Policy Evaluation

**Purpose:** Determine if actions are allowed, denied, or need approval

**Decision Flow:**
```
Tool Call Request
       │
       ▼
┌──────────────┐
│ Check Policy │
│  Whitelist   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Check Cost   │
│   Limits     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Classify    │
│  Risk Level  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Check Autonomy│
│     Tier      │
└──────┬───────┘
       │
       ▼
    Decision
  (ALLOW/DENY/
NEEDS_APPROVAL)
```

**Risk Classification:**
- **Critical**: Database deletes, system commands, payments
- **High**: Database writes, external API calls
- **Medium**: Database reads, file reads
- **Low**: Search, lookup, non-sensitive reads

**Autonomy Tier Matrix:**

| Tier | Low Risk | Medium Risk | High Risk | Critical Risk |
|------|----------|-------------|-----------|---------------|
| 0    | Approval | Approval    | Approval  | Approval      |
| 1    | Allow    | Allow       | Approval  | Approval      |
| 2    | Allow    | Allow       | Allow     | Approval      |
| 3-5  | Allow    | Allow       | Allow     | Allow         |

### 5. Change Records

**Purpose:** Append-only audit trail for compliance

**Event Taxonomy:**
```typescript
type ChangeRecordType =
  | "TEMPLATE_CREATED"
  | "VERSION_CREATED"
  | "VERSION_TRANSITIONED"
  | "INSTANCE_CREATED"
  | "INSTANCE_TRANSITIONED"
  | "POLICY_CREATED"
  | "POLICY_UPDATED"
  | "POLICY_DELETED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_DECIDED"
  | "APPROVAL_CANCELLED"
  | "INTEGRITY_FAILED"
```

**Usage:**
```typescript
// Every mutation writes a change record
await ctx.db.insert("changeRecords", {
  tenantId,
  type: "VERSION_CREATED",
  targetEntity: "agentVersion",
  targetId: versionId,
  operatorId: ctx.auth.getUserIdentity()?.subject,
  payload: { versionLabel, genomeHash },
  timestamp: Date.now(),
})
```

---

## State Machines

### Version State Machine

**States:**
- `DRAFT`: Initial state, under development
- `TESTING`: Undergoing evaluation
- `CANDIDATE`: Passed evaluation, awaiting approval
- `APPROVED`: Production-ready
- `DEPRECATED`: Superseded by newer version
- `RETIRED`: No longer in use

**Transitions:**
```typescript
const transitions = {
  DRAFT: ["TESTING"],
  TESTING: ["CANDIDATE", "DRAFT"],
  CANDIDATE: ["APPROVED", "DRAFT"],
  APPROVED: ["DEPRECATED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [], // Terminal state
}
```

**Guards:**
```typescript
// TESTING → CANDIDATE requires passing evaluation
if (fromState === "TESTING" && toState === "CANDIDATE") {
  if (evalStatus !== "PASS") {
    throw new Error("Cannot promote to CANDIDATE without passing evaluation")
  }
}
```

### Instance State Machine

**States:**
- `PROVISIONING`: Being created
- `ACTIVE`: Running and accepting requests
- `PAUSED`: Temporarily stopped
- `READONLY`: Accepting reads only
- `DRAINING`: Finishing in-flight requests
- `QUARANTINED`: Isolated due to issues
- `RETIRED`: Permanently stopped

**Transitions:**
```typescript
const transitions = {
  PROVISIONING: ["ACTIVE", "RETIRED"],
  ACTIVE: ["PAUSED", "READONLY", "DRAINING", "QUARANTINED", "RETIRED"],
  PAUSED: ["ACTIVE", "RETIRED"],
  READONLY: ["ACTIVE", "RETIRED"],
  DRAINING: ["RETIRED"],
  QUARANTINED: ["ACTIVE", "RETIRED"],
  RETIRED: [], // Terminal state
}
```

---

## Security Model

### Multi-Tenancy

**Isolation Strategy:**
- Every table has `tenantId` field
- All queries filter by `tenantId`
- Indexes include `tenantId` as first field
- No cross-tenant data access

**Implementation:**
```typescript
// ✅ Correct: Tenant-scoped query
const templates = await ctx.db
  .query("agentTemplates")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .collect()

// ❌ Wrong: Global query (security risk)
const templates = await ctx.db.query("agentTemplates").collect()
```

### Authentication

**Current:** Development mode (no auth)  
**Production:** Convex Auth (planned for P2.0)

```typescript
// Future implementation
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error("Unauthorized")

// Map identity to operator
const operator = await ctx.db
  .query("operators")
  .withIndex("by_auth", (q) => q.eq("authIdentity", identity.subject))
  .first()
```

### Authorization

**Role-Based Access Control (RBAC):**

| Role | Permissions |
|------|-------------|
| **Admin** | All operations |
| **Operator** | Create/update templates, versions, instances |
| **Viewer** | Read-only access |
| **Approver** | Decide on approval requests |

**Implementation (planned):**
```typescript
function requireRole(operator: Operator, requiredRole: string) {
  const roleHierarchy = ["Viewer", "Operator", "Approver", "Admin"]
  const userLevel = roleHierarchy.indexOf(operator.role)
  const requiredLevel = roleHierarchy.indexOf(requiredRole)
  
  if (userLevel < requiredLevel) {
    throw new Error("Insufficient permissions")
  }
}
```

---

## Scalability

### Database Scaling

**Convex handles scaling automatically:**
- Automatic sharding
- Read replicas
- Global distribution (Enterprise)

**Optimization Strategies:**

1. **Indexes**: Add indexes for common queries
```typescript
defineTable({
  tenantId: v.id("tenants"),
  status: v.string(),
}).index("by_tenant_status", ["tenantId", "status"])
```

2. **Pagination**: Use cursor-based pagination
```typescript
const results = await ctx.db
  .query("agentVersions")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .paginate({ cursor: args.cursor, numItems: 50 })
```

3. **Denormalization**: Store computed values
```typescript
// Instead of counting on every query
const instanceCount = await ctx.db
  .query("agentInstances")
  .withIndex("by_version", (q) => q.eq("versionId", versionId))
  .collect()
  .length

// Store count in version record
{
  versionId,
  instanceCount: 42, // Updated on instance create/delete
}
```

### Frontend Scaling

**Code Splitting:**
```typescript
// Lazy load views
const PoliciesView = lazy(() => import('./views/PoliciesView'))
const ApprovalsView = lazy(() => import('./views/ApprovalsView'))
```

**Memoization:**
```typescript
// Expensive computations
const filtered = useMemo(() => {
  return data?.filter(item => item.status === filter)
}, [data, filter])
```

**Virtual Scrolling (future):**
```typescript
// For large lists (1000+ items)
import { useVirtualizer } from '@tanstack/react-virtual'
```

---

## Design Decisions

### Why Convex?

**Chosen:** Convex  
**Alternatives Considered:** PostgreSQL + FastAPI, Supabase, Firebase

**Rationale:**
- ✅ Real-time reactivity (no polling)
- ✅ TypeScript end-to-end
- ✅ Automatic scaling
- ✅ Built-in auth (future)
- ✅ Serverless (no infrastructure management)
- ✅ Optimistic updates built-in
- ❌ Vendor lock-in (acceptable trade-off)

### Why Immutable Versions?

**Chosen:** Immutable genome + versioning  
**Alternative:** Mutable versions with history

**Rationale:**
- ✅ Reproducibility guaranteed
- ✅ Rollback is instant (just change instance pointer)
- ✅ No "config drift" issues
- ✅ Audit trail is simple (create events only)
- ❌ More storage (acceptable, versions are small)

### Why SHA-256 for Hashing?

**Chosen:** SHA-256  
**Alternatives:** MD5, SHA-1, xxHash

**Rationale:**
- ✅ Cryptographically secure
- ✅ Industry standard
- ✅ Collision-resistant
- ✅ Deterministic
- ❌ Slower than xxHash (acceptable, not performance-critical)

### Why Autonomy Tiers (0-5)?

**Chosen:** 0-5 scale  
**Alternative:** Binary (allowed/denied)

**Rationale:**
- ✅ Granular control
- ✅ Intuitive scale
- ✅ Room for nuance
- ✅ Aligns with risk levels
- ❌ More complex (acceptable, worth the flexibility)

### Why Append-Only Change Records?

**Chosen:** Append-only audit trail  
**Alternative:** Update existing records

**Rationale:**
- ✅ Immutable audit trail
- ✅ Compliance-friendly
- ✅ Time-travel queries
- ✅ No data loss
- ❌ More storage (acceptable, records are small)

---

## Performance Characteristics

### Query Performance

| Operation | Latency | Throughput |
|-----------|---------|------------|
| List templates | <50ms | 1000/sec |
| Get version (with hash verification) | <100ms | 500/sec |
| List instances | <50ms | 1000/sec |
| Create version | <200ms | 100/sec |
| Policy evaluation | <10ms | 5000/sec |

### Database Limits

**Convex Free Tier:**
- 1M reads/month
- 100K writes/month
- 1GB storage

**Estimated Capacity:**
- **Tenants**: 1,000
- **Templates**: 10,000
- **Versions**: 100,000
- **Instances**: 1,000,000
- **Policies**: 10,000
- **Approvals**: 100,000/month

---

## Future Enhancements

### Planned (P2.0+)

1. **Evaluation Orchestration**
   - Test suite execution
   - Result aggregation
   - Automated promotion

2. **Cost Tracking**
   - Token usage monitoring
   - Cost attribution by tenant
   - Budget alerts

3. **Federation**
   - Multi-region support
   - Cross-region replication
   - Federated identity

4. **Advanced Monitoring**
   - Real-time dashboards
   - Anomaly detection
   - Performance insights

---

## References

- **Convex Docs**: [docs.convex.dev](https://docs.convex.dev)
- **React Docs**: [react.dev](https://react.dev)
- **Tailwind Docs**: [tailwindcss.com](https://tailwindcss.com)
- **ARM PRD**: [docs/PRD.md](PRD.md)
- **ARM Tech Stack**: [docs/TECH_STACK.md](TECH_STACK.md)

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0  
**Maintainer:** ARM Team
