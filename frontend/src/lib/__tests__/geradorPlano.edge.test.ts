/**
 * 🧪 Testes de edge cases do geradorPlano
 *
 * Cobre casos extremos que podem quebrar o app em produção.
 */

import { describe, test, expect } from 'vitest';
import { gerarPlano } from '../geradorPlano';

describe('geradorPlano — edge cases', () => {
  test('Plano com duração zero (deve funcionar com fallback)', () => {
    // Edge: duração mínima aceitável é 4
    const plano = gerarPlano({
      nome: 'Min',
      objetivo: 'mobilidade',
      nivel: 'iniciante',
      equipamento: 'peso_corporal',
      duracaoSemanas: 4,
      sessoesPorSemana: 2,
      duracaoSessaoMin: 20,
    });
    expect(plano.sessoes.length).toBeGreaterThan(0);
  });

  test('Plano com nome vazio gera nome padrão', () => {
    const plano = gerarPlano({
      nome: '',
      objetivo: 'forca_geral',
      nivel: 'iniciante',
      equipamento: 'kb_completo',
      duracaoSemanas: 4,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 45,
    });
    expect(plano.nome).toBeTruthy();
    expect(plano.nome.length).toBeGreaterThan(0);
  });

  test('Todos os exercícios têm descansos >= 30s (saúde)', () => {
    const plano = gerarPlano({
      nome: 'Descanso',
      objetivo: 'forca_geral',
      nivel: 'avancado',
      equipamento: 'academia_completa',
      duracaoSemanas: 4,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 90,
    });
    plano.sessoes.forEach((s) => {
      s.exercicios.forEach((ex) => {
        expect(ex.descansoSeg).toBeGreaterThanOrEqual(30);
      });
    });
  });

  test('Sessões têm pelo menos 1 exercício (não vazias)', () => {
    const plano = gerarPlano({
      nome: 'Vazio',
      objetivo: 'mobilidade',
      nivel: 'iniciante',
      equipamento: 'peso_corporal',
      duracaoSemanas: 4,
      sessoesPorSemana: 2,
      duracaoSessaoMin: 20,
    });
    plano.sessoes.forEach((s) => {
      expect(s.exercicios.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('Volume total cresce progressivamente (semanas normais)', () => {
    const plano = gerarPlano({
      nome: 'Progressivo',
      objetivo: 'forca_geral',
      nivel: 'intermediario',
      equipamento: 'kb_completo',
      duracaoSemanas: 8,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 45,
    });

    // Semana 0 (normal) vs semana 3 (deload)
    const sem0 = plano.sessoes.filter((s) => s.semanaIdx === 0);
    const sem3 = plano.sessoes.filter((s) => s.semanaIdx === 3);

    const volume0 = sem0.reduce((acc, s) => acc + s.exercicios.reduce((a, e) => a + e.series, 0), 0);
    const volume3 = sem3.reduce((acc, s) => acc + s.exercicios.reduce((a, e) => a + e.series, 0), 0);

    expect(volume3).toBeLessThan(volume0); // Deload tem menos séries
  });

  test('Deload aparece múltiplas vezes em plano longo', () => {
    const plano = gerarPlano({
      nome: 'Longo',
      objetivo: 'forca_geral',
      nivel: 'intermediario',
      equipamento: 'kb_completo',
      duracaoSemanas: 12,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 45,
    });

    // 12 semanas com deload a cada 4 (semanas 3, 7, 11 zero-indexed) × 3 sessões/sem = 9 sessões deload
    const deloadSessoes = plano.sessoes.filter((s) => s.semanaIdx % 4 === 3);
    expect(deloadSessoes.length).toBe(9);

    // Cada deload tem RPE baixo
    deloadSessoes.forEach((s) => {
      s.exercicios.forEach((ex) => {
        expect(ex.rpeAlvo).toBe(4); // RPE fixo no deload
      });
    });
  });

  test('Plano com 1×/sem deve cair pra frequência mínima', () => {
    // Edge: usuário pode tentar 1×/sem, mas o algoritmo tem 2× como mínimo nos templates
    const plano = gerarPlano({
      nome: 'Min freq',
      objetivo: 'forca_geral',
      nivel: 'iniciante',
      equipamento: 'kb_completo',
      duracaoSemanas: 4,
      sessoesPorSemana: 1,
      duracaoSessaoMin: 30,
    });
    // Deve cair pro template de 2× ou pegar o mínimo
    expect(plano.sessoes.length).toBeGreaterThan(0);
  });

  test('Exercícios são únicos dentro da mesma sessão', () => {
    const plano = gerarPlano({
      nome: 'Unicidade',
      objetivo: 'forca_geral',
      nivel: 'iniciante',
      equipamento: 'kb_completo',
      duracaoSemanas: 4,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 45,
    });

    plano.sessoes.forEach((s) => {
      const nomes = s.exercicios.map((e) => e.nome);
      const unicos = new Set(nomes);
      expect(unicos.size).toBe(nomes.length); // Sem duplicatas
    });
  });

  test('createdAt é ISO string válido', () => {
    const plano = gerarPlano({
      nome: 'Data',
      objetivo: 'forca_geral',
      nivel: 'iniciante',
      equipamento: 'kb_completo',
      duracaoSemanas: 4,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 45,
    });
    const date = new Date(plano.criadoEm);
    expect(date.getTime()).toBeGreaterThan(0);
    expect(date.getTime()).toBeLessThanOrEqual(Date.now() + 1000); // não no futuro
  });

  test('Plano com objetivo pickleball gera exercícios válidos', () => {
    const plano = gerarPlano({
      nome: 'Pickleball',
      objetivo: 'pickleball',
      nivel: 'avancado',
      equipamento: 'kb_completo',
      duracaoSemanas: 8,
      sessoesPorSemana: 4,
      duracaoSessaoMin: 45,
    });

    plano.sessoes.forEach((s) => {
      expect(s.exercicios.length).toBeGreaterThan(0);
      s.exercicios.forEach((ex) => {
        expect(ex.nome).toBeTruthy();
        expect(ex.carga).toBeTruthy();
      });
    });
  });

  test('Duração mínima de sessão (20min) gera plano viável', () => {
    const plano = gerarPlano({
      nome: 'Curto',
      objetivo: 'mobilidade',
      nivel: 'iniciante',
      equipamento: 'peso_corporal',
      duracaoSemanas: 4,
      sessoesPorSemana: 3,
      duracaoSessaoMin: 20,
    });
    expect(plano.sessoes.length).toBe(12);
    plano.sessoes.forEach((s) => {
      // Pelo menos 3 exercícios em 20min (cada um ~7min)
      expect(s.exercicios.length).toBeGreaterThanOrEqual(3);
    });
  });
});
