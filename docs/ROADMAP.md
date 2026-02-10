# Agent Resources Platform - Implementation Roadmap

## Overview

This roadmap outlines the 12-week path to deliver the AR kernel (MVP) with phased expansion to full HCM capabilities.

**Current Status:** ✅ **Phase 0-1 Complete** (Multi-tenant registry, policies, API)

---

## Phase Breakdown

### ✅ Phase 0: Infrastructure Setup (Week 1)

**Status:** COMPLETE

**Deliverables:**
- [x] Docker Compose infrastructure (Postgres, Temporal, Redis, MinIO)
- [x] PostgreSQL schema with Row-Level Security (RLS)
- [x] 15 core tables with multi-tenant isolation
- [x] Database migrations + seed data

**Infrastructure Services:**
- Postgres 15 (main database)
- Temporal (workflow orchestration)
- Temporal UI (http://localhost:8080)
- Redis (caching)
- MinIO (object storage)

**Technical Foundation:**
- Multi-tenant RLS via `app.current_tenant` session variable
- Event-sourced audit log (events table)
- Artifact storage for evidence

---

### ✅ Phase 1: Control Plane API (Weeks 2-3)

**Status:** COMPLETE

**Deliverables:**
- [x] FastAPI service with JWT authentication
- [x] Tenant context middleware (sets RLS variable)
- [x] Core API endpoints (15+ routes)
- [x] Health checks & error handling

**Endpoints Implemented:**

**Templates & Versions:**
- `POST /v1/templates` - Create agent template
- `GET /v1/templates` - List templates
- `POST /v1/templates/{id}/versions` - Create version
- `GET /v1/versions/{id}` - Get version details
- `POST /v1/versions/{id}/promote` - Promote version (with gates)

**Instances:**
- `POST /v1/instances` - Provision instance
- `GET /v1/instances` - List instances
- `PATCH /v1/instances/{id}` - Update status

**Policies:**
- `POST /v1/policies` - Create policy envelope
- `GET /v1/policies` - List policies
- `GET /v1/policies/{id}` - Get policy details

**Testing:**
- [x] API test suite (`test-api.sh`)
- [x] End-to-end lifecycle validation

---

### 🚧 Phase 2: Evaluation Orchestrator (Weeks 4-6)

**Status:** READY TO START

**Goals:**
- Temporal workflows for evaluation orchestration
- Sandboxed test execution with retry logic
- Promotion gates based on eval results
- Evidence artifact generation & storage

**Implementation Plan:**

#### Week 4: Temporal Workers
```python
# services/eval-orchestrator/workflows.py

@activity.defn
async def run_single_test(test_config, version_id, tenant_id):
    """Execute one test case against agent version"""
    # 1. Fetch agent version (model, prompt, tools)
    # 2. Initialize agent
    # 3. Run test with timeout
    # 4. Score output vs. expected
    # 5. Return {passed, score, latency}

@workflow.defn
class EvaluationWorkflow:
    """Orchestrate suite of tests in parallel"""
    @workflow.run
    async def run(suite_id, version_id, tenant_id):
        # 1. Fetch suite definition
        # 2. Execute tests in parallel
        # 3. Aggregate results
        # 4. Store evidence artifact
        # 5. Update version status (draft → candidate)
```

**Key Features:**
- Parallel test execution with Temporal activities
- Automatic retry on transient failures
- Timeout enforcement per test
- Evidence storage in MinIO with signing

#### Week 5: Promotion Gates
```python
@app.post("/v1/versions/{version_id}/promote")
async def promote_version(version_id, tenant_id, db):
    # 1. Check current status == 'candidate'
    # 2. Verify evaluation passed
    # 3. Check certifications present
    # 4. Request approvals if needed
    # 5. Promote to 'approved'
    # 6. Emit AgentVersionPromoted event
```

**Gate Checks:**
- ✅ Evaluation suite passed (≥90% pass rate)
- ✅ Required certifications granted
- ✅ Approval records exist (for high-risk roles)
- ✅ No open S1/S2 incidents

#### Week 6: Integration & Testing

**Deliverables:**
- [ ] Evaluation orchestrator Docker service
- [ ] Temporal workflows deployed
- [ ] API endpoints integrated
- [ ] Evidence artifacts in MinIO
- [ ] E2E test: create version → eval → promote

**API Additions:**
```
POST /v1/evaluation-runs          # Trigger eval manually
GET  /v1/evaluation-runs/{id}     # Get results
POST /v1/evaluation-suites        # Define suite
GET  /v1/evaluation-suites        # List suites
```

---

### 📋 Phase 3: Policy Engine (Weeks 7-8)

**Status:** PLANNED

**Goals:**
- Standalone policy evaluation service
- Runtime enforcement SDK for agents
- ALLOW/NEEDS_APPROVAL/DENY decision logic
- Approval request workflows

**Architecture:**

```
┌─────────────┐
│ Agent       │
│ Runtime     │
└──────┬──────┘
       │ 1. tool call
       ▼
┌─────────────┐
│ Policy      │ 2. evaluate(policy_id, context)
│ Enforcer    ├────────────────┐
│ SDK         │                │
└──────┬──────┘                ▼
       │              ┌──────────────────┐
       │              │ Policy Engine    │
       │              │ Service          │
       │              │ (port 8001)      │
       │              └────────┬─────────┘
       │                       │
       ▼                       ▼
   3a. ALLOW          3b. NEEDS_APPROVAL
   execute            request & wait
```

**Implementation:**

#### Week 7: Policy Engine Service
```python
# services/policy-engine/main.py

@app.post("/v1/policy/evaluate")
async def evaluate_policy(req: PolicyEvaluationRequest):
    """Evaluate action against policy envelope"""
    # Input: {policy_id, context: {tool_name, params, cost_usage}}
    #
    # Logic:
    # 1. Fetch policy envelope
    # 2. Check tool allowed
    # 3. Check tool constraints
    # 4. Check cost limits
    # 5. Check high-risk patterns
    #
    # Output: {
    #   decision: ALLOW | NEEDS_APPROVAL | DENY,
    #   risk_level: low | medium | high | critical,
    #   required_approvals: [roles],
    #   explanation: str
    # }
```

**Policy Rules:**
- Tool not in `allowed_tools` → DENY
- Tool action not in constraints → DENY
- Cost exceeds daily cap → DENY
- High-risk action + autonomy_tier < 3 → NEEDS_APPROVAL
- Otherwise → ALLOW

#### Week 8: Enforcement SDK
```python
# shared/ar-sdk/policy_enforcer.py

class PolicyEnforcer:
    """Wrap agent with policy checks"""

    async def call_tool(self, tool_name, params):
        # 1. Check policy via API
        decision = await self._check_policy(tool_name, params)

        # 2. Handle decision
        if decision == "DENY":
            raise PermissionError()
        elif decision == "NEEDS_APPROVAL":
            approval_id = await self._request_approval()
            await self._wait_for_approval(approval_id)

        # 3. Execute tool
        result = await self._execute(tool_name, params)

        # 4. Log telemetry
        await self._log_telemetry(tool_name, result)

        return result
```

**Usage Example:**
```python
# Agent with policy enforcement
agent = PolicyEnforcedAgent(
    base_agent=MyAgent(),
    policy_api="http://policy-engine:8001",
    instance_id="uuid",
    policy_envelope_id="uuid"
)

# Tool calls automatically checked
result = await agent.call_tool("github", {"action": "create_pr"})
```

---

### 📋 Phase 4: Mission Control UI (Weeks 9-10)

**Status:** PLANNED

**Goals:**
- Port key components from MissionControl repo
- Connect to AR control plane API
- Real-time dashboards with state visualization

**Components to Port:**

#### Week 9: Core UI Components
1. **State Machine Visualizer**
   - Map to version lifecycle (draft → candidate → approved)
   - Map to instance lifecycle (provisioning → active → quarantined)

2. **Policy Editor**
   - CRUD for policy envelopes
   - Autonomy tier selector
   - Tool/data scope editor
   - Cost/rate limit inputs

3. **Approval Center**
   - List pending approvals
   - One-click approve/deny
   - Context display (tool, params, risk)

#### Week 10: Dashboards & Analytics
1. **Agent Directory**
   - List templates, versions, instances
   - Filters (environment, status, role)
   - Bulk actions (pause, quarantine)

2. **Evaluation Console**
   - Suite management
   - Recent runs with pass/fail
   - Promotion gate status

3. **Incident Center**
   - Triage by severity/type
   - Mitigation actions
   - Post-mortem artifacts

**Tech Stack:**
- React + TypeScript
- TanStack Query for API calls
- Tailwind CSS for styling
- React Router for navigation

**API Client:**
```typescript
// ui/src/lib/api.ts
export const api = {
  createTemplate: (data) => POST('/v1/templates', data),
  promoteVersion: (id) => POST(`/v1/versions/${id}/promote`),
  listInstances: () => GET('/v1/instances'),
  updateInstance: (id, status) => PATCH(`/v1/instances/${id}`, {status})
}
```

---

### 📋 Phase 5: Telemetry & Cost (Weeks 11-12)

**Status:** PLANNED

**Goals:**
- OpenTelemetry ingestion pipeline
- Cost ledger tracking
- Real-time dashboards

**Implementation:**

#### Week 11: Telemetry Ingestion
```python
# services/telemetry-ingest/main.py

@app.post("/v1/telemetry/events")
async def ingest_events(events: List[TelemetryEvent]):
    """Batch ingest telemetry events"""
    # 1. Validate tenant_id + instance_id
    # 2. Buffer events (batch insert)
    # 3. Flush to DB every 5 seconds or 1000 events
    # 4. Emit to analytics pipeline (optional)
```

**Event Schema:**
```json
{
  "event_id": "uuid",
  "tenant_id": "uuid",
  "instance_id": "uuid",
  "event_type": "RunStart | ToolCall | Decision | Outcome | RunEnd | Error",
  "timestamp": "ISO8601",
  "payload": {
    "tool_name": "github",
    "action": "create_pr",
    "latency_ms": 1234,
    "cost_tokens": 500
  }
}
```

**Cost Ledger:**
```python
@app.post("/v1/cost/entries")
async def ingest_cost(entries: List[CostLedgerEntry]):
    """Batch ingest cost data"""
    # Schema: {
    #   instance_id, timestamp,
    #   metric_type: tokens_in | tokens_out | compute_seconds | tool_cost,
    #   amount, currency,
    #   attribution: {project_id, cost_center}
    # }
```

#### Week 12: Analytics & Dashboards

**Cost Dashboard:**
- Total spend by tenant/role/instance
- Cost per successful task
- Budget vs. actual
- Cost anomaly alerts

**Performance Dashboard:**
- Success rate trends
- Latency percentiles
- Incident rate
- SLO compliance

**Capacity Dashboard:**
- Active instances by environment
- Utilization by role
- Idle/overburdened agents

---

## Post-MVP Roadmap (Phase 6+)

### Phase 6: Advanced HCM Modules (Weeks 13-20)

**Learning & Certifications:**
- Training tracks for capability acquisition
- Automated recertification triggers
- Learning content integration

**Marketplace & Mobility:**
- Internal agent marketplace
- Assignment workflows
- Rotation schedules
- Utilization tracking

**Succession Planning:**
- Automated backup selection
- Knowledge transfer workflows
- Graceful retirement

### Phase 7: ZHC Features (Weeks 21-24)

**Agent-Managed-By-Agent:**
- Supervisor agent roles
- Delegated approval workflows
- Automated remediation

**Federation:**
- Multi-provider runtime support
- Cross-tenant analytics (opt-in)
- Global kill switches

**Advanced Compliance:**
- AI Act readiness checklists
- Auto-generated Agent Cards
- Lineage sheets for regulators

### Phase 8: Enterprise Integration (Weeks 25-28)

**SSO & Identity:**
- OIDC/SAML integration
- SCIM for HR sync
- Just-in-time provisioning

**BI & Reporting:**
- OData/GraphQL APIs
- Warehouse-friendly exports
- Incremental sync

**Vendor Ecosystem:**
- Marketplace for vendor agents
- Standardized eval suites
- Trust scoring

---

## Technology Stack Summary

### Backend
- **API**: FastAPI (Python) or Hono (TypeScript)
- **Database**: PostgreSQL 15 with RLS
- **Workflow**: Temporal
- **Caching**: Redis
- **Storage**: MinIO (S3-compatible)
- **Event Bus**: *(Kafka disabled for MVP, will add in Phase 6)*

### Frontend
- **Framework**: React + TypeScript
- **State**: TanStack Query
- **Styling**: Tailwind CSS
- **Components**: Port from MissionControl

### Infrastructure
- **Containers**: Docker Compose (dev), Kubernetes (prod)
- **Observability**: OpenTelemetry
- **CI/CD**: GitHub Actions

---

## Success Criteria by Phase

### Phase 2 (Evaluation)
- [ ] Create version → auto-trigger eval
- [ ] Eval runs in Temporal with retries
- [ ] Promote blocks if eval fails
- [ ] Evidence artifacts stored in MinIO

### Phase 3 (Policy)
- [ ] Policy engine returns ALLOW/DENY/NEEDS_APPROVAL
- [ ] SDK enforces policies at runtime
- [ ] High-risk actions trigger approval workflows
- [ ] Policy violations logged as incidents

### Phase 4 (UI)
- [ ] Browse templates/versions/instances
- [ ] Approve/deny pending requests
- [ ] Edit policy envelopes
- [ ] View evaluation results

### Phase 5 (Telemetry)
- [ ] Telemetry ingestion at 10K+ events/sec
- [ ] Cost ledger tracking all expenses
- [ ] Real-time cost dashboard
- [ ] SLO compliance tracking

---

## Risk Mitigation

### Technical Risks

**Risk:** Temporal learning curve slows eval orchestrator
- **Mitigation:** Start with simple workflow, iterate
- **Fallback:** Use Celery if Temporal proves too complex

**Risk:** Policy enforcement gaps in federated runtimes
- **Mitigation:** Focus on SDK-based agents first
- **Fallback:** Require sidecar proxies for external runtimes

**Risk:** Multi-tenant RLS performance degradation
- **Mitigation:** Index on tenant_id, partition large tables
- **Fallback:** Silo high-value tenants to dedicated DBs

### Organizational Risks

**Risk:** Scope creep from "nice to have" features
- **Mitigation:** Lock Phase 1-5 scope, defer enhancements to Phase 6+
- **Fallback:** Cut marketplace/succession from MVP

**Risk:** Regulatory requirements change mid-development
- **Mitigation:** Build flexible compliance export system
- **Fallback:** Compliance features are Phase 7, can adjust timeline

---

## Next Steps

**Current Focus:** Phase 2 - Evaluation Orchestrator (Weeks 4-6)

**Immediate Actions:**
1. Create Temporal workflow for evaluation suite
2. Implement sandboxed test runner activities
3. Add promotion gate checks to API
4. Store evidence artifacts in MinIO
5. Build E2E test: version creation → eval → promotion

**Ready to start Phase 2?** Let me know and I'll build the Temporal evaluation orchestrator!
