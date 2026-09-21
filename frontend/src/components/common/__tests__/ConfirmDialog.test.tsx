/**
 * Testes do ConfirmDialog + useConfirm hook
 *
 * NOTA: O ConfirmDialog usa Radix Portal que tem problemas em jsdom.
 * Estes testes verificam principalmente:
 * - Renderização quando `open=false` (deve renderizar vazio)
 * - Lógica do hook useConfirm (não depende de Radix)
 * - Comportamento do provider
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ConfirmProvider, useConfirm } from '@/hooks/useConfirm';

describe('useConfirm', () => {
  it('lança erro se useConfirm for usado fora do provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      function BadComponent() {
        useConfirm();
        return null;
      }
      render(<BadComponent />);
    }).toThrow(/ConfirmProvider/);

    consoleError.mockRestore();
  });

  it('renderiza dentro do provider sem erro', () => {
    function GoodComponent() {
      const { confirm, ConfirmDialogRoot } = useConfirm();
      return (
        <>
          <button type="button" onClick={() => confirm({ titulo: 'T?', descricao: 'D' })}>
            Open
          </button>
          {ConfirmDialogRoot()}
        </>
      );
    }

    expect(() => {
      render(
        <ConfirmProvider>
          <GoodComponent />
        </ConfirmProvider>
      );
    }).not.toThrow();
  });

  it('ConfirmDialogRoot retorna null quando não há modal ativo', () => {
    function GoodComponent() {
      const { ConfirmDialogRoot } = useConfirm();
      return <div data-testid="root">{ConfirmDialogRoot()}</div>;
    }

    const { container } = render(
      <ConfirmProvider>
        <GoodComponent />
      </ConfirmProvider>
    );

    // Sem modal ativo → ConfirmDialogRoot retorna null → div está vazio
    const root = container.querySelector('[data-testid="root"]');
    expect(root?.children.length).toBe(0);
  });
});
