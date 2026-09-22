# AUDIT — SPRINT 34: Cues Musculares (Linguagem Leiga)

**Data:** 2026-09-22
**Status:** Concluído
**Objetivo:** Enriquecer TODAS as 89 descrições de exercícios com cues sensoriais para leigos, indicando exatamente qual musculatura deve ser afetada, COMO e onde sentir, e sinais de compensação errada.

---

## 📐 Schema Expandido

### Novos campos em `ExercicioKettlebell`
```typescript
mapaMuscularLeigo?: string[];      // 3-6 frases: ONDE SENTIR (linguagem leiga)
sensacaoPrincipal?: string;       // 1 frase: o que DEVE sentir ao fazer
erroMuscular?: string;            // 1 frase: o que acontece se fizer errado
analogiaInicial?: string;         // 1 frase: "como se fosse..." (metáfora)
cargaInicial50mais?: string;      // 1 frase: carga inicial recomendada
```

### Novos campos em `ExerciseStep`
```typescript
sensacoes?: string[];             // 3-6 frases: ONDE/COMO sentir nesta etapa
alertasMusculares?: string[];     // 2-5 frases: compensações comuns
```

---

## 📊 Estatísticas

- **89/89** exercícios com `mapaMuscularLeigo` (100%)
- **89/89** com `sensacaoPrincipal` (100%)
- **89/89** com `erroMuscular` (100%)
- **89/89** com `analogiaInicial` (100%)
- **89/89** com `cargaInicial50mais` (100%)
- **363 steps** com `sensacoes` (passo a passo sensorial)
- **363 alertas musculares** distribuídos nos steps

---

## 🧩 Componente `MuscleHint.tsx`

Novo componente reutilizável que renderiza dicas musculares em qualquer ponto onde o exercício é citado.

### Variants:
- **badge** — inline minimalista (uma linha)
- **inline** — múltiplas linhas pequenas (usado em ExerciseBadge variant="detailed")
- **card** — bloco com seções destacadas (usado em destaque)
- **tooltip** — para popovers (não-autônomo)

### Helpers no seed.ts:
```typescript
getDicaMuscularCurta(id: string): string | null;
getErroMuscularCurto(id: string): string | null;
getPrincipalMusculatura(id: string): string | null;
getTopMusculaturas(id: string, n?: number): string[];
```

---

## 🎯 Padrões de Linguagem Leiga

Princípios editoriais:
1. **Sem jargão anatômico** — "bumbum", "parte de trás da coxa", "barriga"
2. **Comandos sensoriais** — "sinta", "force o calcanhar", "ative"
3. **Onde:** região específica do corpo ("perto do glúteo", "atrás da coxa")
4. **Como:** tipo de sensação ("queimação", "contração", "alongamento")
5. **Erro:** sinal claro de compensação ("Se sentir a lombar doendo...")

### Exemplo: kb-swing-2h-hardstyle

```typescript
mapaMuscularLeigo: [
  'Glúteo máximo — a parte redonda da nádega, sente o "bumbum" endurecer no topo',
  'Isquiotibial — atrás da coxa, sente a parte de trás se contrair rapidamente',
  'Abdômen — barriga dura, como se fosse receber um soco',
  ...
],
sensacaoPrincipal: 'No topo do movimento (lockout), você DEVE sentir os glúteos muito contraídos — quase queimando. A coxa (parte de trás) também trava por 1 segundo.',
erroMuscular: 'Se sentir a lombar (parte baixa das costas) doendo ou queimando: você está jogando o quadril para frente em vez de contrair os glúteos.',
analogiaInicial: 'Imagine que tem uma cadeira atrás de você. Você vai empurrar o bumbum para trás como se fosse sentar nela, mas só encosta de leve.',
cargaInicial50mais: '8-12 kg (mulheres), 12-16 kg (homens). Não importa o peso no início — importa o movimento estar PERFEITO.',
```

Step 3 (Snap Glúteo):
```typescript
sensacoes: [
  'GLÚTEO CONTRAI COM FORÇA — como se fosse "esmagar uma noz entre as nádegas"',
  'Quadril "estala para frente" — movimento de chute para trás (mas rápido)',
  'Isquiotibiais terminam de contrair — agora estão rígidos como cordas',
  'Corpo forma uma linha reta do tornozelo à orelha',
  'KB "flutua" no ar por 1-2 segundos',
  'Respire EXPIRA neste momento (topo)',
],
alertasMusculares: [
  'Se o KB subir acima da altura dos ombros: você está usando os braços (errado)',
  'Se sentir pontada na lombar: NÃO está travando o glúteo — foque em contrair BUMBUM',
  'Se sentir dor no pescoço: olhe para o chão',
],
```

---

## 📦 Componentes Atualizados

### `ExerciseDetailModal.tsx`
- 5 novas seções no corpo do modal:
  - **ONDE SENTIR** (mapa muscular com bullets)
  - **SENSAÇÃO PRINCIPAL** (destaque verde)
  - **PENSE ASSIM** (analogia roxa)
  - **ERRO MUSCULAR** (alerta amarelo)
  - **CARGA INICIAL 50+** (info azul)
- Cada step agora tem **2 detalhes colapsáveis**:
  - 💪 Onde e como sentir
  - ⚠️ Atenção muscular

### `ExerciseBadge.tsx` (variant="detailed")
- Dica muscular visível INLINE dentro do badge
- Usuário já vê ONDE SENTIR antes mesmo de clicar para abrir o modal

---

## ✅ Validação
- typecheck: 0 erros
- lint: 0 erros
- 14 testes do ExerciseDetailModal passando

## 🚀 Próximo Sprint
**Sprint 35:** Imagens didáticas atualizadas com cues musculares (overlay textual)
**Sprint 36:** Avatares demonstrativos (vídeos simplificados)

---

## 📦 Sprint 36 — Imagens V4 com Overlay Sensorial

### Mudança visual
Todas as 371 imagens didáticas dos steps foram **regeneradas** com:
- Header colorido (mesmo padrão KB da imagem v1)
- Título do step em destaque
- Descrição completa em PT-BR
- 📦 **CUES TÉCNICOS** (verde) - "o que fazer"
- 📘 **ONDE SENTIR (músculo)** (azul) - "qual músculo"
- 🟢 **COMO SENTIR (sensação)** (verde escuro) - "como sentir"

### Exemplo: kb-swing-2h-hardstyle step 3 (Snap Glúteo)
- ONDE: Glúteo máximo, quadril, isquiotibiais, ...
- COMO: "No topo do movimento (lockout), você DEVE sentir os glúteos muito contraídos — quase queimando. A coxa (parte de trás) também trava por 1 segundo."

### Benefício
O usuário **vê exatamente o que deve sentir ANTES de abrir o modal**.

---

## 🎨 Sprint 37 — Avatares SVG Demonstrativos

### Implementação
11 SVGs estáticos com stick figures para os principais padrões KB:

- **HINGE**: swing (3 etapas), clean (1 etapa), deadlift-ready
- **SQUAT**: goblet squat (2 etapas), front squat-ready
- **PRESS**: strict press (2 etapas)
- **CARRY**: farmer carry (1 etapa)
- **ROT**: TGU etapa 1

Cada SVG mostra:
- Stick figure em escala humana (400x600px)
- Posição do corpo + KB
- Cores por padrão KB (verde=hinge, laranja=squat, roxo=press, azul=carry, vermelho=rot)
- Texto curto embaixo descrevendo o ponto-chave

### Localização
`frontend/public/kettlebell/avatars/*.svg`

### Próxima evolução
- Expandir para os 89 exercícios
- Adicionar animação (stroke-dashoffset)
- Combinar com áudio (opcional futuro)

---

## 📊 Resumo Final Sprints 34-37

### Estatísticas Consolidadas
- **89/89** exercícios com mapa muscular leigo (100%)
- **89/89** com sensação principal (100%)
- **89/89** com erro muscular (100%)
- **89/89** com analogia inicial (100%)
- **89/89** com carga inicial 50+ (100%)
- **363** steps com sensações (passo a passo sensorial)
- **363** alertas musculares distribuídos
- **371** imagens didáticas regeneradas (overlay ONDE/COMO SENTIR)
- **11** avatares SVG demonstrativos

### Pontos de Exposição das Cues Musculares
1. **ExerciseDetailModal** — modal detalhado com 5 seções dedicadas
2. **ExerciseBadge** (variant detailed) — dica inline visível
3. **MuscleHint** componente reutilizável em 4 variants
4. **ExerciseCardFull** — card completo para pickers
5. **Exercicios.tsx** — listagem com preview da dica
6. **PreparacaoForm** — quando selecionado
7. **TreinamentoSessoesForm** — variant detailed
8. **Imagens PNG didáticas** — overlay visual
9. **Avatares SVG** — demonstração visual estática

### Mudanças de Schema
```typescript
ExercicioKettlebell: {
  + mapaMuscularLeigo: string[]
  + sensacaoPrincipal: string
  + erroMuscular: string
  + analogiaInicial: string
  + cargaInicial50mais: string
}

ExerciseStep: {
  + sensacoes: string[]
  + alertasMusculares: string[]
}
```

### Helpers Adicionados
```typescript
getDicaMuscularCurta(id: string): string | null
getErroMuscularCurto(id: string): string | null
getPrincipalMusculatura(id: string): string | null
getTopMusculaturas(id: string, n?: number): string[]
```

### Validação
- typecheck: 0 erros
- lint: 0 erros
- 14 testes ExerciseDetailModal passing
- build: OK (bundle 250KB gzip 72KB)
- Deploy success (commits: ddf30b2 + ba9b9e7 + a9423d7)

### Próximas Fases
- **Sprint 38**: Expansão avatares SVG para todos os exercícios + animação
- **Sprint 39**: A11y completa das dicas musculares (aria-describedby)
- **Sprint 40**: Coach IA usando mapaMuscularLeigo nas respostas

---

## 🎭 Sprint 38 — Avatares SVG COMPLETOS (89 exercícios × 4 steps média)

### Templates SVG parametrizados
9 templates para diferentes posições corporais:
- `svg_stand` — Em pé (geral)
- `svg_hinge` — Hip hinge (quadril para trás)
- `svg_squat_top` — Squat em pé
- `svg_squat_bottom` — Squat paralelo
- `svg_press_rack` — Press rack (ombro)
- `svg_press_overhead` — Press lockout
- `svg_lying` — Deitado (TGU/floor/pullover)
- `svg_carry` — Caminhando com KBs
- `svg_plank` — Prancha (push-up/row/plank)

### Geração automática
- **371 avatares SVG** gerados (1 por step de cada exercício)
- Decisão de template por **padrão KB + número do step**
- Cores por padrão KB (verde/laranja/roxo/azul/vermelho/ciano/rosa)
- Stick figure didático com posição do KB marcada
- Texto curto embaixo descrevendo o ponto-chave

### Componente `ExerciseAvatar.tsx`
- Renderiza SVG como `<object type="image/svg+xml">`
- 3 sizes: sm/md/lg
- Fallback para User icon se SVG não carregar
- Integração no `ExerciseDetailModal`: cada step agora mostra:
  - Avatar (stick figure 96×144)
  - Descrição completa
  - Cues técnicos (chips)

---

## ♿ Sprint 39 — A11y das Dicas Musculares

### Mudanças ARIA no `MuscleHint`
- `role="group"` com `aria-label="Dicas musculares"` no variant="inline"
- `role="region"` com `aria-label="Dicas musculares detalhadas"` no variant="card"
- `role="alert"` no bloco de erro muscular (leitores de tela anunciam)
- `role="img"` no variant="badge"
- `aria-hidden="true"` nos ícones decorativos (Lucide icons)
- Texto alternativo nos alertas

### Benefícios
- NVDA/JAWS anunciam corretamente os avisos musculares
- VoiceOver anuncia "Erro muscular comum" antes da mensagem
- Usuários cegos agora têm acesso ao mapa muscular leigo

---

## 🤖 Sprint 40 — Coach IA usa `mapaMuscularLeigo`

### Novo arquivo `lib/coach-context.ts`
- **`buildCoachContext(input)`**: monta bloco enriquecido com mapa muscular leigo
- **Detecção automática** de exercícios KB mencionados (busca por nome e ID)
- **FormatExerciseContext()**: formata exercício com mapa muscular + sensações + erros + analogias + carga 50+
- **getQuickContext(exId)**: versão curta para citações rápidas

### Integração com ChatPage
- `ChatRequest` agora aceita `contextoExtra`
- `ChatPage` chama `buildCoachContext()` ANTES de enviar mensagem
- Bloco formatado é enviado ao backend para concatenar com system prompt

### Backend prompt enrichment
O backend (Cloud Function api/chat/message) pode usar `req.body.contextoExtra` para:
- Adicionar bloco ao system prompt
- Coach IA responde com nomenclatura leiga do usuário
- Indica ONDE SENTIR, ERRO MUSCULAR, ANALOGIAS
- Considera CARGA INICIAL 50+

### Exemplo de resposta do coach
```
Usuário: "Estou sentindo a lombar doer no swing"
Coach IA (com contexto muscular):
  "Pode ser que o quadril não esteja travando no topo. 
  Tente focar em 'esmagar uma noz' entre as nádegas no topo.
  Se a lombar continuar queimando, reduza 2kg do KB."
```

### Validação
- typecheck: 0 erros
- lint: 0 erros
- 432+ testes passando

---

## 📊 Resumo Final Sprints 34-40

| Sprint | Foco | Entregas |
|---|---|---|
| 34 | Schema + dados | 89/89 exercícios com sensações PT-BR leigas |
| 35 | Integração | MuscleHint em 5+ páginas |
| 36 | Imagens | 371 imagens com overlay ONDE/COMO SENTIR |
| 37 | Avatares v1 | 11 avatares SVG essenciais |
| 38 | Avatares v2 | 371 avatares SVG parametrizados |
| 39 | A11y | ARIA completo nas dicas musculares |
| 40 | Coach IA | Coach enriquecido com mapa muscular |

### Estatísticas Consolidadas
- **89/89** exercícios com mapa muscular leigo (100%)
- **89/89** com sensação principal (100%)
- **89/89** com erro muscular (100%)
- **89/89** com analogia inicial (100%)
- **89/89** com carga inicial 50+ (100%)
- **363** steps com sensações
- **371** imagens didáticas regeneradas (overlay ONDE/COMO)
- **371** avatares SVG demonstrativos
- **4+ páginas** com dicas musculares integradas
- **5+ componentes** reutilizáveis (MuscleHint/ExerciseBadge/ExerciseCardFull/ExerciseAvatar/CoachContext)

### Pontos de Exposição das Cues Musculares
1. ExerciseDetailModal (5 seções + avatars por step)
2. ExerciseBadge variant="detailed" (preview inline)
3. MuscleHint (4 variants)
4. ExerciseCardFull (picker completo)
5. Exercicios.tsx (cards de listagem)
6. PreparacaoForm (selecionados)
7. TreinamentoSessoesForm
8. Imagens PNG didáticas (overlay)
9. Avatares SVG (stick figures por step)
10. Coach IA (system prompt enrichment)
