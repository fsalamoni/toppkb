/**
 * 🧪 Testes do geradorPlano (Vitest)
 *
 * Garante que o algoritmo gera planos válidos pra todos os objetivos,
 * frequências e níveis.
 *
 * Executar: npx vitest run src/lib/__tests__/geradorPlano.test.ts
 */

import { describe, test, expect } from 'vitest';
import { gerarPlano } from '../geradorPlano';

const objetivos = ['forca_geral', 'hipertrofia', 'perda_peso', 'mobilidade', 'condicionamento', 'pickleball'] as const;
const niveis = ['iniciante', 'intermediario', 'avancado'] as const;
const frequencias = [2, 3, 4, 5, 6];
const equipamentos = ['kb_leve', 'kb_completo', 'peso_corporal', 'academia_completa'] as const;

describe('geradorPlano', () => {
  test('Plano básico tem todos os campos obrigatórios', () => {
    const plano = gerarPlano({
      nome: 'Teste',
      objetivo: 'forca_geral',
      nivel: 'iniciante',
      equipamento: 'kb_completo',
      duracaoSemanas: 12,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 45,
    });
    expect(plano.id).toMatch(/^plano-/);
    expect(plano.nome).toBe('Teste');
    expect(plano.sessoes.length).toBe(36);
    expect(plano.ativo).toBe(true);
  });

  for (const obj of objetivos) {
    test(`Objetivo "${obj}" gera plano válido`, () => {
      const plano = gerarPlano({
        nome: `Teste ${obj}`,
        objetivo: obj,
        nivel: 'intermediario',
        equipamento: 'kb_completo',
        duracaoSemanas: 8,
        sessoesPorSemana: 3,
        duracaoSessaoMin: 45,
      });
      expect(plano.sessoes.length).toBe(24);
      plano.sessoes.forEach((s) => {
        expect(s.exercicios.length).toBeGreaterThanOrEqual(3);
        s.exercicios.forEach((ex) => {
          expect(ex.nome).toBeTruthy();
          expect(ex.series).toBeGreaterThanOrEqual(1);
          expect(ex.reps).toBeTruthy();
        });
      });
    });
  }

  for (const freq of frequencias) {
    test(`Frequência ${freq}×/sem gera ${freq} sessões por semana`, () => {
      const plano = gerarPlano({
        nome: 'Teste freq',
        objetivo: 'forca_geral',
        nivel: 'intermediario',
        equipamento: 'kb_completo',
        duracaoSemanas: 4,
        sessoesPorSemana: freq,
        duracaoSessaoMin: 45,
      });
      for (let sem = 0; sem < 4; sem++) {
        const sessoesSemana = plano.sessoes.filter((s) => s.semanaIdx === sem);
        expect(sessoesSemana.length).toBe(freq);
      }
    });
  }

  for (const nivel of niveis) {
    test(`Nível "${nivel}" tem volume apropriado`, () => {
      const plano = gerarPlano({
        nome: `Teste ${nivel}`,
        objetivo: 'forca_geral',
        nivel,
        equipamento: 'kb_completo',
        duracaoSemanas: 4,
        sessoesPorSemana: 3,
        duracaoSessaoMin: 45,
      });
      const series = plano.sessoes[0].exercicios[0].series;
      expect(series).toBeGreaterThanOrEqual(2);
      expect(series).toBeLessThanOrEqual(5);
    });
  }

  for (const eq of equipamentos) {
    test(`Equipamento "${eq}" gera plano`, () => {
      const plano = gerarPlano({
        nome: `Teste ${eq}`,
        objetivo: 'forca_geral',
        nivel: 'intermediario',
        equipamento: eq,
        duracaoSemanas: 4,
        sessoesPorSemana: 3,
        duracaoSessaoMin: 30,
      });
      expect(plano.sessoes.length).toBe(12);
    });
  }

  test('Deload aparece a cada 4 semanas (RPE menor)', () => {
    const plano = gerarPlano({
      nome: 'Teste deload',
      objetivo: 'forca_geral',
      nivel: 'intermediario',
      equipamento: 'kb_completo',
      duracaoSemanas: 12,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 45,
    });
    const semDelod = plano.sessoes.filter((s) => s.semanaIdx === 3);
    const semNormal = plano.sessoes.filter((s) => s.semanaIdx === 0);

    const rpeDeload = semDelod[0].exercicios[0].rpeAlvo || 0;
    const rpeNormal = semNormal[0].exercicios[0].rpeAlvo || 0;

    expect(rpeDeload).toBeLessThan(rpeNormal);
  });

  test('IDs únicos por sessão', () => {
    const plano = gerarPlano({
      nome: 'Teste IDs',
      objetivo: 'hipertrofia',
      nivel: 'intermediario',
      equipamento: 'kb_completo',
      duracaoSemanas: 8,
      sessoesPorSemana: 4,
      duracaoSessaoMin: 50,
    });
    const ids = new Set(plano.sessoes.map((s) => s.id));
    expect(ids.size).toBe(plano.sessoes.length);
  });

  test('Plano mínimo (4sem, 2×/sem) funciona', () => {
    const plano = gerarPlano({
      nome: 'Mínimo',
      objetivo: 'mobilidade',
      nivel: 'iniciante',
      equipamento: 'peso_corporal',
      duracaoSemanas: 4,
      sessoesPorSemana: 2,
      duracaoSessaoMin: 20,
    });
    expect(plano.sessoes.length).toBe(8);
  });

  test('Plano máximo (24sem, 6×/sem) funciona', () => {
    const plano = gerarPlano({
      nome: 'Máximo',
      objetivo: 'condicionamento',
      nivel: 'avancado',
      equipamento: 'academia_completa',
      duracaoSemanas: 24,
      sessoesPorSemana: 6,
      duracaoSessaoMin: 90,
    });
    expect(plano.sessoes.length).toBe(144);
  });
});
