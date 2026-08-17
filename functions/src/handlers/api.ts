import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { consentMiddleware } from '../middleware/consent';
import { rateLimit } from '../middleware/ratelimit';
import { db, logger } from '../config/env';
import { AgenteId, detectarAgente, gerarTituloConversa } from '../services/ai/router';
import { responderComoAgente } from '../services/ai/orquestrador';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';

setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

const app = express();
app.use(express.json({ limit: '5mb' }));

// CORS
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

// ============ HEALTH ============
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.APP_VERSION || '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// ============ AUTH (público) ============
app.post('/auth/send-link', async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email() });
    schema.parse(req.body);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: { code: 'validation_error', message: e.message } });
  }
});

// ============ USER ============
app.get('/user/me', authMiddleware, async (req: any, res) => {
  try {
    const snap = await db.collection('users').doc(req.uid).get();
    if (!snap.exists) {
      return res.status(404).json({ error: { code: 'not_found', message: 'Usuário não encontrado' } });
    }
    res.json({ id: snap.id, ...snap.data() });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.patch('/user/me', authMiddleware, async (req: any, res) => {
  try {
    const allowed = [
      'displayName', 'photoURL', 'preferences',
      'onboardingComplete', 'ladoDominante', 'cidade', 'estado',
      'parceiroDuplas', 'tempoDeJogoMeses', 'outrosEsportes',
      'historicoLesoes', 'pesoMeta', 'metaPosicao', 'llmConfig',
    ];
    const updates: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    await db.collection('users').doc(req.uid).update(updates);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.post('/user/accept-consent', authMiddleware, async (req: any, res) => {
  try {
    const schema = z.object({ version: z.string() });
    const { version } = schema.parse(req.body);
    await db.collection('users').doc(req.uid).set(
      {
        consent: {
          acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
          version,
        },
      },
      { merge: true },
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: { code: 'validation_error', message: e.message } });
  }
});

// ============ REGISTROS — CRUD genérico ============
const COLECOES = [
  'treinos', 'partidas', 'fisio', 'forca', 'mobilidade', 'cardio',
  'refeicoes', 'agua', 'suplementos', 'peso', 'medidas', 'sono',
  'dores', 'avaliacoes', 'estudos', 'torneios', 'metas',
];

app.post('/registros/:colecao', authMiddleware, consentMiddleware, rateLimit(60), async (req: any, res) => {
  try {
    const colecao = req.params.colecao;
    if (!COLECOES.includes(colecao)) {
      return res.status(404).json({ error: { code: 'not_found', message: 'Coleção inválida' } });
    }
    const id = uuidv4();
    const payload = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('users').doc(req.uid).collection(colecao).doc(id).set(payload);
    res.status(201).json({ id });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.get('/registros/:colecao', authMiddleware, consentMiddleware, async (req: any, res) => {
  try {
    const colecao = req.params.colecao;
    if (!COLECOES.includes(colecao)) {
      return res.status(404).json({ error: { code: 'not_found', message: 'Coleção inválida' } });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    let q: any = db.collection('users').doc(req.uid).collection(colecao).orderBy('data', 'desc').limit(limit);
    if (req.query.cursor) {
      const cursorSnap = await db.collection('users').doc(req.uid).collection(colecao).doc(req.query.cursor).get();
      q = q.startAfter(cursorSnap);
    }
    const snap = await q.get();
    res.json({
      items: snap.docs.map((d: any) => ({ id: d.id, ...d.data() })),
      hasMore: snap.docs.length === limit,
      nextCursor: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null,
    });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.put('/registros/:colecao/:id', authMiddleware, consentMiddleware, async (req: any, res) => {
  try {
    const { colecao, id } = req.params;
    if (!COLECOES.includes(colecao)) {
      return res.status(404).json({ error: { code: 'not_found', message: 'Coleção inválida' } });
    }
    const payload = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    await db.collection('users').doc(req.uid).collection(colecao).doc(id).update(payload);
    res.json({ id });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.delete('/registros/:colecao/:id', authMiddleware, consentMiddleware, async (req: any, res) => {
  try {
    const { colecao, id } = req.params;
    if (!COLECOES.includes(colecao)) {
      return res.status(404).json({ error: { code: 'not_found', message: 'Coleção inválida' } });
    }
    await db.collection('users').doc(req.uid).collection(colecao).doc(id).delete();
    res.status(204).send('');
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

// ============ CHAT IA ============
app.post('/chat/message', authMiddleware, consentMiddleware, rateLimit(20), async (req: any, res) => {
  const startTime = Date.now();
  try {
    const schema = z.object({
      conversaId: z.string().optional(),
      agente: z.enum(['auto', 'treinador', 'preparador', 'nutricionista', 'estrategista', 'general']).default('auto'),
      mensagem: z.string().min(1).max(4000),
      contexto: z.object({}).optional(),
    });
    const { conversaId, agente, mensagem } = schema.parse(req.body);

    // 1) Cria conversa se necessário (com agente estimado)
    let convId = conversaId;
    if (!convId) {
      const agInicial: AgenteId = agente === 'auto' ? detectarAgente(mensagem) : agente;
      const ref = await db.collection('users').doc(req.uid).collection('conversas').doc();
      convId = ref.id;
      await ref.set({
        titulo: gerarTituloConversa(mensagem),
        agente: agInicial,
        topico: agInicial,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        messageCount: 0,
        ativo: true,
      });
    }

    // 2) Salva msg do user
    await db
      .collection('users').doc(req.uid)
      .collection('conversas').doc(convId)
      .collection('messages').add({
        role: 'user',
        content: mensagem,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 3) Chama orquestrador (resolve agente + LLM + provider)
    const resposta = await responderComoAgente(
      req.uid,
      agente,
      mensagem,
      convId,
    );

    // 4) Salva resposta
    const msgRef = await db
      .collection('users').doc(req.uid)
      .collection('conversas').doc(convId)
      .collection('messages').add({
        role: 'assistant',
        content: resposta.texto,
        agente: resposta.agenteUsado,
        metadata: {
          tokensUsados: resposta.tokens.total,
          tokensInput: resposta.tokens.input,
          tokensOutput: resposta.tokens.output,
          latenciaMs: resposta.latenciaMs,
          model: resposta.model,
          provider: resposta.provider,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 5) Atualiza conversa
    await db
      .collection('users').doc(req.uid)
      .collection('conversas').doc(convId)
      .update({
        agente: resposta.agenteUsado,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 6) Audit
    await db.collection('audit').add({
      uid: req.uid,
      acao: 'chat.message',
      metadata: {
        conversaId: convId,
        agente: resposta.agenteUsado,
        model: resposta.model,
        provider: resposta.provider,
        tokensUsados: resposta.tokens.total,
        totalMs: Date.now() - startTime,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      conversaId: convId,
      agenteUsado: resposta.agenteUsado,
      resposta: resposta.texto,
      messageId: msgRef.id,
      metadata: {
        tokensUsados: resposta.tokens.total,
        tokensInput: resposta.tokens.input,
        tokensOutput: resposta.tokens.output,
        latenciaMs: resposta.latenciaMs,
        model: resposta.model,
        provider: resposta.provider,
      },
    });
  } catch (e: any) {
    logger('api.chat.error', { message: e.message });
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.get('/chat/conversas', authMiddleware, consentMiddleware, async (req: any, res) => {
  try {
    const snap = await db
      .collection('users').doc(req.uid)
      .collection('conversas')
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();
    res.json({
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.get('/chat/conversas/:id/messages', authMiddleware, consentMiddleware, async (req: any, res) => {
  try {
    const snap = await db
      .collection('users').doc(req.uid)
      .collection('conversas').doc(req.params.id)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(200)
      .get();
    res.json({
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

// ============ MÉTRICAS ============
app.get('/metricas/dashboard', authMiddleware, consentMiddleware, async (req: any, res) => {
  try {
    const uid = req.uid;
    const ref = db.collection('users').doc(uid);

    const pesoSnap = await ref.collection('peso').orderBy('data', 'desc').limit(2).get();
    const pesoAtual = pesoSnap.docs[0]?.data()?.pesoKg;
    const pesoAnterior = pesoSnap.docs[1]?.data()?.pesoKg;
    const pesoDelta7d = pesoAtual && pesoAnterior ? pesoAtual - pesoAnterior : 0;

    const userDoc = await ref.get();
    const userData = userDoc.data() || {};
    const imc = userData.altura && pesoAtual ? pesoAtual / Math.pow(userData.altura / 100, 2) : 0;

    const ultimaDorAlta = await ref
      .collection('dores')
      .where('intensidade', '>=', 7)
      .orderBy('intensidade', 'desc')
      .orderBy('data', 'desc')
      .limit(1)
      .get();
    let diasSemDor = 0;
    if (!ultimaDorAlta.empty) {
      const data = ultimaDorAlta.docs[0].data().data;
      diasSemDor = Math.floor((Date.now() - new Date(data).getTime()) / (1000 * 60 * 60 * 24));
    } else {
      diasSemDor = 999;
    }

    const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const treinosSemana = await ref
      .collection('treinos')
      .where('data', '>=', semanaAtras)
      .get();
    const horasTreinoSemana = treinosSemana.docs.reduce((acc, d) => acc + (d.data().duracaoMin || 0), 0) / 60;

    const proximoTorneioSnap = await ref
      .collection('torneios')
      .where('dataInicio', '>=', new Date().toISOString())
      .orderBy('dataInicio', 'asc')
      .limit(1)
      .get();
    const proximoTorneio = !proximoTorneioSnap.empty
      ? {
          nome: proximoTorneioSnap.docs[0].data().nome,
          data: proximoTorneioSnap.docs[0].data().dataInicio,
          diasRestantes: Math.ceil(
            (new Date(proximoTorneioSnap.docs[0].data().dataInicio).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        }
      : undefined;

    res.json({
      kpis: {
        pesoAtual: pesoAtual || userData.pesoInicial || 0,
        pesoDelta7d: Number(pesoDelta7d.toFixed(2)),
        pesoMeta: userData.pesoMeta || 80,
        imc: Number(imc.toFixed(1)),
        diasSemDor,
        sequenciaTreinos: treinosSemana.size,
        horasTreinoSemana: Number(horasTreinoSemana.toFixed(1)),
        proximoTorneio,
        resumoIA: '',
      },
      atualizadoEm: new Date().toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

// ============ LGPD ============
app.get('/exportar/tudo', authMiddleware, async (req: any, res) => {
  try {
    const uid = req.uid;
    const ref = db.collection('users').doc(uid);
    const userSnap = await ref.get();
    const exportData: any = {
      exportadoEm: new Date().toISOString(),
      user: { id: userSnap.id, ...userSnap.data() },
    };

    const colecoes = [
      'treinos', 'partidas', 'fisio', 'forca', 'mobilidade', 'cardio',
      'refeicoes', 'agua', 'suplementos', 'peso', 'medidas', 'sono',
      'dores', 'avaliacoes', 'estudos', 'torneios', 'metas',
    ];
    exportData.registros = {};
    for (const c of colecoes) {
      const snap = await ref.collection(c).get();
      exportData.registros[c] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    const convSnap = await ref.collection('conversas').get();
    exportData.conversas = [];
    for (const c of convSnap.docs) {
      const msgSnap = await c.ref.collection('messages').get();
      exportData.conversas.push({
        id: c.id,
        ...c.data(),
        messages: msgSnap.docs.map((m) => ({ id: m.id, ...m.data() })),
      });
    }

    res.json(exportData);
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.delete('/deletar-conta', authMiddleware, rateLimit(1, 86400), async (req: any, res) => {
  try {
    const uid = req.uid;
    const ref = db.collection('users').doc(uid);

    await db.collection('audit').add({
      uid,
      acao: 'conta.deletada',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const subcollections = [
      'treinos', 'partidas', 'fisio', 'forca', 'mobilidade', 'cardio',
      'refeicoes', 'agua', 'suplementos', 'peso', 'medidas', 'sono',
      'dores', 'avaliacoes', 'estudos', 'torneios', 'metas',
      'conversas', 'profile', 'settings', 'feedback',
    ];
    for (const sub of subcollections) {
      const snap = await ref.collection(sub).get();
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    await ref.delete();
    await db.collection('admins').doc(uid).delete().catch(() => {});
    await admin.auth().deleteUser(uid);

    res.json({ ok: true, deletedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Rota não encontrada' } });
});

export const api = onRequest(app);
