/**
 * 🏋️ Treinamento · Progresso (Charts)
 *
 * Visualização gráfica de evolução ao longo do tempo:
 * - Volume semanal (kg × reps)
 * - RPE médio
 * - Frequência semanal
 * - Distribuição por padrão (pizza)
 * - Comparação entre meses
 *
 * Sub-rota: /app/treinamento/progresso
 */

import { treinoCol } from '@/lib/firestorePaths';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/LoadingScreen';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import {
  ChevronLeft, TrendingUp, BarChart3, Activity,
  Calendar, PieChart as PieIcon,
} from 'lucide-react';

interface Sessao {
  id: string;
  data: string;
  tipo: string;
  duracaoMin?: number;
  rpeMedio?: number;
  volumeTotal?: number;
  exercicios?: any[];
}

export function TreinamentoProgresso() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<'30' | '90' | '180' | '365'>('90');

  const { data: sessoes, isLoading } = useQuery({
    queryKey: ['treinamento-progresso', user?.uid, periodo],
    queryFn: async () => {
      if (!user) return [];
      const diasAtras = parseInt(periodo);
      const dataLimite = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
      const q = query(
        treinoCol(db, user.uid, 'sessoes'),
        orderBy('data', 'desc'),
        limit(500),
      );
      const snap = await getDocs(q);
      const arr = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Sessao))
        .filter((s) => new Date(s.data) >= dataLimite);
      return arr;
    },
    enabled: !!user,
  });

  // Agrupa por semana
  const dadosSemanais = useMemo(() => {
    if (!sessoes) return [];
    const grupos = new Map<string, { semana: string; sessoes: number; volume: number; rpe: number; minutos: number }>();

    sessoes.forEach((s) => {
      const data = new Date(s.data);
      const semana = getWeekKey(data);
      if (!grupos.has(semana)) {
        grupos.set(semana, { semana, sessoes: 0, volume: 0, rpe: 0, minutos: 0 });
      }
      const g = grupos.get(semana)!;
      g.sessoes += 1;
      g.volume += Number(s.volumeTotal) || 0;
      g.rpe += Number(s.rpeMedio) || 0;
      g.minutos += Number(s.duracaoMin) || 0;
    });

    // Calcular média de RPE
    const arr = Array.from(grupos.values()).map((g) => ({
      ...g,
      rpe: g.sessoes > 0 ? Math.round((g.rpe / g.sessoes) * 10) / 10 : 0,
    }));

    arr.sort((a, b) => a.semana.localeCompare(b.semana));
    return arr;
  }, [sessoes]);

  // Distribuição por tipo
  const dadosTipo = useMemo(() => {
    if (!sessoes) return [];
    const map = new Map<string, number>();
    sessoes.forEach((s) => {
      const t = s.tipo || 'outro';
      map.set(t, (map.get(t) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sessoes]);

  // Comparação mês atual vs anterior
  const comparacaoMensal = useMemo(() => {
    if (!sessoes) return { atual: null as any, anterior: null as any };
    const hoje = new Date();
    const mesAtualIni = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const mesAnteriorIni = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const mesAnteriorFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

    function stats(arr: Sessao[]) {
      return {
        sessoes: arr.length,
        volume: arr.reduce((a, s) => a + (Number(s.volumeTotal) || 0), 0),
        minutos: arr.reduce((a, s) => a + (Number(s.duracaoMin) || 0), 0),
        rpeMedio: arr.length > 0
          ? arr.reduce((a, s) => a + (Number(s.rpeMedio) || 0), 0) / arr.length
          : 0,
      };
    }

    const atualArr = sessoes.filter((s) => new Date(s.data) >= mesAtualIni);
    const anteriorArr = sessoes.filter(
      (s) => new Date(s.data) >= mesAnteriorIni && new Date(s.data) <= mesAnteriorFim,
    );

    return { atual: stats(atualArr), anterior: stats(anteriorArr) };
  }, [sessoes]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  const COLORS_PIE = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16', '#6366f1'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/app/treinamento">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Treinamento
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            Progresso
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize sua evolução ao longo do tempo.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { v: '30', label: '30d' },
            { v: '90', label: '90d' },
            { v: '180', label: '6m' },
            { v: '365', label: '1a' },
          ].map((p) => (
            <Button
              key={p.v}
              variant={periodo === p.v ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(p.v as any)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {sessoes && sessoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Sem sessões no período selecionado.
              <br />
              <Link to="/app/treinamento/sessoes/nova" className="text-emerald-400 hover:underline">
                Registrar primeira sessão →
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* COMPARAÇÃO MENSAL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ComparativoCard
              label="Sessões"
              atual={comparacaoMensal.atual?.sessoes || 0}
              anterior={comparacaoMensal.anterior?.sessoes || 0}
              accent="emerald"
            />
            <ComparativoCard
              label="Volume total"
              atual={comparacaoMensal.atual?.volume || 0}
              anterior={comparacaoMensal.anterior?.volume || 0}
              accent="purple"
              format="kg"
            />
            <ComparativoCard
              label="Tempo total"
              atual={comparacaoMensal.atual?.minutos || 0}
              anterior={comparacaoMensal.anterior?.minutos || 0}
              accent="cyan"
              format="min"
            />
            <ComparativoCard
              label="RPE médio"
              atual={comparacaoMensal.atual?.rpeMedio || 0}
              anterior={comparacaoMensal.anterior?.rpeMedio || 0}
              accent="amber"
              decimals={1}
            />
          </div>

          {/* VOLUME SEMANAL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Volume semanal (kg × reps)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dadosSemanais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="semana" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #444',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="volume" fill="#a78bfa" name="Volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* RPE MÉDIO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-amber-400" />
                RPE médio semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dadosSemanais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="semana" stroke="#888" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#888" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #444',
                      borderRadius: '6px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rpe"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    name="RPE"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* FREQUÊNCIA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-emerald-400" />
                Frequência semanal (sessões)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dadosSemanais}>
                  <defs>
                    <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="semana" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #444',
                      borderRadius: '6px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessoes"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorFreq)"
                    name="Sessões"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* DISTRIBUIÇÃO POR TIPO */}
          {dadosTipo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieIcon className="h-5 w-5 text-rose-400" />
                  Distribuição por tipo de sessão
                </CardTitle>
                <CardDescription>
                  Mostra se seu treino está balanceado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={dadosTipo}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={(e: any) => `${e.name}: ${e.value}`}
                      >
                        {dadosTipo.map((_, idx) => (
                          <Cell key={idx} fill={COLORS_PIE[idx % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #444',
                          borderRadius: '6px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {dadosTipo
                      .sort((a, b) => b.value - a.value)
                      .map((t, idx) => {
                        const total = dadosTipo.reduce((acc, d) => acc + d.value, 0);
                        const pct = ((t.value / total) * 100).toFixed(1);
                        return (
                          <div key={t.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: COLORS_PIE[idx % COLORS_PIE.length] }}
                              />
                              <span className="capitalize">{t.name}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {t.value} ({pct}%)
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

interface ComparativoCardProps {
  label: string;
  atual: number;
  anterior: number;
  accent: 'emerald' | 'purple' | 'cyan' | 'amber';
  format?: 'kg' | 'min' | '';
  decimals?: number;
}

const COMPARATIVO_CORES: Record<string, string> = {
  emerald: 'text-emerald-400',
  purple: 'text-purple-400',
  cyan: 'text-cyan-400',
  amber: 'text-amber-400',
};

function ComparativoCard({ label, atual, anterior, accent, format, decimals = 0 }: ComparativoCardProps) {
  const diff = atual - anterior;
  const pct = anterior > 0 ? ((diff / anterior) * 100) : 0;
  const isPositive = diff > 0;
  const isEqual = diff === 0;
  const accentClass = COMPARATIVO_CORES[accent];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${accentClass}`}>
          {format === 'kg'
            ? atual.toLocaleString('pt-BR')
            : format === 'min'
            ? `${atual} min`
            : atual.toFixed(decimals)}
          {format === 'kg' && ' kg'}
        </div>
        <div className="text-xs mt-1">
          {anterior > 0 ? (
            <span
              className={
                isEqual
                  ? 'text-muted-foreground'
                  : isPositive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }
            >
              {isEqual ? '=' : isPositive ? '↑' : '↓'}{' '}
              {format === 'kg' ? `${Math.abs(diff).toLocaleString('pt-BR')} kg` :
                format === 'min' ? `${Math.abs(diff)} min` :
                Math.abs(diff).toFixed(decimals)}
              {' '}({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
            </span>
          ) : (
            <span className="text-muted-foreground">primeiro mês</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">vs mês anterior</div>
      </CardContent>
    </Card>
  );
}

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}
