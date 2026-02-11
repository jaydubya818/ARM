# Deployment Guide

**ARM Production Deployment**  
**Last Updated:** February 10, 2026  
**Version:** 1.0.0

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Convex Deployment](#convex-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Production Checklist](#production-checklist)
- [Monitoring](#monitoring)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

ARM consists of two main components:
1. **Backend**: Convex (serverless database + functions)
2. **Frontend**: React SPA (Vite build)

**Recommended Deployment Stack:**
- **Backend**: Convex Cloud (managed)
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **DNS**: Cloudflare
- **Monitoring**: Convex Dashboard + Sentry

---

## Prerequisites

### Required Accounts

- [ ] **Convex Account** - [dashboard.convex.dev](https://dashboard.convex.dev)
- [ ] **Vercel/Netlify Account** - For frontend hosting
- [ ] **Domain** - For custom domain (optional)
- [ ] **Sentry Account** - For error tracking (optional)

### Required Tools

```bash
# Install Convex CLI
npm install -g convex

# Install Vercel CLI (if using Vercel)
npm install -g vercel

# Verify installations
convex --version
vercel --version
```

---

## Environment Setup

### 1. Create Production Convex Project

```bash
# Navigate to project root
cd /path/to/arm

# Login to Convex
convex login

# Create production deployment
convex deploy --prod

# This will:
# - Create a new Convex project
# - Deploy all functions and schema
# - Generate a production URL
```

**Output:**
```
✓ Deployed functions to https://your-project.convex.cloud
✓ Deployment URL: https://your-project.convex.cloud
```

### 2. Configure Clerk Authentication

See **[AUTH_SETUP.md](./AUTH_SETUP.md)** for full instructions. Summary:
1. Create a Clerk account and JWT template named `convex`
2. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex Dashboard
3. Update `convex/auth.config.ts` with your Clerk domain and run `npx convex deploy`

### 3. Configure Environment Variables

Create `.env.production` in the `ui/` directory:

```bash
# ui/.env.production
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

For local development, use `.env.local` with `pk_test_...` keys.

### 4. Seed Production Data

```bash
# Run seed script in production
convex run seedARM --prod

# This creates:
# - Default tenant
# - Default environment (production)
# - Default operator
# - Default provider (local)
```

---

## Convex Deployment

### Initial Deployment

```bash
# From project root
cd /path/to/arm

# Deploy to production
convex deploy --prod

# Verify deployment
convex dashboard --prod
```

### Schema Migrations

Convex handles schema migrations automatically:

```typescript
// convex/schema.ts
export default defineSchema({
  // Add new table
  newTable: defineTable({
    field: v.string(),
  }),
  
  // Modify existing table (add optional field)
  existingTable: defineTable({
    oldField: v.string(),
    newField: v.optional(v.string()), // ✅ Safe
  }),
})
```

**Safe Migrations:**
- ✅ Add new tables
- ✅ Add optional fields
- ✅ Add indexes

**Unsafe Migrations (require manual migration):**
- ❌ Remove fields (data loss)
- ❌ Change field types
- ❌ Make optional fields required

### Rollback Convex Deployment

```bash
# List recent deployments
convex deployments list --prod

# Rollback to previous deployment
convex deployments rollback <deployment-id> --prod
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### Initial Setup

```bash
# From ui/ directory
cd ui

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Automatic Deployments

`ui/vercel.json` is configured. Connect GitHub for auto-deploy on push.

Connect GitHub repository for automatic deployments:

```bash
# Link repository
vercel link

# Configure environment variables in Vercel dashboard:
# Settings → Environment Variables → Add:
#   VITE_CONVEX_URL = https://your-project.convex.cloud
#   VITE_CLERK_PUBLISHABLE_KEY = pk_live_... (if using Clerk)
```

### Option 2: Netlify

`netlify.toml` at project root is configured. Deploy with:

```bash
# From project root
cd ui

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Option 3: Cloudflare Pages

#### Deploy via Git

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pages → Create a project → Connect to Git
3. Select repository
4. Configure build:
   - **Build command**: `cd ui && pnpm build`
   - **Build output directory**: `ui/dist`
   - **Root directory**: `/`
5. Add environment variable:
   - `VITE_CONVEX_URL` = `https://your-project.convex.cloud`
6. Deploy

---

## Deploy Script

From project root:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This deploys Convex to production and builds the UI. Deploy the `ui/dist/` folder to your hosting provider.

---

## Production Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Linter errors resolved
- [ ] Environment variables configured
- [ ] Seed script tested
- [ ] API endpoints verified
- [ ] UI tested in production mode (`pnpm build && pnpm preview`)

### Deployment

- [ ] Convex deployed (`convex deploy --prod`)
- [ ] Seed script run (`convex run seedARM --prod`)
- [ ] Frontend deployed (Vercel/Netlify/Cloudflare)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] CORS configured (if needed)

### Post-Deployment

- [ ] Health check passed
- [ ] Login flow tested
- [ ] Create template tested
- [ ] Create version tested
- [ ] Policy CRUD tested
- [ ] Approval workflow tested
- [ ] Error tracking configured
- [ ] Monitoring dashboards set up

---

## Monitoring

### Convex Dashboard

Monitor backend health:

```bash
# Open Convex dashboard
convex dashboard --prod
```

**Key Metrics:**
- Function execution time
- Database read/write counts
- Error rates
- Active connections

### Frontend Monitoring (Sentry)

#### Install Sentry

```bash
cd ui
pnpm add @sentry/react @sentry/vite-plugin
```

#### Configure Sentry

```typescript
// ui/src/main.tsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "https://your-dsn@sentry.io/project-id",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### Custom Monitoring

Create a health check endpoint:

```typescript
// convex/health.ts
import { query } from "./_generated/server"

export const check = query({
  handler: async (ctx) => {
    // Check database connectivity
    const tenants = await ctx.db.query("tenants").take(1)
    
    return {
      status: "healthy",
      timestamp: Date.now(),
      database: tenants.length > 0 ? "connected" : "empty",
    }
  },
})
```

Monitor from external service:

```bash
# Uptime monitoring (UptimeRobot, Pingdom, etc.)
curl https://your-project.convex.cloud/api/health/check
```

---

## Rollback Procedures

### Backend Rollback

```bash
# List deployments
convex deployments list --prod

# Rollback to previous
convex deployments rollback <deployment-id> --prod

# Verify rollback
convex dashboard --prod
```

### Frontend Rollback

#### Vercel

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url> --prod
```

#### Netlify

```bash
# List deploys
netlify deploys:list

# Restore previous deploy
netlify deploys:restore <deploy-id>
```

### Data Rollback

**⚠️ Warning:** Convex doesn't support automatic data rollback.

**Manual Data Recovery:**

1. Export data before deployment:
```bash
# Before deployment
convex export --prod > backup-$(date +%Y%m%d).json
```

2. If rollback needed:
```bash
# Restore from backup
convex import backup-20260210.json --prod
```

---

## Troubleshooting

### Common Issues

#### 1. "Convex URL not found"

**Cause:** `VITE_CONVEX_URL` not set

**Solution:**
```bash
# Check environment variable
echo $VITE_CONVEX_URL

# Set in .env.production
VITE_CONVEX_URL=https://your-project.convex.cloud

# Rebuild frontend
cd ui && pnpm build
```

#### 2. "No tenants found"

**Cause:** Seed script not run

**Solution:**
```bash
# Run seed script in production
convex run seedARM --prod
```

#### 3. "Function not found"

**Cause:** Convex deployment incomplete

**Solution:**
```bash
# Redeploy Convex
convex deploy --prod --force

# Verify functions
convex dashboard --prod
```

#### 4. "CORS error"

**Cause:** Frontend domain not whitelisted

**Solution:**
```bash
# Convex automatically allows your frontend domain
# If issues persist, check Convex dashboard → Settings → CORS
```

#### 5. "Build failed: Module not found"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd ui
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Debug Mode

Enable debug logging:

```typescript
// ui/src/main.tsx
if (import.meta.env.DEV) {
  localStorage.setItem('convex:debug', 'true')
}
```

### Performance Issues

**Slow queries:**

```typescript
// Add indexes to schema
defineTable({
  field: v.string(),
}).index("by_field", ["field"]) // ✅ Faster queries
```

**Too many re-renders:**

```typescript
// Use useMemo for filtered data
const filtered = useMemo(() => {
  return data?.filter(item => item.status === 'active')
}, [data])
```

---

## Scaling

### Convex Limits

**Free Tier:**
- 1M database reads/month
- 100K database writes/month
- 1GB storage

**Pro Tier ($25/month):**
- 10M database reads/month
- 1M database writes/month
- 10GB storage

**Enterprise:**
- Custom limits
- SLA guarantees
- Dedicated support

### Frontend Scaling

**Vercel:**
- Auto-scales
- Global CDN
- Edge caching

**Optimization:**
- Code splitting: `React.lazy()`
- Image optimization: `next/image` equivalent
- Bundle analysis: `vite-bundle-visualizer`

---

## Security

### Production Security Checklist

- [ ] **Environment Variables**: Never commit `.env.production`
- [ ] **API Keys**: Use Convex environment variables
- [ ] **HTTPS**: Enforce SSL (automatic on Vercel/Netlify)
- [ ] **CORS**: Whitelist only production domains
- [ ] **Authentication**: Implement Convex auth
- [ ] **Rate Limiting**: Enable Convex rate limits
- [ ] **Error Messages**: Don't expose stack traces in production
- [ ] **Dependencies**: Run `pnpm audit` regularly

### Secrets Management

```bash
# Set Convex environment variables
convex env set API_KEY "secret-value" --prod

# Access in functions
const apiKey = process.env.API_KEY
```

---

## Backup Strategy

### Automated Backups

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
convex export --prod > backups/arm-backup-$DATE.json

# Run daily via cron
0 2 * * * /path/to/backup-script.sh
```

### Backup Retention

- **Daily backups**: Keep for 7 days
- **Weekly backups**: Keep for 4 weeks
- **Monthly backups**: Keep for 12 months

---

## Support

For deployment issues:
- **Convex Support**: [convex.dev/support](https://convex.dev/support)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **ARM Issues**: [github.com/your-org/arm/issues](https://github.com)

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0  
**Maintainer:** ARM Team
