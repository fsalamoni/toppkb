/**
 * Testes do DashboardKPIs — KPICard + QuickAction + DashboardKPIs
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Activity, Trophy } from 'lucide-react';
import { KPICard, QuickAction, DashboardKPIs } from '../DashboardKPIs';

describe('KPICard', () => {
  it('renderiza label, value e ícone', () => {
    render(
      <MemoryRouter>
        <KPICard label="Treinos" value="42" icon={Activity} color="emerald" />
      </MemoryRouter>
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Treinos')).toBeInTheDocument();
  });

  it('renderiza sub se fornecido', () => {
    render(
      <MemoryRouter>
        <KPICard label="Peso" value="80kg" sub="Meta: 75kg" icon={Trophy} color="cyan" />
      </MemoryRouter>
    );

    expect(screen.getByText('Meta: 75kg')).toBeInTheDocument();
  });

  it('vira link quando `link` é fornecido', () => {
    render(
      <MemoryRouter>
        <KPICard label="Treinos" value="42" icon={Activity} color="emerald" link="/app/treinos" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/app/treinos');
  });

  it('fica como Card estático quando `link` é omitido', () => {
    const { container } = render(
      <MemoryRouter>
        <KPICard label="Streak" value="3V" icon={Trophy} color="emerald" />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-lg')).toBeTruthy();
  });
});

describe('QuickAction', () => {
  it('renderiza com label e link correto', () => {
    render(
      <MemoryRouter>
        <QuickAction href="/app/treinos/novo" icon={Activity} label="Registrar treino" color="emerald" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/app/treinos/novo');
    expect(screen.getByText('Registrar treino')).toBeInTheDocument();
  });

  it('aplica classes de cor', () => {
    render(
      <MemoryRouter>
        <QuickAction href="/app/treinos/novo" icon={Activity} label="Treino" color="emerald" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link.className).toContain('hover:border-emerald');
    expect(link.className).toContain('text-emerald-400');
  });

  it('usa cor padrão quando color é desconhecido', () => {
    render(
      <MemoryRouter>
        <QuickAction href="/app/x" icon={Trophy} label="X" color="foo" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    // Sem cor específica aplicada — fica sem sufixo de cor
    expect(link.className).not.toContain('hover:border-foo');
  });
});

describe('DashboardKPIs', () => {
  const defaultProps = {
    treinos7d: 4,
    partidas7d: 2,
    winRate: 67,
    vitoriasTotal: 10,
    totalPartidas: 15,
    sonoMedio: 7.5,
    pesoAtual: 80,
    proximoTorneio: { nome: 'Brasileiro 2026', diasRestantes: 7 },
    streak: 3,
    streakType: 'V' as const,
  };

  it('renderiza todos os 7 KPIs', () => {
    render(
      <MemoryRouter>
        <DashboardKPIs {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('Treinos (7d)')).toBeInTheDocument();
    expect(screen.getByText('Partidas (7d)')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Sono médio')).toBeInTheDocument();
    expect(screen.getByText('Peso atual')).toBeInTheDocument();
    expect(screen.getByText('Próximo torneio')).toBeInTheDocument();
    expect(screen.getByText('Streak atual')).toBeInTheDocument();
  });

  it('mostra valores corretos', () => {
    render(
      <MemoryRouter>
        <DashboardKPIs {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('4')).toBeInTheDocument(); // treinos7d
    expect(screen.getByText('2')).toBeInTheDocument(); // partidas7d
    expect(screen.getByText('67%')).toBeInTheDocument(); // winRate
    expect(screen.getByText('7.5h')).toBeInTheDocument(); // sonoMedio
    expect(screen.getByText('80.0 kg')).toBeInTheDocument(); // pesoAtual
    expect(screen.getByText('7d')).toBeInTheDocument(); // dias torneio
    expect(screen.getByText('3 V')).toBeInTheDocument(); // streak
  });

  it('mostra "—" para sonoMedio e pesoAtual quando null', () => {
    render(
      <MemoryRouter>
        <DashboardKPIs
          {...defaultProps}
          sonoMedio={null}
          pesoAtual={null}
          proximoTorneio={null}
          streak={0}
          streakType={null}
        />
      </MemoryRouter>
    );

    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThanOrEqual(3);
  });

  it('mostra meta quando pesoMeta é fornecido', () => {
    render(
      <MemoryRouter>
        <DashboardKPIs {...defaultProps} pesoMeta={75} />
      </MemoryRouter>
    );

    expect(screen.getByText('Meta: 75kg')).toBeInTheDocument();
  });

  it('mostra texto padrão quando pesoMeta não é definido', () => {
    render(
      <MemoryRouter>
        <DashboardKPIs {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('Defina meta em Configurações')).toBeInTheDocument();
  });
});
