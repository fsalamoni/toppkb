import { GenericCRUDPage } from './GenericCRUDPage';

export function Estudos() {
  return (
    <GenericCRUDPage
      titulo="Estudos"
      icone="📚"
      colecao="/app/estudos"
      campos={[
        { name: 'data', label: 'Data', type: 'datetime-local', required: true },
        { name: 'duracaoMin', label: 'Duração (min)', type: 'number', defaultValue: 30, required: true },
        {
          name: 'tipo', label: 'Tipo', type: 'select', required: true,
          options: [
            { value: 'regras', label: 'Regras' },
            { value: 'estrategia', label: 'Estratégia' },
            { value: 'video-tecnico', label: 'Vídeo técnico' },
            { value: 'video-tatico', label: 'Vídeo tático' },
            { value: 'analise-jogo', label: 'Análise de jogo' },
            { value: 'leitura', label: 'Leitura' },
          ],
        },
        { name: 'fonte', label: 'Fonte', type: 'text', required: true, defaultValue: 'PPA YouTube' },
        { name: 'topico', label: 'Tópico', type: 'text', required: true },
        { name: 'resumo', label: 'Resumo', type: 'textarea' },
        { name: 'oQueAplicar', label: 'O que aplicar?', type: 'textarea' },
      ]}
      renderItem={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.topico}</span>
            <span className="text-xs text-muted-foreground">• {item.fonte}</span>
          </div>
          {item.resumo && <p className="text-sm mt-1">{item.resumo}</p>}
        </div>
      )}
    />
  );
}
