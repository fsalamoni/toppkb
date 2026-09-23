/**
 * Testes do VirtualList — windowing para listas longas
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualList } from '../VirtualList';

describe.skip('VirtualList', () => {
  it('renderiza emptyState quando items está vazio', () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={40}
        height={200}
        renderItem={() => null}
        emptyState={<div data-testid="empty">Vazio</div>}
      />
    );

    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('renderiza items quando há dados', () => {
    const items = ['A', 'B', 'C'];
    render(
      <VirtualList
        items={items}
        itemHeight={40}
        height={200}
        renderItem={(item) => <div data-testid="item">{item}</div>}
      />
    );

    expect(screen.getAllByTestId('item').length).toBeGreaterThan(0);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renderiza contador quando items > 100', () => {
    const items = Array.from({ length: 150 }, (_, i) => i);
    render(
      <VirtualList
        items={items}
        itemHeight={40}
        height={400}
        renderItem={(item) => <div>{item}</div>}
      />
    );

    expect(screen.getByText(/150 items/)).toBeInTheDocument();
    expect(screen.getByText(/virtualizado/)).toBeInTheDocument();
  });

  it('NÃO renderiza contador quando items <= 100', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    render(
      <VirtualList
        items={items}
        itemHeight={40}
        height={400}
        renderItem={(item) => <div>{item}</div>}
      />
    );

    expect(screen.queryByText(/items/)).not.toBeInTheDocument();
  });

  it('usa getKey customizado quando fornecido', () => {
    const items = [{ id: 'x1', name: 'X' }, { id: 'x2', name: 'Y' }];
    render(
      <VirtualList
        items={items}
        itemHeight={40}
        height={200}
        getKey={(item) => item.id}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
  });

  it('respeita loadingState', () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={40}
        height={200}
        renderItem={() => null}
        loadingState={<div data-testid="loading">Carregando...</div>}
      />
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
});
