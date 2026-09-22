/**
 * 🏋️ Treinamento · Meu Programa · ABA: PLANO (semana-a-semana)
 *
 * Visão completa do plano semana a semana. Mostra deload visível,
 * permite navegar por semana, e marcar/executar sessões.
 *
 * Extraído do TreinamentoMeuPrograma.tsx em Sprint 3 (~140 linhas).
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check, Play,
} from 'lucide-react';
import type { Plano, SessaoPlano } from '@/lib/geradorPlano';
import { ExerciseBadge, useExerciseModal } from '@/components/common/ExerciseBadge';

interface PlanoTabProps {
  plano: Plano;
  sessoesFeitas: any[];
  onExecutar: (s: SessaoPlano) => void;
  onMarcarFeita: (s: SessaoPlano) => void;
  marcando: boolean;
}

export function PlanoTab({ plano, sessoesFeitas, onExecutar, onMarcarFeita, marcando }: PlanoTabProps) {
  const [semanaAtual, setSemanaAtual] = useState(0);
  const { showExercise, ModalRoot } = useExerciseModal();

  // Auto-posiciona na semana atual baseado em dias
  useEffect(() => {
    const inicio = new Date(plano.criadoEm);
    const dias = Math.floor((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const sem = Math.min(plano.duracaoSemanas - 1, Math.max(0, Math.floor(dias / 7)));
    setSemanaAtual(sem);
  }, [plano.criadoEm, plano.duracaoSemanas]);

  const sessoesDaSemana = plano.sessoes.filter((s) => s.semanaIdx === semanaAtual);
  const isDeload = semanaAtual % 4 === 3;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaAtual(Math.max(0, semanaAtual - 1))}
              disabled={semanaAtual === 0}
            >
              ← Semana
            </Button>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Semana</div>
              <div className="text-2xl font-bold">{semanaAtual + 1} / {plano.duracaoSemanas}</div>
              {isDeload && (
                <Badge variant="outline" className="mt-1 text-amber-400 border-amber-500/30">
                  🛌 Deload
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaAtual(Math.min(plano.duracaoSemanas - 1, semanaAtual + 1))}
              disabled={semanaAtual === plano.duracaoSemanas - 1}
            >
              Semana →
            </Button>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: plano.duracaoSemanas }).map((_, i) => {
              const sessoesFeitasNaSemana = plano.sessoes
                .filter((s) => s.semanaIdx === i)
                .filter((s) => sessoesFeitas.some((sf) => sf.planoSessaoId === s.id)).length;
              const isAtual = i === semanaAtual;
              return (
                <button
                  key={i}
                  onClick={() => setSemanaAtual(i)}
                  className={`h-3 flex-1 rounded transition-colors ${
                    isAtual ? 'ring-2 ring-emerald-300' : ''
                  } ${
                    sessoesFeitasNaSemana > 0 ? 'bg-emerald-500' :
                    i === semanaAtual ? 'bg-emerald-700' :
                    i < semanaAtual ? 'bg-muted-foreground/30' :
                    i % 4 === 3 ? 'bg-amber-700/30' :
                    'bg-muted'
                  }`}
                  title={`Semana ${i + 1}${i % 4 === 3 ? ' (deload)' : ''} · ${sessoesFeitasNaSemana} feitas`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessoesDaSemana.map((s) => {
          const feita = sessoesFeitas.some((sf) => sf.planoSessaoId === s.id);
          const numFeitas = sessoesFeitas.filter((sf) => sf.planoSessaoId === s.id).length;
          return (
            <Card key={s.id} className={feita ? 'border-emerald-500/50 bg-emerald-500/5' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{s.tipo}</Badge>
                  <div className="flex items-center gap-1">
                    {feita && <Check className="h-4 w-4 text-emerald-400" />}
                    {numFeitas > 1 && (
                      <Badge variant="outline" className="text-xs">×{numFeitas}</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-base">{s.nome}</CardTitle>
                <CardDescription className="text-xs">{s.foco} · {s.duracaoMin}min</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-3">
                  {s.exercicios.slice(0, 4).map((ex, i) => (
                    <div key={i} className="text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <ExerciseBadge
                        id={ex.id ?? ex.nome}
                        onShow={showExercise}
                        variant="compact"
                        className="flex-1 text-xs h-auto px-1.5 py-0"
                      />
                      <span className="text-muted-foreground">{ex.series}×{ex.reps}</span>
                    </div>
                  ))}
                  {s.exercicios.length > 4 && (
                    <div className="text-xs text-muted-foreground">+{s.exercicios.length - 4} exercícios</div>
                  )}
                </div>
                <div className="flex gap-1">
                  {!feita && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onMarcarFeita(s)}
                      disabled={marcando}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {marcando ? '...' : 'Feita'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1"
                    variant={feita ? 'outline' : 'default'}
                    onClick={() => onExecutar(s)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {feita ? 'Detalhes' : 'Executar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {ModalRoot}
    </div>
  );
}
