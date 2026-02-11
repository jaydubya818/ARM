/**
 * Function Spec Loader
 *
 * Loads the function specification with environment variable substitution
 * for sensitive configuration values.
 */

/**
 * Load and parse the function specification file
 * Replaces ${CONVEX_URL} placeholder with actual deployment URL from environment
 *
 * @param specPath - Path to the function spec JSON file
 * @returns Parsed function spec with environment variables substituted
 * @throws Error if CONVEX_URL is not set or file cannot be read
 */
export function loadFunctionSpec(specPath: string): any {
  // This is a TypeScript/Node.js example
  // Actual implementation will depend on your runtime environment

  const fs = require('fs');

  // Read the spec file
  const specContent = fs.readFileSync(specPath, 'utf8');
  const spec = JSON.parse(specContent);

  // Get Convex URL from environment
  const convexUrl = process.env.CONVEX_URL;

  if (!convexUrl) {
    throw new Error(
      'CONVEX_URL environment variable is required. '
      + 'Please set it to your Convex deployment URL (e.g., https://your-deployment.convex.cloud)',
    );
  }

  // Validate URL format
  if (!convexUrl.startsWith('http://') && !convexUrl.startsWith('https://')) {
    throw new Error(
      `Invalid CONVEX_URL format: ${convexUrl}. `
      + 'URL must start with http:// or https://',
    );
  }

  // Replace placeholder with actual URL
  if (spec.url === '${CONVEX_URL}') {
    spec.url = convexUrl;
  } else {
    // Support other placeholders if needed
    spec.url = spec.url.replace(/\$\{CONVEX_URL\}/g, convexUrl);
  }

  return spec;
}

/**
 * Example usage:
 *
 * ```typescript
 * import { loadFunctionSpec } from './convex/utils/loadFunctionSpec';
 *
 * // Set environment variable first
 * process.env.CONVEX_URL = 'https://your-deployment.convex.cloud';
 *
 * // Load the spec
 * const spec = loadFunctionSpec('./function_spec_1770775290568.json');
 * console.log(spec.url); // https://your-deployment.convex.cloud
 * ```
 *
 * For production deployments:
 *
 * ```bash
 * # Set in your deployment environment
 * export CONVEX_URL=https://your-deployment.convex.cloud
 *
 * # Or in .env file (not committed to git)
 * CONVEX_URL=https://your-deployment.convex.cloud
 * ```
 */
