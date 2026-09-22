/**
 * VirtualList — lista virtualizada para grandes volumes de dados
 *
 * Renderiza apenas os items visíveis na viewport (windowing).
 * Suporta:
 * - Auto-size (altura do container) ou fixed
 * - Item renderer customizado
 * - Empty state
 * - Loading state
 *
 * @example
 *   <VirtualList
 *     items={items}
 *     itemHeight={72}
 *     renderItem={(item) => <div>{item.name}</div>}
 *   />
 */
import { useRef, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  /** Altura de cada item (px) */
  itemHeight: number;
  /** Função para renderizar cada item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Quantos items extras renderizar fora da viewport (default 5) */
  overscan?: number;
  /** Altura do container (default 'auto' = preenche parent) */
  height?: number | string;
  /** Classes adicionais */
  className?: string;
  /** Mensagem quando items está vazio */
  emptyMessage?: ReactNode;
  /** Loading state */
  loading?: boolean;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  height = 400,
  className,
  emptyMessage,
  loading = false,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    typeof height === 'number' ? height : 400,
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const updateHeight = () => {
      setContainerHeight(el.clientHeight);
    };

    updateHeight();

    const onScroll = () => {
      setScrollTop(el.scrollTop);
    };

    el.addEventListener('scroll', onScroll);
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div
        ref={containerRef}
        className={cn('overflow-auto', className)}
        style={{ height }}
      >
        <div className="p-4 text-center text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn('overflow-auto', className)}
        style={{ height }}
      >
        {emptyMessage ?? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhum item
          </div>
        )}
      </div>
    );
  }

  // Calcular range visível
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
      role="list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, i) => (
            <div
              key={startIndex + i}
              role="listitem"
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
