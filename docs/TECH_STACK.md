# ARM - Technology Stack

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** Locked for P1.1

---

## Core Stack (Exact Versions)

### Frontend
```json
{
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-router-dom": "6.22.0",
  "convex": "1.9.0"
}
```

### Build Tools
```json
{
  "vite": "5.1.0",
  "@vitejs/plugin-react": "4.2.1",
  "typescript": "5.3.3"
}
```

### Styling
```json
{
  "tailwindcss": "3.4.1",
  "postcss": "8.4.35",
  "autoprefixer": "10.4.17"
}
```

### Type Definitions
```json
{
  "@types/react": "18.2.55",
  "@types/react-dom": "18.2.19"
}
```

---

## Backend (Convex)

### Convex Platform
- **Version:** Latest (managed by Convex CLI)
- **Runtime:** Node.js 18+ (Convex-managed)
- **Deployment:** `arm-dev` (development)

### Convex Features Used
- Real-time queries and mutations
- Indexes for performance
- Built-in authentication (configured, not enforced in P1.1)
- Multi-tenant data isolation (via tenantId)

---

## Package Manager

### pnpm
- **Version:** 10.15.0+
- **Workspace:** Enabled
- **Lock File:** `pnpm-lock.yaml` (committed)

### Workspace Structure
```yaml
packages:
  - "ui"
  - "packages/*"
```

---

## Development Tools

### Node.js
- **Version:** 18.0.0+ (LTS)
- **Required:** Yes

### TypeScript
- **Version:** 5.3.3
- **Config:** Strict mode enabled
- **Target:** ES2020
- **Module:** ESNext

### ESLint (Optional)
- Not configured in P1.1
- Add in P1.2 if needed

### Prettier (Optional)
- Not configured in P1.1
- Add in P1.2 if needed

---

## Infrastructure (Docker)

### PostgreSQL
- **Version:** 15-alpine
- **Port:** 5432
- **Usage:** Reference only (quarantined FastAPI)
- **Status:** Running but not used by ARM

### Temporal
- **Version:** 1.22.0
- **Port:** 7233 (gRPC), 8080 (UI)
- **Usage:** Future (P2.0 evaluation orchestration)
- **Status:** Running but not used in P1.1

### Redis
- **Version:** 7-alpine
- **Port:** 6379
- **Usage:** Future (caching)
- **Status:** Running but not used in P1.1

### MinIO
- **Version:** Latest
- **Port:** 9000 (API), 9001 (Console)
- **Usage:** Future (artifact storage)
- **Status:** Running but not used in P1.1

### Temporal PostgreSQL
- **Version:** 15-alpine
- **Port:** 5433
- **Usage:** Temporal backend
- **Status:** Running

---

## APIs & External Services

### Convex
- **URL:** `https://{deployment}.convex.cloud`
- **Auth:** API key in `.env.local`
- **Usage:** Primary backend

### Web Crypto API
- **Usage:** SHA-256 genome hashing
- **Availability:** Browser + Convex runtime
- **No external dependency**

---

## Browser Support

### Target Browsers
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

### Not Supported
- Internet Explorer (any version)
- Chrome < 100
- Safari < 16

---

## Deployment (Future)

### Frontend (P1.2+)
- **Platform:** Vercel or Netlify
- **Build Command:** `pnpm build`
- **Output:** `ui/dist/`

### Backend (Convex)
- **Platform:** Convex Cloud
- **Deployment:** Automatic on push
- **Environments:** dev, staging, prod

---

## Environment Variables

### Required
```bash
# Convex
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### Optional (P1.2+)
```bash
# Feature flags
VITE_ENABLE_POLICIES=true
VITE_ENABLE_APPROVALS=true

# Analytics (future)
VITE_ANALYTICS_ID=
```

---

## File Structure

```
agent-resources-platform/
├── ui/                          # React frontend
│   ├── src/
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx             # Router
│   │   ├── index.css           # Tailwind + ARM theme
│   │   ├── components/         # Reusable components
│   │   │   ├── Sidebar.tsx
│   │   │   └── VersionDrawer.tsx
│   │   └── views/              # Page components
│   │       ├── DirectoryView.tsx
│   │       └── PlaceholderView.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── convex/                      # Convex backend
│   ├── schema.ts               # Database schema
│   ├── lib/
│   │   ├── genomeHash.ts       # SHA-256 hashing
│   │   └── index.ts
│   ├── tenants.ts              # Tenant CRUD
│   ├── environments.ts         # Environment CRUD
│   ├── providers.ts            # Provider CRUD
│   ├── agentTemplates.ts       # Template CRUD
│   ├── agentVersions.ts        # Version CRUD + integrity
│   ├── agentInstances.ts       # Instance CRUD
│   ├── changeRecords.ts        # Audit queries
│   └── seedARM.ts              # Bootstrap script
│
├── packages/
│   └── shared/                 # Shared types
│       └── src/
│           ├── types/
│           │   ├── common.ts
│           │   ├── tenant.ts
│           │   ├── environment.ts
│           │   ├── provider.ts
│           │   ├── template.ts
│           │   ├── version.ts
│           │   ├── instance.ts
│           │   └── change.ts
│           └── index.ts
│
├── docs/                        # Documentation
│   ├── PRD.md
│   ├── APP_FLOW.md
│   ├── TECH_STACK.md           # This file
│   ├── FRONTEND_GUIDELINES.md
│   ├── BACKEND_STRUCTURE.md
│   └── IMPLEMENTATION_PLAN.md
│
├── .env.local                   # Environment config
├── pnpm-workspace.yaml
└── package.json
```

---

## Dependencies Rationale

### Why React 18.2.0?
- Stable, widely adopted
- Concurrent features for better UX
- Convex React hooks require 18+

### Why Convex?
- Real-time by default
- TypeScript-first
- Multi-tenant patterns built-in
- No REST API boilerplate
- Automatic scaling

### Why Tailwind CSS?
- Utility-first (fast iteration)
- Excellent dark mode support
- Small bundle size
- No CSS-in-JS runtime cost

### Why Vite?
- Fast HMR (hot module replacement)
- Native ESM support
- Optimized production builds
- Better DX than webpack

### Why pnpm?
- Faster than npm/yarn
- Disk space efficient
- Workspace support
- Strict dependency resolution

---

## Forbidden Dependencies

### Do NOT Add
❌ **Redux** - Use Convex queries (real-time state)  
❌ **Apollo/GraphQL** - Use Convex (better DX)  
❌ **Axios** - Use Convex mutations (type-safe)  
❌ **Lodash** - Use native JS (smaller bundle)  
❌ **Moment.js** - Use native Date or date-fns  
❌ **jQuery** - Use React (modern approach)  
❌ **Bootstrap** - Use Tailwind (custom design)  
❌ **Material-UI** - Use Tailwind (lighter)  

### Why Forbidden?
- Adds unnecessary bundle size
- Conflicts with Convex patterns
- Duplicates existing functionality
- Increases maintenance burden

---

## Version Upgrade Policy

### Major Versions
- **When:** Security vulnerabilities or critical features
- **Process:** Test in branch, review breaking changes, update docs
- **Approval:** Required from tech lead

### Minor/Patch Versions
- **When:** Bug fixes, performance improvements
- **Process:** Update and test
- **Approval:** Not required

### Lock File
- **Always commit:** `pnpm-lock.yaml`
- **Never delete:** Ensures reproducible builds
- **Update:** Only via `pnpm update`

---

## Installation Commands

### Initial Setup
```bash
# Install pnpm globally
npm install -g pnpm

# Install all dependencies
pnpm install

# Install Convex CLI
pnpm add -g convex
```

### Add New Dependency
```bash
# Frontend (ui)
cd ui
pnpm add react-query

# Shared package
cd packages/shared
pnpm add zod

# Workspace root
pnpm add -w convex
```

### Update Dependencies
```bash
# Update all to latest minor/patch
pnpm update

# Update specific package
pnpm update react

# Check outdated
pnpm outdated
```

---

## Build Commands

### Development
```bash
# Start Convex backend
npx convex dev

# Start UI frontend
cd ui && pnpm dev

# Run both (requires 2 terminals)
```

### Production Build
```bash
# Build UI
cd ui && pnpm build

# Output: ui/dist/

# Convex deploys automatically
```

### Type Checking
```bash
# Check all TypeScript
pnpm typecheck

# Check UI only
cd ui && pnpm typecheck
```

---

## Testing (P1.2+)

### Unit Tests (Planned)
```json
{
  "vitest": "1.2.0",
  "@testing-library/react": "14.1.2",
  "@testing-library/jest-dom": "6.2.0"
}
```

### E2E Tests (Planned)
```json
{
  "playwright": "1.41.0"
}
```

---

## Performance Budgets

### Bundle Size
- **Initial JS:** <200KB gzipped
- **Initial CSS:** <20KB gzipped
- **Total:** <250KB gzipped

### Lighthouse Scores (Target)
- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 90+

---

## Security

### Dependencies
- **Audit:** Run `pnpm audit` weekly
- **Fix:** Apply security patches immediately
- **Report:** Log vulnerabilities in GitHub Issues

### Environment Variables
- **Never commit:** `.env.local` to git
- **Use:** `.env.example` for documentation
- **Rotate:** API keys quarterly

---

**Document Owner:** Engineering Team  
**Last Audit:** February 10, 2026  
**Next Review:** March 10, 2026
