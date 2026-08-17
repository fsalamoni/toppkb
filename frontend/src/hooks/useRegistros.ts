import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, doc, addDoc, setDoc, deleteDoc, where, limit, startAfter, getDoc, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export interface ListPage<T> {
  items: T[];
  hasMore: boolean;
  cursor?: string;
}

interface UseRegistrosOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  where?: QueryConstraint[];
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Hook genérico para listar documentos de uma subcoleção do user.
 * Retorna a primeira página.
 */
export function useRegistros<T extends { id?: string }>(
  colecao: string,
  options: UseRegistrosOptions = {},
) {
  const { user } = useAuth();
  const { orderByField = 'data', orderDirection = 'desc', where: whereConstraints, pageSize = 20, enabled } = options;

  return useQuery({
    queryKey: ['registros', user?.uid, colecao, orderByField, orderDirection, whereConstraints],
    queryFn: async () => {
      if (!user) return [] as T[];
      const constraints: QueryConstraint[] = [
        ...(whereConstraints || []),
        orderBy(orderByField, orderDirection),
        limit(pageSize),
      ];
      const q = query(collection(db, 'users', user.uid, colecao), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    },
    enabled: enabled !== false && !!user,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para criar registro em uma subcoleção.
 */
export function useCriarRegistro<T extends Record<string, any>>(colecao: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: T) => {
      if (!user) throw new Error('Não autenticado');
      const payload = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, 'users', user.uid, colecao), payload);
      return { id: ref.id, ...payload };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registros', user?.uid, colecao] });
    },
  });
}

/**
 * Hook para atualizar registro.
 */
export function useAtualizarRegistro<T extends Record<string, any>>(colecao: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
      if (!user) throw new Error('Não autenticado');
      const payload = { ...data, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'users', user.uid, colecao, id), payload, { merge: true });
      return { id, ...payload };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registros', user?.uid, colecao] });
    },
  });
}

/**
 * Hook para deletar registro.
 */
export function useDeletarRegistro(colecao: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      await deleteDoc(doc(db, 'users', user.uid, colecao, id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registros', user?.uid, colecao] });
    },
  });
}

/**
 * Hook para carregar um único registro por ID.
 */
export function useRegistro<T extends { id?: string }>(colecao: string, id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['registro', user?.uid, colecao, id],
    queryFn: async () => {
      if (!user || !id) return null;
      const snap = await getDoc(doc(db, 'users', user.uid, colecao, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as T;
    },
    enabled: !!user && !!id,
  });
}
