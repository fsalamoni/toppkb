import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  titulo: string;
  valor: string | number;
  unidade?: string;
  variacao?: number;
  variacaoLabel?: string;
  icone?: React.ReactNode;
  descricao?: string;
  className?: string;
}

export function StatCard({ titulo, valor, unidade, variacao, variacaoLabel, icone, descricao, className }: StatCardProps) {
  const VariacaoIcon = !variacao ? Minus : variacao > 0 ? TrendingUp : TrendingDown;
  const variacaoClass = !variacao
    ? 'text-muted-foreground'
    : variacao > 0
    ? 'text-green-500'
    : 'text-red-500';

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase text-muted-foreground font-medium tracking-wide">{titulo}</p>
            <p className="mt-1 text-2xl font-bold">
              {valor}
              {unidade && <span className="ml-1 text-base font-normal text-muted-foreground">{unidade}</span>}
            </p>
            {variacao !== undefined && (
              <div className={cn('mt-1 flex items-center text-xs', variacaoClass)}>
                <VariacaoIcon className="h-3 w-3 mr-1" />
                {Math.abs(variacao).toFixed(1)}%
                {variacaoLabel && <span className="ml-1 text-muted-foreground">{variacaoLabel}</span>}
              </div>
            )}
            {descricao && <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>}
          </div>
          {icone && <div className="text-muted-foreground">{icone}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
