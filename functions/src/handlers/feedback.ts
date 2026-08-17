/**
 * Handler de feedback — permite ao usuário avaliar mensagens da IA.
 *
 * Thumbs up/down é salvo no metadata da mensagem.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/env';
import { logger } from 'firebase-functions';

export const saveFeedback = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const { messageId, conversaId, feedbackPositivo, comentario } = request.data as {
      messageId: string;
      conversaId: string;
      feedbackPositivo: boolean;
      comentario?: string;
    };
    if (!messageId || !conversaId) {
      throw new HttpsError('invalid-argument', 'messageId e conversaId obrigatórios');
    }
    if (typeof feedbackPositivo !== 'boolean') {
      throw new HttpsError('invalid-argument', 'feedbackPositivo deve ser boolean');
    }

    const msgRef = db
      .collection('users').doc(request.auth.uid)
      .collection('conversas').doc(conversaId)
      .collection('messages').doc(messageId);

    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) {
      throw new HttpsError('not-found', 'Mensagem não encontrada');
    }

    await msgRef.update({
      'metadata.feedbackPositivo': feedbackPositivo,
      'metadata.feedbackComentario': comentario || null,
      'metadata.feedbackAt': new Date(),
    });

    // Audit
    await db.collection('audit').add({
      uid: request.auth.uid,
      acao: 'feedback.saved',
      metadata: { messageId, conversaId, feedbackPositivo },
      timestamp: new Date(),
    });

    logger.info('feedback.saved', { uid: request.auth.uid, messageId, feedbackPositivo });
    return { ok: true };
  },
);
