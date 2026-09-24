import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMostViewed,
  getLeastViewedExercises,
  getEventCount,
  getEventSummary,
  clearAnalytics,
  KETTLEBELL_EXERCICIOS_LIST,
} from '../analytics-helpers';

// Mock localStorage
const ls = {
  data: new Map<string, string>(),
  getItem(k: string) { return this.data.get(k) ?? null; },
  setItem(k: string, v: string) { this.data.set(k, v); },
  removeItem(k: string) { this.data.delete(k); },
  clear() { this.data.clear(); },
};
vi.stubGlobal('localStorage', ls);
vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 768 });

beforeEach(() => {
  ls.clear();
});

describe('analytics-helpers', () => {
  it('KETTLEBELL_EXERCICIOS_LIST contains ids', () => {
    expect(KETTLEBELL_EXERCICIOS_LIST.length).toBeGreaterThan(80);
    expect(KETTLEBELL_EXERCICIOS_LIST).toContain('kb-swing-2h-hardstyle');
  });

  it('getEventCount starts at 0', () => {
    expect(getEventCount()).toBe(0);
  });

  it('getEventSummary returns empty when no events', () => {
    expect(getEventSummary()).toEqual({});
  });

  it('getLeastViewedExercises returns ALL exercises when no events', () => {
    const least = getLeastViewedExercises(KETTLEBELL_EXERCICIOS_LIST, 5);
    expect(least.length).toBe(5);
    expect(least.every((e) => e.count === 0)).toBe(true);
  });

  it('getMostViewed returns empty when no events', () => {
    expect(getMostViewed()).toEqual([]);
  });

  it('end-to-end: 5 views of swing → top is swing', () => {
    // Simular 5 views
    for (let i = 0; i < 5; i++) {
      // Re-importando para usar a função real
      const events = JSON.parse(ls.data.get('toppkb-analytics-events') ?? '[]');
      events.push({ ts: Date.now(), event: 'exercise_viewed', payload: { exercise_id: 'kb-swing-2h-hardstyle' } });
      ls.data.set('toppkb-analytics-events', JSON.stringify(events));
    }
    // 1 view de goblet
    const events = JSON.parse(ls.data.get('toppkb-analytics-events') ?? '[]');
    events.push({ ts: Date.now(), event: 'exercise_viewed', payload: { exercise_id: 'kb-goblet-squat' } });
    ls.data.set('toppkb-analytics-events', JSON.stringify(events));

    expect(getEventCount()).toBe(6);
    const top = getMostViewed();
    expect(top[0].exercise_id).toBe('kb-swing-2h-hardstyle');
    expect(top[0].count).toBe(5);
    expect(top[1].exercise_id).toBe('kb-goblet-squat');
    expect(top[1].count).toBe(1);

    const summary = getEventSummary();
    expect(summary.exercise_viewed).toBe(6);
  });

  it('clearAnalytics works', () => {
    const events = [{ ts: Date.now(), event: 'exercise_viewed', payload: { exercise_id: 'x' } }];
    ls.data.set('toppkb-analytics-events', JSON.stringify(events));
    expect(getEventCount()).toBe(1);
    clearAnalytics();
    expect(getEventCount()).toBe(0);
  });

  it('getLeastViewedExercises sorts asc, zero-views first', () => {
    // 1 view de kb-press
    const events = [{ ts: Date.now(), event: 'exercise_viewed', payload: { exercise_id: 'kb-press' } }];
    ls.data.set('toppkb-analytics-events', JSON.stringify(events));

    const least = getLeastViewedExercises(KETTLEBELL_EXERCICIOS_LIST, 5);
    // Todos os 5 primeiros devem ter count 0
    expect(least.every((e) => e.count === 0)).toBe(true);
  });
});
