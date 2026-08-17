/**
 * Admin stats — métricas gerais da plataforma.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/env';
import { assertAdmin } from '../middleware/auth';

export const adminGetPlatformStats = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdmin(request.auth.uid);

    const [users, admins, conversas, mensagens, eventosAuditoria] = await Promise.all([
      db.collection('users').get(),
      db.collection('admins').get(),
      db.collectionGroup('conversas').get(),
      db.collectionGroup('messages').get(),
      db.collection('audit').get(),
    ]);

    // Métricas por coleção do user
    const colecoes = ['treinos', 'partidas', 'peso', 'dores', 'sono', 'refeicoes', 'torneios', 'avaliacoes'];
    const counts: Record<string, number> = {};
    await Promise.all(
      colecoes.map(async (c) => {
        const snap = await db.collectionGroup(c).get();
        counts[c] = snap.size;
      }),
    );

    // Últimos 7 dias
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const usuariosAtivos = users.docs.filter((d) => {
      const lastSeen = d.data().lastSeen;
      return lastSeen && lastSeen.toDate && lastSeen.toDate() > seteDiasAtras;
    }).length;

    return {
      totalUsers: users.size,
      totalAdmins: admins.size,
      usuariosAtivos7d: usuariosAtivos,
      totalConversas: conversas.size,
      totalMensagens: mensagens.size,
      registrosPorColecao: counts,
      totalEventosAuditoria: eventosAuditoria.size,
      atualizadoEm: new Date().toISOString(),
    };
  },
);
