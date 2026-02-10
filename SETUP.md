# Setup Guide - Agent Resources Platform

## ✅ Phase 0 Complete!

Your AR platform foundation is ready. Here's what was created:

### Project Structure
```
agent-resources-platform/
├── README.md              # Project documentation
├── quick-start.sh         # Automated setup script
├── test-api.sh           # API test script
├── package.json          # Project configuration
├── .gitignore            # Git ignore rules
├── infra/
│   └── docker/
│       └── docker-compose.yml  # Infrastructure services
├── services/
│   ├── control-plane/
│   │   ├── api/
│   │   │   └── main.py         # FastAPI application
│   │   ├── migrations/
│   │   │   ├── 001_init_schema.sql    # Database schema with RLS
│   │   │   └── 002_seed_data.sql      # Test tenant & policies
│   │   └── requirements.txt    # Python dependencies
│   ├── policy-engine/     # (Phase 2)
│   ├── eval-orchestrator/ # (Phase 2)
│   └── telemetry-ingest/  # (Phase 3)
├── ui/                    # React frontend (Phase 4)
└── shared/               # Shared types
```

### What's Included

**✅ Multi-tenant Database Schema**
- 15 tables with Row-Level Security (RLS)
- Agent templates, versions, instances
- Policy envelopes, certifications
- Evaluation suites, incidents
- Telemetry, cost ledger, audit events

**✅ FastAPI Control Plane**
- RESTful API with JWT authentication
- Tenant isolation via RLS
- Endpoints for templates, versions, instances, policies
- Health checks and error handling

**✅ Docker Infrastructure**
- PostgreSQL 15 (multi-tenant DB)
- Temporal (workflow engine)
- Kafka (event streaming)
- Redis (caching)
- MinIO (object storage)

**✅ Development Tools**
- Automated setup script
- API test suite
- Seed data for testing

---

## 🚀 Next Steps

### Step 1: Install Docker

**Docker is required but not currently installed.**

#### On Linux:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
```

#### On macOS:
Download Docker Desktop from: https://www.docker.com/products/docker-desktop/

#### On Windows:
Download Docker Desktop from: https://www.docker.com/products/docker-desktop/

### Step 2: Run Quick Start

Once Docker is installed:

```bash
cd agent-resources-platform
./quick-start.sh
```

This will:
1. ✅ Start all infrastructure services
2. ✅ Run database migrations
3. ✅ Setup Python environment
4. ✅ Install dependencies

### Step 3: Start the API

```bash
cd services/control-plane
source venv/bin/activate  # On Windows: venv\Scripts\activate
python api/main.py
```

API will run at: http://localhost:8000

### Step 4: Test the API

In a new terminal:

```bash
./test-api.sh
```

This will create a template, version, and instance to verify everything works.

---

## 🎯 What You Can Do Now

### Create an Agent Template
```bash
curl -X POST http://localhost:8000/v1/templates \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEifQ.signature" \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Agent"}'
```

### Create a Version
```bash
curl -X POST http://localhost:8000/v1/templates/{template_id}/versions \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "version_label": "v1.0.0",
    "artifact_hash": "abc123",
    "model_bundle": {"provider": "anthropic", "model": "claude-3-sonnet"},
    "prompt_bundle": {"system_prompt": "You are helpful"},
    "tool_manifest": {"tools": []}
  }'
```

### Deploy an Instance
```bash
curl -X POST http://localhost:8000/v1/instances \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "{version_id}",
    "environment": "dev",
    "policy_envelope_id": "22222222-2222-2222-2222-222222222222"
  }'
```

---

## 🔍 Infrastructure Access

Once Docker is running:

| Service | URL | Credentials |
|---------|-----|-------------|
| API | http://localhost:8000 | Token-based |
| API Docs | http://localhost:8000/docs | - |
| Temporal UI | http://localhost:8080 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | ar / dev_password |

---

## 📋 Development Workflow

### Check infrastructure status
```bash
cd infra/docker
docker-compose ps
```

### View logs
```bash
docker-compose logs -f postgres
docker-compose logs -f temporal
```

### Stop services
```bash
docker-compose down
```

### Restart services
```bash
docker-compose restart
```

### Connect to database
```bash
docker exec -it ar-postgres psql -U ar -d ar_dev
```

---

## 🎓 What's Next - Implementation Phases

### ✅ Phase 0-1: Complete
- Multi-tenant database schema
- Control plane API
- Basic agent registry

### 🚧 Phase 2: Evaluation Orchestrator (Weeks 6-7)
- Temporal workflows for running eval suites
- Sandboxed test execution
- Promotion gates based on eval results

### 📋 Phase 3: Policy Engine (Weeks 8-9)
- Policy evaluation service
- Runtime enforcement SDK
- ALLOW/NEEDS_APPROVAL/DENY decisions

### 📋 Phase 4: Mission Control UI (Weeks 10-11)
- Port React components from MissionControl
- State machine visualizer
- Approval center
- Policy editor

### 📋 Phase 5: Telemetry & Cost (Week 12)
- OpenTelemetry ingestion
- Cost ledger tracking
- Real-time dashboards

---

## 🐛 Troubleshooting

### Docker not starting
```bash
# Check Docker status
systemctl status docker  # Linux
# or open Docker Desktop app

# Restart Docker
sudo systemctl restart docker  # Linux
```

### Port conflicts
If ports 5432, 7233, 8000, 8080, 9000, 9001, or 9092 are in use:

```bash
# Find what's using a port
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Database connection errors
```bash
# Check Postgres is running
docker exec ar-postgres pg_isready -U ar

# View Postgres logs
docker logs ar-postgres

# Reset database
cd infra/docker
docker-compose down -v  # WARNING: Deletes all data
docker-compose up -d
```

### Python dependency issues
```bash
cd services/control-plane
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📚 Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Temporal Docs](https://docs.temporal.io/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [AR Implementation Plan](README.md)

---

## ✅ Success Criteria

You'll know Phase 0 is working when:

1. ✅ All Docker containers are running (`docker-compose ps`)
2. ✅ API health check returns 200 (`curl http://localhost:8000/health`)
3. ✅ You can create a template via API
4. ✅ Database has test tenant and policies
5. ✅ Temporal UI is accessible at http://localhost:8080

---

**Ready to continue? Install Docker and run `./quick-start.sh`**
