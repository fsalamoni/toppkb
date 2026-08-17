import * as functions from 'firebase-functions/v2/scheduler';
import { db, logger, RETENTION_REGISTROS_DIAS, RETENTION_CONVERSAS_DIAS } from '../config/env';
import { responderComoAgente, carregarContextoUsuario } from '../services/ai/orquestrador';
import { AgenteId } from '../services/ai/router';
import * as admin from 'firebase-admin';

/**
 * Limpeza diária — remove registros antigos.
 * Roda às 03:00 BRT.
 */
export const cleanupOldRecords = functions.onSchedule(
  { schedule: '0 3 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger('scheduled.cleanup.start');

    const cutoffRegistros = new Date(Date.now() - RETENTION_REGISTROS_DIAS * 24 * 60 * 60 * 1000);
    const cutoffConversas = new Date(Date.now() - RETENTION_CONVERSAS_DIAS * 24 * 60 * 60 * 1000);

    // Lista todos os users
    const usersSnap = await db.collection('users').get();
    let totalDeletados = 0;

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const ref = db.collection('users').doc(uid);

      // Limpa registros antigos
      for (const colecao of ['treinos', 'partidas', 'dores', 'peso', 'refeicoes']) {
        const snap = await ref
          .collection(colecao)
          .where('data', '<', cutoffRegistros.toISOString())
          .limit(500)
          .get();
        if (snap.size > 0) {
          const batch = db.batch();
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          totalDeletados += snap.size;
        }
      }

      // Limpa conversas antigas
      const convSnap = await ref
        .collection('conversas')
        .where('updatedAt', '<', admin.firestore.Timestamp.fromDate(cutoffConversas))
        .limit(100)
        .get();
      for (const convDoc of convSnap.docs) {
        const msgs = await convDoc.ref.collection('messages').get();
        const batch = db.batch();
        msgs.docs.forEach((m) => batch.delete(m.ref));
        batch.delete(convDoc.ref);
        await batch.commit();
        totalDeletados += msgs.size + 1;
      }
    }

    logger('scheduled.cleanup.done', { totalDeletados });
  },
);

/**
 * Gera resumo semanal (domingo 20:00 BRT) para cada user.
 */
export const generateWeeklySummaries = functions.onSchedule(
  { schedule: '0 20 * * 0', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger('scheduled.weeklySummary.start');

    const usersSnap = await db.collection('users').get();
    let gerados = 0;

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const consent = userDoc.data().consent;
      if (!consent) continue;

      try {
        const ctx = await carregarContextoUsuario(uid);
        const prompt = `Gere um resumo da semana atual do atleta em 2-3 parágrafos.
Foque em: peso, treinos, dores, vitórias/derrotas, destaques.
Use tom motivador e direto. Termine com 1-2 sugestões para a próxima semana.

DADOS:
- Peso atual: ${ctx.pesoAtual}kg (meta: ${ctx.pesoMeta}kg)
- Último treino: ${ctx.ultimoTreino ? JSON.stringify(ctx.ultimoTreino) : 'nenhum'}
- Última dor: ${ctx.ultimaDor ? JSON.stringify(ctx.ultimaDor) : 'nenhuma'}

Responda SEM prefixo.`;

        const { texto } = await responderComoAgente(uid, 'estrategista' as AgenteId, prompt, 'resumo-semanal', true);

        // Salva em agregados
        const hoje = new Date().toISOString().slice(0, 10);
        await db
          .collection('users').doc(uid)
          .collection('agregados')
          .doc(`resumo-${hoje}`)
          .set({
            tipo: 'resumo-semanal',
            data: new Date().toISOString(),
            texto,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

        gerados++;
      } catch (e: any) {
        logger('scheduled.weeklySummary.error', { uid, message: e.message });
      }
    }

    logger('scheduled.weeklySummary.done', { gerados });
  },
);

/**
 * Verifica dor aguda (>= 7/10) e marca como alerta.
 * Roda a cada 6h.
 */
export const checkAcutePain = functions.onSchedule(
  { schedule: '0 */6 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger('scheduled.painCheck.start');

    const limite = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const snap = await db.collectionGroup('dores')
      .where('intensidade', '>=', 7)
      .where('data', '>=', limite)
      .get();

    let alertas = 0;
    for (const doc of snap.docs) {
      if (doc.data().alertaAtivado) continue;
      await doc.ref.update({ alertaAtivado: true });
      alertas++;
    }

    logger('scheduled.painCheck.done', { alertas });
  },
);
