/**
 * GoalRing — anel circular de progresso
 *
 * Mostra progresso de uma meta (ex: 7/10 dias de treino = 70%)
 * Visual SVG puro (sem libs externas)
 *
 * USO:
 *   <GoalRing percentage={70} label="Treinos" value="7/10" />
 */
import { cn } from '@/lib/utils';

interface GoalRingProps {
  /** Percentual de progresso (0-100) */
  percentage: number;
  /** Texto principal no centro (ex: "7/10") */
  value: string;
  /** Label pequeno abaixo do value */
  label?: string;
  /** Tamanho do anel */
  size?: 'sm' | 'md' | 'lg';
  /** Cor primária (override) */
  color?: string;
  className?: string;
}

const SIZES = {
  sm: { px: 80, stroke: 8, fontSize: 12, subSize: 10 },
  md: { px: 120, stroke: 10, fontSize: 20, subSize: 12 },
  lg: { px: 160, stroke: 12, fontSize: 28, subSize: 14 },
};

export function GoalRing({
  percentage,
  value,
  label,
  size = 'md',
  color,
  className,
}: GoalRingProps) {
  const { px, stroke, fontSize, subSize } = SIZES[size];
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  const ringColor = color || getColorByPercentage(clamped);

  return (
    <div
      className={cn('inline-flex flex-col items-center gap-2', className)}
      role="status"
      aria-label={`${label || 'Progresso'}: ${clamped.toFixed(0)}%`}
    >
      <div className="relative" style={{ width: px, height: px }}>
        <svg width={px} height={px} className="-rotate-90">
          {/* Track */}
          <circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-muted/20"
          />
          {/* Progress arc */}
          <circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 500ms ease-out',
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold tabular-nums"
            style={{ fontSize: `${fontSize}px`, color: ringColor }}
          >
            {value}
          </span>
          {label && (
            <span
              className="text-muted-foreground font-medium"
              style={{ fontSize: `${subSize}px` }}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Percentage abaixo (opcional) */}
      <div className="text-xs text-muted-foreground">
        {clamped.toFixed(0)}%
      </div>
    </div>
  );
}

function getColorByPercentage(percentage: number): string {
  if (percentage >= 100) return 'hsl(142 76% 36%)'; // green-500
  if (percentage >= 70) return 'hsl(217 91% 60%)'; // blue-500
  if (percentage >= 40) return 'hsl(48 96% 53%)'; // yellow-500
  return 'hsl(0 84% 60%)'; // red-500
}
