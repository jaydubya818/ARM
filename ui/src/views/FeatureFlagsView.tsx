import { FeatureFlagManagement } from "../components/FeatureFlagManagement";
import type { Id } from "../convex/_generated/dataModel";

interface FeatureFlagsViewProps {
  tenantId: Id<"tenants">;
  currentOperatorId: Id<"operators">;
}

export function FeatureFlagsView({
  tenantId,
  currentOperatorId,
}: FeatureFlagsViewProps) {
  return (
    <div className="p-6">
      <FeatureFlagManagement
        tenantId={tenantId}
        currentOperatorId={currentOperatorId}
      />
    </div>
  );
}
