# Deploy to Production Now

Follow these steps in order.

**Quick setup (terminal):** Run `./scripts/setup-github-secrets.sh` to configure secrets interactively.

---

## Step 1: Add GitHub Secrets

1. Open: **https://github.com/jaydubya818/ARM/settings/secrets/actions**
2. Click **New repository secret** for each:

| Name | How to get it |
|------|---------------|
| `CONVEX_DEPLOY_KEY` | [Convex Dashboard](https://dashboard.convex.dev) → your project → Settings → Deploy Keys → **Create** → Copy |
| `CONVEX_URL` | Same project → copy URL (e.g. `https://hidden-civet-872.convex.cloud`) |
| `VERCEL_TOKEN` *(optional)* | [Vercel Tokens](https://vercel.com/account/tokens) → Create → Copy |

---

## Step 2: Add GitHub Variable (for post-deploy verification)

1. Open: **https://github.com/jaydubya818/ARM/settings/variables/actions**
2. Click **New repository variable**
3. Name: `DEPLOYED_FRONTEND_URL`
4. Value: `https://your-app.vercel.app` (or your actual frontend URL after first deploy)

*You can add this after the first deploy once you know the URL.*

---

## Step 3: Get Convex Deploy Key (required)

1. Open [Convex Dashboard](https://dashboard.convex.dev) → your project → **Settings** → **Deploy Keys**
2. Click **Create** (production key)
3. Copy the key
4. Run: `echo "YOUR_KEY" | gh secret set CONVEX_DEPLOY_KEY --repo jaydubya818/ARM`
   - Or use the interactive script: `./scripts/setup-github-secrets.sh`

## Step 4: Deploy

**Option A – Push to trigger deploy**

```bash
git add -A && git commit -m "chore: production ready" && git push origin main
```

**Option B – Manual workflow run**

1. Push your changes first: `git add -A && git commit -m "fix: deploy workflow" && git push origin main`
2. Open: **https://github.com/jaydubya818/ARM/actions**
3. Select **Deploy** workflow → **Run workflow**
4. Choose `environment: production` → **Run workflow**

---

## Step 5: Clerk Auth (optional, for production sign-in)

If you want sign-in/sign-up in production:

1. **Convex Dashboard** → your project → Settings → Environment Variables
2. Add: `CLERK_JWT_ISSUER_DOMAIN` = `https://your-instance.clerk.accounts.dev` (from Clerk JWT template)
3. Edit `convex/auth.config.ts` – replace contents with:

```typescript
import type { AuthConfig } from "convex/server";

const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers: clerkDomain
    ? [{ domain: clerkDomain, applicationID: "convex" }]
    : [],
} satisfies AuthConfig;
```

4. Run: `npx convex deploy -y` (or push again to re-run the workflow)

5. **Vercel** (or your host) → Project → Settings → Environment Variables  
   Add: `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...` from Clerk

---

## Step 6: Seed production data (first deploy only)

```bash
# Ensure you're on prod deployment (CONVEX_DEPLOYMENT or deploy key)
npx convex run seedARM
```

---

## Verify

```bash
./scripts/verify-deploy.sh https://your-app.vercel.app
```
