import { describe, test, expect } from 'vitest';

describe('Firestore paths - validar número par de segmentos', () => {
  test('toppkb_users/{uid}/programa/atual tem 4 segmentos (par)', () => {
    const path = 'toppkb_users/{uid}/programa/atual';
    const segments = path.split('/');
    expect(segments.length).toBe(4);
    expect(segments.length % 2).toBe(0);
  });

  test('toppkb_users/{uid}/treinamento/sessoes tem 4 segmentos (par)', () => {
    const path = 'toppkb_users/{uid}/treinamento/sessoes';
    const segments = path.split('/');
    expect(segments.length).toBe(4);
    expect(segments.length % 2).toBe(0);
  });

  test('antigo toppkb_users/{uid}/treinamento/programa/atual (5 = ímpar, BUG)', () => {
    const path = 'toppkb_users/{uid}/treinamento/programa/atual';
    const segments = path.split('/');
    expect(segments.length).toBe(5);
    // Esse era o bug — número ímpar quebra doc()
    expect(segments.length % 2).toBe(1);
  });

  test('Regras: sempre par para DocumentReference', () => {
    const caminhosValidos = [
      'collection/doc',                                    // 2
      'col1/doc1/col2/doc2',                              // 4
      'col1/doc1/col2/doc2/col3/doc3',                    // 6
      'toppkb_users/uid/programa/atual',                  // 4
      'toppkb_users/uid/treinamento/sessoes',             // 4
    ];

    caminhosValidos.forEach((path) => {
      const segments = path.split('/');
      expect(segments.length % 2).toBe(0);
    });
  });
});
