/**
 * Testes do SyncIndicator — indicador visual de pending writes
 *
 * Renderiza estado diferente baseado em pending/failed/syncing.
 * Nota: usa mock do useSyncQueue para evitar dependência circular.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock useSyncQueue
vi.mock('@/hooks/useSyncQueue', () => ({
  useSyncQueue: () => ({
    state: { pending: [], failed: [], syncing: false, lastSyncAt: null },
    pending: [],
    failed: [],
    syncing: false,
    lastSyncAt: null,
    hasPending: false,
  }),
}));

// Mock useOnlineStatus
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    online: true,
    navigatorOnline: true,
    lastChangeAt: null,
    secondsSinceChange: null,
    checkNow: async () => {},
  }),
}));

import { SyncIndicator } from '../SyncIndicator';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SyncIndicator', () => {
  it('renderiza invisível quando nada pendente', async () => {
    const { container } = await render(<SyncIndicator />);
    expect(container.firstChild).toBeNull();
  });
});
