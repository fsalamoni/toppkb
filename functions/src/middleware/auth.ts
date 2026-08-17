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
