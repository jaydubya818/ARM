-- Agent Resources Platform - Initial Schema
-- Multi-tenant with Row-Level Security

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS
-- ============================================================================

CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENT REGISTRY
-- ============================================================================

CREATE TABLE agent_templates (
  template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  name TEXT NOT NULL,
  description TEXT,
  owner_org_id UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_templates_tenant ON agent_templates(tenant_id);
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_templates_isolation ON agent_templates
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================

CREATE TYPE version_status AS ENUM ('draft', 'candidate', 'approved', 'deprecated', 'retired');

CREATE TABLE agent_versions (
  version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES agent_templates(template_id),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  version_label TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  model_bundle JSONB NOT NULL,
  prompt_bundle JSONB NOT NULL,
  tool_manifest JSONB NOT NULL,
  data_scopes_declared TEXT[] DEFAULT '{}',
  build_provenance JSONB,
  release_status version_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, version_label)
);

CREATE INDEX idx_agent_versions_tenant ON agent_versions(tenant_id);
CREATE INDEX idx_agent_versions_template ON agent_versions(template_id);
CREATE INDEX idx_agent_versions_status ON agent_versions(release_status);
ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_versions_isolation ON agent_versions
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================

CREATE TYPE instance_status AS ENUM ('provisioning', 'active', 'paused', 'quarantined', 'retired');

CREATE TABLE agent_instances (
  instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES agent_versions(version_id),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  environment TEXT NOT NULL,
  runtime_target TEXT,
  identity_principal_id TEXT,
  secret_ref TEXT,
  policy_envelope_id UUID,
  status instance_status DEFAULT 'provisioning',
  last_heartbeat_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_instances_tenant ON agent_instances(tenant_id);
CREATE INDEX idx_agent_instances_version ON agent_instances(version_id);
CREATE INDEX idx_agent_instances_status ON agent_instances(status);
ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_instances_isolation ON agent_instances
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================
-- POLICIES
-- ============================================================================

CREATE TABLE policy_envelopes (
  policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  name TEXT NOT NULL,
  autonomy_tier INTEGER CHECK (autonomy_tier BETWEEN 0 AND 5),
  allowed_tools JSONB NOT NULL,
  allowed_data_scopes TEXT[] DEFAULT '{}',
  rate_limits JSONB,
  cost_limits JSONB,
  guardrails JSONB,
  logging_policy JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policy_envelopes_tenant ON policy_envelopes(tenant_id);
ALTER TABLE policy_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_envelopes_isolation ON policy_envelopes
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE agent_instances
  ADD CONSTRAINT fk_policy_envelope
  FOREIGN KEY (policy_envelope_id) REFERENCES policy_envelopes(policy_id);

-- ============================================================================
-- EVALUATIONS
-- ============================================================================

CREATE TYPE eval_category AS ENUM ('regression', 'safety', 'security', 'domain', 'adversarial');

CREATE TABLE evaluation_suites (
  suite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  name TEXT NOT NULL,
  category eval_category NOT NULL,
  tests JSONB NOT NULL,
  thresholds JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluation_suites_tenant ON evaluation_suites(tenant_id);
ALTER TABLE evaluation_suites ENABLE ROW LEVEL SECURITY;

CREATE POLICY evaluation_suites_isolation ON evaluation_suites
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================

CREATE TYPE eval_run_status AS ENUM ('running', 'passed', 'failed', 'aborted');
CREATE TYPE eval_trigger AS ENUM ('manual', 'schedule', 'promotion_gate', 'incident_response');

CREATE TABLE evaluation_runs (
  run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_id UUID NOT NULL REFERENCES evaluation_suites(suite_id),
  version_id UUID NOT NULL REFERENCES agent_versions(version_id),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  trigger eval_trigger NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status eval_run_status DEFAULT 'running',
  summary_scores JSONB,
  evidence_artifact_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluation_runs_tenant ON evaluation_runs(tenant_id);
CREATE INDEX idx_evaluation_runs_version ON evaluation_runs(version_id);
CREATE INDEX idx_evaluation_runs_suite ON evaluation_runs(suite_id);
ALTER TABLE evaluation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY evaluation_runs_isolation ON evaluation_runs
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================
-- CERTIFICATIONS
-- ============================================================================

CREATE TYPE cert_scope AS ENUM ('tools', 'data', 'autonomy');

CREATE TABLE certifications (
  cert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  name TEXT NOT NULL,
  description TEXT,
  scope cert_scope NOT NULL,
  requirements JSONB NOT NULL,
  expiry_days INTEGER,
  recert_triggers TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certifications_tenant ON certifications(tenant_id);
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY certifications_isolation ON certifications
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================

CREATE TABLE certification_grants (
  grant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cert_id UUID NOT NULL REFERENCES certifications(cert_id),
  version_id UUID REFERENCES agent_versions(version_id),
  instance_id UUID REFERENCES agent_instances(instance_id),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  granted_by UUID NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  evidence_artifact_ids UUID[],
  CHECK ((version_id IS NOT NULL) OR (instance_id IS NOT NULL))
);

CREATE INDEX idx_certification_grants_tenant ON certification_grants(tenant_id);
CREATE INDEX idx_certification_grants_version ON certification_grants(version_id);
CREATE INDEX idx_certification_grants_instance ON certification_grants(instance_id);
ALTER TABLE certification_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY certification_grants_isolation ON certification_grants
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================
-- EVIDENCE ARTIFACTS
-- ============================================================================

CREATE TYPE artifact_type AS ENUM ('EvalReport', 'TracePack', 'PolicySnapshot', 'AuditPack', 'TrainingReport', 'IncidentReport');

CREATE TABLE evidence_artifacts (
  artifact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  type artifact_type NOT NULL,
  storage_ref TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  signature TEXT,
  linked_entity_type TEXT,
  linked_entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_artifacts_tenant ON evidence_artifacts(tenant_id);
CREATE INDEX idx_evidence_artifacts_linked ON evidence_artifacts(linked_entity_type, linked_entity_id);
ALTER TABLE evidence_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_artifacts_isolation ON evidence_artifacts
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE evaluation_runs
  ADD CONSTRAINT fk_evidence_artifact
  FOREIGN KEY (evidence_artifact_id) REFERENCES evidence_artifacts(artifact_id);

-- ============================================================================
-- INCIDENTS
-- ============================================================================

CREATE TYPE incident_severity AS ENUM ('S1', 'S2', 'S3', 'S4');
CREATE TYPE incident_type AS ENUM ('PolicyViolation', 'DataLeakRisk', 'ToolMisuse', 'Drift', 'Outage', 'CostOverrun');
CREATE TYPE incident_status AS ENUM ('Open', 'Mitigated', 'Resolved', 'Postmortem');

CREATE TABLE incidents (
  incident_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  severity incident_severity NOT NULL,
  type incident_type NOT NULL,
  instance_id UUID REFERENCES agent_instances(instance_id),
  version_id UUID REFERENCES agent_versions(version_id),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  status incident_status DEFAULT 'Open',
  description TEXT,
  actions_taken JSONB DEFAULT '[]',
  linked_artifacts UUID[],
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX idx_incidents_instance ON incidents(instance_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_isolation ON incidents
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================
-- APPROVALS
-- ============================================================================

CREATE TYPE approval_scope AS ENUM ('promotion', 'cert_grant', 'policy_change', 'high_risk_action', 'exception');
CREATE TYPE approval_status AS ENUM ('Requested', 'Approved', 'Denied', 'Expired');

CREATE TABLE approval_records (
  approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  scope approval_scope NOT NULL,
  requested_by UUID NOT NULL,
  approved_by UUID,
  status approval_status DEFAULT 'Requested',
  reason TEXT,
  context JSONB,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_approval_records_tenant ON approval_records(tenant_id);
CREATE INDEX idx_approval_records_status ON approval_records(status);
ALTER TABLE approval_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY approval_records_isolation ON approval_records
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================
-- TELEMETRY & COST
-- ============================================================================

CREATE TABLE telemetry_events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  instance_id UUID NOT NULL REFERENCES agent_instances(instance_id),
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL
);

CREATE INDEX idx_telemetry_events_tenant_time ON telemetry_events(tenant_id, timestamp DESC);
CREATE INDEX idx_telemetry_events_instance ON telemetry_events(instance_id);
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY telemetry_events_isolation ON telemetry_events
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================

CREATE TYPE cost_metric_type AS ENUM ('tokens_in', 'tokens_out', 'compute_seconds', 'tool_cost');

CREATE TABLE cost_ledger (
  entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  instance_id UUID NOT NULL REFERENCES agent_instances(instance_id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metric_type cost_metric_type NOT NULL,
  amount NUMERIC(12, 4) NOT NULL,
  currency TEXT DEFAULT 'USD',
  attribution JSONB
);

CREATE INDEX idx_cost_ledger_tenant_time ON cost_ledger(tenant_id, timestamp DESC);
CREATE INDEX idx_cost_ledger_instance ON cost_ledger(instance_id);
ALTER TABLE cost_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_ledger_isolation ON cost_ledger
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================================
-- EVENT STREAM (append-only audit log)
-- ============================================================================

CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL,
  signature TEXT
);

CREATE INDEX idx_events_tenant_time ON events(tenant_id, timestamp DESC);
CREATE INDEX idx_events_type ON events(event_type);
