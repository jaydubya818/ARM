/**
 * APM (Application Performance Monitoring) Integration
 *
 * Provides a provider-agnostic APM layer for integration with
 * Datadog, New Relic, or custom monitoring solutions.
 */

import { recordMetric } from '../monitoring/metrics';

export type APMProvider = 'datadog' | 'newrelic' | 'custom' | 'none';

export interface APMConfig {
  provider: APMProvider;
  enabled: boolean;
  serviceName?: string;
  environment?: string;
  sampleRate?: number;
  datadog?: {
    apiKey?: string;
    site?: string;
  };
  newrelic?: {
    licenseKey?: string;
    applicationId?: string;
  };
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

const defaultConfig: APMConfig = {
  provider: 'custom',
  enabled: true,
  serviceName: 'arm-platform',
  environment: process.env.NODE_ENV || 'development',
  sampleRate: 1.0,
};

let config: APMConfig = { ...defaultConfig };

/**
 * Generate unique ID for spans
 */
function generateId(): string {
  return `span_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Send trace to Datadog (stub - integrate with dd-trace when needed)
 */
function sendToDatadog(
  name: string,
  duration: number,
  attributes?: SpanAttributes,
): void {
  if (!config.datadog?.apiKey) return;

  const payload = {
    service: config.serviceName || 'arm-platform',
    resource: name,
    type: 'custom',
    duration: duration * 1e6,
    meta: attributes,
    metrics: { _sampling_priority_v1: 1 },
  };

  if (process.env.NODE_ENV === 'development') {
    console.debug('[APM->Datadog]', payload);
  }

  // In production, use fetch to send to Datadog API
  // fetch(`https://trace.agent.${config.datadog.site || 'datadoghq.com'}/v0.4/traces`, {...})
}

/**
 * Send trace to New Relic (stub - integrate with newrelic when needed)
 */
function sendToNewRelic(
  name: string,
  duration: number,
  attributes?: SpanAttributes,
): void {
  if (!config.newrelic?.licenseKey) return;

  const payload = {
    eventType: 'ArmSpan',
    name,
    duration,
    service: config.serviceName || 'arm-platform',
    ...attributes,
  };

  if (process.env.NODE_ENV === 'development') {
    console.debug('[APM->NewRelic]', payload);
  }

  // In production, use New Relic Insights API
  // fetch('https://insights-collector.newrelic.com/v1/events', {...})
}

/**
 * Configure APM provider
 */
export function configureAPM(newConfig: Partial<APMConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current APM config
 */
export function getAPMConfig(): APMConfig {
  return { ...config };
}

/**
 * Check if APM is enabled
 */
export function isAPMEnabled(): boolean {
  return config.enabled;
}

/**
 * Start a span for tracing
 */
export function startSpan(
  name: string,
  attributes?: SpanAttributes,
): { end: () => void; spanId: string } {
  const spanId = generateId();
  const startTime = Date.now();

  return {
    spanId,
    end: () => {
      const duration = Date.now() - startTime;
      recordMetric({
        type: 'CUSTOM',
        name: `span.${name}`,
        value: duration,
        unit: 'ms',
        tags: {
          spanId,
          ...Object.fromEntries(
            Object.entries(attributes || {}).map(([k, v]) => [k, String(v)]),
          ),
        },
      });

      if (config.provider === 'datadog' && config.datadog?.apiKey) {
        sendToDatadog(name, duration, attributes);
      }

      if (config.provider === 'newrelic' && config.newrelic?.licenseKey) {
        sendToNewRelic(name, duration, attributes);
      }
    },
  };
}

/**
 * Record a custom metric to all configured providers
 */
export function recordAPMMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
): void {
  if (!config.enabled) return;

  recordMetric({
    type: 'CUSTOM',
    name,
    value,
    unit: 'count',
    tags,
  });
}

/**
 * Record an error for APM
 */
export function recordAPMError(
  error: Error,
  context?: { [key: string]: string },
): void {
  if (!config.enabled) return;

  recordMetric({
    type: 'ERROR_RATE',
    name: 'error',
    value: 1,
    unit: 'count',
    tags: {
      errorName: error.name,
      errorMessage: error.message.slice(0, 100),
      ...context,
    },
  });
}

/**
 * Wrap async function with APM tracing
 */
export async function withAPMSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: SpanAttributes,
): Promise<T> {
  const span = startSpan(name, attributes);
  try {
    const result = await fn();
    span.end();
    return result;
  } catch (error) {
    recordAPMError(error as Error, { span: name });
    span.end();
    throw error;
  }
}

/**
 * Frontend performance marks (for browser performance API integration)
 */
export const FrontendAPM = {
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  measure(name: string, startMark: string, endMark?: string): number {
    if (typeof performance !== 'undefined' && performance.measure) {
      performance.measure(name, startMark, endMark);
      const entry = performance.getEntriesByName(name).pop();
      return entry?.duration ?? 0;
    }
    return 0;
  },

  getNavigationTiming(): Record<string, number> | null {
    if (typeof performance !== 'undefined' && performance.timing) {
      const t = performance.timing;
      return {
        dns: t.domainLookupEnd - t.domainLookupStart,
        tcp: t.connectEnd - t.connectStart,
        request: t.responseStart - t.requestStart,
        response: t.responseEnd - t.responseStart,
        dom: t.domContentLoadedEventEnd - t.domLoading,
        load: t.loadEventEnd - t.loadEventStart,
      };
    }
    return null;
  },
};
