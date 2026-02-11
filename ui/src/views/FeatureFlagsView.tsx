import type { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { FeatureFlagManagement } from '../components/FeatureFlagManagement';

interface FeatureFlagsViewProps {
  tenantId: Id<'tenants'>;
  currentOperatorId: Id<'operators'>;
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
