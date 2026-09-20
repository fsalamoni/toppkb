/**
 * 🏋️ Treinamento · Metas (Curto/Médio/Longo Prazo)
 *
 * CRUD de metas físicas com horizonte e KPI de progresso.
 *
 * Sub-rota: /app/treinamento/metas
 */

import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GenericCRUDPage } from './GenericCRUDPage';
import { formatDate } from '@/lib/utils';

const HORIZONTES = [
  { value: 'curto', label: 'Curto (≤4 sem)' },
  { value: 'medio', label: 'Médio (1-6 meses)' },
  { value: 'longo', label: 'Longo (>6 meses)' },
];

const TIPOS_META = [
  { value: 'forca', label: '💪 Força' },
  { value: 'resistencia', label: '🫀 Resistência' },
  { value: 'mobilidade', label: '🤸 Mobilidade' },
  { value: 'composicao', label: '⚖️ Composição' },
  { value: 'habilidade', label: '🎯 Habilidade' },
  { value: 'consistencia', label: '📅 Consistência' },
];

const STATUS = [
  { value: 'andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'cancelada', label: 'Cancelada' },
];

function TreinamentoMetas() {
  return (
    <GenericCRUDPage
      titulo="Metas de Treinamento"
      icone="🎯"
      colecao="treinamento/metas"
      orderByField="prazo"
      orderDirection="asc"
      campos={[
        { name: 'titulo', label: 'Título da meta', type: 'text', required: true },
        {
          name: 'tipo',
          label: 'Tipo de meta',
          type: 'select',
          defaultValue: 'forca',
          options: TIPOS_META,
        },
        {
          name: 'horizonte',
          label: 'Horizonte temporal',
          type: 'select',
          defaultValue: 'medio',
          options: HORIZONTES,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          defaultValue: 'andamento',
          options: STATUS,
        },
        {
          name: 'prazo',
          label: 'Prazo final',
          type: 'date',
        },
        {
          name: 'valorInicial',
          label: 'Valor inicial (baseline)',
          type: 'number',
          step: 0.1,
        },
        {
          name: 'valorAlvo',
          label: 'Valor alvo',
          type: 'number',
          step: 0.1,
        },
        {
          name: 'unidade',
          label: 'Unidade (kg, cm, min, reps...)',
          type: 'text',
          placeholder: 'Ex: kg, min, reps',
        },
        {
          name: 'progresso',
          label: 'Progresso atual (0-100%)',
          type: 'range',
          min: 0,
          max: 100,
          step: 1,
          defaultValue: 0,
        },
        {
          name: 'descricao',
          label: 'Descrição / Estratégia',
          type: 'textarea',
        },
        {
          name: 'obstaculos',
          label: 'Obstáculos conhecidos',
          type: 'textarea',
        },
      ]}
      renderItem={(item: any) => <MetaCard item={item} />}
    />
  );
}

function MetaCard({ item }: { item: any }) {
  const horizonte = HORIZONTES.find((h) => h.value === item.horizonte);
  const tipo = TIPOS_META.find((t) => t.value === item.tipo);
  const status = STATUS.find((s) => s.value === item.status);
  const progresso = Number(item.progresso || 0);
  const valorAlvo = Number(item.valorAlvo || 0);
  const valorInicial = Number(item.valorInicial || 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {tipo && <Badge variant="outline">{tipo.label}</Badge>}
        {horizonte && (
          <Badge variant="outline" className="capitalize">
            {horizonte.label}
          </Badge>
        )}
        {status && (
          <Badge
            variant={
              item.status === 'concluida' ? 'default' :
              item.status === 'cancelada' ? 'outline' : 'outline'
            }
            className="capitalize"
          >
            {status.label}
          </Badge>
        )}
      </div>
      <div className="font-semibold">{item.titulo || 'Meta'}</div>
      <div className="text-xs text-muted-foreground">
        {item.prazo && `📅 Prazo: ${formatDate(item.prazo)}`}
      </div>

      {(valorAlvo > 0 || valorInicial > 0) && (
        <div className="text-sm">
          {valorInicial > 0 && (
            <span className="text-muted-foreground">Inicial: <strong>{valorInicial}{item.unidade}</strong></span>
          )}
          {valorInicial > 0 && valorAlvo > 0 && ' → '}
          {valorAlvo > 0 && (
            <span className="text-emerald-400">Alvo: <strong>{valorAlvo}{item.unidade}</strong></span>
          )}
        </div>
      )}

      {/* Barra de progresso */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold">{progresso}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 transition-all ${
              progresso >= 100 ? 'bg-emerald-500' :
              progresso >= 50 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, progresso)}%` }}
          />
        </div>
      </div>

      {item.descricao && (
        <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {item.descricao}
        </div>
      )}
      {item.obstaculos && (
        <div className="text-xs text-muted-foreground border-l-2 border-rose-500/50 pl-2 line-clamp-2">
          ⚠️ {item.obstaculos}
        </div>
      )}
    </div>
  );
}

export function TreinamentoMetasPage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <TreinamentoMetas />
      </div>
    </div>
  );
}
