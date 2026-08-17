/**
 * Tipos compartilhados pelos agentes especializados.
 */

import type { LLMConfigLike } from '../services/llm-providers';

export interface AgentSkillRef {
  id: string;
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
}

export interface AgentConfigRef {
  id: string;
  label: string;
  enabled: boolean;
  model: {
    mode: 'global' | 'custom';
    provider?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
  };
  skills: AgentSkillRef[];
}

export interface RunAgentOptions {
  agent: AgentConfigRef;
  globalLLM: LLMConfigLike | null;
  userMessage: string;
  systemPromptBase: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  additionalContext?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RunAgentResult {
  text: string;
  tokens: { input: number; output: number; total: number };
  model: string;
  provider: string;
  skillsApplied: string[];
}
