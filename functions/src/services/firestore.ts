/**
 * Helper para Firestore com tipagem.
 *
 * CRÍTICO: Cloud Functions Gen 2 cria app admin com nome `__FIREBASE_FUNCTIONS_SDK__`
 * (NÃO `[DEFAULT]`). `admin.firestore()` falha com
 * "The default Firebase app does not exist" se chamado sem app explícito.
 *
 * Solução: pega o app já inicializado, ou cria um com nome se não houver.
 */
import * as admin from 'firebase-admin';

let cachedApp: admin.app.App | null = null;

function getOrCreateApp(): admin.app.App {
  if (cachedApp) return cachedApp;
  const apps = admin.apps;
  if (apps.length > 0) {
    cachedApp = apps[0];
    return cachedApp;
  }
  cachedApp = admin.initializeApp();
  return cachedApp;
}

export function getFirestore() {
  return admin.firestore(getOrCreateApp());
}

export { FieldValue, Timestamp } from 'firebase-admin/firestore';
