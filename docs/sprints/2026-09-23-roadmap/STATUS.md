# STATUS — Top Pickleball 50+ — 23/09/2026

**Roadmap:** [00-ROADMAP-PRINCIPAL.md](./00-ROADMAP-PRINCIPAL.md)

## Sprint atual: **SPRINT 67** (Anatomia detalhada nos avatares SVG)

## Progresso

### ✅ Sprint 64.1 — `scripts/audit_exercicios.py` criado
- Analisa 89 exercícios automaticamente
- Calcula score 0-100 baseado em 14 critérios
- Gera AUDIT-EXERCICIOS-2026-09-23.md

### ✅ Sprint 64.2 — Auditoria rodada
- **Score médio inicial: 80.4/100** (era 71.9 antes do fix do regex)
- **89/89 exercícios** analisados
- **49/89 (55%)** acima de 80
- **4/89 (4%)** perfeitos (>=95): swing-2h-hardstyle, swing-1h, deadlift, swing-sport
- **40/89 (45%)** abaixo de 80 — precisavam melhorar

### ✅ Sprint 64.3 — CONCLUÍDO! Todos exercícios reescritos com score >= 80

**OBJETIVO ALCANÇADO: 0 exercícios abaixo de 80!**

- **Score médio final: 90.0/100** (aumento de +9.6 pontos vs 80.4 inicial)
- **89/89 exercícios >= 80** ✅
- **43/89 (48%) perfeitos (>=95)** — vs 4 inicialmente
- **46/89 (52%) bons (80-94)** — todos passaram do limite
- **Mínimo: 80** (era 68)
- **Máximo: 97** (mantido)

**Total de exercícios reescritos nesta sessão:** 36 (todos com score < 80 inicialmente)

**Distribuição final por score:**
| Faixa | Qtd | % |
|-------|-----|---|
| Perfeitos (>=95) | 43 | 48% |
| Bons (80-94) | 46 | 52% |
| Abaixo de 80 | 0 | 0% |

**Distribuição por padrão KB (score médio):**
| Padrão | Qtd | Score médio |
|--------|-----|-------------|
| CARRY | 8 | 94.8 (top) |
| COND | 17 | 93.6 |
| HINGE | 8 | 91.9 |
| SQUAT | 15 | 91.3 |
| PRESS | 14 | 87.8 |
| FLOW | 7 | 86.3 |
| PULL | 9 | 86.3 |
| ROT | 11 | 85.6 |

**Padrão de cada exercício reescrito agora tem:**
- `mapaMuscularLeigo` com 4-17 itens (linguagem leiga)
- `descricao` >= 80 chars
- 2+ sensações por step (músculos trabalhando)
- 1+ alerta muscular por step
- `alerta50mais` (específico para 50+)
- `contraIndicacoes` (3-5 condições)
- `evidencia` (citação científica)
- `analogiaInicial` (referência do cotidiano)
- `cargaInicial50mais` (progressão)
- `erroMuscular` (sintoma → causa)
- `sensacaoPrincipal` (o que sentir)

### ✅ Sprint 65.1 — MuscleHint em PreparacaoForm (concluído em sprint anterior)
- Adicionado componente MuscleHint variant="card" em PreparacaoForm
- Usuário vê mapa muscular leigo ao configurar preparação

### ✅ Sprint 65.2-65.6 — Validação cruzada 17 pontos de exposição — **CONCLUÍDO**

**Sub-sprints completados:**

- **Sprint 65.2** — ExerciseBadge "compact" com dica muscular no tooltip nativo + aria-label
- **Sprint 65.3** — Verificado: Periodizacao + TreinamentoTemplates já tinham MuscleHint inline
- **Sprint 65.4** — WorkoutFocusCard agora mostra `erro_muscular` (sintoma → causa) por grupo muscular + 2 testes novos (workout-focus: 22 → 24)
- **Sprint 65.5** — MuscleTracker adiciona MuscleHint inline nas recomendações de músculos negligenciados
- **Sprint 65.6** — PracticeMode tem nova seção "🩺 Se algo doer / falhar" com `erroMuscular`

**Resultado:** 17 pontos de exposição agora com cobertura completa das cues musculares.

### ✅ Sprint 66 — Anatomia nas PNGs (silhueta + músculo destacado) — **CONCLUÍDO**

**Layout v6 das imagens (substitui v5):**
- Lado ESQUERDO: silhueta humana neutra com músculo destacado em cor
- Lado DIREITO: texto didático (título, descrição, cues técnicos, onde sentir)
- Label do músculo próximo ao destaque ('GLÚTEO MÁXIMO (bumbum)', 'DELTÓIDE (ombro)', etc)
- Cada step destaca um músculo diferente do mesmo padrão KB

**Entregas:**
- ✅ Silhueta humana SVG (frente + costas) implementada em `scripts/silhueta_humana.py`
- ✅ Mapeamento `PADRAO_MUSCULOS` (HINGE→glúteo+isquio, SQUAT→quadríceps+glúteo, etc)
- ✅ `regen_step_images.py` modificado (split silhueta/texto)
- ✅ 372 PNGs regeneradas com anatomia destacada
- ✅ Tamanho médio: 60KB por PNG (era 100KB)

**Validação visual:**
- Swing HINGE → glúteo destacado em verde ✅
- Goblet Squat → glúteo destacado em verde ✅
- Push Press → deltóide destacado em roxo ✅
- Windmill → deltóide destacado em pink ✅

**Bonus:**
- Bug encontrado: teste flaky `computeHeatmap > sessionCount reflete...` (quebrava perto de meia-noite UTC)
- Fix: usar `+1min` em vez de `+1h` (sempre fica no mesmo dia)
- CI fix: `timeout-minutes: 15` para test-frontend + step typecheck antes do test

## Próximos sprints

- **Sprint 67**: Anatomia detalhada nos avatares SVG (articulações, ângulos, KB realista)
- **Sprint 68**: Vídeos demonstrativos (avatares animados)
- **Sprint 69**: Validação de usuário (5-10 exercícios como leigo)
- **Sprint 70**: Revisão linguística (glossário leigo)
- **Sprint 71**: OndeSentir visual (anatomia clicável)
- **Sprint 72**: Cache de imagens/vídeos (PWA offline)
- **Sprint 73**: Métricas de uso (analytics)
- **Sprint 74**: Documentação final

## Commits da sessão Sprint 64.3 + 65 + 66

```
6aa88ed ci: adicionar timeout-minutes e step typecheck
f593013 feat(roadmap): SPRINT 66 - silhueta humana + músculo destacado nas PNGs
947cacb test(heatmap): corrige teste flaky que falhava perto de meia-noite UTC
7e4cd13 docs(roadmap): STATUS.md com Sprint 65 CONCLUÍDO + nota sobre deploy
d5cdf7d feat(roadmap): SPRINT 65 - validação cruzada 17 pontos de exposição
5e0111a docs(roadmap): atualizar STATUS.md com Sprint 64.3 CONCLUÍDO
430f6a9 feat(roadmap): SPRINT 64.3 CONCLUÍDO - 0 exercícios abaixo de 80!
```

## Bugs corrigidos nesta sessão

### 🐛 `scripts/audit_exercicios.py`
- **Problema:** `extract_steps` pegava `step_body` apenas até o primeiro `],` (após as cues), perdendo as `sensacoes` e `alertasMusculares` que vinham depois.
- **Fix:** Para o último step (sem próximo `{ numero:`), usar `rest[:1500]` para pegar todo o conteúdo até o fim do objeto.
- **Impacto:** Score médio subiu de 71.9 → 80.4 inicialmente, revelando 49 exercícios já bons (eram 0 acima de 80).

### 🐛 Typo "desc描述" em alguns exercícios
- Vários exercícios tinham typo onde `descricao` foi escrito como `desc描述` (caracteres chineses).
- **Fix:** Corrigido via replace_all onde necessário. Causava erro TS2353 ("Object literal may only specify known properties").

## Estatísticas finais pós Sprint 65

- **89/89 exercícios** com score >= 80 ✅
- **43/89 (48%) perfeitos** (>= 95)
- **Score médio: 90.0/100**
- **typecheck: 0 erros** ✅
- **testes: 526/526** ✅ (era 521, +5 testes Sprint 65)
- **17 pontos de exposição** com cues musculares completas
- **Build: OK** ✅ (250KB gzip 72KB)

## Deploy

✅ **Deploy de produção CONCLUÍDO automaticamente via GitHub Actions!**

Pipeline `.github/workflows/deploy-prod.yml` está configurado:
- Trigger: push em `main` → deploy automático
- Usa `FIREBASE_SERVICE_ACCOUNT` (secret) + VITE_FIREBASE_* (secrets)
- Faz build frontend + build functions + `firebase deploy`
- Smoke test em `https://toppkb.web.app/login`

**Últimos deploys confirmados via GitHub API:**
| Commit | Workflow | Status | Timestamp |
|--------|----------|--------|-----------|
| `7e4cd13` | Deploy Production | ✅ success | 2026-09-23 21:53 UTC |
| `7e4cd13` | CI | ✅ success | 2026-09-23 21:53 UTC |
| `7e4cd13` | Lint | ✅ success | 2026-09-23 21:53 UTC |
| `7e4cd13` | CodeQL | ✅ success | 2026-09-23 21:53 UTC |
| `d5cdf7d` | Deploy Production | ✅ success | 2026-09-23 21:47 UTC |

Site em produção: https://toppkb.web.app — Respondendo HTTP 200 ✅

## Roadmap 66+

- **Sprint 66**: Anatomia nas imagens PNG (silhueta humana SVG + músculo destacado)
- **Sprint 67**: Anatomia detalhada nos avatares SVG (articulações, ângulos, KB realista)
- **Sprint 68**: **VÍDEOS demonstrativos** (~370 vídeos) — MAIOR GAP
- **Sprint 69**: Validação usuário leigo
- **Sprint 70**: Revisão linguística (glossário)
- **Sprint 71**: OndeSentir visual (anatomia clicável)
- **Sprint 72**: Cache PWA offline
- **Sprint 73**: Métricas de uso (analytics)
- **Sprint 74**: Documentação final
