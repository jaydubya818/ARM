import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id, Doc } from "../convex/_generated/dataModel";
import { useState } from "react";
import { Play, Plus } from "lucide-react";

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
  const createExperiment = useMutation(api.experiments.create);

  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [controlName, setControlName] = useState("Control");
  const [variantName, setVariantName] = useState("Variant A");

  const handleCreate = async () => {
    if (!newKey.trim() || !newName.trim()) return;
    await createExperiment({
      tenantId,
      key: newKey.trim(),
      name: newName.trim(),
      variants: [
        { id: "control", name: controlName, weight: 50 },
        { id: "variant_a", name: variantName, weight: 50 },
      ],
      createdBy: currentOperatorId,
    });
    setNewKey("");
    setNewName("");
    setControlName("Control");
    setVariantName("Variant A");
    setShowForm(false);
  };

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
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-arm-accent text-white rounded-lg hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Create Experiment
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-arm-surface border border-arm-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-arm-text mb-1">
                Key
              </label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="homepage_cta_test"
                className="w-full px-3 py-2 border border-arm-border rounded-lg bg-arm-bg text-arm-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-arm-text mb-1">
                Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Homepage CTA Test"
                className="w-full px-3 py-2 border border-arm-border rounded-lg bg-arm-bg text-arm-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-arm-text mb-1">
                Control variant name
              </label>
              <input
                value={controlName}
                onChange={(e) => setControlName(e.target.value)}
                className="w-full px-3 py-2 border border-arm-border rounded-lg bg-arm-bg text-arm-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-arm-text mb-1">
                Variant A name
              </label>
              <input
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                className="w-full px-3 py-2 border border-arm-border rounded-lg bg-arm-bg text-arm-text"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-arm-accent text-white rounded-lg"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-arm-border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border border-arm-border rounded-lg overflow-hidden">
        {!experiments ? (
          <div className="p-8 text-center text-arm-text-secondary">
            Loading…
          </div>
        ) : experiments.length === 0 ? (
          <div className="p-8 text-center text-arm-text-secondary">
            No experiments yet. Click &quot;Create Experiment&quot; to add one.
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
              {experiments.map((exp: Doc<"experiments">) => (
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
                    {exp.variants.map((v: { name: string; weight: number }) => `${v.name} (${v.weight}%)`).join(", ")}
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
