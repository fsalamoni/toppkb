import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

export function LoadingScreen({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 gap-3">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
      {action}
    </div>
  );
}
