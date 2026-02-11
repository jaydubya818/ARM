# ARM - Product Requirements Document

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** Phases 1–5 Complete, Production Ready

---

## Executive Summary

**What:** ARM (Agent Resource Management) is an enterprise system of record for AI agent fleets, providing immutable version lineage, policy-driven governance, and audit trails.

**Who:** Engineering teams deploying and managing AI agents at scale.

**Why:** Organizations need HCM-like lifecycle management for non-human workers with version control, compliance, and economic accountability.

---

## Product Vision

ARM reimagines HCM (Human Capital Management) for AI agents with agent-native primitives:
- Immutable version lineage with SHA-256 genome hashing
- Formal state machines for lifecycle management
- Policy envelopes for autonomy control
- Continuous evaluation harnesses
- Economic ledgers for cost attribution

---

## In Scope (P1.1 - COMPLETE)

### Core Registry
✅ **Agent Templates** - Blueprints for agent families
- Name, description, owners, tags
- Multi-tenant isolation
- CRUD operations with change records

✅ **Agent Versions** - Immutable builds with genome
- Version label, genome (model + prompt + tools), SHA-256 hash
- Lifecycle states: DRAFT → TESTING → CANDIDATE → APPROVED → DEPRECATED → RETIRED
- Parent version linkage for lineage tracking
- Integrity verification on detail reads (not list queries)
- **CRITICAL:** No mutation exists for genome/genomeHash (write-once only)

✅ **Agent Instances** - Runtime deployments
- Bound to version + environment + provider
- States: PROVISIONING → ACTIVE → PAUSED → READONLY → DRAINING → QUARANTINED → RETIRED
- Heartbeat tracking
- Policy envelope binding (schema exists, enforcement P1.2)

✅ **Providers** - Runtime provider registry
- Local and federated types
- Federation config, health endpoints
- Foreign key constraints (not stringly-typed)

✅ **Environments** - Deployment targets
- dev, staging, prod
- Per-tenant configuration

✅ **Audit Trail** - ChangeRecords
- 12 typed events: TEMPLATE_CREATED, VERSION_CREATED, VERSION_TRANSITIONED, INTEGRITY_VERIFIED, INTEGRITY_FAILED, etc.
- Append-only log
- Queryable by tenant, target, type

### UI (P1.1 - COMPLETE)
✅ **Directory View** - Main registry interface
- Tabs: Templates, Versions, Instances
- Data tables with status chips
- Click version → open drawer

✅ **Version Drawer** - Side panel
- Genome details (model, prompt hash, tools)
- Integrity status (VERIFIED/TAMPERED)
- Lineage chain (parent versions)
- Change history

✅ **Placeholder Views** - Navigation structure
- Policies, Evaluations, Incidents, Cost, Audit, Federation
- Empty states with "Coming in P1.2+" message

✅ **Tailwind Theme** - ARM dark theme
- Custom color palette (navy, blue, accent, surface, etc.)
- Semantic tokens (bg-arm-surface, text-arm-text, etc.)

---

## In Scope (P1.2+ - COMPLETE)

### Policy Engine
✅ **Policy Envelopes** - Governance rules
- Autonomy tiers (0-5)
- Allowed tools list
- Cost limits (daily/monthly)
- Data scope restrictions

✅ **Policy Evaluation** - Runtime enforcement
- Evaluate tool calls against policy
- Return: ALLOW | DENY | NEEDS_APPROVAL
- Risk classification (low/medium/high/critical)

✅ **Policy Editor UI**
- CRUD for policy envelopes
- Autonomy tier selector
- Tool/data scope editor
- Cost limit inputs

### Approval Workflows
✅ **Approval Records** - Human-in-the-loop
- Request approval for high-risk actions
- Operator approve/deny decisions
- Timeout handling

✅ **Approval Center UI**
- List pending approvals
- One-click approve/deny
- Context display (tool, params, risk)

### Enhanced UI
✅ **Create Forms**
- Create Template modal
- Create Version modal (with genome input)
- Parent version selector for lineage

✅ **State Machine Validation**
- Enforce transition rules with guards
- Clear error messages on invalid transitions
- Visual state flow diagram

✅ **Search & Filters**
- Search by name, version label, ID
- Filter by status, environment, tags
- Sort by created date, updated date

---

## Explicitly Out of Scope (P1.1 & P1.2)

### Deferred to P2.0+
❌ **Evaluation Orchestration** - Automated testing
- Temporal workflows for eval suites
- Sandboxed test execution
- Promotion gates based on results

❌ **Federation Implementation** - Multi-provider runtime
- Cross-provider instance management
- Health check polling
- Federated policy enforcement

❌ **Cost Tracking** - Economic ledger
- Token usage tracking
- Cost attribution by project/role
- Budget alerts and forecasting

❌ **Telemetry Ingestion** - Runtime observability
- OpenTelemetry events
- Trace collection
- Performance dashboards

❌ **Advanced Analytics** - BI and reporting
- OData/GraphQL APIs
- Warehouse exports
- Custom dashboards

### Never in Scope
❌ Agent runtime execution (ARM is registry only)
❌ Model training or fine-tuning
❌ Prompt engineering IDE
❌ Agent-to-agent communication
❌ Task orchestration (use Temporal/other)

---

## User Stories

### US-1: Template Management
**As an** ops engineer  
**I want to** create agent templates  
**So that** I can define agent families with consistent metadata

**Acceptance Criteria:**
- Can create template with name, description, owners, tags
- Template appears in Directory → Templates tab
- Change record written for creation

### US-2: Version Creation with Lineage
**As an** ops engineer  
**I want to** create new versions with parent linkage  
**So that** I can track version evolution over time

**Acceptance Criteria:**
- Can create version with genome (model, prompt hash, tools)
- Genome hash computed automatically (SHA-256)
- Can specify parent version ID
- Lineage chain queryable
- Version appears in Directory → Versions tab

### US-3: Integrity Verification
**As a** security engineer  
**I want to** verify version genome integrity  
**So that** I can detect tampering

**Acceptance Criteria:**
- Click "View Details" on version → drawer opens
- Genome hash recomputed and compared
- Status shows VERIFIED or TAMPERED
- Change record written for verification result
- List queries skip verification (performance)

### US-4: Instance Deployment
**As an** ops engineer  
**I want to** deploy instances to environments  
**So that** agents can run in dev/staging/prod

**Acceptance Criteria:**
- Can create instance bound to version + environment + provider
- Instance starts in PROVISIONING state
- Can transition to ACTIVE
- Heartbeat tracked
- Instance appears in Directory → Instances tab

### US-5: State Transitions (P1.2)
**As an** ops engineer  
**I want to** transition version lifecycle states  
**So that** I can promote versions through gates

**Acceptance Criteria:**
- Can transition DRAFT → TESTING
- Cannot transition TESTING → CANDIDATE without evalStatus=PASS
- Can transition CANDIDATE → APPROVED (operator decision)
- Invalid transitions rejected with clear error
- Change record written for each transition

### US-6: Policy Enforcement (P1.2)
**As a** compliance officer  
**I want to** define policy envelopes  
**So that** I can control agent autonomy

**Acceptance Criteria:**
- Can create policy with autonomy tier, allowed tools, cost limits
- Can attach policy to instance
- Policy evaluation returns ALLOW/DENY/NEEDS_APPROVAL
- High-risk actions trigger approval workflow

---

## Success Criteria

### P1.1 (COMPLETE ✅)
- [x] All TypeScript compiles without errors
- [x] Dev servers run without crashes
- [x] Directory view loads and displays data
- [x] Version genome hash verified on detail read
- [x] Immutability enforced (no genome mutation exists)
- [x] State transitions functional
- [x] ChangeRecords written for all mutations
- [x] Seed script creates complete dataset

### P1.2 (TARGET)
- [ ] Policy CRUD functional
- [ ] Policy evaluation returns correct decisions
- [ ] Approval workflows work end-to-end
- [ ] State machine validation enforced
- [ ] Create forms for templates/versions
- [ ] Search/filter works in directory

### Performance Targets
- Directory list: <500ms for 1000 items
- Version detail with hash: <200ms
- Policy evaluation: <100ms
- Approval decision: <150ms

---

## Non-Goals

### What We're NOT Building
- **Agent Runtime** - ARM is a registry, not an execution engine
- **Prompt IDE** - Use external tools for prompt engineering
- **Model Training** - Use external platforms (OpenAI, Anthropic, etc.)
- **Task Orchestration** - Use Temporal or other workflow engines
- **Real-time Chat** - ARM is for management, not agent interaction

### What We're NOT Optimizing For
- **Sub-10ms latency** - Registry operations, not real-time inference
- **Millions of QPS** - Enterprise scale (1000s of agents), not consumer scale
- **Mobile-first** - Desktop web app for ops teams
- **Offline-first** - Requires network for multi-tenant sync

---

## Technical Constraints

### Must Have
- TypeScript end-to-end (no JavaScript)
- Convex for backend (real-time, multi-tenant)
- React 18+ for frontend
- Tailwind CSS for styling
- SHA-256 for genome hashing
- Immutable version genomes (write-once)

### Must Not Have
- No Python backend (FastAPI quarantined)
- No REST API (Convex functions only)
- No SQL database (Convex handles storage)
- No third-party auth providers (Convex built-in auth)

---

## Open Questions

### P1.2 Planning
1. **Autonomy tier standardization** - Use 0-5 scale or custom?
2. **Policy evaluation performance** - Cache policies or compute on-demand?
3. **Approval timeout handling** - Auto-deny after X hours?
4. **State machine visualization** - Show flow diagram in UI?

### P2.0+ Planning
1. **Evaluation runner** - Temporal vs. Convex crons?
2. **Federation protocol** - gRPC vs. REST for cross-provider?
3. **Cost attribution granularity** - Per-run vs. per-day?
4. **Telemetry storage** - Convex vs. separate time-series DB?

---

## Appendix: Terminology

- **Template** - Blueprint for agent family (e.g., "Customer Support Agent")
- **Version** - Immutable build with genome (model + prompt + tools)
- **Instance** - Runtime deployment of a version
- **Genome** - Version's DNA (modelConfig + promptBundleHash + toolManifest + provenance)
- **Genome Hash** - SHA-256 of canonicalized genome (immutable)
- **Lineage** - Parent-child version relationships
- **Provider** - Runtime environment (local, AWS, Azure, etc.)
- **Policy Envelope** - Governance rules (autonomy, tools, costs)
- **Change Record** - Audit event (append-only log)
- **Lifecycle State** - Version progression (DRAFT → APPROVED)
- **Instance State** - Runtime status (PROVISIONING → ACTIVE)

---

**Document Owner:** Engineering Team  
**Reviewers:** Product, Security, Compliance  
**Approval:** Required before P1.2 implementation
