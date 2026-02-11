/**
 * Provider Health Check
 * Fetches health endpoint and returns status
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

export const checkProviderHealth = action({
  args: {
    healthEndpoint: v.string(),
  },
  handler: async (_, args) => {
    try {
      const res = await fetch(args.healthEndpoint, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return {
        status: res.ok ? "healthy" : "unhealthy",
        statusCode: res.status,
      };
    } catch (err) {
      return {
        status: "unreachable",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
