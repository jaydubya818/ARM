import { useQuery, useMutation } from 'convex/react';
import { useState } from 'react';
import {
  Plus, ToggleLeft, ToggleRight, Trash2,
} from 'lucide-react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import type { Id, Doc } from 'agent-resources-platform/convex/_generated/dataModel';

interface FeatureFlagManagementProps {
  tenantId: Id<'tenants'>;
  currentOperatorId: Id<'operators'>;
}

export function FeatureFlagManagement({
  tenantId,
  currentOperatorId,
}: FeatureFlagManagementProps) {
  const flags = useQuery(api.featureFlags.list, { tenantId });
  const createFlag = useMutation(api.featureFlags.create);
  const updateFlag = useMutation(api.featureFlags.update);
  const removeFlag = useMutation(api.featureFlags.remove);

  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newRollout, setNewRollout] = useState(0);

  const handleCreate = async () => {
    if (!newKey.trim() || !newName.trim()) return;
    await createFlag({
      tenantId,
      key: newKey.trim(),
      name: newName.trim(),
      enabled: false,
      rolloutPercentage: newRollout,
      createdBy: currentOperatorId,
    });
    setNewKey('');
    setNewName('');
    setNewRollout(0);
    setShowForm(false);
  };

  const toggleEnabled = async (flagId: Id<'featureFlags'>, enabled: boolean) => {
    await updateFlag({ flagId, enabled });
  };

  const handleRemove = async (flagId: Id<'featureFlags'>) => {
    if (confirm('Remove this feature flag?')) await removeFlag({ flagId });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-arm-text">Feature Flags</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-arm-accent text-white rounded-lg hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Add Flag
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-arm-surface border border-arm-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-arm-text mb-1">
                Key
              </label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="new_feature"
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
                placeholder="New Feature"
                className="w-full px-3 py-2 border border-arm-border rounded-lg bg-arm-bg text-arm-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-arm-text mb-1">
                Rollout %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={newRollout}
                onChange={(e) => setNewRollout(Number(e.target.value))}
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
        {!flags ? (
          <div className="p-8 text-center text-arm-text-secondary">Loading…</div>
        ) : flags.length === 0 ? (
          <div className="p-8 text-center text-arm-text-secondary">
            No feature flags yet. Add one to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-arm-surfaceLight">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Key
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Rollout
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-arm-text">
                  Status
                </th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {flags.map((flag: Doc<'featureFlags'>) => (
                <tr
                  key={flag._id}
                  className="border-t border-arm-border hover:bg-arm-surface/50"
                >
                  <td className="px-4 py-3 font-mono text-sm text-arm-text">
                    {flag.key}
                  </td>
                  <td className="px-4 py-3 text-arm-text">{flag.name}</td>
                  <td className="px-4 py-3 text-arm-text">
                    {flag.rolloutPercentage}
                    %
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEnabled(flag._id, !flag.enabled)}
                      className="flex items-center gap-2"
                    >
                      {flag.enabled ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-green-500">On</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-arm-textMuted" />
                          <span className="text-sm text-arm-textMuted">Off</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemove(flag._id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
