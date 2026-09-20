import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronRight, X, BookOpen, Activity, Flame,
  Heart, Brain,
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

const NIVEL_CORES: Record<string, string> = {
  iniciante: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  intermediario: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  avancado: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export function Exercicios() {
  const [busca, setBusca] = useState('');
  const [filtroPadrao, setFiltroPadrao] = useState<PadraoKettlebell | 'todos'>('todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [selecionado, setSelecionado] = useState<ExercicioKettlebell | null>(null);

  const exerciciosFiltrados = useMemo(() => {
    const buscaLower = busca.toLowerCase();
    return KETTLEBELL_EXERCICIOS.filter((ex) => {
      const matchBusca = !busca ||
        ex.nome.toLowerCase().includes(buscaLower) ||
        ex.descricao.toLowerCase().includes(buscaLower) ||
        ex.cues?.some((c) => c.toLowerCase().includes(buscaLower)) ||
        ex.errors?.some((e) => e.toLowerCase().includes(buscaLower));
      const matchPadrao = filtroPadrao === 'todos' || ex.padraoKb === filtroPadrao;
      const matchNivel = filtroNivel === 'todos' || ex.nivel === filtroNivel;
      return matchBusca && matchPadrao && matchNivel;
    });
  }, [busca, filtroPadrao, filtroNivel]);

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
        <ExerciseDetail
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
      </CardContent>
    </Card>
  );
}

function ExerciseDetail({ exercicio, onClose }: { exercicio: ExercicioKettlebell; onClose: () => void }) {
  const padrao = KETTLEBELL_PATTERNS[exercicio.padraoKb];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER COM VÍDEO */}
        {exercicio.videoUrl ? (
          <div className="aspect-video bg-black relative">
            <video
              src={exercicio.videoUrl}
              controls
              className="w-full h-full"
              poster={exercicio.thumbnailUrl || exercicio.imageUrl}
            />
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-emerald-500/30 to-slate-900 flex items-center justify-center relative">
            <span className="text-8xl">{padrao.icone}</span>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* TÍTULO + BADGES */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${NIVEL_CORES[exercicio.nivel]}`}>
                {exercicio.nivel}
              </Badge>
              <Badge className="bg-card text-foreground border border-border">
                {padrao.icone} {padrao.nome}
              </Badge>
              <Badge variant="outline">
                🎯 {exercicio.equipamento}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold">{exercicio.nome}</h2>
            <p className="text-sm text-emerald-400 mt-1">
              Foco: {exercicio.focoPrincipal}
            </p>
            {exercicio.musculosSecundarios.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Auxiliares: {exercicio.musculosSecundarios.join(', ')}
              </p>
            )}
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-1">
              Descrição
            </h3>
            <p className="text-sm leading-relaxed">{exercicio.descricao}</p>
          </div>

          {/* CUES */}
          {exercicio.cues && exercicio.cues.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                💬 Cues Técnicos
              </h3>
              <div className="flex flex-wrap gap-2">
                {exercicio.cues.map((cue, i) => (
                  <Badge key={i} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    "{cue}"
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* DICAS (do schema original) */}
          {exercicio.dicas && exercicio.dicas.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                ✅ Dicas
              </h3>
              <ul className="space-y-1 text-sm">
                {exercicio.dicas.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-400">→</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ERROS COMUNS */}
          {exercicio.errors && exercicio.errors.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                ❌ Erros Comuns
              </h3>
              <ul className="space-y-1 text-sm">
                {exercicio.errors.map((e, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-rose-400">✗</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ALERTA 50+ */}
          {exercicio.alerta50mais && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <h3 className="font-semibold text-sm text-amber-400 mb-1 flex items-center gap-1">
                <Heart className="h-4 w-4" />
                Atenção 50+
              </h3>
              <p className="text-sm">{exercicio.alerta50mais}</p>
            </div>
          )}

          {/* CONTRAINDICAÇÕES */}
          {exercicio.contraIndicacoes && exercicio.contraIndicacoes.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                🚫 Contraindicações
              </h3>
              <ul className="space-y-1 text-sm">
                {exercicio.contraIndicacoes.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-rose-400">⚠</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* EVIDÊNCIA CIENTÍFICA */}
          {exercicio.evidencia && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <h3 className="font-semibold text-sm text-blue-400 mb-1 flex items-center gap-1">
                <Brain className="h-4 w-4" />
                Evidência Científica
              </h3>
              <p className="text-sm">{exercicio.evidencia}</p>
              {exercicio.referencias && exercicio.referencias.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Refs: {exercicio.referencias.join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/app/preparacao/nova" state={{ exercicioSelecionado: exercicio.id }}>
                <Flame className="h-4 w-4 mr-1" />
                Usar em Sessão
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/app/periodizacao">
                <Activity className="h-4 w-4 mr-1" />
                Ver Periodização
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
