import { describe, it, expect } from 'vitest';
import {
  calculateIntensity,
  resolveExerciseId,
  extractMusclesForDay,
  filterSessoesForDay,
  generateHeatmapDays,
  computeHeatmap,
  groupIntoWeeks,
} from '../heatmap';

describe('calculateIntensity', () => {
  it('retorna 0 para nenhum músculo', () => {
    expect(calculateIntensity(0)).toBe(0);
  });
  it('retorna 1 para 1-2 músculos (leve)', () => {
    expect(calculateIntensity(1)).toBe(1);
    expect(calculateIntensity(2)).toBe(1);
  });
  it('retorna 2 para 3-4 músculos (moderado)', () => {
    expect(calculateIntensity(3)).toBe(2);
    expect(calculateIntensity(4)).toBe(2);
  });
  it('retorna 3 para 5-6 músculos (intenso)', () => {
    expect(calculateIntensity(5)).toBe(3);
    expect(calculateIntensity(6)).toBe(3);
  });
  it('retorna 4 para 7+ músculos (muito intenso)', () => {
    expect(calculateIntensity(7)).toBe(4);
    expect(calculateIntensity(15)).toBe(4);
  });
});

describe('resolveExerciseId', () => {
  it('resolve ID canônico', () => {
    expect(resolveExerciseId('kb-swing-2h-hardstyle')).toBe('kb-swing-2h-hardstyle');
  });
  it('resolve ID sem prefixo kb-', () => {
    expect(resolveExerciseId('swing-2h-hardstyle')).toBe('kb-swing-2h-hardstyle');
  });
  it('resolve nome do exercício', () => {
    expect(resolveExerciseId('Swing 2H (Hardstyle)')).toBe('kb-swing-2h-hardstyle');
  });
  it('retorna null para ID inexistente', () => {
    expect(resolveExerciseId('exercicio-inexistente')).toBe(null);
  });
});

describe('extractMusclesForDay', () => {
  it('extrai músculos únicos', () => {
    const muscles = extractMusclesForDay([
      { data: new Date().toISOString(), exercicios: ['kb-swing-2h-hardstyle', 'kb-swing-2h-hardstyle'] },
    ]);
    // Deduped
    expect(muscles.length).toBeLessThanOrEqual(2);
  });
  it('extrai músculos de múltiplos exercícios', () => {
    const muscles = extractMusclesForDay([
      { data: new Date().toISOString(), exercicios: ['kb-swing-2h-hardstyle', 'kb-goblet-squat'] },
    ]);
    // Swing trabalha glúteo+isquio; goblet trabalha quadríceps+glúteo
    // União pode ter glúteo, isquiotibial, quadríceps
    expect(muscles.length).toBeGreaterThan(0);
    expect(muscles).toContain('glúteo');
  });
  it('retorna [] para sessão sem exercícios válidos', () => {
    expect(extractMusclesForDay([
      { data: new Date().toISOString(), exercicios: ['exercicio-inexistente'] },
    ])).toEqual([]);
  });
});

describe('filterSessoesForDay', () => {
  it('filtra só sessões do dia', () => {
    const hoje = new Date('2026-09-23T14:00:00');
    const ontem = new Date('2026-09-22T14:00:00');
    const amanha = new Date('2026-09-24T14:00:00');
    const target = new Date('2026-09-23T00:00:00');

    const result = filterSessoesForDay(
      [
        { data: hoje.toISOString(), exercicios: [] },
        { data: ontem.toISOString(), exercicios: [] },
        { data: amanha.toISOString(), exercicios: [] },
      ],
      target,
    );
    expect(result).toHaveLength(1);
  });
  it('inclui sessões no mesmo dia independente da hora', () => {
    const manha = new Date('2026-09-23T07:00:00');
    const tarde = new Date('2026-09-23T18:00:00');
    const target = new Date('2026-09-23T00:00:00');

    const result = filterSessoesForDay(
      [
        { data: manha.toISOString(), exercicios: [] },
        { data: tarde.toISOString(), exercicios: [] },
      ],
      target,
    );
    expect(result).toHaveLength(2);
  });
});

describe('generateHeatmapDays', () => {
  it('gera ~84 dias por padrão', () => {
    const days = generateHeatmapDays(84);
    expect(days.length).toBeGreaterThanOrEqual(84);
    expect(days.length).toBeLessThanOrEqual(91); // + dow para alinhar domingo
  });
  it('gera dias alinhados por domingo', () => {
    const days = generateHeatmapDays(28);
    // Primeiro dia deve ser domingo
    expect(days[0].date.getDay()).toBe(0);
  });
  it('não inclui dias futuros', () => {
    const days = generateHeatmapDays(84);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    for (const d of days) {
      expect(d.date.getTime()).toBeLessThanOrEqual(today.getTime());
    }
  });
  it('dateStr tem formato YYYY-MM-DD', () => {
    const days = generateHeatmapDays(28);
    expect(days[0].dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('computeHeatmap', () => {
  it('marca intensity=0 para dias sem sessões', () => {
    const days = computeHeatmap([], 28);
    expect(days.every((d) => d.intensity === 0)).toBe(true);
  });
  it('marca intensity>0 para dias com sessões', () => {
    const hoje = new Date();
    const days = computeHeatmap(
      [{ data: hoje.toISOString(), exercicios: ['kb-swing-2h-hardstyle'] }],
      28,
    );
    // Encontra o dia de hoje
    const todayCell = days.find((d) => {
      return d.date.toDateString() === hoje.toDateString();
    });
    expect(todayCell?.intensity).toBeGreaterThan(0);
  });
  it('sessionCount reflete número de sessões no dia', () => {
    const hoje = new Date();
    const days = computeHeatmap(
      [
        { data: hoje.toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
        { data: new Date(hoje.getTime() + 3600000).toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
      ],
      28,
    );
    const todayCell = days.find((d) => d.date.toDateString() === hoje.toDateString());
    expect(todayCell?.sessionCount).toBe(2);
  });
});

describe('groupIntoWeeks', () => {
  it('agrupa em colunas de 7', () => {
    const days = generateHeatmapDays(28);
    const weeks = groupIntoWeeks(days);
    // Cada semana completa tem 7 dias
    const fullWeeks = weeks.filter((w) => w.length === 7);
    expect(fullWeeks.length).toBeGreaterThan(0);
    // Última semana pode ser parcial
    expect(weeks.length).toBeGreaterThan(0);
  });
  it('todos os dias são cobertos', () => {
    const days = generateHeatmapDays(28);
    const weeks = groupIntoWeeks(days);
    const total = weeks.reduce((acc, w) => acc + w.length, 0);
    expect(total).toBe(days.length);
  });
});
