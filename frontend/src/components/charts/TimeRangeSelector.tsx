/**
 * TimeRangeSelector — seletor de período para gráficos
 *
 * Opções:
 * - 7 dias (1 sem)
 * - 30 dias (1 mês)
 * - 90 dias (3 meses)
 * - 1 ano
 * - Tudo
 *
 * USO:
 *   const [range, setRange] = useState('30d');
 *   <TimeRangeSelector value={range} onChange={setRange} />
 */
import { cn } from '@/lib/utils';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '1y', label: '1 ano' },
  { value: 'all', label: 'Tudo' },
];

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-md border border-border bg-card p-0.5',
        className,
      )}
      role="radiogroup"
      aria-label="Período de visualização"
    >
      {OPTIONS.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            role="radio"
            aria-checked={isActive}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Calcula data de início baseado no range
 */
export function getStartDate(range: TimeRange, referenceDate: Date = new Date()): Date | null {
  const date = new Date(referenceDate);
  switch (range) {
    case '7d':
      date.setDate(date.getDate() - 7);
      return date;
    case '30d':
      date.setDate(date.getDate() - 30);
      return date;
    case '90d':
      date.setDate(date.getDate() - 90);
      return date;
    case '1y':
      date.setFullYear(date.getFullYear() - 1);
      return date;
    case 'all':
      return null;
  }
}
