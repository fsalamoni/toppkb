/**
 * LLM Config — carrega config global (admin) e por usuário.
 *
 * Hierarquia de resolução:
 *  1. Config do AGENTE (admin-config/agents/{id}.model) — se for 'custom' com apiKey
 *  2. Config GLOBAL do admin (admin-config/llm) — se existir
 *  3. Config PESSOAL do user (users/{uid}.llmConfig)
 *  4. Fallback: process.env.GEMINI_API_KEY (Google Gemini, key do projeto)
 */
import { logger } from 'firebase-functions';
import { getFirestore } from './firestore';
import { loadConfigDoc } from './config-store';
import { readGlobalApiKey, GLOBAL_LLM_PATH } from './global-llm';
import type { LLMConfigLike, LLMProvider } from './llm-providers';

/**
 * Carrega a LLMConfigLike GLOBAL (admin master).
 * Retorna null se não houver config gravada.
 */
export async function loadGlobalLLMConfig(): Promise<LLMConfigLike | null> {
  try {
    const loaded = await loadConfigDoc<any>(GLOBAL_LLM_PATH, 'llm-global');
    if (!loaded) return null;
    const data = loaded.data as Record<string, unknown>;
    const provider = data.provider as LLMProvider | undefined;
    const model = data.model as string | undefined;
    if (!provider || !model) return null;

    const apiKey = await readGlobalApiKey(data.apiKey as string | undefined);

    return {
      provider,
      model,
      apiKey,
      baseUrl: data.baseUrl as string | undefined,
      temperature: typeof data.temperature === 'number' ? (data.temperature as number) : undefined,
      maxTokens: typeof data.maxTokens === 'number' ? (data.maxTokens as number) : undefined,
    };
  } catch (err) {
    logger.warn('loadGlobalLLMConfig: falhou', { err: (err as Error).message });
    return null;
  }
}

/**
 * Carrega a LLMConfigLike PESSOAL do user.
 * Retorna null se não houver config gravada.
 */
export async function loadUserLLMConfig(uid: string): Promise<LLMConfigLike | null> {
  try {
    const snap = await getFirestore().doc(`users/${uid}`).get();
    if (!snap.exists) return null;
    const data = snap.data() as Record<string, unknown>;
    const cfg = data.llmConfig as Record<string, unknown> | undefined;
    if (!cfg) return null;
    const provider = cfg.provider as LLMProvider | undefined;
    const model = cfg.model as string | undefined;
    if (!provider || !model) return null;

    return {
      provider,
      model,
      apiKey: (cfg.apiKey as string) ?? '',
      baseUrl: cfg.baseUrl as string | undefined,
      temperature: typeof cfg.temperature === 'number' ? (cfg.temperature as number) : undefined,
      maxTokens: typeof cfg.maxTokens === 'number' ? (cfg.maxTokens as number) : undefined,
    };
  } catch (err) {
    logger.warn('loadUserLLMConfig: falhou', { uid, err: (err as Error).message });
    return null;
  }
}

/**
 * Resolve o LLMConfigLike efetivo para um agente + user.
 *
 * Ordem de prioridade:
 *  1. config do agente (custom) se completa
 *  2. config PESSOAL do user
 *  3. config GLOBAL do admin
 *  4. env var GEMINI_API_KEY (Google Gemini do projeto)
 *
 * @param agentConfig  Config do agente (de agents-config.ts)
 * @param uid          UID do usuário
 */
export async function resolveEffectiveLLMConfig(
  agentConfig: { model: { mode: 'global' | 'custom'; provider?: LLMProvider; model?: string; apiKey?: string; baseUrl?: string; temperature?: number; maxTokens?: number } } | undefined,
  uid: string,
): Promise<LLMConfigLike | null> {
  // 1) config do agente custom
  if (agentConfig && agentConfig.model.mode === 'custom') {
    const m = agentConfig.model;
    if (m.provider && m.model && m.apiKey) {
      return {
        provider: m.provider,
        model: m.model,
        apiKey: m.apiKey,
        baseUrl: m.baseUrl,
        temperature: m.temperature,
        maxTokens: m.maxTokens,
      };
    }
  }

  // 2) config pessoal do user
  const userConfig = await loadUserLLMConfig(uid);
  if (userConfig && userConfig.provider && userConfig.model) {
    return userConfig;
  }

  // 3) config global do admin
  const globalConfig = await loadGlobalLLMConfig();
  if (globalConfig && globalConfig.provider && globalConfig.model) {
    return globalConfig;
  }

  // 4) fallback: env var
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    return {
      provider: 'google',
      model: process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash',
      apiKey: envKey,
      temperature: 0.4,
      maxTokens: 1500,
    };
  }

  return null;
}
