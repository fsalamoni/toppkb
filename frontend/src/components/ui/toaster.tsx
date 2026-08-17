import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export const toast = (t: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).slice(2);
  const event = new CustomEvent('toppkb-toast', { detail: { id, ...t } });
  window.dispatchEvent(event);
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      setToasts((curr) => [...curr, t]);
      setTimeout(() => {
        setToasts((curr) => curr.filter((x) => x.id !== t.id));
      }, t.duration || 4000);
    };
    window.addEventListener('toppkb-toast', handler);
    return () => window.removeEventListener('toppkb-toast', handler);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg animate-fade-in',
            'min-w-[300px] max-w-md',
            t.variant === 'destructive' && 'border-red-500',
            t.variant === 'success' && 'border-green-500',
          )}
        >
          {t.variant === 'destructive' ? (
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-medium text-sm">{t.title}</div>
            {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
          </div>
          <button onClick={() => setToasts((c) => c.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
