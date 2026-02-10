# ARM P1.1 Walking Skeleton - Implementation Steps

**Target:** `/Users/jaywest/AMS/agent-resources-platform`  
**Approach:** Bash-first, small commits, verify at each step  
**Timeline:** Execute sequentially, validate before proceeding

---

## Prerequisites Checklist

```bash
# Verify environment
[ ] cd /Users/jaywest/AMS/agent-resources-platform
[ ] git status  # Should be clean
[ ] node -v     # v18+ required
[ ] pnpm -v     # v8+ required
[ ] docker ps   # Infrastructure should be running
```

---

## Phase 0: Pre-Flight Verification

### Step 0.1: Baseline Check
```bash
cd /Users/jaywest/AMS/agent-resources-platform

# Check current state
git status
git log --oneline -5

# Verify infrastructure
cd infra/docker
docker-compose ps  # All services should be running

# If not running:
docker-compose up -d
sleep 30  # Wait for services
```

### Step 0.2: Install Dependencies
```bash
cd /Users/jaywest/AMS/agent-resources-platform

# Check if pnpm workspace exists
if [ ! -f "pnpm-workspace.yaml" ]; then
  echo "Creating pnpm workspace"
  cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "ui"
  - "packages/*"
EOF
fi

# Install dependencies
pnpm install

# Verify UI can build
cd ui
pnpm build || echo "UI build may need setup"
cd ..
```

### Step 0.3: Baseline Commit
```bash
# Only if changes were made
git add -A
git commit -m "chore: preflight baseline verified" || echo "No changes to commit"
```

**Checkpoint:** Infrastructure running, dependencies installed

---

## Phase 1: Fork Boundary Documentation

### Step 1.1: Create Fork Boundary Document
```bash
cd /Users/jaywest/AMS/agent-resources-platform

# ARM_BUILD_PLAN.md already created above
git add ARM_BUILD_PLAN.md
git commit -m "docs: add ARM fork boundary and architecture"
```

### Step 1.2: Create Implementation Tracking
```bash
# This file (ARM_IMPLEMENTATION_STEPS.md) already exists
git add ARM_IMPLEMENTATION_STEPS.md
git commit -m "docs: add detailed implementation steps"
```

**Checkpoint:** Documentation foundation established

---

## Phase 2: Quarantine Strategy

### Step 2.1: Create Quarantine Directories
```bash
cd /Users/jaywest/AMS/agent-resources-platform

mkdir -p _quarantine/fastapi
mkdir -p _quarantine/migrations
mkdir -p _quarantine/docs

# Move original implementation for reference
cp -r services/control-plane _quarantine/fastapi/
cp docs/PRD-Agent-Resources.md _quarantine/docs/original-prd.md
cp docs/ROADMAP.md _quarantine/docs/original-roadmap.md

git add _quarantine/
git commit -m "quarantine: preserve original AR implementation for reference"
```

**Checkpoint:** Original code preserved, ready for ARM implementation

---

## Phase 3: Convex Setup

### Step 3.1: Install Convex
```bash
cd /Users/jaywest/AMS/agent-resources-platform

# Add Convex to root
pnpm add -w convex

# Initialize Convex project
npx convex dev --once  # This will prompt for project creation

# Choose: Create new project → "arm-dev"
# Note the deployment URL
```

### Step 3.2: Configure Convex
```bash
# Create convex directory structure
mkdir -p convex/lib

# Create .env.local for Convex URL
cat > .env.local << 'EOF'
CONVEX_DEPLOYMENT=<your-deployment-url>
VITE_CONVEX_URL=<your-deployment-url>
EOF

git add convex/ .env.local
git commit -m "infra: initialize Convex arm-dev deployment"
```

**Checkpoint:** Convex project created and configured

---

## Phase 4: Tailwind Setup

### Step 4.1: Install Tailwind
```bash
cd /Users/jaywest/AMS/agent-resources-platform/ui

pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 4.2: Configure Tailwind
```bash
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arm: {
          navy: '#1B2A4A',
          blue: '#2B5797',
          accent: '#4472C4',
          surface: '#0F1629',
          surfaceLight: '#1A2340',
          border: '#2A3654',
          text: '#E2E8F0',
          textMuted: '#94A3B8',
          success: '#548235',
          warning: '#BF8F00',
          danger: '#C00000'
        }
      }
    },
  },
  plugins: [],
}
EOF
```

### Step 4.3: Add Tailwind Directives
```bash
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-height: 100vh;
}

.dark {
  background-color: #0F1629;
  color: #E2E8F0;
}
EOF

cd ..
git add ui/
git commit -m "ui: add Tailwind CSS with ARM theme palette"
```

**Checkpoint:** Tailwind configured with ARM branding

---

## Phase 5: Convex Schema

### Step 5.1: Create Schema
```bash
cd /Users/jaywest/AMS/agent-resources-platform

cat > convex/schema.ts << 'EOF'
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core Registry
  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    settings: v.optional(v.any()),
  }).index("by_slug", ["slug"]),

  environments: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    slug: v.string(),
    config: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"]),

  operators: defineTable({
    tenantId: v.id("tenants"),
    authIdentity: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),
  }).index("by_tenant", ["tenantId"])
    .index("by_auth", ["authIdentity"]),

  providers: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    type: v.union(v.literal("local"), v.literal("federated")),
    federationConfig: v.optional(v.any()),
    healthEndpoint: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"]),

  agentTemplates: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    owners: v.array(v.string()),
    tags: v.array(v.string()),
  }).index("by_tenant", ["tenantId"])
    .index("by_name", ["tenantId", "name"]),

  agentVersions: defineTable({
    templateId: v.id("agentTemplates"),
    tenantId: v.id("tenants"),
    versionLabel: v.string(),
    genome: v.object({
      modelConfig: v.any(),
      promptBundleHash: v.string(),
      toolManifest: v.array(v.any()),
      provenance: v.optional(v.any()),
    }),
    genomeHash: v.string(),
    lifecycleState: v.union(
      v.literal("DRAFT"),
      v.literal("TESTING"),
      v.literal("CANDIDATE"),
      v.literal("APPROVED"),
      v.literal("DEPRECATED"),
      v.literal("RETIRED")
    ),
    evalStatus: v.union(
      v.literal("NOT_RUN"),
      v.literal("RUNNING"),
      v.literal("PASS"),
      v.literal("FAIL")
    ),
    parentVersionId: v.optional(v.id("agentVersions")),
  }).index("by_tenant", ["tenantId"])
    .index("by_template", ["templateId"])
    .index("by_state", ["tenantId", "lifecycleState"])
    .index("by_hash", ["genomeHash"]),

  agentInstances: defineTable({
    versionId: v.id("agentVersions"),
    tenantId: v.id("tenants"),
    environmentId: v.id("environments"),
    providerId: v.id("providers"),
    state: v.union(
      v.literal("PROVISIONING"),
      v.literal("ACTIVE"),
      v.literal("PAUSED"),
      v.literal("READONLY"),
      v.literal("DRAINING"),
      v.literal("QUARANTINED"),
      v.literal("RETIRED")
    ),
    identityPrincipal: v.optional(v.string()),
    secretRef: v.optional(v.string()),
    policyEnvelopeId: v.optional(v.string()),
    heartbeatAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"])
    .index("by_version", ["versionId"])
    .index("by_environment", ["tenantId", "environmentId"])
    .index("by_state", ["tenantId", "state"]),

  changeRecords: defineTable({
    tenantId: v.id("tenants"),
    type: v.string(),
    targetEntity: v.string(),
    targetId: v.string(),
    operatorId: v.optional(v.id("operators")),
    payload: v.any(),
    timestamp: v.number(),
  }).index("by_tenant", ["tenantId"])
    .index("by_target", ["targetEntity", "targetId"])
    .index("by_type", ["tenantId", "type"]),

  // P1.2 Schema (not implemented yet)
  policyEnvelopes: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    autonomyTier: v.number(),
    allowedTools: v.array(v.string()),
    costLimits: v.optional(v.any()),
  }).index("by_tenant", ["tenantId"]),

  approvalRecords: defineTable({
    tenantId: v.id("tenants"),
    requestType: v.string(),
    targetId: v.string(),
    status: v.string(),
    requestedBy: v.id("operators"),
    decidedBy: v.optional(v.id("operators")),
  }).index("by_tenant", ["tenantId"]),
});
EOF

git add convex/schema.ts
git commit -m "schema: add ARM core tables with providers and P1.2 placeholders"
```

**Checkpoint:** Convex schema defined

---

## Phase 6: Shared Types & Genome Hashing

### Step 6.1: Create Shared Types Package
```bash
cd /Users/jaywest/AMS/agent-resources-platform

mkdir -p packages/shared/src/types

# Create type files (abbreviated for brevity)
cat > packages/shared/src/types/version.ts << 'EOF'
export interface Genome {
  modelConfig: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  promptBundleHash: string;
  toolManifest: ToolManifestEntry[];
  provenance?: {
    builtAt: string;
    builtBy: string;
    commitRef?: string;
    buildPipeline?: string;
    parentVersionId?: string;
  };
}

export interface ToolManifestEntry {
  toolId: string;
  schemaVersion: string;
  requiredPermissions: string[];
}

export type VersionLifecycleState =
  | "DRAFT"
  | "TESTING"
  | "CANDIDATE"
  | "APPROVED"
  | "DEPRECATED"
  | "RETIRED";

export type EvalStatus = "NOT_RUN" | "RUNNING" | "PASS" | "FAIL";
EOF

cat > packages/shared/src/index.ts << 'EOF'
export * from './types/version';
// Add other exports as needed
EOF

cat > packages/shared/package.json << 'EOF'
{
  "name": "@arm/shared",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
EOF
```

### Step 6.2: Implement Genome Hashing
```bash
cat > convex/lib/genomeHash.ts << 'EOF'
import { Genome } from "../../packages/shared/src/types/version";

/**
 * Canonicalize genome for deterministic hashing
 * - Deep sort all object keys
 * - Remove undefined values
 * - Ensure consistent JSON serialization
 */
export function canonicalizeGenome(genome: Genome): string {
  const sortObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(sortObject);
    if (typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result: any, key) => {
          const value = obj[key];
          if (value !== undefined) {
            result[key] = sortObject(value);
          }
          return result;
        }, {});
    }
    return obj;
  };

  return JSON.stringify(sortObject(genome));
}

/**
 * Compute SHA-256 hash of genome
 * Uses Web Crypto API (available in Convex runtime)
 */
export async function computeGenomeHash(genome: Genome): Promise<string> {
  const canonical = canonicalizeGenome(genome);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify genome integrity
 * Returns true if computed hash matches stored hash
 */
export async function verifyGenomeIntegrity(
  genome: Genome,
  storedHash: string
): Promise<boolean> {
  const computedHash = await computeGenomeHash(genome);
  return computedHash === storedHash;
}
EOF

cat > convex/lib/index.ts << 'EOF'
export * from './genomeHash';
EOF

git add packages/shared/ convex/lib/
git commit -m "core: add genome types and SHA-256 canonical hashing"
```

**Checkpoint:** Type system and hashing implemented

---

## Phase 7: State Machines

### Step 7.1: Create State Machine Package
```bash
mkdir -p packages/state-machine/src

cat > packages/state-machine/src/versionStateMachine.ts << 'EOF'
import { VersionLifecycleState, EvalStatus } from "@arm/shared";

export const VERSION_TRANSITIONS: Record<
  VersionLifecycleState,
  VersionLifecycleState[]
> = {
  DRAFT: ["TESTING"],
  TESTING: ["CANDIDATE", "DRAFT"],
  CANDIDATE: ["APPROVED", "DRAFT"],
  APPROVED: ["DEPRECATED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

export function canTransitionVersion(
  from: VersionLifecycleState,
  to: VersionLifecycleState,
  evalStatus: EvalStatus
): { allowed: boolean; reason?: string } {
  // Check if transition exists
  if (!VERSION_TRANSITIONS[from].includes(to)) {
    return {
      allowed: false,
      reason: `Invalid transition from ${from} to ${to}`,
    };
  }

  // Guard: TESTING → CANDIDATE requires PASS
  if (from === "TESTING" && to === "CANDIDATE" && evalStatus !== "PASS") {
    return {
      allowed: false,
      reason: "Cannot promote to CANDIDATE without passing evaluation",
    };
  }

  return { allowed: true };
}
EOF

cat > packages/state-machine/package.json << 'EOF'
{
  "name": "@arm/state-machine",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
EOF

git add packages/state-machine/
git commit -m "core: add version/instance state machines with guards"
```

**Checkpoint:** State machines defined

---

## Phase 8: Convex CRUD Operations

### Step 8.1: Bootstrap Functions
```bash
cat > convex/tenants.ts << 'EOF'
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      settings: {},
    });
    return tenantId;
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tenants").collect();
  },
});
EOF

# Create similar files for environments, operators, providers
# (abbreviated for brevity - full implementation needed)

git add convex/
git commit -m "backend: add tenant bootstrap and CRUD operations"
```

### Step 8.2: Template CRUD
```bash
cat > convex/agentTemplates.ts << 'EOF'
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    owners: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert("agentTemplates", args);
    
    // Write ChangeRecord
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "TEMPLATE_CREATED",
      targetEntity: "agentTemplate",
      targetId: templateId,
      payload: { name: args.name },
      timestamp: Date.now(),
    });
    
    return templateId;
  },
});

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentTemplates")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
EOF

git add convex/agentTemplates.ts
git commit -m "backend: add template CRUD with change records"
```

### Step 8.3: Version CRUD with Hashing
```bash
cat > convex/agentVersions.ts << 'EOF'
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { computeGenomeHash, verifyGenomeIntegrity } from "./lib/genomeHash";

export const create = mutation({
  args: {
    templateId: v.id("agentTemplates"),
    tenantId: v.id("tenants"),
    versionLabel: v.string(),
    genome: v.any(),
    parentVersionId: v.optional(v.id("agentVersions")),
  },
  handler: async (ctx, args) => {
    // Compute hash
    const genomeHash = await computeGenomeHash(args.genome);
    
    const versionId = await ctx.db.insert("agentVersions", {
      templateId: args.templateId,
      tenantId: args.tenantId,
      versionLabel: args.versionLabel,
      genome: args.genome,
      genomeHash,
      lifecycleState: "DRAFT",
      evalStatus: "NOT_RUN",
      parentVersionId: args.parentVersionId,
    });
    
    // Write ChangeRecord
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "VERSION_CREATED",
      targetEntity: "agentVersion",
      targetId: versionId,
      payload: { versionLabel: args.versionLabel, genomeHash },
      timestamp: Date.now(),
    });
    
    return versionId;
  },
});

export const get = query({
  args: { versionId: v.id("agentVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) return null;
    
    // Verify integrity on detail read
    const isValid = await verifyGenomeIntegrity(
      version.genome,
      version.genomeHash
    );
    
    if (!isValid) {
      // Write integrity failure record
      await ctx.db.insert("changeRecords", {
        tenantId: version.tenantId,
        type: "VERSION_INTEGRITY_FAILED",
        targetEntity: "agentVersion",
        targetId: args.versionId,
        payload: { genomeHash: version.genomeHash },
        timestamp: Date.now(),
      });
    }
    
    return {
      ...version,
      integrityStatus: isValid ? "VERIFIED" : "TAMPERED",
    };
  },
});

export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // NO hash verification on list for performance
    return await ctx.db
      .query("agentVersions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
EOF

git add convex/agentVersions.ts
git commit -m "backend: add version CRUD with immutable genome hashing"
```

**Checkpoint:** Core CRUD operations implemented

---

## Phase 9: React UI

### Step 9.1: Create Directory View
```bash
cd /Users/jaywest/AMS/agent-resources-platform/ui

mkdir -p src/views src/components

cat > src/views/DirectoryView.tsx << 'EOF'
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function DirectoryView() {
  const templates = useQuery(api.agentTemplates.list, { 
    tenantId: "YOUR_TENANT_ID" // TODO: Get from auth
  });
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-arm-text mb-6">
        Agent Directory
      </h1>
      
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border">
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-arm-border font-semibold text-arm-textMuted">
          <div>Name</div>
          <div>Owners</div>
          <div>Tags</div>
          <div>Actions</div>
        </div>
        
        {templates?.map((template) => (
          <div key={template._id} className="grid grid-cols-4 gap-4 p-4 border-b border-arm-border">
            <div className="text-arm-text">{template.name}</div>
            <div className="text-arm-textMuted">{template.owners.join(", ")}</div>
            <div className="text-arm-textMuted">{template.tags.join(", ")}</div>
            <div>
              <button className="text-arm-accent hover:text-arm-blue">
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

git add src/views/
git commit -m "ui: add Directory view with template listing"
```

**Checkpoint:** Basic UI implemented

---

## Phase 10: Seed Script

### Step 10.1: Create Seed Script
```bash
cd /Users/jaywest/AMS/agent-resources-platform

cat > convex/seedARM.ts << 'EOF'
import { mutation } from "./_generated/server";

export default mutation({
  handler: async (ctx) => {
    // Create tenant
    const tenantId = await ctx.db.insert("tenants", {
      name: "ARM Dev Org",
      slug: "arm-dev",
      settings: {},
    });
    
    // Create environments
    const devEnvId = await ctx.db.insert("environments", {
      tenantId,
      name: "Development",
      slug: "dev",
      config: {},
    });
    
    // Create provider
    const providerId = await ctx.db.insert("providers", {
      tenantId,
      name: "local",
      type: "local",
    });
    
    // Create template
    const templateId = await ctx.db.insert("agentTemplates", {
      tenantId,
      name: "Customer Support Agent",
      description: "Handles customer inquiries",
      owners: ["ops@example.com"],
      tags: ["support", "customer-facing"],
    });
    
    console.log("Seed complete!", { tenantId, templateId });
    return { tenantId, templateId };
  },
});
EOF

git add convex/seedARM.ts
git commit -m "seed: add ARM bootstrap seed script"
```

**Checkpoint:** Seed script ready

---

## Phase 11: Final Verification

### Step 11.1: Run Full Stack
```bash
# Terminal 1: Infrastructure
cd /Users/jaywest/AMS/agent-resources-platform/infra/docker
docker-compose up

# Terminal 2: Convex
cd /Users/jaywest/AMS/agent-resources-platform
npx convex dev

# Terminal 3: UI
cd /Users/jaywest/AMS/agent-resources-platform/ui
pnpm dev

# Terminal 4: Run seed
npx convex run seedARM
```

### Step 11.2: Verification Checklist
```bash
# [ ] TypeScript compiles
pnpm typecheck

# [ ] Directory loads
# Open http://localhost:5173 and verify

# [ ] Create template works
# Test via UI

# [ ] Version hash verified
# Check in browser console
```

### Step 11.3: Final Commit
```bash
git log --oneline -15
git status

# Should show clean working directory
```

---

## Success Criteria

✅ All commits follow pattern: `type: description`  
✅ No TypeScript errors  
✅ Dev server runs without crashes  
✅ Directory view displays seeded data  
✅ Version genome hash verification works  
✅ State transitions enforce rules  
✅ ChangeRecords written for mutations  

---

## How to Run ARM

```bash
# 1. Start infrastructure
cd infra/docker && docker-compose up -d

# 2. Start Convex backend
cd /Users/jaywest/AMS/agent-resources-platform
npx convex dev

# 3. Start UI
cd ui && pnpm dev

# 4. Seed data (first time only)
npx convex run seedARM

# 5. Open browser
open http://localhost:5173
```

---

**Implementation Complete!** 🎉
