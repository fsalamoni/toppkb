import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackEvent, getMostViewed, clearAnalytics } from '../analytics';

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

describe('analytics', () => {
  it('trackEvent stores an event', () => {
    trackEvent('exercise_viewed', { exercise_id: 'kb-swing-2h-hardstyle' });
    expect(ls.data.size).toBe(1);
  });

  it('getMostViewed ranks by view count', () => {
    trackEvent('exercise_viewed', { exercise_id: 'kb-swing' });
    trackEvent('exercise_viewed', { exercise_id: 'kb-swing' });
    trackEvent('exercise_viewed', { exercise_id: 'kb-swing' });
    trackEvent('exercise_viewed', { exercise_id: 'kb-goblet' });
    const ranked = getMostViewed();
    expect(ranked[0].exercise_id).toBe('kb-swing');
    expect(ranked[0].count).toBe(3);
    expect(ranked[1].exercise_id).toBe('kb-goblet');
    expect(ranked[1].count).toBe(1);
  });

  it('clearAnalytics wipes storage', () => {
    trackEvent('exercise_viewed', { exercise_id: 'x' });
    expect(ls.data.size).toBeGreaterThan(0);
    clearAnalytics();
    expect(ls.data.size).toBe(0);
  });
});
