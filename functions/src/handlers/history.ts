/**
 * Handler de histórico — listar conversas e mensagens.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/env';
import { globalCol } from '../config/namespace';
import { listConversations } from '../services/history';

export const listConversationsHandler = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const conversas = await listConversations(request.auth.uid, 100);
    return { items: conversas };
  },
);

export const listMessagesHandler = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const { conversaId, limit = 200 } = request.data as { conversaId: string; limit?: number };
    if (!conversaId) throw new HttpsError('invalid-argument', 'conversaId obrigatório');

    const snap = await db
      .collection(globalCol('users')).doc(request.auth.uid)
      .collection('chat').doc(conversaId)
      .collection('mensagens')
      .orderBy('createdAt', 'asc')
      .limit(Math.min(limit, 500))
      .get();

    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  },
);

export const deleteConversaHandler = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const { conversaId } = request.data as { conversaId: string };
    if (!conversaId) throw new HttpsError('invalid-argument', 'conversaId obrigatório');

    const ref = db
      .collection(globalCol('users')).doc(request.auth.uid)
      .collection('chat').doc(conversaId);

    // Deleta mensagens
    const msgs = await ref.collection('mensagens').get();
    const batch = db.batch();
    msgs.docs.forEach((m) => batch.delete(m.ref));
    batch.delete(ref);
    await batch.commit();

    return { ok: true };
  },
);
