# Agent Resources (AR) - Product Requirements Document

## Executive Summary

**Vision:** Build the operating system that makes fully autonomous companies possible. AR will be the enterprise system of record and mission control for AI agents, managing identity, capability, autonomy, evaluation, costs and compliance across agent fleets.

**Market Opportunity:** As organizations deploy agent fleets at scale, they need HCM-like lifecycle management for non-human workers. AR addresses this gap with agent-native primitives: version lineage, capability graphs, policy envelopes, continuous evaluation, and economic ledgers.

**Target Segments:**
- **Enterprises** - Fleet management, governance, compliance
- **Solo Entrepreneurs** - Simplified agent deployment and cost control
- **Zero-Human Companies (ZHCs)** - Fully automated operations with human oversight

---

## 1. Product Overview

### 1.1 One-Liner

AR is the enterprise system of record and mission control for AI agents—reimagining HCM for an agent-first workforce. It provides governance, lifecycle workflows, continuous evaluation, redundancy planning, cost controls and analytics for agents.

### 1.2 Why Now

- **Agent proliferation** - Organizations deploying specialized agent fleets
- **Supervisory roles** - Agents managing other agents; humans as auditors
- **Regulatory pressure** - EU AI Act (2026), NIST AI RMF, ISO/IEC 42001
- **Enterprise expectations** - HCM-level rigor for agent management
- **Cost accountability** - Compute/token costs = agent "compensation"

### 1.3 What AR Replaces

AR extends traditional HCM patterns with agent-native capabilities:

**From HCM:**
- Employee registry → Agent registry (templates, versions, instances)
- Recruiting → Acquisition (eval-based selection)
- Onboarding → Provisioning (identity, tools, policies)
- Performance management → Continuous evaluation
- Succession planning → Redundancy & failover

**Agent-Native Additions:**
- Immutable version lineage
- Non-human identity management
- Policy envelopes (autonomy tiers, tool/data scopes)
- Continuous evaluation harnesses
- Cost ledgers & economic attribution

---

## 2. Core Concepts & Data Model

### 2.1 Agent Hierarchy

```
AgentTemplate (blueprint)
  └─> AgentVersion (immutable build: draft → candidate → approved)
        └─> AgentInstance (runtime deployment: provisioning → active → retired)
```

### 2.2 Key Entities

**Agent Registry:**
- `AgentTemplate` - Blueprint for agent family
- `AgentVersion` - Immutable version with model/prompt/tool bundles
- `AgentInstance` - Runtime binding to environment + policy

**Governance:**
- `PolicyEnvelope` - Autonomy tier, allowed tools, cost caps, guardrails
- `Certification` - Authorization gates for high-risk tools/data
- `ApprovalRecord` - Promotion gates, high-risk action approvals

**Evaluation:**
- `EvaluationSuite` - Tests (regression, safety, security, domain)
- `EvaluationRun` - Execution results, pass/fail gates
- `EvidenceArtifact` - Signed reports for audit trails

**Operations:**
- `Incident` - Policy violations, drift, cost overruns
- `TelemetryEvent` - Run traces, tool calls, decisions
- `CostLedgerEntry` - Token usage, compute costs, tool costs

### 2.3 Lifecycle State Machines

**Version Lifecycle:**
```
Draft → Candidate → Approved → Deprecated → Retired
```
- `Draft → Candidate`: Requires passing evaluation suite
- `Candidate → Approved`: Requires certification + approval
- `Approved → Deprecated`: Manual or automatic (new version promoted)

**Instance Lifecycle:**
```
Provisioning → Active → (Paused | Quarantined) → Retired
```
- `Quarantined`: S1/S2 incidents, policy violations, drift
- `Paused`: Voluntary suspension (maintenance, cost control)

---

## 3. Functional Requirements

### 3.1 AR Directory (Core Registry)

**Must Have:**
- ✅ Agent templates, versions, instances with metadata
- ✅ Multi-tenant isolation via Row-Level Security (RLS)
- ✅ Version lineage tracking (parent versions, build provenance)
- ✅ Role mapping (agents → roles with capability requirements)

**Nice to Have:**
- Org chart visualization (supervisor → subordinate relationships)
- Capability graph (skills, competencies, training evidence)

### 3.2 Acquisition (ATS Equivalent)

**Must Have:**
- ✅ Role requests defining capability/autonomy/cost requirements
- ✅ Candidate sourcing (internal templates, vendor marketplace)
- ✅ Evaluation-based selection and ranking

**Nice to Have:**
- Automated vendor agent discovery
- Cost/performance benchmarking across candidates

### 3.3 Provisioning & Onboarding

**Must Have:**
- ✅ Non-human identity creation (service accounts, IAM roles)
- ✅ Policy envelope binding (autonomy tier, tool/data scopes)
- ✅ Tool/data connector assignment with least-privilege

**Nice to Have:**
- Automated secret rotation
- Pre-deployment compliance checks

### 3.4 Evaluation & Promotion

**Must Have:**
- ✅ Evaluation suite definitions (tests, thresholds)
- ✅ Automated evaluation runs (manual, schedule, promotion gate)
- ✅ Promotion gates blocking bad versions
- ✅ Evidence artifacts for audit trails

**Nice to Have:**
- Adversarial testing suites
- Drift detection (accuracy, latency, cost)
- A/B testing framework

### 3.5 Performance Management

**Must Have:**
- ✅ Continuous telemetry collection (traces, metrics, costs)
- ✅ Incident logging (severity, type, actions taken)
- ✅ SLO compliance tracking

**Nice to Have:**
- Scorecards with rolling metrics
- Automated drift detection
- Performance benchmarking

### 3.6 Policy & Compliance

**Must Have:**
- ✅ Policy envelopes (autonomy tiers, tool/data scopes, cost limits)
- ✅ Approval workflows (high-risk actions)
- ✅ Kill switches (instance, role, fleet-level)

**Nice to Have:**
- Policy simulation ("what-if" analysis)
- Circuit breakers (global tool/action disable)
- Compliance export packs (SOC 2, AI Act)

### 3.7 Cost Management

**Must Have:**
- ✅ Cost ledger (tokens, compute, tools)
- ✅ Cost caps per instance/role
- ✅ Attribution (project, cost center, role)

**Nice to Have:**
- Budget alerts and forecasting
- ROI dashboards per agent/role
- Cost anomaly detection

### 3.8 Succession & Redundancy

**Must Have:**
- Hot-standby agents with pre-certification
- Failover policies (incident triggers, approvals)

**Nice to Have:**
- Automated backup selection
- Knowledge transfer workflows
- Retirement with graceful decommissioning

---

## 4. Non-Functional Requirements

### 4.1 Security & Compliance

**Multi-Tenancy:**
- ✅ Row-Level Security (RLS) on all tables
- ✅ Per-tenant encryption keys
- ✅ Tenant context validation at API + DB layers

**Access Control:**
- RBAC/ABAC with tenant, environment, role, risk class
- Least-privilege for non-human identities
- MFA for sensitive operations

**Auditability:**
- ✅ Immutable event log (append-only)
- ✅ Tamper-evident evidence artifacts (signed)
- Export to enterprise SIEM

**Governance Alignment:**
- NIST AI RMF (GOVERN-MAP-MEASURE-MANAGE)
- ISO/IEC 42001 (AI management system)
- EU AI Act readiness (transparency, risk tiering)

### 4.2 Reliability & Scale

**Performance Targets:**
- Control plane: ≥99.9% uptime
- Telemetry ingestion: 1M+ events/day per tenant
- Evaluation orchestration: 100+ concurrent runs

**Scalability:**
- Support 1000s of agents per tenant
- Millions of telemetry events per day
- Hundreds of concurrent evaluation runs

**Resilience:**
- Graceful degradation (read-only fallback)
- Evaluation retry with backoff
- Event queueing with backpressure

---

## 5. API Requirements

### 5.1 Core Endpoints

**Templates & Versions:**
- `POST /v1/templates` - Create template
- `POST /v1/templates/{id}/versions` - Create version
- `GET /v1/versions/{id}` - Get version details
- `POST /v1/versions/{id}/promote` - Promote version (with gates)

**Instances:**
- `POST /v1/instances` - Provision instance
- `GET /v1/instances` - List instances
- `PATCH /v1/instances/{id}` - Update status (pause, quarantine, retire)

**Policies:**
- `POST /v1/policies` - Create policy envelope
- `GET /v1/policies/{id}` - Get policy details
- `POST /v1/policies/{id}/simulate` - Dry-run evaluation

**Evaluations:**
- `POST /v1/evaluation-runs` - Trigger evaluation
- `GET /v1/evaluation-runs/{id}` - Get results

**Approvals:**
- `POST /v1/approvals` - Request approval
- `POST /v1/approvals/{id}/decide` - Approve/deny

**Telemetry & Cost:**
- `POST /v1/telemetry/events` - Ingest telemetry batch
- `POST /v1/cost/entries` - Ingest cost entries

### 5.2 Reporting APIs

**OData/GraphQL endpoints:**
- `GET /reporting/v1/agents` - Agent registry + metadata
- `GET /reporting/v1/incidents` - Incident history
- `GET /reporting/v1/evals` - Evaluation results
- `GET /reporting/v1/cost` - Cost aggregations
- `GET /reporting/v1/audit/export-packs` - Compliance exports

---

## 6. UX Requirements (Mission Control UI)

### 6.1 Navigation Structure

```
├── Directory (agent registry, org chart)
├── Acquisition (role requests, candidate pipeline)
├── Provisioning (identity, connectors, runtime)
├── Learning & Certifications
├── Performance (scorecards, incidents, remediation)
├── Marketplace (assignments, utilization)
├── Succession (backups, failover readiness)
├── Analytics (dashboards, cost reports, BI)
├── Policies (autonomy tiers, kill switches)
└── Audit Center (export packs, evidence)
```

### 6.2 Core Screens

**Agent Card:**
- Identity, owner, tenant
- Version lineage graph
- Policy envelope summary
- Certifications + expiry
- Performance scorecard
- Incidents timeline
- Evidence artifacts

**Evaluation Console:**
- Suite management + thresholds
- Recent runs (pass/fail status)
- Promotion gate results
- Blocking reasons

**Policy Center:**
- Policy editor (tiers, tools, scopes)
- Simulator (what-if analysis)
- Change history + approvals

**Incident Center:**
- Incident triage (severity/type/status)
- One-click mitigations (quarantine, rollback)
- Post-mortem artifacts

---

## 7. Success Metrics

### 7.1 Adoption Metrics

- Number of agents registered
- % roles with certified backups
- % agents "audit-ready" (complete evidence)

### 7.2 Reliability Metrics

- Evaluation pass rate by role/version
- Incident rate per 30 days
- Mean Time to Quarantine (MTTQ)
- Mean Time to Restore/Retire (MTTR)

### 7.3 Economic Metrics

- Cost per role outcome
- Cost per successful task
- Budget adherence per role/team
- Cost anomalies detected

---

## 8. Open Questions

1. **Autonomy tier standardization** - Global tiers (0-5) vs. org-defined?
2. **Provider federation** - Minimum integration requirements for external agents?
3. **Evidence signing** - Who signs artifacts? Trust chain validation?
4. **Reporting API tech** - OData, GraphQL, or both?
5. **Cost attribution granularity** - Require tags at assignment time?
6. **Agent welfare metrics** - How to measure/surface ethical treatment?

---

## Appendix: Compliance & Risk

### EU AI Act Alignment

**By 2 Feb 2025:**
- Prohibited practices enforcement
- AI literacy tracking

**By 2 Aug 2026:**
- Risk tiering system
- Transparency obligations
- Regulatory sandbox participation

### NIST AI RMF Alignment

- **GOVERN**: Policies, approval workflows, kill switches
- **MAP**: Risk classification, incident types
- **MEASURE**: Continuous evaluation, drift detection
- **MANAGE**: Remediation plans, quarantine, rollback

### ISO/IEC 42001 Support

- AI management system policies
- Lifecycle controls (provision, evaluate, retire)
- Monitoring & continual improvement
- Documentation & evidence generation
