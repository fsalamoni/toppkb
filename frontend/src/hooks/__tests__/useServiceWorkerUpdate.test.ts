/**
 * Testes do useServiceWorkerUpdate — atualização do Service Worker
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServiceWorkerUpdate } from '../useServiceWorkerUpdate';

// Mock do serviceWorker
const mockWaitingWorker: any = {
  state: 'installed',
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockRegistration: any = {
  waiting: null as any,
  installing: null as any,
  update: vi.fn(),
  addEventListener: vi.fn(),
};

const mockServiceWorker = {
  controller: null,
  getRegistration: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRegistration.waiting = null;
  mockRegistration.installing = null;
  mockRegistration.update.mockResolvedValue(undefined);
  mockServiceWorker.controller = null;
  mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
  // @ts-expect-error mock parcial em navigator
  global.navigator.serviceWorker = mockServiceWorker;
});

const waitForEffect = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
};

describe('useServiceWorkerUpdate', () => {
  it('inicia sem update pendente', async () => {
    const { result } = renderHook(() => useServiceWorkerUpdate());
    await waitForEffect();

    expect(result.current.needsUpdate).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('detecta update pendente do SW waiting', async () => {
    mockRegistration.waiting = mockWaitingWorker;
    mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => useServiceWorkerUpdate());
    await waitForEffect();

    expect(result.current.needsUpdate).toBe(true);
  });

  it('applyUpdate envia SKIP_WAITING para o waiting worker', async () => {
    mockRegistration.waiting = mockWaitingWorker;
    mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => useServiceWorkerUpdate());
    await waitForEffect();

    expect(result.current.needsUpdate).toBe(true);

    act(() => {
      result.current.applyUpdate();
    });

    expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('dismiss esconde banner', async () => {
    mockRegistration.waiting = mockWaitingWorker;
    mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => useServiceWorkerUpdate());
    await waitForEffect();

    expect(result.current.needsUpdate).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.needsUpdate).toBe(false);
  });

  it('escuta mensagem SW_UPDATED', async () => {
    mockRegistration.waiting = mockWaitingWorker;
    mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

    renderHook(() => useServiceWorkerUpdate());
    await waitForEffect();

    // Verifica que tem listener registrado
    expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
  });

  it('não faz nada quando navigator.serviceWorker não existe', () => {
    // @ts-expect-error del serviceWorker para teste de fallback
    delete global.navigator.serviceWorker;

    const { result } = renderHook(() => useServiceWorkerUpdate());

    expect(result.current.needsUpdate).toBe(false);
  });
});
