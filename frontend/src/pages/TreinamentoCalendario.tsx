/**
 * 🏋️ Treinamento · Calendário Unificado
 *
 * Visualização em calendário mensal de:
 * - Sessões executadas
 * - Planos ativos (períodos)
 * - Metas com prazo
 *
 * Sub-rota: /app/treinamento/calendario
 */

import { treinoCol } from '@/lib/firestorePaths';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/LoadingScreen';
import {
  ChevronLeft, ChevronRight, Plus, Activity, Target,
  ClipboardList, X, Calendar as CalendarIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface ItemCalendario {
  id: string;
  data: string;          // ISO
  titulo: string;
  tipo: 'sessao' | 'plano' | 'meta';
  subtipo?: string;
  cor: string;
  link?: string;
}

const TIPOS_SESSAO_COR: Record<string, string> = {
  forca: 'bg-rose-500',
  hipertrofia: 'bg-rose-500',
  potencia: 'bg-amber-500',
  resistencia: 'bg-blue-500',
  mobilidade: 'bg-cyan-500',
  kettlebell: 'bg-emerald-500',
  cardio: 'bg-red-500',
  core: 'bg-slate-500',
  misto: 'bg-purple-500',
  tecnica: 'bg-amber-500',
  avaliacao: 'bg-blue-500',
  descanso: 'bg-slate-500',
};

export function TreinamentoCalendario() {
  const { user } = useAuth();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth()); // 0-11
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  // Carrega tudo (sessões + planos + metas)
  const sessoes = useQuery({
    queryKey: ['treinamento-cal-sessoes', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(treinoCol(db, user.uid, 'sessoes'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const planos = useQuery({
    queryKey: ['treinamento-cal-planos', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(treinoCol(db, user.uid, 'planos'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const metas = useQuery({
    queryKey: ['treinamento-cal-metas', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(treinoCol(db, user.uid, 'metas'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  // Constrói grid do mês
  const gridMes = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay(); // 0=dom

    const celulas: Array<{ data: string | null; dia: number | null }> = [];

    // Preenche dias vazios antes do mês
    for (let i = 0; i < diaSemanaInicio; i++) {
      celulas.push({ data: null, dia: null });
    }

    // Preenche dias do mês
    for (let d = 1; d <= diasNoMes; d++) {
      const dataStr = new Date(ano, mes, d).toISOString().slice(0, 10);
      celulas.push({ data: dataStr, dia: d });
    }

    return celulas;
  }, [ano, mes]);

  // Mapeia itens por dia
  const itensPorDia = useMemo(() => {
    const mapa = new Map<string, ItemCalendario[]>();

    function add(dataISO: string, item: ItemCalendario) {
      const dia = dataISO.slice(0, 10);
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia)!.push(item);
    }

    // Sessões executadas
    (sessoes.data || []).forEach((s: any) => {
      if (!s.data) return;
      const dataISO = new Date(s.data).toISOString();
      add(dataISO, {
        id: s.id,
        data: dataISO,
        titulo: s.titulo || `Sessão ${formatDate(s.data)}`,
        tipo: 'sessao',
        subtipo: s.tipo,
        cor: TIPOS_SESSAO_COR[s.tipo] || 'bg-emerald-500',
        link: `/app/treinamento/sessoes/${s.id}`,
      });
    });

    // Planos (períodos)
    (planos.data || []).forEach((p: any) => {
      if (!p.dataInicio) return;
      const inicio = new Date(p.dataInicio);
      const fim = p.dataFim ? new Date(p.dataFim) : new Date(inicio.getTime() + 30 * 24 * 60 * 60 * 1000);
      const cor = p.horizonte === 'curto' ? 'bg-amber-500' :
                  p.horizonte === 'longo' ? 'bg-purple-500' : 'bg-blue-500';

      // Para cada dia do plano que cai no mês exibido
      for (let d = new Date(ano, mes, 1); d <= new Date(ano, mes + 1, 0); d.setDate(d.getDate() + 1)) {
        if (d >= inicio && d <= fim) {
          add(d.toISOString(), {
            id: p.id,
            data: d.toISOString(),
            titulo: p.titulo || 'Plano',
            tipo: 'plano',
            subtipo: p.horizonte,
            cor,
            link: '/app/treinamento/planos',
          });
        }
      }
    });

    // Metas com prazo
    (metas.data || []).forEach((m: any) => {
      if (!m.prazo) return;
      add(new Date(m.prazo).toISOString(), {
        id: m.id,
        data: new Date(m.prazo).toISOString(),
        titulo: m.titulo || 'Meta',
        tipo: 'meta',
        subtipo: m.horizonte,
        cor: 'bg-rose-500',
        link: '/app/treinamento/metas',
      });
    });

    return mapa;
  }, [sessoes.data, planos.data, metas.data, ano, mes]);

  // totalItensMes removido (não utilizado)

  function navigateMes(delta: number) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    }
    setMes(novoMes);
    setAno(novoAno);
    setDiaSelecionado(null);
  }

  function hoje() {
    const d = new Date();
    setAno(d.getFullYear());
    setMes(d.getMonth());
    setDiaSelecionado(d.toISOString().slice(0, 10));
  }

  if (sessoes.isLoading || planos.isLoading || metas.isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  const itensDiaSelecionado = diaSelecionado ? (itensPorDia.get(diaSelecionado) || []) : [];

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
            <CalendarIcon className="h-8 w-8 text-blue-400" />
            Calendário de Treinamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão unificada de sessões executadas, planos ativos e metas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/treinamento/sessoes/nova">
              <Plus className="h-4 w-4 mr-1" />
              Nova Sessão
            </Link>
          </Button>
        </div>
      </div>

      {/* NAVEGAÇÃO MÊS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMes(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-bold min-w-[200px] text-center">
                {MESES_PT[mes]} {ano}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateMes(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={hoje}>
                Hoje
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Sessão
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Plano médio
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Plano curto
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Plano longo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Meta
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* HEADER DIAS DA SEMANA */}
            {DIAS_PT.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}

            {/* DIAS */}
            {gridMes.map((cel, idx) => {
              if (!cel.data) {
                return <div key={idx} className="aspect-square" />;
              }
              const itens = itensPorDia.get(cel.data) || [];
              const isHoje = cel.data === new Date().toISOString().slice(0, 10);
              const isSelecionado = cel.data === diaSelecionado;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDiaSelecionado(cel.data === diaSelecionado ? null : cel.data)}
                  className={`aspect-square border border-border rounded p-1 text-left transition-all hover:border-emerald-500/50 ${
                    isHoje ? 'ring-2 ring-emerald-500/50' : ''
                  } ${isSelecionado ? 'bg-emerald-500/10 border-emerald-500' : ''}`}
                >
                  <div className={`text-xs font-bold ${isHoje ? 'text-emerald-400' : 'text-foreground'}`}>
                    {cel.dia}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {itens.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        className={`text-[9px] px-1 rounded ${item.cor} text-white truncate`}
                        title={item.titulo}
                      >
                        {item.tipo === 'sessao' ? '🏋️' : item.tipo === 'plano' ? '📋' : '🎯'}{' '}
                        {item.titulo.slice(0, 12)}
                      </div>
                    ))}
                    {itens.length > 3 && (
                      <div className="text-[9px] text-muted-foreground">
                        +{itens.length - 3} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* DETALHE DO DIA */}
      {diaSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>
                {formatDate(diaSelecionado + 'T12:00:00')} · {itensDiaSelecionado.length} item(s)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setDiaSelecionado(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {itensDiaSelecionado.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nada planejado ou registrado neste dia.
              </p>
            ) : (
              itensDiaSelecionado.map((item) => {
                const Icon = item.tipo === 'sessao' ? Activity : item.tipo === 'plano' ? ClipboardList : Target;
                return (
                  <Link
                    key={item.id + item.tipo}
                    to={item.link || '#'}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className={`p-2 rounded ${item.cor} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.titulo}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {item.tipo} {item.subtipo && `· ${item.subtipo}`}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* RESUMO DO MÊS */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Sessões no mês</div>
            <div className="text-2xl font-bold text-emerald-400">
              {Array.from(itensPorDia.entries()).filter(([d]) => {
                const dt = new Date(d);
                return dt.getMonth() === mes && dt.getFullYear() === ano;
              }).reduce((acc, [, items]) => acc + items.filter((i) => i.tipo === 'sessao').length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Planos ativos</div>
            <div className="text-2xl font-bold text-blue-400">
              {(planos.data || []).filter((p: any) => p.status === 'ativo' || !p.status).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Metas com prazo</div>
            <div className="text-2xl font-bold text-rose-400">
              {(metas.data || []).filter((m: any) => m.prazo).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
