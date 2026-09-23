/**
 * Testes do useOfflineWrite — write com fallback offline
 *
 * Cobre:
 * - Quando online: executa Firestore direto
 * - Quando offline: adiciona à fila
 * - Quando Firestore falha: cai pra fila
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { syncQueue } from '@/lib/syncQueue';
import { idbClear } from '@/lib/idb';

// Mock do firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => ({ __doc: args }),
  collection: (...args: any[]) => ({ __col: args }),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: () => new Date(),
}));

// Mock do @/lib/firebase
vi.mock('@/lib/firebase', () => ({
  db: { __db: true },
  auth: { __mock: 'auth' },
  functions: {},
  storage: {},
  default: {},
}));

import { useOfflineWrite } from '../useOfflineWrite';

// Mock navigator.onLine
const mockOnline = (value: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
};

beforeEach(async () => {
  await idbClear();
  await syncQueue.clear();
  vi.clearAllMocks();
  mockOnline(true);
});

describe('useOfflineWrite', () => {
  it('quando online: executa Firestore direto', async () => {
    const { setDoc } = await import('firebase/firestore');
    (setDoc as any).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOfflineWrite({
        type: 'set',
        collection: 'c1',
        docId: 'd1',
        merge: true,
      }),
    );

    await act(async () => {
      await result.current.mutate({ nome: 'test' });
    });

    expect(setDoc).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('quando offline: adiciona à fila', async () => {
    mockOnline(false);

    const { result } = renderHook(() =>
      useOfflineWrite({
        type: 'add',
        collection: 'c1',
      }),
    );

    await act(async () => {
      await result.current.mutate({ adversario: 'X' });
    });

    expect(syncQueue.getState().pending).toHaveLength(1);
    expect(syncQueue.getState().pending[0].type).toBe('add');
  });

  it('quando Firestore falha: cai pra fila', async () => {
    const { setDoc } = await import('firebase/firestore');
    (setDoc as any).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() =>
      useOfflineWrite({
        type: 'set',
        collection: 'c1',
        docId: 'd1',
      }),
    );

    await act(async () => {
      await result.current.mutate({ x: 1 });
    });

    // Cai pra fila (não propaga erro)
    expect(syncQueue.getState().pending).toHaveLength(1);
    expect(syncQueue.getState().pending[0].type).toBe('set');
  });

  it('isSaving reflete estado durante execução', async () => {
    const { setDoc } = await import('firebase/firestore');
    let resolveFirestore: () => void;
    (setDoc as any).mockImplementation(
      () => new Promise<void>((r) => { resolveFirestore = r; })
    );

    const { result } = renderHook(() =>
      useOfflineWrite({ type: 'set', collection: 'c1', docId: 'd1' }),
    );

    let mutatePromise: Promise<void>;
    act(() => {
      mutatePromise = result.current.mutate({ x: 1 });
    });

    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      resolveFirestore!();
      await mutatePromise;
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('delete com docId faltando adiciona à fila (falha depois)', async () => {
    const { result } = renderHook(() =>
      useOfflineWrite({ type: 'delete', collection: 'c1' }),
    );

    await act(async () => {
      try {
        await result.current.mutate();
      } catch (e) {
        // Espera erro
      }
    });

    // Como está online, tentou Firestore direto, falhou, e caiu pra fila
    expect(syncQueue.getState().pending).toHaveLength(1);
  });
});
