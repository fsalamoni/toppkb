import * as admin from 'firebase-admin';
import { getOrCreateApp } from './firestore-shim';

// Strings não-secretas (lê de env ou process.env)
export const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:5173';
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5173';
export const APP_VERSION = process.env.APP_VERSION || '0.1.0';

// Limites
export const RATE_LIMIT_CHAT_PER_MINUTE = 20;
export const RATE_LIMIT_REGISTRO_PER_MINUTE = 60;
export const RETENTION_REGISTROS_DIAS = 1825;
export const RETENTION_CONVERSAS_DIAS = 365;

// Pega o app (já inicializado em index.ts via initAdminSdk + admin.initializeApp)
const app = getOrCreateApp();

// Helper para acessar admin DB
export const db = admin.firestore(app);
export const auth = admin.auth(app);
export const storage = admin.storage(app);

// Logging helper
export const logger = (msg: string, data?: Record<string, unknown>) => {
  if (data) {
    console.log(JSON.stringify({ msg, ...data, timestamp: new Date().toISOString() }));
  } else {
    console.log(msg);
  }
};
