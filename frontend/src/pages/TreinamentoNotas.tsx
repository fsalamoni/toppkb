/**
 * 🏋️ Treinamento · Notas Livres
 *
 * CRUD de notas / observações livres sobre treinos.
 *
 * Sub-rota: /app/treinamento/notas
 */

import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GenericCRUDPage } from './GenericCRUDPage';
import { formatDate } from '@/lib/utils';

const CATEGORIAS = [
  { value: 'aprendizado', label: '💡 Aprendizado' },
  { value: 'observacao', label: '👀 Observação' },
  { value: 'ideia', label: '💭 Ideia' },
  { value: 'problema', label: '⚠️ Problema' },
  { value: 'inspiracao', label: '✨ Inspiração' },
  { value: 'feedback', label: '📝 Feedback' },
];

const PRIORIDADES = [
  { value: 'baixa', label: '🟢 Baixa' },
  { value: 'media', label: '🟡 Média' },
  { value: 'alta', label: '🔴 Alta' },
];

function TreinamentoNotas() {
  return (
    <GenericCRUDPage
      titulo="Notas de Treinamento"
      icone="📝"
      colecao="treinamento/notas"
      orderByField="data"
      orderDirection="desc"
      campos={[
        {
          name: 'titulo',
          label: 'Título (opcional)',
          type: 'text',
          placeholder: 'Resumo da nota',
        },
        {
          name: 'data',
          label: 'Data',
          type: 'datetime-local',
          required: true,
        },
        {
          name: 'categoria',
          label: 'Categoria',
          type: 'select',
          defaultValue: 'observacao',
          options: CATEGORIAS,
        },
        {
          name: 'prioridade',
          label: 'Prioridade',
          type: 'select',
          defaultValue: 'media',
          options: PRIORIDADES,
        },
        {
          name: 'tags',
          label: 'Tags (separadas por vírgula)',
          type: 'text',
          placeholder: 'kb, swing, joelho',
        },
        {
          name: 'conteudo',
          label: 'Conteúdo da nota',
          type: 'textarea',
          required: true,
        },
        {
          name: 'relacionado',
          label: 'Relacionado a (opcional)',
          type: 'text',
          placeholder: 'Ex: sessão de 2025-09-15, TGU, joelho D...',
        },
      ]}
      renderItem={(item: any) => <NotaCard item={item} />}
    />
  );
}

function NotaCard({ item }: { item: any }) {
  const categoria = CATEGORIAS.find((c) => c.value === item.categoria);
  const prioridade = PRIORIDADES.find((p) => p.value === item.prioridade);
  const tags = typeof item.tags === 'string' && item.tags
    ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {categoria && <Badge variant="outline">{categoria.label}</Badge>}
        {prioridade && (
          <Badge variant="outline" className="capitalize">
            {prioridade.label}
          </Badge>
        )}
        <div className="text-xs text-muted-foreground">
          {item.data && formatDate(item.data)}
        </div>
      </div>
      {item.titulo && (
        <div className="font-semibold">{item.titulo}</div>
      )}
      <div className="text-sm whitespace-pre-wrap line-clamp-6">
        {item.conteudo || 'Sem conteúdo'}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t: string, i: number) => (
            <Badge key={i} variant="outline" className="text-xs">
              #{t}
            </Badge>
          ))}
        </div>
      )}
      {item.relacionado && (
        <div className="text-xs text-muted-foreground">
          🔗 {item.relacionado}
        </div>
      )}
    </div>
  );
}

export function TreinamentoNotasPage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <TreinamentoNotas />
      </div>
    </div>
  );
}
