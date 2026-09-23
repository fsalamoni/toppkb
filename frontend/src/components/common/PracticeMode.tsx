/**
 * PracticeMode — Modal full-screen para praticar o exercício passo a passo.
 * Mostra 1 step por vez com avatar grande + dica muscular.
 */
import * as LucideIcons from 'lucide-react';
const {
  ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw,
  Check, Activity, Sparkles, AlertTriangle, Clock,
} = LucideIcons;

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ExercicioKettlebell } from '@/data/seed/exercicios-kettlebell';
import { ExerciseAvatar } from './ExerciseAvatar';

interface PracticeModeProps {
  exercicio: ExercicioKettlebell;
  onClose: () => void;
}

export function PracticeMode({ exercicio, onClose }: PracticeModeProps) {
  const steps = exercicio.steps ?? [];
  const [stepIdx, setStepIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStep = steps[stepIdx];

  // Cronômetro
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Reset cronômetro ao mudar de step
  useEffect(() => {
    setSecondsElapsed(0);
    setRunning(false);
  }, [stepIdx]);

  const goNext = useCallback(() => {
    if (currentStep) setCompletedSteps((s) => new Set(s).add(currentStep.numero));
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }, [currentStep, steps.length]);

  const goPrev = useCallback(() => {
    setStepIdx((i) => Math.max(i - 1, 0));
  }, []);

  // Tecla ESC fecha, setas navegam
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); setRunning((r) => !r); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  if (!currentStep) onClose();

  const progressPct = ((stepIdx + 1) / steps.length) * 100;
  const targetDuration = currentStep.duracaoSeg ?? 30;
  const timerPct = Math.min((secondsElapsed / targetDuration) * 100, 100);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Modo prática: ${exercicio.nome}`}
    >
      {/* HEADER */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30">
        <div>
          <h2 className="text-lg font-bold text-white">{exercicio.nome}</h2>
          <p className="text-xs text-muted-foreground">
            Modo prática · Etapa {stepIdx + 1} de {steps.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md hover:bg-muted text-white"
          aria-label="Sair do modo prática (ESC)"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* PROGRESS BAR */}
      <div className="h-1 bg-muted relative">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ESQUERDA: AVATAR GRANDE */}
        <section className="flex-1 flex items-center justify-center bg-slate-950 p-6">
          <ExerciseAvatar
            exerciseId={exercicio.id}
            stepNum={currentStep.numero}
            size="lg"
            className="max-h-full"
          />
        </section>

        {/* DIREITA: STEP INFO */}
        <section className="flex-1 flex flex-col p-6 overflow-y-auto bg-card/50">
          {/* TÍTULO */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
              <span className="font-mono font-bold">#{currentStep.numero}</span>
              <span>de {steps.length}</span>
              {completedSteps.has(currentStep.numero) && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">✓ Feito</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white">{currentStep.titulo}</h3>
          </div>

          {/* CRONÔMETRO */}
          {targetDuration > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <Clock className="h-4 w-4" />
                <span>{secondsElapsed}s / {targetDuration}s</span>
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => setRunning((r) => !r)}
                    className="p-1.5 rounded-md hover:bg-muted"
                    aria-label={running ? 'Pausar' : 'Iniciar'}
                  >
                    {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondsElapsed(0)}
                    className="p-1.5 rounded-md hover:bg-muted"
                    aria-label="Resetar"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    timerPct >= 100 ? 'bg-emerald-500' : 'bg-emerald-400/60',
                  )}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            </div>
          )}

          {/* DESCRIÇÃO */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">O que fazer</h4>
            <p className="text-sm leading-relaxed text-white">{currentStep.descricao}</p>
          </div>

          {/* CUES TÉCNICOS */}
          {currentStep.cues && currentStep.cues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">🎯 Cues técnicos</h4>
              <div className="flex flex-wrap gap-1.5">
                {currentStep.cues.map((c, i) => (
                  <span key={i} className="inline-block text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    "{c}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ONDE SENTIR */}
          {currentStep.sensacoes && currentStep.sensacoes.length > 0 && (
            <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <h4 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                💪 Onde e como sentir
              </h4>
              <ul className="space-y-1">
                {currentStep.sensacoes.map((s, i) => (
                  <li key={i} className="text-xs text-blue-200 leading-snug">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ALERTAS MUSCULARES */}
          {currentStep.alertasMusculares && currentStep.alertasMusculares.length > 0 && (
            <details className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <summary className="text-xs font-semibold text-amber-400 cursor-pointer flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                ⚠️ Atenção muscular ({currentStep.alertasMusculares.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {currentStep.alertasMusculares.map((a, i) => (
                  <li key={i} className="text-xs text-amber-200 leading-snug">⚠ {a}</li>
                ))}
              </ul>
            </details>
          )}

          {/* DICA MUSCULAR PRINCIPAL (sensação) */}
          {exercicio.sensacaoPrincipal && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <h4 className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                ✨ Sensação geral
              </h4>
              <p className="text-xs text-emerald-100 leading-snug">{exercicio.sensacaoPrincipal}</p>
            </div>
          )}

          {/* ERRO MUSCULAR (sintoma → causa) — Sprint 65.6 */}
          {exercicio.erroMuscular && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <h4 className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                🩺 Se algo doer / falhar
              </h4>
              <p className="text-xs text-red-100 leading-snug">{exercicio.erroMuscular}</p>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER: NAVEGAÇÃO */}
      <footer className="flex items-center justify-between p-4 border-t border-border/50 bg-card/30">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIdx === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-md border border-border hover:bg-muted text-white text-sm disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {steps.map((s, i) => (
            <button
              key={s.numero}
              type="button"
              onClick={() => setStepIdx(i)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                i === stepIdx && 'bg-emerald-400 w-6',
                i !== stepIdx && completedSteps.has(s.numero) && 'bg-emerald-700',
                i !== stepIdx && !completedSteps.has(s.numero) && 'bg-muted',
              )}
              aria-label={`Ir para etapa ${i + 1}`}
            />
          ))}
        </div>

        {stepIdx === steps.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (currentStep) setCompletedSteps((s) => new Set(s).add(currentStep.numero));
              setTimeout(onClose, 300);
            }}
            className="flex items-center gap-1 px-4 py-2 rounded-md bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"
          >
            <Check className="h-4 w-4" />
            Concluir
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1 px-4 py-2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-sm hover:bg-emerald-500/30"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </footer>
    </div>
  );
}
