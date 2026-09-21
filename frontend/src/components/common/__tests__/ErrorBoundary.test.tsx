/**
 * Testes do ErrorBoundary — captura erros React
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock do errorLogger
vi.mock('@/lib/errorLogger', () => ({
  logError: vi.fn().mockResolvedValue('mock-id-123'),
}));

const Bomb = ({ throw: shouldThrow }: { throw: boolean }) => {
  if (shouldThrow) throw new Error('Boom!');
  return <div>Safe content</div>;
};

const wrapInRouter = (ui: React.ReactNode) => (
  <MemoryRouter>{ui}</MemoryRouter>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suprime error do console durante testes
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renderiza children quando não há erro', () => {
    render(
      wrapInRouter(
        <ErrorBoundary>
          <Bomb throw={false} />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByText('Safe content')).toBeTruthy();
  });

  it('mostra fallback UI quando child joga erro', () => {
    render(
      wrapInRouter(
        <ErrorBoundary>
          <Bomb throw={true} />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByText(/Algo deu errado/i)).toBeTruthy();
  });

  it('mostra mensagem do erro', () => {
    render(
      wrapInRouter(
        <ErrorBoundary>
          <Bomb throw={true} />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByText(/Boom!/)).toBeTruthy();
  });

  it('mostra ID do erro', async () => {
    render(
      wrapInRouter(
        <ErrorBoundary>
          <Bomb throw={true} />
        </ErrorBoundary>,
      ),
    );

    // Esperar logError resolver
    await new Promise((r) => setTimeout(r, 10));

    expect(screen.getByText(/mock-id-123/)).toBeTruthy();
  });

  it('loga erro no errorLogger', async () => {
    const { logError } = await import('@/lib/errorLogger');

    render(
      wrapInRouter(
        <ErrorBoundary componentName="TestComponent">
          <Bomb throw={true} />
        </ErrorBoundary>,
      ),
    );

    await new Promise((r) => setTimeout(r, 10));

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Boom!' }),
      expect.objectContaining({ source: 'TestComponent' }),
    );
  });

  it('usa componentName como source', async () => {
    const { logError } = await import('@/lib/errorLogger');

    render(
      wrapInRouter(
        <ErrorBoundary componentName="MinhaPage">
          <Bomb throw={true} />
        </ErrorBoundary>,
      ),
    );

    await new Promise((r) => setTimeout(r, 10));

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ source: 'MinhaPage' }),
    );
  });

  it('botão "Tentar novamente" reseta o erro', async () => {
    const { rerender } = render(
      wrapInRouter(
        <ErrorBoundary>
          <Bomb throw={true} />
        </ErrorBoundary>,
      ),
    );

    expect(screen.getByText(/Algo deu errado/i)).toBeTruthy();

    // Clica no botão de tentar novamente
    const resetBtn = screen.getByText(/Tentar novamente/i);
    fireEvent.click(resetBtn);

    // Re-renderiza sem erro
    rerender(
      wrapInRouter(
        <ErrorBoundary>
          <Bomb throw={false} />
        </ErrorBoundary>,
      ),
    );
  });

  it('mostra custom fallback quando fornecido', () => {
    render(
      wrapInRouter(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <Bomb throw={true} />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByText('Custom error UI')).toBeTruthy();
  });
});
