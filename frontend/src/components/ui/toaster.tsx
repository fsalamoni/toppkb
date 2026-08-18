import { useUIStore } from '@/stores/uiStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertCircle : Info;
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 min-w-[300px] max-w-md px-4 py-3 rounded-md border shadow-md bg-card',
              t.type === 'success' && 'border-green-500/30',
              t.type === 'error' && 'border-red-500/30',
              t.type === 'info' && 'border-blue-500/30',
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                t.type === 'success' && 'text-green-500',
                t.type === 'error' && 'text-red-500',
                t.type === 'info' && 'text-blue-500',
              )}
            />
            <span className="flex-1 text-sm">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Compat: função `toast` estilo shadcn
export function toast({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) {
  const addToast = useUIStore.getState().addToast;
  const type = variant === 'destructive' ? 'error' : variant === 'success' ? 'success' : 'info';
  addToast({ type, message: description ? `${title}: ${description}` : title });
}
