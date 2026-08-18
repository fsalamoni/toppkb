/**
 * Firestore shim para Cloud Functions Gen 2.
 *
 * PROBLEMA: firebase-functions Gen 2 cria app admin com nome `__FIREBASE_FUNCTIONS_SDK__`
 * (NÃO `[DEFAULT]`). `admin.firestore()` sem app falha com
 * "The default Firebase app does not exist".
 *
 * SOLUÇÃO: monkey-patch `admin.firestore` para usar o app criado.
 * Chamado uma vez no module load.
 */
import * as admin from 'firebase-admin';

let initialized = false;
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
 * Patch global que faz `admin.firestore()` retornar o firestore
 * do app com nome `__TOPPKB_FUNCTIONS_SDK__` (ou qualquer um se já existir).
 */
export function initAdminSdk(): void {
  if (initialized) return;
  initialized = true;

  const app = getOrCreateApp();

  // Substitui `admin.firestore()` para sempre usar o app
  const originalFirestore = admin.firestore.bind(admin);
  (admin as any).firestore = function firestore(appArg?: any) {
    if (appArg) return originalFirestore(appArg);
    return originalFirestore(app);
  };

  // Mesmo para auth e storage
  const originalAuth = admin.auth.bind(admin);
  (admin as any).auth = function auth(appArg?: any) {
    if (appArg) return originalAuth(appArg);
    return originalAuth(app);
  };

  const originalStorage = admin.storage.bind(admin);
  (admin as any).storage = function storage(appArg?: any) {
    if (appArg) return originalStorage(appArg);
    return originalStorage(app);
  };
}
