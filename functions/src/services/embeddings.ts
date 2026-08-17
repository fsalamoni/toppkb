/**
 * Embeddings service — provider-agnostic.
 *
 * Suporta múltiplos providers de embedding:
 *  - **openai** (text-embedding-3-small/large, 1536/3072 dims)
 *  - **google** (text-embedding-004, 768 dims)
 *  - **cohere** (embed-english-v3.0, 1024 dims)
 *  - **voyage** (voyage-3, 1024 dims) — se custom
 *  - **ollama** (local, depende do modelo)
 *  - **custom** (OpenAI-compatible)
 *
 * IMPORTANTE: este serviço é provider-agnostic. O admin ou usuário DEVE configurar
 * qual provider usar (via `admin-config/llm` ou `users/{uid}.llmConfig`).
 * Se ninguém configurar, `embedTexts` lança erro claro.
 *
 * A escolha do provider é resolvida por `resolveEmbeddingsConfig()`.
 */

import { logger } from 'firebase-functions';
import { loadGlobalLLMConfig, loadUserLLMConfig } from './llm-config';
import type { LLMConfigLike, LLMProvider } from './llm-providers';

// Configuração de embeddings por provider: {model default, dimensões}
export const EMBEDDING_PROVIDER_DEFAULTS: Record<string, { model: string; dimensions: number; format: 'openai' | 'google' | 'custom' }> = {
  openai: { model: 'text-embedding-3-small', dimensions: 1536, format: 'openai' },
  google: { model: 'text-embedding-004', dimensions: 768, format: 'google' },
  cohere: { model: 'embed-english-v3.0', dimensions: 1024, format: 'custom' },
  ollama: { model: 'nomic-embed-text', dimensions: 768, format: 'openai' },
  custom: { model: '', dimensions: 768, format: 'openai' },
};

export interface EmbeddingsConfig {
  provider: LLMProvider;
  model: string;
  dimensions: number;
  apiKey: string;
  baseUrl?: string;
}

let cachedConfig: EmbeddingsConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Resolve qual provider de embedding usar.
 *
 * Prioridade:
 *  1. Config pessoal do user (campo `embeddings: { provider, model }` em llmConfig)
 *  2. Config global do admin
 *  3. env var `EMBEDDINGS_PROVIDER` apenas se admin/user setaram
 *     (NÃO é fallback automático — admin precisa ter configurado)
 *
 * Retorna null se nada estiver configurado. Quem chama decide o que fazer.
 */
export async function resolveEmbeddingsConfig(uid?: string): Promise<EmbeddingsConfig | null> {
  if (cachedConfig && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  // 1) user
  if (uid) {
    const userCfg = await loadUserLLMConfig(uid);
    const emb = userCfg as any;
    if (emb?.embeddings?.provider) {
      const def = EMBEDDING_PROVIDER_DEFAULTS[emb.embeddings.provider];
      if (def) {
        cachedConfig = {
          provider: emb.embeddings.provider,
          model: emb.embeddings.model || def.model,
          dimensions: def.dimensions,
          apiKey: userCfg!.apiKey,
          baseUrl: userCfg!.baseUrl,
        };
        cachedAt = Date.now();
        return cachedConfig;
      }
    }
  }

  // 2) global (admin)
  const globalCfg = await loadGlobalLLMConfig();
  const gEmb = globalCfg as any;
  if (gEmb?.embeddings?.provider) {
    const def = EMBEDDING_PROVIDER_DEFAULTS[gEmb.embeddings.provider];
    if (def) {
      cachedConfig = {
        provider: gEmb.embeddings.provider,
        model: gEmb.embeddings.model || def.model,
        dimensions: def.dimensions,
        apiKey: globalCfg!.apiKey,
        baseUrl: globalCfg!.baseUrl,
      };
      cachedAt = Date.now();
      return cachedConfig;
    }
  }

  return null;
}

/** Invalida o cache (use após salvar nova config). */
export function clearEmbeddingsCache() {
  cachedConfig = null;
  cachedAt = 0;
}

/**
 * Gera embedding de um texto usando o provider configurado.
 * Lança erro se nenhum provider estiver configurado.
 */
export async function gerarEmbedding(texto: string, uid?: string): Promise<number[]> {
  const cfg = await resolveEmbeddingsConfig(uid);
  if (!cfg) {
    throw new Error(
      'Nenhum provider de embedding configurado. Peça ao admin para configurar em Admin → LLM Global, ou adicione o seu em Configurações → Meu LLM Pessoal.',
    );
  }
  const vec = await callEmbeddingProvider(texto, cfg);
  if (vec.length !== cfg.dimensions) {
    logger.warn('embeddings.dimensionMismatch', { expected: cfg.dimensions, got: vec.length });
  }
  return vec;
}

/**
 * Gera embeddings de vários textos em batch.
 */
export async function gerarEmbeddings(textos: string[], uid?: string): Promise<number[][]> {
  const cfg = await resolveEmbeddingsConfig(uid);
  if (!cfg) {
    throw new Error(
      'Nenhum provider de embedding configurado. Peça ao admin para configurar em Admin → LLM Global, ou adicione o seu em Configurações → Meu LLM Pessoal.',
    );
  }
  const BATCH = 10;
  const out: number[][] = [];
  for (let i = 0; i < textos.length; i += BATCH) {
    const slice = textos.slice(i, i + BATCH);
    const results = await Promise.all(slice.map((t) => callEmbeddingProvider(t, cfg)));
    out.push(...results);
    if (i + BATCH < textos.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return out;
}

/**
 * Compat: assinatura antiga `embedTexts(textos)` (sem uid).
 * Tenta resolver config do admin global; se falhar, lança erro.
 */
export async function embedTexts(textos: string[]): Promise<number[][]> {
  return gerarEmbeddings(textos);
}

async function callEmbeddingProvider(text: string, cfg: EmbeddingsConfig): Promise<number[]> {
  const def = EMBEDDING_PROVIDER_DEFAULTS[cfg.provider];
  const format = def?.format || 'openai';

  if (format === 'google') {
    return callGoogleEmbedding(text, cfg);
  }
  // OpenAI-compatible (openai, cohere, ollama, custom)
  return callOpenAICompatEmbedding(text, cfg);
}

async function callGoogleEmbedding(text: string, cfg: EmbeddingsConfig): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:embedContent?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google embedding error ${res.status}: ${err}`);
  }
  const data: any = await res.json();
  return data.embedding?.values ?? [];
}

async function callOpenAICompatEmbedding(text: string, cfg: EmbeddingsConfig): Promise<number[]> {
  const baseUrl = cfg.baseUrl || defaultBaseUrlForEmbeddings(cfg.provider);
  const res = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      input: text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${cfg.provider} embedding error ${res.status}: ${err}`);
  }
  const data: any = await res.json();
  return data.data?.[0]?.embedding ?? [];
}

function defaultBaseUrlForEmbeddings(provider: LLMProvider): string {
  const map: Partial<Record<LLMProvider, string>> = {
    openai: 'https://api.openai.com/v1',
    cohere: 'https://api.cohere.ai/v1',
    ollama: 'http://localhost:11434/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    custom: '',
  };
  return map[provider] || '';
}

/**
 * Config de embeddings exposta para o app saber a dimensão do Vector Search.
 * Se nada configurado, retorna 0 (Vector Search desabilitado).
 */
export const EMBEDDING_CONFIG = {
  /**
   * @deprecated use resolveEmbeddingsConfig() — não há mais provider default
   * hardcoded. Mantido apenas para retrocompatibilidade de tipos.
   */
  model: 'NOT_CONFIGURED',
  dimensions: 0,
};

/**
 * Calcula similaridade cosseno entre dois vetores.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
