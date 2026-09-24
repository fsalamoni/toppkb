/**
 * AdminAnalytics — Sprint 75
 *
 * Painel administrativo que mostra analytics de uso do app:
 * - Top 10 exercícios mais visualizados
 * - Exercícios menos visualizados (gaps potenciais)
 * - Resumo de eventos (exercise_viewed, practice_started, etc)
 * - Steps mais visualizados por exercício
 * - Botão limpar analytics
 *
 * Usa dados do localStorage (analytics.ts).
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Eye,
  Trophy,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import {
  getMostViewed,
  getLeastViewedExercises,
  getEventCount,
  getEventSummary,
  clearAnalytics,
  KETTLEBELL_EXERCICIOS_LIST,
} from '@/lib/analytics-helpers';
import { cn } from '@/lib/utils';

const EVENT_LABELS: Record<string, string> = {
  exercise_viewed: 'Exercício visualizado',
  step_viewed: 'Step visualizado',
  muscle_clicked: 'Músculo clicado',
  video_played: 'Vídeo reproduzido',
  animator_step_navigated: 'Step animado navegado',
  practice_mode_started: 'Modo prática iniciado',
  exercise_saved_to_session: 'Salvo em sessão',
  search_performed: 'Busca realizada',
  card_clicked: 'Card clicado',
};

export function AdminAnalytics() {
  const [refresh, setRefresh] = useState(0);
  const addToast = useUIStore((s) => s.addToast);

  const summary = useMemo(() => getEventSummary(), [refresh]);
  const totalEvents = useMemo(() => getEventCount(), [refresh]);
  const topViewed = useMemo(() => getMostViewed(10), [refresh]);
  const leastViewed = useMemo(() => getLeastViewedExercises(KETTLEBELL_EXERCICIOS_LIST, 10), [refresh]);

  // Auto-refresh a cada 30s quando admin está olhando
  useEffect(() => {
    const id = setInterval(() => setRefresh((r) => r + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const handleClear = () => {
    if (!confirm('Tem certeza? Isso apaga todos os eventos de analytics do navegador.')) return;
    clearAnalytics();
    setRefresh((r) => r + 1);
    addToast({ type: 'success', message: 'Analytics limpos.' });
  };

  const maxTopCount = topViewed[0]?.count ?? 1;
  const maxLeastCount = leastViewed[0]?.count ?? 1;

  const eventEntries = Object.entries(summary).sort((a, b) => b[1] - a[1]);
  const maxEventCount = Math.max(...eventEntries.map((e) => e[1]), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-400" />
            Analytics de Uso
          </h1>
          <p className="text-sm text-muted-foreground">
            Dados coletados localmente (localStorage, 30 dias).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefresh((r) => r + 1)}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      {/* RESUMO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Eventos totais"
          value={totalEvents.toString()}
          icon={<Activity className="h-5 w-5" />}
          color="blue"
        />
        <SummaryCard
          label="Tipos de eventos"
          value={eventEntries.length.toString()}
          icon={<BarChart3 className="h-5 w-5" />}
          color="emerald"
        />
        <SummaryCard
          label="Mais visto"
          value={topViewed[0] ? `${topViewed[0].count}x` : '—'}
          sublabel={topViewed[0]?.exercise_id.replace('kb-', '')}
          icon={<Trophy className="h-5 w-5" />}
          color="amber"
        />
        <SummaryCard
          label="Gaps (0 views)"
          value={leastViewed.filter((e) => e.count === 0).length.toString()}
          sublabel="exercícios nunca abertos"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TOP 10 MAIS VISTOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Top 10 exercícios mais vistos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum exercício visualizado ainda.
              </p>
            ) : (
              <ol className="space-y-2">
                {topViewed.map((item, i) => (
                  <li key={item.exercise_id} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold w-5 text-right text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span className="text-sm flex-1 truncate">{item.exercise_id}</span>
                    <div className="flex-1 max-w-[200px]">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                          style={{ width: `${(item.count / maxTopCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold w-8 text-right">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* GAPS — MENOS VISTOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Exercícios menos vistos (potenciais gaps)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leastViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sem dados.
              </p>
            ) : (
              <ol className="space-y-2">
                {leastViewed.slice(0, 10).map((item, i) => (
                  <li key={item.exercise_id} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold w-5 text-right text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span
                      className={cn(
                        'text-sm flex-1 truncate',
                        item.count === 0 && 'text-amber-400 font-medium',
                      )}
                    >
                      {item.exercise_id}
                    </span>
                    <div className="flex-1 max-w-[200px]">
                      <div
                        className={cn(
                          'h-2 rounded-full overflow-hidden',
                          item.count === 0 ? 'bg-red-500/20' : 'bg-muted',
                        )}
                      >
                        <div
                          className={cn(
                            'h-full transition-all',
                            item.count === 0
                              ? 'bg-red-500/40'
                              : 'bg-gradient-to-r from-amber-500 to-amber-400',
                          )}
                          style={{ width: `${Math.max(2, (item.count / maxLeastCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold w-8 text-right">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RESUMO DE EVENTOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            Resumo por tipo de evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Sem eventos registrados.
            </p>
          ) : (
            <div className="space-y-2">
              {eventEntries.map(([event, count]) => (
                <div key={event} className="flex items-center gap-2">
                  <span className="text-xs font-mono w-48 truncate" title={event}>
                    {EVENT_LABELS[event] ?? event}
                  </span>
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(count / maxEventCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TIPS */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-blue-400">
            <Eye className="h-4 w-4" />
            Como usar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-100 space-y-2">
          <p>
            <strong>Top 10 mais vistos:</strong> mostra quais exercícios geram mais interesse. Use para criar destaque, maratona, ou recomendação na home.
          </p>
          <p>
            <strong>Exercícios menos vistos:</strong> gaps de atenção. Exercícios com <strong>0 views</strong> podem estar enterrados ou o usuário nem sabia que existiam.
          </p>
          <p>
            <strong>Resumo por evento:</strong> mostra quais ações estão sendo mais usadas (Praticar, ver vídeo, etc).
          </p>
          <p className="text-xs text-blue-200/70 italic pt-2 border-t border-blue-500/30">
            💡 Os dados são privados — armazenados apenas no seu navegador (localStorage). Não são enviados para servidor.
            Limpar dados apaga tudo localmente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'muted';
}) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    muted: 'text-muted-foreground bg-muted',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-md', colorMap[color])}>{icon}</div>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold truncate">{value}</div>
      {sublabel && <div className="text-xs text-muted-foreground truncate">{sublabel}</div>}
    </div>
  );
}
