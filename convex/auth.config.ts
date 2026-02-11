import type { AuthConfig } from "convex/server";

/**
 * Clerk auth: Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard → Settings → Environment Variables.
 * With empty providers, ctx.auth.getUserIdentity() returns null (dev mode).
 * See docs/AUTH_SETUP.md for full setup.
 */
export default {
  providers: [],
} satisfies AuthConfig;
