// Hook genérico para listar coleções do Firestore com timeout e error handling
// Garante que a query NUNCA fica pendurada para sempre — sempre resolve em até `timeoutMs`.

import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  getDocs,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface UseCollectionOptions {
  collectionName: string;
  constraints?: QueryConstraint[];
  enabled?: boolean;
  timeoutMs?: number;
  staleTime?: number;
  select?: <T>(items: T[]) => T[];
}

export function useCollection<T = any>(opts: UseCollectionOptions) {
  const { user } = useAuth();
  const { collectionName, constraints = [], enabled, timeoutMs = 12000, staleTime = 60_000, select } = opts;

  const isEnabled = enabled ?? !!user;

  return useQuery({
    queryKey: ['col', collectionName, user?.uid, ...constraints.map(String)],
    queryFn: async () => {
      if (!user) return [];
      try {
        // Timeout individual por query
        const q = query(
          collection(db, 'toppkb_users', user.uid, collectionName),
          ...constraints,
        );
        const snap = await Promise.race([
          getDocs(q),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout ${collectionName}`)), timeoutMs),
          ),
        ]);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any)) as T[];
        return select ? select(items) : items;
      } catch (e: any) {
        console.warn(`[useCollection ${collectionName}] falhou:`, e?.message);
        // Retorna [] em vez de throw — UI mostra "vazio" em vez de loading infinito
        return [] as T[];
      }
    },
    enabled: isEnabled,
    staleTime,
    retry: 0, // não faz retry — em vez disso, mostra "tente novamente" via refetch
  });
}

// Helper para construir constraints a partir de objetos simples
export const c = {
  where,
  orderBy,
  limit: limitFn,
};

// Helper para converter DocumentData genérico
export function asItem<T>(x: DocumentData | (DocumentData & { id: string })): T {
  return x as T;
}
