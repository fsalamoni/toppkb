/**
 * useOfflineQuery — query com fallback offline
 *
 * Combina cache local (IndexedDB) com network (fetch):
 * 1. Primeiro: tenta cache local (instantâneo, mesmo offline)
 * 2. Em paralelo: tenta network (atualiza cache se sucesso)
 * 3. Se network falhar: usa cache (stale-while-revalidate)
 * 4. Se ambos falharem: error
 *
 * Substitui `useQuery` do TanStack em queries que precisam funcionar offline.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { idbGet, idbSet } from '@/lib/idb';

interface UseOfflineQueryOptions<T> {
  /** Chave única para cache (e.g. 'treinos:u1') */
  cacheKey: string;
  /** Função que faz o fetch (network) */
  fetcher: () => Promise<T>;
  /** TTL do cache em segundos. Default: 1h. */
  ttl?: number;
  /** Se true, revalida mesmo se acabou de cachear (background). Default: false. */
  revalidateOnFocus?: boolean;
  /** Se true, refetch em intervalo regular. Default: false. */
  refetchInterval?: number;
}

interface UseOfflineQueryResult<T> {
  data: T | null;
  /** True se está mostrando dados do cache (não fresh do servidor) */
  isStale: boolean;
  /** True se está buscando no momento */
  isLoading: boolean;
  /** True se é a primeira vez (sem cache) */
  isInitial: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOfflineQuery<T>({
  cacheKey,
  fetcher,
  ttl = 3600,
  revalidateOnFocus = false,
  refetchInterval = 0,
}: UseOfflineQueryOptions<T>): UseOfflineQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitial, setIsInitial] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const { online } = useOnlineStatus();

  const doFetch = useCallback(async (): Promise<void> => {
    if (!online) {
      return;
    }
    try {
      const fresh = await fetcherRef.current();
      setData(fresh);
      setIsStale(false);
      setError(null);
      idbSet(cacheKey, fresh, { ttl }).catch((e) => {
        console.warn('[useOfflineQuery] cache write falhou:', e);
      });
    } catch (e: any) {
      console.warn('[useOfflineQuery] fetch falhou:', e);
      // Mantém data antiga se houver
      if (!data) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  }, [cacheKey, ttl, online, data]);

  // Carregamento inicial: cache primeiro, depois network
  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1. Tenta cache
      try {
        const cached = await idbGet<T>(cacheKey);
        if (mounted && cached !== null) {
          setData(cached);
          setIsStale(true);
          setIsLoading(false);
          setIsInitial(false);
        }
      } catch (e) {
        console.warn('[useOfflineQuery] cache read falhou:', e);
      }

      // 2. Tenta network (em paralelo)
      if (online) {
        try {
          const fresh = await fetcherRef.current();
          if (mounted) {
            setData(fresh);
            setIsStale(false);
            setError(null);
            idbSet(cacheKey, fresh, { ttl }).catch(() => {});
          }
        } catch (e: any) {
          if (mounted && !data) {
            setError(e instanceof Error ? e : new Error(String(e)));
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
            setIsInitial(false);
          }
        }
      } else if (mounted) {
        setIsLoading(false);
        setIsInitial(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  // Refetch on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;
    const handler = () => {
      if (document.visibilityState === 'visible' && online) {
        doFetch();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [revalidateOnFocus, online, doFetch]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !online) return;
    const id = setInterval(doFetch, refetchInterval);
    return () => clearInterval(id);
  }, [refetchInterval, online, doFetch]);

  return {
    data,
    isStale,
    isLoading,
    isInitial,
    error,
    refetch: doFetch,
  };
}
