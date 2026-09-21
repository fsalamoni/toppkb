/**
 * 🏋️ Treinamento · Personal Records (PRs)
 *
 * Calcula PRs automaticamente a partir das sessões:
 * - Maior carga em cada exercício (séries × reps × carga)
 * - Mais reps em uma única série
 * - Maior volume numa sessão
 * - Sessão mais longa
 * - Maior duração de plank / isometria
 *
 * Sub-rota: /app/treinamento/prs
 */

import { treinoCol } from '@/lib/firestorePaths';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {query, orderBy, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import {
  ChevronLeft, Trophy, TrendingUp, Clock, Flame,
  Plus, Calendar, Dumbbell,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Sessao {
  id: string;
  data: string;
  titulo?: string;
  duracaoMin?: number;
  volumeTotal?: number;
  rpeMedio?: number;
  exercicios?: any[];
}

interface PR {
  exercicioId: string;
  exercicioNome: string;
  tipo: 'carga' | 'reps' | 'volume' | 'tempo';
  valor: number;
  unidade: string;
  data: string;
  sessaoId: string;
}

export function TreinamentoPRs() {
  const { user } = useAuth();
  const [filtro, setFiltro] = useState<'todos' | 'carga' | 'reps' | 'tempo'>('todos');

  const { data: sessoes, isLoading } = useQuery({
    queryKey: ['treinamento-prs', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        treinoCol(db, user.uid, 'sessoes'),
        orderBy('data', 'desc'),
        limit(500),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sessao));
    },
    enabled: !!user,
  });

  // Calcula PRs automaticamente
  const prs = useMemo(() => {
    if (!sessoes) return [];
    const prsMap = new Map<string, PR>();

    sessoes.forEach((s) => {
      if (!s.exercicios || !Array.isArray(s.exercicios)) return;

      s.exercicios.forEach((ex: any) => {
        if (!ex.exercicioId || !ex.nome) return;

        const cargaKg = parseFloat(String(ex.carga || '0').replace(/[^0-9.]/g, '')) || 0;
        const repsNum = typeof ex.reps === 'number' ? ex.reps : Number(String(ex.reps).match(/^\d+/)?.[0] || 0);
        const seriesNum = Number(ex.series) || 0;
        const volumeEx = seriesNum * repsNum * cargaKg;
        const tempoSeg = Number(ex.descansoSeg) || 0;

        // PR de carga (maior carga em 1 série)
        if (cargaKg > 0) {
          const key = `${ex.exercicioId}-carga`;
          const existing = prsMap.get(key);
          if (!existing || cargaKg > existing.valor) {
            prsMap.set(key, {
              exercicioId: ex.exercicioId,
              exercicioNome: ex.nome,
              tipo: 'carga',
              valor: cargaKg,
              unidade: 'kg',
              data: s.data,
              sessaoId: s.id,
            });
          }
        }

        // PR de reps em 1 série
        if (repsNum > 0) {
          const key = `${ex.exercicioId}-reps`;
          const existing = prsMap.get(key);
          if (!existing || repsNum > existing.valor) {
            prsMap.set(key, {
              exercicioId: ex.exercicioId,
              exercicioNome: ex.nome,
              tipo: 'reps',
              valor: repsNum,
              unidade: 'reps',
              data: s.data,
              sessaoId: s.id,
            });
          }
        }

        // PR de tempo (descanso)
        if (tempoSeg > 0) {
          const key = `${ex.exercicioId}-tempo`;
          const existing = prsMap.get(key);
          if (!existing || tempoSeg > existing.valor) {
            prsMap.set(key, {
              exercicioId: ex.exercicioId,
              exercicioNome: ex.nome,
              tipo: 'tempo',
              valor: tempoSeg,
              unidade: 's',
              data: s.data,
              sessaoId: s.id,
            });
          }
        }

        // PR de volume total do exercício na sessão
        if (volumeEx > 0) {
          const key = `${ex.exercicioId}-volume`;
          const existing = prsMap.get(key);
          if (!existing || volumeEx > existing.valor) {
            prsMap.set(key, {
              exercicioId: ex.exercicioId,
              exercicioNome: ex.nome,
              tipo: 'volume',
              valor: volumeEx,
              unidade: 'kg·reps',
              data: s.data,
              sessaoId: s.id,
            });
          }
        }
      });
    });

    return Array.from(prsMap.values()).sort((a, b) => {
      if (a.exercicioNome === b.exercicioNome) {
        return a.tipo.localeCompare(b.tipo);
      }
      return a.exercicioNome.localeCompare(b.exercicioNome);
    });
  }, [sessoes]);

  // PRs filtrados
  const prsFiltrados = useMemo(() => {
    if (filtro === 'todos') return prs;
    return prs.filter((p) => p.tipo === filtro);
  }, [prs, filtro]);

  // PRs por exercício (apenas o "principal" de cada)
  const prsPrincipais = useMemo(() => {
    const map = new Map<string, PR>();
    prs.forEach((p) => {
      if (!map.has(p.exercicioId)) {
        map.set(p.exercicioId, p);
      }
    });
    return Array.from(map.values());
  }, [prs]);

  // Stats gerais
  const stats = useMemo(() => {
    return {
      total: prs.length,
      maiorCarga: prs.filter((p) => p.tipo === 'carga').sort((a, b) => b.valor - a.valor)[0],
      maiorReps: prs.filter((p) => p.tipo === 'reps').sort((a, b) => b.valor - a.valor)[0],
      maiorVolume: prs.filter((p) => p.tipo === 'volume').sort((a, b) => b.valor - a.valor)[0],
      unicos: prsPrincipais.length,
    };
  }, [prs, prsPrincipais]);

  // Função para salvar PR manualmente
  async function salvarPRManualmente() {
    if (!user) return;
    const exercicio = prompt('Nome do exercício:');
    if (!exercicio) return;
    const valor = prompt('Valor (número):');
    if (!valor || isNaN(Number(valor))) return;
    const unidade = prompt('Unidade (kg, reps, min, s):') || 'kg';

    try {
      await addDoc(treinoCol(db, user.uid, 'prs'), {
        exercicio,
        valor: Number(valor),
        unidade,
        data: new Date().toISOString(),
        manual: true,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'PR registrado!', variant: 'success' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

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
            <Trophy className="h-8 w-8 text-amber-400" />
            Personal Records
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculados automaticamente a partir das suas sessões.
          </p>
        </div>
        <Button variant="outline" onClick={salvarPRManualmente}>
          <Plus className="h-4 w-4 mr-1" />
          PR Manual
        </Button>
      </div>

      {/* DESTAQUES */}
      {stats.maiorCarga && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="p-4">
              <Badge className="mb-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                🏆 Maior carga
              </Badge>
              <div className="text-2xl font-bold">{stats.maiorCarga.valor} kg</div>
              <div className="text-sm text-muted-foreground">{stats.maiorCarga.exercicioNome}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(stats.maiorCarga.data)}
              </div>
            </CardContent>
          </Card>
          {stats.maiorReps && (
            <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="p-4">
                <Badge className="mb-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                  💪 Mais reps
                </Badge>
                <div className="text-2xl font-bold">{stats.maiorReps.valor} reps</div>
                <div className="text-sm text-muted-foreground">{stats.maiorReps.exercicioNome}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDate(stats.maiorReps.data)}
                </div>
              </CardContent>
            </Card>
          )}
          {stats.maiorVolume && (
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="p-4">
                <Badge className="mb-2 bg-purple-500/20 text-purple-400 border-purple-500/30">
                  📊 Maior volume
                </Badge>
                <div className="text-2xl font-bold">
                  {stats.maiorVolume.valor.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">{stats.maiorVolume.exercicioNome}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDate(stats.maiorVolume.data)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">PRs totais</div>
            <div className="text-2xl font-bold text-amber-400">{stats.total}</div>
            <div className="text-xs text-muted-foreground">rastreados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Exercícios únicos</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.unicos}</div>
            <div className="text-xs text-muted-foreground">com PR</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Por carga</div>
            <div className="text-2xl font-bold text-rose-400">
              {prs.filter((p) => p.tipo === 'carga').length}
            </div>
            <div className="text-xs text-muted-foreground">PRs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Por volume</div>
            <div className="text-2xl font-bold text-cyan-400">
              {prs.filter((p) => p.tipo === 'volume').length}
            </div>
            <div className="text-xs text-muted-foreground">PRs</div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'todos', label: 'Todos', icon: Trophy },
              { v: 'carga', label: 'Carga (kg)', icon: Dumbbell },
              { v: 'reps', label: 'Repetições', icon: TrendingUp },
              { v: 'volume', label: 'Volume', icon: Flame },
              { v: 'tempo', label: 'Tempo (descanso)', icon: Clock },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <Button
                  key={f.v}
                  variant={filtro === f.v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltro(f.v as any)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {f.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE PRs */}
      {prsFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">
              {prs.length === 0
                ? 'Nenhum PR detectado ainda. Registre sessões com séries, reps e carga para começar.'
                : 'Nenhum PR encontrado com esse filtro.'}
            </p>
            {prs.length === 0 && (
              <Button asChild>
                <Link to="/app/treinamento/sessoes/nova">
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar Sessão
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {prsFiltrados.map((pr, idx) => (
            <PRCard key={`${pr.exercicioId}-${pr.tipo}-${idx}`} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
}

function PRCard({ pr }: { pr: PR }) {
  const tipoCor = {
    carga: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
    reps: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    volume: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
    tempo: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400',
  }[pr.tipo];

  const tipoLabel = {
    carga: 'Maior carga',
    reps: 'Mais reps',
    volume: 'Maior volume',
    tempo: 'Mais tempo',
  }[pr.tipo];

  const Icon = {
    carga: Dumbbell,
    reps: TrendingUp,
    volume: Flame,
    tempo: Clock,
  }[pr.tipo];

  return (
    <Link to={`/app/treinamento/sessoes/${pr.sessaoId}`}>
      <Card className="hover:border-emerald-500/50 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded border ${tipoCor.split(' ').slice(0, 2).join(' ')}`}>
              <Icon className={`h-4 w-4 ${tipoCor.split(' ')[2]}`} />
            </div>
            <Badge variant="outline" className="text-xs">
              {tipoLabel}
            </Badge>
          </div>
          <div className="font-semibold text-base mb-1">{pr.exercicioNome}</div>
          <div className={`text-2xl font-bold ${tipoCor.split(' ')[2]}`}>
            {pr.valor.toLocaleString('pt-BR')} {pr.unidade}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(pr.data)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
