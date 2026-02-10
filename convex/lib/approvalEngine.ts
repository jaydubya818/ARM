/**
 * Approval Workflow Engine
 * 
 * Determines when approvals are required and manages approval workflows.
 */

export type ApprovalRequirement = {
  required: boolean;
  reason?: string;
  requestType?: string;
};

/**
 * Check if a version transition requires approval
 */
export function requiresVersionTransitionApproval(
  fromState: string,
  toState: string,
  autonomyTier: number,
  evalStatus: string
): ApprovalRequirement {
  // CANDIDATE → APPROVED always requires approval for low autonomy
  if (fromState === "CANDIDATE" && toState === "APPROVED") {
    if (autonomyTier < 3) {
      return {
        required: true,
        reason: `Autonomy tier ${autonomyTier} requires approval for production promotion`,
        requestType: "VERSION_PROMOTION",
      };
    }
  }

  // Cannot transition to CANDIDATE without passing evaluation
  if (toState === "CANDIDATE" && evalStatus !== "PASS") {
    return {
      required: false, // Not approval needed, just blocked
      reason: "Evaluation must pass before promoting to CANDIDATE",
    };
  }

  // TESTING → CANDIDATE requires approval for tier 0-1
  if (fromState === "TESTING" && toState === "CANDIDATE") {
    if (autonomyTier < 2) {
      return {
        required: true,
        reason: `Autonomy tier ${autonomyTier} requires approval for candidate promotion`,
        requestType: "VERSION_PROMOTION",
      };
    }
  }

  // No approval required
  return {
    required: false,
  };
}

/**
 * Check if an instance state transition requires approval
 */
export function requiresInstanceTransitionApproval(
  fromState: string,
  toState: string,
  autonomyTier: number
): ApprovalRequirement {
  // QUARANTINED → ACTIVE requires approval (security concern)
  if (fromState === "QUARANTINED" && toState === "ACTIVE") {
    return {
      required: true,
      reason: "Reactivating quarantined instance requires approval",
      requestType: "INSTANCE_REACTIVATION",
    };
  }

  // ACTIVE → QUARANTINED requires approval for high autonomy (unusual)
  if (fromState === "ACTIVE" && toState === "QUARANTINED" && autonomyTier >= 4) {
    return {
      required: true,
      reason: "Quarantining high-autonomy instance requires approval",
      requestType: "INSTANCE_QUARANTINE",
    };
  }

  // No approval required
  return {
    required: false,
  };
}

/**
 * Check if a policy change requires approval
 */
export function requiresPolicyChangeApproval(
  currentAutonomyTier: number,
  newAutonomyTier: number
): ApprovalRequirement {
  // Increasing autonomy tier requires approval
  if (newAutonomyTier > currentAutonomyTier) {
    return {
      required: true,
      reason: `Increasing autonomy from tier ${currentAutonomyTier} to ${newAutonomyTier} requires approval`,
      requestType: "POLICY_AUTONOMY_INCREASE",
    };
  }

  // No approval required for decreasing autonomy
  return {
    required: false,
  };
}

/**
 * Check if a high-risk tool execution requires approval
 */
export function requiresToolExecutionApproval(
  toolId: string,
  riskLevel: string,
  autonomyTier: number
): ApprovalRequirement {
  // Critical risk always requires approval for tier < 3
  if (riskLevel === "critical" && autonomyTier < 3) {
    return {
      required: true,
      reason: `Critical risk tool '${toolId}' requires approval for autonomy tier ${autonomyTier}`,
      requestType: "TOOL_EXECUTION",
    };
  }

  // High risk requires approval for tier < 2
  if (riskLevel === "high" && autonomyTier < 2) {
    return {
      required: true,
      reason: `High risk tool '${toolId}' requires approval for autonomy tier ${autonomyTier}`,
      requestType: "TOOL_EXECUTION",
    };
  }

  // No approval required
  return {
    required: false,
  };
}

/**
 * Validate state transition is allowed
 */
export function validateVersionTransition(
  fromState: string,
  toState: string,
  evalStatus: string
): { valid: boolean; error?: string } {
  // Define allowed transitions
  const transitions: Record<string, string[]> = {
    DRAFT: ["TESTING"],
    TESTING: ["CANDIDATE", "DRAFT"],
    CANDIDATE: ["APPROVED", "DRAFT"],
    APPROVED: ["DEPRECATED"],
    DEPRECATED: ["RETIRED"],
    RETIRED: [], // Terminal state
  };

  // Check if transition is allowed
  const allowedNextStates = transitions[fromState] || [];
  if (!allowedNextStates.includes(toState)) {
    return {
      valid: false,
      error: `Cannot transition from ${fromState} to ${toState}. Allowed: ${allowedNextStates.join(", ") || "none"}`,
    };
  }

  // Additional guard: TESTING → CANDIDATE requires PASS
  if (fromState === "TESTING" && toState === "CANDIDATE" && evalStatus !== "PASS") {
    return {
      valid: false,
      error: "Cannot promote to CANDIDATE without passing evaluation",
    };
  }

  return { valid: true };
}

/**
 * Validate instance transition is allowed
 */
export function validateInstanceTransition(
  fromState: string,
  toState: string
): { valid: boolean; error?: string } {
  // Define allowed transitions
  const transitions: Record<string, string[]> = {
    PROVISIONING: ["ACTIVE", "RETIRED"],
    ACTIVE: ["PAUSED", "READONLY", "DRAINING", "QUARANTINED", "RETIRED"],
    PAUSED: ["ACTIVE", "RETIRED"],
    READONLY: ["ACTIVE", "RETIRED"],
    DRAINING: ["RETIRED"],
    QUARANTINED: ["ACTIVE", "RETIRED"],
    RETIRED: [], // Terminal state
  };

  const allowedNextStates = transitions[fromState] || [];
  if (!allowedNextStates.includes(toState)) {
    return {
      valid: false,
      error: `Cannot transition from ${fromState} to ${toState}. Allowed: ${allowedNextStates.join(", ") || "none"}`,
    };
  }

  return { valid: true };
}

/**
 * Get approval timeout in milliseconds (future feature)
 */
export function getApprovalTimeout(requestType: string): number {
  // Default: 24 hours
  const defaultTimeout = 24 * 60 * 60 * 1000;

  // Request-specific timeouts
  const timeouts: Record<string, number> = {
    VERSION_PROMOTION: 48 * 60 * 60 * 1000, // 48 hours
    INSTANCE_REACTIVATION: 12 * 60 * 60 * 1000, // 12 hours
    INSTANCE_QUARANTINE: 2 * 60 * 60 * 1000, // 2 hours
    TOOL_EXECUTION: 1 * 60 * 60 * 1000, // 1 hour
    POLICY_AUTONOMY_INCREASE: 72 * 60 * 60 * 1000, // 72 hours
  };

  return timeouts[requestType] || defaultTimeout;
}

/**
 * Check if approval has timed out (future feature)
 */
export function isApprovalTimedOut(
  createdAt: number,
  requestType: string
): boolean {
  const timeout = getApprovalTimeout(requestType);
  const now = Date.now();
  return now - createdAt > timeout;
}
