/**
 * Bootstrap admin — primeiro user vira admin master automaticamente.
 * Já é feito no onUserCreated, mas exposto também como callable
 * para setup manual.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/env';
import { globalCol } from '../config/namespace';
import * as admin from 'firebase-admin';

export const bootstrapAdmin = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');

    // Verifica se já existe algum master
    const masters = await db.collection(globalCol('admin')).doc('admins').collection('admins').where('role', '==', 'master').limit(1).get();
    if (!masters.empty) {
      throw new HttpsError('failed-precondition', 'Já existe um admin master.');
    }

    // Promove o user atual para master
    await db.collection(globalCol('admin')).doc('admins').collection('admins').doc(request.auth.uid).set(
      {
        uid: request.auth.uid,
        email: request.auth.token.email || '',
        displayName: request.auth.token.name || 'Admin Master',
        role: 'master',
        active: true,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        grantedBy: 'self-bootstrap',
      },
      { merge: true },
    );

    return { ok: true, message: 'Você agora é admin master.' };
  },
);
