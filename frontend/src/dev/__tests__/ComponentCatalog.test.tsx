/**
 * Teste simples do ComponentCatalog — verifica que renderiza
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ComponentCatalog } from '../ComponentCatalog';

describe('ComponentCatalog', () => {
  it('renderiza cabeçalho principal', () => {
    render(
      <MemoryRouter>
        <ComponentCatalog />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Catálogo de Componentes/i).length).toBeGreaterThan(0);
  });

  it('renderiza seções principais', () => {
    render(
      <MemoryRouter>
        <ComponentCatalog />
      </MemoryRouter>
    );

    expect(screen.getByText('UI Primitivos')).toBeInTheDocument();
    expect(screen.getByText('Loading States')).toBeInTheDocument();
    expect(screen.getByText('Empty States')).toBeInTheDocument();
    expect(screen.getByText('Acessibilidade (A11y)')).toBeInTheDocument();
    expect(screen.getByText('Dashboard KPIs')).toBeInTheDocument();
  });

  it('renderiza SkipLink acessível', () => {
    render(
      <MemoryRouter>
        <ComponentCatalog />
      </MemoryRouter>
    );

    const skipLink = screen.getByRole('link', { name: /Pular para o conteúdo/i });
    expect(skipLink).toHaveAttribute('href', '#catalog-main');
  });

  it('renderiza demos com botões', () => {
    render(
      <MemoryRouter>
        <ComponentCatalog />
      </MemoryRouter>
    );

    // Vários botões Default/Destructive/Outline
    expect(screen.getByRole('button', { name: 'Default' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Destructive' })).toBeInTheDocument();
  });
});
