/**
 * SyncIndicator — mostra status da fila de writes offline
 *
 * Comportamento:
 * - 0 pendentes → invisível
 * - 1-9 pendentes → badge compacto "🔄 N pendentes"
 * - > 0 e online → spinner (sincronizando agora)
 * - Tem falhas → badge vermelho "⚠️ N falharam"
 */
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function SyncIndicator() {
  const { pending, failed, syncing, lastSyncAt } = useSyncQueue();
  const { online } = useOnlineStatus();

  const totalPending = pending.length;
  const totalFailed = failed.length;

  // Não mostra se nada pendente
  if (totalPending === 0 && totalFailed === 0 && !syncing) {
    return null;
  }

  // Falha
  if (totalFailed > 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          'bg-red-500/10 text-red-600 dark:text-red-400',
          'border border-red-500/30',
        )}
        title={`${totalFailed} mutações falharam. Verifique conectividade e tente novamente.`}
      >
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{totalFailed} {totalFailed === 1 ? 'falhou' : 'falharam'}</span>
      </div>
    );
  }

  // Sincronizando
  if (syncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          'border border-blue-500/30',
        )}
        title={`Sincronizando ${totalPending} ${totalPending === 1 ? 'item' : 'itens'}...`}
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <span>Salvando...</span>
      </div>
    );
  }

  // Pendentes (offline ou aguardando)
  if (totalPending > 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          online
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
            : 'bg-muted text-muted-foreground border border-border',
        )}
        title={online ? `Aguardando sync (online)` : `Será sincronizado quando voltar online`}
      >
        {online ? (
          <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>
          {totalPending} {totalPending === 1 ? 'pendente' : 'pendentes'}
        </span>
      </div>
    );
  }

  // Sincronizou recentemente
  if (lastSyncAt && Date.now() - lastSyncAt < 5000) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400"
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Sincronizado</span>
      </div>
    );
  }

  return null;
}
