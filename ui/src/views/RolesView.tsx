/**
 * Roles View
 * 
 * Main view for role management.
 */

import { RoleManagement } from "../components/RoleManagement";
import { Id } from "../convex/_generated/dataModel";

interface RolesViewProps {
  tenantId: Id<"tenants">;
  currentOperatorId: Id<"operators">;
}

export function RolesView({ tenantId, currentOperatorId }: RolesViewProps) {
  return (
    <div className="p-6">
      <RoleManagement tenantId={tenantId} currentOperatorId={currentOperatorId} />
    </div>
  );
}
