import { GenericCRUDPage } from './GenericCRUDPage';

export function Agua() {
  return (
    <GenericCRUDPage
      titulo="Água"
      icone="💧"
      colecao="agua"
      campos={[
        { name: 'data', label: 'Data/hora', type: 'datetime-local', required: true },
        { name: 'quantidadeMl', label: 'Quantidade (ml)', type: 'number', defaultValue: 250, required: true },
        {
          name: 'contexto', label: 'Contexto', type: 'select',
          options: [
            { value: 'pre-treino', label: 'Pré-treino' },
            { value: 'durante-treino', label: 'Durante treino' },
            { value: 'pos-treino', label: 'Pós-treino' },
            { value: 'dia-normal', label: 'Dia normal' },
          ],
        },
      ]}
    />
  );
}
