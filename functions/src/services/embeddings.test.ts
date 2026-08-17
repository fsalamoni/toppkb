import { describe, it, expect } from 'vitest';
import { cosineSimilarity, EMBEDDING_CONFIG } from './embeddings';

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

describe('EMBEDDING_CONFIG', () => {
  it('usa text-embedding-004 (768 dims)', () => {
    expect(EMBEDDING_CONFIG.model).toBe('text-embedding-004');
    expect(EMBEDDING_CONFIG.dimensions).toBe(768);
  });
});
