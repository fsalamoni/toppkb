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
 *     renderItem={(item) => <Card>{item.name}</Card>}
 *     emptyState={<EmptyState ... />}
 *   />
 */
import { useRef, useState, useEffect, ReactNode } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  /** Altura fixa de cada item (px). Default: 64 */
  itemHeight?: number;
  /** Altura do container. Default: 600 */
  height?: number | string;
  /** Renderer para cada item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Função para extrair key do item. Default: index */
  getKey?: (item: T, index: number) => string | number;
  /** Componente mostrado quando items.length === 0 */
  emptyState?: ReactNode;
  /** Componente mostrado durante loading */
  loadingState?: ReactNode;
  /** Mensagem quando items > 100 */
  showCount?: boolean;
  /** ClassName adicional */
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight = 64,
  height = 600,
  renderItem,
  getKey,
  emptyState,
  loadingState,
  showCount = true,
  className,
}: VirtualListProps<T>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (items.length === 0) {
    return (
      <div ref={containerRef} className={cn('w-full', className)}>
        {emptyState || null}
      </div>
    );
  }

  const isFixed = typeof height === 'number';
  const containerHeight = isFixed ? height : size.height || 600;

  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      {showCount && items.length > 100 && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <span>📋</span>
          <span>{items.length.toLocaleString('pt-BR')} items (virtualizado)</span>
        </div>
      )}

      {loadingState}

      <FixedSizeList
        height={containerHeight}
        width="100%"
        itemCount={items.length}
        itemSize={itemHeight}
        itemKey={getKey ? (index) => String(getKey(items[index], index)) : (index) => String(index)}
        className="scrollbar-thin"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

export default VirtualList;
