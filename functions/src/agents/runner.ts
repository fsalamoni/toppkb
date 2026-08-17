/**
 * Agent runner — combina system prompt + skills + contexto + LLM.
 *
 * Usado por TODOS os agentes (treinador, preparador, nutricionista, estrategista, general).
 */

import { generateWithProvider, type LLMMessage } from '../services/llm-providers';
import { resolveAgentLLMConfig } from '../services/agents-config';
import type { RunAgentOptions, RunAgentResult } from './types';

export async function runAgent(opts: RunAgentOptions): Promise<RunAgentResult> {
  const { agent, globalLLM, userMessage, systemPromptBase, history = [], additionalContext = '', temperature, maxTokens } = opts;

  // 1) Verifica se o agente está habilitado
  if (!agent.enabled) {
    return {
      text: `O agente "${agent.id}" está desabilitado pelo administrador. Por favor, escolha outro agente.`,
      tokens: { input: 0, output: 0, total: 0 },
      model: 'n/a',
      provider: 'n/a',
      skillsApplied: [],
    };
  }

  // 2) Resolve config LLM (custom > global > fallback)
  const llmConfig = resolveAgentLLMConfig(agent as any, globalLLM);

  if (!llmConfig) {
    return {
      text: '⚠️ Nenhum LLM configurado para responder. O sistema é provider-agnostic — ninguém configurou uma chave ainda.\n\n' +
        'Configure em uma das opções:\n' +
        '• **Admin → LLM Global** (o admin master configura uma vez para todos)\n' +
        '• **Configurações → Meu LLM Pessoal** (você adiciona sua própria chave)\n\n' +
        'Suportamos 17 provedores: Google AI, OpenAI, Anthropic, OpenRouter, DeepSeek, Kimi, Qwen, Groq, NVIDIA, Mistral, xAI, Cohere, Together, Fireworks, Perplexity, Ollama (local) ou Custom.',
      tokens: { input: 0, output: 0, total: 0 },
      model: 'n/a',
      provider: 'n/a',
      skillsApplied: [],
    };
  }

  // 3) Monta system prompt: base + skills habilitadas + contexto
  const skillsAtivas = agent.skills.filter((s) => s.enabled);
  const skillsStr = skillsAtivas.length > 0
    ? '\n\n# INSTRUÇÕES CUSTOMIZADAS (pelo admin)\n' +
      skillsAtivas.map((s) => `## ${s.name}\n${s.prompt}`).join('\n\n')
    : '';

  const systemPrompt = [
    systemPromptBase + skillsStr,
    additionalContext,
  ].filter(Boolean).join('\n\n');

  // 4) Monta mensagens
  const messages: LLMMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  // 5) Aplica overrides
  const finalConfig = {
    ...llmConfig,
    temperature: temperature ?? llmConfig.temperature ?? 0.4,
    maxTokens: maxTokens ?? llmConfig.maxTokens ?? 1500,
  };

  // 6) Chama provider
  const result = await generateWithProvider({
    systemPrompt,
    messages,
    config: finalConfig,
  });

  return {
    text: result.content,
    tokens: result.tokens,
    model: result.model,
    provider: result.provider,
    skillsApplied: skillsAtivas.map((s) => s.id),
  };
}
