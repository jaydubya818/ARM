import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import type { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { toast } from '../lib/toast';

interface CreateProviderModalProps {
  tenantId: Id<'tenants'>;
  onClose: () => void;
}

export function CreateProviderModal({ tenantId, onClose }: CreateProviderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProvider = useMutation(api.providers.create);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const type = (form.elements.namedItem('type') as HTMLSelectElement).value as 'local' | 'federated';
    const healthEndpoint = (form.elements.namedItem('healthEndpoint') as HTMLInputElement).value.trim() || undefined;
    const configStr = (form.elements.namedItem('federationConfig') as HTMLTextAreaElement).value.trim();

    let federationConfig: Record<string, unknown> | undefined;
    if (configStr) {
      try {
        federationConfig = JSON.parse(configStr) as Record<string, unknown>;
      } catch {
        toast.error('Invalid JSON in Federation Config');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await createProvider({
        tenantId,
        name,
        type,
        healthEndpoint,
        federationConfig,
      });
      toast.success('Provider created');
      onClose();
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-arm-text mb-4">Create Provider</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Name</label>
            <input
              name="name"
              required
              className="w-full px-3 py-2 border border-arm-border rounded"
              placeholder="e.g. production-agent-runtime"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Type</label>
            <select name="type" className="w-full px-3 py-2 border border-arm-border rounded">
              <option value="local">Local</option>
              <option value="federated">Federated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Health Endpoint (optional)</label>
            <input
              name="healthEndpoint"
              className="w-full px-3 py-2 border border-arm-border rounded"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Federation Config (JSON, optional)</label>
            <textarea
              name="federationConfig"
              rows={3}
              className="w-full px-3 py-2 border border-arm-border rounded font-mono text-sm"
              placeholder='{"endpoint": "https://...", "apiKey": "..."}'
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-arm-textMuted hover:text-arm-text">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-arm-accent text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
