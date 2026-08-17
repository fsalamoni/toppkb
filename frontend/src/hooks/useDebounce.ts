import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores.
 * Útil para inputs que disparam queries (busca, filtros).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
