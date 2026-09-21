/**
 * Testes do DashboardAlerts — alertas contextuais
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardAlerts } from '../DashboardAlerts';

describe('DashboardAlerts', () => {
  it('não renderiza nada sem dados', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={null}
          streak={0}
          streakType={null}
          hidratacaoAtual={0}
          hidratacaoMeta={0}
        />
      </MemoryRouter>
    );

    expect(container.children.length).toBe(0);
  });

  it('mostra alerta de dor ativa quando há dor', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={{ regiao: 'Lombar', intensidade: 7 }}
          streak={0}
          streakType={null}
          hidratacaoAtual={1000}
          hidratacaoMeta={2500}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Atenção: dor ativa detectada/i)).toBeInTheDocument();
    expect(screen.getByText(/Lombar/)).toBeInTheDocument();
    expect(screen.getByText(/intensidade 7\/10/)).toBeInTheDocument();
  });

  it('mostra alerta de streak de vitórias ≥ 3', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={null}
          streak={5}
          streakType="V"
          hidratacaoAtual={2500}
          hidratacaoMeta={2500}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/5 vitórias seguidas/)).toBeInTheDocument();
  });

  it('NÃO mostra alerta de streak para derrotas', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={null}
          streak={5}
          streakType="D"
          hidratacaoAtual={2500}
          hidratacaoMeta={2500}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/5 vitórias/)).not.toBeInTheDocument();
  });

  it('NÃO mostra alerta de streak < 3', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={null}
          streak={2}
          streakType="V"
          hidratacaoAtual={2500}
          hidratacaoMeta={2500}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/vitórias seguidas/)).not.toBeInTheDocument();
  });

  it('mostra alerta de hidratação baixa (< 50% da meta)', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={null}
          streak={0}
          streakType={null}
          hidratacaoAtual={500}
          hidratacaoMeta={2500}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Hidratação baixa/)).toBeInTheDocument();
    expect(screen.getByText(/500ml \/ 2500ml/)).toBeInTheDocument();
  });

  it('NÃO mostra alerta de hidratação quando >= 50%', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={null}
          streak={0}
          streakType={null}
          hidratacaoAtual={1300}
          hidratacaoMeta={2500}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Hidratação baixa/)).not.toBeInTheDocument();
  });

  it('NÃO mostra alerta de hidratação quando meta é 0', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={null}
          streak={0}
          streakType={null}
          hidratacaoAtual={100}
          hidratacaoMeta={0}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Hidratação baixa/)).not.toBeInTheDocument();
  });

  it('combina múltiplos alertas simultâneos', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          dorAtiva={{ regiao: 'Joelho', intensidade: 8 }}
          streak={6}
          streakType="V"
          hidratacaoAtual={300}
          hidratacaoMeta={2500}
        />
      </MemoryRouter>
    );

    // Três alertas devem aparecer
    expect(screen.getByText(/Atenção: dor ativa detectada/i)).toBeInTheDocument();
    expect(screen.getByText(/6 vitórias seguidas/)).toBeInTheDocument();
    expect(screen.getByText(/Hidratação baixa/)).toBeInTheDocument();
  });
});
