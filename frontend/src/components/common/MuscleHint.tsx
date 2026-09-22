/**
 * MuscleHint — Tooltip/card reutilizável com dica muscular (ONDE SENTIR)
 * Para usar em ExerciseBadge, listas, e qualquer ponto onde o exercício é citado.
 */
import * as LucideIcons from 'lucide-react';
import { Activity } from 'lucide-react';

const { Sparkles, AlertTriangle } = LucideIcons;

import { useMemo } from 'react';
import { getDicaMuscularCurta, getErroMuscularCurto, getTopMusculaturas } from '@/data/seed/exercicios-kettlebell';

type Variant = 'tooltip' | 'card' | 'inline' | 'badge';

interface MuscleHintProps {
  exerciseId: string;
  variant?: Variant;
  className?: string;
}

export function MuscleHint({ exerciseId, variant = 'inline', className = '' }: MuscleHintProps) {
  const dica = useMemo(() => getDicaMuscularCurta(exerciseId), [exerciseId]);
  const erro = useMemo(() => getErroMuscularCurto(exerciseId), [exerciseId]);
  const topMucs = useMemo(() => getTopMusculaturas(exerciseId, 2), [exerciseId]);

  if (!dica && !erro && topMucs.length === 0) return null;

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1 text-xs text-blue-400 ${className}`}
        role="img"
        aria-label={`Músculo principal: ${topMucs[0] ?? 'ver detalhes'}`}
      >
        <Activity className="h-3 w-3" aria-hidden="true" />
        <span>{topMucs[0] ?? 'Ver detalhes'}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={`text-xs space-y-1 ${className}`}
        role="group"
        aria-label="Dicas musculares"
      >
        {topMucs.length > 0 && (
          <div className="flex items-start gap-1.5 text-blue-400">
            <Activity className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="leading-snug">
              <span className="font-semibold">Onde sentir: </span>
              {topMucs[0]}
            </span>
          </div>
        )}
        {dica && (
          <div className="flex items-start gap-1.5 text-emerald-400">
            <Sparkles className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="leading-snug line-clamp-2">{dica}</span>
          </div>
        )}
        {erro && (
          <div
            className="flex items-start gap-1.5 text-amber-400"
            role="alert"
          >
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="leading-snug line-clamp-2">{erro}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`space-y-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 ${className}`}
        role="region"
        aria-label="Dicas musculares detalhadas"
      >
        {topMucs.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              ONDE SENTIR
            </div>
            <ul className="space-y-0.5">
              {topMucs.map((m, i) => (
                <li key={i} className="text-xs text-blue-200 leading-snug">
                  • {m}
                </li>
              ))}
            </ul>
          </div>
        )}
        {dica && (
          <div>
            <div className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              SENSAÇÃO PRINCIPAL
            </div>
            <p className="text-xs text-emerald-100 leading-snug">{dica}</p>
          </div>
        )}
        {erro && (
          <div>
            <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              ERRO MUSCULAR
            </div>
            <p className="text-xs text-amber-100 leading-snug">{erro}</p>
          </div>
        )}
      </div>
    );
  }

  // tooltip - renderizado como inline (porque o componente pai cuida do popover)
  return (
    <div className={`text-xs space-y-1 max-w-xs ${className}`}>
      {topMucs.length > 0 && (
        <div className="font-semibold text-blue-400">💪 {topMucs.join(' · ')}</div>
      )}
      {dica && <div className="text-emerald-300 line-clamp-3">{dica}</div>}
      {erro && <div className="text-amber-300 italic line-clamp-3">⚠️ {erro}</div>}
    </div>
  );
}
