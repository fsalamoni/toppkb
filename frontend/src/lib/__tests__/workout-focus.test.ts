import { describe, it, expect } from 'vitest';
import { computeWorkoutFocus, muscleColor, muscleKey, findExercise } from '../workout-focus';

describe('muscleColor', () => {
  it('retorna verde para glúteo', () => {
    expect(muscleColor('Glúteo máximo')).toBe('#10b981');
  });
  it('retorna amber para quadríceps', () => {
    expect(muscleColor('Quadríceps')).toBe('#f59e0b');
  });
  it('retorna roxo para deltóide', () => {
    expect(muscleColor('Deltóide anterior')).toBe('#a855f7');
  });
  it('retorna pink para core', () => {
    expect(muscleColor('Core (abdômen)')).toBe('#ec4899');
  });
  it('retorna cinza para músculo desconhecido', () => {
    expect(muscleColor('Músculo inexistente')).toBe('#94a3b8');
  });
});

describe('muscleKey', () => {
  it('normaliza variações de glúteo para mesma chave', () => {
    expect(muscleKey('Glúteo máximo')).toBe('glúteo');
    expect(muscleKey('Glúteo médio')).toBe('glúteo');
    expect(muscleKey('Glúteo')).toBe('glúteo');
  });
  it('normaliza variações de core', () => {
    expect(muscleKey('Core')).toBe('core');
    expect(muscleKey('Abdômen')).toBe('core');
    // Oblíquo tem chave própria
    expect(muscleKey('Oblíquo')).toBe('oblíquo');
  });
  it('mantém lowercase para desconhecidos', () => {
    expect(muscleKey('Esquisito')).toBe('esquisito');
  });
});

describe('findExercise', () => {
  it('encontra por ID canônico', () => {
    const ex = findExercise('kb-swing-2h-hardstyle');
    expect(ex?.id).toBe('kb-swing-2h-hardstyle');
  });
  it('encontra por ID sem prefixo kb-', () => {
    const ex = findExercise('swing-2h-hardstyle');
    expect(ex?.id).toBe('kb-swing-2h-hardstyle');
  });
  it('encontra por nome', () => {
    const ex = findExercise('Swing 2H (Hardstyle)');
    expect(ex?.id).toBe('kb-swing-2h-hardstyle');
  });
  it('retorna undefined para inexistente', () => {
    expect(findExercise('exercicio-inexistente')).toBeUndefined();
  });
});

describe('computeWorkoutFocus', () => {
  it('retorna vazio para treino sem exercícios', () => {
    const result = computeWorkoutFocus([]);
    expect(result.grupos).toEqual([]);
    expect(result.totalSeries).toBe(0);
    expect(result.totalExercicios).toBe(0);
    expect(result.totalGrupos).toBe(0);
  });

  it('ignora exercícios não encontrados', () => {
    const result = computeWorkoutFocus([
      { id: 'exercicio-inexistente', nome: 'Inexistente', series: 3, reps: '10' },
    ]);
    expect(result.grupos).toEqual([]);
  });

  it('agrupa músculos de 1 exercício', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 3, reps: '10' },
    ]);
    expect(result.totalExercicios).toBe(1);
    expect(result.totalSeries).toBe(3);
    expect(result.grupos.length).toBeGreaterThan(0);
    // Swing trabalha glúteo + isquio (normalizado para 'glúteo' e 'isquiotibial')
    expect(result.grupos.some((g) => g.name.toLowerCase().includes('glúteo'))).toBe(true);
  });

  it('conta séries (peso por count)', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 5, reps: '10' },
    ]);
    const gluteo = result.grupos.find((g) => g.name.toLowerCase().includes('glúteo'));
    expect(gluteo?.count).toBe(5);
  });

  it('combina músculos de múltiplos exercícios', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 3, reps: '10' },
      { id: 'kb-goblet-squat', nome: 'Goblet Squat', series: 3, reps: '12' },
    ]);
    // Total de séries = 6
    expect(result.totalSeries).toBe(6);
    // Glúteo: swing (3) + goblet (3) = 6
    const gluteo = result.grupos.find((g) => g.name.toLowerCase().includes('glúteo'));
    expect(gluteo?.count).toBe(6);
  });

  it('ordena por count desc', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 5, reps: '10' },
      { id: 'kb-goblet-squat', nome: 'Goblet Squat', series: 3, reps: '12' },
    ]);
    for (let i = 1; i < result.grupos.length; i++) {
      expect(result.grupos[i - 1].count).toBeGreaterThanOrEqual(result.grupos[i].count);
    }
  });

  it('preenche onde_sentir com dica do primeiro exercício', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 3, reps: '10' },
    ]);
    const gluteo = result.grupos.find((g) => g.name.toLowerCase().includes('glúteo'));
    expect(gluteo?.onde_sentir).toBeDefined();
    expect(gluteo?.onde_sentir?.length).toBeGreaterThan(0);
  });

  it('não duplica exercícios na lista', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 3, reps: '10' },
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 2, reps: '8' },
    ]);
    const gluteo = result.grupos.find((g) => g.name.toLowerCase().includes('glúteo'));
    // 5 séries total, mas exercises deve ter 1 só
    expect(gluteo?.count).toBe(5);
    expect(gluteo?.exercises.length).toBe(1);
  });

  it('preenche color com cor por categoria', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 3, reps: '10' },
    ]);
    const gluteo = result.grupos.find((g) => g.name.toLowerCase().includes('glúteo'));
    expect(gluteo?.color).toBe('#10b981'); // verde para glúteo
  });

  it('preenche exemplo com nome do exercício', () => {
    const result = computeWorkoutFocus([
      { id: 'kb-swing-2h-hardstyle', nome: 'Swing 2H', series: 3, reps: '10' },
    ]);
    const gluteo = result.grupos.find((g) => g.name.toLowerCase().includes('glúteo'));
    expect(gluteo?.exemplo).toBe('Swing 2H (Hardstyle)');
  });
});
