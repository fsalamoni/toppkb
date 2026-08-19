/**
 * API wrappers para Cloud Functions.
 * Compatível com o que o frontend vai chamar via api (REST) ou callable.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/* =========================================================
   DASHBOARD
   ========================================================= */

export async function getDashboard(_params: any = {}) {
  // Endpoint futuro: agregados do dashboard
  // Por enquanto, retorna vazio (frontend usa Realtime queries)
  return {
    treinouSemana: 0,
    partidasSemana: 0,
    pesoAtual: 0,
    pesoMeta: 0,
    imc: 0,
    proximoTorneio: null,
  };
}

/* =========================================================
   LGPD
   ========================================================= */

export async function exportarTudo() {
  // Stub: chama callable api /exportar/tudo quando backend expõe.
  return { ok: true, data: {} };
}

/* =========================================================
   LGPD
   ========================================================= */

export async function deletarConta() {
  return deleteAccount();
}

/* =========================================================
   AUTH
   ========================================================= */

export async function getMe() {
  const fn = httpsCallable(functions, 'getMe');
  const result = await fn({});
  return result.data as any;
}

export async function updateMe(patch: Record<string, any>) {
  const fn = httpsCallable(functions, 'updateMe');
  const result = await fn(patch);
  return result.data as any;
}

/* =========================================================
   LLM CONFIG (user)
   ========================================================= */

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function getMyLLMConfig(): Promise<LLMConfig | null> {
  const fn = httpsCallable<unknown, { config: LLMConfig | null }>(functions, 'getLLMConfig');
  const result = await fn({});
  return result.data.config;
}

export async function setMyLLMConfig(config: LLMConfig) {
  const fn = httpsCallable(functions, 'setLLMConfig');
  const result = await fn(config);
  return result.data as any;
}

export async function deleteMyLLMConfig() {
  const fn = httpsCallable(functions, 'deleteLLMConfig');
  const result = await fn({});
  return result.data as any;
}

/* =========================================================
   ADMIN
   ========================================================= */

export async function adminGetGlobalLLM(): Promise<LLMConfig | null> {
  const fn = httpsCallable<unknown, { config: LLMConfig | null }>(functions, 'adminGetGlobalLLM');
  const result = await fn({});
  return result.data.config;
}

export async function adminSetGlobalLLM(config: LLMConfig) {
  const fn = httpsCallable(functions, 'adminSetGlobalLLM');
  const result = await fn(config);
  return result.data as any;
}

export async function adminGetAgentsConfig() {
  const fn = httpsCallable(functions, 'adminGetAgentsConfig');
  const result = await fn({});
  return result.data as any;
}

export async function adminSaveAgentsConfig(config: any) {
  const fn = httpsCallable(functions, 'adminSaveAgentsConfig');
  const result = await fn(config);
  return result.data as any;
}

export async function getUserAgentsConfig() {
  const fn = httpsCallable(functions, 'getUserAgentsConfig');
  const result = await fn({});
  return result.data as any;
}

export async function setUserAgentsConfig(config: any) {
  const fn = httpsCallable(functions, 'setUserAgentsConfig');
  const result = await fn(config);
  return result.data as any;
}

export async function adminListAdmins() {
  const fn = httpsCallable<unknown, { items: any[] }>(functions, 'adminListAdmins');
  const result = await fn({});
  return result.data.items;
}

export async function adminGrantAdmin(email: string, role: 'admin' | 'master' = 'admin') {
  const fn = httpsCallable(functions, 'adminGrantAdmin');
  const result = await fn({ email, role });
  return result.data as any;
}

export async function adminRevokeAdmin(email: string) {
  const fn = httpsCallable(functions, 'adminRevokeAdmin');
  const result = await fn({ email });
  return result.data as any;
}

export async function adminListUserLLM() {
  const fn = httpsCallable<unknown, { items: any[] }>(functions, 'adminListUserLLM');
  const result = await fn({});
  return result.data.items;
}

export async function listLLMModels(provider: string, baseUrl?: string, apiKey?: string) {
  const fn = httpsCallable(functions, 'listLLMModels');
  const result = await fn({ provider, baseUrl, apiKey });
  return (result.data as any).models as Array<{ id: string; label?: string }>;
}

export async function adminGetPlatformStats() {
  const fn = httpsCallable(functions, 'adminGetPlatformStats');
  const result = await fn({});
  return result.data as any;
}

export async function adminGetStats() {
  const fn = httpsCallable(functions, 'adminGetStats');
  const result = await fn({});
  return result.data as any;
}

export async function adminListDocuments(opts: { status?: string; limit?: number; cursor?: string } = {}) {
  const fn = httpsCallable(functions, 'adminListDocuments');
  const result = await fn(opts);
  return result.data as any;
}

/* =========================================================
   DELETE ACCOUNT (LGPD)
   ========================================================= */

export async function deleteAccount() {
  const fn = httpsCallable(functions, 'deleteAccount');
  const result = await fn({});
  return result.data as any;
}

/* =========================================================
   CHAT
   ========================================================= */

export async function chatCallable(_params: { conversaId: string; agente: string; mensagem: string }) {
  // Stub: chamada genérica para Cloud Function de chat (a ser criada).
  // Implementação real chamará httpsCallable(functions, 'chat')(params)
  return { ok: true, data: { resposta: '...' } };
}
