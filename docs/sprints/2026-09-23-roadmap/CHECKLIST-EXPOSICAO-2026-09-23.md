# Checklist de Exposição — 15 Pontos

**Data:** 2026-09-23
**Sprint:** 65
**Objetivo:** Garantir que todos os 15 pontos onde exercícios aparecem mostram cues musculares completas

| # | Ponto | Mostra `mapaMuscularLeigo`? | Mostra `sensacaoPrincipal`? | Mostra `erroMuscular`? | Mostra `cargaInicial50mais`? |
|---|-------|---------------------------|---------------------------|---------------------|------------------------------|
| 1 | ExerciseDetailModal | ✅ | ✅ | ✅ | ✅ |
| 2 | ExerciseBadge (variant="compact") | ✅ parcial | ❌ | ❌ | ❌ |
| 3 | ExerciseBadge (variant="detailed") | ✅ | ✅ | ✅ | ✅ |
| 4 | MuscleHint (variant="inline") | ✅ | ❌ | ❌ | ❌ |
| 5 | MuscleHint (variant="card") | ✅ | ✅ | ✅ | ✅ |
| 6 | ExerciseCardFull | ✅ | ✅ | ✅ | ✅ |
| 7 | Exercicios.tsx (cards biblioteca) | ✅ parcial | ❌ | ❌ | ❌ |
| 8 | PreparacaoForm | ❌ | ❌ | ❌ | ❌ |
| 9 | TreinamentoSessoesForm | ❌ | ❌ | ❌ | ❌ |
| 10 | Periodizacao.tsx | ✅ parcial | ❌ | ❌ | ❌ |
| 11 | TreinamentoTemplates.tsx | ✅ parcial | ❌ | ❌ | ❌ |
| 12 | Imagens PNG (passo a passo) | ✅ | ✅ | ✅ | ❌ |
| 13 | Avatares SVG (poses) | ✅ | ❌ | ❌ | ❌ |
| 14 | Coach IA (system prompt) | ✅ | ✅ | ✅ | ✅ |
| 15 | WorkoutFocusCard | ✅ | ✅ | ❌ | ❌ |
| 16 | MuscleTracker | ✅ | ❌ | ❌ | ❌ |
| 17 | PracticeMode | ✅ | ✅ | ✅ | ❌ |

## Gaps identificados

### 🔴 FALTAM (prioridade alta)
- **PreparacaoForm**: NÃO mostra mapaMuscularLeigo — usuário registra treino sem saber qual músculo está trabalhando
- **TreinamentoSessoesForm**: MESMO PROBLEMA

### 🟡 PARCIAIS (prioridade média)
- ExerciseBadge "compact" mostra só nome do exercício, sem dica muscular
- Exercicios.tsx (cards biblioteca) — só mostra MuscleHint inline, não mostra sensacaoPrincipal/erroMuscular
- Periodizacao.tsx e TreinamentoTemplates.tsx — mesmos parciais
- Avatares SVG não mostram o músculo sendo trabalhado como highlight
- WorkoutFocusCard não mostra erroMuscular (só cor + nome + dica)

### 🟢 Completos (mantidos)
- ExerciseDetailModal (modal completo)
- ExerciseBadge "detailed"
- MuscleHint "card"
- ExerciseCardFull
- Imagens PNG (passo a passo)
- Coach IA

## Ações

1. **Adicionar MuscleHint inline em PreparacaoForm** após seleção de exercício (5 min)
2. **Adicionar MuscleHint inline em TreinamentoSessoesForm** após seleção de exercício (5 min)
3. **Expandir ExerciseBadge compact** para incluir ícone com tooltip de dica muscular (15 min)
4. **Expandir Exercicios.tsx cards** para mostrar `sensacaoPrincipal` em tooltip (10 min)
5. **Periodizacao/TreinamentoTemplates**: garantir MuscleHint visível na lista (10 min)
6. **Adicionar highlight muscular nos avatares SVG** com cor (Sprint 67)
7. **Adicionar erroMuscular no WorkoutFocusCard** como tooltip (5 min)
8. **Adicionar MuscleHint no MuscleTracker** (10 min)
9. **Adicionar erroMuscular no PracticeMode** (já tem via MuscleHint?)
