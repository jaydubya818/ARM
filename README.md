# ARM - Agent Resource Management

Enterprise system of record for AI agent fleets with immutable version lineage and policy-driven governance.

## 🎯 What is ARM?

ARM (Agent Resource Management) is a version-centric agent registry that provides:

- **Immutable Version Lineage** - SHA-256 genome hashing with write-once enforcement
- **Lifecycle State Machines** - Formal transitions for versions and instances
- **Multi-Tenant Isolation** - Single-tenant runtime with Convex
- **Audit Trail** - Append-only ChangeRecords for all mutations
- **Provider Registry** - Federation-ready infrastructure

## 🏗️ Architecture

```
ARM/
├── convex/                 # Backend (Convex)
│   ├── schema.ts          # Multi-tenant schema
│   ├── lib/genomeHash.ts  # SHA-256 hashing
│   ├── agentTemplates.ts  # Template CRUD
│   ├── agentVersions.ts   # Version CRUD + integrity
│   ├── agentInstances.ts  # Instance CRUD
│   └── seedARM.ts         # Bootstrap script
├── ui/                     # Frontend (React + Tailwind)
│   └── src/
│       ├── views/         # Directory, Policies, etc.
│       └── components/    # Sidebar, StatusChip, etc.
├── packages/
│   └── shared/            # TypeScript types
└── _quarantine/           # Original AR FastAPI (reference)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for infrastructure)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure

```bash
cd infra/docker
docker-compose up -d
```

### 3. Initialize Convex

```bash
# Create new Convex project
npx convex dev

# This will:
# - Prompt you to create a new project (choose "arm-dev")
# - Generate deployment URL
# - Create convex/_generated/ folder
```

### 4. Configure Environment

Update `.env.local` with your Convex deployment URL:

```bash
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### 5. Seed Test Data

```bash
npx convex run seedARM
```

This creates:
- Tenant "ARM Dev Org"
- 3 environments (dev, staging, prod)
- 1 provider ("local")
- 1 template ("Customer Support Agent")
- 2 versions (v1.0.0, v2.0.0 with lineage)
- 1 active instance in prod

### 6. Start UI

```bash
cd ui
pnpm dev
```

Open http://localhost:5173

## 📋 Core Concepts

### Immutable Version Rule

**CRITICAL:** Version genome + hash are **write-once only**.

- `genome` contains: `modelConfig`, `promptBundleHash`, `toolManifest`, `provenance`
- `genomeHash` is SHA-256 of canonicalized genome
- No mutation exists for genome fields
- Any change requires creating a new version with `parentVersionId`

### Integrity Verification

- **Detail reads**: Recompute hash and verify
- **List queries**: Skip verification for performance
- **On mismatch**: Write `INTEGRITY_FAILED` ChangeRecord

### State Machines

**Version Lifecycle:**
```
DRAFT → TESTING → CANDIDATE → APPROVED → DEPRECATED → RETIRED
```

**Instance States:**
```
PROVISIONING → ACTIVE → PAUSED/READONLY/DRAINING/QUARANTINED → RETIRED
```

### ChangeRecords (Audit Trail)

All mutations write typed events:
- `TEMPLATE_CREATED`, `TEMPLATE_UPDATED`
- `VERSION_CREATED`, `VERSION_TRANSITIONED`
- `VERSION_INTEGRITY_VERIFIED`, `VERSION_INTEGRITY_FAILED`
- `INSTANCE_CREATED`, `INSTANCE_TRANSITIONED`

## 🧪 Development

### Run Type Check

```bash
pnpm typecheck
```

### View Convex Dashboard

```bash
npx convex dashboard
```

### Query Data

```typescript
// In Convex dashboard or UI
const templates = await ctx.db.query("agentTemplates").collect()
const versions = await ctx.db.query("agentVersions").collect()
```

## 📊 What's Implemented (P1.1)

✅ Multi-tenant schema with RLS patterns  
✅ Immutable genome with SHA-256 hashing  
✅ Template → Version → Instance hierarchy  
✅ Provider registry for federation  
✅ State machines with guards  
✅ ChangeRecord audit trail  
✅ React UI with Tailwind + ARM theme  
✅ Directory view with tabs  
✅ Seed script with test data  

## 🔜 Coming in P1.2+

- Policy evaluation engine
- Approval workflows
- Evaluation orchestration
- Cost tracking
- Federation implementation

## 📖 Documentation

- [ARM Build Plan](ARM_BUILD_PLAN.md) - Architecture and decisions
- [Implementation Steps](ARM_IMPLEMENTATION_STEPS.md) - Detailed guide
- [Original AR PRD](_quarantine/docs/original-prd.md) - Reference

## 🏢 Original AR Platform

The original Agent Resources platform (FastAPI + PostgreSQL) is preserved in `_quarantine/fastapi/` for reference. ARM is a parallel implementation using Convex for the backend.

## 📝 License

MIT

---

**Status:** P1.1 Walking Skeleton Complete ✅
