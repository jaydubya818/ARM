/**
 * Frontend APM (Application Performance Monitoring)
 *
 * Browser-side performance monitoring and integration with APM providers.
 */

export type APMProvider = 'datadog' | 'newrelic' | 'sentry' | 'custom' | 'none';

export interface FrontendAPMConfig {
  provider: APMProvider;
  enabled: boolean;
  sampleRate?: number;
  reportErrors?: boolean;
}

const defaultConfig: FrontendAPMConfig = {
  provider: 'custom',
  enabled: true,
  sampleRate: 1.0,
  reportErrors: true,
};

let config: FrontendAPMConfig = { ...defaultConfig };

/**
 * Configure frontend APM
 */
export function configureFrontendAPM(
  newConfig: Partial<FrontendAPMConfig>,
): void {
  config = { ...config, ...newConfig };
}

/**
 * Mark a performance timestamp
 */
export function mark(name: string): void {
  if (!config.enabled || typeof performance === 'undefined') return;
  performance.mark(`arm_${name}`);
}

/**
 * Measure duration between marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string,
): number {
  if (!config.enabled || typeof performance === 'undefined') return 0;
  try {
    const measureName = `arm_measure_${name}`;
    performance.measure(
      measureName,
      `arm_${startMark}`,
      endMark ? `arm_${endMark}` : undefined,
    );
    const entry = performance.getEntriesByName(measureName).pop();
    const duration = entry?.duration ?? 0;
    performance.clearMarks(`arm_${startMark}`);
    performance.clearMarks(`arm_${endMark}`);
    performance.clearMeasures(measureName);
    return duration;
  } catch {
    return 0;
  }
}

/**
 * Get navigation timing metrics
 */
export function getNavigationMetrics(): Record<string, number> | null {
  if (
    !config.enabled
    || typeof performance === 'undefined'
    || !performance.getEntriesByType
  ) {
    return null;
  }

  const navEntries = performance.getEntriesByType('navigation');
  const nav = navEntries[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return null;

  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive - nav.startTime,
    domComplete: nav.domComplete - nav.startTime,
    loadComplete: nav.loadEventEnd - nav.startTime,
  };
}

/**
 * Report frontend error to APM
 */
export function reportError(
  error: Error,
  context?: Record<string, string | number | boolean>,
): void {
  if (!config.enabled || !config.reportErrors) return;

  const payload = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  if (config.provider === 'sentry') {
    console.debug('[APM] Would send to Sentry:', payload);
  } else if (config.provider === 'datadog') {
    console.debug('[APM] Would send to Datadog:', payload);
  } else {
    console.debug('[APM] Error captured:', payload);
  }
}

/**
 * Track custom event
 */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!config.enabled || Math.random() > (config.sampleRate ?? 1)) return;

  const payload = {
    name,
    properties: properties ?? {},
    timestamp: Date.now(),
  };

  console.debug('[APM] Event:', payload);
}

/**
 * Track page view
 */
export function trackPageView(
  path: string,
  title?: string,
  duration?: number,
): void {
  trackEvent('page_view', {
    path,
    title: title ?? document.title,
    duration: duration ?? 0,
  });
}
