/**
 * Testes do Breadcrumbs — geração automática de crumbs a partir da URL
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '../Breadcrumbs';

function TestApp({ initialPath, props }: { initialPath: string; props?: any }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Breadcrumbs {...props} />
    </MemoryRouter>
  );
}

describe('Breadcrumbs', () => {
  it('não renderiza nada na rota raiz', () => {
    render(<TestApp initialPath="/" />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renderiza Home para rota /app/dashboard', () => {
    render(<TestApp initialPath="/app/dashboard" />);

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renderiza estrutura aninhada para /app/treinamento/sessoes', () => {
    render(<TestApp initialPath="/app/treinamento/sessoes" />);

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Treinamento')).toBeInTheDocument();
    expect(screen.getByText('Sessões')).toBeInTheDocument();
  });

  it('rotas são clicáveis exceto a última', () => {
    render(<TestApp initialPath="/app/treinamento/sessoes" />);

    // "Treinamento" é clicável
    const treinamento = screen.getByText('Treinamento');
    expect(treinamento.closest('a')).toHaveAttribute('href', '/app/treinamento');

    // "Sessões" é a última — não é link
    const sessoes = screen.getByText('Sessões');
    expect(sessoes.closest('a')).toBeNull();
  });

  it('usa aria-current="page" no último crumb', () => {
    render(<TestApp initialPath="/app/dashboard" />);

    const current = screen.getByText('Dashboard');
    expect(current.closest('[aria-current]')).toHaveAttribute('aria-current', 'page');
  });

  it('esconde Home quando hideRoot é true', () => {
    render(<TestApp initialPath="/app/dashboard" props={{ hideRoot: true }} />);

    expect(screen.queryByText('Início')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('aceita items customizados', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: 'A', to: '/a' },
            { label: 'B', to: '/b' },
            { label: 'C' },
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renomeia IDs longos (20+ chars alfanuméricos) como "Detalhes"', () => {
    // IDs Firestore têm 20+ chars
    render(<TestApp initialPath="/app/treinos/abc1234567890xyz123" />);

    expect(screen.getByText('Detalhes')).toBeInTheDocument();
  });

  it('usa pathname quando label não está mapeado', () => {
    render(<TestApp initialPath="/app/coisa-rara" />);

    // "coisa-rara" tem 11 chars — não é ID
    // Não há mapeamento → usa o próprio pathname
    expect(screen.getByText('coisa-rara')).toBeInTheDocument();
  });

  it('não renderiza o segmento "app" inicial (namespace do shell)', () => {
    // Em /app/treinamento, deve mostrar só "Treinamento"
    // NÃO deve mostrar "App"
    render(<TestApp initialPath="/app/treinamento" />);

    expect(screen.queryByText(/^App$/)).not.toBeInTheDocument();
    expect(screen.getByText('Treinamento')).toBeInTheDocument();
  });
});
