/**
 * OfflineBanner — banner de aviso quando o usuário está offline
 *
 * Mostra uma notificação persistente no topo da tela quando offline.
 * Inclui:
 * - Indicador visual (sem Wi-Fi ícone)
 * - Mensagem amigável
 * - Tempo desde que ficou offline
 * - Botão "Tentar reconectar"
 * - Lista de features que funcionam offline (cache local)
 */
import { WifiOff, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const { online, secondsSinceChange, checkNow } = useOnlineStatus();

  if (online) return null;

  const timeOffline = formatDuration(secondsSinceChange || 0);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-amber-500/95 dark:bg-amber-600/95',
        'text-amber-950 dark:text-amber-50',
        'shadow-md border-b border-amber-600',
        'px-4 py-2',
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <WifiOff className="h-5 w-5 flex-shrink-0" aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            Você está offline
            {secondsSinceChange !== null && secondsSinceChange > 0 && (
              <span className="ml-2 font-normal opacity-80">
                ({timeOffline})
              </span>
            )}
          </div>
          <div className="text-xs opacity-80 hidden sm:flex items-center gap-2 flex-wrap">
            <span>
              <CheckCircle2 className="h-3 w-3 inline mr-0.5" />
              Dados recentes em cache
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <Database className="h-3 w-3 inline mr-0.5" />
              Alterações serão sincronizadas
            </span>
          </div>
        </div>

        <button
          onClick={checkNow}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5',
            'px-3 py-1.5 rounded-md',
            'bg-amber-950/10 hover:bg-amber-950/20',
            'dark:bg-amber-50/10 dark:hover:bg-amber-50/20',
            'text-xs font-medium transition-colors',
          )}
          aria-label="Tentar reconectar agora"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reconectar</span>
        </button>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
