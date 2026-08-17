import { GenericCRUDPage } from './GenericCRUDPage';

export function Cardio() {
  return (
    <GenericCRUDPage
      titulo="Cardio"
      icone="🏃"
      colecao="cardio"
      campos={[
        { name: 'data', label: 'Data', type: 'datetime-local', required: true },
        { name: 'duracaoMin', label: 'Duração (min)', type: 'number', defaultValue: 30, required: true },
        {
          name: 'tipo', label: 'Tipo', type: 'select', required: true,
          options: [
            { value: 'caminhada', label: 'Caminhada' },
            { value: 'corrida', label: 'Corrida' },
            { value: 'bike', label: 'Bike' },
            { value: 'eliptico', label: 'Elíptico' },
            { value: 'nado', label: 'Natação' },
          ],
        },
        { name: 'intensidadeMedia', label: 'FC média (bpm)', type: 'number', defaultValue: 120 },
        { name: 'intensidadeMax', label: 'FC máx (bpm)', type: 'number', defaultValue: 145 },
        { name: 'calorias', label: 'Calorias', type: 'number' },
        { name: 'observacoes', label: 'Observações', type: 'textarea' },
      ]}
    />
  );
}
