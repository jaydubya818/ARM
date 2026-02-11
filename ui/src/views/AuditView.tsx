/**
 * Audit View
 *
 * Main view for audit log viewer.
 */

import { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { AuditLogViewer } from '../components/AuditLogViewer';

interface AuditViewProps {
  tenantId: Id<'tenants'>;
}

export function AuditView({ tenantId }: AuditViewProps) {
  return (
    <div className="p-6">
      <AuditLogViewer tenantId={tenantId} />
    </div>
  );
}
