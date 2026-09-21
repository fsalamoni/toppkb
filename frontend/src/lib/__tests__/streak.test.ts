/**
 * Testes do streak.ts — cálculo de sequências de dias
 */
import { describe, it, expect } from 'vitest';
import {
  calcularStreakAtual,
  calcularMaiorStreak,
  calcularDiasAtivos,
  getStreakLevel,
} from '../streak';

// Helper: cria data N dias atrás
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('calcularStreakAtual', () => {
  it('retorna 0 sem eventos', () => {
    expect(calcularStreakAtual([])).toBe(0);
  });

  it('retorna 1 com evento de hoje', () => {
    const eventos = [{ data: daysAgo(0) }];
    expect(calcularStreakAtual(eventos)).toBe(1);
  });

  it('retorna 2 com eventos hoje e ontem', () => {
    const eventos = [{ data: daysAgo(0) }, { data: daysAgo(1) }];
    expect(calcularStreakAtual(eventos)).toBe(2);
  });

  it('retorna 0 se último evento foi há 2+ dias', () => {
    const eventos = [{ data: daysAgo(2) }];
    expect(calcularStreakAtual(eventos)).toBe(0);
  });

  it('conta múltiplos eventos no mesmo dia como 1', () => {
    const eventos = [
      { data: daysAgo(0) },
      { data: daysAgo(0) },
      { data: daysAgo(0) },
    ];
    expect(calcularStreakAtual(eventos)).toBe(1);
  });
});

describe('calcularMaiorStreak', () => {
  it('retorna 0 sem eventos', () => {
    expect(calcularMaiorStreak([])).toBe(0);
  });

  it('retorna 1 com 1 evento', () => {
    expect(calcularMaiorStreak([{ data: daysAgo(0) }])).toBe(1);
  });

  it('conta maior streak histórico', () => {
    // Streak atual pequena, mas houve streak maior no passado
    const eventos = [
      { data: daysAgo(20) }, // atual
      { data: daysAgo(19) },
      // GAP
      { data: daysAgo(15) }, // passado
      { data: daysAgo(14) },
      { data: daysAgo(13) },
      { data: daysAgo(12) }, // 4 dias seguidos
    ];
    expect(calcularMaiorStreak(eventos)).toBe(4);
  });

  it('conta streak contínuo de 5 dias', () => {
    const eventos = Array.from({ length: 5 }, (_, i) => ({ data: daysAgo(i) }));
    expect(calcularMaiorStreak(eventos)).toBe(5);
  });
});

describe('calcularDiasAtivos', () => {
  it('conta dias únicos', () => {
    const eventos = [
      { data: daysAgo(0) },
      { data: daysAgo(0) },
      { data: daysAgo(1) },
    ];
    expect(calcularDiasAtivos(eventos)).toBe(2);
  });

  it('retorna 0 sem eventos', () => {
    expect(calcularDiasAtivos([])).toBe(0);
  });
});

describe('getStreakLevel', () => {
  it('iniciante (0-6 dias)', () => {
    expect(getStreakLevel(3).level).toBe('iniciante');
  });

  it('regular (7-29 dias)', () => {
    expect(getStreakLevel(15).level).toBe('regular');
  });

  it('dedicado (30-99 dias)', () => {
    expect(getStreakLevel(60).level).toBe('dedicado');
  });

  it('elite (100-364 dias)', () => {
    expect(getStreakLevel(200).level).toBe('elite');
  });

  it('lendario (365+ dias)', () => {
    expect(getStreakLevel(500).level).toBe('lendario');
  });

  it('retorna emoji + cor + mensagem', () => {
    const level = getStreakLevel(7);
    expect(level.emoji).toBeTruthy();
    expect(level.color).toBeTruthy();
    expect(level.message).toBeTruthy();
  });
});
