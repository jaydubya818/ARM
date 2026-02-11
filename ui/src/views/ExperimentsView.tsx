import { ExperimentsManagement } from "../components/ExperimentsManagement";
import type { Id } from "../convex/_generated/dataModel";

interface ExperimentsViewProps {
  tenantId: Id<"tenants">;
  currentOperatorId: Id<"operators">;
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
