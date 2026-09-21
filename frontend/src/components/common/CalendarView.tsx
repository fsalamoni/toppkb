/**
 * CalendarView — visualização mensal com atividades
 *
 * Mostra um calendário mensal com indicadores visuais
 * para cada dia com atividade (treinos, partidas, etc).
 *
 * Features:
 * - Navegação mês anterior/próximo
 * - Dia atual destacado
 * - Dots coloridos por tipo de atividade
 * - Click no dia abre detalhes
 * - Acessível (role=grid, aria-selected)
 */
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CalendarActivity {
  date: string; // YYYY-MM-DD
  type: 'treino' | 'partida' | 'dores' | 'medida' | 'sono';
  count: number;
}

interface CalendarViewProps {
  activities: CalendarActivity[];
  onSelectDay?: (date: string) => void;
  selectedDate?: string;
  locale?: string;
}

const TYPE_COLORS: Record<CalendarActivity['type'], string> = {
  treino: 'bg-blue-500',
  partida: 'bg-green-500',
  dores: 'bg-red-500',
  medida: 'bg-purple-500',
  sono: 'bg-yellow-500',
};

export function CalendarView({
  activities,
  onSelectDay,
  selectedDate,
  locale = 'pt-BR',
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Computar grid do mês
  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia
    const lastDay = new Date(year, month + 1, 0);
    // Dia da semana do primeiro (0 = domingo)
    const firstDayOfWeek = firstDay.getDay();

    const result: Array<{ date: Date | null; ymd: string | null }> = [];

    // Espaços vazios antes do primeiro dia (alinhamento)
    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({ date: null, ymd: null });
    }

    // Dias do mês
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      result.push({ date, ymd });
    }

    return result;
  }, [currentMonth]);

  // Indexar atividades por dia
  const activitiesByDay = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>();
    for (const a of activities) {
      if (!map.has(a.date)) map.set(a.date, []);
      map.get(a.date)!.push(a);
    }
    return map;
  }, [activities]);

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const goPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-base">
          {currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={goPrevMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={goToday} aria-label="Hoje">
            Hoje
          </Button>
          <Button size="sm" variant="ghost" onClick={goNextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        role="grid"
        aria-label="Calendário de atividades"
        className="grid grid-cols-7 gap-1"
      >
        {days.map((day, i) => {
          if (!day.date || !day.ymd) {
            return <div key={`empty-${i}`} className="h-10" />;
          }

          const dayActivities = activitiesByDay.get(day.ymd) || [];
          const isToday = day.ymd === todayYmd;
          const isSelected = day.ymd === selectedDate;
          const dayOfWeek = day.date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <button
              key={day.ymd}
              onClick={() => onSelectDay?.(day.ymd!)}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${day.ymd}${dayActivities.length > 0 ? `, ${dayActivities.length} atividade(s)` : ''}`}
              className={cn(
                'relative h-10 rounded text-sm',
                'hover:bg-accent transition-colors',
                'flex flex-col items-center justify-center',
                isToday && 'bg-primary text-primary-foreground font-bold',
                isSelected && !isToday && 'bg-accent',
                isWeekend && !isToday && 'text-muted-foreground',
              )}
            >
              <span className="leading-none">{day.date.getDate()}</span>

              {/* Activity dots */}
              {dayActivities.length > 0 && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {dayActivities.slice(0, 3).map((a, j) => (
                    <span
                      key={j}
                      className={cn('h-1 w-1 rounded-full', TYPE_COLORS[a.type])}
                      aria-hidden="true"
                    />
                  ))}
                  {dayActivities.length > 3 && (
                    <span className="text-[6px] leading-none">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-full', color)} aria-hidden="true" />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
