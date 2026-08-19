import * as functions from 'firebase-functions/v2/scheduler';
import { db, logger, RETENTION_REGISTROS_DIAS, RETENTION_CONVERSAS_DIAS } from '../config/env';
import { globalCol } from '../config/namespace';
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

    const usersSnap = await db.collection(globalCol('users')).get();
    let totalDeletados = 0;

    for (const u of usersSnap.docs) {
      const uid = u.id;
      const ref = db.collection(globalCol('users')).doc(uid);

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

      const convSnap = await ref
        .collection('chat').doc('conversas').collection('conversas')
        .where('updatedAt', '<', admin.firestore.Timestamp.fromDate(cutoffConversas))
        .limit(100)
        .get();
      for (const convDoc of convSnap.docs) {
        const msgs = await convDoc.ref.collection('mensagens').get();
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

    const usersSnap = await db.collection(globalCol('users')).get();
    let gerados = 0;

    for (const u of usersSnap.docs) {
      const uid = u.id;
      const consent = u.data().consent;
      if (!consent) continue;

      try {
        const ctx = await carregarContextoUsuario(uid);

        // Coleta métricas da semana
        const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [treinos, partidas, dores] = await Promise.all([
          db.collection(globalCol('users')).doc(uid).collection('treinos').where('data', '>=', semanaAtras.toISOString()).get(),
          db.collection(globalCol('users')).doc(uid).collection('partidas').where('data', '>=', semanaAtras.toISOString()).get(),
          db.collection(globalCol('users')).doc(uid).collection('dores').where('data', '>=', semanaAtras.toISOString()).get(),
        ]);

        const horasTreino = treinos.docs.reduce((acc, d) => acc + (d.data().duracaoMin || 0), 0) / 60;
        const vitorias = partidas.docs.filter((d) => d.data().resultado === 'vitoria').length;
        const derrotas = partidas.docs.filter((d) => d.data().resultado === 'derrota').length;
        const episodiosDor = dores.docs.filter((d) => d.data().intensidade >= 4).length;

        const prompt = `Gere um resumo da semana atual do atleta em 2-3 parágrafos.
Foque em: peso, treinos, dores, vitórias/derrotas, destaques.
Use tom motivador e direto. Termine com 1-2 sugestões para a próxima semana.

DADOS DA SEMANA:
- Peso atual: ${ctx.pesoAtual}kg (meta: ${ctx.pesoMeta}kg)
- Horas de treino: ${horasTreino.toFixed(1)}h
- Partidas: ${vitorias}V ${derrotas}D
- Episódios de dor moderada/alta: ${episodiosDor}
- Último treino: ${ctx.ultimoTreino ? JSON.stringify(ctx.ultimoTreino).slice(0, 200) : 'nenhum'}

Responda SEM prefixo.`;

        const { texto } = await responderComoAgente(uid, 'estrategista' as AgenteId, prompt, 'resumo-semanal');

        const hoje = new Date().toISOString().slice(0, 10);
        await db
          .collection(globalCol('users')).doc(uid)
          .collection('agregados')
          .doc(`resumo-semanal-${hoje}`)
          .set({
            tipo: 'resumo-semanal',
            data: new Date().toISOString(),
            texto,
            metricas: { horasTreino, vitorias, derrotas, episodiosDor },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

        // Também atualiza no user doc (campo simples)
        await db.collection(globalCol('users')).doc(uid).update({
          'agregados.ultimoResumo': texto,
          'agregados.ultimoResumoEm': admin.firestore.FieldValue.serverTimestamp(),
        });

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

/**
 * Agrega métricas globais (semanal).
 * Roda domingo 23:00.
 */
export const aggregateAnalytics = functions.onSchedule(
  { schedule: '0 23 * * 0', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger('scheduled.aggregate.start');

    const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [users, messages, errors] = await Promise.all([
      db.collection(globalCol('users')).where('createdAt', '>=', umaSemanaAtras).get().catch(() => ({ size: 0, docs: [] } as any)),
      db.collectionGroup('messages').where('createdAt', '>=', umaSemanaAtras).get().catch(() => ({ size: 0, docs: [] } as any)),
      db.collection('analytics').where('event', '==', 'error').where('timestamp', '>=', umaSemanaAtras).get().catch(() => ({ size: 0, docs: [] } as any)),
    ]);

    const summary = {
      novosUsuariosSemana: users.size,
      mensagensChatSemana: messages.size,
      errosSemana: errors.size,
      geradoEm: new Date().toISOString(),
    };

    await db.collection('system').doc('analytics-weekly').set(summary, { merge: true });

    logger('scheduled.aggregate.done', summary);
  },
);
