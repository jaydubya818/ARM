/**
 * Evaluation Runner
 *
 * Logic for executing test cases and scoring results.
 *
 * Note: This is a stub implementation for P2.0.
 * In production, this would integrate with actual agent execution infrastructure.
 */

import { Id } from '../_generated/dataModel';

/**
 * Test case from evaluation suite
 */
interface TestCase {
  id: string;
  name: string;
  description?: string;
  input: any;
  expectedOutput: any;
  scoringCriteria?: {
    type: 'exact_match' | 'contains' | 'similarity' | 'custom';
    threshold?: number;
    config?: any;
  };
}

/**
 * Result of executing a single test case
 */
export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  score?: number;
  output: any;
  error?: string;
  executionTime?: number;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1, // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate Levenshtein similarity (0-1)
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1.0;

  return 1 - (distance / maxLength);
}

/**
 * Exact match scoring
 */
function scoreExactMatch(
  actual: any,
  expected: any,
): { passed: boolean; score?: number } {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  const passed = actualStr === expectedStr;

  return { passed, score: passed ? 1.0 : 0.0 };
}

/**
 * Contains scoring (for string outputs)
 */
function scoreContains(
  actual: any,
  expected: any,
): { passed: boolean; score?: number } {
  const actualStr = String(actual).toLowerCase();
  const expectedStr = String(expected).toLowerCase();
  const passed = actualStr.includes(expectedStr);

  return { passed, score: passed ? 1.0 : 0.0 };
}

/**
 * Similarity scoring (semantic similarity)
 *
 * STUB: In production, this would use embeddings or other similarity metrics
 */
function scoreSimilarity(
  actual: any,
  expected: any,
  threshold: number,
): { passed: boolean; score?: number } {
  // STUB: Simple Levenshtein-based similarity
  const actualStr = String(actual);
  const expectedStr = String(expected);

  const similarity = calculateLevenshteinSimilarity(actualStr, expectedStr);
  const passed = similarity >= threshold;

  return { passed, score: similarity };
}

/**
 * Custom scoring (user-defined logic)
 *
 * STUB: In production, this would execute custom scoring functions
 */
function scoreCustom(
  actual: any,
  expected: any,
  _config?: any,
): { passed: boolean; score?: number } {
  // STUB: Default to exact match
  return scoreExactMatch(actual, expected);
}

/**
 * Score output against expected output
 */
function scoreOutput(
  actualOutput: any,
  expectedOutput: any,
  scoringCriteria?: TestCase['scoringCriteria'],
): { passed: boolean; score?: number } {
  const type = scoringCriteria?.type || 'exact_match';

  switch (type) {
    case 'exact_match':
      return scoreExactMatch(actualOutput, expectedOutput);

    case 'contains':
      return scoreContains(actualOutput, expectedOutput);

    case 'similarity':
      return scoreSimilarity(
        actualOutput,
        expectedOutput,
        scoringCriteria?.threshold || 0.8,
      );

    case 'custom':
      return scoreCustom(
        actualOutput,
        expectedOutput,
        scoringCriteria?.config,
      );

    default:
      return { passed: false, score: 0 };
  }
}

/**
 * Simulate agent execution (stub)
 *
 * In production, this would call the actual agent infrastructure.
 */
async function simulateAgentExecution(
  _input: any,
  versionId: Id<'agentVersions'>,
): Promise<any> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 400));

  // STUB: Return mock output
  // In production, this would execute the actual agent
  return {
    response: 'Mock agent response',
    metadata: {
      versionId,
      timestamp: Date.now(),
    },
  };
}

/**
 * Execute a single test case
 *
 * @param testCase - Test case to execute
 * @param versionId - Agent version to test
 * @returns Test case result
 */
export async function executeTestCase(
  testCase: TestCase,
  versionId: Id<'agentVersions'>,
): Promise<TestCaseResult> {
  const startTime = Date.now();

  try {
    // STUB: In production, this would:
    // 1. Instantiate the agent with the version's genome
    // 2. Execute the agent with testCase.input
    // 3. Capture the agent's output
    // 4. Score the output against testCase.expectedOutput

    // For now, simulate execution with mock output
    const output = await simulateAgentExecution(testCase.input, versionId);

    // Score the output
    const { passed, score } = scoreOutput(
      output,
      testCase.expectedOutput,
      testCase.scoringCriteria,
    );

    const executionTime = Date.now() - startTime;

    return {
      testCaseId: testCase.id,
      passed,
      score,
      output,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    return {
      testCaseId: testCase.id,
      passed: false,
      output: null,
      error: error.message || 'Unknown error',
      executionTime,
    };
  }
}

/**
 * Execute all test cases in a suite
 */
export async function executeTestSuite(
  testCases: TestCase[],
  versionId: Id<'agentVersions'>,
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Execute test cases sequentially
  // In production, could execute in parallel with rate limiting
  for (const testCase of testCases) {
    const result = await executeTestCase(testCase, versionId);
    results.push(result);
  }

  return results;
}

/**
 * Calculate overall metrics from test results
 */
export function calculateMetrics(results: TestCaseResult[]): {
  passRate: number;
  overallScore: number;
  totalTests: number;
  passed: number;
  failed: number;
  avgExecutionTime: number;
} {
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? passedTests / totalTests : 0;

  // Calculate average score (only for tests with scores)
  const testsWithScores = results.filter((r) => r.score !== undefined);
  const overallScore = testsWithScores.length > 0
    ? testsWithScores.reduce((sum, r) => sum + (r.score || 0), 0) / testsWithScores.length
    : 0;

  const times = results
    .map((r) => r.executionTime)
    .filter((t): t is number => typeof t === 'number');
  const avgExecutionTime = times.length > 0
    ? times.reduce((sum, t) => sum + t, 0) / times.length
    : 0;

  return {
    passRate,
    overallScore,
    totalTests,
    passed: passedTests,
    failed: failedTests,
    avgExecutionTime,
  };
}
