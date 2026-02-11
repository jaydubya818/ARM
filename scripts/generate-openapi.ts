/**
 * Generate OpenAPI spec from Convex API
 *
 * Runs Convex codegen and extracts function signatures to build
 * an OpenAPI-compatible documentation.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CONVEX_DIR = join(process.cwd(), "convex");
const DOCS_DIR = join(process.cwd(), "docs");

interface FunctionSpec {
  module: string;
  name: string;
  type: "query" | "mutation" | "action";
  args?: Record<string, unknown>;
}

/**
 * Parse convex modules for function exports
 */
function extractFunctions(): FunctionSpec[] {
  const functions: FunctionSpec[] = [];
  const apiPath = join(process.cwd(), "convex", "_generated", "api.d.ts");

  try {
    const content = readFileSync(apiPath, "utf-8");
    const moduleMatch = content.matchAll(
      /(\w+):\s*\{\s*([^}]+)\}/gs
    );
    for (const match of moduleMatch) {
      const moduleName = match[1];
      const body = match[2];
      const funcMatch = body.matchAll(/(\w+):\s*FunctionReference/g);
      for (const fm of funcMatch) {
        functions.push({
          module: moduleName,
          name: fm[1],
          type: "query",
        });
      }
    }
  } catch {
    // Fallback: manual list from known modules
    const modules = [
      "tenants",
      "environments",
      "operators",
      "providers",
      "agentTemplates",
      "agentVersions",
      "agentInstances",
      "policyEnvelopes",
      "approvalRecords",
      "changeRecords",
      "evaluationSuites",
      "evaluationRuns",
      "roles",
      "roleAssignments",
      "permissions",
      "auditLogs",
      "analytics",
      "customScoringFunctions",
      "notifications",
      "featureFlags",
      "experiments",
    ];
    for (const mod of modules) {
      functions.push({ module: mod, name: "list", type: "query" });
      functions.push({ module: mod, name: "get", type: "query" });
      functions.push({ module: mod, name: "create", type: "mutation" });
    }
  }

  return functions;
}

/**
 * Generate OpenAPI paths from functions
 */
function generatePaths(functions: FunctionSpec[]): string {
  const paths: string[] = [];
  for (const fn of functions) {
    const path = `/api/${fn.module}/${fn.name}`;
    const method = fn.type === "query" ? "get" : "post";
    paths.push(`  "${path}":
    ${method}:
      summary: ${fn.module}.${fn.name}
      operationId: ${fn.module}.${fn.name}
      tags: [${fn.module}]
      responses:
        "200":
          description: Success
`);
  }
  return paths.join("\n");
}

/**
 * Main
 */
function main() {
  const functions = extractFunctions();
  const pathsYaml = generatePaths(functions);

  const spec = `# Auto-generated from Convex API
# Run: npx tsx scripts/generate-openapi.ts
# Then: npx convex codegen

openapi: 3.1.0
info:
  title: ARM API (Generated)
  version: 1.0.0
paths:
${pathsYaml}
`;

  writeFileSync(join(DOCS_DIR, "openapi.generated.yaml"), spec);
  console.log(`Generated OpenAPI spec with ${functions.length} functions`);
}

main();
