/**
 * ExerciseStepAnimator — Componente que renderiza avatar SVG animado (SMIL)
 * como prévia de cada step de um exercício.
 *
 * Mostra:
 * - Stick figure em pose específica do step
 * - Animação SMIL (loop 5-8s): pose A → B → A
 * - Indicação visual de músculo trabalhando
 * - Cues em destaque
 *
 * Pode ser usado:
 * - Dentro do ExerciseDetailModal (abaixo do vídeo)
 * - Em PracticeMode (alternativa ao avatar estático)
 * - Como thumbnail animada no card
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExercicioKettlebell } from '@/data/seed/exercicios-kettlebell';

interface ExerciseStepAnimatorProps {
  exercicio: ExercicioKettlebell;
  /** Step inicial (default: 1) */
  initialStep?: number;
  className?: string;
}

export function ExerciseStepAnimator({
  exercicio,
  initialStep = 1,
  className,
}: ExerciseStepAnimatorProps) {
  const steps = exercicio.steps ?? [];
  const [stepIdx, setStepIdx] = useState(Math.max(0, initialStep - 1));
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (steps.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Sem steps animados para exibir.
      </div>
    );
  }

  const currentStep = steps[stepIdx];
  const totalSteps = steps.length;

  // URL do SVG animado gerado pelo scripts/gen_step_animations.py
  const animSvgUrl = `/kettlebell/step-anim/${exercicio.id}-step-${currentStep.numero}.svg`;

  const goNext = () => {
    setCompletedSteps((s) => new Set(s).add(currentStep.numero));
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  };

  const goPrev = () => {
    setStepIdx((i) => Math.max(i - 1, 0));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header com label do step */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            'font-mono font-bold text-lg',
            'text-blue-400'
          )}
        >
          #{currentStep.numero}
        </span>
        <span className="text-muted-foreground">de {totalSteps}</span>
        {completedSteps.has(currentStep.numero) && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
            ✓ Feito
          </span>
        )}
      </div>

      {/* Avatar SVG animado (SMIL — loop nativo) */}
      <div
        className={cn(
          'relative rounded-lg overflow-hidden border border-border',
          'bg-slate-950'
        )}
      >
        <img
          src={animSvgUrl}
          alt={`Animação do passo ${currentStep.numero}: ${currentStep.titulo}`}
          className="w-full h-auto block"
          loading="lazy"
        />
        {/* Hint: clicou para abrir tamanho real */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
          ANIMADO
        </div>
      </div>

      {/* Título do step */}
      <h3 className="text-base font-bold text-white">
        {currentStep.titulo}
      </h3>

      {/* Descrição do step */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {currentStep.descricao}
      </p>

      {/* Cues técnicos */}
      {currentStep.cues && currentStep.cues.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            ▸ Cues técnicos
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentStep.cues.map((c, i) => (
              <span
                key={i}
                className="inline-block text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              >
                "{c}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Onde e como sentir (sensações) */}
      {currentStep.sensacoes && currentStep.sensacoes.length > 0 && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-1">
          <div className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
            💪 Onde e como sentir
          </div>
          <ul className="space-y-1">
            {currentStep.sensacoes.map((s, i) => (
              <li key={i} className="text-xs text-blue-200 leading-snug">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alertas musculares (sempre visível, não em details) */}
      {currentStep.alertasMusculares && currentStep.alertasMusculares.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
          <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
            ⚠️ Atenção
          </div>
          <ul className="space-y-1">
            {currentStep.alertasMusculares.map((a, i) => (
              <li key={i} className="text-xs text-amber-200 leading-snug">
                ⚠ {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navegação entre steps */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIdx === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-muted text-white text-xs disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" />
          Anterior
        </button>

        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <button
              key={s.numero}
              type="button"
              onClick={() => setStepIdx(i)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                i === stepIdx && 'bg-blue-400 w-6',
                i !== stepIdx && completedSteps.has(s.numero) && 'bg-emerald-700',
                i !== stepIdx && !completedSteps.has(s.numero) && 'bg-muted'
              )}
              aria-label={`Ir para etapa ${i + 1}`}
            />
          ))}
        </div>

        {stepIdx === steps.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              setCompletedSteps((s) => new Set(s).add(currentStep.numero));
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600"
          >
            <Check className="h-3 w-3" />
            Concluir
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs hover:bg-blue-500/30"
          >
            Próximo
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Rodapé com dica do músculo */}
      <div className="text-xs text-muted-foreground italic pt-1 border-t border-border/30">
        ⚙️ Cada avatar é uma animação SMIL que roda em loop no browser (sem precisar de MP4).
        Para vídeo mais detalhado, abra o vídeo MP4 acima.
      </div>
    </div>
  );
}
