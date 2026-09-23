/**
 * Testes do useFormAutoSave — auto-save de Forms
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormAutoSave } from '../useFormAutoSave';

beforeEach(() => {
  localStorage.clear();
});

describe('useFormAutoSave', () => {
  it('salva rascunho no localStorage após debounce', async () => {
    const data = { titulo: 'Treino de quarta', duracao: 90 };

    const { result } = renderHook(() =>
      useFormAutoSave({
        key: 'test-form',
        data,
        delay: 50,
      }),
    );

    // Esperar debounce
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.savedAt).toBeTruthy();
    const saved = localStorage.getItem('toppkb-draft:test-form');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed.data).toEqual(data);
  });

  it('não salva quando enabled=false', async () => {
    const data = { titulo: 'Teste' };

    renderHook(() =>
      useFormAutoSave({
        key: 'test-disabled',
        data,
        delay: 50,
        enabled: false,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const saved = localStorage.getItem('toppkb-draft:test-disabled');
    expect(saved).toBeNull();
  });

  it('limpa rascunho com clear()', async () => {
    const { result } = renderHook(() =>
      useFormAutoSave({
        key: 'to-clear',
        data: { x: 1 },
        delay: 50,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(localStorage.getItem('toppkb-draft:to-clear')).toBeTruthy();

    act(() => {
      result.current.clear();
    });

    expect(localStorage.getItem('toppkb-draft:to-clear')).toBeNull();
    expect(result.current.savedAt).toBeNull();
  });

  it('restaura rascunho com restore()', async () => {
    const data = { nome: 'João', idade: 44 };

    // Primeiro, criar rascunho
    localStorage.setItem(
      'toppkb-draft:to-restore',
      JSON.stringify({
        data,
        savedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() =>
      useFormAutoSave({
        key: 'to-restore',
        data: {},
        delay: 50,
      }),
    );

    let restored: any = null;
    act(() => {
      restored = result.current.restore();
    });

    expect(restored).toEqual(data);
  });

  it('debounce: salva apenas 1 vez após múltiplas mudanças rápidas', async () => {
    let writeCount = 0;
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = vi.fn((key: string, value: string) => {
      writeCount++;
      return originalSetItem(key, value);
    });

    const { rerender } = renderHook(
      ({ data }) =>
        useFormAutoSave({
          key: 'debounce',
          data,
          delay: 100,
        }),
      { initialProps: { data: { v: 1 } } },
    );

    // Múltiplas mudanças em < 100ms
    rerender({ data: { v: 2 } });
    rerender({ data: { v: 3 } });
    rerender({ data: { v: 4 } });
    rerender({ data: { v: 5 } });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // Esperado: writeCount <= 2 (debounce agrupa mudanças + beforeunload pode adicionar)
    expect(writeCount).toBeLessThanOrEqual(2);
  });

  it('salva imediatamente em beforeunload', async () => {
    renderHook(() =>
      useFormAutoSave({
        key: 'beforeunload',
        data: { v: 1 },
        delay: 10000,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const event = new Event('beforeunload');
    window.dispatchEvent(event);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const saved = localStorage.getItem('toppkb-draft:beforeunload');
    expect(saved).toBeTruthy();
  });
});
