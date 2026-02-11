import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import type { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { toast } from '../lib/toast';

interface RecordCostModalProps {
  tenantId: Id<'tenants'>;
  onClose: () => void;
}

export function RecordCostModal({ tenantId, onClose }: RecordCostModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recordCost = useMutation(api.costLedger.record);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const tokensUsed = Number((form.elements.namedItem('tokensUsed') as HTMLInputElement).value) || 0;
    const estimatedCost = Number((form.elements.namedItem('estimatedCost') as HTMLInputElement).value) || 0;
    const source = (form.elements.namedItem('source') as HTMLInputElement).value.trim() || 'manual';

    if (tokensUsed < 0 || estimatedCost < 0) {
      toast.error('Values must be non-negative');
      setIsSubmitting(false);
      return;
    }

    try {
      await recordCost({
        tenantId,
        tokensUsed,
        estimatedCost,
        source,
      });
      toast.success('Cost recorded');
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
        <h2 className="text-xl font-bold text-arm-text mb-4">Record Cost</h2>
        <p className="text-sm text-arm-textMuted mb-4">
          Manually record token usage and cost. External inference services can call
          {' '}
          <code className="text-xs bg-arm-surface px-1 rounded">costLedger.record</code>
          {' '}
          via Convex client.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Tokens Used</label>
            <input
              name="tokensUsed"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              className="w-full px-3 py-2 border border-arm-border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Estimated Cost ($)</label>
            <input
              name="estimatedCost"
              type="number"
              min="0"
              step="0.0001"
              defaultValue="0"
              className="w-full px-3 py-2 border border-arm-border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-arm-text mb-1">Source</label>
            <input
              name="source"
              className="w-full px-3 py-2 border border-arm-border rounded"
              placeholder="manual, inference, evaluation..."
              defaultValue="manual"
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
              {isSubmitting ? 'Recording...' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
