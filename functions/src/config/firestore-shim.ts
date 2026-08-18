/**
 * Firestore shim para Cloud Functions Gen 2.
 *
 * PROBLEMA: firebase-functions Gen 2 cria app admin com nome `__FIREBASE_FUNCTIONS_SDK__`
 * (NÃO `[DEFAULT]`). `admin.firestore()` sem app falha com
 * "The default Firebase app does not exist".
 *
 * SOLUÇÃO: wrappers que sempre passam o app criado.
 */
import * as admin from 'firebase-admin';

let cachedApp: admin.app.App | null = null;

export function getOrCreateApp(): admin.app.App {
  if (cachedApp) return cachedApp;
  const apps = admin.apps;
  if (apps.length > 0 && apps[0]) {
    cachedApp = apps[0];
    return cachedApp;
  }
  // Fallback (não deve acontecer em Gen 2 runtime)
  cachedApp = admin.initializeApp();
  return cachedApp;
}

/**
 * Helpers que sempre passam o app explícito.
 * IMPORTANTE: usar estes em vez de admin.firestore()/admin.auth() diretamente.
 */
export function db() {
  return admin.firestore(getOrCreateApp());
}

export function auth() {
  return admin.auth(getOrCreateApp());
}

export function storage() {
  return admin.storage(getOrCreateApp());
}

export function initAdminSdk(): void {
  // Apenas garante que o app foi inicializado.
  getOrCreateApp();
}

/**
 * Proxy de admin.firestore que sempre passa o app.
 * Uso: `firestoreProxy.collection(...)` em vez de `admin.firestore().collection(...)`.
 */
export const firestoreProxy: admin.firestore.Firestore = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const inst = admin.firestore(getOrCreateApp());
    const value = (inst as any)[prop];
    if (typeof value === 'function') {
      return value.bind(inst);
    }
    return value;
  },
});
