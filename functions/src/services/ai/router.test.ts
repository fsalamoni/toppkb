import { describe, it, expect } from 'vitest';
import { detectarAgente, gerarTituloConversa } from './router';

describe('detectarAgente', () => {
  it('detecta Treinador em pergunta sobre dink', () => {
    expect(detectarAgente('Como melhorar meu dink?')).toBe('treinador');
  });

  it('detecta Preparador em menção a joelho', () => {
    expect(detectarAgente('Tô com dor no joelho direito')).toBe('preparador');
  });

  it('detecta Nutricionista em pergunta sobre whey', () => {
    expect(detectarAgente('Posso tomar whey à noite?')).toBe('nutricionista');
  });

  it('detecta Estrategista em pergunta sobre torneio', () => {
    expect(detectarAgente('Quando é o próximo torneio 50+?')).toBe('estrategista');
  });

  it('detecta Treinador com verbo técnico (dinkar)', () => {
    expect(detectarAgente('Como devo dinkar contra canhoto?')).toBe('treinador');
  });

  it('detecta Preparador com corpo + intensidade', () => {
    expect(detectarAgente('Meu ombro tá doendo 7/10')).toBe('preparador');
  });

  it('retorna general para pergunta genérica', () => {
    expect(detectarAgente('Oi, tudo bem?')).toBe('general');
  });

  it('detecta Nutricionista com alimentos específicos', () => {
    expect(detectarAgente('Comi arroz e frango agora')).toBe('nutricionista');
  });
});

describe('gerarTituloConversa', () => {
  it('limita a 6 palavras', () => {
    expect(gerarTituloConversa('Como melhorar meu dink contra jogadores que jogam agressivo?')).toContain('...');
  });

  it('remove caracteres especiais', () => {
    const t = gerarTituloConversa('Dói!!! O que fazer???');
    expect(t).not.toContain('!');
    expect(t).not.toContain('?');
  });

  it('retorna default para string vazia', () => {
    expect(gerarTituloConversa('')).toBe('Nova conversa');
  });
});
