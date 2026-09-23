import { describe, it, expect } from 'vitest';
import { analyzeMuscleFrequency, findNeglectedMuscles, recommendExercisesForMuscle } from '../muscle-tracker';

describe('analyzeMuscleFrequency', () => {
  it('retorna zero sessões para array vazio', () => {
    const result = analyzeMuscleFrequency([], { diasAtras: 30 });
    expect(result.grupos).toEqual([]);
    expect(result.totalSessoes).toBe(0);
  });

  it('conta músculos de uma sessão', () => {
    const sessoes = [
      { data: new Date().toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
    expect(result.totalSessoes).toBe(1);
    expect(result.grupos.length).toBeGreaterThan(0);
    // Swing trabalha glúteo (mapaMuscularLeigo)
    const gluteo = result.grupos.find((g) => g.muscle.toLowerCase().includes('glúteo'));
    expect(gluteo).toBeDefined();
    expect(gluteo!.count).toBe(1);
  });

  it('conta músculos únicos dentro de uma sessão (dedupe)', () => {
    // Se o mesmo exercício aparece 2x no array, deve contar 1x para o músculo
    const sessoes = [
      { data: new Date().toISOString(), exercicios: ['kb-swing-2h-hardstyle', 'kb-swing-2h-hardstyle'] },
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
    const gluteo = result.grupos.find((g) => g.muscle.toLowerCase().includes('glúteo'));
    expect(gluteo!.count).toBe(1); // dedupe dentro da sessão
  });

  it('conta músculos em múltiplas sessões', () => {
    const data1 = new Date();
    const data2 = new Date(Date.now() - 86400000);
    const sessoes = [
      { data: data1.toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
      { data: data2.toISOString(), exercicios: ['kb-swing-2h-hardstyle', 'kb-goblet-squat'] },
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
    expect(result.totalSessoes).toBe(2);
    // Glúteo aparece em ambos
    const gluteo = result.grupos.find((g) => g.muscle.toLowerCase().includes('glúteo'));
    expect(gluteo!.count).toBeGreaterThanOrEqual(2);
  });

  it('ignora sessões fora do período (diasAtras)', () => {
    const antigaData = new Date();
    antigaData.setDate(antigaData.getDate() - 100);
    const sessoes = [
      { data: antigaData.toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
    expect(result.totalSessoes).toBe(1); // total conta TODAS
    expect(result.grupos).toEqual([]); // mas filtra por período
  });

  it('aceita IDs com e sem prefixo kb-', () => {
    const sessoes = [
      { data: new Date().toISOString(), exercicios: ['swing-2h-hardstyle'] }, // sem kb-
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
    // Deve encontrar mesmo sem prefixo
    expect(result.grupos.length).toBeGreaterThan(0);
  });

  it('ignora exercícios não encontrados', () => {
    const sessoes = [
      { data: new Date().toISOString(), exercicios: ['exercicio-inexistente'] },
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
    expect(result.grupos).toEqual([]);
  });

  it('registra lastDate corretamente', () => {
    const data1 = new Date('2026-01-01').toISOString();
    const data2 = new Date('2026-06-01').toISOString();
    const sessoes = [
      { data: data1, exercicios: ['kb-swing-2h-hardstyle'] },
      { data: data2, exercicios: ['kb-swing-2h-hardstyle'] },
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 365 });
    const gluteo = result.grupos.find((g) => g.muscle.toLowerCase().includes('glúteo'));
    expect(gluteo!.lastDate).toBe(data2); // a mais recente
  });

  it('ordena por count decrescente', () => {
    const sessoes = [
      { data: new Date().toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
      { data: new Date().toISOString(), exercicios: ['kb-tgu-classic'] },
      { data: new Date().toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
    ];
    const result = analyzeMuscleFrequency(sessoes, { diasAtras: 30 });
    // Primeiro grupo deve ter count >= segundo
    for (let i = 1; i < result.grupos.length; i++) {
      expect(result.grupos[i - 1].count).toBeGreaterThanOrEqual(result.grupos[i].count);
    }
  });
});

describe('findNeglectedMuscles', () => {
  it('retorna array vazio quando não há sessões', () => {
    expect(findNeglectedMuscles([])).toEqual([]);
  });

  it('marca músculos como negligenciados após 5+ dias', () => {
    const antigaData = new Date();
    antigaData.setDate(antigaData.getDate() - 10);
    const sessoes = [
      { data: antigaData.toISOString(), exercicios: ['kb-swing-2h-hardstyle'] },
    ];
    const neglected = findNeglectedMuscles(sessoes, { diasSemAtividade: 5 });
    expect(neglected.length).toBeGreaterThan(0);
  });

  it('NÃO marca músculos recentes como negligenciados', () => {
    const hoje = new Date().toISOString();
    const sessoes = [
      { data: hoje, exercicios: ['kb-swing-2h-hardstyle'] },
    ];
    const neglected = findNeglectedMuscles(sessoes, { diasSemAtividade: 5 });
    // Músculos trabalhados HOJE não devem estar na lista
    expect(neglected).toEqual([]);
  });
});

describe('recommendExercisesForMuscle', () => {
  it('retorna array para músculo existente', () => {
    const result = recommendExercisesForMuscle('glúteo', 3);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('retorna array vazio para músculo inexistente', () => {
    const result = recommendExercisesForMuscle('músculo-inexistente', 3);
    expect(result).toEqual([]);
  });

  it('maxResults limita o retorno', () => {
    const r1 = recommendExercisesForMuscle('glúteo', 1);
    const r3 = recommendExercisesForMuscle('glúteo', 3);
    expect(r1.length).toBeLessThanOrEqual(1);
    expect(r3.length).toBeLessThanOrEqual(3);
    expect(r1.length).toBeLessThanOrEqual(r3.length);
  });

  it('recomenda exercícios que CONTÉM o músculo no mapaMuscularLeigo', () => {
    const result = recommendExercisesForMuscle('quadríceps', 5);
    for (const ex of result) {
      const hasQuad = ex.mapaMuscularLeigo?.some((m) =>
        m.toLowerCase().includes('quadríceps')
      );
      expect(hasQuad).toBe(true);
    }
  });

  it('não retorna duplicatas', () => {
    const result = recommendExercisesForMuscle('core', 10);
    const ids = result.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
