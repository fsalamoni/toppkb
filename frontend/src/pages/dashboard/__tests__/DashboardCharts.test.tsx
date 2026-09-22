/**
 * Testes do DashboardCharts — gráficos de evolução
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardCharts } from '../DashboardCharts';

// Mock do SparklineChart e MiniBarChart (evita dependência de svg)
vi.mock('@/components/charts/SparklineChart', () => ({
  SparklineChart: ({ data }: any) => (
    <div data-testid="sparkline" data-points={data.length}>
      Chart
    </div>
  ),
  MiniBarChart: ({ data }: any) => (
    <div data-testid="minibar">
      V{data.v} D{data.d} E{data.e}
    </div>
  ),
}));

describe('DashboardCharts', () => {
  const emptyCharts = {
    pesoHistorico: [],
    sonoHistorico: [],
    vitoriaDerrota30d: { v: 0, d: 0, e: 0 },
    sonoMedio: null,
  };

  it('mostra empty states quando não há dados', () => {
    render(
      <MemoryRouter>
        <DashboardCharts {...emptyCharts} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Sem pesagens ainda/)).toBeInTheDocument();
    expect(screen.getByText(/Sem registros ainda/)).toBeInTheDocument();
  });

  it('renderiza SparklineChart com peso histórico', () => {
    render(
      <MemoryRouter>
        <DashboardCharts
          pesoHistorico={[
            { date: '2026-01-01', value: 80 },
            { date: '2026-01-15', value: 79 },
            { date: '2026-02-01', value: 78 },
          ]}
          sonoHistorico={[]}
          vitoriaDerrota30d={{ v: 0, d: 0, e: 0 }}
          sonoMedio={null}
        />
      </MemoryRouter>
    );

    const sparklines = screen.getAllByTestId('sparkline');
    expect(sparklines.length).toBeGreaterThanOrEqual(1);
    expect(sparklines[0]).toHaveAttribute('data-points', '3');
  });

  it('renderiza SparklineChart com sono histórico', () => {
    render(
      <MemoryRouter>
        <DashboardCharts
          pesoHistorico={[]}
          sonoHistorico={[
            { date: '2026-09-15', value: 7 },
            { date: '2026-09-16', value: 8 },
            { date: '2026-09-17', value: 7.5 },
          ]}
          vitoriaDerrota30d={{ v: 0, d: 0, e: 0 }}
          sonoMedio={7.5}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Meta: 7-9h/)).toBeInTheDocument();
    expect(screen.getByText(/Atual: 7.5h/)).toBeInTheDocument();
  });

  it('mostra stats mínimas e maximas do peso', () => {
    render(
      <MemoryRouter>
        <DashboardCharts
          pesoHistorico={[
            { date: '2026-01-01', value: 78 },
            { date: '2026-01-15', value: 80 },
            { date: '2026-02-01', value: 79 },
          ]}
          sonoHistorico={[]}
          vitoriaDerrota30d={{ v: 0, d: 0, e: 0 }}
          sonoMedio={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Min: 78/)).toBeInTheDocument();
    expect(screen.getByText(/Max: 80/)).toBeInTheDocument();
  });

  it('renderiza MiniBarChart com V/D/E', () => {
    render(
      <MemoryRouter>
        <DashboardCharts
          pesoHistorico={[]}
          sonoHistorico={[]}
          vitoriaDerrota30d={{ v: 8, d: 3, e: 1 }}
          sonoMedio={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('minibar')).toBeInTheDocument();
    expect(screen.getByText(/12 partidas/)).toBeInTheDocument();
  });

  it('singular quando há só 1 partida', () => {
    render(
      <MemoryRouter>
        <DashboardCharts
          pesoHistorico={[]}
          sonoHistorico={[]}
          vitoriaDerrota30d={{ v: 1, d: 0, e: 0 }}
          sonoMedio={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/1 partida/)).toBeInTheDocument();
  });
});
