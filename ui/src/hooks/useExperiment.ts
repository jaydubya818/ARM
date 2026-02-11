import { useQuery, useMutation } from 'convex/react';
import { useState, useEffect, useRef } from 'react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import type { Id } from 'agent-resources-platform/convex/_generated/dataModel';

/**
 * Get assigned variant for an experiment
 */
export function useExperiment(
  experimentId: Id<'experiments'> | undefined,
  operatorId: Id<'operators'> | undefined,
) {
  const variant = useQuery(
    api.experiments.getVariant,
    experimentId && operatorId
      ? { experimentId, operatorId }
      : 'skip',
  );

  const assignVariant = useMutation(api.experiments.assignVariant);
  const [assignedVariant, setAssignedVariant] = useState<string | null>(null);
  const assignedRef = useRef(false);

  useEffect(() => {
    if (
      variant !== null
      || !experimentId
      || !operatorId
      || assignedRef.current
    ) {
      return;
    }
    assignedRef.current = true;
    assignVariant({ experimentId, operatorId })
      .then((v) => {
        if (v) setAssignedVariant(v);
      })
      .finally(() => {
        assignedRef.current = false;
      });
  }, [variant, experimentId, operatorId, assignVariant]);

  const finalVariant = variant ?? assignedVariant;

  return {
    variantId: finalVariant,
    loading: variant === undefined && !assignedVariant,
    isControl: finalVariant === 'control',
  };
}

/**
 * Track experiment event
 */
export function useTrackExperimentEvent() {
  return useMutation(api.experiments.trackEvent);
}
