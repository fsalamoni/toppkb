/**
 * ChartTooltip — tooltip customizado para Recharts
 *
 * Features:
 * - Tema-aware (light/dark)
 * - Ícones contextuais (TrendingUp, TrendingDown, Minus)
 * - Formatação pt-BR (datas, números)
 * - Highlights com cores do tema
 *
 * USO:
 *   <Tooltip content={<ChartTooltip unit="kg" />} />
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  /** Unidade (kg, %, km) */
  unit?: string;
  /** Formatar label como data */
  isDate?: boolean;
  /** Função customizada para formatar valor */
  formatValue?: (val: any) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  unit = '',
  isDate = false,
  formatValue,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const formattedLabel = isDate ? formatDateLabel(label) : label;

  return (
    <div className="rounded-lg border border-border bg-popover text-popover-foreground shadow-md p-3 min-w-[180px]">
      {formattedLabel && (
        <div className="text-xs font-medium text-muted-foreground mb-2">
          {formattedLabel}
        </div>
      )}

      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          const value = formatValue ? formatValue(entry.value) : formatNumericValue(entry.value, unit);
          const trend = getTrend(entry.value, payload);
          const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
          const trendColor =
            trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground';

          return (
            <div key={idx} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono font-medium">{value}</span>
                {trend !== 0 && (
                  <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTrend(currentValue: number, allPayload: any[]): number {
  if (allPayload.length < 2) return 0;
  const idx = allPayload.findIndex((p) => p.value === currentValue);
  if (idx === -1 || idx === 0) return 0;
  const previousValue = allPayload[idx - 1]?.value;
  if (typeof previousValue !== 'number') return 0;
  if (previousValue === 0) return currentValue > 0 ? 1 : 0;
  return currentValue > previousValue ? 1 : currentValue < previousValue ? -1 : 0;
}

function formatDateLabel(label: any): string {
  if (!label) return '';
  try {
    const date = new Date(label);
    if (isNaN(date.getTime())) return String(label);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(label);
  }
}

function formatNumericValue(value: any, unit: string): string {
  if (typeof value !== 'number') return String(value);
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
