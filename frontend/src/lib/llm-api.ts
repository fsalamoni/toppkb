/**
 * API de configuração de LLM (user + admin).
 * Wrapper sobre as Cloud Functions correspondentes.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// ============ USER: LLM Config pessoal ============
export const getLLMConfig = httpsCallable<unknown, LLMConfigClient | null>(functions, 'getLLMConfig');
export const setLLMConfig = httpsCallable<LLMConfigInput, { ok: true }>(functions, 'setLLMConfig');
export const deleteLLMConfig = httpsCallable<unknown, { ok: true }>(functions, 'deleteLLMConfig');

// ============ USER: Agent Config pessoal ============
export const getUserAgentsConfig = httpsCallable<unknown, { agents: Record<string, AgentModelClient> }>(
  functions,
  'getUserAgentsConfig',
);
export const setUserAgentsConfig = httpsCallable<{ agents: Record<string, AgentModelInput> }, { ok: true; agents: Record<string, AgentModelClient> }>(
  functions,
  'setUserAgentsConfig',
);

// ============ MASTER: Global LLM ============
export const adminGetGlobalLLM = httpsCallable<unknown, GlobalLLMClient | null>(functions, 'adminGetGlobalLLM');
export const adminSetGlobalLLM = httpsCallable<GlobalLLMInput | null, { ok: true; savedAt?: unknown; removed?: boolean }>(
  functions,
  'adminSetGlobalLLM',
);

// ============ MASTER: Agents Config ============
export const adminGetAgentsConfig = httpsCallable<unknown, { agents: Record<AgenteId, AgentConfigClient> }>(
  functions,
  'adminGetAgentsConfig',
);
export const adminSaveAgentsConfig = httpsCallable<{ agents: Record<AgenteId, AgentConfigInput> }, { agents: Record<AgenteId, AgentConfigClient> }>(
  functions,
  'adminSaveAgentsConfig',
);

// ============ Listagem de modelos ============
export const listLLMModels = httpsCallable<{ provider: LLMProvider; apiKey: string; baseUrl?: string }, ModelInfo[]>(
  functions,
  'listLLMModels',
);

// ============ Admin: gerenciar admins ============
export const adminListAdmins = httpsCallable<unknown, AdminInfo[]>(functions, 'adminListAdmins');
export const adminGrantAdmin = httpsCallable<{ email: string; role: 'admin' | 'master' }, { ok: true; uid: string }>(
  functions,
  'adminGrantAdmin',
);
export const adminRevokeAdmin = httpsCallable<string, { ok: true }>(functions, 'adminRevokeAdmin');

// ============ TIPOS ============

export type LLMProvider =
  | 'google' | 'openai' | 'anthropic' | 'openrouter'
  | 'deepseek' | 'kimi' | 'qwen' | 'groq' | 'nvidia'
  | 'mistral' | 'xai' | 'cohere' | 'together'
  | 'fireworks' | 'perplexity' | 'ollama' | 'custom';

export const LLM_PROVIDERS: { id: LLMProvider; nome: string; defaultBaseUrl?: string; placeholder?: string }[] = [
  { id: 'openai', nome: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1', placeholder: 'sk-...' },
  { id: 'anthropic', nome: 'Anthropic Claude', defaultBaseUrl: 'https://api.anthropic.com/v1', placeholder: 'sk-ant-...' },
  { id: 'google', nome: 'Google AI', placeholder: 'AIza...' },
  { id: 'openrouter', nome: 'OpenRouter', defaultBaseUrl: 'https://openrouter.ai/api/v1', placeholder: 'sk-or-...' },
  { id: 'deepseek', nome: 'DeepSeek', defaultBaseUrl: 'https://api.deepseek.com/v1', placeholder: 'sk-...' },
  { id: 'kimi', nome: 'Kimi (Moonshot)', defaultBaseUrl: 'https://api.moonshot.cn/v1', placeholder: 'sk-...' },
  { id: 'qwen', nome: 'Qwen (DashScope)', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', placeholder: 'sk-...' },
  { id: 'groq', nome: 'Groq', defaultBaseUrl: 'https://api.groq.com/openai/v1', placeholder: 'gsk_...' },
  { id: 'nvidia', nome: 'NVIDIA NIM', defaultBaseUrl: 'https://integrate.api.nvidia.com/v1', placeholder: 'nvapi-...' },
  { id: 'mistral', nome: 'Mistral AI', defaultBaseUrl: 'https://api.mistral.ai/v1', placeholder: '...' },
  { id: 'xai', nome: 'xAI (Grok)', defaultBaseUrl: 'https://api.x.ai/v1', placeholder: 'xai-...' },
  { id: 'cohere', nome: 'Cohere', defaultBaseUrl: 'https://api.cohere.ai/v1', placeholder: '...' },
  { id: 'together', nome: 'Together AI', defaultBaseUrl: 'https://api.together.xyz/v1', placeholder: '...' },
  { id: 'fireworks', nome: 'Fireworks AI', defaultBaseUrl: 'https://api.fireworks.ai/inference/v1', placeholder: '...' },
  { id: 'perplexity', nome: 'Perplexity', defaultBaseUrl: 'https://api.perplexity.ai', placeholder: 'pplx-...' },
  { id: 'ollama', nome: 'Ollama (local)', defaultBaseUrl: 'http://localhost:11434/v1' },
  { id: 'custom', nome: 'Custom (OpenAI-compatible)' },
];

export interface LLMConfigClient {
  provider: LLMProvider;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  scope: 'user' | 'global';
  hasApiKey: boolean;
  apiKeyMasked: string;
  updatedAt?: any;
  active?: boolean;
  updatedBy?: string;
}

export interface LLMConfigInput {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GlobalLLMClient extends LLMConfigClient {
  active: boolean;
  updatedBy: string;
}

export type GlobalLLMInput = LLMConfigInput;

export interface ModelInfo {
  id: string;
  name?: string;
  contextWindow?: number;
}

export interface AgentModelClient {
  mode: 'global' | 'custom';
  provider?: LLMProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  hasApiKey?: boolean;
  apiKeyMasked?: string;
}

export interface AgentModelInput {
  mode: 'global' | 'custom';
  provider?: LLMProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentSkillClient {
  id: string;
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
}

export interface AgentConfigClient {
  id: string;
  label: string;
  enabled: boolean;
  model: AgentModelClient;
  skills: AgentSkillClient[];
}

export interface AgentConfigInput {
  id: string;
  label: string;
  enabled: boolean;
  model: AgentModelInput;
  skills: { id: string; name: string; description: string; prompt: string; enabled: boolean }[];
}

export type AgenteId = 'treinador' | 'preparador' | 'nutricionista' | 'estrategista' | 'general';

export const AGENTES: { id: AgenteId; nome: string; icone: string; cor: string }[] = [
  { id: 'treinador', nome: 'Treinador', icone: '🏓', cor: 'emerald' },
  { id: 'preparador', nome: 'Preparador Físico', icone: '💪', cor: 'blue' },
  { id: 'nutricionista', nome: 'Nutricionista', icone: '🥗', cor: 'orange' },
  { id: 'estrategista', nome: 'Estrategista', icone: '🧠', cor: 'purple' },
  { id: 'general', nome: 'Assistente Geral', icone: '🤖', cor: 'gray' },
];

export interface AdminInfo {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'master';
  active: boolean;
  grantedAt: any;
  grantedBy: string;
}
