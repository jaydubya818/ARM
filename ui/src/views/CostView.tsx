import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Shield, TrendingUp, Plus } from "lucide-react";
import { RecordCostModal } from "../components/RecordCostModal";

interface CostViewProps {
  tenantId: Id<"tenants">;
}

interface PolicyWithCost {
  _id: Id<"policyEnvelopes">;
  name: string;
  costLimits?: { dailyTokens?: number; monthlyCost?: number };
}

export function CostView({ tenantId }: CostViewProps) {
  const [showRecordModal, setShowRecordModal] = useState(false);
  const policies = useQuery(api.policyEnvelopes.list, { tenantId });
  const summary = useQuery(api.costLedger.getSummary, { tenantId, period: "month" });
  const recentEntries = useQuery(api.costLedger.list, {
    tenantId,
    limit: 20,
  });

  const withCostLimits = (policies ?? []).filter((p: PolicyWithCost) => {
    const cl = p.costLimits;
    return cl && (cl.dailyTokens ?? cl.monthlyCost) !== undefined;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-arm-text">Cost Management</h2>
          <p className="text-sm text-arm-textMuted">
            Policy cost limits and usage overview
          </p>
        </div>
        <button
          onClick={() => setShowRecordModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-arm-accent text-white rounded hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Record Cost
        </button>
      </div>
      {showRecordModal && (
        <RecordCostModal tenantId={tenantId} onClose={() => setShowRecordModal(false)} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-arm-accent" />
            <div>
              <h3 className="font-semibold text-arm-text">Policies with Cost Limits</h3>
              <p className="text-sm text-arm-textMuted">
                {withCostLimits.length} of {policies?.length ?? 0} policies
              </p>
            </div>
          </div>
          {withCostLimits.length === 0 ? (
            <p className="text-sm text-arm-textMuted">
              No policies have cost limits configured yet.
            </p>
          ) : (
            <div className="space-y-3">
              {withCostLimits.map((policy: PolicyWithCost) => (
                <div
                  key={policy._id}
                  className="p-3 bg-white border border-arm-border rounded-lg"
                >
                  <p className="font-medium text-arm-text">{policy.name}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    {(policy.costLimits as { dailyTokens?: number })?.dailyTokens && (
                      <span className="text-arm-textMuted">
                        Daily tokens: {(policy.costLimits as { dailyTokens: number }).dailyTokens.toLocaleString()}
                      </span>
                    )}
                    {(policy.costLimits as { monthlyCost?: number })?.monthlyCost !== undefined && (
                      <span className="text-arm-textMuted">
                        Monthly: ${(policy.costLimits as { monthlyCost: number }).monthlyCost}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-arm-accent" />
            <div>
              <h3 className="font-semibold text-arm-text">Usage (This Month)</h3>
              <p className="text-sm text-arm-textMuted">
                {summary
                  ? `${summary.totalTokens.toLocaleString()} tokens · $${summary.totalCost.toFixed(2)}`
                  : "Loading..."}
              </p>
            </div>
          </div>
          {recentEntries && recentEntries.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentEntries.slice(0, 5).map((e: { _id: Id<"costLedger">; source: string; tokensUsed: number; estimatedCost: number }) => (
                <div
                  key={e._id}
                  className="flex justify-between text-sm py-1 border-b border-arm-border last:border-0"
                >
                  <span className="text-arm-textMuted">{e.source}</span>
                  <span className="text-arm-text">
                    {e.tokensUsed.toLocaleString()} tok · ${e.estimatedCost.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-arm-textMuted">
              Usage is recorded when evaluations and policy checks run. Configure
              cost limits on policy envelopes to enforce budgets.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
