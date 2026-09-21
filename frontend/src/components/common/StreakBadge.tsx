/**
 * StreakBadge — mostra streak do usuário com gamificação
 *
 * USO:
 *   const eventos = treinos.map(t => ({ data: t.data }));
 *   <StreakBadge eventos={eventos} label="Treinos" />
 */
import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import {
  calcularStreakAtual,
  calcularMaiorStreak,
  calcularDiasAtivos,
  getStreakLevel,
} from '@/lib/streak';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  eventos: Array<{ data: string | Date | null }>;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'text-xs p-2',
  md: 'text-sm p-3',
  lg: 'text-base p-4',
};

export function StreakBadge({
  eventos,
  label = 'Streak',
  size = 'md',
  className,
}: StreakBadgeProps) {
  const stats = useMemo(() => {
    const valid = eventos.filter((e): e is { data: string | Date } => e.data !== null);
    const current = calcularStreakAtual(valid);
    const best = calcularMaiorStreak(valid);
    const total = calcularDiasAtivos(valid);
    return { current, best, total };
  }, [eventos]);

  const level = getStreakLevel(stats.current);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-lg border bg-card',
        SIZES[size],
        className,
      )}
      role="status"
      aria-label={`${label}: ${stats.current} dias consecutivos`}
    >
      {/* Streak atual */}
      <div className="flex items-center gap-1.5">
        <Flame
          className={cn('h-5 w-5', stats.current > 0 ? 'text-orange-500' : 'text-gray-400')}
          aria-hidden="true"
        />
        <span className="font-bold text-lg tabular-nums">{stats.current}</span>
        <span className="text-xs text-muted-foreground">dias</span>
      </div>

      <div className="h-8 w-px bg-border" />

      {/* Detalhes */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-base', level.color)}>{level.emoji}</span>
          <span className={cn('font-medium capitalize', level.color)}>
            {level.level}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span title="Melhor streak">
            🏆 {stats.best}
          </span>
          <span title="Dias totais com atividade">
            📅 {stats.total}
          </span>
        </div>
      </div>
    </div>
  );
}
