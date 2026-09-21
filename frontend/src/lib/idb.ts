/**
 * idb.ts — IndexedDB wrapper para cache offline de dados do Firestore
 *
 * Implementação leve sem dependências externas (usa API nativa).
 *
 * Estratégia de cache:
 * - Store genérico com TTL configurável
 * - Cada entry tem: { value, expiresAt, cachedAt }
 * - Auto-expira após TTL (default: 1h)
 * - Fallback gracioso se IndexedDB indisponível (ex: SSR/incognito)
 *
 * Uso:
 *   await idbSet('treinos:u1', data, { ttl: 3600 });
 *   const data = await idbGet('treinos:u1');
 */
const DB_NAME = 'toppkb';
const DB_VERSION = 1;
const STORE = 'kv';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

async function openDB(): Promise<IDBDatabase | null> {
  if (!isAvailable()) return null;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn('[idb] open falhou:', req.error);
      resolve(null);
    };
    req.onblocked = () => {
      console.warn('[idb] open bloqueado');
      resolve(null);
    };
  });

  return dbPromise;
}

interface SetOptions {
  /** Tempo de vida em segundos. Default: 1h. 0 = sem expiração. */
  ttl?: number;
}

interface Entry<T> {
  value: T;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Salva um valor no IndexedDB.
 *
 * @param key Chave (qualquer string)
 * @param value Valor (deve ser JSON-serializável)
 * @param options.ttl Tempo de vida em segundos (default 1h, 0 = permanente)
 */
export async function idbSet<T>(
  key: string,
  value: T,
  options: SetOptions = {},
): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  const ttl = options.ttl ?? 3600;
  const entry: Entry<T> = {
    value,
    cachedAt: Date.now(),
    expiresAt: ttl === 0 ? Infinity : Date.now() + ttl * 1000,
  };

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => {
      console.warn('[idb] set falhou:', tx.error);
      resolve(false);
    };
  });
}

/**
 * Recupera valor do IndexedDB.
 *
 * @returns Valor ou null se não existir / expirado
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      const entry = req.result as Entry<T> | undefined;
      if (!entry) {
        resolve(null);
        return;
      }
      if (entry.expiresAt !== Infinity && entry.expiresAt < Date.now()) {
        // Expirado
        resolve(null);
        return;
      }
      resolve(entry.value);
    };
    req.onerror = () => {
      console.warn('[idb] get falhou:', req.error);
      resolve(null);
    };
  });
}

/**
 * Remove valor do IndexedDB.
 */
export async function idbDelete(key: string): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

/**
 * Lista todas as keys do store (com prefixo opcional).
 */
export async function idbKeys(prefix?: string): Promise<string[]> {
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => {
      const allKeys = req.result as string[];
      const filtered = prefix
        ? allKeys.filter((k) => k.startsWith(prefix))
        : allKeys;
      resolve(filtered);
    };
    req.onerror = () => resolve([]);
  });
}

/**
 * Limpa todas as entradas expiradas.
 *
 * @returns Quantas entradas foram removidas
 */
export async function idbClearExpired(): Promise<number> {
  const db = await openDB();
  if (!db) return 0;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    let removed = 0;
    req.onsuccess = () => {
      const entries = req.result as Array<Entry<any> & { key: string }>;
      for (const e of entries) {
        if (e.expiresAt !== Infinity && e.expiresAt < Date.now()) {
          store.delete(e.cachedAt);
          removed++;
        }
      }
    };
    tx.oncomplete = () => resolve(removed);
    tx.onerror = () => resolve(0);
  });
}

/**
 * Limpa TUDO (use com cuidado — apaga todo o cache).
 */
export async function idbClear(): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}
