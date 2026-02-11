import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/**
 * Check if a single feature flag is enabled
 */
export function useFeatureFlag(
  tenantId: Id<"tenants"> | undefined,
  flagKey: string,
  operatorId?: Id<"operators">
) {
  const enabled = useQuery(
    api.featureFlags.isEnabled,
    tenantId && flagKey
      ? {
          tenantId,
          flagKey,
          operatorId,
          environment: import.meta.env.MODE,
        }
      : "skip"
  );

  return {
    enabled: enabled ?? false,
    loading: enabled === undefined,
  };
}

/**
 * Get all feature flags for current operator (batch)
 */
export function useFeatureFlags(
  tenantId: Id<"tenants"> | undefined,
  operatorId?: Id<"operators">
) {
  const flags = useQuery(
    api.featureFlags.getFlagsForOperator,
    tenantId
      ? {
          tenantId,
          operatorId,
          environment: import.meta.env.MODE,
        }
      : "skip"
  );

  return {
    flags: flags ?? {},
    loading: flags === undefined,
    isEnabled: (key: string) => flags?.[key] ?? false,
  };
}
