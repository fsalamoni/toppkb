import { describe, it, expect } from 'vitest';
import { anonymizeText, filterPII } from './anonymizer';

describe('anonymizeText', () => {
  it('remove e-mail', () => {
    const result = anonymizeText('Meu email é joao@silva.com');
    expect(result.text).toContain('[EMAIL]');
    expect(result.text).not.toContain('joao@silva.com');
    expect(result.piiTypes).toContain('email');
  });

  it('remove CPF', () => {
    const result = anonymizeText('Meu CPF é 123.456.789-09');
    expect(result.text).toContain('[CPF]');
    expect(result.text).not.toContain('123.456.789-09');
    expect(result.piiTypes).toContain('cpf');
  });

  it('remove telefone', () => {
    const result = anonymizeText('Liga 11987654321');
    expect(result.text).toContain('[PHONE]');
    expect(result.piiTypes).toContain('phone');
  });

  it('remove cartão de crédito', () => {
    const result = anonymizeText('Cartão: 4111 1111 1111 1111');
    expect(result.text).toContain('[CARD]');
    expect(result.piiTypes).toContain('creditCard');
  });

  it('remove múltiplos PIIs', () => {
    const result = anonymizeText('Email: a@b.com CPF: 111.222.333-44 tel: 11999998888');
    expect(result.piiRemoved).toBe(3);
    expect(result.piiTypes).toHaveLength(3);
  });

  it('retorna texto original se não tem PII', () => {
    const result = anonymizeText('Texto limpo sem dados sensíveis');
    expect(result.text).toBe('Texto limpo sem dados sensíveis');
    expect(result.piiRemoved).toBe(0);
  });

  it('filterPII é alias de anonymizeText', () => {
    expect(filterPII).toBe(anonymizeText);
  });
});
