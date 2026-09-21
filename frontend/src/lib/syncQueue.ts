/**
 * syncQueue.ts — fila de writes para sincronização offline
 *
 * Quando o usuário está offline, writes são enfileirados no IndexedDB.
 * Quando volta online, a fila é processada automaticamente.
 *
 * Estratégia:
 * - Cada mutation tem um `id` único
 * - Mutations são executadas na ordem de criação (FIFO)
 * - Falha de uma mutation: retentativas com exponential backoff
 * - Max 3 tentativas; depois disso, fica em estado "failed" para inspeção
 *
 * Estrutura:
 *   mutations: Array<{
 *     id: string;
 *     type: 'set' | 'add' | 'update' | 'delete';
 *     collection: string;
 *     docId?: string;
 *     data: any;
 *     createdAt: number;
 *     attempts: number;
 *     lastError?: string;
 *   }>
 */
import { idbGet, idbSet } from './idb';

const QUEUE_KEY = 'sync_queue_v1';
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000; // 1s, 2s, 4s, 8s, ...

export type SyncMutation =
  | {
      id: string;
      type: 'set';
      collection: string;
      docId: string;
      data: any;
      merge?: boolean;
      createdAt: number;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      type: 'add';
      collection: string;
      data: any;
      createdAt: number;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      type: 'update';
      collection: string;
      docId: string;
      data: any;
      createdAt: number;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      type: 'delete';
      collection: string;
      docId: string;
      createdAt: number;
      attempts: number;
      lastError?: string;
    };

export type QueueState = {
  pending: SyncMutation[];
  syncing: boolean;
  lastSyncAt: number | null;
  failed: SyncMutation[];
};

type Listener = (state: QueueState) => void;

class SyncQueueManager {
  private state: QueueState = {
    pending: [],
    syncing: false,
    lastSyncAt: null,
    failed: [],
  };
  private listeners = new Set<Listener>();
  private loaded = false;
  private flushing = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    const queue = await idbGet<{ pending: SyncMutation[]; failed: SyncMutation[]; lastSyncAt: number | null }>(QUEUE_KEY);
    if (queue) {
      this.state.pending = queue.pending || [];
      this.state.failed = queue.failed || [];
      this.state.lastSyncAt = queue.lastSyncAt || null;
    }
    this.loaded = true;
    this.notify();
  }

  async enqueue(mutation: Omit<SyncMutation, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
    await this.load();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const m: SyncMutation = {
      ...mutation,
      id,
      createdAt: Date.now(),
      attempts: 0,
    } as SyncMutation;
    this.state.pending.push(m);
    await this.persist();
    this.notify();
    return id;
  }

  async remove(id: string): Promise<void> {
    this.state.pending = this.state.pending.filter((m) => m.id !== id);
    this.state.failed = this.state.failed.filter((m) => m.id !== id);
    await this.persist();
    this.notify();
  }

  getState(): QueueState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Entrega estado atual imediatamente
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l(this.state);
  }

  private async persist(): Promise<void> {
    await idbSet(QUEUE_KEY, {
      pending: this.state.pending,
      failed: this.state.failed,
      lastSyncAt: this.state.lastSyncAt,
    });
  }

  /**
   * Processa toda a fila. Chamado automaticamente quando online.
   * Pode também ser chamado manualmente.
   */
  async flush(executor: (m: SyncMutation) => Promise<void>): Promise<{
    succeeded: number;
    failed: number;
  }> {
    if (this.flushing) {
      return { succeeded: 0, failed: 0 };
    }
    this.flushing = true;
    this.state.syncing = true;
    this.notify();

    let succeeded = 0;
    let failed = 0;
    const queue = [...this.state.pending];

    for (const m of queue) {
      try {
        await executor(m);
        // Sucesso — remove da fila
        this.state.pending = this.state.pending.filter((x) => x.id !== m.id);
        succeeded++;
      } catch (e: any) {
        // Falha — incrementa tentativas
        const updated = this.state.pending.find((x) => x.id === m.id);
        if (updated) {
          updated.attempts++;
          updated.lastError = e?.message || String(e);
          if (updated.attempts >= MAX_ATTEMPTS) {
            // Move para failed
            this.state.failed.push(updated);
            this.state.pending = this.state.pending.filter((x) => x.id !== m.id);
          }
        }
        failed++;
        console.warn(`[syncQueue] mutation ${m.id} falhou (tentativa ${updated?.attempts}):`, e);

        // Backoff antes da próxima tentativa
        if (updated && updated.attempts < MAX_ATTEMPTS) {
          const delay = BACKOFF_BASE_MS * Math.pow(2, updated.attempts - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    this.state.lastSyncAt = Date.now();
    this.state.syncing = false;
    this.flushing = false;
    await this.persist();
    this.notify();

    return { succeeded, failed };
  }

  /**
   * Limpa toda a fila (use com cuidado).
   */
  async clear(): Promise<void> {
    this.state.pending = [];
    this.state.failed = [];
    await this.persist();
    this.notify();
  }
}

export const syncQueue = new SyncQueueManager();

/**
 * Helper para gerar ID único (caso caller queira fazer antes de enqueue).
 */
export function generateMutationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
