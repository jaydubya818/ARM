/**
 * Genome hashing utilities for immutable version integrity
 * Uses SHA-256 with canonical JSON serialization
 */

export interface Genome {
  modelConfig: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  promptBundleHash: string;
  toolManifest: Array<{
    toolId: string;
    schemaVersion: string;
    requiredPermissions: string[];
  }>;
  provenance?: {
    builtAt: string;
    builtBy: string;
    commitRef?: string;
    buildPipeline?: string;
    parentVersionId?: string;
  };
}

/**
 * Canonicalize genome for deterministic hashing
 * - Deep sort all object keys
 * - Remove undefined values
 * - Ensure consistent JSON serialization
 */
export function canonicalizeGenome(genome: Genome): string {
  const sortObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(sortObject);
    if (typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result: any, key) => {
          const value = obj[key];
          if (value !== undefined) {
            result[key] = sortObject(value);
          }
          return result;
        }, {});
    }
    return obj;
  };

  return JSON.stringify(sortObject(genome));
}

/**
 * Compute SHA-256 hash of genome
 * Uses Web Crypto API (available in Convex runtime)
 */
export async function computeGenomeHash(genome: Genome): Promise<string> {
  const canonical = canonicalizeGenome(genome);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify genome integrity
 * Returns true if computed hash matches stored hash
 */
export async function verifyGenomeIntegrity(
  genome: Genome,
  storedHash: string,
): Promise<boolean> {
  const computedHash = await computeGenomeHash(genome);
  return computedHash === storedHash;
}
