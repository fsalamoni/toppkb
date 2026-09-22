/**
 * ExerciseAvatar — Renderiza avatar SVG demonstrativo do exercício.
 * Mostra a posição do corpo + KB em cada step.
 */
import * as LucideIcons from 'lucide-react';
const { User } = LucideIcons;

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ExerciseAvatarProps {
  exerciseId: string;
  stepNum: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ExerciseAvatar({ exerciseId, stepNum, className, size = 'md' }: ExerciseAvatarProps) {
  const src = useMemo(() => {
    return `/kettlebell/avatars/${exerciseId}-step-${stepNum}.svg`;
  }, [exerciseId, stepNum]);

  const sizeClass = {
    sm: 'w-24 h-36',
    md: 'w-full max-w-[280px] aspect-[2/3]',
    lg: 'w-full max-w-[400px] aspect-[2/3]',
  }[size];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <object
        type="image/svg+xml"
        data={src}
        className={cn('rounded-lg border border-border bg-slate-900', sizeClass)}
        aria-label={`Avatar demonstrativo do exercício ${exerciseId} step ${stepNum}`}
      >
        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
          <User className="h-12 w-12" />
        </div>
      </object>
    </div>
  );
}
