/**
 * ServiceWorkerUpdateBanner — banner para notificar usuário sobre nova versão
 *
 * Aparece quando:
 * - Service Worker detectou uma nova versão
 * - Usuário ainda não dispensou
 *
 * Ações:
 * - "Atualizar agora" → aplica o SW + reload
 * - "Mais tarde" → dispensa por enquanto
 *
 * Posição: fixed bottom-center (não conflita com OfflineBanner que é top)
 */
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { cn } from '@/lib/utils';

export function ServiceWorkerUpdateBanner() {
  const { needsUpdate, downloading, error, applyUpdate, dismiss } = useServiceWorkerUpdate();

  if (!needsUpdate && !error) return null;

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 z-40',
          'max-w-md w-full px-4 py-3 rounded-lg',
          'bg-red-500/95 text-white shadow-lg border border-red-600',
          'flex items-center gap-3',
        )}
      >
        <X className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 text-sm">
          Erro ao atualizar app. Recarregue manualmente.
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-medium underline"
        >
          Recarregar
        </button>
        <button
          onClick={dismiss}
          className="text-white/80 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-40',
        'max-w-md w-full px-4 py-3 rounded-lg',
        'bg-gradient-to-r from-emerald-500 to-cyan-500',
        'text-white shadow-lg',
        'flex items-center gap-3',
      )}
    >
      <Sparkles className="h-5 w-5 flex-shrink-0" aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold flex items-center gap-1">
          Nova versão disponível!
        </div>
        <div className="text-xs opacity-90 truncate">
          Atualize para ter as últimas melhorias.
        </div>
      </div>

      <button
        onClick={applyUpdate}
        disabled={downloading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
          'bg-white/20 hover:bg-white/30 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <RefreshCw className={cn('h-3.5 w-3.5', downloading && 'animate-spin')} aria-hidden="true" />
        <span>{downloading ? 'Aplicando...' : 'Atualizar'}</span>
      </button>

      <button
        onClick={dismiss}
        className="text-white/80 hover:text-white p-1"
        aria-label="Atualizar depois"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
