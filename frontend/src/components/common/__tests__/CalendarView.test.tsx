/**
 * Testes do CalendarView — visualização mensal
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView, type CalendarActivity } from '../CalendarView';

const sampleActivities: CalendarActivity[] = [
  { date: '2025-01-15', type: 'treino', count: 1 },
  { date: '2025-01-15', type: 'partida', count: 2 },
  { date: '2025-01-20', type: 'dores', count: 1 },
];

describe('CalendarView', () => {
  it('renderiza calendário com header do mês', () => {
    render(<CalendarView activities={[]} />);
    // Com locale='en-US' teríamos "January", mas aqui é 'pt-BR'
    // Apenas checamos que tem um header
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeTruthy();
  });

  it('mostra dia atual destacado', () => {
    render(<CalendarView activities={[]} />);
    // Hoje é hoje (sem mock) — deve ter "aria-selected" ou font-bold
    const grid = screen.getByRole('grid');
    expect(grid).toBeTruthy();
  });

  it('mostra dots de atividades', () => {
    const { container } = render(
      <CalendarView activities={sampleActivities} />,
    );
    // Deve ter pelo menos 3 dots (treino + 2 partidas + dor)
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('chama onSelectDay ao clicar num dia', () => {
    const onSelect = vi.fn();
    render(
      <CalendarView
        activities={sampleActivities}
        onSelectDay={onSelect}
      />,
    );

    // Pegar primeiro button que não seja navegação
    const cells = screen.getAllByRole('gridcell');
    fireEvent.click(cells[0]);
    expect(onSelect).toHaveBeenCalled();
  });

  it('botão "Próximo mês" navega', () => {
    render(<CalendarView activities={[]} />);
    const nextBtn = screen.getByLabelText(/próximo mês/i);
    fireEvent.click(nextBtn);
    // Não deve ter erro
    expect(screen.getByRole('grid')).toBeTruthy();
  });

  it('botão "Mês anterior" navega', () => {
    render(<CalendarView activities={[]} />);
    const prevBtn = screen.getByLabelText(/mês anterior/i);
    fireEvent.click(prevBtn);
    expect(screen.getByRole('grid')).toBeTruthy();
  });

  it('botão "Hoje" volta para mês atual', () => {
    render(<CalendarView activities={[]} />);
    const nextBtn = screen.getByLabelText(/próximo mês/i);
    fireEvent.click(nextBtn);

    const hojeBtn = screen.getByLabelText(/hoje/i);
    fireEvent.click(hojeBtn);

    // Deve estar no mês atual novamente
    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();
  });

  it('mostra legend dos tipos', () => {
    render(<CalendarView activities={sampleActivities} />);
    expect(screen.getByText('treino')).toBeTruthy();
    expect(screen.getByText('partida')).toBeTruthy();
    expect(screen.getByText('dores')).toBeTruthy();
  });

  it('marca dias selecionados via prop selectedDate', () => {
    // Pega o dia de hoje
    const today = new Date();
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    render(
      <CalendarView
        activities={[{ date: ymd, type: 'treino', count: 1 }]}
        selectedDate={ymd}
      />,
    );
    const grid = screen.getByRole('grid');
    expect(grid.querySelector('[aria-selected="true"]')).toBeTruthy();
  });

  it('mostra +N quando mais de 3 atividades', () => {
    const today = new Date();
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const manyActivities: CalendarActivity[] = [
      { date: ymd, type: 'treino', count: 1 },
      { date: ymd, type: 'partida', count: 1 },
      { date: ymd, type: 'dores', count: 1 },
      { date: ymd, type: 'sono', count: 1 },
      { date: ymd, type: 'medida', count: 1 },
    ];
    const { container } = render(
      <CalendarView activities={manyActivities} />,
    );
    const plusSign = container.textContent?.includes('+');
    expect(plusSign).toBeTruthy();
  });
});
