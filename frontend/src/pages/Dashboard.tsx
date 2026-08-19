import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/LoadingScreen';
import { cn } from '@/lib/utils';
import {
  Activity, AlertCircle, Flame, Calendar, TrendingUp,
  Plus, ChevronRight, Apple, Brain, Dumbbell, Target, Sparkles, Heart, Trophy, Droplet,
} from 'lucide-react';
import { differenceInDays, subDays, formatYmd } from '@/lib/utils';
import { SparklineChart, MiniBarChart } from '@/components/charts/SparklineChart';

function DropletIcon() {
  return <Droplet className="h-5 w-5 text-cyan-500 flex-shrink-0" />;
}

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

interface DashboardData {
  treinos7d: number;
  partidas7d: number;
  vitoriasTotal: number;
  winRate: number;
  streak: number;
  streakType: 'V' | 'D' | null;
  dorAtiva: any | null;
  pesoAtual: number | null;
  sonoMedio: number | null;
  proximoTorneio: any | null;
  ultimosTreinos: any[];
  ultimasPartidas: any[];
  diasAtivos: Set<string>;
  // Gráficos
  pesoHistorico: Array<{ date: string; value: number }>;
  sonoHistorico: Array<{ date: string; value: number }>;
  vitoriaDerrota30d: Array<{ label: string; value: number; color?: string }>;
 hidratacaoHoje: number;
  hidratacaoMeta: number;
}

async function loadDashboardData(uid: string): Promise<DashboardData> {
  const agora = new Date();
  const seteDiasAtras = subDays(agora, 7);
  const trintaDiasAtras = subDays(agora, 30);

  // Helper de timeout (Firestore pode demorar com índices faltando)
  const safeGet = async (col: string): Promise<any[]> => {
    try {
      const { getDocs, collection: c } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      return await Promise.race([
        getDocs(c(db, 'toppkb_users', uid, col)).then((snap) =>
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error(`Timeout ${col}`)), 6000)),
      ]);
    } catch (e) {
      console.warn(`[dashboard] ${col} falhou:`, e);
      return [];
    }
  };

  // Carrega todas as coleções em paralelo
  const [treinosRaw, partidasRaw, doresRaw, pesosRaw, sonosRaw, torneiosRaw, hidratacoesRaw] = await Promise.all([
    safeGet('treinos'),
    safeGet('partidas'),
    safeGet('dores'),
    safeGet('peso'),
    safeGet('sono'),
    safeGet('torneios'),
    safeGet('hidratacao'),
  ]);

  // As queries não trazem mais orderBy/limit do Firestore (evita índices),
  // então ordenamos client-side. Mais recente primeiro (data desc).
  const byDataDesc = (field = 'data') => (a: any, b: any) => {
    const da = tsToDate(a[field])?.getTime() ?? 0;
    const dbt = tsToDate(b[field])?.getTime() ?? 0;
    return dbt - da;
  };
  const treinosRawSorted = [...treinosRaw].sort(byDataDesc());
  const partidas = [...partidasRaw].sort(byDataDesc());
  const dores = [...doresRaw].sort(byDataDesc());
  const pesos = [...pesosRaw].sort(byDataDesc());
  const sonos = [...sonosRaw].sort(byDataDesc());
  const hidratacoes = [...hidratacoesRaw].sort(byDataDesc());
  // Torneios: mais próximo primeiro (dataInicio asc)
  const torneios = [...torneiosRaw].sort((a, b) => {
    const da = tsToDate(a.dataInicio)?.getTime() ?? Infinity;
    const dbt = tsToDate(b.dataInicio)?.getTime() ?? Infinity;
    return da - dbt;
  });

  // Treinos
  const treinos = treinosRawSorted;
  const treinos7d = treinos.filter((t: any) => {
    const d = tsToDate(t.data);
    return d && d >= seteDiasAtras;
  }).length;

  // Partidas
  const partidas7d = partidas.filter((p: any) => {
    const d = tsToDate(p.data);
    return d && d >= seteDiasAtras;
  }).length;
  const vitoriasTotal = partidas.filter((p: any) => p.resultado === 'vitoria').length;
  const winRate = partidas.length > 0 ? Math.round((vitoriasTotal / partidas.length) * 100) : 0;

  // Streak
  let streak = 0;
  let streakType: 'V' | 'D' | null = null;
  for (const p of partidas) {
    if (streak === 0) {
      if (p.resultado === 'vitoria') { streak = 1; streakType = 'V'; }
      else if (p.resultado === 'derrota') { streak = 1; streakType = 'D'; }
      else break;
    } else if (streakType === 'V' && p.resultado === 'vitoria') streak++;
    else if (streakType === 'D' && p.resultado === 'derrota') streak++;
    else break;
  }

  // Dor ativa (intensidade >= 5 e ainda não resolvida)
  const doresList = dores;
  const dorAtiva = doresList.find((d: any) => d.ativa !== false && (d.intensidade || 0) >= 5) || null;

  // Peso atual
  const pesoAtual = pesos[0]?.peso ?? null;

  // Sono médio (7 dias)
  const sonoDocs = sonos.filter((s: any) => s.horasDormidas);
  const sonoMedio = sonoDocs.length > 0
    ? sonoDocs.reduce((acc: number, s: any) => acc + (s.horasDormidas || 0), 0) / sonoDocs.length
    : null;

  // Próximo torneio
  const proximoTorneio = torneios.find((t: any) => {
    const di = tsToDate(t.dataInicio);
    return di && di >= agora;
  }) || null;

  // Dias ativos (heatmap)
  const diasAtivos = new Set<string>();
  [...treinos, ...partidas].forEach((r: any) => {
    const d = tsToDate(r.data);
    if (d) diasAtivos.add(formatYmd(d));
  });

  // Peso histórico (mais antigo -> mais novo para sparkline)
  const pesoDocs = pesos.filter((p: any) => p.peso);
  const pesoHistorico = pesoDocs
    .map((p: any) => {
      const d = tsToDate(p.data);
      return d ? { date: formatYmd(d), value: p.peso } : null;
    })
    .filter((x: any): x is { date: string; value: number } => x !== null)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(-30);

  // Sono histórico
  const sonoDocsAll = sonos.filter((s: any) => s.horasDormidas);
  const sonoHistorico = sonoDocsAll
    .map((s: any) => {
      const d = tsToDate(s.data);
      return d ? { date: formatYmd(d), value: s.horasDormidas } : null;
    })
    .filter((x: any): x is { date: string; value: number } => x !== null)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(-30);

  // V/D/E últimos 30d
  const partidas30d = partidas.filter((p: any) => {
    const d = tsToDate(p.data);
    return d && d >= trintaDiasAtras;
  });
  const v30 = partidas30d.filter((p: any) => p.resultado === 'vitoria').length;
  const d30 = partidas30d.filter((p: any) => p.resultado === 'derrota').length;
  const e30 = partidas30d.filter((p: any) => p.resultado === 'empate').length;

  // Hidratação hoje
  const hidDoc = hidratacoes[0];
  const hidratacaoHoje = hidDoc?.totalMl || 0;
  // Meta: 35ml/kg. Sem peso definido, assume 80kg.
  // (peso virá de userDoc, mas Dashboard usa estimativa)
  const hidratacaoMeta = Math.round(80 * 35);

  return {
    treinos7d,
    partidas7d,
    vitoriasTotal,
    winRate,
    streak,
    streakType,
    dorAtiva,
    pesoAtual,
    sonoMedio,
    proximoTorneio,
    ultimosTreinos: treinos.slice(0, 3),
    ultimasPartidas: partidas.slice(0, 3),
    diasAtivos,
    pesoHistorico,
    sonoHistorico,
    vitoriaDerrota30d: [
      { label: 'Vitórias', value: v30, color: 'bg-emerald-500' },
      { label: 'Derrotas', value: d30, color: 'bg-red-500' },
      { label: 'Empates', value: e30, color: 'bg-amber-500' },
    ],
    hidratacaoHoje,
    hidratacaoMeta,
  };
}

export function Dashboard() {
  const { user, userDoc } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', user?.uid, userDoc?.pesoInicial],
    queryFn: () => loadDashboardData(user!.uid),
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
    retry: 1,
  });

  if (isLoading || !data) {
    if (error) {
      // Erro real — mostrar mensagem
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
  const diasAteTorneio = data.proximoTorneio
    ? differenceInDays(tsToDate(data.proximoTorneio.dataInicio) || new Date(), new Date())
    : null;

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

      {/* Alerta de dor ativa */}
      {data.dorAtiva && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-sm">Atenção: dor ativa detectada</div>
              <p className="text-xs text-muted-foreground">
                {data.dorAtiva.regiao || 'Região'} · intensidade {data.dorAtiva.intensidade}/10 ·
                registrada em {tsToDate(data.dorAtiva.data)?.toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs mt-1">
                Recomendação: avalie se precisa descanso ou adaptação no próximo treino.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/app/dores">Ver</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Streak alert */}
      {data.streak >= 3 && data.streakType === 'V' && (
        <Card className="border-emerald-500/50 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Flame className="h-6 w-6 text-emerald-500" />
            <div>
              <div className="font-semibold">{data.streak} vitórias seguidas! 🔥</div>
              <p className="text-xs text-muted-foreground">Continue assim. Mente e corpo em flow.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Treinos (7d)"
          value={data.treinos7d.toString()}
          icon={Activity}
          color="emerald"
          link="/app/treinos"
        />
        <KPICard
          label="Partidas (7d)"
          value={data.partidas7d.toString()}
          icon={Trophy}
          color="amber"
          link="/app/partidas"
        />
        <KPICard
          label="Win Rate"
          value={`${data.winRate}%`}
          sub={`${data.vitoriasTotal}V de ${data.ultimasPartidas.length + (data.vitoriasTotal - data.vitoriasTotal)}+`}
          icon={TrendingUp}
          color="primary"
        />
        <KPICard
          label="Sono médio"
          value={data.sonoMedio ? `${data.sonoMedio.toFixed(1)}h` : '—'}
          icon={Heart}
          color="rose"
          link="/app/sono"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPICard
          label="Peso atual"
          value={data.pesoAtual ? `${data.pesoAtual.toFixed(1)} kg` : '—'}
          sub={userDoc?.pesoMeta ? `Meta: ${userDoc.pesoMeta}kg` : 'Defina meta em Configurações'}
          icon={Target}
          color="cyan"
          link="/app/peso"
        />
        <KPICard
          label="Próximo torneio"
          value={diasAteTorneio !== null ? `${diasAteTorneio}d` : '—'}
          sub={data.proximoTorneio?.nome || 'Nenhum agendado'}
          icon={Calendar}
          color="purple"
          link="/app/torneios"
        />
        <KPICard
          label="Streak atual"
          value={data.streak > 0 ? `${data.streak} ${data.streakType === 'V' ? 'V' : 'D'}` : '—'}
          sub={data.streak > 0 ? (data.streakType === 'V' ? 'Vitórias seguidas' : 'Derrotas seguidas') : 'Sem sequência'}
          icon={Flame}
          color={data.streakType === 'V' ? 'emerald' : data.streakType === 'D' ? 'red' : 'slate'}
        />
      </div>

      {/* Evolução + V/D/E 30d + Hidratação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Peso histórico */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">📈 Peso (últimas pesagens)</CardTitle>
              <Link to="/app/peso" className="text-xs text-muted-foreground hover:text-foreground">
                ver →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.pesoHistorico.length > 0 ? (
              <>
                <SparklineChart
                  data={data.pesoHistorico.map((p) => ({ date: p.date, value: p.value }))}
                  color="cyan"
                  height={70}
                  showLabels
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Min: {Math.min(...data.pesoHistorico.map((p) => p.value)).toFixed(1)}kg</span>
                  <span>Max: {Math.max(...data.pesoHistorico.map((p) => p.value)).toFixed(1)}kg</span>
                </div>
              </>
            ) : (
              <div className="h-[70px] flex items-center justify-center text-xs text-muted-foreground">
                Sem pesagens ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sono histórico */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">😴 Sono (últimas noites)</CardTitle>
              <Link to="/app/sono" className="text-xs text-muted-foreground hover:text-foreground">
                ver →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.sonoHistorico.length > 0 ? (
              <>
                <SparklineChart
                  data={data.sonoHistorico.map((s) => ({ date: s.date, value: s.value }))}
                  color="purple"
                  height={70}
                  yMin={0}
                  yMax={12}
                  showLabels
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Meta: 7-9h</span>
                  <span>Atual: {data.sonoMedio?.toFixed(1)}h</span>
                </div>
              </>
            ) : (
              <div className="h-[70px] flex items-center justify-center text-xs text-muted-foreground">
                Sem registros ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* V/D/E 30 dias */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">🏆 Partidas (30d)</CardTitle>
              <Link to="/app/partidas" className="text-xs text-muted-foreground hover:text-foreground">
                ver →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={data.vitoriaDerrota30d} className="h-[70px]" />
            <div className="text-center text-xs text-muted-foreground mt-2">
              Win rate: {data.winRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de hidratação */}
      {data.hidratacaoMeta > 0 && data.hidratacaoHoje < data.hidratacaoMeta * 0.5 && (
        <Card className="border-cyan-500/50 bg-cyan-500/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <DropletIcon />
            <div className="flex-1">
              <div className="font-semibold text-sm">Hidratação baixa hoje: {data.hidratacaoHoje}ml / {data.hidratacaoMeta}ml</div>
              <p className="text-xs text-muted-foreground">Para 50+, beber água antes de sentir sede é crucial.</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/app/hidratacao/nova">Registrar</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Heatmap de atividades (últimos 30 dias) */}
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
              const ativo = data.diasAtivos.has(key);
              return (
                <div
                  key={key}
                  className={cn(
                    "aspect-square rounded text-[10px] flex items-center justify-center",
                    ativo
                      ? "bg-emerald-500/80 text-white"
                      : "bg-muted text-muted-foreground/50",
                  )}
                  title={day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                >
                  {day.getDate()}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>{data.diasAtivos.size} dias ativos</span>
            <span>Mais escuro = mais atividades</span>
          </div>
        </CardContent>
      </Card>

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
      {temDados && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Últimos treinos */}
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
              {data.ultimosTreinos.map((t: any) => {
                const d = tsToDate(t.data);
                const cor = t.intensidade >= 8 ? 'border-red-500' : t.intensidade >= 6 ? 'border-amber-500' : 'border-emerald-500';
                return (
                  <Link
                    key={t.id}
                    to={`/app/treinos/${t.id}`}
                    className={cn("block p-2 rounded-lg border-l-2 border-r border-y hover:bg-muted/50 transition", cor)}
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

          {/* Últimas partidas */}
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
              {data.ultimasPartidas.map((p: any) => {
                const d = tsToDate(p.data);
                const cor = p.resultado === 'vitoria' ? 'border-emerald-500' : p.resultado === 'derrota' ? 'border-red-500' : 'border-amber-500';
                return (
                  <Link
                    key={p.id}
                    to={`/app/partidas/${p.id}`}
                    className={cn("block p-2 rounded-lg border-l-2 border-r border-y hover:bg-muted/50 transition", cor)}
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
        </div>
      )}

      {!temDados && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Comece sua jornada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Registre seu primeiro treino ou partida para ver seu dashboard ganhar vida.
            </p>
            <div className="flex gap-2 justify-center mt-4">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({
  label, value, sub, icon: Icon, color, link,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: 'emerald' | 'amber' | 'cyan' | 'rose' | 'primary' | 'purple' | 'red' | 'slate' | 'blue' | 'orange';
  link?: string;
}) {
  const colors = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    cyan: 'text-cyan-500',
    rose: 'text-rose-500',
    primary: 'text-primary',
    purple: 'text-purple-500',
    red: 'text-red-500',
    slate: 'text-slate-500',
    blue: 'text-blue-500',
    orange: 'text-orange-500',
  };
  const content = (
    <Card className="hover:border-primary/30 transition">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <Icon className={cn("h-5 w-5", colors[color])} />
        </div>
      </CardContent>
    </Card>
  );
  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-500',
    amber: 'hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-500',
    cyan: 'hover:bg-cyan-500/10 hover:border-cyan-500/50 text-cyan-500',
    rose: 'hover:bg-rose-500/10 hover:border-rose-500/50 text-rose-500',
    orange: 'hover:bg-orange-500/10 hover:border-orange-500/50 text-orange-500',
    blue: 'hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-500',
    purple: 'hover:bg-purple-500/10 hover:border-purple-500/50 text-purple-500',
  };
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border transition",
        colorMap[color] || colorMap.emerald,
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
