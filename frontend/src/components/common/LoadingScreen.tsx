import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

const sizeMap: Record<string, string> = {
  sm: 'h-3 w-3',
  default: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function Spinner({
  className,
  size = 'default',
}: {
  className?: string;
  size?: keyof typeof sizeMap | string;
}) {
  const sizeClass = sizeMap[size as string] || sizeMap.default;
  return <Loader2 className={`${sizeClass} animate-spin ${className || ''}`} />;
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
  icone,
  title,
  titulo,
  description,
  descricao,
  action,
  acao,
}: {
  icon?: ReactNode;
  icone?: ReactNode;
  title?: string;
  titulo?: string;
  description?: string;
  descricao?: string;
  action?: ReactNode;
  acao?: ReactNode;
}) {
  const _icon = icon ?? icone;
  const _title = title ?? titulo ?? '';
  const _description = description ?? descricao;
  const _action = action ?? acao;
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 gap-3">
      {_icon && <div className="text-muted-foreground">{_icon}</div>}
      <h3 className="text-lg font-semibold">{_title}</h3>
      {_description && <p className="text-sm text-muted-foreground max-w-md">{_description}</p>}
      {_action}
    </div>
  );
}
