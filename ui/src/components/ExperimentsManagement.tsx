import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Play } from "lucide-react";

interface ExperimentsManagementProps {
  tenantId: Id<"tenants">;
  currentOperatorId: Id<"operators">;
}

export function ExperimentsManagement({
  tenantId,
  currentOperatorId,
}: ExperimentsManagementProps) {
  const experiments = useQuery(api.experiments.list, { tenantId });
  const startExperiment = useMutation(api.experiments.start);

  const handleStart = async (experimentId: Id<"experiments">) => {
    await startExperiment({ experimentId });
  };

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-500",
    RUNNING: "bg-green-500",
    PAUSED: "bg-yellow-500",
    COMPLETED: "bg-blue-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-arm-text">A/B Experiments</h2>
      </div>

      <div className="border border-arm-border rounded-lg overflow-hidden">
        {!experiments ? (
          <div className="p-8 text-center text-arm-text-secondary">
            Loading…
          </div>
        ) : experiments.length === 0 ? (
          <div className="p-8 text-center text-arm-text-secondary">
            No experiments yet. Create experiments via the Convex dashboard or
            add a create flow here.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-arm-surfaceLight">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Key
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Variants
                </th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((exp) => (
                <tr
                  key={exp._id}
                  className="border-t border-arm-border hover:bg-arm-surface/50"
                >
                  <td className="px-4 py-3 text-arm-text font-medium">
                    {exp.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-arm-textMuted">
                    {exp.key}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs text-white ${
                        statusColor[exp.status] ?? "bg-gray-500"
                      }`}
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-arm-text">
                    {exp.variants.map((v) => `${v.name} (${v.weight}%)`).join(", ")}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {exp.status === "DRAFT" && (
                      <button
                        onClick={() => handleStart(exp._id)}
                        className="flex items-center gap-1 px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-500"
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
