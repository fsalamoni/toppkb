/**
 * Admin stats — métricas gerais da plataforma.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/env';
import { globalCol } from '../config/namespace';
import { filterToppkbDocs } from '../config/db-namespace';
import { assertAdmin } from '../middleware/auth';

export const adminGetPlatformStats = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdmin(request.auth.uid);

    const [users, admins, conversas, mensagens, eventosAuditoria] = await Promise.all([
      db.collection(globalCol('users')).get(),
      db.collection(globalCol('admin')).doc('admins').collection('admins').get(),
      db.collectionGroup('chat').get(),
      db.collectionGroup('mensagens').get(),
      db.collection(globalCol('admin')).doc('audit_logs').collection('logs').get(),
    ]);

    // Métricas por coleção do user
    const colecoes = ['treinos', 'partidas', 'peso', 'dores', 'sono', 'refeicoes', 'torneios', 'avaliacoes'];
    const counts: Record<string, number> = {};
    await Promise.all(
      colecoes.map(async (c) => {
        const snap = await db.collectionGroup(c).get();
        counts[c] = filterToppkbDocs(snap.docs).length;
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
      totalConversas: filterToppkbDocs(conversas.docs).length,
      totalMensagens: filterToppkbDocs(mensagens.docs).length,
      registrosPorColecao: counts,
      totalEventosAuditoria: eventosAuditoria.size,
      atualizadoEm: new Date().toISOString(),
    };
  },
);
