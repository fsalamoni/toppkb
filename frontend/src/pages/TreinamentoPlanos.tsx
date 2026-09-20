/**
 * 🏋️ Treinamento · Planos (Curto/Médio/Longo Prazo)
 *
 * CRUD de planos de treino com horizonte temporal.
 * - Curto prazo: até 4 semanas
 * - Médio prazo: 1-6 meses
 * - Longo prazo: 6-36 meses
 *
 * Sub-rota: /app/treinamento/planos
 */

import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GenericCRUDPage } from './GenericCRUDPage';
import { formatDate } from '@/lib/utils';

const HORIZONTES = [
  { value: 'curto', label: 'Curto (≤4 sem)', cor: 'amber' },
  { value: 'medio', label: 'Médio (1-6 meses)', cor: 'blue' },
  { value: 'longo', label: 'Longo (>6 meses)', cor: 'purple' },
];

const STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

function TreinamentoPlanos() {
  return (
    <GenericCRUDPage
      titulo="Planos de Treinamento"
      icone="📋"
      colecao="treinamento/planos"
      orderByField="dataInicio"
      orderDirection="desc"
      campos={[
        {
          name: 'titulo',
          label: 'Título do plano',
          type: 'text',
          required: true,
        },
        {
          name: 'horizonte',
          label: 'Horizonte temporal',
          type: 'select',
          required: true,
          defaultValue: 'medio',
          options: HORIZONTES,
        },
        {
          name: 'dataInicio',
          label: 'Data de início',
          type: 'date',
          required: true,
        },
        {
          name: 'dataFim',
          label: 'Data de término (prevista)',
          type: 'date',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          defaultValue: 'rascunho',
          options: STATUS,
        },
        {
          name: 'objetivoPrincipal',
          label: 'Objetivo principal',
          type: 'text',
          placeholder: 'Ex: Aumentar TGU para 24kg',
        },
        {
          name: 'frequenciaSemanal',
          label: 'Frequência semanal (dias)',
          type: 'number',
          min: 1,
          max: 7,
          step: 1,
          defaultValue: 3,
        },
        {
          name: 'descricao',
          label: 'Descrição / Estratégia',
          type: 'textarea',
          placeholder: 'Detalhes do plano, fases, prioridades...',
        },
        {
          name: 'criteriosSucesso',
          label: 'Critérios de sucesso',
          type: 'textarea',
          placeholder: 'Como saberemos se o plano deu certo?',
        },
      ]}
      renderItem={(item: any) => (
        <PlanoCard item={item} />
      )}
    />
  );
}

function PlanoCard({ item }: { item: any }) {
  const horizonte = HORIZONTES.find((h) => h.value === item.horizonte);
  const status = STATUS.find((s) => s.value === item.status);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="capitalize">
          {horizonte?.label || item.horizonte || 'médio'}
        </Badge>
        <Badge
          variant={item.status === 'ativo' ? 'default' : 'outline'}
          className="capitalize"
        >
          {status?.label || item.status || 'rascunho'}
        </Badge>
        {item.frequenciaSemanal && (
          <Badge variant="outline">{item.frequenciaSemanal}x/sem</Badge>
        )}
      </div>
      <div className="font-semibold">{item.titulo || 'Plano'}</div>
      <div className="text-xs text-muted-foreground">
        {item.dataInicio && `📅 Início: ${formatDate(item.dataInicio)}`}
        {item.dataFim && ` · Término: ${formatDate(item.dataFim)}`}
      </div>
      {item.objetivoPrincipal && (
        <div className="text-sm">
          <span className="text-emerald-400">🎯</span> {item.objetivoPrincipal}
        </div>
      )}
      {item.descricao && (
        <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {item.descricao}
        </div>
      )}
      {item.criteriosSucesso && (
        <div className="text-xs text-muted-foreground border-l-2 border-amber-500/50 pl-2 line-clamp-2">
          ✅ {item.criteriosSucesso}
        </div>
      )}
    </div>
  );
}

// Wrap com header customizado (voltar + breadcrumb)
export function TreinamentoPlanosPage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <TreinamentoPlanos />
      </div>
    </div>
  );
}
