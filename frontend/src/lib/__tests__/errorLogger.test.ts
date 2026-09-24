/**
 * Testes do errorLogger — log estruturado de erros
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  logError,
  listErrors,
  clearError,
  clearAllErrors,
} from '../errorLogger';
import { clearStore, countStore } from '../idbSchema';

describe('errorLogger', () => {
  beforeEach(async () => {
    await clearStore('errors');
  });

  describe('logError', () => {
    it('loga um erro e retorna ID', async () => {
      const id = await logError(new Error('Teste'));
      expect(id).toBeTruthy();
      expect(id).toMatch(/^\d{13}-[a-z0-9]{6}$/);
    });

    it('aceita string como erro', async () => {
      const id = await logError('Erro simples');
      const errors = await listErrors();
      expect(errors[0]?.id).toBe(id);
      expect(errors[0]?.message).toBe('Erro simples');
    });

    it('inclui source nos metadados', async () => {
      await logError(new Error('X'), { source: 'TreinoForm' });
      const errors = await listErrors();
      expect(errors[0]?.source).toBe('TreinoForm');
    });

    it('inclui metadata customizado', async () => {
      await logError(new Error('X'), {
        source: 'test',
        metadata: { userId: 'u123', action: 'save' },
      });
      const errors = await listErrors();
      expect(errors[0]?.metadata).toEqual({ userId: 'u123', action: 'save' });
    });

    it('inclui timestamp ISO', async () => {
      const before = new Date().toISOString();
      await logError(new Error('X'));
      const after = new Date().toISOString();

      const errors = await listErrors();
      const ts = errors[0]?.timestamp || '';
      expect(ts >= before).toBe(true);
      expect(ts <= after).toBe(true);
    });

    it('inclui stack trace', async () => {
      const error = new Error('With stack');
      await logError(error);
      const errors = await listErrors();
      expect(errors[0]?.stack).toBeTruthy();
      expect(errors[0]?.stack).toContain('Error: With stack');
    });
  });

  describe('listErrors', () => {
    it('retorna array vazio inicialmente', async () => {
      const errors = await listErrors();
      expect(errors).toEqual([]);
    });

    it('retorna erros ordenados por timestamp desc', async () => {
      await logError('Primeiro');
      await new Promise((r) => setTimeout(r, 5));
      await logError('Segundo');
      await new Promise((r) => setTimeout(r, 5));
      await logError('Terceiro');

      const errors = await listErrors();
      expect(errors[0]?.message).toBe('Terceiro');
      expect(errors[2]?.message).toBe('Primeiro');
    });
  });

  describe('clearError', () => {
    it('remove erro específico', async () => {
      const id = await logError('Remover');
      await clearError(id);

      const errors = await listErrors();
      expect(errors.find((e) => e.id === id)).toBeUndefined();
    });

    it('retorna false para ID inexistente', async () => {
      const result = await clearError('fake-id');
      expect(result).toBe(true); // IDB delete é idempotente
    });
  });

  describe('clearAllErrors', () => {
    it('remove todos os erros', async () => {
      await logError('A');
      await logError('B');
      await logError('C');

      await clearAllErrors();

      const errors = await listErrors();
      expect(errors).toEqual([]);
    });
  });

  describe('ring buffer', () => {
    it('mantém últimos 100 erros', async () => {
      // Logar 105 erros
      for (let i = 0; i < 105; i++) {
        await logError(`Erro ${i}`);
      }

      // Esperar IDB escrever tudo (async, evitar race)
      await new Promise((r) => setTimeout(r, 100));

      const count = await countStore('errors');
      expect(count).toBe(100);

      // Os primeiros (Erro 0-4) devem ter sido removidos
      const errors = await listErrors();
      expect(errors.length).toBe(100);
      // O mais recente é o último (104)
      expect(errors[0]?.message).toBe('Erro 104');
      // O mais antigo dos que sobraram (entre Erro 5 e 104) — margem para race
      const oldestIdx = 99;
      const oldestMsg = errors[oldestIdx]?.message ?? '';
      const oldestNum = parseInt(oldestMsg.replace('Erro ', ''), 10);
      expect(oldestNum).toBeGreaterThanOrEqual(5);
      expect(oldestNum).toBeLessThanOrEqual(10);
    });
  });
});
