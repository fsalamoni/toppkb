# ADR 0006 — LLM Multi-Provider com Hierarquia de Config

**Data:** 2026-08-17
**Status:** Aceito (baseado no padrão Cofrito)

## Contexto

O sistema precisa permitir que **admin master** configure o LLM padrão da plataforma, mas também permitir que **cada usuário** traga sua própria chave (BYO-key) se quiser. Cada um dos 5 agentes (treinador, preparador, nutricionista, estrategista, general) também pode ter config independente.

## Decisão

Adotamos uma **hierarquia de 4 níveis** para resolver qual LLM usar:

```
1. Config do AGENTE (admin-config/agents/{id}.model)    ← custom mode
       ↓ fallback
2. Config PESSOAL do user (users/{uid}.llmConfig)
       ↓ fallback
3. Config GLOBAL do admin (admin-config/llm)
       ↓ fallback
4. env var GEMINI_API_KEY (Google Gemini do projeto)
```

### 17 provedores suportados

| Provider | API key | baseUrl |
|---|---|---|
| Google Gemini | ✓ | nativa |
| OpenAI | ✓ | api.openai.com/v1 |
| Anthropic Claude | ✓ | api.anthropic.com/v1 |
| OpenRouter | ✓ | openrouter.ai/api/v1 |
| DeepSeek | ✓ | api.deepseek.com/v1 |
| Kimi (Moonshot) | ✓ | api.moonshot.cn/v1 |
| Qwen (DashScope) | ✓ | dashscope.aliyuncs.com/compatible-mode/v1 |
| Groq | ✓ | api.groq.com/openai/v1 |
| NVIDIA NIM | ✓ | integrate.api.nvidia.com/v1 |
| Mistral AI | ✓ | api.mistral.ai/v1 |
| xAI (Grok) | ✓ | api.x.ai/v1 |
| Cohere | ✓ | api.cohere.ai/v1 |
| Together AI | ✓ | api.together.xyz/v1 |
| Fireworks AI | ✓ | api.fireworks.ai/inference/v1 |
| Perplexity | ✓ | api.perplexity.ai |
| Ollama (local) | ✗ | localhost:11434/v1 |
| Custom | ✓ | configurável |

### Segurança

- **Global LLM apiKey** fica em `admin-config/llm-secret` (read: master only nas rules)
- **Personal LLM apiKey** fica em `users/{uid}.llmConfig.apiKey` (read: owner only)
- **Agent apiKey** (admin-config/agents) — master only
- **Nunca** devolvemos apiKey cru ao front — sempre mascarado (`sk-1••••••••cdef`)

## Estrutura de dados

### Global LLM (`admin-config/llm`)
```ts
{
  data: {
    provider: 'google',
    model: 'gemini-2.5-flash',
    baseUrl?: string,
    temperature?: 0.4,
    maxTokens?: 1500,
  },
  updatedAt, updatedBy, tag: 'llm-global'
}
```

### Global LLM Secret (`admin-config/llm-secret`)
```ts
{
  apiKey: 'sk-...',
  updatedAt, updatedBy
}
```

### Agents Config (`admin-config/agents`)
```ts
{
  data: {
    agents: {
      treinador: { id, label, enabled, model: { mode, provider, model, apiKey, baseUrl, temperature, maxTokens }, skills: [{ id, name, description, prompt, enabled }] },
      preparador: { ... },
      // etc
    }
  }
}
```

### User LLM Config (`users/{uid}.llmConfig`)
```ts
{
  provider, model, apiKey, baseUrl, temperature, maxTokens, scope: 'user', updatedAt
}
```

### User Agents Config (`users/{uid}.agentsConfig`)
```ts
{
  treinador: { mode, provider, model, apiKey, ... },
  // etc
}
```

## Consequências

### Positivas
- **Flexibilidade total** — cada user pode ter seu LLM, e o admin pode ter um global
- **Privacy** — apiKey pessoal nunca é acessível pelo admin
- **Auditoria** — cada save registra `updatedBy`
- **Resiliência** — fallback chain garante que sempre há um LLM disponível
- **17 provedores** — usuário pode usar o que tiver

### Negativas
- **Complexidade** — 3 endpoints, 3 doc types
- **Migração** — qualquer user com `llmConfig` precisa ter consent
- **Custos** — admin pode esquecer de limitar e gerar custos altos
- **Fallback bug** — se custom incompleto + global vazio, vai dar erro (mitigado com mensagem clara)

### Mitigações
- **Mensagem de erro explícita** quando falta apiKey
- **Documentação** em `docs/07-AGENTES-PROMPTS.md`
- **UI com link para o dashboard do provider** em "Como conseguir a API key"
- **Rate limit** (20 chat/min por user) para evitar abuso

## Inspirado no

- **Cofrito** (https://github.com/fsalamoni/cofrito) — `handlers/llm-config.ts`, `services/llm-providers.ts`, `services/agents-config.ts`, `services/global-llm.ts`
- **Lexio** (https://github.com/fsalamoni/Lexio) — multi-provider original
