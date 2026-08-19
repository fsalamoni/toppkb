import { useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { toast } from '@/components/ui/toaster';

const DISMISSED_KEY = 'toppkb-install-dismissed';

export function InstallPWA() {
  const { canInstall, promptInstall, isInstalled, isOnline } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [installing, setInstalling] = useState(false);

  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        toast.success('App instalado! 🏓 Agora você pode usar offline.');
      } else {
        toast.info('Instalação cancelada');
      }
    } catch (e: any) {
      toast.error('Erro ao instalar: ' + e.message);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm z-40">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">📱</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Instalar como app
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tenha o Top Pickleball 50+ na tela inicial do celular.
            Acesso rápido + funciona offline.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={installing}
              className="flex-1"
            >
              <Download className="mr-1 h-3 w-3" />
              {installing ? 'Instalando...' : 'Instalar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Depois
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!isOnline && (
        <div className="mt-2 text-xs text-center text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md py-1">
          Você está offline. Alguns dados podem estar desatualizados.
        </div>
      )}
    </div>
  );
}
