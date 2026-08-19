import { useUIStore } from '@/stores/uiStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertCircle : t.type === 'warning' ? AlertCircle : Info;
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 min-w-[300px] max-w-md px-4 py-3 rounded-md border shadow-md bg-card',
              t.type === 'success' && 'border-green-500/30',
              t.type === 'error' && 'border-red-500/30',
              t.type === 'warning' && 'border-amber-500/30',
              t.type === 'info' && 'border-blue-500/30',
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                t.type === 'success' && 'text-green-500',
                t.type === 'error' && 'text-red-500',
                t.type === 'warning' && 'text-amber-500',
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

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default' | 'destructive';
type ToastArgs = string | { title?: string; description?: string; variant?: ToastType; message?: string };

function addToastFromArgs(args: ToastArgs) {
  const addToast = useUIStore.getState().addToast;
  // Se for string simples
  if (typeof args === 'string') {
    addToast({ type: 'info', message: args });
    return;
  }
  // Se for objeto shadcn-style
  const variant: ToastType = (args.variant as ToastType) || 'default';
  const type: any = variant === 'destructive' ? 'error' : (variant === 'default' ? 'info' : variant);
  const message = args.message
    || (args.description ? `${args.title ? args.title + ': ' : ''}${args.description}` : args.title)
    || '';
  if (message) addToast({ type, message });
}

// Função `toast` estilo shadcn (mantém compat)
function toastShadcn(args: { title: string; description?: string; variant?: ToastType }) {
  addToastFromArgs(args);
}

// Função estilo sonner (recomendada)
toastShadcn.success = (msg: string) => addToastFromArgs({ message: msg, variant: 'success' });
toastShadcn.error = (msg: string) => addToastFromArgs({ message: msg, variant: 'error' });
toastShadcn.warning = (msg: string) => addToastFromArgs({ message: msg, variant: 'warning' });
toastShadcn.info = (msg: string) => addToastFromArgs({ message: msg, variant: 'info' });

export const toast = toastShadcn as typeof toastShadcn & {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
};
