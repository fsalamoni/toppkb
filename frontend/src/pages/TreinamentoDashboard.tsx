/**
 * 🏋️ Treinamento Físico — Dashboard (Hub)
 *
 * Entry point do módulo de Treinamento Físico.
 * Mostra KPIs, próximas sessões, atalhos para sub-módulos.
 *
 * Coleções Firestore (todas em toppkb_users/{uid}/treinamento/):
 * - sessoes/      → sessões executadas
 * - planos/       → planos de curto/médio/longo prazo
 * - metas/        → metas físicas
 * - notas/        → notas livres
 * - avaliacoes/   → avaliações físicas periódicas
 */

import { treinoCol } from '@/lib/firestorePaths';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/LoadingScreen';
import { Badge } from '@/components/ui/badge';
import {
  Activity, Calendar, Target, BookOpen, Award, ClipboardList,
  TrendingUp, FileText, ChevronRight, Flame, BarChart3,
  Timer, Zap, Plus, Dumbbell, Trophy, Ruler, Heart, Settings,
} from 'lucide-react';
import { formatDate, tempoRelativo } from '@/lib/utils';
import { TreinamentoAIInsights } from '@/components/treinamento/TreinamentoAIInsights';

const COLECAO_BASE = 'treinamento';

export function TreinamentoDashboard() {
  const { user } = useAuth();

  // Stats agregados
  const sessoes = useQuery({
    queryKey: [COLECAO_BASE, 'sessoes-count', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        treinoCol(db, user.uid, 'sessoes'),
        orderBy('data', 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const planos = useQuery({
    queryKey: [COLECAO_BASE, 'planos', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(treinoCol(db, user.uid, 'planos'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const metas = useQuery({
    queryKey: [COLECAO_BASE, 'metas', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(treinoCol(db, user.uid, 'metas'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  // KPIs
  const kpis = useMemo(() => {
    const sessoesArr = sessoes.data || [];
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sessoesUltimos7 = sessoesArr.filter(
      (s) => new Date(s.data) >= seteDiasAtras,
    ).length;
    const sessoesUltimos30 = sessoesArr.filter(
      (s) => new Date(s.data) >= trintaDiasAtras,
    ).length;
    const duracaoTotal = sessoesArr.reduce(
      (acc: number, s: any) => acc + (Number(s.duracaoMin) || 0),
      0,
    );
    const volumeTotal = sessoesArr.reduce(
      (acc: number, s: any) => acc + (Number(s.volumeTotal) || 0),
      0,
    );

    // Streak
    let streak = 0;
    const datas = new Set(
      sessoesArr.map((s: any) => new Date(s.data).toISOString().slice(0, 10)),
    );
    let d = new Date();
    while (datas.has(d.toISOString().slice(0, 10))) {
      streak++;
      d = new Date(d.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
      sessoesTotal: sessoesArr.length,
      sessoesUltimos7,
      sessoesUltimos30,
      duracaoTotal,
      volumeTotal,
      streak,
    };
  }, [sessoes.data]);

  if (sessoes.isLoading || planos.isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  const sessoesRecentes = (sessoes.data || []).slice(0, 5);
  const planosAtivos = (planos.data || []).filter((p: any) => p.status === 'ativo' || !p.status);
  const metasEmAndamento = (metas.data || []).filter((m: any) => m.status !== 'concluida');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-emerald-400" />
            Treinamento Físico
          </h1>
          <p className="text-muted-foreground mt-1">
            Planejamento, preparação e acompanhamento — curto, médio e longo prazo.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/app/treinamento/sessoes/nova">
            <Plus className="h-4 w-4 mr-1" />
            Nova Sessão
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          icon={Activity}
          label="Sessões"
          value={kpis.sessoesTotal}
          accent="emerald"
          sublabel="total"
        />
        <KpiCard
          icon={Flame}
          label="Últimos 7d"
          value={kpis.sessoesUltimos7}
          accent="orange"
          sublabel="sessões"
        />
        <KpiCard
          icon={Calendar}
          label="Últimos 30d"
          value={kpis.sessoesUltimos30}
          accent="blue"
          sublabel="sessões"
        />
        <KpiCard
          icon={Zap}
          label="Streak"
          value={`${kpis.streak}d`}
          accent="amber"
          sublabel={kpis.streak > 0 ? 'ativo' : 'comece hoje'}
        />
        <KpiCard
          icon={Timer}
          label="Tempo total"
          value={`${Math.round(kpis.duracaoTotal / 60)}h`}
          accent="cyan"
          sublabel={`${kpis.duracaoTotal} min`}
        />
        <KpiCard
          icon={BarChart3}
          label="Volume total"
          value={`${kpis.volumeTotal.toLocaleString('pt-BR')}`}
          accent="purple"
          sublabel="kg × reps"
        />
      </div>

      {/* NAVEGAÇÃO */}
      <div>
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
          Acompanhar e Planejar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <NavCard
            to="/app/treinamento/sessoes"
            icon={Activity}
            title="Sessões"
            desc="Registre cada treino executado. Séries, reps, carga, RPE, notas."
            accent="emerald"
          />
          <NavCard
            to="/app/treinamento/calendario"
            icon={Calendar}
            title="Calendário"
            desc="Visualize sessões e planejamentos em formato calendário."
            accent="blue"
          />
          <NavCard
            to="/app/treinamento/planos"
            icon={ClipboardList}
            title="Planos"
            desc="Curto (≤4 sem), médio (1-6 meses), longo prazo (até 2032)."
            accent="amber"
          />
          <NavCard
            to="/app/treinamento/metas"
            icon={Target}
            title="Metas"
            desc="Defina objetivos mensuráveis e acompanhe o progresso."
            accent="rose"
          />
          <NavCard
            to="/app/treinamento/avaliacoes"
            icon={TrendingUp}
            title="Avaliações"
            desc="Testes físicos periódicos (força, mobilidade, composição)."
            accent="cyan"
          />
          <NavCard
            to="/app/treinamento/notas"
            icon={BookOpen}
            title="Notas"
            desc="Anotações livres sobre treinos, insights, observações."
            accent="purple"
          />
          <NavCard
            to="/app/exercicios"
            icon={Dumbbell}
            title="Biblioteca de Exercícios"
            desc="89 exercícios KB catalogados com ciência e vídeo."
            accent="orange"
          />
          <NavCard
            to="/app/periodizacao"
            icon={Award}
            title="Periodização"
            desc="5 templates de 12 semanas com deloads automáticos."
            accent="pink"
          />
          <NavCard
            to="/app/treinamento/progresso"
            icon={BarChart3}
            title="Progresso (Charts)"
            desc="Volume, RPE, frequência e distribuição ao longo do tempo."
            accent="blue"
          />
          <NavCard
            to="/app/treinamento/heatmap"
            icon={Flame}
            title="Consistência (Heatmap)"
            desc="Mapa de calor estilo GitHub dos dias treinados."
            accent="orange"
          />
          <NavCard
            to="/app/treinamento/prs"
            icon={Trophy}
            title="Personal Records"
            desc="PRs calculados automaticamente de cada exercício."
            accent="amber"
          />
          <NavCard
            to="/app/treinamento/achievements"
            icon={Award}
            title="Achievements"
            desc="Badges e conquistas conforme você treina."
            accent="purple"
          />
          <NavCard
            to="/app/treinamento/templates"
            icon={FileText}
            title="Templates de Sessão"
            desc="Salve e reuse sessões recorrentes com 1 clique."
            accent="teal"
          />
          <NavCard
            to="/app/treinamento/composicao"
            icon={Ruler}
            title="Composição Corporal"
            desc="Peso, % gordura, massa magra, circunferências ao longo do tempo."
            accent="cyan"
          />
          <NavCard
            to="/app/treinamento/recuperacao"
            icon={Heart}
            title="Recuperação & Intensidade"
            desc="Score baseado em sono, dor, fadiga. Recomendação do dia."
            accent="rose"
          />
          <NavCard
            to="/app/treinamento/config"
            icon={Settings}
            title="Configurações"
            desc="Dias disponíveis, duração, unidade de carga, notificações."
            accent="slate"
          />
        </div>
      </div>

      {/* AI INSIGHTS */}
      <TreinamentoAIInsights />

      {/* ÚLTIMAS SESSÕES + PLANOS ATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimas sessões */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-emerald-400" />
              Últimas Sessões
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/treinamento/sessoes">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessoesRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma sessão registrada ainda.
                <br />
                <Link to="/app/treinamento/sessoes/nova" className="text-emerald-400 hover:underline">
                  Registrar primeira →
                </Link>
              </p>
            ) : (
              sessoesRecentes.map((s: any) => {
                const exeCount = Array.isArray(s.exercicios) ? s.exercicios.length : 0;
                return (
                  <Link
                    key={s.id}
                    to={`/app/treinamento/sessoes/${s.id}`}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {s.titulo || s.tipo || 'Sessão'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(s.data)} · {tempoRelativo(s.data)} · {exeCount} exercícios
                        {s.duracaoMin && ` · ${s.duracaoMin}min`}
                      </div>
                    </div>
                    {s.rpeMedio && (
                      <Badge variant="outline" className="text-xs">
                        RPE {s.rpeMedio}
                      </Badge>
                    )}
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Planos ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-amber-400" />
              Planos Ativos
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/treinamento/planos">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {planosAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum plano ativo.
                <br />
                <Link to="/app/treinamento/planos" className="text-amber-400 hover:underline">
                  Criar primeiro plano →
                </Link>
              </p>
            ) : (
              planosAtivos.slice(0, 5).map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{p.titulo || 'Plano'}</div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {p.horizonte || 'médio'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {p.descricao || 'Sem descrição'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* METAS EM ANDAMENTO */}
      {metasEmAndamento.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-rose-400" />
              Metas em Andamento ({metasEmAndamento.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metasEmAndamento.slice(0, 5).map((m: any) => (
              <Link
                key={m.id}
                to="/app/treinamento/metas"
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div>
                  <div className="font-medium text-sm">{m.titulo || 'Meta'}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.horizonte && `Horizonte: ${m.horizonte}`}
                    {m.prazo && ` · Prazo: ${formatDate(m.prazo)}`}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {m.status || 'andamento'}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface KpiCardProps {
  icon: any;
  label: string;
  value: number | string;
  sublabel?: string;
  accent: 'emerald' | 'blue' | 'amber' | 'rose' | 'cyan' | 'purple' | 'orange' | 'pink' | 'teal';
}

const ACCENT_COLORS: Record<string, string> = {
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
  amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  rose: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
  cyan: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400',
  purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
  orange: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
  pink: 'border-pink-500/30 bg-pink-500/5 text-pink-400',
  teal: 'border-teal-500/30 bg-teal-500/5 text-teal-400',
};

function KpiCard({ icon: Icon, label, value, sublabel, accent }: KpiCardProps) {
  const accentClass = ACCENT_COLORS[accent] || ACCENT_COLORS.emerald;
  return (
    <Card className={`border ${accentClass.split(' ')[0]} ${accentClass.split(' ')[1]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <Icon className={`h-4 w-4 ${accentClass.split(' ')[2]}`} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        <div className={`text-2xl font-bold ${accentClass.split(' ')[2]}`}>
          {value}
        </div>
        {sublabel && (
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {sublabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NavCardProps {
  to: string;
  icon: any;
  title: string;
  desc: string;
  accent: string;
}

function NavCard({ to, icon: Icon, title, desc, accent }: NavCardProps) {
  const accentClass = ACCENT_COLORS[accent] || ACCENT_COLORS.emerald;
  return (
    <Link to={to}>
      <Card className="hover:border-emerald-500/50 hover:shadow-md transition-all group">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${accentClass.split(' ')[1]} border ${accentClass.split(' ')[0]}`}>
            <Icon className={`h-5 w-5 ${accentClass.split(' ')[2]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm flex items-center gap-1">
              {title}
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              {desc}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
