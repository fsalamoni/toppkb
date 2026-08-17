import { GenericCRUDPage } from './GenericCRUDPage';

export function Metas() {
  return (
    <GenericCRUDPage
      titulo="Metas SMART"
      icone="🎯"
      colecao="metas"
      orderByField="prazo"
      orderDirection="asc"
      campos={[
        { name: 'titulo', label: 'Título', type: 'text', required: true },
        { name: 'descricao', label: 'Descrição', type: 'textarea' },
        {
          name: 'tipo', label: 'Tipo', type: 'select', required: true,
          options: [
            { value: 'peso', label: 'Peso' },
            { value: 'performance', label: 'Performance' },
            { value: 'competicao', label: 'Competição' },
            { value: 'saude', label: 'Saúde' },
            { value: 'habito', label: 'Hábito' },
            { value: 'aprendizado', label: 'Aprendizado' },
          ],
        },
        { name: 'prazo', label: 'Prazo', type: 'date', required: true },
        { name: 'valorAlvo', label: 'Valor alvo', type: 'text', required: true, defaultValue: '80kg' },
        { name: 'valorAtual', label: 'Valor atual', type: 'text' },
        {
          name: 'status', label: 'Status', type: 'select', required: true,
          options: [
            { value: 'ativa', label: 'Ativa' },
            { value: 'conquistada', label: 'Conquistada' },
            { value: 'pausada', label: 'Pausada' },
            { value: 'cancelada', label: 'Cancelada' },
          ],
        },
        { name: 'progresso', label: 'Progresso (%)', type: 'range', min: 0, max: 100, defaultValue: 0 },
      ]}
      renderItem={(item) => (
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{item.titulo}</div>
              <div className="text-sm text-muted-foreground">{item.descricao}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Prazo: {item.prazo} • {item.valorAlvo}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{item.progresso || 0}%</div>
              <div className="text-xs text-muted-foreground capitalize">{item.status}</div>
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary" style={{ width: `${item.progresso || 0}%` }} />
          </div>
        </div>
      )}
    />
  );
}
