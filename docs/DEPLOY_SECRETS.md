# Deployment Secrets Checklist

Configure these secrets in **GitHub → Settings → Secrets and variables → Actions** before deploying.

---

## Required (always)

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `CONVEX_DEPLOY_KEY` | Convex production deploy key | [Convex Dashboard](https://dashboard.convex.dev) → Settings → Deploy Keys → Create |
| `CONVEX_URL` | Convex deployment URL | Convex Dashboard → URL (e.g. `https://xxx.convex.cloud`) |

---

## Optional (for full deploy)

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `VERCEL_TOKEN` | Vercel deploy token | [Vercel](https://vercel.com/account/tokens) → Create Token. When set, frontend deploys to Vercel after Convex. |

---

## Frontend env (Vercel / Netlify)

Configure in your hosting dashboard (Vercel → Project → Settings → Environment Variables):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CONVEX_URL` | Yes | Same as `CONVEX_URL` |
| `VITE_CLERK_PUBLISHABLE_KEY` | If using auth | `pk_live_...` from Clerk |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error reporting |

---

## Quick setup

```bash
# 1. Get Convex deploy key
npx convex dashboard
# → Settings → Deploy Keys → Create key → Copy

# 2. Add to GitHub
# Repo → Settings → Secrets and variables → Actions → New repository secret
# Add CONVEX_DEPLOY_KEY, CONVEX_URL

# 3. (Optional) Add Vercel token for frontend deploy
# vercel.com → Account → Tokens → Create → Copy
# Add VERCEL_TOKEN to GitHub secrets

# 4. (Optional) Add DEPLOYED_FRONTEND_URL for post-deploy verification
# Repo → Settings → Variables → New variable
# Name: DEPLOYED_FRONTEND_URL, Value: https://your-app.vercel.app
# The deploy workflow will run scripts/verify-deploy.sh when this is set.
```
