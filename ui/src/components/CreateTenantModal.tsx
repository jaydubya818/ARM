import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import { toast } from '../lib/toast';

interface CreateTenantModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTenantModal({ onClose, onSuccess }: CreateTenantModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const createTenant = useMutation(api.tenants.create);

  const handleSlugFromName = () => {
    if (name && !slug) {
      setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    try {
      await createTenant({ name: name.trim(), slug: slug.trim() });
      toast.success('Tenant created');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(`Failed to create tenant: ${(err as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-arm-text mb-4">Create Tenant</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSlugFromName}
              placeholder="Acme Corp"
              className="w-full px-3 py-2 border border-arm-border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme-corp"
              className="w-full px-3 py-2 border border-arm-border rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-arm-textMuted hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-arm-accent text-white rounded-lg hover:opacity-90">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
