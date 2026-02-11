/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentInstances from "../agentInstances.js";
import type * as agentTemplates from "../agentTemplates.js";
import type * as agentVersions from "../agentVersions.js";
import type * as analytics from "../analytics.js";
import type * as approvalRecords from "../approvalRecords.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as changeRecords from "../changeRecords.js";
import type * as costLedger from "../costLedger.js";
import type * as crons from "../crons.js";
import type * as customScoringFunctions from "../customScoringFunctions.js";
import type * as environments from "../environments.js";
import type * as evaluationActions from "../evaluationActions.js";
import type * as evaluationCron from "../evaluationCron.js";
import type * as evaluationRuns from "../evaluationRuns.js";
import type * as evaluationSuites from "../evaluationSuites.js";
import type * as experiments from "../experiments.js";
import type * as featureFlags from "../featureFlags.js";
import type * as lib_apm from "../lib/apm.js";
import type * as lib_approvalEngine from "../lib/approvalEngine.js";
import type * as lib_authMiddleware from "../lib/authMiddleware.js";
import type * as lib_cache from "../lib/cache.js";
import type * as lib_errorHandler from "../lib/errorHandler.js";
import type * as lib_errorTypes from "../lib/errorTypes.js";
import type * as lib_evaluationRunner from "../lib/evaluationRunner.js";
import type * as lib_genomeHash from "../lib/genomeHash.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_inputValidation from "../lib/inputValidation.js";
import type * as lib_policyEvaluator from "../lib/policyEvaluator.js";
import type * as lib_queryOptimizer from "../lib/queryOptimizer.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as lib_retry from "../lib/retry.js";
import type * as lib_tenantContext from "../lib/tenantContext.js";
import type * as monitoring_healthCheck from "../monitoring/healthCheck.js";
import type * as monitoring_metrics from "../monitoring/metrics.js";
import type * as monitoring_providerHealth from "../monitoring/providerHealth.js";
import type * as notificationProcessor from "../notificationProcessor.js";
import type * as notifications from "../notifications.js";
import type * as operators from "../operators.js";
import type * as permissions from "../permissions.js";
import type * as policyEnvelopes from "../policyEnvelopes.js";
import type * as providers from "../providers.js";
import type * as roleAssignments from "../roleAssignments.js";
import type * as roles from "../roles.js";
import type * as seedARM from "../seedARM.js";
import type * as tenants from "../tenants.js";
import type * as utils_pii from "../utils/pii.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentInstances: typeof agentInstances;
  agentTemplates: typeof agentTemplates;
  agentVersions: typeof agentVersions;
  analytics: typeof analytics;
  approvalRecords: typeof approvalRecords;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  changeRecords: typeof changeRecords;
  costLedger: typeof costLedger;
  crons: typeof crons;
  customScoringFunctions: typeof customScoringFunctions;
  environments: typeof environments;
  evaluationActions: typeof evaluationActions;
  evaluationCron: typeof evaluationCron;
  evaluationRuns: typeof evaluationRuns;
  evaluationSuites: typeof evaluationSuites;
  experiments: typeof experiments;
  featureFlags: typeof featureFlags;
  "lib/apm": typeof lib_apm;
  "lib/approvalEngine": typeof lib_approvalEngine;
  "lib/authMiddleware": typeof lib_authMiddleware;
  "lib/cache": typeof lib_cache;
  "lib/errorHandler": typeof lib_errorHandler;
  "lib/errorTypes": typeof lib_errorTypes;
  "lib/evaluationRunner": typeof lib_evaluationRunner;
  "lib/genomeHash": typeof lib_genomeHash;
  "lib/index": typeof lib_index;
  "lib/inputValidation": typeof lib_inputValidation;
  "lib/policyEvaluator": typeof lib_policyEvaluator;
  "lib/queryOptimizer": typeof lib_queryOptimizer;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/rbac": typeof lib_rbac;
  "lib/retry": typeof lib_retry;
  "lib/tenantContext": typeof lib_tenantContext;
  "monitoring/healthCheck": typeof monitoring_healthCheck;
  "monitoring/metrics": typeof monitoring_metrics;
  "monitoring/providerHealth": typeof monitoring_providerHealth;
  notificationProcessor: typeof notificationProcessor;
  notifications: typeof notifications;
  operators: typeof operators;
  permissions: typeof permissions;
  policyEnvelopes: typeof policyEnvelopes;
  providers: typeof providers;
  roleAssignments: typeof roleAssignments;
  roles: typeof roles;
  seedARM: typeof seedARM;
  tenants: typeof tenants;
  "utils/pii": typeof utils_pii;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
