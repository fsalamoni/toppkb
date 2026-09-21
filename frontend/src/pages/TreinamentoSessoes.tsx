/**
 * 🏋️ Treinamento · Sessões — Lista + Visualização
 *
 * Lista todas as sessões de treino físico com:
 * - Filtros (tipo, período, padrão dominante)
 * - Stats agregadas (total, minutos, volume)
 * - Cards de cada sessão (clicáveis para detalhe)
 *
 * Sub-rota: /app/treinamento/sessoes
 */

import { treinoCol, treinoDoc } from '@/lib/firestorePaths';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  query, orderBy, getDocs, deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import {
  Plus, Trash2, ChevronLeft, Activity, Filter,
  Calendar, Edit,
} from 'lucide-react';
import { formatDate, formatDateTime, tempoRelativo } from '@/lib/utils';

const TIPOS_SESSAO = [
  { value: 'forca', label: '💪 Força', cor: 'rose' },
  { value: 'hipertrofia', label: '💪 Hipertrofia', cor: 'rose' },
  { value: 'potencia', label: '⚡ Potência', cor: 'amber' },
  { value: 'resistencia', label: '🫀 Resistência', cor: 'blue' },
  { value: 'mobilidade', label: '🤸 Mobilidade', cor: 'cyan' },
  { value: 'kettlebell', label: '🏋️ Kettlebell', cor: 'emerald' },
  { value: 'cardio', label: '❤️ Cardio', cor: 'red' },
  { value: 'core', label: '🧱 Core', cor: 'slate' },
  { value: 'misto', label: '⚡ Misto', cor: 'purple' },
  { value: 'tecnica', label: '🎯 Técnica', cor: 'amber' },
  { value: 'avaliacao', label: '📊 Avaliação', cor: 'blue' },
  { value: 'descanso', label: '🛌 Descanso ativo', cor: 'slate' },
];

const TIPOS_COR: Record<string, string> = {
  forca: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  hipertrofia: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  potencia: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  resistencia: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  mobilidade: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  kettlebell: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cardio: 'bg-red-500/10 text-red-400 border-red-500/30',
  core: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  misto: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  tecnica: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  avaliacao: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  descanso: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export function TreinamentoSessoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todas');

  const { data, isLoading } = useQuery({
    queryKey: ['treinamento-sessoes', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        treinoCol(db, user.uid, 'sessoes'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(treinoDoc(db, user.uid, 'sessoes', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treinamento-sessoes'] });
      qc.invalidateQueries({ queryKey: ['treinamento'] });
      toast({ title: 'Sessão removida', variant: 'success' });
    },
  });

  // Stats
  const stats = useMemo(() => {
    const arr = data || [];
    const total = arr.length;
    const duracaoTotal = arr.reduce((acc: number, s: any) => acc + (Number(s.duracaoMin) || 0), 0);
    const volumeTotal = arr.reduce((acc: number, s: any) => acc + (Number(s.volumeTotal) || 0), 0);
    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessoesMes = arr.filter((s: any) => new Date(s.data) >= trintaDiasAtras).length;

    // Tipo mais comum
    const tipoCount: Record<string, number> = {};
    arr.forEach((s: any) => {
      if (s.tipo) tipoCount[s.tipo] = (tipoCount[s.tipo] || 0) + 1;
    });
    const tipoMaisComum = Object.entries(tipoCount).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { total, duracaoTotal, volumeTotal, sessoesMes, tipoMaisComum };
  }, [data]);

  // Filtros
  const sessoesFiltradas = useMemo(() => {
    const arr = data || [];
    return arr.filter((s: any) => {
      // Tipo
      if (filtroTipo !== 'todas' && s.tipo !== filtroTipo) return false;

      // Período
      if (filtroPeriodo !== 'todas') {
        const dias = filtroPeriodo === '7d' ? 7 : filtroPeriodo === '30d' ? 30 : filtroPeriodo === '90d' ? 90 : 365;
        const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
        if (new Date(s.data) < limite) return false;
      }

      return true;
    });
  }, [data, filtroTipo, filtroPeriodo]);

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
            <Activity className="h-8 w-8 text-emerald-400" />
            Sessões de Treinamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo de todas as sessões executadas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/treinamento/calendario">
              <Calendar className="h-4 w-4 mr-1" />
              Calendário
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/app/treinamento/sessoes/nova">
              <Plus className="h-4 w-4 mr-1" />
              Nova Sessão
            </Link>
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Total</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.total}</div>
            <div className="text-xs text-muted-foreground">sessões</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Este mês</div>
            <div className="text-2xl font-bold text-blue-400">{stats.sessoesMes}</div>
            <div className="text-xs text-muted-foreground">sessões</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Tempo total</div>
            <div className="text-2xl font-bold text-cyan-400">
              {Math.round(stats.duracaoTotal / 60)}h
            </div>
            <div className="text-xs text-muted-foreground">{stats.duracaoTotal} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Volume total</div>
            <div className="text-2xl font-bold text-purple-400">
              {stats.volumeTotal.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-muted-foreground">kg × reps</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-muted-foreground">Mais comum</div>
            <div className="text-lg font-bold text-amber-400 capitalize">
              {TIPOS_SESSAO.find((t) => t.value === stats.tipoMaisComum)?.label.replace(/^.+ /, '') || '—'}
            </div>
            <div className="text-xs text-muted-foreground">tipo</div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtros:
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={filtroTipo === 'todas' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFiltroTipo('todas')}
              >
                Todos
              </Badge>
              {TIPOS_SESSAO.map((t) => (
                <Badge
                  key={t.value}
                  variant={filtroTipo === t.value ? 'default' : 'outline'}
                  className={`cursor-pointer ${filtroTipo === t.value ? TIPOS_COR[t.value] : ''}`}
                  onClick={() => setFiltroTipo(t.value)}
                >
                  {t.label}
                </Badge>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              {[
                { v: 'todas', label: 'Tudo' },
                { v: '7d', label: '7 dias' },
                { v: '30d', label: '30 dias' },
                { v: '90d', label: '90 dias' },
              ].map((p) => (
                <Button
                  key={p.v}
                  variant={filtroPeriodo === p.v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroPeriodo(p.v)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONTAGEM */}
      <div className="text-sm text-muted-foreground">
        {sessoesFiltradas.length} de {data?.length || 0} sessões
      </div>

      {/* LISTA */}
      {sessoesFiltradas.length === 0 ? (
        <EmptyState
          icone="🏋️"
          titulo="Nenhuma sessão registrada"
          descricao="Registre sua primeira sessão de treino"
        />
      ) : (
        <div className="space-y-2">
          {sessoesFiltradas.map((s: any) => {
            const tipoCor = TIPOS_COR[s.tipo] || TIPOS_COR.misto;
            const exeCount = Array.isArray(s.exercicios) ? s.exercicios.length : 0;
            return (
              <Card key={s.id} className="hover:border-emerald-500/50 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/app/treinamento/sessoes/${s.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`capitalize ${tipoCor}`}>
                          {TIPOS_SESSAO.find((t) => t.value === s.tipo)?.label || s.tipo || 'Sessão'}
                        </Badge>
                        {s.planoOrigemId && (
                          <Badge variant="outline" className="text-xs">
                            📋 Plano
                          </Badge>
                        )}
                      </div>
                      <div className="font-semibold text-base">
                        {s.titulo || `Sessão ${formatDate(s.data)}`}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDateTime(s.data)} · {tempoRelativo(s.data)}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {exeCount > 0 && (
                          <span>📦 {exeCount} exercícios</span>
                        )}
                        {s.duracaoMin && (
                          <span>⏱ {s.duracaoMin} min</span>
                        )}
                        {s.rpeMedio && (
                          <span>💪 RPE {s.rpeMedio}</span>
                        )}
                        {s.volumeTotal > 0 && (
                          <span>📊 {s.volumeTotal.toLocaleString('pt-BR')} kg</span>
                        )}
                        {s.local && (
                          <span>📍 {s.local}</span>
                        )}
                      </div>
                      {s.observacoes && (
                        <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          💬 {s.observacoes}
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-col gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/app/treinamento/sessoes/${s.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('Remover esta sessão?')) del.mutate(s.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
