import * as admin from 'firebase-admin';
import { getOrCreateApp } from './firestore-shim';
import { createNamespacedFirestore } from './db-namespace';

// Strings não-secretas (lê de env ou process.env)
export const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:5173';
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5173';
export const APP_VERSION = process.env.APP_VERSION || '0.1.0';

// Limites
export const RATE_LIMIT_CHAT_PER_MINUTE = 20;
export const RATE_LIMIT_REGISTRO_PER_MINUTE = 60;
export const RETENTION_REGISTROS_DIAS = 1825;
export const RETENTION_CONVERSAS_DIAS = 365;

// Helper para acessar admin DB
// IMPORTANTE: Cloud Functions Gen 2 cria app com nome `__FIREBASE_FUNCTIONS_SDK__`.
// `admin.firestore()` (sem app) falha. Usamos Proxy para SEMPRE passar o app certo.
const getApp = () => getOrCreateApp();

// db: instância do Firestore com ISOLAMENTO automático no namespace toppkb_.
// (Ver config/db-namespace.ts — toda raiz vira toppkb_*.)
export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop: string) {
    const inst = createNamespacedFirestore(admin.firestore(getApp()));
    const value = (inst as any)[prop];
    return typeof value === 'function' ? value.bind(inst) : value;
  },
}) as admin.firestore.Firestore;

export const auth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop: string) {
    const inst = admin.auth(getApp());
    const value = (inst as any)[prop];
    return typeof value === 'function' ? value.bind(inst) : value;
  },
}) as admin.auth.Auth;

export const storage = new Proxy({} as admin.storage.Storage, {
  get(_target, prop: string) {
    const inst = admin.storage(getApp());
    const value = (inst as any)[prop];
    return typeof value === 'function' ? value.bind(inst) : value;
  },
}) as admin.storage.Storage;

// Logging helper
export const logger = (msg: string, data?: Record<string, unknown>) => {
  if (data) {
    console.log(JSON.stringify({ msg, ...data, timestamp: new Date().toISOString() }));
  } else {
    console.log(msg);
  }
};
