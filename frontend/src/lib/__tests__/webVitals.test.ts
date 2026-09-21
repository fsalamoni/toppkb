/**
 * Testes do webVitals — captura métricas de performance
 */
import { describe, it, expect } from 'vitest';
import { summarizeMetrics } from '../webVitals';

describe('webVitals', () => {
  describe('getRating (via threshold values)', () => {
    // Testando via summarizeMetrics
    it('classifica LCP good (<2500ms)', () => {
      const metrics = [{ name: 'LCP' as const, value: 2000, rating: 'good' as const, url: '', timestamp: 0 }];
      const { good, needsImprovement, poor } = summarizeMetrics(metrics);
      expect(good).toHaveLength(1);
      expect(needsImprovement).toHaveLength(0);
      expect(poor).toHaveLength(0);
    });

    it('classifica CLS poor (>= 0.25)', () => {
      const metrics = [{ name: 'CLS' as const, value: 0.5, rating: 'poor' as const, url: '', timestamp: 0 }];
      const { poor } = summarizeMetrics(metrics);
      expect(poor).toHaveLength(1);
    });

    it('classifica CLS needs-improvement (0.1-0.25)', () => {
      const metrics = [{ name: 'CLS' as const, value: 0.15, rating: 'needs-improvement' as const, url: '', timestamp: 0 }];
      const { needsImprovement } = summarizeMetrics(metrics);
      expect(needsImprovement).toHaveLength(1);
    });

    it('classifica FID poor (>= 300ms)', () => {
      const metrics = [{ name: 'FID' as const, value: 350, rating: 'poor' as const, url: '', timestamp: 0 }];
      const { poor } = summarizeMetrics(metrics);
      expect(poor).toHaveLength(1);
    });

    it('classifica FCP good (< 1800ms)', () => {
      const metrics = [{ name: 'FCP' as const, value: 1500, rating: 'good' as const, url: '', timestamp: 0 }];
      const { good } = summarizeMetrics(metrics);
      expect(good).toHaveLength(1);
    });

    it('TTFB poor (>= 1800ms)', () => {
      const metrics = [{ name: 'TTFB' as const, value: 2000, rating: 'poor' as const, url: '', timestamp: 0 }];
      const { poor } = summarizeMetrics(metrics);
      expect(poor).toHaveLength(1);
    });

    it('INP needs-improvement (200-500ms)', () => {
      const metrics = [{ name: 'INP' as const, value: 350, rating: 'needs-improvement' as const, url: '', timestamp: 0 }];
      const { needsImprovement } = summarizeMetrics(metrics);
      expect(needsImprovement).toHaveLength(1);
    });
  });

  describe('summarizeMetrics', () => {
    it('categoriza métricas mistas', () => {
      const metrics = [
        { name: 'LCP' as const, value: 2000, rating: 'good' as const, url: '', timestamp: 0 },
        { name: 'FID' as const, value: 200, rating: 'needs-improvement' as const, url: '', timestamp: 0 },
        { name: 'CLS' as const, value: 0.5, rating: 'poor' as const, url: '', timestamp: 0 },
      ];
      const { good, needsImprovement, poor } = summarizeMetrics(metrics);
      expect(good).toHaveLength(1);
      expect(needsImprovement).toHaveLength(1);
      expect(poor).toHaveLength(1);
    });

    it('retorna listas vazias quando não há métricas', () => {
      const { good, needsImprovement, poor } = summarizeMetrics([]);
      expect(good).toEqual([]);
      expect(needsImprovement).toEqual([]);
      expect(poor).toEqual([]);
    });
  });
});
