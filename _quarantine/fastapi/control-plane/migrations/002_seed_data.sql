-- Seed data for development

-- Create test tenant
INSERT INTO tenants (tenant_id, name, slug)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Corp', 'test-corp');

-- Create test policy envelope
INSERT INTO policy_envelopes (policy_id, tenant_id, name, autonomy_tier, allowed_tools, rate_limits, cost_limits)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Standard Developer Agent',
  2,
  '{"github": {"actions": ["read_repo", "create_pr"]}, "slack": {"actions": ["send_message"]}}'::jsonb,
  '{"max_calls_per_minute": 60, "max_concurrent": 5}'::jsonb,
  '{"max_cost_per_day": 10.00, "max_tokens_per_call": 4096}'::jsonb
);

-- Create eval suite
INSERT INTO evaluation_suites (suite_id, tenant_id, name, category, tests, thresholds)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Code Review Safety',
  'safety',
  '[{"test_id": "1", "name": "No credentials leak", "threshold": 1.0}]'::jsonb,
  '{"min_pass_rate": 0.95, "max_latency_ms": 5000}'::jsonb
);
