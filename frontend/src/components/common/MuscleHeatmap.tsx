/**
 * MuscleHeatmap — Heatmap visual de músculos trabalhados por dia.
 * Estilo GitHub contribution graph: cada célula = 1 dia, cor = intensidade.
 */
import * as LucideIcons from 'lucide-react';
const { Activity } = LucideIcons;

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  computeHeatmap,
  groupIntoWeeks,
} from '@/lib/heatmap';

interface MuscleHeatmapProps {
  sessoes: Array<{ data: string; exercicios: string[] }>;
  dias?: number; // default 84 (12 semanas)
  className?: string;
}

const INTENSITY_COLORS = [
  'bg-slate-800', // 0 = sem atividade
  'bg-emerald-900', // 1 = baixa
  'bg-emerald-700', // 2 = moderada
  'bg-emerald-500', // 3 = alta
  'bg-emerald-300', // 4 = muito alta
];

const INTENSITY_LABELS = ['Sem treino', 'Leve', 'Moderado', 'Intenso', 'Muito intenso'];

export function MuscleHeatmap({ sessoes, dias = 84, className }: MuscleHeatmapProps) {
  // Gerar array de dias
  const days = useMemo(() => computeHeatmap(sessoes, dias), [sessoes, dias]);

  // Agrupar em semanas (colunas)
  const weeks = useMemo(() => groupIntoWeeks(days), [days]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ week: number; month: string }> = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ week: i, month: firstDay.date.toLocaleDateString('pt-BR', { month: 'short' }) });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  const totalSessions = useMemo(
    () => days.filter((d) => d.intensity > 0).length,
    [days],
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Mapa de Atividade Muscular
        </h3>
        <div className="text-sm text-muted-foreground">
          <strong className="text-emerald-400">{totalSessions}</strong> {totalSessions === 1 ? 'dia ativo' : 'dias ativos'} nos últimos {Math.ceil(dias / 7)} semanas
        </div>
      </div>

      {/* LABELS DE MÊS */}
      <div className="flex gap-1 ml-8 text-xs text-muted-foreground">
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{ width: `${(weeks.length / monthLabels.length) * 11.5}px` }}
          >
            {m.month}
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {/* LABELS DE DIA DA SEMANA */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-0.5">
          <div className="h-3 leading-3">D</div>
          <div className="h-3 leading-3">S</div>
          <div className="h-3 leading-3">T</div>
          <div className="h-3 leading-3">Q</div>
          <div className="h-3 leading-3">Q</div>
          <div className="h-3 leading-3">S</div>
          <div className="h-3 leading-3">S</div>
        </div>

        {/* GRID DE SEMANAS */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                const isToday = day.dateStr === todayStr;
                const isFuture = day.date > new Date();
                return (
                  <div
                    key={day.dateStr}
                    title={
                      day.intensity > 0
                        ? `${day.date.toLocaleDateString('pt-BR')} · ${INTENSITY_LABELS[day.intensity]} (${day.muscles.length} músculos, ${day.sessionCount} sessões)\n${day.muscles.slice(0, 5).join(', ')}`
                        : `${day.date.toLocaleDateString('pt-BR')} · Sem treino`
                    }
                    className={cn(
                      'h-3 w-3 rounded-sm transition-colors',
                      isFuture ? 'bg-slate-900 opacity-30' :
                      INTENSITY_COLORS[day.intensity],
                      isToday && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900',
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* LEGENDA */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        {INTENSITY_COLORS.map((c, i) => (
          <div
            key={i}
            className={cn('h-3 w-3 rounded-sm', c)}
            title={INTENSITY_LABELS[i]}
          />
        ))}
        <span>Mais</span>
        <span className="ml-3">Intensidade = quantos grupos musculares foram trabalhados no dia</span>
      </div>
    </div>
  );
}
