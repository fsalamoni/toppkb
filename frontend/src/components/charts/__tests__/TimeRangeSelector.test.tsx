/**
 * Testes do ChartTooltip e TimeRangeSelector
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeRangeSelector, getStartDate, type TimeRange } from '../TimeRangeSelector';

describe('TimeRangeSelector', () => {
  it('renderiza todas as 5 opções', () => {
    render(<TimeRangeSelector value="30d" onChange={() => {}} />);
    expect(screen.getByText('7 dias')).toBeTruthy();
    expect(screen.getByText('30 dias')).toBeTruthy();
    expect(screen.getByText('90 dias')).toBeTruthy();
    expect(screen.getByText('1 ano')).toBeTruthy();
    expect(screen.getByText('Tudo')).toBeTruthy();
  });

  it('marca option ativa com aria-checked', () => {
    render(<TimeRangeSelector value="30d" onChange={() => {}} />);
    const active = screen.getByRole('radio', { name: '30 dias' });
    expect(active.getAttribute('aria-checked')).toBe('true');
  });

  it('chama onChange ao clicar', () => {
    let called: TimeRange | null = null;
    render(<TimeRangeSelector value="30d" onChange={(v) => (called = v)} />);
    fireEvent.click(screen.getByText('90 dias'));
    expect(called).toBe('90d');
  });
});

describe('getStartDate', () => {
  const reference = new Date('2025-01-15T10:00:00');

  it('retorna 7 dias atrás', () => {
    const date = getStartDate('7d', reference);
    expect(date?.toISOString().slice(0, 10)).toBe('2025-01-08');
  });

  it('retorna 30 dias atrás', () => {
    const date = getStartDate('30d', reference);
    expect(date?.toISOString().slice(0, 10)).toBe('2024-12-16');
  });

  it('retorna 90 dias atrás', () => {
    const date = getStartDate('90d', reference);
    expect(date?.toISOString().slice(0, 10)).toBe('2024-10-17');
  });

  it('retorna 1 ano atrás', () => {
    const date = getStartDate('1y', reference);
    expect(date?.toISOString().slice(0, 10)).toBe('2024-01-15');
  });

  it('retorna null para all', () => {
    expect(getStartDate('all', reference)).toBeNull();
  });
});
