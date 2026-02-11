/**
 * Evaluation Types
 *
 * Types for evaluation suites, test cases, and evaluation runs.
 */

import { Id } from './common';

/**
 * Scoring criteria types for test cases
 */
export type ScoringCriteriaType =
  | 'exact_match' // Output must exactly match expected
  | 'contains' // Output must contain expected substring
  | 'similarity' // Semantic similarity above threshold
  | 'custom'; // Custom scoring function

/**
 * Scoring criteria configuration
 */
export interface ScoringCriteria {
  type: ScoringCriteriaType;
  threshold?: number; // For similarity scoring (0-1)
  config?: any; // Custom config for scoring
}

/**
 * Individual test case within an evaluation suite
 */
export interface TestCase {
  id: string;
  name: string;
  description?: string;
  input: any; // Input to agent (prompt, context, etc.)
  expectedOutput: any; // Expected response
  scoringCriteria?: ScoringCriteria;
}

/**
 * Evaluation suite - collection of test cases
 */
export interface EvaluationSuite {
  _id: Id<'evaluationSuites'>;
  tenantId: Id<'tenants'>;
  name: string;
  description?: string;
  testCases: TestCase[];
  createdBy: Id<'operators'>;
  tags?: string[];
  _creationTime: number;
}

/**
 * Result of a single test case execution
 */
export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  score?: number; // 0-1 score for similarity/custom scoring
  output: any; // Actual output from agent
  error?: string; // Error message if execution failed
  executionTime?: number; // Milliseconds
}

/**
 * Evaluation run status
 */
export type EvaluationRunStatus =
  | 'PENDING' // Queued for execution
  | 'RUNNING' // Currently executing
  | 'COMPLETED' // Finished successfully
  | 'FAILED' // Execution failed
  | 'CANCELLED'; // Cancelled by user

/**
 * Evaluation run - execution of a suite against a version
 */
export interface EvaluationRun {
  _id: Id<'evaluationRuns'>;
  tenantId: Id<'tenants'>;
  suiteId: Id<'evaluationSuites'>;
  versionId: Id<'agentVersions'>;
  status: EvaluationRunStatus;
  previousEvalStatus?: 'NOT_RUN' | 'RUNNING' | 'PASS' | 'FAIL';
  results?: TestCaseResult[];
  overallScore?: number; // Average score across all test cases
  passRate?: number; // Fraction of tests passed (0-1)
  startedAt?: number;
  completedAt?: number;
  triggeredBy?: Id<'operators'>;
  _creationTime: number;
}

/**
 * Evaluation summary for display
 */
export interface EvaluationSummary {
  runId: Id<'evaluationRuns'>;
  suiteName: string;
  versionLabel: string;
  status: EvaluationRunStatus;
  passRate: number; // Fraction of tests passed (0-1)
  overallScore?: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration?: number; // Milliseconds
  completedAt?: number;
}

/**
 * Create evaluation suite arguments
 */
export interface CreateEvaluationSuiteArgs {
  tenantId: Id<'tenants'>;
  name: string;
  description?: string;
  testCases: TestCase[];
  createdBy: Id<'operators'>;
  tags?: string[];
}

/**
 * Create evaluation run arguments
 */
export interface CreateEvaluationRunArgs {
  tenantId: Id<'tenants'>;
  suiteId: Id<'evaluationSuites'>;
  versionId: Id<'agentVersions'>;
  triggeredBy?: Id<'operators'>;
}

/**
 * Update evaluation run arguments
 */
export interface UpdateEvaluationRunArgs {
  runId: Id<'evaluationRuns'>;
  status?: EvaluationRunStatus;
  results?: TestCaseResult[];
  overallScore?: number;
  passRate?: number;
  completedAt?: number;
}
