/**
 * 🏋️ Treinamento · Meu Programa · ABA: EXECUTAR (semana atual)
 *
 * Mostra a próxima sessão pendente + lista completa de pendentes da semana.
 * Permite marcar como feita rapidamente (sem abrir form) ou executar com
 * detalhes (form completo + cronômetro).
 *
 * Extraído do TreinamentoMeuPrograma.tsx em Sprint 3 (~225 linhas).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle, Trophy, Check, Play, Activity,
} from 'lucide-react';
import type { Plano, SessaoPlano } from '@/lib/geradorPlano';
import { ExerciseBadge, useExerciseModal } from '@/components/common/ExerciseBadge';
import { WorkoutFocusCard } from '@/components/common/WorkoutFocusCard';
import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';

interface ExecutarTabProps {
  plano: Plano;
  sessoesFeitas: any[];
  onExecutar: (s: SessaoPlano) => void;
  onMarcarFeita: (s: SessaoPlano) => void;
  marcando: boolean;
}

export function ExecutarTab({ plano, sessoesFeitas, onExecutar, onMarcarFeita, marcando }: ExecutarTabProps) {
  const hoje = new Date();
  const { showExercise, ModalRoot } = useExerciseModal();
  const inicioPlano = useMemo(() => {
    try {
      if (!plano.criadoEm) return new Date();
      const d = new Date(plano.criadoEm);
      if (isNaN(d.getTime())) return new Date();
      return d;
    } catch {
      return new Date();
    }
  }, [plano.criadoEm]);

  const diasPassados = Math.max(0, Math.floor((hoje.getTime() - inicioPlano.getTime()) / (1000 * 60 * 60 * 24)));
  const semanaAtual = Math.min(plano.duracaoSemanas - 1, Math.floor(diasPassados / 7));
  const isDeload = semanaAtual % 4 === 3;

  // Calcula dias desde a última sessão feita do plano
  const diasSemTreinar = useMemo(() => {
    const sessoesPlano = sessoesFeitas.filter((sf) =>
      plano.sessoes.some((ps) => ps.id === sf.planoSessaoId),
    );
    if (sessoesPlano.length === 0) return diasPassados;
    const ultima = sessoesPlano
      .map((sf) => new Date(sf.data).getTime())
      .sort((a, b) => b - a)[0];
    return Math.floor((Date.now() - ultima) / (1000 * 60 * 60 * 24));
  }, [sessoesFeitas, plano.sessoes, diasPassados]);

  // Memoiza pendentes e feitas (pra usar no banner + no return)
  const sessoesPendentesMemo = useMemo(
    () => plano.sessoes.filter((s) => s.semanaIdx === semanaAtual && !sessoesFeitas.some((sf) => sf.planoSessaoId === s.id)),
    [plano.sessoes, semanaAtual, sessoesFeitas],
  );
  const sessoesFeitasSemana = useMemo(
    () => plano.sessoes.filter((s) => s.semanaIdx === semanaAtual && sessoesFeitas.some((sf) => sf.planoSessaoId === s.id)),
    [plano.sessoes, semanaAtual, sessoesFeitas],
  );

  // Sessões de hoje e futuras desta semana que ainda não foram feitas
  // (sessões pendentes e feitas já foram memoizadas em sessoesPendentesMemo e sessoesFeitasSemana)
  const proxima = sessoesPendentesMemo[0];

  return (
    <div className="space-y-4">
      {/* BANNER: DIAS SEM TREINAR */}
      {diasSemTreinar >= 3 && sessoesFeitas.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-amber-300">
                {diasSemTreinar} dias sem treinar
              </div>
              <div className="text-xs text-muted-foreground">
                Que tal voltar hoje? Seu programa está esperando.
              </div>
            </div>
            <Button size="sm" onClick={() => onExecutar(sessoesPendentesMemo[0] || sessoesFeitasSemana[0] || plano.sessoes[semanaAtual * plano.sessoesPorSemana])}>
              <Play className="h-3 w-3 mr-1" />
              Treinar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CARD RESUMO DA SEMANA */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-400">{semanaAtual + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Você está na</div>
              <div className="font-bold text-lg">Semana {semanaAtual + 1} de {plano.duracaoSemanas}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>
                  {sessoesFeitasSemana.length}/{plano.sessoesPorSemana} feitas esta semana
                </span>
                {isDeload && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
                    🛌 Semana de deload (volume reduzido)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FOCO MUSCULAR PREVISTO (Sprint 46) */}
      {proxima && (
        <WorkoutFocusCard
          nome={proxima.nome}
          exercicios={proxima.exercicios.map((e) => ({
            id: e.id,
            nome: e.nome,
            series: e.series,
            reps: e.reps,
            carga: e.carga,
          }))}
          variant="programado"
          className="mb-2"
        />
      )}

      {/* PRÓXIMA SESSÃO EM DESTAQUE */}
      {proxima && (() => {
        // preview visual do primeiro exercício (se for do catálogo)
        const primeiroEx = proxima.exercicios[0];
        const previewEx = primeiroEx
          ? KETTLEBELL_EXERCICIOS.find((e) => e.id === primeiroEx.id) ??
            KETTLEBELL_EXERCICIOS.find((e) => e.nome === primeiroEx.nome)
          : null;
        return (
        <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500 text-white">⭐ Próxima sessão</Badge>
              <Badge variant="outline">{proxima.tipo}</Badge>
            </div>
            <CardTitle className="text-xl">{proxima.nome}</CardTitle>
            <CardDescription>{proxima.foco} · ~{proxima.duracaoMin}min</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewEx && previewEx.imageUrl && (
              <button
                type="button"
                onClick={() => showExercise(previewEx)}
                className="block w-full rounded-lg overflow-hidden border border-amber-500/30 hover:border-amber-500/60 transition-all text-left group"
              >
                <div className="relative aspect-video bg-muted">
                  <img
                    src={previewEx.imageUrl}
                    alt={previewEx.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                    <div>
                      <div className="text-xs text-amber-300 font-semibold uppercase tracking-wide">
                        ▶ Como executar (preview)
                      </div>
                      <div className="text-base font-bold text-white">{previewEx.nome}</div>
                    </div>
                  </div>
                </div>
              </button>
            )}
            <div className="bg-muted/30 rounded p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                Exercícios programados — clique para ver detalhes
              </div>
              <div className="space-y-1.5">
                {proxima.exercicios.map((ex, i) => (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-5 text-right">{i + 1}.</span>
                    <ExerciseBadge
                      id={ex.id ?? ex.nome}
                      onShow={showExercise}
                      className="flex-1 justify-start"
                    />
                    <Badge variant="outline" className="text-xs">{ex.series}×{ex.reps}</Badge>
                    <Badge variant="outline" className="text-xs">{ex.carga}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onMarcarFeita(proxima)}
                disabled={marcando}
              >
                <Check className="h-4 w-4 mr-1" />
                {marcando ? 'Salvando...' : 'Marcar como feita'}
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={() => onExecutar(proxima)}
              >
                <Play className="h-4 w-4 mr-1" />
                Executar com detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
        );
      })()}

      {/* OUTRAS SESSÕES PENDENTES */}
      {sessoesPendentesMemo.length > 1 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            📋 Restantes da semana ({sessoesPendentesMemo.length - 1})
          </h2>
          <div className="space-y-2">
            {sessoesPendentesMemo.slice(1).map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline">{s.tipo}</Badge>
                      <span className="font-medium truncate">{s.nome}</span>
                      <span className="text-xs text-muted-foreground">~{s.duracaoMin}min</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onMarcarFeita(s)} disabled={marcando}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onExecutar(s)}>
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FEITAS */}
      {sessoesFeitasSemana.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            ✓ Concluídas esta semana
          </h2>
          <div className="space-y-2">
            {sessoesFeitasSemana.map((s) => (
              <Card key={s.id} className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <Badge variant="outline">{s.tipo}</Badge>
                    <span className="flex-1 font-medium">{s.nome}</span>
                    <span className="text-xs text-muted-foreground">{s.duracaoMin}min</span>
                    <Button size="sm" variant="ghost" onClick={() => onExecutar(s)}>
                      <Activity className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ESTADO VAZIO */}
      {sessoesPendentesMemo.length === 0 && sessoesFeitasSemana.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-amber-400 mb-3" />
            <p className="text-lg font-semibold mb-1">Você está em dia! 🎉</p>
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma sessão pendente ou feita na semana atual.
            </p>
            <Button asChild variant="outline">
              <Link to="/app/treinamento/sessoes/nova">
                <Activity className="h-4 w-4 mr-1" />
                Registrar sessão livre
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {ModalRoot}
    </div>
  );
}

