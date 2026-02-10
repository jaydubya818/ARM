# ARM Fork Boundary

**Created:** 2026-02-10  
**Purpose:** Document what we keep, quarantine, and refactor from the Agent Resources platform

---

## Objective

**ARM (Agent Resource Management)** is a version-centric agent registry focused on:
- Immutable version lineage with genome hashing
- Lifecycle state machines for versions and instances
- Multi-tenant isolation with single-tenant runtime (P1.1)
- Audit trail via ChangeRecords
- Policy-driven governance (P1.2+)

---

## Core Architectural Principles

### 1. Immutable AgentVersion Rule
**CRITICAL:** Version genome + hash are **write-once only**.

- `genome` fields: `modelConfig`, `promptBundleHash`, `toolManifest`, `provenance`
- `genomeHash`: SHA-256 of canonicalized genome
- No `agentVersions.update()` mutation exists for genome fields
- Any change to genome requires creating a new version with `parentVersionId` linkage
- Mutation layer throws error on attempts to modify genome/hash

### 2. Quarantine Strategy
- **Never delete** legacy code during fork
- Move to `_quarantine/` directories for reference
- Preserve git history
- Document why each piece was quarantined

### 3. Integrity Verification Strategy
- **Detail view only**: Recompute hash and compare on single version reads
- **List view**: Skip verification for performance
- **On mismatch**: Write `INTEGRITY_FAILED` ChangeRecord, return `integrityStatus: "TAMPERED"`

---

## What We Keep

### Backend (FastAPI)
- ✅ PostgreSQL schema as reference architecture
- ✅ Multi-tenant RLS patterns
- ✅ Database migrations approach
- ✅ JWT authentication patterns
- ✅ API endpoint structure

**Note:** FastAPI stays operational. Convex added as parallel backend for ARM-specific features.

### Infrastructure
- ✅ Docker Compose setup
- ✅ PostgreSQL, Temporal, Redis, MinIO
- ✅ Health check patterns

### Shared Concepts
- ✅ Agent templates, versions, instances hierarchy
- ✅ Policy envelopes (schema exists, P1.2 implementation)
- ✅ Evaluation suites (schema exists, P1.2 implementation)
- ✅ Multi-tenant isolation patterns
- ✅ Audit event logging

### UI (Minimal)
- ✅ React + TypeScript foundation
- ✅ Basic routing structure
- ✅ Component patterns (to be enhanced)

---

## What We Quarantine

### From Original AR Platform
Since this is a greenfield fork (no MissionControl history), we quarantine:

**Backend:**
- `_quarantine/fastapi/` - Original FastAPI implementation (keep running, but ARM uses Convex)
- `_quarantine/migrations/` - PostgreSQL migrations (reference only)

**Docs:**
- `_quarantine/docs/original-prd.md` - Original AR PRD
- `_quarantine/docs/original-roadmap.md` - Original implementation plan

**Rationale:** Preserve original vision while building ARM-specific implementation.

---

## What We Refactor

### Schema Evolution: PostgreSQL → Convex

**PostgreSQL (Reference):**
```sql
agent_templates (template_id, tenant_id, name, ...)
agent_versions (version_id, template_id, artifact_hash, model_bundle, ...)
agent_instances (instance_id, version_id, environment, ...)
```

**Convex (ARM Implementation):**
```typescript
agentTemplates (tenantId, name, description, owners, tags)
agentVersions (
  templateId, tenantId,
  genome: { modelConfig, promptBundleHash, toolManifest, provenance },
  genomeHash, // SHA-256, immutable
  lifecycleState, evalStatus,
  parentVersionId // lineage
)
agentInstances (
  versionId, tenantId, environmentId, providerId,
  state, identityPrincipal, secretRef, policyEnvelopeId
)
```

### Key Additions in ARM

**1. Providers Table** (NEW in P1.1)
```typescript
providers (
  tenantId, name, type,
  federationConfig, healthEndpoint, metadata
)
```
- Seed "local" provider on bootstrap
- Instances reference via `providerId` foreign key
- Enables future federation without stringly-typed provider names

**2. ChangeRecords Taxonomy** (NEW in P1.1)
Typed event taxonomy for audit spine:
```typescript
type ChangeRecordType =
  | "TEMPLATE_CREATED" | "TEMPLATE_UPDATED"
  | "VERSION_CREATED" | "VERSION_TRANSITIONED"
  | "VERSION_INTEGRITY_VERIFIED" | "VERSION_INTEGRITY_FAILED"
  | "INSTANCE_CREATED" | "INSTANCE_TRANSITIONED" | "INSTANCE_HEARTBEAT"
  | "DEPLOYMENT_UPDATED"
  | "POLICY_ATTACHED" | "APPROVAL_REQUESTED" | "APPROVAL_DECIDED"
```

**3. Genome Hashing** (NEW in P1.1)
```typescript
// convex/lib/genomeHash.ts
function canonicalizeGenome(genome: Genome): string {
  // Deep sort keys, strip undefined, deterministic JSON
}

function computeGenomeHash(genome: Genome): string {
  return sha256(canonicalizeGenome(genome))
}
```

**4. State Machines** (ENHANCED)
Original AR had basic status enums. ARM adds:
- Formal state machine definitions with allowed transitions
- Guard conditions (e.g., TESTING → CANDIDATE requires evalStatus === PASS)
- Automatic ChangeRecord generation on transitions
- Validation layer prevents invalid state changes

---

## Migration Path

### Phase 1.1 (This Plan)
- ✅ Add Convex alongside FastAPI
- ✅ Implement ARM schema in Convex
- ✅ Build ARM UI with Tailwind
- ✅ Immutable genome + hashing
- ✅ State machines + audit trail
- ⚠️ FastAPI remains operational (no migration yet)

### Phase 1.2 (Future)
- Migrate policy evaluation to Convex
- Add approval workflows
- Implement evaluation orchestration
- Deprecate FastAPI endpoints (optional)

### Phase 2.0 (Future)
- Federation support
- Advanced policy engine
- Telemetry integration
- Cost tracking

---

## File Inventory

### New Files (ARM-specific)
```
ARM/
├── FORK_BOUNDARY.md                    # This file
├── ARM_BUILD_PLAN.md                   # Implementation plan
├── convex/                             # NEW: Convex backend
│   ├── schema.ts
│   ├── lib/
│   │   ├── genomeHash.ts
│   │   ├── getActiveTenant.ts
│   │   └── index.ts
│   ├── tenants.ts
│   ├── environments.ts
│   ├── operators.ts
│   ├── providers.ts                    # NEW: Provider registry
│   ├── agentTemplates.ts
│   ├── agentVersions.ts
│   ├── agentInstances.ts
│   ├── changeRecords.ts
│   └── seedARM.ts
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── types/
│   │       │   ├── tenant.ts
│   │       │   ├── environment.ts
│   │       │   ├── operator.ts
│   │       │   ├── provider.ts        # NEW
│   │       │   ├── template.ts
│   │       │   ├── version.ts
│   │       │   ├── instance.ts
│   │       │   ├── deployment.ts
│   │       │   ├── policy.ts
│   │       │   ├── approval.ts
│   │       │   ├── change.ts
│   │       │   └── common.ts
│   │       └── index.ts
│   └── state-machine/
│       └── src/
│           ├── versionStateMachine.ts
│           ├── instanceStateMachine.ts
│           └── index.ts
├── ui/                                 # ENHANCED: ARM UI
│   └── src/
│       ├── views/
│       │   ├── DirectoryView.tsx
│       │   ├── VersionDrawer.tsx
│       │   ├── PoliciesView.tsx       # Placeholder
│       │   ├── EvaluationsView.tsx    # Placeholder
│       │   ├── IncidentsView.tsx      # Placeholder
│       │   ├── CostView.tsx           # Placeholder
│       │   ├── AuditView.tsx          # Placeholder
│       │   └── FederationView.tsx     # Placeholder
│       ├── components/
│       │   ├── CreateTemplateModal.tsx
│       │   ├── CreateVersionModal.tsx
│       │   ├── StatusChip.tsx
│       │   └── CopyButton.tsx
│       ├── App.tsx
│       ├── Sidebar.tsx
│       └── index.css                   # Tailwind + ARM theme
└── _quarantine/                        # Preserved original code
    ├── fastapi/                        # Original API (reference)
    ├── migrations/                     # PostgreSQL migrations
    └── docs/                           # Original documentation
```

### Quarantined Files
```
_quarantine/
├── fastapi/
│   └── services/control-plane/         # Original FastAPI service
├── migrations/
│   └── *.sql                           # PostgreSQL migrations
└── docs/
    ├── PRD-Agent-Resources.md          # Original PRD
    └── ROADMAP.md                      # Original roadmap
```

---

## Risk Management

### Technical Risks

**Risk:** Convex + FastAPI running in parallel adds complexity  
**Mitigation:** Clear separation of concerns. Convex for ARM features, FastAPI for legacy/reference.  
**Fallback:** Can remove FastAPI in Phase 2 if Convex proves sufficient.

**Risk:** Immutability enforcement might be bypassed  
**Mitigation:** No mutation exists at schema level. TypeScript types enforce at compile time.  
**Fallback:** Add database triggers if runtime enforcement needed.

**Risk:** Hash verification performance on large datasets  
**Mitigation:** Only verify on detail reads, skip on list queries.  
**Fallback:** Add caching layer for computed hashes.

### Process Risks

**Risk:** Scope creep from "walking skeleton" to full implementation  
**Mitigation:** Strict adherence to P1.1 scope. Defer P1.2+ features.  
**Fallback:** Cut nice-to-have features (CopyButton, policy simulator placeholder).

---

## Success Metrics

### P1.1 Completion Criteria
- [ ] All TypeScript compiles without errors
- [ ] Dev server runs without crashes
- [ ] Directory view loads and displays data
- [ ] Can create template → version → instance end-to-end
- [ ] Version genome hash verified on detail read
- [ ] Attempting to mutate genome fails or is impossible
- [ ] State transitions enforce rules (e.g., can't skip TESTING)
- [ ] ChangeRecords written for all mutations
- [ ] Lineage chain displays correctly
- [ ] Seed script creates complete test dataset

### Performance Targets (P1.1)
- Directory list query: <500ms for 1000 versions
- Version detail with hash verification: <200ms
- Create version: <300ms

---

## Next Steps

After completing this plan:
1. Review git log for clean commit history
2. Run full test suite
3. Document how to run ARM locally
4. Create demo video showing end-to-end flow
5. Plan P1.2 features (policy evaluation, approvals)

---

**Document Owner:** Claude Code  
**Reviewers:** Development Team  
**Approval:** Pending implementation completion
