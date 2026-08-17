# ADR 0004 — Multi-agente (5 personas) com router por keyword

**Data:** 2026-08-17
**Status:** Aceito

## Contexto

O atleta precisa de orientação em 4 domínios distintos:
- **Técnica/tática** de pickleball (drills, estratégia)
- **Preparação física** (fisio, força, mobilidade)
- **Nutrição** (anti-inflamatório, déficit calórico)
- **Estratégia competitiva** (torneios, ranking)

Um único agente generalista perderia profundidade. Múltiplos chats separados forçariam o usuário a decidir manualmente.

## Decisão

Adotamos **5 personas de IA** com **roteamento automático por keyword** + escolha manual opcional:

| Persona | Tema | System prompt |
|---|---|---|
| 🏓 Coach Bruno | Treinador | `prompts/treinador.md` |
| 💪 Prof. Marcos | Preparador | `prompts/preparador.md` |
| 🥗 Dra. Ana | Nutricionista | `prompts/nutricionista.md` |
| 🧠 Coach Carla | Estrategista | `prompts/estrategista.md` |
| 🤖 Assistente Geral | Suporte | `prompts/general.md` |

### Roteamento

```ts
function detectarAgente(mensagem: string): AgenteId {
  // Contagem de keywords por agente
  // Bônus +2 para preparador se mencionar parte do corpo
  // Retorna o top, ou 'general' se nenhum pontuou
}
```

### Conflito multi-agente

Se a mensagem tem múltiplos temas, o agente principal responde e **sugere** os outros no final:
> ⚠️ "Vi que a dor no joelho está em 5/10. Quer que eu chame o Preparador Físico?"

## Razões

1. **Especialização** gera respostas mais úteis (system prompt focado)
2. **Custo controlado** (1 chamada de LLM por mensagem, não 4)
3. **UX simples** (1 chat, 5 personas por baixo)
4. **Auditável** (sempre sabemos qual agente respondeu)
5. **Extensível** (adicionar 6º agente = novo prompt + keywords)

## Consequências

### Positivas
- **Respostas mais úteis** que um generalista
- **System prompts mais curtos** (mais fáceis de manter)
- **Identidade visual** (cada agente tem cor e ícone)
- **Métricas por agente** (qual persona é mais usada)

### Negativas
- **Mais código** (5 prompts + router + persona visual)
- **Risco de roteamento errado** (mitigado com fallback 'general')
- **Sem memória cross-agente** (cada agente só vê suas próprias conversas)

### Mitigações
- Fallback para `general` se confiança < 30%
- Sugestão de outros agentes no final da resposta
- Histórico de conversas por agente (não global)
