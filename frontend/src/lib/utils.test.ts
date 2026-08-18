import { describe, it, expect } from 'vitest';
import { calcularIMC, classificarIMC, formatKg, slugify } from './utils';

describe('calcularIMC', () => {
  it('calcula IMC corretamente', () => {
    expect(calcularIMC(95, 179)).toBeCloseTo(29.65, 1);
  });
  it('retorna 0 para altura 0', () => {
    expect(calcularIMC(95, 0)).toBe(0);
  });
});

describe('classificarIMC', () => {
  it('classifica abaixo do peso', () => {
    expect(classificarIMC(17).label).toBe('Abaixo do peso');
  });
  it('classifica normal', () => {
    expect(classificarIMC(22).label).toBe('Normal');
  });
  it('classifica sobrepeso', () => {
    expect(classificarIMC(27).label).toBe('Sobrepeso');
  });
  it('classifica obesidade I', () => {
    expect(classificarIMC(32).label).toBe('Obesidade I');
  });
});

describe('formatKg', () => {
  it('formata com 1 casa decimal por padrão', () => {
    expect(formatKg(95.234)).toBe('95.2 kg');
  });
  it('formata com 0 casas', () => {
    expect(formatKg(95.5, 0)).toBe('96 kg');
  });
});

describe('slugify', () => {
  it('remove acentos e espaços', () => {
    expect(slugify('Olá Mundo')).toBe('ola-mundo');
  });
  it('remove caracteres especiais', () => {
    expect(slugify('Açaí com Leite!')).toBe('acai-com-leite');
  });
});
