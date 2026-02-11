/**
 * Convex Cron Jobs
 *
 * Scheduled tasks for automated processing.
 */

import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

/**
 * Process pending evaluation runs
 *
 * Schedule: Every 5 minutes
 * Purpose: Pick up pending evaluation runs and execute them
 */
crons.interval(
  'process-evaluations',
  { minutes: 5 },
  internal.evaluationCron.processPendingEvaluations,
);

/**
 * Clean up old evaluation runs (future)
 *
 * Schedule: Daily at 2 AM
 * Purpose: Archive completed runs older than 90 days
 */
// crons.daily(
//   "cleanup-old-evaluations",
//   { hourUTC: 2, minuteUTC: 0 },
//   internal.evaluationCron.cleanupOldRuns
// );

export default crons;
