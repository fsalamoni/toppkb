# ROADMAP PRINCIPAL — Top Pickleball 50+ — 23/09/2026

**Origem do pedido (do owner):**
> "Prossiga nos sprints. Foco nos exercícios, principalmente de kettlebell, com descrição completa, imagens completas (com todas as etapas dos exercícios) e vídeos demonstrativos. Precisa ter descrição, imagens e vídeos que demonstrem tudo sobre os exercícios, todas as etapas dos exercícios, passo a passo. EXTREMAMENTE COMPLETOS!
>
> Nos descritivos deve indicar exatamente qual musculatura deve ser afetada em cada exercício, por exemplo, indicar que em determinado exercício o usuário deve sentir afetando tal parte do corpo, de modo específico e com linguagem para leigo, como sentir a parte de trás da coxa, perto disso ou daquilo. Outro exemplo, em tal exercício o usuário deve fazer força ou utilizar o calcanhar, ou a ponta do pé, e sentir a musculatura do glúteo. Compreenda o que estou dizendo, a descrição deve ajudar o usuário leigo a praticar o exercício de modo correto, sentir os efeitos de modo correto, para evitar que se realizem exercícios de modo errado, que podem causar lesão ou não surtir efeito.
>
> Então, complemente a descrição com esses detalhes importantíssimos. Esse é o foco agora. Programe-se para fazer essas complementações de forma plena e integral, para todos os exercícios mapeados. E essas informações devem constar em todos os pontos que os exercícios são citados, previstos e/ou indicados.
>
> Desenvolva isso de modo organizado e estruturado, tudo documentado e com progressão atualizada e documentada.
>
> Após a conclusão dessa parte, passaremos para o aprimoramento, com o mesmo foco, de imagens e vídeos, que também devem ser complementados e atualizados com detalhes que auxiliem o usuário a compreender e a praticar os exercícios com precisão. Os vídeos não precisam ser criados de modo realista (com imagens realistas de pessoas), podem ser avatares mais simples, mas que possibilitem a visualização perfeita."

---

## 🎯 Objetivo final (até onde ir)

| Dimensão | Estado hoje | Estado-alvo |
|----------|-------------|--------------|
| **Dados** (89 exercícios) | 85% | **100%** |
| **Descrições leigas** (mapaMuscularLeigo + sensações + alertas) | 80% | **100%** (todos uniformes e profundos) |
| **Imagens de TODAS etapas** (passo a passo) | 95% (372/372 PNGs v5) | **100%** + **anatomia destacada** |
| **Vídeos demonstrativos** (avatares animados) | **0%** ❌ | **100%** (1 vídeo/step, ~370 vídeos) |
| **Exposição das cues** (aparece em todos os pontos) | 100% (12+ pontos) | **100%** |
| **Testes** | 521 | **600+** (cobrindo gaps) |
| **Documentação** | 2 docs (AUDIT, AUDITORIA) | **5+ docs** (ROADMAP, STATUS, RELATÓRIO) |

---

## 📋 Sprints pendentes (em ordem de execução — RIGOROSA)

### 🟥 SPRINT 64 — Padronização de profundidade didática nos 89 exercícios
**Objetivo:** Auditar todos os 89 exercícios e garantir que cada um tenha o mesmo padrão de qualidade nas descrições leigas.

**Sub-tarefas:**
- [ ] 64.1 — Criar `scripts/audit_exercicios.py` que audita automaticamente cada exercício e dá score 0-100 baseado em:
  - Tamanho de `mapaMuscularLeigo` (>= 4 itens)
  - Presença de `sensacaoPrincipal` (não vazio)
  - Presença de `erroMuscular` (não vazio)
  - Presença de `analogiaInicial` (não vazio)
  - Presença de `cargaInicial50mais` (não vazio)
  - Presença de `alerta50mais` (não vazio)
  - Quantidade de `steps[]` (>= 4 steps)
  - Cada step tem `descricao` >= 80 chars
  - Cada step tem `cues[]` (>= 2)
  - Cada step tem `sensacoes[]` (>= 2)
  - Cada step tem `alertasMusculares[]` (>= 1)
- [ ] 64.2 — Rodar auditoria e gerar `docs/AUDIT-EXERCICIOS-2026-09-23.md` com a lista
- [ ] 64.3 — Para cada exercício com score < 80, **reescrever manualmente** as descrições seguindo o padrão:
  - Linguagem 100% leiga (zero jargão anatômico sem explicação)
  - Cues sensoriais concretos ("force o calcanhar", "esmague uma noz entre as nádegas", "como se fosse uma cadeira atrás")
  - Indicar EXATAMENTE onde sentir ("bumbum", "parte de trás da coxa", "barriga")
  - Indicar o que fazer de errado e o que sentir quando erra
- [ ] 64.4 — Re-rodar auditoria e garantir score médio >= 90

**Validação:**
- Auditoria passa: 89/89 exercícios com score >= 80
- typecheck + lint + build OK
- Testes passam (521/528)
- Commit + deploy

---

### 🟥 SPRINT 65 — Validação cruzada nos 12+ pontos de exposição
**Objetivo:** Garantir que TODOS os pontos onde os exercícios aparecem exibem as cues musculares de forma consistente e completa.

**Sub-tarefas:**
- [ ] 65.1 — Listar todos os 12+ pontos onde exercícios são citados:
  1. ExerciseDetailModal (modal de detalhe)
  2. ExerciseBadge (4 variants)
  3. MuscleHint (4 variants)
  4. ExerciseCardFull (picker)
  5. Exercicios.tsx (cards da biblioteca)
  6. PreparacaoForm (seleção de exercícios)
  7. TreinamentoSessoesForm (form de sessões)
  8. Periodizacao.tsx (visualização de plano)
  9. TreinamentoTemplates.tsx (templates)
  10. Imagens PNG (passo a passo)
  11. Avatares SVG (poses)
  12. Coach IA (system prompt)
  13. WorkoutFocusCard (foco do treino)
  14. MuscleTracker (dashboard de músculos)
  15. PracticeMode (modo prática guiado)
- [ ] 65.2 — Para cada ponto, verificar se mostra:
  - `mapaMuscularLeigo` ou resumo
  - `sensacaoPrincipal` (se aplicável)
  - `erroMuscular` (se aplicável)
  - `cargaInicial50mais` (se aplicável)
- [ ] 65.3 — Onde faltar, ADICIONAR (não remover nada)
- [ ] 65.4 — Criar `docs/CHECKLIST-EXPOSICAO-2026-09-23.md` confirmando 100% cobertura

**Validação:**
- Checklist 100% verde
- typecheck + lint + build OK
- Commit + deploy

---

### 🟥 SPRINT 66 — Anatomia nas imagens PNG (overlay SVG)
**Objetivo:** Adicionar silhueta humana + músculo destacado nas imagens PNG.

**Sub-tarefas:**
- [ ] 66.1 — Criar silhueta base humana (corpo inteiro, vista frontal + lateral) em SVG
- [ ] 66.2 — Para cada padrão KB (HINGE, SQUAT, PRESS, etc), mapear quais músculos são destacados:
  - HINGE → glúteo máximo + isquiotibial
  - SQUAT → quadríceps + glúteo
  - PRESS → deltóide + core
  - PULL → latíssimo + bíceps
  - CARRY → grip + core + ombros
  - ROT → oblíquo + core
  - COND → cardio (sem destaque)
  - FLOW → coordenação (sem destaque)
- [ ] 66.3 — Modificar `scripts/regen_step_images.py` para:
  - Renderizar fundo escuro
  - Sobrepor silhueta humana na metade ESQUERDA da imagem
  - Destacar músculo em cor (vermelho/alaranjado)
  - Manter texto didático na metade DIREITA
  - Setas apontando do texto para a região do corpo
- [ ] 66.4 — Regenerar todas as 372 imagens
- [ ] 66.5 — Validar que texto NÃO está cortado e silhueta está visível

**Validação:**
- 372/372 imagens regeneradas
- typecheck + lint + build OK
- Imagens no site têm silhueta
- Commit + deploy

---

### 🟥 SPRINT 67 — Anatomia detalhada nos avatares SVG
**Objetivo:** Avatares com detalhes anatômicos (articulações, ângulos articulares, KB realista).

**Sub-tarefas:**
- [ ] 67.1 — Mapear 8-10 templates de poses:
  - **stand_upright** (em pé, posição neutra)
  - **hinge_position** (quadril para trás, costas retas)
  - **squat_top** (em pé, antes de agachar)
  - **squat_bottom** (agachado completo)
  - **overhead_press_rack** (KB no rack)
  - **overhead_lockout** (KB no topo)
  - **carry_upright** (em pé, KB carregado)
  - **hinge_with_kb** (KB no backswing)
  - **lying_setup** (deitado)
  - **plank_position** (prancha)
- [ ] 67.2 — Refazer template base com:
  - Articulações: círculos pequenos coloridos nos pontos (ombro, cotovelo, quadril, joelho, tornozelo)
  - Linhas tracejadas mostrando plano vertical de referência
  - Labels de ângulo (90°, 180°) quando relevante
  - Label "FRONTAL" ou "LATERAL" no canto
  - KB visualmente mais rico (bola + alça + handle)
- [ ] 67.3 — Refazer mapeamento de step → template (decidir qual template usar por exercício)
- [ ] 67.4 — Regenerar 382 avatares
- [ ] 67.5 — Adicionar label "PASSO N" no avatar

**Validação:**
- 382/382 avatares regenerados com anatomia
- typecheck + lint + build OK
- Avatares no site têm articulações visíveis
- Commit + deploy

---

### 🟥 SPRINT 68 — Vídeos demonstrativos (avatares animados)
**Objetivo:** Gerar 1 vídeo MP4 por step (~370 vídeos) com avatar animado demonstrando o movimento.

**Sub-tarefas:**
- [ ] 68.1 — Decidir formato: MP4 (H.264) ou SVG animado (SMIL)?
  - **Decisão:** SVG animado (SMIL) — leve, renderiza nativo no browser, sem precisar de servidor de mídia
  - Mas como fallback: MP4 gerado a partir do SVG com ffmpeg (5-10s cada)
- [ ] 68.2 — Criar `scripts/gen_videos.py` que:
  - Lê cada step de cada exercício
  - Cria SVG animado com 2-3 keyframes
  - Animação 5-10s com loop
  - Mostra: pose inicial → pose final → pose inicial (loop)
- [ ] 68.3 — Para gerar MP4 fallback:
  - Usar `ffmpeg` ou `cairosvg` + `ffmpeg`
  - Cada vídeo: 720p, 5-10s, 1Mbps, codec H.264
- [ ] 68.4 — Atualizar `videoUrl` no seed para apontar para o novo vídeo
- [ ] 68.5 — Validar que vídeo carrega no browser

**Validação:**
- 372/372 vídeos gerados
- typecheck + lint + build OK
- Vídeos no site (ou pelo menos 1 funcionando)
- Commit + deploy

---

### 🟥 SPRINT 69 — Validação de usuário (5-10 exercícios como leigo)
**Objetivo:** Validar que a linguagem leiga realmente funciona para um usuário 50+ que nunca fez KB.

**Sub-tarefas:**
- [ ] 69.1 — Pegar 10 exercícios variados (1 de cada padrão KB)
- [ ] 69.2 — Para cada um, escrever 5 perguntas como leigo faria:
  - "Onde eu sinto esse exercício?"
  - "Como sei se tô fazendo errado?"
  - "Quanto peso eu uso?"
  - "Me dói o joelho, posso fazer?"
  - "Meu joelho estala, é normal?"
- [ ] 69.3 — Para cada pergunta, verificar se as descrições ATUAIS respondem adequadamente
- [ ] 69.4 — Para cada lacuna, ANOTAR o que falta
- [ ] 69.5 — Preencher as lacunas com FAQ inline no ExerciseDetailModal

**Validação:**
- 10/10 perguntas respondidas pelas descrições atuais (ou FAQ adicionado)
- Documento `docs/VALIDACAO-LEIGO-2026-09-23.md` criado
- Commit + deploy

---

### 🟧 SPRINT 70 — Revisão linguística (consistência)
**Objetivo:** Garantir consistência na linguagem leiga em TODOS os 89 exercícios.

**Sub-tarefas:**
- [ ] 70.1 — Criar `docs/GLOSSARIO-LEIGO.md` com termos padrão:
  - "bumbum" = glúteo máximo
  - "parte de trás da coxa" = isquiotibial
  - "frente da coxa" = quadríceps
  - "barriga" = abdômen / core
  - "ponta do pé" = antepé
  - "calcanhar" = região posterior do pé
  - "costas" = região lombar/torácica
  - etc
- [ ] 70.2 — Buscar termos JARGÃO (glúteo máximo, isquiotibial, quadríceps, etc) no seed.ts
- [ ] 70.3 — Onde aparecerem, decidir:
  - Manter se for útil didático (ex: "Glúteo (bumbum)")
  - Substituir por leigo se for a única forma
- [ ] 70.4 — Buscar frases vagas ("trabalha o corpo todo", "ativa vários músculos")
- [ ] 70.5 — Onde aparecerem, ESPECIFICAR

**Validação:**
- 0 termos jargão sem explicação
- 0 frases vagas
- typecheck + lint + build OK
- Commit + deploy

---

### 🟧 SPRINT 71 — OndeSentir visual (anatomia clicável)
**Objetivo:** Adicionar mini-anatomia visual clicável nos cards MuscleHint.

**Sub-tarefas:**
- [ ] 71.1 — Criar componente `<MuscleMap exerciseId />` que renderiza silhueta humana simples
- [ ] 71.2 — Destaca o músculo sendo mencionado no mapaMuscularLeigo
- [ ] 71.3 — Hover no músculo mostra a descrição leiga
- [ ] 71.4 — Integrar no ExerciseDetailModal e na lista de exercícios

**Validação:**
- Componente funcional
- typecheck + lint + build OK
- Commit + deploy

---

### 🟨 SPRINT 72 — Cache de imagens/vídeos
**Objetivo:** Garantir que o PWA funciona offline.

**Sub-tarefas:**
- [ ] 72.1 — Atualizar `frontend/public/sw.js` para cachear:
  - `/kettlebell/step-images/*` (PNG)
  - `/kettlebell/avatars/*` (SVG)
  - `/kettlebell/videos/*` (MP4 ou SVG)
- [ ] 72.2 — Validar offline no Chrome DevTools

**Validação:**
- sw.js atualizado
- Funciona offline
- Commit + deploy

---

### 🟨 SPRINT 73 — Métricas de uso (analytics)
**Objetivo:** Saber quais descrições são mais visualizadas (e onde falta mais).

**Sub-tarefas:**
- [ ] 73.1 — Adicionar tracking de:
  - Quais exercícios foram abertos
  - Quais steps foram visualizados
  - Quais MuscleHints foram expandidos
  - Tempo gasto em cada exercício
- [ ] 73.2 — Dashboard no admin mostrando top 10 mais visualizados
- [ ] 73.3 — Identificar exercícios com baixo engajamento (possíveis gaps)

**Validação:**
- Analytics funcional
- typecheck + lint + build OK
- Commit + deploy

---

### 🟨 SPRINT 74 — Documentação final
**Objetivo:** Consolidar toda a documentação.

**Sub-tarefas:**
- [ ] 74.1 — Criar `docs/GUIA-USUARIO-50+.md` com:
  - Como usar o app (passo a passo)
  - O que significa cada ícone
  - Como navegar pelas bibliotecas
- [ ] 74.2 — Criar `docs/GUIA-CRIADOR-CONTEUDO.md` com:
  - Como adicionar novo exercício
  - Schema obrigatório
  - Padrão de qualidade
- [ ] 74.3 — Consolidar AUDIT-EXERCICIOS + AUDIT-EXPOSICAO + VALIDACAO-LEIGO em `AUDITORIA-FINAL.md`

**Validação:**
- 3 docs novos criados
- Commit + deploy

---

## 📊 Status atual (23/09/2026)

### Dados (89 exercícios)
- ✅ 89/89 com `mapaMuscularLeigo`
- ✅ 89/89 com `sensacaoPrincipal`
- ✅ 89/89 com `erroMuscular`
- ✅ 89/89 com `analogiaInicial`
- ✅ 89/89 com `cargaInicial50mais`
- ✅ 89/89 com `alerta50mais`
- ✅ 89/89 com `contraIndicacoes`
- ✅ 89/89 com `evidencia`
- ✅ 89/89 com `referencias`
- ✅ 89/89 com `videoUrl`
- ✅ 89/89 com `imageUrl`
- ✅ 89/89 com `thumbnailUrl`
- ✅ 89/89 com `galleryImages`
- ✅ 89/89 com `steps[]` (total 363 steps)
- ✅ Steps com `sensacoes[]` (Sprint 34)
- ✅ Steps com `alertasMusculares[]` (Sprint 34)

### Imagens e vídeos
- ✅ 372 PNGs didáticos (layout v5) — full-width, sem texto cortado
- ✅ 382 avatares SVG (stick figures com setas/highlights/animações)
- ❌ **0 vídeos** — NENHUM vídeo gerado

### Exposição (15 pontos)
- ✅ ExerciseDetailModal (5 seções)
- ✅ ExerciseBadge (4 variants)
- ✅ MuscleHint (4 variants)
- ✅ ExerciseCardFull
- ✅ Exercicios.tsx (cards)
- ✅ PreparacaoForm
- ✅ TreinamentoSessoesForm
- ✅ Periodizacao.tsx
- ✅ TreinamentoTemplates.tsx
- ✅ Imagens PNG
- ✅ Avatares SVG
- ✅ Coach IA (system prompt)
- ✅ WorkoutFocusCard
- ✅ MuscleTracker
- ✅ PracticeMode

### Testes
- ✅ 521 testes passando
- ✅ 0 erros TypeScript
- ✅ Lint passa
- ✅ Build OK

---

## 🛠️ Como executar

**Cada sprint é:**
1. **Planejar** — atualizar este roadmap com tarefas detalhadas
2. **Implementar** — código + testes
3. **Validar** — typecheck, lint, build, testes
4. **Documentar** — atualizar `docs/STATUS.md` com o que foi feito
5. **Commitar + Deploy** — push para main, deploy automático via GitHub Actions

**Critério para fechar sprint:**
- Todos os checkboxes marcados
- Testes passam
- Site continua funcional
- Commit no main + deploy verificado

**Em caso de dúvida sobre QUAL sprint fazer:**
- Pergunte: "qual sprint é agora?" → olhe este roadmap
- Nunca comece um sprint fora de ordem sem autorização

---

## 📚 Índice de docs relacionados
- `AUDIT-SPRINT-34.md` — auditoria inicial
- `AUDITORIA-COMPLETA-2026-09-22.md` — auditoria completa antes do roadmap
- `STATUS-2026-09-23.md` — status atualizado (criar no Sprint 64)
- `AUDIT-EXERCICIOS-2026-09-23.md` — auditoria dos 89 (Sprint 64)
- `CHECKLIST-EXPOSICAO-2026-09-23.md` — checklist dos 15 pontos (Sprint 65)
- `VALIDACAO-LEIGO-2026-09-23.md` — 10 perguntas validadas (Sprint 69)
- `GLOSSARIO-LEIGO.md` — termos leigos (Sprint 70)
- `GUIA-USUARIO-50+.md` — manual do usuário (Sprint 74)
- `GUIA-CRIADOR-CONTEUDO.md` — manual pra adicionar exercício (Sprint 74)
- `AUDITORIA-FINAL.md` — consolidação (Sprint 74)

---

**Versão:** 1.0
**Data:** 2026-09-23
**Owner:** TopPKB (Mavis agent)
