/**
 * EmptyState — estado vazio reutilizável com ilustração SVG opcional.
 *
 * Substitui o EmptyState simples do LoadingScreen.tsx por uma versão
 * mais rica visualmente, com ilustração SVG padrão para cada categoria.
 *
 * Categorias disponíveis:
 * - 'default' — ilustração genérica de documento vazio
 * - 'training' — haltere/peso
 * - 'match' — bola de tênis
 * - 'food' — prato/comida
 * - 'sleep' — lua
 * - 'weight' — balança
 * - 'pain' — coração
 * - 'trophy' — troféu
 * - 'water' — gota
 * - 'chat' — balão de conversa
 * - 'chart' — gráfico
 * - 'user' — usuário
 * - 'error' — exclamação (estado de erro)
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IllustrationType =
  | 'default'
  | 'training'
  | 'match'
  | 'food'
  | 'sleep'
  | 'weight'
  | 'pain'
  | 'trophy'
  | 'water'
  | 'chat'
  | 'chart'
  | 'user'
  | 'error';

interface EmptyStateProps {
  icon?: ReactNode;
  icone?: ReactNode;
  title?: string;
  titulo?: string;
  description?: string;
  descricao?: string;
  action?: ReactNode;
  acao?: ReactNode;
  illustration?: IllustrationType;
  className?: string;
}

const COLORS: Record<IllustrationType, { bg: string; fg: string }> = {
  default: { bg: 'bg-muted', fg: 'text-muted-foreground' },
  training: { bg: 'bg-emerald-500/10', fg: 'text-emerald-500' },
  match: { bg: 'bg-amber-500/10', fg: 'text-amber-500' },
  food: { bg: 'bg-orange-500/10', fg: 'text-orange-500' },
  sleep: { bg: 'bg-purple-500/10', fg: 'text-purple-500' },
  weight: { bg: 'bg-cyan-500/10', fg: 'text-cyan-500' },
  pain: { bg: 'bg-rose-500/10', fg: 'text-rose-500' },
  trophy: { bg: 'bg-yellow-500/10', fg: 'text-yellow-500' },
  water: { bg: 'bg-blue-500/10', fg: 'text-blue-500' },
  chat: { bg: 'bg-indigo-500/10', fg: 'text-indigo-500' },
  chart: { bg: 'bg-pink-500/10', fg: 'text-pink-500' },
  user: { bg: 'bg-violet-500/10', fg: 'text-violet-500' },
  error: { bg: 'bg-red-500/10', fg: 'text-red-500' },
};

export function EmptyState({
  icon, icone,
  title, titulo,
  description, descricao,
  action, acao,
  illustration = 'default',
  className,
}: EmptyStateProps) {
  const _icon = icon ?? icone;
  const _title = title ?? titulo ?? '';
  const _description = description ?? descricao;
  const _action = action ?? acao;
  const palette = COLORS[illustration];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 gap-4',
        'rounded-lg border border-border bg-card',
        className,
      )}
    >
      {/* Ilustração SVG padrão */}
      {_icon ? (
        <div className={cn('text-5xl', palette.fg)} aria-hidden="true">
          {_icon}
        </div>
      ) : (
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full',
            palette.bg,
          )}
          aria-hidden="true"
        >
          <IllustrationSVG type={illustration} />
        </div>
      )}

      {/* Título */}
      {_title && (
        <h3 className={cn('text-lg font-semibold', palette.fg)}>
          {_title}
        </h3>
      )}

      {/* Descrição */}
      {_description && (
        <p className="text-sm text-muted-foreground max-w-md">
          {_description}
        </p>
      )}

      {/* Ação */}
      {_action && (
        <div className="mt-2">
          {_action}
        </div>
      )}
    </div>
  );
}

function IllustrationSVG({ type }: { type: IllustrationType }) {
  const cls = 'h-12 w-12';
  switch (type) {
    case 'training':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          <circle cx="7" cy="6.75" r="2" fill="currentColor" />
          <circle cx="17" cy="6.75" r="2" fill="currentColor" />
          <circle cx="7" cy="17.25" r="2" fill="currentColor" />
          <circle cx="17" cy="17.25" r="2" fill="currentColor" />
        </svg>
      );
    case 'match':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 3v18M3 12h18M5.5 5.5l13 13M5.5 18.5l13-13" />
        </svg>
      );
    case 'food':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 009-9 9 9 0 00-9-9 9 9 0 00-9 9 9 9 0 009 9z" />
          <path strokeLinecap="round" d="M9 9l3-3 3 3M12 6v6M8 14c0-2 4-2 4 0M16 14c0-2-4-2-4 0" />
        </svg>
      );
    case 'sleep':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      );
    case 'weight':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <rect x="3" y="9" width="18" height="6" rx="3" />
          <path strokeLinecap="round" d="M3 12h18M12 9v6M8 12h.01M16 12h.01" />
        </svg>
      );
    case 'pain':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'trophy':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.003 6.003 0 002.48 5.272M12 14.25c-1.297 0-2.5-.394-3.5-1.062" />
        </svg>
      );
    case 'water':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.929 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      );
    case 'chart':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case 'error':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      );
    case 'default':
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
  }
}

export default EmptyState;
