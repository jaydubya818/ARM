import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id, Doc } from "../convex/_generated/dataModel";
import { toast } from "../lib/toast";

interface CreateInstanceModalProps {
  tenantId: Id<"tenants">;
  onClose: () => void;
}

export function CreateInstanceModal({ tenantId, onClose }: CreateInstanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const versions = useQuery(api.agentVersions.list, { tenantId });
  const environments = useQuery(api.environments.list, { tenantId });
  const providers = useQuery(api.providers.list, { tenantId });
  const createInstance = useMutation(api.agentInstances.create);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const versionId = (form.elements.namedItem("versionId") as HTMLSelectElement).value as Id<"agentVersions">;
    const environmentId = (form.elements.namedItem("environmentId") as HTMLSelectElement).value as Id<"environments">;
    const providerId = (form.elements.namedItem("providerId") as HTMLSelectElement).value as Id<"providers">;

    if (!versionId || !environmentId || !providerId) {
      toast.error("Please select version, environment, and provider");
      setIsSubmitting(false);
      return;
    }

    try {
      await createInstance({
        tenantId,
        versionId,
        environmentId,
        providerId,
      });
      toast.success("Instance created (PROVISIONING)");
      onClose();
    } catch (err) {
      toast.error("Error: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-arm-text mb-4">Create Instance</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Version</label>
            <select
              name="versionId"
              required
              className="w-full px-3 py-2 border border-arm-border rounded"
            >
              <option value="">Select version</option>
              {(versions ?? []).map((v: Doc<"agentVersions">) => (
                <option key={v._id} value={v._id}>
                  {v.versionLabel} {v.lifecycleState !== "APPROVED" ? `(${v.lifecycleState})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Environment</label>
            <select
              name="environmentId"
              required
              className="w-full px-3 py-2 border border-arm-border rounded"
            >
              <option value="">Select environment</option>
              {(environments ?? []).map((e: Doc<"environments">) => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Provider</label>
            <select
              name="providerId"
              required
              className="w-full px-3 py-2 border border-arm-border rounded"
            >
              <option value="">Select provider</option>
              {(providers ?? []).map((p: Doc<"providers">) => (
                <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-arm-textMuted hover:text-arm-text">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !versions?.length || !environments?.length || !providers?.length}
              className="px-4 py-2 bg-arm-accent text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
