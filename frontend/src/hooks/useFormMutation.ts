/**
 * useFormMutation — wrapper de useMutation com suporte offline-first
 *
 * Substitui o padrão `useMutation + safeAddDoc/safeSetDoc` em Forms.
 *
 * Funcionalidades:
 * - Decisão automática online/offline (via useOfflineWrite)
 * - Invalidação de queries após sucesso
 * - Toast padronizado
 * - onSuccess callback customizado
 *
 * USO:
 *   const { mutate, isSaving } = useFormMutation({
 *     collection: `toppkb_users/${user.uid}/dores`,
 *     type: id ? 'set' : 'add',
 *     docId: id,
 *     queryKeysToInvalidate: [['dores', user?.uid], ['dashboard']],
 *     successMessage: 'Dor registrada!',
 *     onSuccess: () => navigate('/app/dores'),
 *   });
 *
 *   const onSubmit = (data) => mutate({ ...data, uid: user.uid });
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineWrite } from './useOfflineWrite';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from '@/components/ui/toaster';

interface UseFormMutationOptions {
  /** Collection path (e.g. "toppkb_users/u1/dores") */
  collection: string;
  /** Tipo de operação */
  type: 'set' | 'add' | 'update' | 'delete';
  /** Document ID para set/update/delete */
  docId?: string;
  /** Use merge para set */
  merge?: boolean;
  /** Queries a invalidar após sucesso (TanStack Query) */
  queryKeysToInvalidate?: Array<string | readonly unknown[]>;
  /** Mensagem de sucesso (custom por contexto) */
  successMessage?: string;
  /** Mensagem de erro customizada */
  errorMessage?: string;
  /** Callback após sucesso (ex: navigate) */
  onSuccess?: () => void;
  /** Callback após falha */
  onError?: (err: Error) => void;
}

export function useFormMutation(opts: UseFormMutationOptions) {
  const qc = useQueryClient();
  const { mutate, isSaving, error } = useOfflineWrite({
    type: opts.type,
    collection: opts.collection,
    docId: opts.docId,
    merge: opts.merge,
  });
  const { online } = useOnlineStatus();

  const runMutation = useCallback(
    async (data?: any) => {
      try {
        await mutate(data);

        // Invalidar queries (após algum tempo — sync pode demorar)
        if (opts.queryKeysToInvalidate) {
          for (const key of opts.queryKeysToInvalidate) {
            qc.invalidateQueries({ queryKey: key as any });
          }
        }

        // Mensagem diferente online/offline
        if (opts.successMessage) {
          toast[online ? 'success' : 'info'](opts.successMessage);
        }
        opts.onSuccess?.();
      } catch (err: any) {
        if (opts.errorMessage) {
          toast.error(opts.errorMessage);
        }
        opts.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate, qc, opts.queryKeysToInvalidate, opts.successMessage, opts.onSuccess, online],
  );

  return {
    mutate: runMutation,
    isSaving,
    error,
    online,
  };
}
