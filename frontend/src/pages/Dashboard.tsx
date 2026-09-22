/**
 * Dashboard — visão geral do atleta.
 *
 * Refatorado em Sprint 3 para reduzir de 695 → ~150 linhas.
 * Componentes extraídos:
 * - useDashboardData → pages/dashboard/useDashboardData.ts (lógica)
 * - DashboardAlerts → pages/dashboard/DashboardAlerts.tsx (alertas)
 * - DashboardKPIs → pages/dashboard/DashboardKPIs.tsx (KPIs + QuickActions)
 * - DashboardCharts → pages/dashboard/DashboardCharts.tsx (gráficos)
 *
 * Mantém apenas:
 * - Header (saudação)
 * - Heatmap de atividades
 * - Últimas atividades (treinos + partidas)
 * - Empty state (CTA inicial)
 */
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { useDashboardData } from './dashboard/useDashboardData';
import { DashboardAlerts } from './dashboard/DashboardAlerts';
import { DashboardKPIs, QuickAction } from './dashboard/DashboardKPIs';
import { DashboardCharts } from './dashboard/DashboardCharts';
import { cn, subDays, formatYmd } from '@/lib/utils';
import {
  Plus, ChevronRight, Activity, Trophy, Apple, Brain,
  Dumbbell, Target, Heart, AlertCircle,
} from 'lucide-react';

export function Dashboard() {
  const { user, userDoc } = useAuth();
  const { data, isLoading, error, refetch } = useDashboardData(user?.uid);

  if (isLoading || !data) {
    if (error) {
      const errMsg = (error as any)?.message || String(error);
      return (
        <div className="max-w-2xl mx-auto py-8 space-y-3">
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Erro ao carregar Dashboard</div>
                  <p className="text-xs text-muted-foreground mt-1 break-all">{errMsg}</p>
                  <Button onClick={() => refetch()} size="sm" variant="outline" className="mt-3">
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const temDados = data.ultimosTreinos.length > 0 || data.ultimasPartidas.length > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Bom dia, {userDoc?.displayName || 'Atleta'} 🏓
        </h1>
        <p className="text-sm text-muted-foreground">
          Sua jornada rumo ao topo do ranking 50+ em 2032
        </p>
      </div>

      {/* Alertas */}
      <DashboardAlerts
        dorAtiva={data.dorAtiva}
        streak={data.streak}
        streakType={data.streakType}
        hidratacaoAtual={data.hidratacaoHoje}
        hidratacaoMeta={data.hidratacaoMeta}
      />

      {/* KPIs */}
      <DashboardKPIs
        treinos7d={data.treinos7d}
        partidas7d={data.partidas7d}
        winRate={data.winRate}
        vitoriasTotal={data.vitoriasTotal}
        totalPartidas={data.totalPartidas}
        sonoMedio={data.sonoMedio}
        pesoAtual={data.pesoAtual}
        pesoMeta={userDoc?.pesoMeta}
        proximoTorneio={data.proximoTorneio}
        streak={data.streak}
        streakType={data.streakType}
      />

      {/* Charts */}
      <DashboardCharts
        pesoHistorico={data.pesoHistorico}
        sonoHistorico={data.sonoHistorico}
        vitoriaDerrota30d={data.vitoriaDerrota30d}
        sonoMedio={data.sonoMedio}
      />

      {/* Heatmap */}
      <ActivityHeatmap diasAtivos={data.diasAtivos} />

      {/* Ações rápidas */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/app/treinos/novo" icon={Activity} label="Registrar treino" color="emerald" />
          <QuickAction href="/app/partidas/nova" icon={Trophy} label="Nova partida" color="amber" />
          <QuickAction href="/app/peso" icon={Target} label="Registrar peso" color="cyan" />
          <QuickAction href="/app/sono" icon={Heart} label="Registrar sono" color="rose" />
          <QuickAction href="/app/dores" icon={AlertCircle} label="Registrar dor" color="amber" />
          <QuickAction href="/app/nutricao" icon={Apple} label="Refeição" color="orange" />
          <QuickAction href="/app/preparacao" icon={Dumbbell} label="Sessão física" color="blue" />
          <QuickAction href="/app/chat" icon={Brain} label="Chat com coach" color="purple" />
        </div>
      </div>

      {/* Últimas atividades */}
      {temDados ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UltimosTreinos treinos={data.ultimosTreinos} />
          <UltimasPartidas partidas={data.ultimasPartidas} />
        </div>
      ) : (
        <EmptyFirstTime />
      )}
    </div>
  );
}

function ActivityHeatmap({ diasAtivos }: { diasAtivos: Set<string> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calendário de atividades</CardTitle>
        <CardDescription>Últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-15 gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const day = subDays(new Date(), 29 - i);
            const key = formatYmd(day);
            const ativo = diasAtivos.has(key);
            return (
              <div
                key={key}
                className={cn(
                  'aspect-square rounded text-[10px] flex items-center justify-center',
                  ativo
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-muted text-muted-foreground/50',
                )}
                title={day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>{diasAtivos.size} dias ativos</span>
          <span>Mais escuro = mais atividades</span>
        </div>
      </CardContent>
    </Card>
  );
}

function UltimosTreinos({ treinos }: { treinos: any[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimos treinos</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/treinos">Ver todos <ChevronRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {treinos.map((t: any) => {
          const d = t.data?.toDate?.() || (t.data ? new Date(t.data) : null);
          const cor = t.intensidade >= 8 ? 'border-red-500' : t.intensidade >= 6 ? 'border-amber-500' : 'border-emerald-500';
          return (
            <Link
              key={t.id}
              to={`/app/treinos/${t.id}`}
              className={cn('block p-2 rounded-lg border-l-2 border-r border-y hover:bg-muted/50 transition', cor)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t.tipo || 'Treino'}</div>
                <div className="text-xs text-muted-foreground">
                  {d?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t.duracaoMin ? `${t.duracaoMin}min` : ''} · RPE {t.rpe || t.intensidade || '—'}/10
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function UltimasPartidas({ partidas }: { partidas: any[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimas partidas</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/partidas">Ver todas <ChevronRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {partidas.map((p: any) => {
          const d = p.data?.toDate?.() || (p.data ? new Date(p.data) : null);
          const cor = p.resultado === 'vitoria' ? 'border-emerald-500' : p.resultado === 'derrota' ? 'border-red-500' : 'border-amber-500';
          return (
            <Link
              key={p.id}
              to={`/app/partidas/${p.id}`}
              className={cn('block p-2 rounded-lg border-l-2 border-r border-y hover:bg-muted/50 transition', cor)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">vs {p.adversario || '—'}</div>
                <div className="text-xs text-muted-foreground">
                  {d?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {p.placar && `${p.placar} · `}
                {p.resultado === 'vitoria' ? '✅ Vitória' : p.resultado === 'derrota' ? '❌ Derrota' : '🤝 Empate'}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EmptyFirstTime() {
  return (
    <EmptyState
      illustration="default"
      title="Comece sua jornada"
      description="Registre seu primeiro treino ou partida para ver seu dashboard ganhar vida."
      action={
        <div className="flex gap-2 justify-center mt-2">
          <Button asChild>
            <Link to="/app/treinos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Registrar treino
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/partidas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Registrar partida
            </Link>
          </Button>
        </div>
      }
    />
  );
}

export default Dashboard;
