import { describe, it, expect } from 'vitest';
import { calcularIMC, classificarIMC, clamp, round } from './math';

describe('calcularIMC', () => {
  it('95kg em 1,79m = 29.65', () => {
    expect(calcularIMC(95, 179)).toBeCloseTo(29.65, 1);
  });
  it('retorna 0 se peso ou altura ausentes', () => {
    expect(calcularIMC(0, 179)).toBe(0);
    expect(calcularIMC(95, 0)).toBe(0);
  });
});

describe('classificarIMC', () => {
  it('classifica corretamente', () => {
    expect(classificarIMC(17).label).toBe('Abaixo do peso');
    expect(classificarIMC(22).label).toBe('Normal');
    expect(classificarIMC(27).label).toBe('Sobrepeso');
    expect(classificarIMC(32).label).toBe('Obesidade I');
    expect(classificarIMC(42).label).toBe('Obesidade III');
  });
});

describe('clamp', () => {
  it('limita ao range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('round', () => {
  it('arredonda corretamente', () => {
    expect(round(1.234, 2)).toBe(1.23);
    expect(round(1.235, 2)).toBe(1.24);
  });
});
