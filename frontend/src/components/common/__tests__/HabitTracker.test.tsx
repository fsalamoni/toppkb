/**
 * Testes do HabitTracker — grid de hábitos diários
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HabitTracker, type Habit } from '../HabitTracker';

const habits: Habit[] = [
  { id: 'h1', label: 'Hidratação', color: 'cyan' },
  { id: 'h2', label: 'Sono 7h+', color: 'indigo' },
];

const completed = {
  h1: { 0: true, 1: true, 6: false },
  h2: { 0: false, 1: true },
};

describe('HabitTracker', () => {
  it('renderiza header com dias da semana', () => {
    render(<HabitTracker habits={habits} completed={completed} days={7} />);
    // Devem ter 7 colunas de dias
    expect(screen.getByText('Hábito')).toBeTruthy();
  });

  it('mostra label de cada hábito', () => {
    render(<HabitTracker habits={habits} completed={completed} />);
    expect(screen.getByText('Hidratação')).toBeTruthy();
    expect(screen.getByText('Sono 7h+')).toBeTruthy();
  });

  it('mostra check em dia completo', () => {
    const { container } = render(<HabitTracker habits={habits} completed={completed} />);
    const checked = container.querySelectorAll('[aria-pressed="true"]');
    expect(checked.length).toBeGreaterThan(0);
  });

  it('calcula % de aderência', () => {
    render(<HabitTracker habits={habits} completed={completed} days={7} />);
    // h1: 2 de 7 = 29%, h2: 1 de 7 = 14%
    expect(screen.getByText('29%')).toBeTruthy();
    expect(screen.getByText('14%')).toBeTruthy();
  });

  it('click toggle estado', () => {
    const onToggle = vi.fn();
    render(
      <HabitTracker
        habits={habits}
        completed={completed}
        editable
        onToggle={onToggle}
      />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onToggle).toHaveBeenCalled();
  });

  it('readonly bloqueia click', () => {
    const onToggle = vi.fn();
    render(
      <HabitTracker
        habits={habits}
        completed={completed}
        editable={false}
        onToggle={onToggle}
      />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('marca hoje com aria-current', () => {
    render(<HabitTracker habits={habits} completed={completed} />);
    // Pelo menos um dia deve ter aria-current="date"
    const el = document.querySelector('[aria-current="date"]');
    expect(el).toBeTruthy();
  });

  it('aria-label descritivo em cada célula', () => {
    render(<HabitTracker habits={habits} completed={completed} />);
    // Deve ter pelo menos um botão com aria-label mencionando Hidratação
    const allLabels = Array.from(document.querySelectorAll('[aria-label]'))
      .map((el) => el.getAttribute('aria-label'))
      .filter((l) => l?.includes('Hidratação'));
    expect(allLabels.length).toBeGreaterThan(0);
  });
});
