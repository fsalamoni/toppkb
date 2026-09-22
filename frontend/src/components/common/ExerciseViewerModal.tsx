/**
 * ExerciseViewerModal — Wrapper que combina ExerciseDetailModal + PracticeMode.
 * Tem 2 modos: 'details' (modal padrão) e 'practice' (full-screen guiado).
 */
import { useState } from 'react';
import type { ExercicioKettlebell } from '@/data/seed/exercicios-kettlebell';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { PracticeMode } from './PracticeMode';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface ExerciseViewerModalProps {
  exercicio: ExercicioKettlebell | null;
  onClose: () => void;
}

type Mode = 'details' | 'practice';

export function ExerciseViewerModal({ exercicio, onClose }: ExerciseViewerModalProps) {
  const [mode, setMode] = useState<Mode>('details');

  if (!exercicio) return null;

  // Se PracticeMode ativo, renderiza full-screen
  if (mode === 'practice') {
    return <PracticeMode exercicio={exercicio} onClose={() => setMode('details')} />;
  }

  // Senão, renderiza DetailModal com botão extra "Praticar"
  return (
    <div className="relative">
      <ExerciseDetailModal exercicio={exercicio} onClose={onClose} />
    </div>
  );
}

/**
 * Componente independente "PracticeLauncher" — botão para abrir PracticeMode.
 */
interface PracticeLauncherProps {
  exercicio: ExercicioKettlebell;
  variant?: 'button' | 'icon';
}

export function PracticeLauncher({ exercicio, variant = 'button' }: PracticeLauncherProps) {
  const [open, setOpen] = useState(false);

  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 rounded-md hover:bg-emerald-500/10 text-emerald-400"
          aria-label="Praticar passo a passo"
          title="Praticar passo a passo"
        >
          <Play className="h-4 w-4" />
        </button>
        {open && <PracticeMode exercicio={exercicio} onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="default"
        className="w-full bg-emerald-500 hover:bg-emerald-600"
        disabled={!exercicio.steps || exercicio.steps.length === 0}
      >
        <Play className="h-4 w-4 mr-1" />
        Praticar passo a passo ({exercicio.steps?.length ?? 0} etapas)
      </Button>
      {open && <PracticeMode exercicio={exercicio} onClose={() => setOpen(false)} />}
    </>
  );
}
