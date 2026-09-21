/**
 * useOnlineStatus — monitora status online/offline
 *
 * Usa navigator.onLine + eventos online/offline da window.
 * Importante: navigator.onLine pode retornar true mesmo sem internet real
 * (ex: conectado a Wi-Fi mas sem DNS). Use também com fetch teste.
 */
import { useState, useEffect, useCallback } from 'react';

interface OnlineStatusOptions {
  /** Endpoint a pingar para confirmar conexão real (opcional) */
  pingUrl?: string;
  /** Intervalo de check (ms). Default: 30000 (30s) */
  interval?: number;
}

interface OnlineStatusResult {
  /** True se há conexão real */
  online: boolean;
  /** True se navigator.onLine diz que está online (sem ping) */
  navigatorOnline: boolean;
  /** Último status confirmado em timestamp */
  lastChangeAt: number | null;
  /** Tempo desde última mudança (em segundos) */
  secondsSinceChange: number | null;
  /** Forçar re-check agora */
  checkNow: () => Promise<void>;
}

export function useOnlineStatus(options: OnlineStatusOptions = {}): OnlineStatusResult {
  const { pingUrl, interval = 30000 } = options;
  const [navigatorOnline, setNavigatorOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [lastChangeAt, setLastChangeAt] = useState<number | null>(null);
  const [secondsSinceChange, setSecondsSinceChange] = useState<number | null>(null);

  const checkNow = useCallback(async () => {
    const basic = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setNavigatorOnline(basic);

    if (!basic) {
      setOnline(false);
      setLastChangeAt(Date.now());
      return;
    }

    // Ping teste para confirmar conexão real
    if (pingUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(pingUrl, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setOnline(true);
        setLastChangeAt(Date.now());
      } catch {
        setOnline(false);
        setLastChangeAt(Date.now());
      }
    } else {
      setOnline(basic);
      setLastChangeAt(Date.now());
    }
  }, [pingUrl]);

  // Eventos online/offline
  useEffect(() => {
    const handleOnline = () => {
      setNavigatorOnline(true);
      // Não atualizar `online` direto — só após ping
      if (!pingUrl) {
        setOnline(true);
        setLastChangeAt(Date.now());
      } else {
        checkNow();
      }
    };

    const handleOffline = () => {
      setNavigatorOnline(false);
      setOnline(false);
      setLastChangeAt(Date.now());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pingUrl, checkNow]);

  // Ping periódico
  useEffect(() => {
    if (!pingUrl || !interval) return;
    const id = setInterval(() => checkNow(), interval);
    return () => clearInterval(id);
  }, [pingUrl, interval, checkNow]);

  // Tick para atualizar secondsSinceChange
  useEffect(() => {
    if (!lastChangeAt) return;
    const id = setInterval(() => {
      setSecondsSinceChange(Math.floor((Date.now() - lastChangeAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastChangeAt]);

  return {
    online,
    navigatorOnline,
    lastChangeAt,
    secondsSinceChange,
    checkNow,
  };
}
