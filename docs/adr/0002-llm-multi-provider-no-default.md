# ADR 0002 — LLM Multi-Provider (sem default hardcoded)

**Data:** 2026-08-17 (revisado 2026-08-17)
**Status:** Aceito
**Supersede:** Versão anterior que sugeria Gemini como padrão.

## Contexto

O projeto precisa de um LLM para alimentar os 5 agentes especializados.
A decisão original (Gemini como padrão) criava **vendor lock-in** com Google
e conflitava com a natureza do projeto: **uso pessoal, multi-provedor,
configurável pelo admin ou usuário**.

Após reflexão do owner em 2026-08-17: o sistema deve ser **provider-agnostic**.
Nenhum LLM é assumido como padrão. O admin master ou o usuário escolhem
explicitamente qual provider/modelo usar.

## Princípio

> "O sistema não sugere nem assume LLM. Quem usa decide."

Se ninguém configurar:
- Agentes retornam mensagem amigável pedindo setup
- Não há fallback para Gemini, OpenAI ou qualquer outro
- Não há env var `LLM_API_KEY` (foi removida do `.env.example`)

## Opções suportadas (17 provedores)

| Provider | Modelos exemplo | Formato | Custo típico |
|---|---|---|---|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-3.5-turbo | OpenAI-compat | $0.15-5/1M tokens |
| **Anthropic** | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus | Nativo | $0.80-15/1M tokens |
| **Google AI** | gemini-2.5-pro, gemini-2.5-flash | Nativo | $0.075-3.5/1M tokens |
| **OpenRouter** | qualquer modelo acima, roteado | OpenAI-compat | +5% sobre provider |
| **DeepSeek** | deepseek-chat, deepseek-coder | OpenAI-compat | $0.14-1.1/1M tokens |
| **Kimi (Moonshot)** | moonshot-v1-128k | OpenAI-compat | baixo |
| **Qwen (DashScope)** | qwen-plus, qwen-max | OpenAI-compat | baixo |
| **Groq** | llama-3.1-70b, mixtral-8x7b | OpenAI-compat | free tier generoso |
| **NVIDIA NIM** | vários modelos Llama/Mistral | OpenAI-compat | free tier |
| **Mistral AI** | mistral-large, mistral-small | OpenAI-compat | $0.20-2/1M tokens |
| **xAI (Grok)** | grok-beta, grok-2 | OpenAI-compat | $2-5/1M tokens |
| **Cohere** | command-r-plus, command-r | OpenAI-compat | $0.50-3/1M tokens |
| **Together AI** | vários open-source | OpenAI-compat | baixo |
| **Fireworks AI** | vários open-source | OpenAI-compat | baixo |
| **Perplexity** | llama-3.1-sonar | OpenAI-compat | $1/1M tokens |
| **Ollama** | qualquer modelo local | OpenAI-compat | grátis (custo de infra local) |
| **Custom** | qualquer OpenAI-compat | OpenAI-compat | variável |

## Decisão

Adotamos o **princípio de "zero default"**:

1. **Não há `provider` nem `model` pré-preenchidos** nos formulários.
2. **Não há fallback para env var** no `resolveEffectiveLLMConfig`.
3. **Não há chave de API hardcoded** em lugar nenhum.
4. **17 provedores** são listados na UI, sem ordem de preferência.

## Hierarquia (sem fallback final)

```
1. Config do agente (admin-config/agents/{id}.model) — se 'custom' com apiKey
   ↓ se ausente
2. Config pessoal do user (users/{uid}.llmConfig)
   ↓ se ausente
3. Config global do admin (admin-config/llm)
   ↓ se ausente
4. null → agente retorna mensagem amigável
```

## Embeddings

O mesmo princípio se aplica: `embeddings.ts` é **multi-provider**.

Suportados:
- `openai` (text-embedding-3-small/large, 1536/3072 dims)
- `google` (text-embedding-004, 768 dims)
- `cohere` (embed-english-v3.0, 1024 dims)
- `ollama` (nomic-embed-text, 768 dims)
- `custom` (OpenAI-compatible)

O admin/user configura qual provider de embedding usar. Sem configuração,
RAG é desabilitado e o agente recebe `[fonte: nenhuma — embeddings não configurados]`.

## Consequências

### Positivas
- **Zero vendor lock-in** — admin pode trocar de provedor a qualquer momento
- **Controle total** do usuário sobre custo e privacidade
- **17 opções** desde o primeiro deploy
- **Consistência** com o "Fase 1" do plano original (multi-provider)
- **LGPD-friendly** — usuário pode usar Ollama local (dados nunca saem da máquina)

### Negativas
- **Curva de aprendizado** para o admin (escolher provider, modelo, configurar chave)
- **Sem fallback "mágico"** — se ninguém configurar, ninguém responde
- **Embeddings precisam de configuração separada** (não compartilham config com chat LLM)

### Mitigações
- **Mensagens amigáveis** em todos os pontos de erro
- **Lista de modelos** automática (botão "Listar modelos" detecta modelos do provider)
- **Embeddings podem usar o mesmo provider do chat** via campo `embeddings` no llmConfig

## Razões para não ter default

1. **Custo**: cada caso de uso tem perfil diferente. Usuário que faz 100 chats/mês
   pode preferir Ollama (grátis). Usuário que faz 10k/mês pode preferir Gemini Flash
   (barato). Não cabe ao software decidir.
2. **Privacidade**: atleta pode preferir Cohere/Ollama por questões de LGPD.
3. **Qualidade**: tarefas técnicas (código) preferem Claude/GPT; tarefas
   multimídia preferem Gemini. Sem conhecer o caso, não dá para chutar.
4. **Disponibilidade**: provedores caem. Se Gemini estiver fora, admin pode
   trocar para OpenAI em 30 segundos.
5. **Filosofia do projeto**: toppkb é uma **ferramenta de uso pessoal** com
   **infra multi-usuário**. O "pessoal" vence: o dono decide, não o software.

## Quando revisar

- Se aparecer um claro vencedor de mercado (improvável) e quisermos simplificar
- Se o admin master for sempre o mesmo (pode valer hardcodar)
- Se LGPD exigir provedor específico (ex: processamento 100% no Brasil)
