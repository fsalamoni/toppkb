# ADR 0002 — LLM Gemini (não OpenAI/Claude)

**Data:** 2026-08-17
**Status:** Aceito

## Contexto

Precisamos de um LLM que:
- Tenha boa performance em português brasileiro
- Seja barato o suficiente para uso diário
- Permita customização (system prompts longos)
- Tenha rate limit razoável no plano free

## Opções consideradas

| Modelo | Custo (Flash/Mini) | PT-BR | Limite Free | Latência |
|---|---|---|---|---|
| **Gemini 2.5 Flash** | $0.075/1M tokens | ✅ Excelente | 15 RPM | ~1-2s |
| GPT-4o Mini | $0.15/1M tokens | ✅ Bom | 3 RPM | ~2-3s |
| Claude 3.5 Haiku | $0.80/1M tokens | ✅ Bom | 5 RPM | ~2-3s |
| Llama 3.1 8B (self-hosted) | $0 (custo de infra) | ❌ Mediano | ilimitado | ~5-10s |

## Decisão

Adotamos **Gemini 2.5 Flash** como padrão e **Gemini 2.5 Pro** para análises longas (relatórios, resumos).

## Razões

1. **Custo 2x menor** que GPT-4o Mini
2. **15 RPM no free tier** (vs 3 RPM do GPT-4o)
3. **Excelente em PT-BR** (treinado com大量 dados em português)
4. **1M tokens de contexto** (cabem 5 system prompts inteiros)
5. **Embeddings do mesmo provedor** (text-embedding-004)
6. **SDK oficial Node.js** estável

## Consequências

### Positivas
- **$5/mês** com uso intenso de 1 usuário
- **Resposta rápida** (~1-2s para Flash)
- **System prompts longos** sem custo extra
- **Integração nativa** com Vector Search do Firestore

### Negativas
- **Vendor lock-in** com Google
- **Rate limit** no free tier (mitigado com Blaze quando crescer)
- **Qualidade de código** ligeiramente inferior ao Claude (mitigado com prompt engineering)

### Plano de contingência
- Se Gemini degradar, migrar para **GPT-4o Mini** (system prompts são portáveis)
- Wrapper `services/ai/client.ts` abstrai o provedor
