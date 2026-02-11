/**
 * Analytics View
 * 
 * Main view for analytics dashboard.
 */

import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { Id } from "../convex/_generated/dataModel";

interface AnalyticsViewProps {
  tenantId: Id<"tenants">;
}

export function AnalyticsView({ tenantId }: AnalyticsViewProps) {
  return (
    <div className="p-6">
      <AnalyticsDashboard tenantId={tenantId} />
    </div>
  );
}
