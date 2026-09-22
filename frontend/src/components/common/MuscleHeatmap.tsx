/**
 * MuscleHeatmap — Heatmap visual de músculos trabalhados por dia.
 * Estilo GitHub contribution graph: cada célula = 1 dia, cor = intensidade.
 */
import * as LucideIcons from 'lucide-react';
const { Activity } = LucideIcons;

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { KETTLEBELL_EXERCICIOS, getTopMusculaturas } from '@/data/seed/exercicios-kettlebell';

interface MuscleHeatmapProps {
  sessoes: Array<{ data: string; exercicios: string[] }>;
  dias?: number; // default 84 (12 semanas)
  className?: string;
}

interface DayCell {
  date: Date;
  dateStr: string;
  intensity: number; // 0 = sem treino, 1-4 = quantos músculos foram trabalhados
  muscles: string[];
  sessionCount: number;
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
  const days = useMemo(() => {
    const result: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Começar do domingo mais antigo para alinhar colunas
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - dias + 1);
    // Volta para o domingo
    const dow = startDate.getDay();
    startDate.setDate(startDate.getDate() - dow);

    for (let i = 0; i < dias + dow; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      if (date > today) continue;
      result.push({
        date,
        dateStr: date.toISOString().slice(0, 10),
        intensity: 0,
        muscles: [],
        sessionCount: 0,
      });
    }

    // Calcular intensidade por dia
    for (const cell of result) {
      const dayStart = new Date(cell.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySessoes = sessoes.filter((s) => {
        const sd = new Date(s.data);
        return sd >= dayStart && sd < dayEnd;
      });

      if (daySessoes.length === 0) continue;

      cell.sessionCount = daySessoes.length;

      // Coletar músculos únicos do dia
      const musclesSet = new Set<string>();
      for (const sessao of daySessoes) {
        for (const exId of sessao.exercicios) {
          const ex = KETTLEBELL_EXERCICIOS.find(
            (e) => e.id === exId || e.id === `kb-${exId}` || e.nome === exId,
          );
          if (ex) {
            const topMuscles = getTopMusculaturas(ex.id, 2);
            for (const m of topMuscles) {
              const key = m.split('—')[0].trim().toLowerCase();
              if (key) musclesSet.add(key);
            }
          }
        }
      }

      cell.muscles = Array.from(musclesSet);
      // Intensidade: 1=sessão leve (1-2 músculos), 2=moderada (3-4), 3=intensa (5-6), 4=muito intensa (7+)
      const count = cell.muscles.length;
      if (count >= 7) cell.intensity = 4;
      else if (count >= 5) cell.intensity = 3;
      else if (count >= 3) cell.intensity = 2;
      else if (count >= 1) cell.intensity = 1;
    }

    return result;
  }, [sessoes, dias]);

  // Agrupar em semanas (colunas)
  const weeks = useMemo(() => {
    const w: DayCell[][] = [];
    let current: DayCell[] = [];
    for (const d of days) {
      current.push(d);
      if (current.length === 7) {
        w.push(current);
        current = [];
      }
    }
    if (current.length > 0) w.push(current);
    return w;
  }, [days]);

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
