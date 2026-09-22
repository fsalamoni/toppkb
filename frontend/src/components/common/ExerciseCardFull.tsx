/**
 * ExerciseCardFull — Card completo de exercício com dicas musculares visíveis.
 * Para usar em páginas de seleção (PreparacaoForm, TreinamentoSessoesForm).
 */
import * as LucideIcons from 'lucide-react';

const { Dumbbell, Activity, ChevronRight, Sparkles, AlertTriangle } = LucideIcons;

import { cn } from '@/lib/utils';
import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';
import type { ExercicioKettlebell } from '@/data/seed/exercicios-kettlebell';

interface ExerciseCardFullProps {
  exerciseId: string;
  onShow?: (ex: ExercicioKettlebell) => void;
  isSelected?: boolean;
  onToggle?: () => void;
  className?: string;
  /** "compact" mostra menos detalhes, "full" mostra todos */
  size?: 'compact' | 'full';
}

export function ExerciseCardFull({
  exerciseId,
  onShow,
  isSelected = false,
  onToggle,
  className,
  size = 'full',
}: ExerciseCardFullProps) {
  const exercise = KETTLEBELL_EXERCICIOS.find((e) => e.id === exerciseId);
  if (!exercise) return null;

  const topMucs = exercise.mapaMuscularLeigo?.slice(0, 2) ?? [];

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card hover:border-emerald-500/50 transition-all overflow-hidden',
        isSelected && 'border-emerald-500 bg-emerald-500/5',
        className,
      )}
    >
      <div className="flex items-start gap-3 p-3">
        {exercise.imageUrl && (
          <img
            src={exercise.imageUrl}
            alt=""
            className="h-16 w-16 rounded-md object-cover flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm leading-tight">{exercise.nome}</h4>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Dumbbell className="h-3 w-3" />
                <span>{exercise.padraoKb}</span>
                <span>·</span>
                <span className="capitalize">{exercise.nivel}</span>
              </div>
            </div>
            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-label={isSelected ? 'Remover' : 'Adicionar'}
                className={cn(
                  'h-7 w-7 rounded-md text-xs font-bold border transition-colors shrink-0',
                  isSelected
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-border hover:border-emerald-500/50',
                )}
              >
                {isSelected ? '✓' : '+'}
              </button>
            )}
          </div>

          {size === 'full' && topMucs.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex items-start gap-1.5 text-xs text-blue-400 leading-snug">
                <Activity className="h-3 w-3 mt-0.5 shrink-0" />
                <div className="line-clamp-2">
                  <span className="font-semibold">Onde sentir: </span>
                  {topMucs.join(' · ')}
                </div>
              </div>
              {exercise.sensacaoPrincipal && (
                <div className="flex items-start gap-1.5 text-xs text-emerald-400 leading-snug">
                  <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                  <div className="line-clamp-2">{exercise.sensacaoPrincipal}</div>
                </div>
              )}
              {exercise.erroMuscular && (
                <div className="flex items-start gap-1.5 text-xs text-amber-400 leading-snug">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <div className="line-clamp-2 italic">{exercise.erroMuscular}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {onShow && (
        <button
          type="button"
          onClick={() => onShow(exercise)}
          className="w-full text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 border-t border-border px-3 py-1.5 flex items-center justify-center gap-1"
        >
          Ver detalhes completos (passo a passo)
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
