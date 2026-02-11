/**
 * Analytics View
 *
 * Main view for analytics dashboard.
 */

import { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

interface AnalyticsViewProps {
  tenantId: Id<'tenants'>;
}

export function AnalyticsView({ tenantId }: AnalyticsViewProps) {
  return (
    <div className="p-6">
      <AnalyticsDashboard tenantId={tenantId} />
    </div>
  );
}
