import { GenericCRUDPage } from './GenericCRUDPage';

export function Forca() {
  return (
    <GenericCRUDPage
      titulo="Força"
      icone="🏋️"
      colecao="forca"
      campos={[
        { name: 'data', label: 'Data', type: 'datetime-local', required: true },
        { name: 'duracaoMin', label: 'Duração (min)', type: 'number', defaultValue: 45, required: true },
        {
          name: 'divisao', label: 'Divisão', type: 'select', required: true,
          options: [
            { value: 'A', label: 'A — Peito/Ombro/Tri' },
            { value: 'B', label: 'B — Costa/Bi' },
            { value: 'C', label: 'C — Pernas' },
            { value: 'fullbody', label: 'Full body' },
          ],
        },
        { name: 'rpeMedio', label: 'RPE médio', type: 'range', min: 1, max: 10, defaultValue: 7 },
        { name: 'observacoes', label: 'Observações', type: 'textarea' },
      ]}
      renderItem={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.divisao}</span>
            <span className="text-xs text-muted-foreground">{item.duracaoMin}min • RPE {item.rpeMedio}</span>
          </div>
          {item.observacoes && <p className="text-sm mt-1">{item.observacoes}</p>}
        </div>
      )}
    />
  );
}
