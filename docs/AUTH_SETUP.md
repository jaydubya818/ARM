# Authentication Setup (Clerk + Convex)

This guide enables sign-in/sign-up for the ARM platform using Clerk.

---

## Step 1: Create a Clerk Account

1. Go to [clerk.com/sign-up](https://clerk.com/sign-up)
2. Create an account and sign in
3. Create a new application (choose sign-in method: Email, Google, etc.)

---

## Step 2: Create JWT Template for Convex

1. In the [Clerk Dashboard](https://dashboard.clerk.com), go to **JWT Templates**
2. Click **New template**
3. Select **Convex** from the list
4. **Important:** Do NOT rename the template. It must be called `convex`
5. Copy the **Issuer** URL (e.g. `https://your-instance.clerk.accounts.dev`)

---

## Step 3: Configure Convex Backend

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project → **Settings** → **Environment Variables**
3. Add variable:
   - **Name:** `CLERK_JWT_ISSUER_DOMAIN`
   - **Value:** Your Clerk Issuer URL from Step 2
4. Save

---

## Step 4: Update auth.config.ts

After setting `CLERK_JWT_ISSUER_DOMAIN` in Convex Dashboard, edit `convex/auth.config.ts`:

Replace `providers: []` with:

```typescript
const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
// ...
providers: clerkDomain ? [{ domain: clerkDomain, applicationID: "convex" }] : [],
```

Then run `npx convex dev` or `npx convex deploy` to sync.

---

## Step 5: Configure Frontend

1. In Clerk Dashboard, go to **API Keys**
2. Copy the **Publishable Key** (starts with `pk_test_` for dev, `pk_live_` for prod)
3. Create or edit `ui/.env.local`:

```bash
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

4. Restart the dev server: `cd ui && pnpm dev`

---

## Step 6: Verify

1. Open the app in the browser
2. You should see the Login page with Sign In / Create Account buttons
3. Sign up or sign in
4. On first login, an operator record is created automatically in the first tenant

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authenticated" in Convex | Ensure `CLERK_JWT_ISSUER_DOMAIN` is set in Convex Dashboard and matches your Clerk instance |
| Login works but `getCurrentOperator` returns null | Run `npx convex dev` to push auth functions. Check that JWT template is named `convex` |
| App shows "Still loading" forever | Check browser console for errors. Verify `VITE_CLERK_PUBLISHABLE_KEY` is set |
| CORS errors | Clerk and Convex handle CORS; ensure you're not blocking cookies/third-party |

---

## Production

- Use `pk_live_...` for production Clerk keys
- Set `CLERK_JWT_ISSUER_DOMAIN` in Convex production deployment (Settings → switch to prod)
- Configure custom domain in Clerk for production (`clerk.your-domain.com`)
