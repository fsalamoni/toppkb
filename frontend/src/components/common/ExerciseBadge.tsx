/**
 * ExerciseBadge — badge clicável que abre detalhes do exercício
 *
 * Onde usar:
 * - PreparacaoList: lista de exercícios por sessão
 * - TreinamentoSessoesForm: select de exercícios
 * - Qualquer local que mostra o nome do exercício
 *
 * USO:
 *   const { showExercise, ModalRoot } = useExerciseModal();
 *   return (
 *     <>
 *       <ExerciseBadge
 *         name="Goblet Squat"
 *         onShow={showExercise}
 *       />
 *       {ModalRoot}
 *     </>
 *   );
 */
import { Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  KETTLEBELL_EXERCICIOS,
  type ExercicioKettlebell,
} from '@/data/seed/exercicios-kettlebell';
import { EXERCICIOS } from '@/data/seed/exercicios';
import { MuscleHint } from './MuscleHint';

interface ExerciseBadgeProps {
  /** ID do exercício (preferencial) */
  id?: string;
  /** Ou nome do exercício (fallback) */
  name?: string;
  /** Variante visual */
  variant?: 'default' | 'compact' | 'detailed';
  /** Callback para abrir o modal */
  onShow?: (ex: ExercicioKettlebell) => void;
  /** Classes adicionais */
  className?: string;
}

/**
 * Buscar exercício por ID ou nome (case-insensitive contains)
 */
function findExercise(idOrName: string): ExercicioKettlebell | null {
  // 1) Por ID
  const byId =
    KETTLEBELL_EXERCICIOS.find((ex) => ex.id === idOrName) ||
    (EXERCICIOS as any[]).find((ex) => ex.id === idOrName);
  if (byId) return byId as ExercicioKettlebell;

  // 2) Por nome (case-insensitive)
  const lower = idOrName.toLowerCase().trim();
  const byName =
    KETTLEBELL_EXERCICIOS.find(
      (ex) => ex.nome.toLowerCase().includes(lower),
    ) ||
    (EXERCICIOS as any[]).find(
      (ex) => (ex.nome ?? ex.name ?? '').toLowerCase().includes(lower),
    );
  if (byName) return byName as ExercicioKettlebell;

  return null;
}

export function ExerciseBadge({
  id,
  name,
  variant = 'default',
  onShow,
  className,
}: ExerciseBadgeProps) {
  const identifier = id ?? name ?? '';
  const exercise = id ? findExercise(id) : null;
  const displayName = exercise?.nome ?? name ?? id ?? '';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (exercise && onShow) {
      onShow(exercise);
    }
  };

  if (!exercise) {
    return (
      <span
        className={cn(
          'inline-block text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground italic',
          className,
        )}
        title={`Sem detalhes de exercício: ${identifier}`}
      >
        {displayName}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
          className,
        )}
        title="Clique para ver detalhes completos"
      >
        <Info className="h-3 w-3" />
        <span>{displayName}</span>
      </button>
    );
  }

  if (variant === 'detailed') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group flex items-start gap-3 px-3 py-2 rounded-lg border bg-card hover:border-emerald-500/50 transition-all text-left w-full',
          className,
        )}
      >
        {exercise.imageUrl && (
          <img
            src={exercise.imageUrl}
            alt=""
            className="h-12 w-12 rounded-md object-cover flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="font-medium text-sm">{displayName}</div>
          {exercise.focoPrincipal && (
            <div className="text-xs text-muted-foreground">
              {exercise.focoPrincipal}
            </div>
          )}
          {/* DICA MUSCULAR (sempre visível em variant="detailed") */}
          <MuscleHint exerciseId={exercise.id} variant="inline" />
        </div>
        <Info className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
      </button>
    );
  }

  // default
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
        className,
      )}
      title="Clique para ver detalhes"
    >
      <span>{displayName}</span>
    </button>
  );
}

/**
 * Lista de badges de exercícios com ModalRoot opcional
 *
 * USO:
 *   const { items, showExercise, ModalRoot } = useExerciseList();
 *
 *   {items.map(id => (
 *     <ExerciseBadge key={id} id={id} onShow={showExercise} />
 *   ))}
 *
 *   {ModalRoot}
 */
/**
 * Hook helper para abrir modal de QUALQUER exercício (kettlebell ou geral)
 *
 * USO:
 *   const { showExercise, ModalRoot } = useExerciseModal();
 *   <button onClick={() => showExercise(ex)}>Ver detalhes</button>
 *   return <>{ModalRoot}</>;
 */
// NOTA: useExerciseModal está exportado de ExerciseDetailModal.tsx
// Este arquivo re-exporta para conveniência
export { useExerciseModal } from './ExerciseDetailModal';

/**
 * Verifica se um ID de exercício é válido e retorna o objeto
 */
export function getExerciseById(id: string) {
  return findExercise(id);
}

// Loader para casos async (não usado ainda mas preparado)
export const ExerciseBadgeLoading = () => (
  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted">
    <Loader2 className="h-3 w-3 animate-spin" />
    ...
  </span>
);
