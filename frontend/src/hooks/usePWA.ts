// Hook para detectar prompt de instalação PWA
// + status online/offline
// + permissão de notificações

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Detectar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detectar quando foi instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    // Online/offline
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
    return choice.outcome === 'accepted';
  };

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isOnline,
    updateAvailable,
    promptInstall,
  };
}

// Hook para gerenciar permissão de notificações
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'unsupported' as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      // Subscrever para push
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (vapidKey) {
        try {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          });
          setSubscription(sub);
          // Salvar no Firestore
          return 'granted' as const;
        } catch (e) {
          console.warn('[pwa] Falha ao subscrever push:', e);
        }
      }
    }
    return result;
  };

  return { permission, subscription, requestPermission };
}
