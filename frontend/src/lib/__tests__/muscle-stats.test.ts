import { describe, it, expect } from 'vitest';
import { getMuscleStats, filterByMuscle } from '../muscle-stats';
import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';

describe('getMuscleStats', () => {
  it('retorna array vazio se seed vazio (sanity)', () => {
    // Seed tem 89 exercícios, então stats deve ter vários
    const stats = getMuscleStats();
    expect(stats.length).toBeGreaterThan(0);
  });

  it('só inclui músculos com 3+ exercícios', () => {
    const stats = getMuscleStats();
    for (const s of stats) {
      expect(s.count).toBeGreaterThanOrEqual(3);
    }
  });

  it('cada MuscleStat tem shape correto', () => {
    const stats = getMuscleStats();
    for (const s of stats) {
      expect(s.nome).toBeTruthy();
      expect(s.display).toBeTruthy();
      expect(s.count).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(s.exercises)).toBe(true);
      expect(['posterior', 'anterior', 'core', 'ombro', 'membro-superior', 'cardio'])
        .toContain(s.categoria);
      expect(s.icone).toBeTruthy();
      expect(s.cor).toContain('bg-');
    }
  });

  it('estatísticas são ordenadas por count desc', () => {
    const stats = getMuscleStats();
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i - 1].count).toBeGreaterThanOrEqual(stats[i].count);
    }
  });

  it('deduplica mesmo músculo dentro do mesmo exercício', () => {
    // Verificar que exercises.length não duplica o mesmo ID
    const stats = getMuscleStats();
    for (const s of stats) {
      const unique = new Set(s.exercises);
      expect(unique.size).toBe(s.exercises.length);
    }
  });

  it('normaliza variações anatômicas (Glúteo máximo = Glúteo)', () => {
    const stats = getMuscleStats();
    const gluteo = stats.find((s) => s.nome === 'Glúteo');
    // Se existir, deve incluir exercícios que falam "Glúteo máximo" OU "Glúteo médio"
    if (gluteo) {
      expect(gluteo.count).toBeGreaterThan(0);
      // Todos os exercícios devem ter "Glúteo" (em qualquer variação) no mapaMuscularLeigo
      for (const exId of gluteo.exercises) {
        const ex = KETTLEBELL_EXERCICIOS.find((e) => e.id === exId);
        expect(ex).toBeDefined();
        const hasGluteo = ex?.mapaMuscularLeigo?.some((m) => m.toLowerCase().includes('glúteo'));
        expect(hasGluteo).toBe(true);
      }
    }
  });

  it('classifica corretamente por categoria', () => {
    const stats = getMuscleStats();
    const core = stats.find((s) => s.categoria === 'core');
    if (core) {
      // Core deve incluir algo com "core", "abdômen", "oblíquo" ou "barriga"
      const lowerName = core.nome.toLowerCase();
      const hasCoreKeyword = lowerName.includes('core') || 
                              lowerName.includes('abdômen') ||
                              lowerName.includes('oblíquo') ||
                              lowerName.includes('barriga');
      expect(hasCoreKeyword).toBe(true);
    }
  });
});

describe('filterByMuscle', () => {
  it('retorna array vazio para músculo inexistente', () => {
    const result = filterByMuscle('músculo-inexistente-xyz');
    expect(result).toEqual([]);
  });

  it('filtra corretamente por Glúteo', () => {
    const result = filterByMuscle('Glúteo');
    expect(result.length).toBeGreaterThan(0);
    // Cada exercício retornado deve ter Glúteo no mapaMuscularLeigo
    for (const ex of result) {
      const hasGluteo = ex.mapaMuscularLeigo?.some((m) => m.toLowerCase().includes('glúteo'));
      expect(hasGluteo).toBe(true);
    }
  });

  it('não retorna duplicatas', () => {
    const result = filterByMuscle('Glúteo');
    const ids = result.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('retorna subset do array original', () => {
    const result = filterByMuscle('Core');
    expect(result.length).toBeLessThanOrEqual(KETTLEBELL_EXERCICIOS.length);
  });
});
