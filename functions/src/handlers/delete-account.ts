/**
 * Delete account — remove conta do user e todos os dados.
 * Versão callable (onCall) do endpoint REST /deletar-conta.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/env';
import { globalCol } from '../config/namespace';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';

export const deleteAccount = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');

    const uid = request.auth.uid;

    // Rate limit: max 1 delete por dia
    const ultimasAcoes = await db.collection(globalCol('admin')).doc('audit_logs').collection('logs')
      .where('uid', '==', uid)
      .where('acao', '==', 'conta.deletada')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!ultimasAcoes.empty) {
      const ultima = ultimasAcoes.docs[0].data().timestamp.toDate();
      const diff = Date.now() - ultima.getTime();
      if (diff < 24 * 60 * 60 * 1000) {
        throw new HttpsError('failed-precondition', 'Você já deletou sua conta hoje. Tente novamente em 24h.');
      }
    }

    // Audit
    await db.collection(globalCol('admin')).doc('audit_logs').collection('logs').add({
      uid,
      acao: 'conta.deletada',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Deleta subcoleções
    const subcollections = [
      'treinos', 'partidas', 'fisio', 'forca', 'mobilidade', 'cardio',
      'refeicoes', 'agua', 'suplementos', 'peso', 'medidas', 'sono',
      'dores', 'avaliacoes', 'estudos', 'torneios', 'metas',
      'conversas', 'profile', 'settings', 'feedback', 'agregados', 'documentos',
    ];
    const ref = db.collection(globalCol('users')).doc(uid);
    for (const sub of subcollections) {
      const snap = await ref.collection(sub).get();
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Deleta user doc + admin
    await ref.delete();
    await db.collection(globalCol('admin')).doc('admins').collection('admins').doc(uid).delete().catch(() => {});

    // Deleta Auth user
    await admin.auth().deleteUser(uid);

    logger.info('account.deleted', { uid });
    return { ok: true, deletedAt: new Date().toISOString() };
  },
);
