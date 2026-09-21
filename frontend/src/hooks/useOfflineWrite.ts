/**
 * useOfflineWrite — hook unificado para writes com fallback offline
 *
 * Decide automaticamente entre:
 * - ONLINE → executa Firestore direto + adiciona à fila (caso caia offline mid-flight)
 * - OFFLINE → adiciona à fila (será executado quando voltar online)
 *
 * Retorna:
 * - mutate(data): função para executar o write
 * - isSaving: se está executando agora
 * - error: erro do write (se houver)
 *
 * USO:
 *   const { mutate, isSaving } = useOfflineWrite({
 *     collection: `toppkb_users/${user.uid}/treinos`,
 *     type: 'add',
 *   });
 *
 *   await mutate({ tipo: 'quadra', data: new Date().toISOString() });
 */
import { useState, useCallback } from 'react';
import { doc, collection, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSyncQueue } from './useSyncQueue';
import { useOnlineStatus } from './useOnlineStatus';

interface UseOfflineWriteOptions {
  type: 'set' | 'add' | 'update' | 'delete';
  /** Collection path (e.g. "toppkb_users/u1/treinos") */
  collection: string;
  /** Document ID (required for set/update/delete) */
  docId?: string;
  /** Use merge when calling set */
  merge?: boolean;
}

export function useOfflineWrite(opts: UseOfflineWriteOptions) {
  const { online } = useOnlineStatus();
  const { enqueue } = useSyncQueue();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (data?: any): Promise<void> => {
      setIsSaving(true);
      setError(null);
      try {
        if (online) {
          // Tenta Firestore direto primeiro
          try {
            if (opts.type === 'set') {
              if (!opts.docId) throw new Error('docId required for set');
              await setDoc(doc(db, opts.collection, opts.docId), data ?? {}, { merge: opts.merge ?? false });
            } else if (opts.type === 'add') {
              await addDoc(collection(db, opts.collection), data ?? {});
            } else if (opts.type === 'update') {
              if (!opts.docId) throw new Error('docId required for update');
              await updateDoc(doc(db, opts.collection, opts.docId), data ?? {});
            } else if (opts.type === 'delete') {
              if (!opts.docId) throw new Error('docId required for delete');
              await deleteDoc(doc(db, opts.collection, opts.docId));
            }
            return;
          } catch (e: any) {
            console.warn('[useOfflineWrite] Firestore direto falhou, indo pra fila:', e);
            // Cai pra fila
          }
        }

        // OFFLINE ou Firestore falhou → enfileira
        const m: any = {
          type: opts.type,
          collection: opts.collection,
          data,
        };
        if (opts.docId) m.docId = opts.docId;
        if (opts.merge !== undefined) m.merge = opts.merge;
        await enqueue(m);
      } catch (e: any) {
        setError(e instanceof Error ? e : new Error(String(e)));
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [online, enqueue, opts.type, opts.collection, opts.docId, opts.merge],
  );

  return {
    mutate,
    isSaving,
    error,
  };
}
