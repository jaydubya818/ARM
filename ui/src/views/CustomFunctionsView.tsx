/**
 * Custom Functions View
 *
 * Main view for custom scoring function editor.
 */

import { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { CustomFunctionEditor } from '../components/CustomFunctionEditor';

interface CustomFunctionsViewProps {
  tenantId: Id<'tenants'>;
  currentOperatorId: Id<'operators'>;
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
