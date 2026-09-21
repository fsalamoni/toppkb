/**
 * Web Vitals — captura métricas de performance do usuário
 *
 * Métricas coletadas:
 * - LCP (Largest Contentful Paint) - < 2.5s = bom
 * - FID (First Input Delay) - < 100ms = bom
 * - CLS (Cumulative Layout Shift) - < 0.1 = bom
 * - FCP (First Contentful Paint) - < 1.8s = bom
 * - TTFB (Time To First Byte) - < 800ms = bom
 *
 * USO:
 *   observeWebVitals((metric) => {
 *     console.log('[WebVital]', metric);
 *   });
 *
 * As métricas são armazenadas no IndexedDB para futuro envio ao analytics.
 */

export interface WebVital {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  timestamp: number;
  /**
   * Additional context (e.g. CLS sources, LCP element selector)
   */
  metadata?: Record<string, any>;
}

// Thresholds (Google Web Vitals standards)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: WebVital['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

type MetricCallback = (metric: WebVital) => void;

/**
 * Subscribe to all web vitals metrics
 */
export function observeWebVitals(callback: MetricCallback): () => void {
  const cleanupFns: Array<() => void> = [];

  // LCP — Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
          element?: Element;
        };
        const value = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;

        callback({
          name: 'LCP',
          value,
          rating: getRating('LCP', value),
          url: window.location.href,
          timestamp: Date.now(),
          metadata: {
            element: lastEntry.element?.tagName,
          },
        });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      cleanupFns.push(() => lcpObserver.disconnect());
    } catch (e) {
      // LCP not supported
    }
  }

  // FID — First Input Delay
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          const value = entry.processingStart - entry.startTime;
          callback({
            name: 'FID',
            value,
            rating: getRating('FID', value),
            url: window.location.href,
            timestamp: Date.now(),
          });
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      cleanupFns.push(() => fidObserver.disconnect());
    } catch (e) {
      // FID not supported
    }
  }

  // CLS — Cumulative Layout Shift
  let clsValue = 0;
  if ('PerformanceObserver' in window) {
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            callback({
              name: 'CLS',
              value: clsValue,
              rating: getRating('CLS', clsValue),
              url: window.location.href,
              timestamp: Date.now(),
            });
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      cleanupFns.push(() => clsObserver.disconnect());
    } catch (e) {
      // CLS not supported
    }
  }

  // FCP — First Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntriesByName('first-contentful-paint');
        const last = entries[entries.length - 1];
        if (last) {
          callback({
            name: 'FCP',
            value: last.startTime,
            rating: getRating('FCP', last.startTime),
            url: window.location.href,
            timestamp: Date.now(),
          });
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      cleanupFns.push(() => fcpObserver.disconnect());
    } catch (e) {
      // FCP not supported
    }
  }

  // TTFB — Time To First Byte
  if (performance.timing) {
    const ttfb = performance.timing.responseStart - performance.timing.requestStart;
    if (ttfb > 0) {
      callback({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        url: window.location.href,
        timestamp: Date.now(),
      });
    }
  }

  // Cleanup
  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

/**
 * Computed metrics summary
 */
export function summarizeMetrics(metrics: WebVital[]): {
  good: WebVital[];
  poor: WebVital[];
  needsImprovement: WebVital[];
} {
  const good = metrics.filter((m) => m.rating === 'good');
  const poor = metrics.filter((m) => m.rating === 'poor');
  const needsImprovement = metrics.filter((m) => m.rating === 'needs-improvement');
  return { good, poor, needsImprovement };
}
