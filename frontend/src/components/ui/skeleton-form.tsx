/**
 * SkeletonForm — skeleton padronizado para Forms em loading
 *
 * Mostra placeholders estruturados para Forms antes dos dados chegarem.
 * Segue o padrão visual dos Forms do app (Header + Fields + Button)
 *
 * Variantes:
 * - small: 1 field + 1 button (Forms simples: boolean toggle)
 * - medium: 3-5 fields + button (Forms típicos)
 * - large: 6+ fields + sections (Forms complexos)
 */
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface SkeletonFormProps {
  variant?: 'small' | 'medium' | 'large';
  /** Número de fields (sobrepõe variant) */
  fieldCount?: number;
  /** Tem textarea? */
  hasTextarea?: boolean;
  /** Tem select? */
  hasSelect?: boolean;
  /** Tem header com título + descrição? */
  hasHeader?: boolean;
  className?: string;
}

export function SkeletonForm({
  variant = 'medium',
  fieldCount,
  hasTextarea,
  hasSelect,
  hasHeader = true,
  className,
}: SkeletonFormProps) {
  const defaults: Record<'small' | 'medium' | 'large', { count: number; hasTextarea: boolean; hasSelect: boolean }> = {
    small: { count: 1, hasTextarea: false, hasSelect: false },
    medium: { count: 4, hasTextarea: false, hasSelect: true },
    large: { count: 7, hasTextarea: true, hasSelect: true },
  };
  const variantDefaults = defaults[variant];

  const count = fieldCount ?? variantDefaults.count;
  // Se hasTextarea foi explicitamente passado, usa. Caso contrário usa o default da variant.
  const showTextarea = hasTextarea !== undefined ? hasTextarea : variantDefaults.hasTextarea;
  const showSelect = hasSelect !== undefined ? hasSelect : variantDefaults.hasSelect;

  return (
    <div className={cn('space-y-6', className)} aria-busy="true" aria-live="polite">
      {hasHeader && (
        <div className="space-y-2">
          <Skeleton className="h-7 w-2/3" /> {/* título */}
          <Skeleton className="h-4 w-1/2" /> {/* descrição */}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-1/4" /> {/* label */}
            {showSelect && i === 0 ? (
              <Skeleton className="h-10 w-full" />
            ) : showTextarea && i === count - 1 ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <Skeleton className="h-10 w-full" />
            )}
          </div>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2 pt-4 border-t">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}
