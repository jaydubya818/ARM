/**
 * Roles View
 *
 * Main view for role management.
 */

import { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { RoleManagement } from '../components/RoleManagement';

interface RolesViewProps {
  tenantId: Id<'tenants'>;
  currentOperatorId: Id<'operators'>;
}

export function RolesView({ tenantId, currentOperatorId }: RolesViewProps) {
  return (
    <div className="p-6">
      <RoleManagement tenantId={tenantId} currentOperatorId={currentOperatorId} />
    </div>
  );
}
