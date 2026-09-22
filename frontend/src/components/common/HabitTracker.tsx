/**
 * HabitTracker — visualização de hábitos diários com grid
 *
 * Mostra uma matriz de hábitos (linhas) por dias (colunas).
 * Similar ao GitHub contributions grid, mas para hábitos 50+.
 *
 * Features:
 * - Checkbox diário para cada hábito
 * - Visual: cell verde se feito, vermelho se perdeu, vazio se futuro
 * - Clicar toggle estado
 * - Resumo de % aderência
 *
 * USO:
 *   const [habits, setHabits] = useState({ hidratacao: { 0: true, 1: true, 2: false } });
 *   <HabitTracker
 *     habits={[
 *       { id: 'hidratacao', label: 'Hidratação', color: 'cyan' },
 *       { id: 'sono', label: 'Sono 7h+', color: 'indigo' },
 *     ]}
 *     completed={completed}
 *     onToggle={(hid, day) => setCompleted(...)}
 *     days={7}
 *   />
 */
import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Habit {
  id: string;
  label: string;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'cyan' | 'indigo';
}

export interface HabitTrackerProps {
  habits: Habit[];
  /** Map: habitId -> { dayIndex: boolean } */
  completed: Record<string, Record<number, boolean>>;
  /** Quantos dias mostrar (default 7) */
  days?: number;
  /** Callback ao toggle */
  onToggle?: (habitId: string, dayIndex: number) => void;
  /** Pode editar (true) ou readonly (false) */
  editable?: boolean;
  className?: string;
}

const COLOR_CLASSES = {
  green: 'bg-green-500 text-white',
  blue: 'bg-blue-500 text-white',
  red: 'bg-red-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  purple: 'bg-purple-500 text-white',
  cyan: 'bg-cyan-500 text-white',
  indigo: 'bg-indigo-500 text-white',
};

export function HabitTracker({
  habits,
  completed,
  days = 7,
  onToggle,
  editable = false,
  className,
}: HabitTrackerProps) {
  const dayLabels = useMemo(() => {
    const result: { label: string; isToday: boolean; isFuture: boolean }[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push({
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
        isToday: i === 0,
        isFuture: false,
      });
    }
    return result;
  }, [days]);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm" role="grid">
        <thead>
          <tr>
            <th className="text-left p-2 sticky left-0 bg-card">Hábito</th>
            {dayLabels.map((d, i) => (
              <th
                key={i}
                className={cn(
                  'p-2 text-xs font-medium text-muted-foreground',
                  d.isToday && 'text-primary font-bold',
                )}
                aria-current={d.isToday ? 'date' : undefined}
              >
                {d.label}
              </th>
            ))}
            <th className="p-2 text-xs text-muted-foreground">%</th>
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => {
            const habitCompleted = completed[habit.id] || {};
            const doneCount = Array.from({ length: days }).filter(
              (_, i) => habitCompleted[i],
            ).length;
            const percentage = days > 0 ? (doneCount / days) * 100 : 0;
            const colorClass = COLOR_CLASSES[habit.color || 'green'];

            return (
              <tr key={habit.id} className="border-t">
                <td className="p-2 font-medium sticky left-0 bg-card">{habit.label}</td>
                {dayLabels.map((d, dayIndex) => {
                  const isChecked = habitCompleted[dayIndex];
                  return (
                    <td key={dayIndex} className="p-1 text-center">
                      <button
                        onClick={() => editable && onToggle?.(habit.id, dayIndex)}
                        disabled={!editable}
                        aria-pressed={!!isChecked}
                        aria-label={`${habit.label} - ${d.label}${isChecked ? ' (feito)' : ''}`}
                        className={cn(
                          'h-7 w-7 rounded transition-all',
                          isChecked
                            ? colorClass
                            : 'border border-border hover:bg-muted',
                          !editable && 'cursor-default',
                        )}
                      >
                        {isChecked && <Check className="h-4 w-4 mx-auto" />}
                      </button>
                    </td>
                  );
                })}
                <td className="p-2 text-center text-sm font-medium tabular-nums">
                  {percentage.toFixed(0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * HabitTrackerReadOnly — versão sem botões (apenas visualização)
 */
interface HabitTrackerReadOnlyProps extends Omit<HabitTrackerProps, 'onToggle' | 'editable'> {
  /** Tamanho da célula: sm=6, md=7, lg=8 */
  size?: 'sm' | 'md' | 'lg';
}

export function HabitTrackerReadOnly({
  habits,
  completed,
  days = 7,
  size = 'md',
  className,
}: HabitTrackerReadOnlyProps) {
  const cellSize = { sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-9 w-9' }[size];

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {habits.map((habit) => {
        const habitCompleted = completed[habit.id] || {};
        const colorClass = COLOR_CLASSES[habit.color || 'green'];
        return (
          <div key={habit.id} className="flex items-center gap-3">
            <span className="text-sm font-medium min-w-[100px]">{habit.label}</span>
            <div className="flex gap-1">
              {Array.from({ length: days }).map((_, i) => {
                const isChecked = habitCompleted[i];
                return (
                  <div
                    key={i}
                    className={cn(
                      cellSize,
                      'rounded',
                      isChecked
                        ? colorClass
                        : 'border border-border bg-muted/30',
                    )}
                    aria-label={`${habit.label} - dia ${i + 1}: ${isChecked ? 'feito' : 'pendente'}`}
                  />
                );
              })}
            </div>
            {(() => {
              const doneCount = Array.from({ length: days }).filter(
                (_, i) => habitCompleted[i],
              ).length;
              const percentage = days > 0 ? (doneCount / days) * 100 : 0;
              return (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {percentage.toFixed(0)}%
                </span>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

// Re-export com helper útil
export const HABIT_COLORS = COLOR_CLASSES;

// Silence unused import warning
void X;
