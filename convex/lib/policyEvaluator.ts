/**
 * Policy Evaluation Engine
 *
 * Evaluates tool calls and actions against policy envelopes to determine
 * if they should be ALLOWED, DENIED, or require APPROVAL.
 */

export type PolicyDecision = 'ALLOW' | 'DENY' | 'NEEDS_APPROVAL';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PolicyEvaluationRequest {
  toolId: string;
  toolParams?: any;
  estimatedCost?: number;
  dailyTokensUsed?: number;
  monthlyCostUsed?: number;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reason: string;
  riskLevel: RiskLevel;
  violations: string[];
}

export interface PolicyEnvelope {
  autonomyTier: number;
  allowedTools: string[];
  costLimits?: {
    dailyTokens?: number;
    monthlyCost?: number;
  };
}

/**
 * Policy Evaluation Engine
 *
 * Evaluates tool calls and actions against policy envelopes to determine
 * if they should be ALLOWED, DENIED, or require APPROVAL.
 */

export type PolicyDecision = 'ALLOW' | 'DENY' | 'NEEDS_APPROVAL';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PolicyEvaluationRequest {
  toolId: string;
  toolParams?: any;
  estimatedCost?: number;
  dailyTokensUsed?: number;
  monthlyCostUsed?: number;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reason: string;
  riskLevel: RiskLevel;
  violations: string[];
}

export interface PolicyEnvelope {
  autonomyTier: number;
  allowedTools: string[];
  costLimits?: {
    dailyTokens?: number;
    monthlyCost?: number;
  };
}

/**
 * Classify risk level based on tool and parameters
 */
function classifyRisk(toolId: string, toolParams?: any): RiskLevel {
  // Critical risk tools (require highest autonomy)
  const criticalTools = [
    'database_write',
    'database_delete',
    'file_delete',
    'system_command',
    'payment_process',
    'user_delete',
  ];

  if (criticalTools.some((tool) => toolId.includes(tool))) {
    return 'critical';
  }

  // High risk tools (write operations, external APIs)
  const highRiskTools = [
    'database_update',
    'file_write',
    'email_send',
    'slack_post',
    'api_post',
    'api_put',
    'api_delete',
  ];

  if (highRiskTools.some((tool) => toolId.includes(tool))) {
    return 'high';
  }

  // Medium risk tools (read operations with sensitive data)
  const mediumRiskTools = [
    'database_read',
    'file_read',
    'user_info',
    'api_get',
  ];

  if (mediumRiskTools.some((tool) => toolId.includes(tool))) {
    return 'medium';
  }

  // Low risk tools (search, lookup, non-sensitive reads)
  return 'low';
}

/**
 * Determine if approval is required based on autonomy tier and risk level
 *
 * Autonomy Tiers:
 * 0 - No autonomy (all actions require approval)
 * 1 - Minimal autonomy (critical/high risk require approval)
 * 2 - Low autonomy (critical risk requires approval)
 * 3 - Medium autonomy (no approval required for standard operations)
 * 4 - High autonomy (all operations allowed)
 * 5 - Full autonomy (all operations allowed, no restrictions)
 */
function shouldRequireApproval(
  autonomyTier: number,
  riskLevel: RiskLevel,
): boolean {
  switch (autonomyTier) {
    case 0:
      // No autonomy - everything requires approval
      return true;

    case 1:
      // Minimal autonomy - critical and high risk require approval
      return riskLevel === 'critical' || riskLevel === 'high';

    case 2:
      // Low autonomy - only critical requires approval
      return riskLevel === 'critical';

    case 3:
    case 4:
    case 5:
      // Medium to full autonomy - no approval required
      return false;

    default:
      // Unknown tier - default to requiring approval
      return true;
  }
}

/**
 * Evaluate a tool call against a policy envelope
 */
export function evaluatePolicy(
  request: PolicyEvaluationRequest,
  policy: PolicyEnvelope,
): PolicyEvaluationResult {
  const violations: string[] = [];
  let riskLevel: RiskLevel = 'low';

  // 1. Check if tool is in allowed list
  if (!policy.allowedTools.includes(request.toolId)) {
    violations.push(`Tool '${request.toolId}' not in allowed tools list`);
    riskLevel = 'high';

    return {
      decision: 'DENY',
      reason: `Tool '${request.toolId}' is not allowed by policy`,
      riskLevel,
      violations,
    };
  }

  // 2. Check cost limits
  if (policy.costLimits) {
    // Daily token limit
    if (
      policy.costLimits.dailyTokens !== undefined
      && request.dailyTokensUsed !== undefined
      && request.estimatedCost !== undefined
    ) {
      const projectedTokens = request.dailyTokensUsed + request.estimatedCost;
      if (projectedTokens > policy.costLimits.dailyTokens) {
        violations.push(
          `Daily token limit exceeded: ${projectedTokens} > ${policy.costLimits.dailyTokens}`,
        );
        riskLevel = 'medium';

        return {
          decision: 'DENY',
          reason: 'Daily token limit would be exceeded',
          riskLevel,
          violations,
        };
      }
    }

    // Monthly cost limit
    if (
      policy.costLimits.monthlyCost !== undefined
      && request.monthlyCostUsed !== undefined
      && request.estimatedCost !== undefined
    ) {
      const projectedCost = request.monthlyCostUsed + request.estimatedCost;
      if (projectedCost > policy.costLimits.monthlyCost) {
        violations.push(
          `Monthly cost limit exceeded: ${projectedCost} > ${policy.costLimits.monthlyCost}`,
        );
        riskLevel = 'medium';

        return {
          decision: 'DENY',
          reason: 'Monthly cost limit would be exceeded',
          riskLevel,
          violations,
        };
      }
    }
  }

  // 3. Classify risk based on tool and params
  riskLevel = classifyRisk(request.toolId, request.toolParams);

  // 4. Determine if approval needed based on autonomy tier and risk
  const needsApproval = shouldRequireApproval(policy.autonomyTier, riskLevel);

  if (needsApproval) {
    return {
      decision: 'NEEDS_APPROVAL',
      reason: `Autonomy tier ${policy.autonomyTier} requires approval for ${riskLevel} risk actions`,
      riskLevel,
      violations: [],
    };
  }

  // 5. Allow if all checks pass
  return {
    decision: 'ALLOW',
    reason: 'All policy checks passed',
    riskLevel,
    violations: [],
  };
}

/**
 * Batch evaluate multiple tool calls
 */
export function evaluatePolicyBatch(
  requests: PolicyEvaluationRequest[],
  policy: PolicyEnvelope,
): PolicyEvaluationResult[] {
  return requests.map((request) => evaluatePolicy(request, policy));
}

/**
 * Check if any evaluation results require approval
 */
export function requiresApproval(results: PolicyEvaluationResult[]): boolean {
  return results.some((result) => result.decision === 'NEEDS_APPROVAL');
}

/**
 * Check if any evaluation results are denied
 */
export function hasDenials(results: PolicyEvaluationResult[]): boolean {
  return results.some((result) => result.decision === 'DENY');
}

/**
 * Get all violations from evaluation results
 */
export function getAllViolations(results: PolicyEvaluationResult[]): string[] {
  return results.flatMap((result) => result.violations);
}
