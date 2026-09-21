/**
 * useWebVitals — monitora métricas de performance e armazena no IndexedDB
 *
 * AUTOMÁTICO:
 * - Inicia monitor quando app monta
 * - Salva no IndexedDB para posterior análise
 * - Para monitor quando app desmonta
 *
 * USO:
 *   useWebVitals({ enabled: true });
 */
import { useEffect, useRef } from 'react';
import { observeWebVitals, type WebVital } from '@/lib/webVitals';
import { setItem, getItem } from '@/lib/idb';

const VITALS_STORE = 'web-vitals';
const MAX_VITALS = 50; // ring buffer

interface UseWebVitalsOptions {
  enabled?: boolean;
  /** Callback para análise customizada (envia analytics, etc) */
  onMetric?: (metric: WebVital) => void;
}

export function useWebVitals({ enabled = true, onMetric }: UseWebVitalsOptions = {}) {
  const onMetricRef = useRef(onMetric);
  onMetricRef.current = onMetric;

  useEffect(() => {
    if (!enabled) return;

    // Skip durante testes (jsdom não tem PerformanceObserver)
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const stopObserving = observeWebVitals(async (metric) => {
      // Salvar no IndexedDB
      try {
        const existing = (await getItem<WebVital[]>(VITALS_STORE, 'metrics')) || [];
        const updated = [metric, ...existing].slice(0, MAX_VITALS);
        await setItem(VITALS_STORE, 'metrics', updated);
      } catch (e) {
        console.warn('[useWebVitals] Failed to store metric:', e);
      }

      // Callback customizado
      onMetricRef.current?.(metric);

      // Log em dev
      if (import.meta.env.DEV) {
        const rating = metric.rating;
        const colors = {
          good: '🟢',
          'needs-improvement': '🟡',
          poor: '🔴',
        };
        console.log(
          `${colors[rating]} [WebVital] ${metric.name} = ${metric.value.toFixed(2)} (${metric.rating})`,
        );
      }
    });

    return () => {
      stopObserving();
    };
  }, [enabled]);
}

/**
 * Ler métricas armazenadas (para dashboard admin)
 */
export async function getStoredMetrics(): Promise<WebVital[]> {
  try {
    return (await getItem<WebVital[]>(VITALS_STORE, 'metrics')) || [];
  } catch {
    return [];
  }
}
