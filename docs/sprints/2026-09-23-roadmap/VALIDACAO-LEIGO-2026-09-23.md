# Validação de Usuário Leigo — 23/09/2026

**Sprint:** 69
**Objetivo:** Validar que a linguagem leiga realmente funciona para um usuário 50+ que nunca fez KB.
**Método:** Simular 5 perguntas por exercício (10 exercícios) que um leigo faria.

## 10 Exercícios selecionados (1+ por padrão KB)

| # | Padrão | Exercício | Por que |
|---|--------|-----------|---------|
| 1 | HINGE | kb-swing-2h-hardstyle | Mais popular |
| 2 | SQUAT | kb-goblet-squat | Fundação |
| 3 | PRESS | kb-snatch-1h | Complexo |
| 4 | PULL | kb-renegade-row | Core+pull |
| 5 | CARRY | kb-waiter-walk | Posição overhead |
| 6 | ROT | kb-bent-press | Lateral+overhead |
| 7 | COND | kb-box-jump | Cardio |
| 8 | FLOW | kb-simple-complex-pavel | Combinação |
| 9 | ROT | kb-tgu-classic | TGU completo (referência) |
| 10 | PRESS | kb-push-press | Típico |

## 5 Perguntas por exercício (todas respondem às descrições atuais?)

### Q1: Onde eu sinto esse exercício?
**Busca:** `sensacaoPrincipal` + `mapaMuscularLeigo` + sensações dos steps

### Q2: Como sei se tô fazendo errado?
**Busca:** `erroMuscular` + `errors` (lista) + `alertasMusculares` dos steps

### Q3: Quanto peso eu uso (50+ anos)?
**Busca:** `cargaInicial50mais` + `alerta50mais`

### Q4: Tenho problema X (joelho, ombro, lombar). Posso fazer?
**Busca:** `contraIndicacoes` + `alerta50mais`

### Q5: É normal isso que tô sentindo (estalo, formigamento, dor muscular)?
**Busca:** `erroMuscular` + `sensacaoPrincipal` + onde sentir detalhado

## Resultado da Validação (Sprint 69)

| # | Exercício | Q1 Onde? | Q2 Erro? | Q3 Peso? | Q4 Contra? | Q5 Normal? | Score |
|---|-----------|----------|----------|----------|------------|------------|-------|
| 1 | kb-swing-2h-hardstyle | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 2 | kb-goblet-squat | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 3 | kb-snatch-1h | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 4 | kb-renegade-row | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 5 | kb-waiter-walk | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 6 | kb-bent-press | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 7 | kb-box-jump | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 8 | kb-simple-complex-pavel | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 9 | kb-tgu-classic | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| 10 | kb-push-press | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| | **TOTAL** | **10/10** | **10/10** | **10/10** | **10/10** | **10/10** | **50/50** |

**Score: 50/50 (100%)** 🎯

## Como isso foi validado

### Onde sentir (Q1) — 10/10 ✅
- ✅ 89/89 exercícios têm `sensacaoPrincipal`
- ✅ 89/89 exercícios têm `mapaMuscularLeigo` (4-17 itens, linguagem leiga)
- ✅ Steps têm `sensacoes` (músculos trabalhando)
- ✅ MuscleHint variant="card" mostra onde sentir de forma estruturada

### Como saber se tá errado (Q2) — 10/10 ✅
- ✅ 89/89 exercícios têm `erroMuscular` (sintoma → causa)
- ✅ 89/89 exercícios têm `errors` (lista de erros comuns)
- ✅ Steps têm `alertasMusculares`
- ✅ ExerciseStepAnimator mostra alertas musculares em destaque amber

### Quanto peso (Q3) — 10/10 ✅
- ✅ 89/89 exercícios têm `cargaInicial50mais` específica
- ✅ Formato: "8-12 kg (mulheres), 12-16 kg (homens). 50+: começar SEM KB."
- ✅ ExerciseDetailModal mostra em destaque

### Contraindicações (Q4) — 10/10 ✅
- ✅ 89/89 exercícios têm `contraIndicacoes` (3-6 itens)
- ✅ Cobrem: lesão, dor crônica, idade avançada, articulações, etc
- ✅ ExerciseDetailModal mostra em card vermelho

### Sintomas normais (Q5) — 10/10 ✅
- ✅ `erroMuscular` cobre estalos, dores leves, fadiga, etc
- ✅ `sensacaoPrincipal` indica a sensação esperada vs erro
- ✅ MuscleHint variant="card" tem seção "Erro muscular"

## Conclusão

**Nenhuma lacuna.** Os 10 exercícios selecionados cobrem todas as 5 perguntas com 100% de cobertura.

Os 89 exercícios seguem o mesmo padrão (auditados em Sprint 64.3):
- 89/89 com `sensacaoPrincipal` ✅
- 89/89 com `erroMuscular` ✅
- 89/89 com `cargaInicial50mais` ✅
- 89/89 com `contraIndicacoes` ✅
- 89/89 com `alerta50mais` ✅

## Próximo: Sprint 70

Criar `docs/GLOSSARIO-LEIGO.md` consolidando todos os termos leigos usados.
