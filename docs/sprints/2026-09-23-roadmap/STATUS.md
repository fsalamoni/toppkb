# STATUS — Top Pickleball 50+ — 23/09/2026

**Roadmap:** [00-ROADMAP-PRINCIPAL.md](./00-ROADMAP-PRINCIPAL.md)

## Sprint atual: **SPRINT 65** (validação cruzada de exposição)

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

### 🔄 Sprint 65.2-65.9 — Validação cruzada 17 pontos de exposição (próximo)

## Próximos sprints

- **Sprint 66**: Anatomia nas imagens PNG (silhueta)
- **Sprint 67**: Anatomia detalhada nos avatares SVG
- **Sprint 68**: Vídeos demonstrativos (avatares animados)
- **Sprint 69**: Validação de usuário (5-10 exercícios como leigo)
- **Sprint 70**: Revisão linguística (glossário leigo)
- **Sprint 71**: OndeSentir visual (anatomia clicável)
- **Sprint 72**: Cache de imagens/vídeos (PWA offline)
- **Sprint 73**: Métricas de uso (analytics)
- **Sprint 74**: Documentação final

## Commits da sessão Sprint 64.3

```
430f6a9 feat(roadmap): SPRINT 64.3 CONCLUÍDO - 0 exercícios abaixo de 80!
5f3c015 feat(roadmap): SPRINT 64.3h - mais 4 exercícios perfeitos (push-press, high-pull, single-arm-row, yoke-walk)
7b5b96c feat(roadmap): SPRINT 64.3g - mais 4 exercícios perfeitos (glute-bridge, walking-lunge, reverse-lunge, double-kb-front-squat)
3502a17 feat(roadmap): SPRINT 64.3f - mais 4 exercícios perfeitos (floor-press, cross-body-carry, good-morning)
90d3d7a feat(roadmap): SPRINT 64.3e - mais 5 exercícios perfeitos (flow-sequence, burpee, step-up, reverse-step-up)
2ccd5bf feat(roadmap): SPRINT 64.3d - mais 5 exercícios perfeitos (rack-carry, viking-push-press, bottoms-up-swing, side-press)
900f493 feat(roadmap): SPRINT 64.3c - mais 5 exercícios perfeitos (double-push-press, muscle-up, bottoms-up-carry, see-saw-press, curtsy-lunge)
9fc175e feat(roadmap): SPRINT 64.3b - mais 5 exercícios perfeitos (tgu-floor, tgu-to-ohs, shrimp-squat, around-the-world, side-plank-kb)
1aaa89b feat(roadmap): SPRINT 64.3 - reescrever 5 exercícios com score < 80 (waiter-walk, jerk, cuban-press, around-the-body, man-maker, lateral-lunge, overhead-carry)
```

## Bugs corrigidos nesta sessão

### 🐛 `scripts/audit_exercicios.py`
- **Problema:** `extract_steps` pegava `step_body` apenas até o primeiro `],` (após as cues), perdendo as `sensacoes` e `alertasMusculares` que vinham depois.
- **Fix:** Para o último step (sem próximo `{ numero:`), usar `rest[:1500]` para pegar todo o conteúdo até o fim do objeto.
- **Impacto:** Score médio subiu de 71.9 → 80.4 inicialmente, revelando 49 exercícios já bons (eram 0 acima de 80).

### 🐛 Typo "desc描述" em alguns exercícios
- Vários exercícios tinham typo onde `descricao` foi escrito como `desc描述` (caracteres chineses).
- **Fix:** Corrigido via replace_all onde necessário. Causava erro TS2353 ("Object literal may only specify known properties").

## Estatísticas finais pós Sprint 64.3

- **89/89 exercícios** com score >= 80 ✅
- **43/89 (48%) perfeitos**
- **Score médio: 90.0/100**
- **typecheck: 0 erros** ✅
- **Build: OK** ✅
