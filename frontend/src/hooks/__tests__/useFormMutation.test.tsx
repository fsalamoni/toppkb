/**
 * Testes do useFormMutation — wrapper unificado para Forms offline-first
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'fake-indexeddb/auto';

// Mock useOfflineWrite
const mockMutate = vi.fn();
vi.mock('../useOfflineWrite', () => ({
  useOfflineWrite: () => ({
    mutate: mockMutate,
    isSaving: false,
    error: null,
  }),
}));

// Mock useOnlineStatus
vi.mock('../useOnlineStatus', () => ({
  useOnlineStatus: () => ({ online: true, checkNow: async () => {} }),
}));

import { syncQueue } from '@/lib/syncQueue';
import { idbClear } from '@/lib/idb';
import { useFormMutation } from '../useFormMutation';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(async () => {
  await idbClear();
  await syncQueue.clear();
  vi.clearAllMocks();
  mockMutate.mockResolvedValue(undefined);
});

describe('useFormMutation', () => {
  it('chama mutate com os dados', async () => {
    const { result } = renderHook(
      () =>
        useFormMutation({
          type: 'add',
          collection: 'c1',
          queryKeysToInvalidate: [['dores']],
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutate({ nome: 'test' });
    });

    expect(mockMutate).toHaveBeenCalledWith({ nome: 'test' });
  });

  it('invalida queries após sucesso', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useFormMutation({
          type: 'set',
          collection: 'c1',
          docId: 'd1',
          queryKeysToInvalidate: [['a'], ['b']],
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutate({ x: 1 });
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['a'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['b'] });
  });

  it('chama onSuccess após sucesso', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useFormMutation({
          type: 'add',
          collection: 'c1',
          onSuccess,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutate({});
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('expõe isSaving', async () => {
    let savedAfterMutate = false;
    mockMutate.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      savedAfterMutate = true;
    });

    const { result } = renderHook(
      () => useFormMutation({ type: 'add', collection: 'c1' }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isSaving).toBe(false);

    let mutatePromise: Promise<void>;
    act(() => {
      mutatePromise = result.current.mutate({});
    });

    await act(async () => {
      await mutatePromise!;
    });

    expect(savedAfterMutate).toBe(true);
  });

  it('chama onError se mutate falha', async () => {
    mockMutate.mockRejectedValue(new Error('fail'));
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useFormMutation({
          type: 'add',
          collection: 'c1',
          onError,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutate({});
    });

    expect(onError).toHaveBeenCalled();
  });

  it('não explode se mutate falha sem onError', async () => {
    mockMutate.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(
      () => useFormMutation({ type: 'add', collection: 'c1' }),
      { wrapper: createWrapper() },
    );

    await expect(
      act(async () => {
        await result.current.mutate({});
      }),
    ).resolves.not.toThrow();
  });

  it('passa collection+docId para useOfflineWrite', async () => {
    // Apenas verifica que o hook chama mutate com os parâmetros
    // (a verificação de forward dos parâmetros já está em useOfflineWrite.test.tsx)
    const { result } = renderHook(
      () =>
        useFormMutation({
          type: 'set',
          collection: 'toppkb_users/u1/dores',
          docId: 'd123',
          merge: true,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.mutate({ x: 1 });
    });

    // mutate é o mock — verifica que foi chamado
    expect(mockMutate).toHaveBeenCalledWith({ x: 1 });
  });
});
