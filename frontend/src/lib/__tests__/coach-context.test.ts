import { describe, it, expect } from 'vitest';
import { buildCoachContext, getQuickContext } from '../coach-context';

describe('buildCoachContext', () => {
  it('retorna vazio para mensagem sem exercícios', () => {
    const result = buildCoachContext({
      message: 'Como melhorar meu forehand?',
      agente: 'treinador',
    });
    expect(result.contextBlock).toBe('');
    expect(result.enrichedCount).toBe(0);
  });

  it('detecta exercício por nome completo', () => {
    const result = buildCoachContext({
      message: 'Como fazer Swing 2H corretamente?',
      agente: 'treinador',
    });
    expect(result.enrichedCount).toBeGreaterThan(0);
    expect(result.contextBlock).toContain('Swing 2H');
  });

  it('detecta exercício por ID aproximado', () => {
    const result = buildCoachContext({
      message: 'Dicas para kb goblet squat',
      agente: 'preparador',
    });
    expect(result.enrichedCount).toBeGreaterThan(0);
    expect(result.contextBlock.toLowerCase()).toContain('goblet');
  });

  it('usa mentionedExercises quando fornecido', () => {
    const result = buildCoachContext({
      message: 'oi',
      agente: 'treinador',
      mentionedExercises: ['kb-swing-2h-hardstyle', 'kb-goblet-squat'],
    });
    expect(result.enrichedCount).toBe(2);
  });

  it('bloco contém seções didáticas (mapa muscular, sensação, erro)', () => {
    const result = buildCoachContext({
      message: 'Swing 2H',
      agente: 'preparador',
    });
    expect(result.contextBlock).toContain('ONDE SENTIR');
    expect(result.contextBlock).toContain('SENSAÇÃO PRINCIPAL');
    expect(result.contextBlock).toContain('ERRO MUSCULAR');
  });

  it('bloco inclui lembrete de linguagem leiga (sem jargão)', () => {
    const result = buildCoachContext({
      message: 'Swing 2H',
      agente: 'preparador',
    });
    expect(result.contextBlock).toContain('leiga');
    expect(result.contextBlock).toContain('bumbum'); // exemplo leigo
  });

  it('bloco inclui carga inicial para 50+', () => {
    const result = buildCoachContext({
      message: 'Swing 2H',
      agente: 'preparador',
    });
    expect(result.contextBlock).toContain('CARGA INICIAL');
  });

  it('bloco inclui passo a passo resumido', () => {
    const result = buildCoachContext({
      message: 'Swing 2H',
      agente: 'preparador',
    });
    expect(result.contextBlock).toContain('PASSO A PASSO');
  });

  it('bloco inclui sensações e alertas dos steps', () => {
    const result = buildCoachContext({
      message: 'Swing 2H',
      agente: 'preparador',
    });
    expect(result.contextBlock).toMatch(/Onde\/como sentir/);
  });

  it('ignora mentionedExercises que não existem', () => {
    const result = buildCoachContext({
      message: 'oi',
      agente: 'treinador',
      mentionedExercises: ['kb-inexistente', 'kb-tambem-inexistente'],
    });
    expect(result.enrichedCount).toBe(0);
    expect(result.contextBlock).toBe('');
  });

  it('filtra mentionedExercises válidos mesmo com inválidos', () => {
    const result = buildCoachContext({
      message: 'oi',
      agente: 'treinador',
      mentionedExercises: ['kb-inexistente', 'kb-swing-2h-hardstyle'],
    });
    expect(result.enrichedCount).toBe(1);
  });
});

describe('getQuickContext', () => {
  it('retorna string para exercício válido', () => {
    const result = getQuickContext('kb-swing-2h-hardstyle');
    expect(result.length).toBeGreaterThan(0);
  });

  it('retorna string para kb-goblet-squat', () => {
    const result = getQuickContext('kb-goblet-squat');
    expect(result.length).toBeGreaterThan(0);
    // Não precisa ter "goblet" no conteúdo - é dica resumida
    expect(result.toLowerCase()).toContain('onde sentir');
  });

  it('inclui "Onde sentir:"', () => {
    const result = getQuickContext('kb-swing-2h-hardstyle');
    expect(result).toContain('Onde sentir:');
  });

  it('inclui "Sensação:" se houver', () => {
    const result = getQuickContext('kb-swing-2h-hardstyle');
    expect(result).toContain('Sensação:');
  });

  it('inclui "Erro comum:" se houver', () => {
    const result = getQuickContext('kb-swing-2h-hardstyle');
    expect(result).toContain('Erro comum:');
  });

  it('retorna string vazia para exercício inexistente', () => {
    const result = getQuickContext('kb-inexistente');
    expect(result).toBe('');
  });
});
