import { auth } from 'firebase-functions';
import { getFirestore } from '../services/firestore';

/**
 * Verifica se o usuário é admin master.
 * Lança Error se não for.
 */
export async function assertAdminMaster(uid: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.doc(`admins/${uid}`).get();
  if (!snap.exists) {
    throw new auth.HttpsError('permission-denied', 'Apenas admin master.');
  }
  const data = snap.data() as Record<string, unknown> | undefined;
  if (!data || data.role !== 'master' || data.active === false) {
    throw new auth.HttpsError('permission-denied', 'Apenas admin master.');
  }
}

/**
 * Verifica se o usuário é admin (qualquer papel).
 */
export async function assertAdmin(uid: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.doc(`admins/${uid}`).get();
  if (!snap.exists) {
    throw new auth.HttpsError('permission-denied', 'Apenas admins.');
  }
  const data = snap.data() as Record<string, unknown> | undefined;
  if (data?.active === false) {
    throw new auth.HttpsError('permission-denied', 'Admin desativado.');
  }
}

/**
 * Tipo da request autenticada (mutação da Express Request).
 */
export interface AuthedUser {
  uid: string;
  email?: string;
  role: 'user' | 'admin' | 'master';
}

/**
 * Middleware Express que valida o token Bearer (Firebase ID Token).
 * Adiciona `req.user = { uid, email, role }`.
 * Usa `any` para request/response/next por compatibilidade com Express.
 */
export async function authMiddleware(
  req: any,
  res: any,
  next: any,
): Promise<void> {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: { code: 'unauthenticated', message: 'Token ausente' } });
    return;
  }
  try {
    const token = match[1];
    const admin = await import('firebase-admin');
    const decoded = await admin.auth().verifyIdToken(token);
    const user: AuthedUser = { uid: decoded.uid, email: decoded.email, role: 'user' };
    // checa role
    const db = getFirestore();
    const adminSnap = await db.doc(`admins/${decoded.uid}`).get();
    if (adminSnap.exists) {
      const data = adminSnap.data() as any;
      if (data?.active !== false) {
        user.role = data.role === 'master' ? 'master' : 'admin';
      }
    }
    req.user = user;
    next();
  } catch (e: any) {
    res.status(401).json({ error: { code: 'invalid_token', message: e.message } });
  }
}
