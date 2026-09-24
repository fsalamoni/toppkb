import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackEvent } from '../analytics';
import {
  getAllMedals,
  checkNewAchievements,
  resetAchievements,
  getUserStats,
  ALL_MEDALS,
} from '../achievements';

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

describe('achievements', () => {
  it('ALL_MEDALS tem 15+ medalhas', () => {
    expect(ALL_MEDALS.length).toBeGreaterThanOrEqual(15);
  });

  it('ALL_MEDALS cobre os 4 tiers', () => {
    const tiers = new Set(ALL_MEDALS.map((m) => m.tier));
    expect(tiers.has('bronze')).toBe(true);
    expect(tiers.has('silver')).toBe(true);
    expect(tiers.has('gold')).toBe(true);
    expect(tiers.has('platinum')).toBe(true);
  });

  it('sem analytics: nenhuma medalha desbloqueada', () => {
    const medals = getAllMedals();
    const unlocked = medals.filter((m) => m.unlocked);
    expect(unlocked.length).toBe(0);
  });

  it('primeiro exercise_viewed desbloqueia explorer_5 (após 5 views)', () => {
    // Registrar 5 exercícios diferentes
    for (let i = 0; i < 5; i++) {
      // limpar e adicionar
      const events = JSON.parse(ls.data.get('toppkb-analytics-events') ?? '[]');
      events.push({
        ts: Date.now(),
        event: 'exercise_viewed',
        payload: { exercise_id: `kb-test-${i}` },
      });
      ls.data.set('toppkb-analytics-events', JSON.stringify(events));
    }

    const newOnes = checkNewAchievements();
    const ids = newOnes.map((m) => m.id);
    expect(ids).toContain('explorer_5');
  });

  it('practice_mode_started desbloqueia practice_first', () => {
    trackEvent('practice_mode_started', { exercise_id: 'kb-swing' });
    const newOnes = checkNewAchievements();
    expect(newOnes.some((m) => m.id === 'practice_first')).toBe(true);
  });

  it('50 practice_mode_started desbloqueia practice_10', () => {
    // Não persiste 50 vezes no mesmo teste, vamos mockar
    const events = Array.from({ length: 50 }, (_, i) => ({
      ts: Date.now(),
      event: 'practice_mode_started',
      payload: { exercise_id: `kb-test-${i}` },
    }));
    ls.data.set('toppkb-analytics-events', JSON.stringify(events));

    const newOnes = checkNewAchievements();
    expect(newOnes.some((m) => m.id === 'practice_first')).toBe(true);
    expect(newOnes.some((m) => m.id === 'practice_10')).toBe(true);
  });

  it('checkNewAchievements não retorna duplicatas', () => {
    trackEvent('practice_mode_started', { exercise_id: 'kb-swing' });
    const first = checkNewAchievements();
    const second = checkNewAchievements();
    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBe(0);
  });

  it('resetAchievements limpa tudo', () => {
    trackEvent('practice_mode_started', { exercise_id: 'x' });
    checkNewAchievements();
    expect(ls.data.size).toBeGreaterThan(0);
    resetAchievements();
    expect(ls.data.get('toppkb-achievements-unlocked')).toBeUndefined();
    const medals = getAllMedals();
    expect(medals.every((m) => !m.unlocked)).toBe(true);
  });

  it('getUserStats retorna contagem correta', () => {
    trackEvent('exercise_viewed', { exercise_id: 'a' });
    trackEvent('exercise_viewed', { exercise_id: 'b' });
    trackEvent('exercise_viewed', { exercise_id: 'c' });
    const stats = getUserStats();
    expect(stats.totalEventos).toBe(3);
    expect(stats.eventosPorTipo['exercise_viewed']).toBe(3);
    expect(stats.exerciciosVisualizados).toBe(3);
    expect(stats.todosExercicios).toBe(89);
  });

  it('getAllMedals retorna info de unlocked correto', () => {
    trackEvent('practice_mode_started', { exercise_id: 'kb-swing' });
    checkNewAchievements();
    const medals = getAllMedals();
    const practiceFirst = medals.find((m) => m.id === 'practice_first');
    expect(practiceFirst?.unlocked).toBe(true);
    expect(typeof practiceFirst?.unlockedAt).toBe('number');
  });

  it('streak medals desbloqueiam quando há sessões suficientes', () => {
    // Simular 7 dias de sessões consecutivas
    const hoje = new Date();
    const sessoes: { data: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      sessoes.push({ data: d.toISOString() });
    }
    const newOnes = checkNewAchievements(sessoes);
    expect(newOnes.some((m) => m.id === 'streak_3')).toBe(true);
    expect(newOnes.some((m) => m.id === 'streak_7')).toBe(true);
  });
});
