# ARM Quick Start Guide

Get ARM running in 5 minutes.

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ pnpm installed (`npm install -g pnpm`)
- ✅ Docker running (for infrastructure)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd /Users/jaywest/AMS/agent-resources-platform
pnpm install
```

Expected output: Dependencies installed for workspace (ui, packages/shared)

### 2. Verify Infrastructure

```bash
cd infra/docker
docker-compose ps
```

All services should show "Up" status. If not:

```bash
docker-compose up -d
sleep 30  # Wait for services to start
```

### 3. Initialize Convex

```bash
cd /Users/jaywest/AMS/agent-resources-platform
npx convex dev
```

**Important:** This will:
1. Prompt you to log in (or create account)
2. Ask to create a new project → Choose **"arm-dev"**
3. Generate deployment URL
4. Create `convex/_generated/` folder
5. Start watching for changes

**Keep this terminal running!**

### 4. Configure Environment

In a **new terminal**, update `.env.local`:

```bash
cd /Users/jaywest/AMS/agent-resources-platform

# Copy the deployment URL from the convex dev output
# It looks like: https://happy-animal-123.convex.cloud

cat > .env.local << 'EOF'
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
VITE_CONVEX_URL=https://your-deployment.convex.cloud
EOF

# Replace with your actual URL!
```

### 5. Seed Test Data

```bash
npx convex run seedARM
```

Expected output:
```
🚀 Starting ARM seed...
✅ Created tenant: j12345678...
✅ Created environments: {...}
✅ Created provider: j87654321...
✅ Created template: j11111111...
✅ Created version v1.0.0: j22222222...
✅ Created version v2.0.0: j33333333...
✅ Created instance in prod: j44444444...
🎉 ARM seed complete!
```

### 6. Start UI

In a **new terminal**:

```bash
cd /Users/jaywest/AMS/agent-resources-platform/ui
pnpm dev
```

Expected output:
```
  VITE v5.1.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 7. Open Browser

Navigate to: **http://localhost:5173**

You should see:
- ARM sidebar with navigation
- Directory view with tabs (Templates, Versions, Instances)
- Seeded data visible

## Verification Checklist

Run these checks to ensure everything works:

### ✅ Infrastructure Check

```bash
cd infra/docker
docker-compose ps
```

All services should be "Up":
- ar-postgres
- ar-temporal
- ar-temporal-ui
- ar-redis
- ar-minio

### ✅ Convex Check

```bash
npx convex dashboard
```

Should open Convex dashboard showing:
- Tables: tenants, environments, providers, agentTemplates, agentVersions, agentInstances, changeRecords
- Data visible in each table

### ✅ UI Check

Open http://localhost:5173 and verify:
- [ ] Sidebar shows ARM branding
- [ ] Navigation items visible (Directory, Policies, etc.)
- [ ] Directory view loads
- [ ] Tabs switch (Templates, Versions, Instances)
- [ ] Dark theme applied (ARM colors)

### ✅ Data Check

In Convex dashboard, query:

```javascript
// Should return 1 tenant
db.query("tenants").collect()

// Should return 1 template
db.query("agentTemplates").collect()

// Should return 2 versions
db.query("agentVersions").collect()

// Should return 1 instance
db.query("agentInstances").collect()
```

## Common Issues

### Issue: "convex dev" fails with auth error

**Solution:** Run `npx convex login` first, then retry

### Issue: UI shows "No data"

**Solution:** 
1. Check `.env.local` has correct CONVEX_DEPLOYMENT URL
2. Restart UI: `cd ui && pnpm dev`
3. Re-run seed: `npx convex run seedARM`

### Issue: Docker services not running

**Solution:**
```bash
cd infra/docker
docker-compose down
docker-compose up -d
```

### Issue: Port 5173 already in use

**Solution:** Kill existing process or change port in `ui/vite.config.ts`

## Next Steps

### Explore the UI

- Click through navigation items
- View placeholder screens for P1.2 features
- Check browser console for any errors

### Query Data

Open Convex dashboard and try:

```javascript
// Get version with integrity check
db.get("j22222222...")  // Use actual version ID

// View change records (audit trail)
db.query("changeRecords").order("desc").take(10)

// Check version lineage
// Find version with parentVersionId set
```

### Modify Code

Try making changes:

1. **Update UI colors** - Edit `ui/tailwind.config.js`
2. **Add field to schema** - Edit `convex/schema.ts` (Convex auto-deploys)
3. **Create new view** - Add file to `ui/src/views/`

## Development Workflow

### Terminal Layout (3 terminals)

**Terminal 1: Convex Backend**
```bash
cd /Users/jaywest/AMS/agent-resources-platform
npx convex dev
```

**Terminal 2: UI Frontend**
```bash
cd /Users/jaywest/AMS/agent-resources-platform/ui
pnpm dev
```

**Terminal 3: Commands**
```bash
cd /Users/jaywest/AMS/agent-resources-platform
# Run queries, seeds, etc.
```

### Hot Reload

- **Convex**: Auto-deploys on file save
- **UI**: Auto-reloads on file save

### Type Checking

```bash
# Check all TypeScript
pnpm typecheck

# Check UI only
cd ui && pnpm typecheck
```

## Useful Commands

```bash
# View Convex logs
npx convex logs

# Open Convex dashboard
npx convex dashboard

# Re-run seed
npx convex run seedARM

# Clear all data (dangerous!)
# Delete deployment in Convex dashboard, then re-init

# View infrastructure logs
cd infra/docker && docker-compose logs -f postgres
```

## Success Criteria

You've successfully set up ARM when:

- ✅ All 3 terminals running without errors
- ✅ UI loads at http://localhost:5173
- ✅ Seeded data visible in Directory view
- ✅ Convex dashboard shows populated tables
- ✅ No console errors in browser
- ✅ Navigation works between views

## Getting Help

- **Convex Docs**: https://docs.convex.dev
- **Vite Docs**: https://vitejs.dev
- **Tailwind Docs**: https://tailwindcss.com

---

**Ready to build!** 🚀

See [ARM_BUILD_PLAN.md](ARM_BUILD_PLAN.md) for architecture details.
