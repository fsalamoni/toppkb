import { GenericCRUDPage } from './GenericCRUDPage';

export function Mobilidade() {
  return (
    <GenericCRUDPage
      titulo="Mobilidade"
      icone="🤸"
      colecao="mobilidade"
      campos={[
        { name: 'data', label: 'Data', type: 'datetime-local', required: true },
        { name: 'duracaoMin', label: 'Duração (min)', type: 'number', defaultValue: 15, required: true },
        {
          name: 'foco', label: 'Foco', type: 'select', required: true,
          options: [
            { value: 'geral', label: 'Geral' },
            { value: 'quadril', label: 'Quadril' },
            { value: 'ombro', label: 'Ombro' },
            { value: 'coluna', label: 'Coluna' },
            { value: 'tornozelo', label: 'Tornozelo' },
            { value: 'punho', label: 'Punho' },
          ],
        },
        { name: 'exercicios', label: 'Exercícios realizados', type: 'textarea' },
        { name: 'observacoes', label: 'Observações', type: 'textarea' },
      ]}
    />
  );
}
