import type { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { ExperimentsManagement } from '../components/ExperimentsManagement';

interface ExperimentsViewProps {
  tenantId: Id<'tenants'>;
  currentOperatorId: Id<'operators'>;
}

export function ExperimentsView({
  tenantId,
  currentOperatorId,
}: ExperimentsViewProps) {
  return (
    <div className="p-6">
      <ExperimentsManagement
        tenantId={tenantId}
        currentOperatorId={currentOperatorId}
      />
    </div>
  );
}
