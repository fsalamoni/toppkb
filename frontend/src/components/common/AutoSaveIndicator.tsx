/**
 * AutoSaveIndicator — indicador visual de auto-save
 *
 * Mostra:
 * - "Salvando..." enquanto debounce
 * - "Salvo às HH:MM:SS" depois do save
 * - Botão "Limpar rascunho" se houver rascunho
 *
 * USO:
 *   const { savedAt, clear } = useFormAutoSave({...});
 *   <AutoSaveIndicator savedAt={savedAt} onClear={clear} />
 */
import { Check, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  savedAt: Date | null;
  saving?: boolean;
  error?: string | null;
  onClear?: () => void;
  className?: string;
}

export function AutoSaveIndicator({
  savedAt,
  saving = false,
  error = null,
  onClear,
  className,
}: AutoSaveIndicatorProps) {
  if (error) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-red-500',
          className,
        )}
        role="alert"
      >
        <AlertCircle className="h-3 w-3" />
        <span>Erro ao salvar rascunho</span>
      </div>
    );
  }

  if (saving) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
        <span>Salvando rascunho...</span>
      </div>
    );
  }

  if (savedAt) {
    return (
      <div className={cn('inline-flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Check className="h-3 w-3 text-green-500" />
        <span>
          Rascunho salvo às{' '}
          <time dateTime={savedAt.toISOString()}>{formatTime(savedAt)}</time>
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
            aria-label="Limpar rascunho"
          >
            <Trash2 className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground/50', className)}>
      <span>Auto-save ativado</span>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
