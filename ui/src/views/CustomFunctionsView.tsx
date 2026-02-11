/**
 * Custom Functions View
 * 
 * Main view for custom scoring function editor.
 */

import { CustomFunctionEditor } from "../components/CustomFunctionEditor";
import { Id } from "../convex/_generated/dataModel";

interface CustomFunctionsViewProps {
  tenantId: Id<"tenants">;
  currentOperatorId: Id<"operators">;
}

export function CustomFunctionsView({
  tenantId,
  currentOperatorId,
}: CustomFunctionsViewProps) {
  return (
    <div className="p-6">
      <CustomFunctionEditor
        tenantId={tenantId}
        currentOperatorId={currentOperatorId}
      />
    </div>
  );
}
