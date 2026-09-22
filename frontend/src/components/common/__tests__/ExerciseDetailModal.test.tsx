import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseDetailModal } from '../ExerciseDetailModal';
import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';

const enrichedExercise = KETTLEBELL_EXERCICIOS.find(
  (ex) => ex.id === 'kb-swing-2h-hardstyle',
)!;

describe('ExerciseDetailModal', () => {
  it('não renderiza nada se exercicio for null', () => {
    const { container } = render(
      <ExerciseDetailModal exercicio={null} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza título do exercício', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renderiza descrição', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Movimento balístico/i)).toBeInTheDocument();
  });

  it('renderiza badges de nível/padrão', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    // Nível: avancado; padraoKb: HINGE
    const allTexts = screen.getAllByText(/\b(avancado|HINGE)\b/i);
    expect(allTexts.length).toBeGreaterThanOrEqual(2);
  });

  it('renderiza cues técnicos', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    // Snap glúteo aparece em cues E em passos — ao menos uma vez
    const allTexts = screen.getAllByText(/Snap glúteo/i);
    expect(allTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza erros comuns', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    // Errors são renderizados dentro de uma lista
    const errorsList = screen.getByText(/Erros Comuns/i);
    expect(errorsList).toBeInTheDocument();
  });

  it('renderiza alerta 50+', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Atenção 50\+/i)).toBeInTheDocument();
  });

  it('renderiza seção de evidência científica', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Evidência Científica/i)).toBeInTheDocument();
  });

  it('renderiza fontes externas como links', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    const strongFirstLink = screen.getAllByRole('link').find(
      (link) => (link as HTMLAnchorElement).href.includes('strongfirst'),
    );
    expect(strongFirstLink).toBeTruthy();
  });

  it('renderiza passos numerados quando steps estão presentes', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Passo a Passo/i)).toBeInTheDocument();
    // Steps são list items com numero prefixo
    expect(screen.getByText(/#1/i)).toBeInTheDocument();
  });

  it('chama onClose ao clicar fora (backdrop)', () => {
    const onClose = vi.fn();
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={onClose}
      />,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('NÃO chama onClose ao clicar dentro do modal (stopPropagation)', () => {
    const onClose = vi.fn();
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={onClose}
      />,
    );
    const title = screen.getByRole('heading', { level: 2 });
    fireEvent.click(title);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('tem role=dialog e aria-modal=true', () => {
    render(
      <ExerciseDetailModal
        exercicio={enrichedExercise}
        onClose={() => {}}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });
});

describe('ExerciseDetailModal - exercício sem enriquecer', () => {
  const basicExercise = KETTLEBELL_EXERCICIOS.find(
    (ex) => ex.id === 'kb-figure-8',
  )!;

  it('renderiza mesmo sem steps/gallery', () => {
    render(
      <ExerciseDetailModal
        exercicio={basicExercise}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
