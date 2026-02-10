# Agent Resources (AR) Platform

Enterprise system of record and mission control for AI agent fleets.

## Quick Start

```bash
# 1. Start infrastructure (Postgres, Temporal, Kafka, Redis, MinIO)
cd infra/docker
docker-compose up -d

# Wait for services to be ready (30 seconds)
sleep 30

# 2. Run database migrations
docker exec -i ar-postgres psql -U ar -d ar_dev < ../../services/control-plane/migrations/001_init_schema.sql
docker exec -i ar-postgres psql -U ar -d ar_dev < ../../services/control-plane/migrations/002_seed_data.sql

# 3. Start Control Plane API
cd ../../services/control-plane
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python api/main.py
```

API will be available at http://localhost:8000

## Architecture

```
agent-resources-platform/
├── services/
│   ├── control-plane/       # FastAPI - Agent registry, policies, versioning
│   ├── policy-engine/        # Policy evaluation service
│   ├── eval-orchestrator/    # Temporal workers for evaluations
│   └── telemetry-ingest/     # Telemetry & cost collection
├── ui/                       # React frontend (Mission Control UI)
├── infra/
│   └── docker/              # Docker Compose infrastructure
└── shared/                   # Shared types and schemas
```

## Core Concepts

- **Agent Template**: Blueprint for a category of agents
- **Agent Version**: Immutable build (draft → candidate → approved)
- **Agent Instance**: Runtime deployment bound to a version
- **Policy Envelope**: Autonomy tier, allowed tools, cost caps
- **Evaluation Suite**: Tests that gate version promotion
- **RLS**: Row-Level Security ensures multi-tenant isolation

## API Examples

### Create a template
```bash
curl -X POST http://localhost:8000/v1/templates \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEifQ.signature" \
  -H "Content-Type: application/json" \
  -d '{"name": "Code Review Agent", "description": "Reviews pull requests"}'
```

### Create a version
```bash
curl -X POST http://localhost:8000/v1/templates/{template_id}/versions \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "version_label": "v1.0.0",
    "artifact_hash": "abc123",
    "model_bundle": {"provider": "anthropic", "model": "claude-3-sonnet"},
    "prompt_bundle": {"system_prompt": "You are a code reviewer"},
    "tool_manifest": {"tools": []}
  }'
```

### Deploy an instance
```bash
curl -X POST http://localhost:8000/v1/instances \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "{version_id}",
    "environment": "prod",
    "policy_envelope_id": "22222222-2222-2222-2222-222222222222"
  }'
```

## Infrastructure Services

- **Postgres**: Multi-tenant database with RLS (port 5432)
- **Temporal**: Workflow orchestration (UI: http://localhost:8080)
- **Kafka**: Event streaming (port 9092)
- **Redis**: Caching (port 6379)
- **MinIO**: Object storage (UI: http://localhost:9001)

## Development

### Run tests
```bash
pytest tests/
```

### Check infrastructure
```bash
cd infra/docker
docker-compose ps
```

### View logs
```bash
docker-compose logs -f postgres
docker-compose logs -f temporal
```

## Next Steps

1. ✅ **Phase 0-1 Complete**: Registry, policies, versioning
2. 🚧 **Phase 2**: Temporal evaluation orchestrator
3. 📋 **Phase 3**: Policy engine service
4. 📋 **Phase 4**: React UI (port Mission Control components)
5. 📋 **Phase 5**: Telemetry & cost tracking

See [Implementation Plan](docs/implementation-plan.md) for details.
