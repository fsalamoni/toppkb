/**
 * WorkoutFocusCard — Card de foco muscular do treino (programado ou executado).
 * Mostra quais grupos musculares serão/serão trabalhados + onde sentir.
 */
import * as LucideIcons from 'lucide-react';
const { Activity, Target, Sparkles, ChevronRight } = LucideIcons;

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  KETTLEBELL_EXERCICIOS,
  getTopMusculaturas,
  getDicaMuscularCurta,
} from '@/data/seed/exercicios-kettlebell';

export interface WorkoutExercise {
  id?: string;
  nome: string;
  series: number;
  reps: string;
  carga?: string;
}

interface WorkoutFocusCardProps {
  /** Nome do treino */
  nome?: string;
  /** Lista de exercícios do treino */
  exercicios: WorkoutExercise[];
  /** Tipo: 'programado' (ainda não feito) ou 'realizado' (já feito) */
  variant?: 'programado' | 'realizado';
  /** Callback ao clicar no card */
  onClick?: () => void;
  className?: string;
}

interface GroupedMuscle {
  name: string;
  count: number;
  exercises: string[];
  exemplo?: string;
  onde_sentir?: string;
  color: string;
}

const COLOR_MAP: Record<string, string> = {
  'glúteo': '#10b981',
  'isquiotibial': '#10b981',
  'quadríceps': '#f59e0b',
  'deltóide': '#a855f7',
  'peitoral': '#06b6d4',
  'latíssimo': '#06b6d4',
  'trapézio': '#a855f7',
  'core': '#ec4899',
  'abdômen': '#ec4899',
  'oblíquo': '#ec4899',
  'tríceps': '#06b6d4',
  'bíceps': '#06b6d4',
  'lombar': '#ec4899',
  'antebraço': '#06b6d4',
  'panturrilha': '#f59e0b',
};

export function WorkoutFocusCard({ 
  nome, 
  exercicios, 
  variant = 'programado',
  onClick,
  className,
}: WorkoutFocusCardProps) {
  // Agrupa músculos pelos exercícios do treino
  const grupos = useMemo(() => {
    const grouped: Record<string, GroupedMuscle> = {};

    for (const ex of exercicios) {
      const kbEx = KETTLEBELL_EXERCICIOS.find(
        (e) => e.id === ex.id || e.id === `kb-${ex.id}` || e.nome === ex.nome,
      );
      if (!kbEx) continue;

      const muscles = getTopMusculaturas(kbEx.id, 2);
      for (const m of muscles) {
        // Extrair nome principal (antes do "—")
        const mainName = m.split('—')[0].trim();
        const lower = mainName.toLowerCase();
        // Match com color map
        const colorKey = Object.keys(COLOR_MAP).find((k) => lower.includes(k)) ?? 'default';
        const color = COLOR_MAP[colorKey] ?? '#94a3b8';
        const key = colorKey === 'default' ? mainName.toLowerCase() : colorKey;

        if (!grouped[key]) {
          grouped[key] = {
            name: mainName,
            count: 0,
            exercises: [],
            exemplo: kbEx.nome,
            onde_sentir: getDicaMuscularCurta(kbEx.id) ?? undefined,
            color,
          };
        }
        grouped[key].count += ex.series; // Peso por séries
        if (!grouped[key].exercises.includes(kbEx.nome)) {
          grouped[key].exercises.push(kbEx.nome);
        }
      }
    }

    // Ordenar por count decrescente
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [exercicios]);

  if (grupos.length === 0) return null;

  const totalSeries = exercicios.reduce((sum, e) => sum + e.series, 0);
  const totalMuscles = grupos.length;

  return (
    <Card 
      className={cn(
        'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent',
        onClick && 'cursor-pointer hover:border-blue-500/60 transition-colors',
        className,
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {variant === 'programado' ? (
            <>
              <Target className="h-4 w-4 text-blue-400" />
              Foco Muscular Previsto
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 text-emerald-400" />
              Músculos Trabalhados
            </>
          )}
          {onClick && <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />}
        </CardTitle>
        {nome && (
          <p className="text-xs text-muted-foreground">{nome}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          {totalMuscles} {totalMuscles === 1 ? 'grupo muscular' : 'grupos musculares'} · {totalSeries} séries programadas
        </div>

        {/* Badges coloridas dos grupos */}
        <div className="flex flex-wrap gap-1.5">
          {grupos.slice(0, 8).map((g, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium"
              style={{ 
                backgroundColor: `${g.color}20`,
                color: g.color,
                border: `1px solid ${g.color}40`,
              }}
              title={g.onde_sentir}
            >
              <span className="capitalize">{g.name}</span>
              <span className="opacity-60">×{g.count}</span>
            </span>
          ))}
          {grupos.length > 8 && (
            <span className="text-xs px-2 py-1 text-muted-foreground">
              +{grupos.length - 8}
            </span>
          )}
        </div>

        {/* Onde sentir (top 3) */}
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="text-xs font-semibold text-blue-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Onde sentir durante o treino
          </div>
          {grupos.slice(0, 3).map((g, i) => (
            <div key={i} className="text-xs">
              <span className="font-semibold capitalize" style={{ color: g.color }}>
                {g.name}:
              </span>{' '}
              <span className="text-muted-foreground">
                {g.onde_sentir 
                  ? g.onde_sentir.slice(0, 120) + (g.onde_sentir.length > 120 ? '...' : '')
                  : 'Ver detalhes de cada exercício'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
