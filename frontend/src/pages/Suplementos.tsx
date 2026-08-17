import { GenericCRUDPage } from './GenericCRUDPage';

export function Suplementos() {
  return (
    <GenericCRUDPage
      titulo="Suplementos"
      icone="💊"
      colecao="suplementos"
      campos={[
        { name: 'data', label: 'Data/hora', type: 'datetime-local', required: true },
        { name: 'nome', label: 'Nome', type: 'text', required: true, defaultValue: 'creatina' },
        { name: 'dose', label: 'Dose', type: 'text', required: true, defaultValue: '5g' },
        {
          name: 'horario', label: 'Horário', type: 'select', required: true,
          options: [
            { value: 'cafe', label: 'Café' },
            { value: 'almoco', label: 'Almoço' },
            { value: 'jantar', label: 'Jantar' },
            { value: 'pre-treino', label: 'Pré-treino' },
            { value: 'pos-treino', label: 'Pós-treino' },
            { value: 'ao-deitar', label: 'Ao deitar' },
          ],
        },
      ]}
    />
  );
}
