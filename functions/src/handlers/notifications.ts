/**
 * Push notifications handler
 *
 * - savePushSubscription: salva subscription do browser do user em /toppkb_users/{uid}/push/{endpoint_hash}
 * - removePushSubscription: remove subscription
 * - getPushConfig: retorna config de lembretes do user
 * - setPushConfig: atualiza config de lembretes
 * - sendDailyReminders: scheduled function que envia lembretes diários (hidratação, treino, sono, torneio)
 *
 * Lição crítica: usar `db` do env (Proxy) que sempre passa o app certo para Gen 2.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as functions from 'firebase-functions/v2/scheduler';
import * as webpush from 'web-push';
import { db, logger } from '../config/env';
import { userSubCol, globalDoc } from '../config/namespace';

// VAPID keys — setar via `firebase functions:secrets:set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY`
// Em dev, fallback hard-coded (NÃO usar em prod real)
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BAbc123...placeholder';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'xyz...placeholder';
const VAPID_SUBJECT = 'mailto:contato@toppkb.app';

if (VAPID_PUBLIC && VAPID_PRIVATE && !VAPID_PUBLIC.startsWith('BAbc123')) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

interface PushConfig {
  hidratacao?: { enabled: boolean; hora: string /* HH:mm */ };
  treino?: { enabled: boolean; hora: string; diasSemana: number[] /* 0-6 */ };
  sono?: { enabled: boolean; hora: string /* HH:mm (deitar) */ };
  torneio?: { enabled: boolean; antecedenciaDias: number };
  dorCheck?: { enabled: boolean; diaSemana: number /* 0-6 */ };
  enabled?: boolean;
}

const DEFAULT_PUSH_CONFIG: PushConfig = {
  hidratacao: { enabled: true, hora: '10:00' },
  treino: { enabled: true, hora: '18:00', diasSemana: [1, 3, 5] }, // seg/qua/sex
  sono: { enabled: true, hora: '22:30' },
  torneio: { enabled: true, antecedenciaDias: 1 },
  dorCheck: { enabled: true, diaSemana: 1 }, // segunda
  enabled: true,
};

/** Salva subscription do browser do user (chamado pelo frontend após pedir permissão) */
export const savePushSubscription = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Faça login');
  const uid = req.auth.uid;
  const sub = req.data?.subscription as any;
  if (!sub?.endpoint) throw new HttpsError('invalid-argument', 'Subscription inválida');

  // Hash do endpoint para usar como ID
  const endpointHash = Buffer.from(sub.endpoint).toString('base64').replace(/[/+=]/g, '_').slice(0, 64);

  await db.doc(`${userSubCol(uid, 'push', endpointHash)}`).set({
    endpoint: sub.endpoint,
    keys: sub.keys,
    createdAt: new Date().toISOString(),
    userAgent: req.data?.userAgent || null,
  });

  // Garante que o profile tem pushConfig
  const profileRef = db.doc(`${userSubCol(uid, 'profile', 'main')}`);
  const profileSnap = await profileRef.get();
  if (profileSnap.exists && !profileSnap.data()?.pushConfig) {
    await profileRef.set({ pushConfig: DEFAULT_PUSH_CONFIG }, { merge: true });
  }

  logger('push.subscription.saved', { uid, endpointHash });
  return { ok: true };
});

/** Remove subscription (chamado no logout ou ao revogar permissão) */
export const removePushSubscription = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Faça login');
  const uid = req.auth.uid;
  const endpoint = req.data?.endpoint as string;
  if (!endpoint) throw new HttpsError('invalid-argument', 'Endpoint obrigatório');

  const endpointHash = Buffer.from(endpoint).toString('base64').replace(/[/+=]/g, '_').slice(0, 64);
  await db.doc(`${userSubCol(uid, 'push', endpointHash)}`).delete();
  logger('push.subscription.removed', { uid });
  return { ok: true };
});

/** Retorna config de lembretes (com defaults aplicados) */
export const getPushConfig = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Faça login');
  const uid = req.auth.uid;
  const profileSnap = await db.doc(`${userSubCol(uid, 'profile', 'main')}`).get();
  const cfg = (profileSnap.data()?.pushConfig as PushConfig) || DEFAULT_PUSH_CONFIG;
  return { config: { ...DEFAULT_PUSH_CONFIG, ...cfg } };
});

/** Atualiza config de lembretes */
export const setPushConfig = onCall<{ config: PushConfig }>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Faça login');
  const uid = req.auth.uid;
  const cfg = req.data?.config;
  if (!cfg) throw new HttpsError('invalid-argument', 'Config obrigatória');

  await db.doc(`${userSubCol(uid, 'profile', 'main')}`).set(
    { pushConfig: cfg, pushConfigUpdatedAt: new Date().toISOString() },
    { merge: true },
  );
  logger('push.config.updated', { uid });
  return { ok: true };
});

/** Helper: envia push para todas as subscriptions ativas do user */
async function sendPushToUser(
  uid: string,
  payload: { title: string; body: string; url?: string; tag?: string; requireInteraction?: boolean },
): Promise<{ sent: number; failed: number }> {
  const subsSnap = await db.collection(`${userSubCol(uid, 'push')}`).get();
  let sent = 0;
  let failed = 0;

  if (subsSnap.empty) return { sent, failed };

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'toppkb',
    renotify: true,
    requireInteraction: payload.requireInteraction || false,
    data: { url: payload.url || '/app/dashboard' },
  });

  await Promise.all(
    subsSnap.docs.map(async (subDoc) => {
      const sub = subDoc.data() as any;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          json,
        );
        sent++;
      } catch (e: any) {
        failed++;
        // Se subscription inválida (404, 410), remove
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await subDoc.ref.delete().catch(() => {});
        }
        logger('push.send.failed', { uid, error: e?.message, status: e?.statusCode });
      }
    }),
  );

  return { sent, failed };
}

/** Helper: retorna hora atual em BRT (America/Sao_Paulo) */
function nowBrt(): { hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'sun';
  const weekdayMap: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6 };
  const weekday = weekdayMap[weekdayStr] ?? 0;
  return { hour, minute, weekday };
}

/** Helper: minutos do dia (0-1439) */
function minutesOfDay(h: number, m: number): number {
  return h * 60 + m;
}

/** Scheduled: envia lembretes diários.
 *  Roda a cada 15 min — verifica se é hora de enviar lembrete para algum user.
 *  Janela de match: ±7 min para evitar drift.
 */
export const sendDailyReminders = functions.onSchedule(
  { schedule: '*/15 * * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger('scheduled.reminders.start');
    const now = nowBrt();
    const nowMin = minutesOfDay(now.hour, now.minute);
    const WINDOW = 7;

    // Pega todos os users com pushConfig habilitado
    const usersSnap = await db.collection(globalDoc('users', '').split('/').slice(0, -1).join('/')).get();
    let totalSent = 0;
    let totalFailed = 0;

    for (const u of usersSnap.docs) {
      const uid = u.id;
      const data = u.data();
      if (!data?.consent) continue;

      const cfg = (data.pushConfig as PushConfig) || DEFAULT_PUSH_CONFIG;
      if (cfg.enabled === false) continue;

      // Verifica se tem subscription
      const subsCount = (await db.collection(`${userSubCol(uid, 'push')}`).count().get()).data().count;
      if (subsCount === 0) continue;

      // 1) Lembrete de hidratação (se habilitado e hora bate)
      if (cfg.hidratacao?.enabled) {
        const [h, m] = (cfg.hidratacao.hora || '10:00').split(':').map(Number);
        const target = minutesOfDay(h, m);
        if (Math.abs(nowMin - target) <= WINDOW) {
          // Não envia se já bebeu hoje (>500ml)
          const todayKey = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
          }).format(new Date()).split('/').reverse().join('-');
          const hidSnap = await db.collection(`${userSubCol(uid, 'hidratacao')}`)
            .where('data', '==', todayKey).get();
          const totalMl = hidSnap.docs.reduce((acc, d) => acc + (d.data().totalMl || 0), 0);
          if (totalMl < 500) {
            const r = await sendPushToUser(uid, {
              title: '💧 Hora de beber água',
              body: `Você bebeu só ${totalMl}ml hoje. Meta: 2800ml.`,
              url: '/app/hidratacao',
              tag: 'hidratacao',
            });
            totalSent += r.sent; totalFailed += r.failed;
          }
        }
      }

      // 2) Lembrete de treino (se habilitado e hora bate + dia da semana bate)
      if (cfg.treino?.enabled) {
        const [h, m] = (cfg.treino.hora || '18:00').split(':').map(Number);
        const target = minutesOfDay(h, m);
        const dias = cfg.treino.diasSemana || [1, 3, 5];
        if (dias.includes(now.weekday) && Math.abs(nowMin - target) <= WINDOW) {
          // Não envia se já treinou hoje
          const todayKey = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
          }).format(new Date()).split('/').reverse().join('-');
          const trSnap = await db.collection(`${userSubCol(uid, 'treinos')}`)
            .where('data', '==', todayKey).get();
          if (trSnap.empty) {
            const r = await sendPushToUser(uid, {
              title: '🏓 Hora do treino',
              body: 'Bora pra quadra? Seu corpo e mente agradecem.',
              url: '/app/treinos/novo',
              tag: 'treino',
            });
            totalSent += r.sent; totalFailed += r.failed;
          }
        }
      }

      // 3) Lembrete de sono (se habilitado e hora bate)
      if (cfg.sono?.enabled) {
        const [h, m] = (cfg.sono.hora || '22:30').split(':').map(Number);
        const target = minutesOfDay(h, m);
        if (Math.abs(nowMin - target) <= WINDOW) {
          const r = await sendPushToUser(uid, {
            title: '😴 Hora de descansar',
            body: 'Para 50+, dormir 7-9h é crucial para recuperação muscular.',
            url: '/app/sono',
            tag: 'sono',
          });
          totalSent += r.sent; totalFailed += r.failed;
        }
      }

      // 4) Lembrete de torneio (D-1, D-3, D-7)
      if (cfg.torneio?.enabled) {
        const antecedencia = cfg.torneio.antecedenciaDias || 1;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const target = new Date(hoje);
        target.setDate(target.getDate() + antecedencia);
        const targetKey = target.toISOString().slice(0, 10);
        const torneioSnap = await db.collection(`${userSubCol(uid, 'torneios')}`)
          .where('dataInicio', '==', targetKey).get();
        if (!torneioSnap.empty) {
          const torneio = torneioSnap.docs[0].data();
          const r = await sendPushToUser(uid, {
            title: `🏆 Torneio em ${antecedencia} ${antecedencia === 1 ? 'dia' : 'dias'}!`,
            body: `${torneio.nome || 'Torneio agendado'} — ${torneio.local || ''}`,
            url: '/app/torneios',
            tag: `torneio-${torneio.id || targetKey}`,
            requireInteraction: true,
          });
          totalSent += r.sent; totalFailed += r.failed;
        }
      }

      // 5) Check-in semanal de dor (segunda)
      if (cfg.dorCheck?.enabled && now.weekday === (cfg.dorCheck.diaSemana ?? 1)) {
        const [h, m] = ['09:00'].map(String)[0].split(':').map(Number);
        const target = minutesOfDay(h, m);
        if (Math.abs(nowMin - target) <= WINDOW) {
          const r = await sendPushToUser(uid, {
            title: '🤕 Check-in semanal',
            body: 'Como estão suas dores? Registre agora para acompanhamento.',
            url: '/app/dores/nova',
            tag: 'dor-check',
          });
          totalSent += r.sent; totalFailed += r.failed;
        }
      }
    }

    logger('scheduled.reminders.done', { totalSent, totalFailed });
  },
);
