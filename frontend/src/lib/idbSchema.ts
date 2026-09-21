/**
 * idbSchema — IndexedDB schema version + migrations
 *
 * Por que versionar?
 * - Cache local pode mudar de formato entre deploys
 * - Precisamos migrar dados antigos para nova estrutura
 * - Sem versionamento, dados podem ficar órfãos/inacessíveis
 *
 * Como funciona:
 * - DB_VERSION atual = 2
 * - Migrations: array de (db, oldVersion, newVersion) => void
 * - onupgradeneeded chama migrations em ordem
 * - Cada migration adiciona stores ou modifica estrutura
 *
 * Como adicionar migration:
 * 1. Bump DB_VERSION
 * 2. Adicionar migration ao array MIGRATIONS
 * 3. Migration roda automaticamente na próxima abertura
 */
const DB_NAME = 'toppkb';
export const DB_VERSION = 2;

/**
 * Migration function — recebe a conexão do banco e executa alterações
 */
type Migration = (db: IDBDatabase, oldVersion: number, tx: IDBTransaction) => void;

/**
 * Lista de migrations em ordem.
 * - Migration 1: cria store 'kv' (cache genérico)
 * - Migration 2: cria store 'web-vitals' (métricas) e 'sync-queue' (fila offline)
 */
export const MIGRATIONS: Migration[] = [
  // v0 → v1: store 'kv' genérico
  (db) => {
    if (!db.objectStoreNames.contains('kv')) {
      db.createObjectStore('kv');
    }
  },
  // v1 → v2: stores específicos
  (db) => {
    if (!db.objectStoreNames.contains('web-vitals')) {
      db.createObjectStore('web-vitals');
    }
    if (!db.objectStoreNames.contains('sync-queue')) {
      db.createObjectStore('sync-queue');
    }
  },
];

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Abre o banco e executa migrations conforme necessário.
 *
 * Retorna null se IndexedDB indisponível (SSR, modo privado, etc).
 */
export async function openDB(): Promise<IDBDatabase | null> {
  if (!isAvailable()) return null;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction!;
      const oldVersion = event.oldVersion;

      console.log(`[idb] Upgrading schema v${oldVersion} → v${DB_VERSION}`);

      // Executa migrations a partir de oldVersion
      // O cursor começa em oldVersion e roda cada uma
      let version = oldVersion;
      while (version < DB_VERSION) {
        const migration = MIGRATIONS[version];
        if (migration) {
          try {
            migration(db, version, tx);
          } catch (e) {
            console.error(`[idb] Migration v${version} failed:`, e);
          }
        }
        version++;
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn('[idb] open falhou:', req.error);
      resolve(null);
    };
    req.onblocked = () => {
      console.warn('[idb] open bloqueado (outras abas abertas)');
    };
  });

  return dbPromise;
}

/**
 * Helper: get de um store específico
 */
export async function getFromStore<T>(
  storeName: string,
  key: string,
): Promise<T | undefined> {
  const db = await openDB();
  if (!db) return undefined;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => {
        console.warn(`[idb] get ${storeName}/${key} falhou:`, req.error);
        resolve(undefined);
      };
    } catch (e) {
      console.warn(`[idb] get error:`, e);
      resolve(undefined);
    }
  });
}

/**
 * Helper: set em store específico
 */
export async function setInStore<T>(
  storeName: string,
  key: string,
  value: T,
): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn(`[idb] set ${storeName}/${key} falhou:`, req.error);
        resolve(false);
      };
    } catch (e) {
      console.warn(`[idb] set error:`, e);
      resolve(false);
    }
  });
}

/**
 * Helper: delete
 */
export async function deleteFromStore(storeName: string, key: string): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Helper: listar todas as keys de um store
 */
export async function getAllKeys(storeName: string): Promise<string[]> {
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as IDBValidKey[]).map((k) => String(k)));
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Helper: limpar todo um store
 */
export async function clearStore(storeName: string): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Helper: contar entries em um store
 */
export async function countStore(storeName: string): Promise<number> {
  const db = await openDB();
  if (!db) return 0;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    } catch (e) {
      resolve(0);
    }
  });
}
