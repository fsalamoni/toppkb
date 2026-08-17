import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  label: string;
  atual: number;
  meta: number;
  unidade?: string;
  className?: string;
  inverse?: boolean; // true se for "menos é melhor" (ex: peso, dor)
}

export function ProgressBar({ label, atual, meta, unidade, className, inverse }: ProgressBarProps) {
  const diferenca = meta - atual;
  const atingido = inverse ? atual <= meta : atual >= meta;
  const max = Math.max(atual, meta) * 1.2 || 100;
  const porcentagemAtual = Math.min((atual / max) * 100, 100);
  const porcentagemMeta = Math.min((meta / max) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {atual}{unidade} / {meta}{unidade}
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-secondary">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            atingido ? 'bg-green-500' : 'bg-yellow-500',
          )}
          style={{ width: `${porcentagemAtual}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/40"
          style={{ left: `${porcentagemMeta}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {atingido ? '✓ Meta atingida' : `Faltam ${Math.abs(diferenca).toFixed(1)}${unidade}`}
        </span>
      </div>
    </div>
  );
}

interface MetaListProps {
  titulo: string;
  descricao?: string;
  metas: Array<{ label: string; atual: number; meta: number; unidade?: string; inverse?: boolean }>;
}

export function MetaList({ titulo, descricao, metas }: MetaListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {metas.map((m, i) => (
          <ProgressBar key={i} {...m} />
        ))}
      </CardContent>
    </Card>
  );
}
