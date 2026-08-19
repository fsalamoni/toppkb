// Mini-gráfico de linha (sparkline) — SVG inline, sem dependências externas
// Renderiza até 60 pontos. Bom para trends em cards.

import { cn } from '@/lib/utils';

export interface SparklinePoint {
  date: string | Date;
  value: number;
  label?: string;
}

export interface SparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';
  showArea?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  className?: string;
  yMin?: number;
  yMax?: number;
}

const COLOR_MAP: Record<string, { stroke: string; fill: string; dot: string }> = {
  emerald: { stroke: 'stroke-emerald-500', fill: 'fill-emerald-500/20', dot: 'fill-emerald-500' },
  blue:    { stroke: 'stroke-blue-500',    fill: 'fill-blue-500/20',    dot: 'fill-blue-500' },
  amber:   { stroke: 'stroke-amber-500',   fill: 'fill-amber-500/20',   dot: 'fill-amber-500' },
  red:     { stroke: 'stroke-red-500',     fill: 'fill-red-500/20',     dot: 'fill-red-500' },
  purple:  { stroke: 'stroke-purple-500',  fill: 'fill-purple-500/20',  dot: 'fill-purple-500' },
  cyan:    { stroke: 'stroke-cyan-500',    fill: 'fill-cyan-500/20',    dot: 'fill-cyan-500' },
};

export function SparklineChart({
  data,
  width = 200,
  height = 60,
  color = 'emerald',
  showArea = true,
  showDots = true,
  showLabels = false,
  className,
  yMin,
  yMax,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-xs text-muted-foreground', className)}
        style={{ width, height }}
      >
        sem dados
      </div>
    );
  }

  const colors = COLOR_MAP[color] || COLOR_MAP.emerald;
  const padding = 4;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const values = data.map((d) => d.value);
  const minV = yMin ?? Math.min(...values);
  const maxV = yMax ?? Math.max(...values);
  const range = maxV - minV || 1;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = padding + innerH - ((d.value - minV) / range) * innerH;
    return { x, y, value: d.value, date: d.date, label: d.label };
  });

  // Path da linha
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  // Path da área (fecha para baixo)
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

  return (
    <div className={cn('relative', className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines (3 horizontais) */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="stroke-border" strokeWidth="0.5" strokeDasharray="2 4" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} className="stroke-border" strokeWidth="0.5" strokeDasharray="2 4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-border" strokeWidth="0.5" strokeDasharray="2 4" />

        {/* Área */}
        {showArea && areaPath && (
          <path d={areaPath} className={colors.fill} />
        )}

        {/* Linha */}
        <path
          d={linePath}
          fill="none"
          className={colors.stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Pontos */}
        {showDots &&
          points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2"
              className={colors.dot}
            />
          ))}
      </svg>

      {/* Labels no eixo Y (apenas min/max) */}
      {showLabels && (
        <>
          <div className="absolute top-0 right-1 text-[10px] text-muted-foreground tabular-nums">
            {maxV.toFixed(maxV >= 100 ? 0 : 1)}
          </div>
          <div className="absolute bottom-0 right-1 text-[10px] text-muted-foreground tabular-nums">
            {minV.toFixed(minV >= 100 ? 0 : 1)}
          </div>
        </>
      )}
    </div>
  );
}

// Bar chart simples para contagens (V/D/E últimos 30d)
export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export function MiniBarChart({
  data,
  className,
}: {
  data: BarChartItem[];
  className?: string;
}) {
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn('flex items-end gap-2 h-16', className)}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / maxV) * 100);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="text-xs font-semibold tabular-nums">{d.value}</div>
            <div
              className={cn('w-full rounded-t-md transition-all', d.color || 'bg-primary')}
              style={{ height: `${h}%`, minHeight: '4px' }}
            />
            <div className="text-[10px] text-muted-foreground truncate w-full text-center">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
