/**
 * Testes dos validators — validação de Forms
 */
import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateRange,
  validateEmail,
  validateUrl,
  validateDate,
  validateNotFuture,
  validateWeight,
  validateHeartRate,
  validateDuration,
  composeValidators,
  validateObject,
  isValid,
} from '../validators';

describe('validators', () => {
  describe('validateRequired', () => {
    it('rejeita null', () => {
      expect(validateRequired(null, 'Nome')).toBe('Nome é obrigatório');
    });
    it('rejeita undefined', () => {
      expect(validateRequired(undefined)).toBeTruthy();
    });
    it('rejeita string vazia', () => {
      expect(validateRequired('', 'Nome')).toBe('Nome é obrigatório');
    });
    it('rejeita string whitespace', () => {
      expect(validateRequired('   ', 'Nome')).toBe('Nome é obrigatório');
    });
    it('rejeita array vazio', () => {
      expect(validateRequired([], 'Tags')).toBe('Tags é obrigatório');
    });
    it('aceita string válida', () => {
      expect(validateRequired('João', 'Nome')).toBeNull();
    });
    it('aceita número', () => {
      expect(validateRequired(0, 'Idade')).toBeNull();
    });
  });

  describe('validateMinLength', () => {
    it('passa com tamanho exato', () => {
      expect(validateMinLength(3, 'T')(('ab' + 'c'))).toBeNull();
    });
    it('falta tamanho', () => {
      expect(validateMinLength(5, 'T')('abc')).toBe('T deve ter pelo menos 5 caracteres');
    });
    it('ignora null (covered by required)', () => {
      expect(validateMinLength(5, 'T')(null)).toBeNull();
    });
  });

  describe('validateMaxLength', () => {
    it('passa dentro do limite', () => {
      expect(validateMaxLength(10, 'T')('abc')).toBeNull();
    });
    it('falha acima do limite', () => {
      expect(validateMaxLength(3, 'T')('abcdef')).toBe('T deve ter no máximo 3 caracteres');
    });
  });

  describe('validateRange', () => {
    it('passa dentro do range', () => {
      expect(validateRange(0, 100, 'Idade')(50)).toBeNull();
    });
    it('falha abaixo do mínimo', () => {
      expect(validateRange(10, 100, 'X')(5)).toBe('X deve estar entre 10 e 100');
    });
    it('falha acima do máximo', () => {
      expect(validateRange(10, 100, 'X')(200)).toBeTruthy();
    });
    it('rejeita NaN', () => {
      expect(validateRange(0, 100, 'X')('abc')).toBe('X deve ser um número');
    });
  });

  describe('validateEmail', () => {
    it('aceita email válido', () => {
      expect(validateEmail('user@example.com')).toBeNull();
    });
    it('rejeita email inválido', () => {
      expect(validateEmail('user@')).toBe('Email inválido');
      expect(validateEmail('user.example.com')).toBe('Email inválido');
    });
    it('aceita vazio (covered by required)', () => {
      expect(validateEmail('')).toBeNull();
    });
  });

  describe('validateUrl', () => {
    it('aceita URL válida', () => {
      expect(validateUrl('https://example.com')).toBeNull();
    });
    it('rejeita URL inválida', () => {
      expect(validateUrl('not-a-url')).toBe('URL inválida');
    });
  });

  describe('validateDate', () => {
    it('aceita data válida', () => {
      expect(validateDate('2025-01-15')).toBeNull();
    });
    it('rejeita data inválida', () => {
      expect(validateDate('not-a-date', 'X')).toBe('X inválida');
    });
  });

  describe('validateNotFuture', () => {
    it('aceita data passada', () => {
      expect(validateNotFuture('2020-01-01')).toBeNull();
    });
    it('rejeita data futura', () => {
      expect(validateNotFuture('2099-01-01', 'X')).toBe('X não pode estar no futuro');
    });
  });

  describe('Validators específicos (50+)', () => {
    it('validateWeight (30-200kg)', () => {
      expect(validateWeight(75)).toBeNull();
      expect(validateWeight(20)).toBeTruthy();
      expect(validateWeight(250)).toBeTruthy();
    });

    it('validateHeartRate (30-220 bpm)', () => {
      expect(validateHeartRate(60)).toBeNull();
      expect(validateHeartRate(300)).toBeTruthy();
    });

    it('validateDuration (1-480 min)', () => {
      expect(validateDuration(60)).toBeNull();
      expect(validateDuration(600)).toBeTruthy();
    });
  });

  describe('composeValidators', () => {
    it('executa validators em ordem até encontrar erro', () => {
      const composed = composeValidators(
        validateRequired,
        validateMinLength(3, 'Nome'),
      );
      // null passa required mas falha minLength
      // (mas validateRequired também retorna erro para null)
      expect(composed('', {} as any)).toBeTruthy();
    });

    it('aceita valor válido para todos', () => {
      const composed = composeValidators(
        validateRequired,
        validateMinLength(3, 'Nome'),
      );
      expect(composed('João', {} as any)).toBeNull();
    });
  });

  describe('validateObject', () => {
    it('valida cada campo', () => {
      const schema = {
        nome: validateRequired,
        idade: validateRange(0, 100),
      };
      const errors = validateObject(
        { nome: '', idade: 150 },
        schema,
      );
      expect(errors.nome).toBeTruthy();
      expect(errors.idade).toBeTruthy();
    });

    it('retorna null para campos válidos', () => {
      const schema = {
        nome: validateRequired,
      };
      const errors = validateObject({ nome: 'João' }, schema);
      expect(errors.nome).toBeFalsy();
    });
  });

  describe('isValid', () => {
    it('true quando todos são null/undefined', () => {
      expect(isValid({} as any)).toBe(true);
      expect(isValid({ a: null, b: undefined } as any)).toBe(true);
    });
    it('false quando há erros', () => {
      expect(isValid({ a: 'erro' })).toBe(false);
    });
  });
});
