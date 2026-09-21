/**
 * Testes do EmptyState — ilustrações SVG + estados vazios
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    render(
      <EmptyState
        title="Nenhum treino registrado"
        description="Registre seu primeiro treino para começar."
      />
    );

    expect(screen.getByText('Nenhum treino registrado')).toBeInTheDocument();
    expect(screen.getByText('Registre seu primeiro treino para começar.')).toBeInTheDocument();
  });

  it('aceita sinônimos pt-BR (titulo, descricao)', () => {
    render(
      <EmptyState
        titulo="Título BR"
        descricao="Descrição BR"
      />
    );

    expect(screen.getByText('Título BR')).toBeInTheDocument();
    expect(screen.getByText('Descrição BR')).toBeInTheDocument();
  });

  it('renderiza ação customizada quando fornecida', () => {
    render(
      <EmptyState
        title="Vazio"
        description="Nada aqui"
        action={<button type="button">Clique aqui</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument();
  });

  it('usa ilustração padrão quando type=default', () => {
    const { container } = render(
      <EmptyState
        title="Vazio"
        illustration="default"
      />
    );

    // SVG presente
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it.each([
    'training',
    'match',
    'food',
    'sleep',
    'weight',
    'pain',
    'trophy',
    'water',
    'chat',
    'chart',
    'user',
    'error',
  ] as const)('renderiza ilustração para %s', (illustration) => {
    const { container } = render(
      <EmptyState title="Vazio" illustration={illustration} />
    );

    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('aceita ícone customizado via prop `icon`', () => {
    render(
      <EmptyState
        title="Custom"
        icon={<span data-testid="custom-icon">🏓</span>}
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('não renderiza heading se título não é fornecido', () => {
    const { container } = render(<EmptyState />);

    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });
});
