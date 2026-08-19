/**
 * Handlers da configuração de agentes (admin master).
 *
 *  - adminGetAgentsConfig: devolve a config completa, com apiKey MASCARADO
 *    (nunca cru) + flag hasApiKey por agente.
 *  - adminSaveAgentsConfig: salva a config. Se o apiKey recebido vier vazio
 *    ou mascarado, PRESERVA o apiKey já gravado (não sobrescreve com máscara).
 *  - getUserAgentsConfig / setUserAgentsConfig: config do usuário (apenas modelos,
 *    sem skills). O admin pode forçar um LLM global, mas cada user pode customizar
 *    o modelo de cada agente.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { assertAdminMaster } from '../middleware/auth';
import { saveConfigDoc } from '../services/config-store';
import { userDoc } from '../config/namespace';
import { getFirestore, FieldValue } from '../services/firestore';
import {
  loadAgentsConfig,
  normalizeAgentsConfig,
  normalizeUserAgentModels,
  defaultAgentsConfig,
  AGENT_IDS,
  USER_AGENT_IDS,
  AGENTS_CONFIG_PATH,
  type AgentsConfig,
  type AgentConfig,
  type AgentModelConfig,
  type AgentId,
} from '../services/agents-config';
import { maskKey } from '../services/llm-providers';

function isMasked(v: string | undefined): boolean {
  return !v || v.includes('•');
}

type AgentClientSafe = AgentConfig & {
  model: { hasApiKey: boolean; apiKeyMasked: string } & AgentConfig['model'];
};

/** Versão da config sem apiKey cru (para enviar ao front). */
function toClientSafe(config: AgentsConfig): {
  agents: Record<AgentId, AgentClientSafe>;
} {
  const out = defaultAgentsConfig();
  for (const id of AGENT_IDS) {
    const a = config.agents[id];
    const rawKey = a.model.apiKey ?? '';
    out.agents[id] = {
      ...a,
      model: {
        ...a.model,
        apiKey: '', // nunca devolver cru
        hasApiKey: !!rawKey,
        apiKeyMasked: maskKey(rawKey),
      },
    } as AgentClientSafe;
  }
  return { agents: out.agents as Record<AgentId, AgentClientSafe> };
}

export const adminGetAgentsConfig = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdminMaster(request.auth.uid);
    const config = await loadAgentsConfig();
    return toClientSafe(config);
  },
);

export const adminSaveAgentsConfig = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdminMaster(request.auth.uid);

    const incoming = normalizeAgentsConfig(request.data);
    const existing = await loadAgentsConfig();

    // Preservar apiKey existente quando o front mandar máscara/vazio.
    for (const id of AGENT_IDS) {
      const inKey = incoming.agents[id].model.apiKey;
      if (isMasked(inKey)) {
        incoming.agents[id].model.apiKey = existing.agents[id].model.apiKey ?? '';
      }
    }

    await saveConfigDoc(incoming as unknown as Record<string, unknown>, {
      uid: request.auth.uid,
      path: AGENTS_CONFIG_PATH,
      tag: 'agents',
    });
    logger.info('agents-config.saved', {
      uid: request.auth.uid,
      agents: AGENT_IDS.map((id) => ({
        id,
        enabled: incoming.agents[id].enabled,
        mode: incoming.agents[id].model.mode,
        skills: incoming.agents[id].skills.length,
      })),
    });
    return toClientSafe(incoming);
  },
);

// ── USER: modelos por-agente (só quando o admin NÃO força um LLM global) ──

function modelToClientSafe(m: AgentModelConfig): AgentModelConfig & { hasApiKey: boolean; apiKeyMasked: string } {
  const rawKey = m.apiKey ?? '';
  return {
    ...m,
    apiKey: '',
    hasApiKey: !!rawKey,
    apiKeyMasked: maskKey(rawKey),
  };
}

export const getUserAgentsConfig = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const snap = await getFirestore().doc(`users/${request.auth.uid}`).get();
    const raw = snap.exists ? (snap.data() as Record<string, unknown>)?.agentsConfig : null;
    const models = normalizeUserAgentModels(raw);
    const agents: Record<string, AgentModelConfig & { hasApiKey: boolean; apiKeyMasked: string }> = {};
    for (const id of USER_AGENT_IDS) {
      agents[id] = modelToClientSafe(models[id] ?? { mode: 'global' });
    }
    return { agents };
  },
);

export const setUserAgentsConfig = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const uid = request.auth.uid;
    const incoming = normalizeUserAgentModels(request.data);
    const db = getFirestore();
    const snap = await db.doc(userDoc(uid)).get();
    const existing = normalizeUserAgentModels(snap.exists ? (snap.data() as Record<string, unknown>)?.agentsConfig : null);

    const toStore: Record<string, AgentModelConfig> = {};
    const agents: Record<string, AgentModelConfig & { hasApiKey: boolean; apiKeyMasked: string }> = {};
    for (const id of USER_AGENT_IDS) {
      const m = incoming[id] ?? { mode: 'global' };
      if (isMasked(m.apiKey)) m.apiKey = existing[id]?.apiKey ?? '';
      toStore[id] = m;
      agents[id] = modelToClientSafe(m);
    }
    await db.doc(userDoc(uid)).set(
      { agentsConfig: toStore, agentsConfigUpdatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    logger.info('user-agents-config.saved', {
      uid,
      agents: USER_AGENT_IDS.map((id) => ({ id, mode: toStore[id].mode })),
    });
    return { ok: true, agents };
  },
);
