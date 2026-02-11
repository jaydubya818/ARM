import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  configureFrontendAPM,
  mark,
  measure,
  trackEvent,
  reportError,
} from '../../lib/apm';

describe('Frontend APM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureFrontendAPM({ enabled: true });
  });

  describe('mark', () => {
    it('does not throw when performance is unavailable', () => {
      const perf = global.performance;
      Object.defineProperty(global, 'performance', {
        value: undefined,
        configurable: true,
      });
      expect(() => mark('test')).not.toThrow();
      Object.defineProperty(global, 'performance', {
        value: perf,
        configurable: true,
      });
    });
  });

  describe('trackEvent', () => {
    it('tracks event with properties', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      trackEvent('button_click', { buttonId: 'submit' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('reportError', () => {
    it('reports error with context', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      reportError(new Error('Test error'), { component: 'Test' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('configureFrontendAPM', () => {
    it('disables tracking when enabled is false', () => {
      configureFrontendAPM({ enabled: false });
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      trackEvent('should_not_fire');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
      configureFrontendAPM({ enabled: true });
    });
  });
});
