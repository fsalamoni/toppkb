/**
 * useServiceWorkerUpdate — detecta novas versões do SW e notifica usuário
 *
 * Quando o Service Worker detecta uma atualização:
 * 1. Baixa o novo SW em background
 * 2. Aguarda confirmação do usuário
 * 3. Aplica o novo SW e recarrega a página
 *
 * UX padrão: aparece um banner "Nova versão disponível — Atualizar"
 *
 * USO:
 *   const { needsUpdate, applyUpdate, dismiss } = useServiceWorkerUpdate();
 */
import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  /** Há uma atualização disponível? */
  needsUpdate: boolean;
  /** Está baixando o novo SW */
  downloading: boolean;
  /** Erro ao tentar atualizar */
  error: Error | null;
  /** Aplicar update (force activate + reload) */
  applyUpdate: () => void;
  /** Dispensar o banner (usuário não quer atualizar agora) */
  dismiss: () => void;
}

export function useServiceWorkerUpdate(): ServiceWorkerState {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      // SW novo ativou — recarregar para usar
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Verifica se já tem SW esperando
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      if (reg.waiting) {
        setWaitingSW(reg.waiting);
      }

      // Escuta por novas instalações
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Há um novo SW esperando ativação
            setWaitingSW(newWorker);
          }
        });
      });
    }).catch((e) => {
      console.warn('[useServiceWorkerUpdate] failed to get registration:', e);
    });

    // Escuta mensagens do SW (você pode usar isso se o SW enviar mensagens)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        // SW notificou atualização manualmente
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg?.waiting) setWaitingSW(reg.waiting);
        });
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingSW) {
      // Tenta forçar uma verificação
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch((e) => {
          setError(e instanceof Error ? e : new Error(String(e)));
        });
      });
      return;
    }

    setDownloading(true);
    setError(null);

    // Escuta mudanças no waiting worker
    const stateListener = () => {
      if (waitingSW.state === 'activated' || !navigator.serviceWorker.controller) {
        // O SW ativou — vai disparar controllerchange e recarregar
        waitingSW.removeEventListener('statechange', stateListener);
      }
    };
    waitingSW.addEventListener('statechange', stateListener);

    // Envia mensagem para o SW pular waiting
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingSW]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    needsUpdate: !!waitingSW && !dismissed,
    downloading,
    error,
    applyUpdate,
    dismiss,
  };
}
