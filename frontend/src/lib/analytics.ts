/**
 * Sistema de analytics LEVE para o app.
 *
 * Sprint 73 — Métricas de uso
 *
 * Eventos tracked:
 * - exercise_viewed: usuário abriu ExerciseDetailModal
 * - step_viewed: usuário visualizou um step específico (animator)
 * - muscle_clicked: usuário clicou em músculo no MuscleMap
 * - video_played: vídeo MP4 começou a tocar
 * - animator_step_navigated: usuário navegou entre steps no animator
 * - practice_mode_started: usuário iniciou PracticeMode full-screen
 *
 * Armazenamento: localStorage com TTL de 30 dias
 * Saída: para console (dev) + hook para integração com backend (futuro)
 */

export type AnalyticsEvent =
  | 'exercise_viewed'
  | 'step_viewed'
  | 'muscle_clicked'
  | 'video_played'
  | 'animator_step_navigated'
  | 'practice_mode_started'
  | 'exercise_saved_to_session'
  | 'search_performed'
  | 'card_clicked';

export interface AnalyticsPayload {
  exercise_id?: string;
  step_number?: number;
  muscle_id?: string;
  padrao_kb?: string;
  search_term?: string;
  duration_ms?: number;
  viewport_size?: string;
  variant?: string;
  [key: string]: string | number | undefined;
}

const STORAGE_KEY = 'toppkb-analytics-events';
const TTL_DAYS = 30;
const MAX_EVENTS = 1000;

interface StoredEvent {
  ts: number; // epoch ms
  event: AnalyticsEvent;
  payload: AnalyticsPayload;
}

function readEvents(): StoredEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeEvents(events: StoredEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    // Limpar eventos expirados (>30d)
    const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;
    const fresh = events.filter((e) => e.ts > cutoff);
    // Limitar a MAX_EVENTS (rolling window)
    const limited = fresh.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (e) {
    // localStorage cheio ou desabilitado — silenciar
  }
}

/**
 * Rastreia um evento.
 * API pública — chame livremente em componentes.
 */
export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  const enriched: StoredEvent = {
    ts: Date.now(),
    event,
    payload: {
      ...payload,
      viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    },
  };

  // Log dev (silenciado em prod via env)
  if (import.meta.env?.DEV) {
    console.log('[analytics]', event, enriched.payload);
  }

  const events = readEvents();
  events.push(enriched);
  writeEvents(events);
}

/**
 * Hook para rastrear com auto-cleanup de timer.
 */
export function trackDuration(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  const start = Date.now();
  return () => {
    const duration_ms = Date.now() - start;
    trackEvent(event, { ...payload, duration_ms });
  };
}

/**
 * Retorna top 10 exercícios mais vistos em 30 dias.
 * Usado pelo admin dashboard.
 */
export function getMostViewed(limit = 10): Array<{ exercise_id: string; count: number }> {
  const counts = new Map<string, number>();
  const events = readEvents();
  for (const e of events) {
    if (e.event !== 'exercise_viewed' || !e.payload.exercise_id) continue;
    const id = e.payload.exercise_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([exercise_id, count]) => ({ exercise_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Retorna exercícios com menor engajamento (potenciais gaps).
 */
export function getLeastViewedExercises(allExerciseIds: string[], limit = 10): Array<{ exercise_id: string; count: number }> {
  const counts = new Map<string, number>();
  const events = readEvents();
  for (const e of events) {
    if (e.event !== 'exercise_viewed' || !e.payload.exercise_id) continue;
    const id = e.payload.exercise_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return allExerciseIds
    .map((id) => ({ exercise_id: id, count: counts.get(id) ?? 0 }))
    .sort((a, b) => a.count - b.count)
    .slice(0, limit);
}

/**
 * Retorna quantos steps foram visualizados por exercício (mostra quais tem mais atenção).
 */
export function getStepsViewedCount(exerciseId?: string): Map<string, number> {
  const counts = new Map<string, number>();
  const events = readEvents();
  for (const e of events) {
    if (e.event !== 'step_viewed' || !e.payload.exercise_id || e.payload.step_number === undefined) continue;
    if (exerciseId && e.payload.exercise_id !== exerciseId) continue;
    const key = `${e.payload.exercise_id}#${e.payload.step_number}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Total de eventos registrados
 */
export function getEventCount(): number {
  return readEvents().length;
}

/**
 * Resumo por evento
 */
export function getEventSummary(): Record<string, number> {
  const summary: Record<string, number> = {};
  const events = readEvents();
  for (const e of events) {
    summary[e.event] = (summary[e.event] ?? 0) + 1;
  }
  return summary;
}

/**
 * Limpar todos os eventos (para privacidade/testes)
 */
export function clearAnalytics() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
