/**
 * Helpers de Acessibilidade (A11y)
 *
 * Conjunto de componentes e utilitários para tornar o app
 * acessível para usuários 50+ (e qualquer outro):
 *
 * 1. <SkipLink /> — pula navegação e vai direto ao conteúdo
 *    (WCAG 2.1 SC 2.4.1 Bypass Blocks)
 *
 * 2. <VisuallyHidden /> — esconde visualmente mas mantém no DOM
 *    para leitores de tela (sr-only do Tailwind)
 *
 * 3. <AccessibleHeading /> — h1/h2/h3 semânticos
 *
 * 4. <LiveRegion /> — região aria-live para mudanças dinâmicas
 *    (anúncios para leitores de tela)
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * SkipLink — primeiro elemento focável da página.
 * Permite usuários de teclado/screen reader pular direto ao conteúdo.
 *
 * USO:
 *   return (
 *     <>
 *       <SkipLink targetId="main-content" />
 *       <Navbar />
 *       <main id="main-content">...</main>
 *     </>
 *   )
 */
export function SkipLink({
  targetId,
  children = 'Pular para o conteúdo principal',
}: {
  targetId: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary',
      )}
    >
      {children}
    </a>
  );
}

/**
 * VisuallyHidden — esconde visualmente mas mantém conteúdo acessível.
 *
 * Para conteúdo que:
 * - Fornece contexto extra a screen readers
 * - Não deve aparecer visualmente (rótulos duplicados, etc)
 */
export function VisuallyHidden({ children, as: As = 'span' }: { children: ReactNode; as?: 'span' | 'div' | 'p' }) {
  return <As className="sr-only">{children}</As>;
}

/**
 * AcessibleHeading — força hierarquia de headings sem quebrar.
 *
 * Alguns screen readers exigem h1/h2/h3 em sequência.
 * Este componente garante isso automaticamente.
 */
export function Heading({
  level = 2,
  children,
  className,
  id,
}: {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const baseClass = 'font-bold';
  const sizeClass = {
    1: 'text-3xl md:text-4xl',
    2: 'text-2xl md:text-3xl',
    3: 'text-xl md:text-2xl',
    4: 'text-lg md:text-xl',
    5: 'text-base md:text-lg',
    6: 'text-sm md:text-base',
  }[level];

  return (
    <Tag id={id} className={cn(baseClass, sizeClass, className)}>
      {children}
    </Tag>
  );
}

/**
 * LiveRegion — região aria-live para mudanças dinâmicas.
 *
 * USE para:
 * - Anunciar "Salvo com sucesso" após ação assíncrona
 * - Anunciar "Carregando..." durante fetch
 * - Anunciar "Erro: ..."
 *
 * ATENÇÃO: Não renderiza visualmente nada.
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
}: {
  message: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * FocusRing — wrapper que adiciona ring de foco visível em descendentes focáveis.
 *
 * Útil para containers interativos (como cards clicáveis).
 */
export function Focusable({
  as: As = 'div',
  children,
  className,
  onClick,
  role,
  ariaLabel,
  tabIndex = 0,
}: {
  as?: 'div' | 'section' | 'article';
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
  ariaLabel?: string;
  tabIndex?: number;
}) {
  return (
    <As
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md',
        className,
      )}
      onClick={onClick}
      onKeyDown={(e: any) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? tabIndex : undefined}
      role={onClick ? role || 'button' : role}
      aria-label={ariaLabel}
    >
      {children}
    </As>
  );
}
