/**
 * useSyncQueue — gerencia fila de writes offline + flush automático
 *
 * Funcionalidades:
 * - enqueue(mutation): adiciona à fila (executa imediatamente se online)
 * - pending: lista de mutations pendentes
 * - syncing: se está processando agora
 * - lastSyncAt: timestamp da última sincronização
 * - failed: mutations que falharam 3x (precisam atenção)
 *
 * Estratégia:
 * - Quando online: enqueue executa imediatamente + salva no IndexedDB (caso caia offline)
 * - Quando offline: enqueue só salva no IndexedDB
 * - Quando volta online: flush automático
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { syncQueue, QueueState, SyncMutation } from '@/lib/syncQueue';
import { useOnlineStatus } from './useOnlineStatus';
import {
  doc, collection, setDoc, addDoc, updateDoc, deleteDoc,
  Firestore,
} from 'firebase/firestore';

interface UseSyncQueueOptions {
  /** Função que executa a mutation (recebe a db instance) */
  executor?: (m: SyncMutation, db: Firestore) => Promise<void>;
}

export function useSyncQueue(options: UseSyncQueueOptions = {}) {
  const [state, setState] = useState<QueueState>(syncQueue.getState());
  const { online } = useOnlineStatus();
  const executorRef = useRef(options.executor);
  executorRef.current = options.executor;

  // Inicializa fila
  useEffect(() => {
    syncQueue.load();
    const unsub = syncQueue.subscribe(setState);
    return unsub;
  }, []);

  // Flush automático quando volta online
  useEffect(() => {
    if (online && state.pending.length > 0 && !state.syncing) {
      const defaultExecutor = async (m: SyncMutation) => {
        const { db } = await import('@/lib/firebase');
        if (m.type === 'set') {
          const ref = doc(db, m.collection, m.docId);
          await setDoc(ref, m.data, { merge: m.merge ?? false });
        } else if (m.type === 'add') {
          const colRef = collection(db, m.collection);
          await addDoc(colRef, m.data);
        } else if (m.type === 'update') {
          const ref = doc(db, m.collection, m.docId);
          await updateDoc(ref, m.data);
        } else if (m.type === 'delete') {
          const ref = doc(db, m.collection, m.docId);
          await deleteDoc(ref);
        }
      };

      const exec = executorRef.current
        ? async (m: SyncMutation) => {
            const { db } = await import('@/lib/firebase');
            await executorRef.current!(m, db);
          }
        : defaultExecutor;

      syncQueue.flush(exec).then((res) => {
        if (res.failed > 0) {
          console.warn('[useSyncQueue] algumas mutations falharam:', res);
        }
      });
    }
  }, [online, state.pending.length, state.syncing]);

  const enqueue = useCallback(
    async (m: Omit<SyncMutation, 'id' | 'createdAt' | 'attempts'>) => {
      const id = await syncQueue.enqueue(m);
      return id;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await syncQueue.remove(id);
  }, []);

  const flush = useCallback(async () => {
    const defaultExecutor = async (m: SyncMutation) => {
      const { db } = await import('@/lib/firebase');
      if (m.type === 'set') {
        await setDoc(doc(db, m.collection, m.docId), m.data, { merge: m.merge ?? false });
      } else if (m.type === 'add') {
        await addDoc(collection(db, m.collection), m.data);
      } else if (m.type === 'update') {
        await updateDoc(doc(db, m.collection, m.docId), m.data);
      } else if (m.type === 'delete') {
        await deleteDoc(doc(db, m.collection, m.docId));
      }
    };
    const exec = executorRef.current
      ? async (m: SyncMutation) => {
          const { db } = await import('@/lib/firebase');
          await executorRef.current!(m, db);
        }
      : defaultExecutor;

    return syncQueue.flush(exec);
  }, []);

  const clear = useCallback(async () => {
    await syncQueue.clear();
  }, []);

  return {
    state,
    pending: state.pending,
    failed: state.failed,
    syncing: state.syncing,
    lastSyncAt: state.lastSyncAt,
    enqueue,
    remove,
    flush,
    clear,
    hasPending: state.pending.length > 0,
  };
}
