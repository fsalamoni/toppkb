import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronRight, X, BookOpen, Activity, Flame,
  ChevronDown, Sparkles, Dumbbell,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  KETTLEBELL_EXERCICIOS,
  KETTLEBELL_PATTERNS,
  type ExercicioKettlebell,
  type PadraoKettlebell,
} from '@/data/seed/exercicios-kettlebell';
import { ExerciseDetailModal } from '@/components/common/ExerciseDetailModal';
import { MuscleHint } from '@/components/common/MuscleHint';
import { getMuscleStats, filterByMuscle } from '@/lib/muscle-stats';

const NIVEL_CORES: Record<string, string> = {
  iniciante: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  intermediario: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  avancado: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export function Exercicios() {
  const [busca, setBusca] = useState('');
  const [filtroPadrao, setFiltroPadrao] = useState<PadraoKettlebell | 'todos'>('todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [filtroMusculo, setFiltroMusculo] = useState<string | null>(null);
  const [musculoBusca, setMusculoBusca] = useState('');
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [selecionado, setSelecionado] = useState<ExercicioKettlebell | null>(null);

  const muscleStats = useMemo(() => getMuscleStats(), []);

  // Músculos filtrados pela busca (para encontrar rápido)
  const muscleStatsFiltrados = useMemo(() => {
    if (!musculoBusca.trim()) return muscleStats;
    const lower = musculoBusca.toLowerCase();
    return muscleStats.filter(
      (m) =>
        m.nome.toLowerCase().includes(lower) ||
        m.display.toLowerCase().includes(lower)
    );
  }, [muscleStats, musculoBusca]);

  // TOP 12 (mais usados) ou todos se busca ativa
  const muscleStatsVisiveis = useMemo(() => {
    if (musculoBusca.trim() || mostrarTodos) return muscleStatsFiltrados;
    return muscleStatsFiltrados.slice(0, 12);
  }, [muscleStatsFiltrados, mostrarTodos, musculoBusca]);

  const temMais = !musculoBusca.trim() && muscleStatsFiltrados.length > 12;

  const exerciciosFiltrados = useMemo(() => {
    // Se há músculo selecionado, começa pela lista filtrada por músculo
    const base = filtroMusculo ? filterByMuscle(filtroMusculo) : KETTLEBELL_EXERCICIOS;
    const buscaLower = busca.toLowerCase();
    return base.filter((ex) => {
      const matchBusca = !busca ||
        ex.nome.toLowerCase().includes(buscaLower) ||
        ex.descricao.toLowerCase().includes(buscaLower) ||
        ex.cues?.some((c) => c.toLowerCase().includes(buscaLower)) ||
        ex.errors?.some((e) => e.toLowerCase().includes(buscaLower));
      const matchPadrao = filtroPadrao === 'todos' || ex.padraoKb === filtroPadrao;
      const matchNivel = filtroNivel === 'todos' || ex.nivel === filtroNivel;
      return matchBusca && matchPadrao && matchNivel;
    });
  }, [busca, filtroPadrao, filtroNivel, filtroMusculo]);

  const contadores = useMemo(() => {
    const stats: Record<string, number> = { total: KETTLEBELL_EXERCICIOS.length };
    Object.keys(KETTLEBELL_PATTERNS).forEach((p) => {
      stats[p] = KETTLEBELL_EXERCICIOS.filter((e) => e.padraoKb === p).length;
    });
    return stats;
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-emerald-400" />
            Biblioteca de Exercícios
          </h1>
          <p className="text-muted-foreground mt-1">
            {KETTLEBELL_EXERCICIOS.length} exercícios de kettlebell catalogados com ciência,
            biomecânica e aplicações práticas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/periodizacao">
              <Activity className="h-4 w-4 mr-1" />
              Periodização
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/app/preparacao/nova">
              <Flame className="h-4 w-4 mr-1" />
              Registrar Sessão
            </Link>
          </Button>
        </div>
      </div>

      {/* STATS POR PADRÃO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <button
          onClick={() => setFiltroPadrao('todos')}
          className={`p-3 rounded-lg border transition-all ${
            filtroPadrao === 'todos'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-border bg-card hover:bg-accent'
          }`}
        >
          <div className="text-2xl font-bold">{contadores.total}</div>
          <div className="text-xs text-muted-foreground">Todos</div>
        </button>
        {(Object.keys(KETTLEBELL_PATTERNS) as PadraoKettlebell[]).map((p) => (
          <button
            key={p}
            onClick={() => setFiltroPadrao(p)}
            className={`p-3 rounded-lg border transition-all ${
              filtroPadrao === p
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border bg-card hover:bg-accent'
            }`}
          >
            <div className="text-2xl font-bold">{contadores[p]}</div>
            <div className="text-xs flex items-center gap-1 justify-center">
              <span>{KETTLEBELL_PATTERNS[p].icone}</span>
              {KETTLEBELL_PATTERNS[p].nome}
            </div>
          </button>
        ))}
      </div>

      {/* SPRINT 52: FILTRO POR MÚSCULO (Sprint 57: busca + expandir) */}
      <Card className="bg-card/40 border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold">
                Filtrar por músculo
                <span className="text-muted-foreground ml-1 font-normal">
                  ({muscleStats.length} grupos musculares)
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[200px] justify-end">
              {/* BUSCA dentro de músculos */}
              {muscleStats.length > 6 && (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    inputMode="search"
                    placeholder="Buscar músculo..."
                    value={musculoBusca}
                    onChange={(e) => setMusculoBusca(e.target.value)}
                    className="h-8 pl-7 text-xs w-40"
                    aria-label="Buscar músculo"
                  />
                </div>
              )}
              {filtroMusculo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltroMusculo(null)}
                  aria-label={`Remover filtro: ${filtroMusculo}`}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Limpar ({filtroMusculo})</span>
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Clique no músculo para ver exercícios que o trabalham.
          </p>

          {muscleStatsFiltrados.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum músculo encontrado com "{musculoBusca}"
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {muscleStatsVisiveis.map((m, idx) => (
                  <button
                    key={m.nome}
                    onClick={() => setFiltroMusculo(filtroMusculo === m.nome ? null : m.nome)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300 ${
                      filtroMusculo === m.nome
                        ? `${m.cor} ring-2 ring-offset-1 ring-offset-background ring-current scale-105`
                        : `${m.cor} opacity-60 hover:opacity-100 hover:scale-105`
                    }`}
                    style={{ animationDelay: `${Math.min(idx * 20, 200)}ms` }}
                    aria-pressed={filtroMusculo === m.nome}
                    aria-label={`Filtrar por ${m.display}: ${m.count} exercícios`}
                    title={`${m.display}: ${m.count} exercícios`}
                  >
                    <span aria-hidden="true">{m.icone}</span>
                    <span>{m.display}</span>
                    <span className="opacity-70 font-mono">({m.count})</span>
                  </button>
                ))}
              </div>
              {temMais && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarTodos(true)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Ver todos os {muscleStatsFiltrados.length} músculos
                </Button>
              )}
              {mostrarTodos && !musculoBusca && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarTodos(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mostrar apenas top 12
                </Button>
              )}
              {/* Dica contextual quando músculo selecionado */}
              {filtroMusculo && (
                <div className="mt-2 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>
                    Mostrando <strong>{exerciciosFiltrados.length}</strong> exercícios que trabalham{' '}
                    <strong>{filtroMusculo}</strong>. Combine com padrão/nível/busca.
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* FILTROS */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, cue ou erro comum..."
            className="pl-10"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={filtroNivel === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroNivel('todos')}
          >
            Todos os níveis
          </Button>
          <Button
            variant={filtroNivel === 'iniciante' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroNivel('iniciante')}
          >
            🌱 Iniciante
          </Button>
          <Button
            variant={filtroNivel === 'intermediario' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroNivel('intermediario')}
          >
            ⚡ Intermediário
          </Button>
          <Button
            variant={filtroNivel === 'avancado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroNivel('avancado')}
          >
            🏆 Avançado
          </Button>
        </div>
      </div>

      {/* CONTAGEM */}
      <div className="text-sm text-muted-foreground">
        {exerciciosFiltrados.length} de {KETTLEBELL_EXERCICIOS.length} exercícios
        {filtroPadrao !== 'todos' && ` · Padrão: ${KETTLEBELL_PATTERNS[filtroPadrao].nome}`}
        {filtroNivel !== 'todos' && ` · Nível: ${filtroNivel}`}
        {filtroMusculo && ` · Músculo: ${filtroMusculo}`}
      </div>

      {/* GRID DE EXERCÍCIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exerciciosFiltrados.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercicio={ex}
            onClick={() => setSelecionado(ex)}
          />
        ))}

        {exerciciosFiltrados.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum exercício encontrado com esses filtros.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* DETALHE EM MODAL */}
      {selecionado && (
        <ExerciseDetailModal
          exercicio={selecionado}
          onClose={() => setSelecionado(null)}
        />
      )}
    </div>
  );
}

function ExerciseCard({ exercicio, onClick }: { exercicio: ExercicioKettlebell; onClick: () => void }) {
  const padrao = KETTLEBELL_PATTERNS[exercicio.padraoKb];
  return (
    <Card
      className="cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group overflow-hidden"
      onClick={onClick}
    >
      {exercicio.imageUrl ? (
        <div className="aspect-video bg-muted relative overflow-hidden">
          <img
            src={exercicio.imageUrl}
            alt={exercicio.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <Badge className={`${NIVEL_CORES[exercicio.nivel]} backdrop-blur-sm`}>
              {exercicio.nivel}
            </Badge>
          </div>
          <div className="absolute top-2 left-2">
            <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">
              {padrao.icone} {padrao.nome}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-slate-900 flex items-center justify-center">
          <span className="text-6xl">{padrao.icone}</span>
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-base leading-tight group-hover:text-emerald-400 transition-colors">
          {exercicio.nome}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {exercicio.descricao}
        </p>
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-emerald-400 font-medium">{exercicio.focoPrincipal}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
        {/* SPRINT 34: DICAS MUSCULARES (preview no card antes de clicar) */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <MuscleHint exerciseId={exercicio.id} variant="inline" />
        </div>
      </CardContent>
    </Card>
  );
}
