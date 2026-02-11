/**
 * Audit View
 * 
 * Main view for audit log viewer.
 */

import { AuditLogViewer } from "../components/AuditLogViewer";
import { Id } from "../convex/_generated/dataModel";

interface AuditViewProps {
  tenantId: Id<"tenants">;
}

export function AuditView({ tenantId }: AuditViewProps) {
  return (
    <div className="p-6">
      <AuditLogViewer tenantId={tenantId} />
    </div>
  );
}
