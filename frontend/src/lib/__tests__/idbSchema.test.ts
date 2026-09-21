/**
 * Testes do idbSchema — schema versioning + helpers
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  openDB,
  getFromStore,
  setInStore,
  deleteFromStore,
  getAllKeys,
  clearStore,
  countStore,
  DB_VERSION,
  MIGRATIONS,
} from '../idbSchema';

describe('idbSchema', () => {
  beforeEach(async () => {
    // Limpar todos os stores antes de cada teste
    await clearStore('kv');
    await clearStore('web-vitals');
    await clearStore('sync-queue');
  });

  describe('Open DB', () => {
    it('abre o banco na versão atual', async () => {
      const db = await openDB();
      expect(db).toBeTruthy();
      expect(db?.version).toBe(DB_VERSION);
    });

    it('retorna DB_VERSION = 2', () => {
      expect(DB_VERSION).toBe(2);
    });

    it('executa 2 migrations', () => {
      expect(MIGRATIONS.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Stores criados', () => {
    it('cria store kv', async () => {
      const db = await openDB();
      expect(db?.objectStoreNames.contains('kv')).toBe(true);
    });

    it('cria store web-vitals', async () => {
      const db = await openDB();
      expect(db?.objectStoreNames.contains('web-vitals')).toBe(true);
    });

    it('cria store sync-queue', async () => {
      const db = await openDB();
      expect(db?.objectStoreNames.contains('sync-queue')).toBe(true);
    });
  });

  describe('getFromStore/setInStore', () => {
    it('armazena e recupera valor', async () => {
      await setInStore('kv', 'user:1', { name: 'João', age: 44 });
      const result = await getFromStore<{ name: string; age: number }>('kv', 'user:1');
      expect(result).toEqual({ name: 'João', age: 44 });
    });

    it('retorna undefined para chave inexistente', async () => {
      const result = await getFromStore('kv', 'inexistente');
      expect(result).toBeUndefined();
    });

    it('sobrescreve valor existente', async () => {
      await setInStore('kv', 'count', 1);
      await setInStore('kv', 'count', 2);
      const result = await getFromStore<number>('kv', 'count');
      expect(result).toBe(2);
    });

    it('suporta arrays', async () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      await setInStore('web-vitals', 'metrics', arr);
      const result = await getFromStore<typeof arr>('web-vitals', 'metrics');
      expect(result).toEqual(arr);
    });
  });

  describe('deleteFromStore', () => {
    it('remove valor existente', async () => {
      await setInStore('kv', 'key', 'value');
      await deleteFromStore('kv', 'key');
      const result = await getFromStore('kv', 'key');
      expect(result).toBeUndefined();
    });

    it('retorna true ao deletar chave inexistente (no-op)', async () => {
      const result = await deleteFromStore('kv', 'inexistente');
      expect(result).toBe(true);
    });
  });

  describe('getAllKeys', () => {
    it('lista todas as keys', async () => {
      await setInStore('kv', 'a', 1);
      await setInStore('kv', 'b', 2);
      await setInStore('kv', 'c', 3);
      const keys = await getAllKeys('kv');
      expect(keys.sort()).toEqual(['a', 'b', 'c']);
    });

    it('retorna array vazio para store sem keys', async () => {
      const keys = await getAllKeys('kv');
      expect(keys).toEqual([]);
    });
  });

  describe('clearStore', () => {
    it('limpa todas as keys', async () => {
      await setInStore('kv', 'a', 1);
      await setInStore('kv', 'b', 2);
      await clearStore('kv');
      const keys = await getAllKeys('kv');
      expect(keys).toEqual([]);
    });
  });

  describe('countStore', () => {
    it('conta entries', async () => {
      await setInStore('kv', 'a', 1);
      await setInStore('kv', 'b', 2);
      const count = await countStore('kv');
      expect(count).toBe(2);
    });

    it('retorna 0 para store vazio', async () => {
      const count = await countStore('kv');
      expect(count).toBe(0);
    });
  });
});
