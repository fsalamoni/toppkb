import { describe, it, expect } from 'vitest';
import { cosineSimilarity, EMBEDDING_PROVIDER_DEFAULTS, EMBEDDING_CONFIG } from './embeddings';

describe('cosineSimilarity', () => {
  it('retorna 1 para vetores idênticos', () => {
    const a = [1, 0, 0];
    const b = [1, 0, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });

  it('retorna -1 para vetores opostos', () => {
    const a = [1, 0, 0];
    const b = [-1, 0, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
  });

  it('retorna 0 para vetores ortogonais', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('retorna 0 para vetores de tamanhos diferentes', () => {
    const a = [1, 0];
    const b = [1, 0, 0];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('retorna 0 para vetor zero', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 0, 0])).toBe(0);
  });

  it('calcula similaridade corretamente para vetores arbitrários', () => {
    const a = [0.5, 0.5, 0.5];
    const b = [0.5, 0.5, 0.5];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });
});

describe('EMBEDDING_PROVIDER_DEFAULTS', () => {
  it('openai tem text-embedding-3-small (1536 dims)', () => {
    expect(EMBEDDING_PROVIDER_DEFAULTS.openai.model).toBe('text-embedding-3-small');
    expect(EMBEDDING_PROVIDER_DEFAULTS.openai.dimensions).toBe(1536);
  });

  it('google tem text-embedding-004 (768 dims)', () => {
    expect(EMBEDDING_PROVIDER_DEFAULTS.google.model).toBe('text-embedding-004');
    expect(EMBEDDING_PROVIDER_DEFAULTS.google.dimensions).toBe(768);
  });

  it('cohere tem embed-english-v3.0 (1024 dims)', () => {
    expect(EMBEDDING_PROVIDER_DEFAULTS.cohere.model).toBe('embed-english-v3.0');
    expect(EMBEDDING_PROVIDER_DEFAULTS.cohere.dimensions).toBe(1024);
  });

  it('ollama tem nomic-embed-text (768 dims)', () => {
    expect(EMBEDDING_PROVIDER_DEFAULTS.ollama.dimensions).toBe(768);
  });
});

describe('EMBEDDING_CONFIG', () => {
  it('NÃO tem provider hardcoded — sistema é provider-agnostic', () => {
    // O sistema não assume nenhum provider padrão.
    // Embeddings só funcionam se admin ou user configurarem.
    expect(EMBEDDING_CONFIG.model).toBe('NOT_CONFIGURED');
    expect(EMBEDDING_CONFIG.dimensions).toBe(0);
  });
});
