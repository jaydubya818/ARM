import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Globe, Server, Activity, Plus, Trash2 } from "lucide-react";
import type { Doc } from "../convex/_generated/dataModel";
import { CreateProviderModal } from "../components/CreateProviderModal";
import { toast } from "../lib/toast";

interface FederationViewProps {
  tenantId: Id<"tenants">;
}

export function FederationView({ tenantId }: FederationViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const providers = useQuery(api.providers.list, { tenantId });
  const removeProvider = useMutation(api.providers.remove);

  const handleRemove = async (id: Id<"providers">, name: string) => {
    if (!window.confirm(`Remove provider "${name}"?`)) return;
    try {
      await removeProvider({ id });
      toast.success("Provider removed");
    } catch {
      toast.error("Failed to remove provider");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-arm-text">Federation</h2>
          <p className="text-sm text-arm-textMuted">
            Multi-provider and federated agent providers
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-arm-accent text-white rounded hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>
      {showCreate && (
        <CreateProviderModal tenantId={tenantId} onClose={() => setShowCreate(false)} />
      )}

      {!providers || providers.length === 0 ? (
        <div className="bg-arm-surface border border-arm-border rounded-lg p-8 text-center">
          <Globe className="w-12 h-12 mx-auto text-arm-textMuted mb-3" />
          <p className="text-arm-text font-medium mb-1">No providers configured</p>
          <p className="text-sm text-arm-textMuted">
            Providers are created when you set up agent instances. Add a
            federated provider to connect to external agent runtimes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider: Doc<"providers">) => (
            <div
              key={provider._id}
              className="bg-arm-surface border border-arm-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {provider.type === "federated" ? (
                    <Globe className="w-8 h-8 text-arm-accent" />
                  ) : (
                    <Server className="w-8 h-8 text-arm-textMuted" />
                  )}
                  <div>
                    <h3 className="font-semibold text-arm-text">
                      {provider.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        provider.type === "federated"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {provider.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {provider.healthEndpoint && (
                    <span className="flex items-center gap-1 text-sm text-arm-textMuted">
                      <Activity className="w-4 h-4" />
                      Health: {provider.healthEndpoint}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(provider._id, provider.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Remove provider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {provider.federationConfig &&
                Object.keys(provider.federationConfig).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-arm-border">
                    <h4 className="text-sm font-medium text-arm-text mb-2">
                      Federation Config
                    </h4>
                    <pre className="text-xs bg-white border border-arm-border rounded p-3 overflow-x-auto text-arm-textMuted">
                      {JSON.stringify(provider.federationConfig, null, 2)}
                    </pre>
                  </div>
                )}
              {provider.metadata &&
                Object.keys(provider.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-arm-border">
                    <h4 className="text-sm font-medium text-arm-text mb-2">
                      Metadata
                    </h4>
                    <pre className="text-xs bg-white border border-arm-border rounded p-3 overflow-x-auto text-arm-textMuted">
                      {JSON.stringify(provider.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
