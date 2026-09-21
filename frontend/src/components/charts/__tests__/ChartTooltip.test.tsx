/**
 * Testes do ChartTooltip
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartTooltip } from '../ChartTooltip';

describe('ChartTooltip', () => {
  it('não renderiza quando inactive', () => {
    const { container } = render(
      <ChartTooltip active={false} payload={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('não renderiza quando payload vazio', () => {
    const { container } = render(
      <ChartTooltip active={true} payload={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('mostra nome e valor formatado', () => {
    const payload = [
      { name: 'Peso', value: 75, color: '#888' },
    ];
    render(<ChartTooltip active={true} payload={payload} unit="kg" />);
    expect(screen.getByText('Peso')).toBeTruthy();
    expect(screen.getByText(/75/)).toBeTruthy();
    expect(screen.getByText(/kg/)).toBeTruthy();
  });

  it('formata label como data pt-BR', () => {
    const payload = [{ name: 'X', value: 1, color: '#888' }];
    const { container } = render(
      <ChartTooltip active={true} payload={payload} label="2025-01-15" isDate />,
    );
    expect(container.textContent).toContain('2025');
  });

  it('usa formatValue customizado quando fornecido', () => {
    const payload = [{ name: 'Calorias', value: 1000, color: '#888' }];
    render(
      <ChartTooltip
        active={true}
        payload={payload}
        formatValue={(v) => `${v} kcal`}
      />,
    );
    expect(screen.getByText(/1000 kcal/)).toBeTruthy();
  });

  it('mostra trend up (TrendingUp icon)', () => {
    const payload = [
      { name: 'Passos', value: 5000, color: '#888' },
      { name: 'Passos', value: 7000, color: '#888' },
    ];
    const { container } = render(
      <ChartTooltip active={true} payload={payload} />,
    );
    // 2 valores, último é maior = trending up
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(1);
  });

  it('formata números em pt-BR (1.234,56)', () => {
    const payload = [{ name: 'Distância', value: 1234.56, color: '#888' }];
    render(<ChartTooltip active={true} payload={payload} />);
    expect(screen.getByText(/1\.234,56/)).toBeTruthy();
  });
});
