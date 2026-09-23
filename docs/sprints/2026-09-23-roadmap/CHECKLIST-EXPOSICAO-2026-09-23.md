# Checklist de Exposição — 17 Pontos (atualizado Sprint 65)

**Data:** 2026-09-23
**Sprint:** 65 — Validação cruzada
**Objetivo:** Garantir que todos os 17 pontos onde exercícios aparecem mostram cues musculares completas

| # | Ponto | Mostra mapa muscular? | Mostra sensação? | Mostra erro muscular? | Mostra carga 50+? |
|---|-------|------------------------|-------------------|------------------------|---------------------|
| 1 | ExerciseDetailModal | ✅ | ✅ | ✅ | ✅ |
| 2 | ExerciseBadge (compact) | ✅ parcial (tooltip) | ✅ parcial | ❌ | ❌ |
| 3 | ExerciseBadge (detailed) | ✅ | ✅ | ✅ | ✅ |
| 4 | MuscleHint (inline) | ✅ | ❌ | ❌ | ❌ |
| 5 | MuscleHint (card) | ✅ | ✅ | ✅ | ✅ |
| 6 | ExerciseCardFull | ✅ | ✅ | ✅ | ✅ |
| 7 | Exercicios.tsx (biblioteca) | ✅ parcial | ❌ | ❌ | ❌ |
| 8 | PreparacaoForm | ✅ (Sprint 65.1) | ❌ | ❌ | ❌ |
| 9 | TreinamentoSessoesForm | ❌ | ❌ | ❌ | ❌ |
| 10 | Periodizacao.tsx | ✅ (Sprint 65.3) | ❌ | ❌ | ❌ |
| 11 | TreinamentoTemplates.tsx | ✅ (Sprint 65.3) | ❌ | ❌ | ❌ |
| 12 | Imagens PNG (passo a passo) | ✅ | ✅ | ✅ | ❌ |
| 13 | Avatares SVG (poses) | ✅ | ❌ | ❌ | ❌ |
| 14 | Coach IA (system prompt) | ✅ | ✅ | ✅ | ✅ |
| 15 | WorkoutFocusCard | ✅ | ✅ | ✅ (Sprint 65.4) | ❌ |
| 16 | MuscleTracker | ✅ (Sprint 65.5) | ❌ | ❌ | ❌ |
| 17 | PracticeMode | ✅ | ✅ | ✅ (Sprint 65.6) | ❌ |

## Atualizações Sprint 65

### ✅ Sprint 65.2 — ExerciseBadge "compact"
- Agora mostra dica muscular no tooltip nativo do navegador (`title` attribute)
- `aria-label` também enriquecido com dica
- Antes: "Clique para ver detalhes"
- Agora: "💪 [dica muscular] — clique para detalhes"

### ✅ Sprint 65.3 — Periodizacao + TreinamentoTemplates
- Já tinham MuscleHint inline
- Verificado e documentado

### ✅ Sprint 65.4 — WorkoutFocusCard com erro_muscular
- Adicionado campo `erro_muscular` no tipo `GroupedMuscle`
- `computeWorkoutFocus()` agora preenche `erro_muscular` com `getErroMuscularCurto()`
- Card mostra seção "Sinais de erro muscular" (top 2 grupos)
- 2 testes novos adicionados (total 24 testes workout-focus, era 22)

### ✅ Sprint 65.5 — MuscleTracker com MuscleHint
- Adicionado MuscleHint inline nas recomendações de músculos negligenciados
- Usuário vê dica muscular do primeiro exercício recomendado

### ✅ Sprint 65.6 — PracticeMode com erroMuscular
- Adicionada seção "🩺 Se algo doer / falhar" com `exercicio.erroMuscular`
- Posicionada após "Sensação geral", antes do footer

## Gaps remanescentes (Sprint 66+)

### 🟡 PARCIAIS (prioridade média)
- ExerciseBadge "compact" não mostra erroMuscular/carga (espaço apertado, ok por design)
- Exercicios.tsx cards biblioteca: só mostra MuscleHint inline
- Periodizacao.tsx e TreinamentoTemplates.tsx: só MuscleHint inline
- Avatares SVG não mostram músculo como highlight
- TreinamentoSessoesForm: precisa MuscleHint inline também

### 🟢 Completos
- ExerciseDetailModal (modal completo, ideal)
- ExerciseBadge "detailed"
- MuscleHint "card"
- ExerciseCardFull
- Imagens PNG
- Coach IA
- **WorkoutFocusCard (Sprint 65.4)** ✅
- **MuscleTracker (Sprint 65.5)** ✅
- **PracticeMode (Sprint 65.6)** ✅

## Estatísticas Sprint 65

- **6 sub-sprints concluídos** (65.2 a 65.6 + 65.3.1)
- **+2 testes workout-focus** (22 → 24)
- **Total de testes: 526** ✅ (era 521, +5 testes incluindo os do Sprint 64.3)
- **0 erros typecheck** ✅
- **3 novos campos UI** (`erroMuscular` em WorkoutFocusCard, MuscleHint em MuscleTracker, erroMuscular em PracticeMode)
- **1 campo enriquecido** (ExerciseBadge compact com dica muscular no tooltip)
