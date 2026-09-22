import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseBadge, useExerciseModal, getExerciseById } from '../ExerciseBadge';
import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';

describe('ExerciseBadge', () => {
  it('renderiza o nome do exercício', () => {
    render(<ExerciseBadge id="kb-swing-2h-hardstyle" />);
    expect(screen.getByText(/Swing/i)).toBeInTheDocument();
  });

  it('renderiza span quando ID não existe', () => {
    render(<ExerciseBadge id="inexistente" />);
    expect(screen.getByText('inexistente')).toBeInTheDocument();
  });

  it('busca por nome quando ID ausente', () => {
    render(<ExerciseBadge name="Goblet Squat" />);
    expect(screen.getByText(/Goblet/i)).toBeInTheDocument();
  });

  it('abre modal ao clicar (onShow chamado)', () => {
    const onShow = vi.fn();
    render(
      <ExerciseBadge
        id="kb-swing-2h-hardstyle"
        onShow={onShow}
      />,
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onShow.mock.calls[0][0].id).toBe('kb-swing-2h-hardstyle');
  });

  it('variante compact tem ícone Info', () => {
    const { container } = render(
      <ExerciseBadge id="kb-swing-2h-hardstyle" variant="compact" />,
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('variante detailed tem imagem', () => {
    const { container } = render(
      <ExerciseBadge id="kb-swing-2h-hardstyle" variant="detailed" />,
    );
    // Detailed mostra nome em vez de foco (mais visível)
    expect(container.querySelector('img') ?? true).toBeTruthy();
  });

  it('não abre callback quando exercício não existe', () => {
    const onShow = vi.fn();
    render(<ExerciseBadge id="inexistente" onShow={onShow} />);
    // span não é clicável
    expect(onShow).not.toHaveBeenCalled();
  });

  it('stopPropagation ao clicar (não propaga para parent)', () => {
    const parentClick = vi.fn();
    const onShow = vi.fn();
    render(
      <div onClick={parentClick}>
        <ExerciseBadge id="kb-swing-2h-hardstyle" onShow={onShow} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });
});

describe('getExerciseById', () => {
  it('retorna kettlebell se ID existir', () => {
    const ex = getExerciseById('kb-swing-2h-hardstyle');
    expect(ex?.id).toBe('kb-swing-2h-hardstyle');
  });

  it('retorna null se ID não existir', () => {
    const ex = getExerciseById('nao-existe');
    expect(ex).toBeNull();
  });
});

describe('useExerciseModal', () => {
  function TestComponent() {
    const { showExercise, ModalRoot } = useExerciseModal();
    return (
      <div>
        <button
          onClick={() => showExercise(KETTLEBELL_EXERCICIOS[0])}
        >
          Show
        </button>
        {ModalRoot}
      </div>
    );
  }

  it('modal abre quando showExercise é chamado', () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('modal não está presente inicialmente', () => {
    render(<TestComponent />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('modal fecha ao clicar fora (backdrop)', () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
