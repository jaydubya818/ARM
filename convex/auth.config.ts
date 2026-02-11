import type { AuthConfig } from "convex/server";

/**
 * Convex Auth Configuration for Clerk
 *
 * To enable Clerk: Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard, then replace
 * the providers array with: clerkDomain ? [{ domain: clerkDomain, applicationID: "convex" }] : []
 * where clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN
 *
 * With empty providers, ctx.auth.getUserIdentity() returns null (dev mode).
 * See docs/AUTH_SETUP.md for full setup.
 */
export default {
  providers: [],
} satisfies AuthConfig;
