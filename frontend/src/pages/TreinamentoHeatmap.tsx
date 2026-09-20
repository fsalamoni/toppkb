/**
 * 🏋️ Treinamento · Heatmap de Consistência
 *
 * Mapa de calor estilo GitHub mostrando dias treinados.
 * Cores vão de cinza (sem treino) → verde claro → verde escuro.
 *
 * Sub-rota: /app/treinamento/heatmap
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Spinner removido — não precisamos de loading state pois queries são rápidas
import {
  ChevronLeft, Flame, Calendar, Award,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Sessao {
  id: string;
  data: string;
  duracaoMin?: number;
  rpeMedio?: number;
  volumeTotal?: number;
}

interface DiaHeatmap {
  data: Date;
  dataStr: string;
  sessoes: number;
  intensidade: number; // 0-4 (0=cinza, 4=verde escuro)
}

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function TreinamentoHeatmap() {
  const { user } = useAuth();
  const [ano] = useState(new Date().getFullYear());

  const { data: sessoes } = useQuery({
    queryKey: ['treinamento-heatmap', user?.uid, ano],
    queryFn: async () => {
      if (!user) return [];
      const dataLimite = new Date(ano, 0, 1);
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'treinamento', 'sessoes'),
        orderBy('data', 'desc'),
        limit(1000),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Sessao))
        .filter((s) => new Date(s.data) >= dataLimite);
    },
    enabled: !!user,
  });

  // Calcula heatmap
  const heatmap = useMemo(() => {
    const mapa = new Map<string, DiaHeatmap>();

    // Inicializa todos os dias do ano com 0
    const inicio = new Date(ano, 0, 1);
    const fim = new Date(ano, 11, 31);
    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().slice(0, 10);
      mapa.set(dataStr, {
        data: new Date(d),
        dataStr,
        sessoes: 0,
        intensidade: 0,
      });
    }

    // Preenche com sessões
    (sessoes || []).forEach((s) => {
      const dataStr = new Date(s.data).toISOString().slice(0, 10);
      const dia = mapa.get(dataStr);
      if (dia) {
        dia.sessoes += 1;
      }
    });

    // Calcula intensidade baseada no max de sessões
    const maxSes = Math.max(1, ...Array.from(mapa.values()).map((d) => d.sessoes));
    mapa.forEach((dia) => {
      if (dia.sessoes === 0) dia.intensidade = 0;
      else if (dia.sessoes >= maxSes) dia.intensidade = 4;
      else dia.intensidade = Math.ceil((dia.sessoes / maxSes) * 4);
    });

    return mapa;
  }, [sessoes, ano]);

  // Stats
  const stats = useMemo(() => {
    const totalSessoes = Array.from(heatmap.values()).reduce((acc, d) => acc + d.sessoes, 0);
    const diasTreinados = Array.from(heatmap.values()).filter((d) => d.sessoes > 0).length;
    const diasNoAno = 365;
    const consistencia = ((diasTreinados / diasNoAno) * 100).toFixed(1);

    // Streak atual
    let streakAtual = 0;
    let maxStreak = 0;
    let streakTemp = 0;
    const cursor = new Date();
    const maxIter = 365;
    let iter = 0;

    // Streak atual
    while (iter++ < maxIter) {
      const dStr = cursor.toISOString().slice(0, 10);
      const dia = heatmap.get(dStr);
      if (dia && dia.sessoes > 0) {
        streakAtual++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    // Max streak
    Array.from(heatmap.values())
      .sort((a, b) => a.dataStr.localeCompare(b.dataStr))
      .forEach((d) => {
        if (d.sessoes > 0) {
          streakTemp++;
          if (streakTemp > maxStreak) maxStreak = streakTemp;
        } else {
          streakTemp = 0;
        }
      });

    // Média semanal
    const semanaAtual = getWeekKey(new Date());
    const sessoesSemanaAtual = (sessoes || []).filter(
      (s) => getWeekKey(new Date(s.data)) === semanaAtual,
    ).length;

    return {
      totalSessoes,
      diasTreinados,
      consistencia,
      streakAtual,
      maxStreak,
      sessoesSemanaAtual,
    };
  }, [heatmap, sessoes]);

  // Agrupa por semana (para visualização) - HOOK sempre chamado
  const semanas = useMemo(() => {
    const arr: DiaHeatmap[][] = [];
    let semanaAtual: DiaHeatmap[] = [];

    // Encontrar primeiro domingo
    const primeiroDia = new Date(ano, 0, 1);
    const diaSemana = primeiroDia.getDay();

    // Adicionar dias vazios antes do início
    for (let i = 0; i < diaSemana; i++) {
      semanaAtual.push(null as any);
    }

    Array.from(heatmap.values()).forEach((dia) => {
      semanaAtual.push(dia);
      if (semanaAtual.length === 7) {
        arr.push(semanaAtual);
        semanaAtual = [];
      }
    });

    if (semanaAtual.length > 0) {
      while (semanaAtual.length < 7) {
        semanaAtual.push(null as any);
      }
      arr.push(semanaAtual);
    }

    return arr;
  }, [heatmap, ano]);

  const CORES = [
    'bg-zinc-800',         // 0 - sem treino
    'bg-emerald-900',      // 1 - baixo
    'bg-emerald-700',      // 2 - médio
    'bg-emerald-500',      // 3 - alto
    'bg-emerald-300',      // 4 - muito alto
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Flame className="h-8 w-8 text-orange-400" />
          Consistência {ano}
        </h1>
        <p className="text-muted-foreground mt-1">
          Mapa de calor dos dias treinados — quanto mais verde, mais constante.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Total</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.totalSessoes}</div>
            <div className="text-xs text-muted-foreground">sessões no ano</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Dias</div>
            <div className="text-2xl font-bold text-blue-400">{stats.diasTreinados}</div>
            <div className="text-xs text-muted-foreground">treinados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Consistência</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.consistencia}%</div>
            <div className="text-xs text-muted-foreground">do ano</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Streak atual</div>
            <div className="text-2xl font-bold text-amber-400">
              🔥 {stats.streakAtual}d
            </div>
            <div className="text-xs text-muted-foreground">consecutivos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Maior streak</div>
            <div className="text-2xl font-bold text-rose-400">{stats.maxStreak}d</div>
            <div className="text-xs text-muted-foreground">recorde pessoal</div>
          </CardContent>
        </Card>
      </div>

      {/* HEATMAP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            Mapa de calor — {ano}
          </CardTitle>
          <CardDescription>
            Cada quadrado = 1 dia. Cor mais escura = mais sessões naquele dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-fit">
              {/* Coluna com labels dos meses */}
              <div className="flex flex-col gap-1 mr-2 pt-6">
                {MESES_PT.map((m) => (
                  <div key={m} className="text-xs text-muted-foreground h-3">{m}</div>
                ))}
              </div>

              {/* Heatmap */}
              <div className="flex flex-col gap-2">
                {/* Labels dos dias da semana */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DIAS_PT.map((d, i) => (
                    <div key={i} className="text-xs text-muted-foreground text-center w-3">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid de dias */}
                <div className="flex gap-1">
                  {semanas.map((semana, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      {semana.map((dia, i) => {
                        if (!dia) {
                          return <div key={i} className="w-3 h-3" />;
                        }
                        return (
                          <div
                            key={dia.dataStr}
                            className={`w-3 h-3 rounded-sm ${CORES[dia.intensidade]} cursor-pointer hover:ring-2 ring-emerald-400/50 transition-all`}
                            title={`${formatDate(dia.dataStr)} · ${dia.sessoes} sessão(ões)`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Menos</span>
            {CORES.map((cor, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${cor}`} />
            ))}
            <span>Mais</span>
          </div>
        </CardContent>
      </Card>

      {/* CARD MOTIVACIONAL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.streakAtual >= 7 ? (
            <p className="text-emerald-400">
              🔥 <strong>Streak incrível de {stats.streakAtual} dias!</strong> Continue assim — disciplina constrói excelência.
            </p>
          ) : stats.streakAtual >= 3 ? (
            <p className="text-amber-400">
              💪 Bom streak de {stats.streakAtual} dias. Tente estender até 7 dias essa semana.
            </p>
          ) : stats.streakAtual > 0 ? (
            <p className="text-blue-400">
              🌱 Streak atual: {stats.streakAtual} dia(s). Consistência {'>'} intensidade.
            </p>
          ) : (
            <p className="text-muted-foreground">
              ⏸️ Sem streak ativo. Que tal começar hoje?
            </p>
          )}
          {stats.consistencia && parseFloat(stats.consistencia) >= 70 && (
            <p className="text-rose-400 mt-2">
              🏆 <strong>{stats.consistencia}% de consistência no ano!</strong> Isso é elite.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
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
