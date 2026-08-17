import { GenericCRUDPage } from './GenericCRUDPage';

export function Medidas() {
  return (
    <GenericCRUDPage
      titulo="Medidas"
      icone="📏"
      colecao="medidas"
      campos={[
        { name: 'data', label: 'Data', type: 'date', required: true },
        { name: 'cintura', label: 'Cintura (cm)', type: 'number', step: 0.1 },
        { name: 'quadril', label: 'Quadril (cm)', type: 'number', step: 0.1 },
        { name: 'coxaDireita', label: 'Coxa D (cm)', type: 'number', step: 0.1 },
        { name: 'coxaEsquerda', label: 'Coxa E (cm)', type: 'number', step: 0.1 },
        { name: 'bracoDireito', label: 'Braço D (cm)', type: 'number', step: 0.1 },
        { name: 'bracoEsquerdo', label: 'Braço E (cm)', type: 'number', step: 0.1 },
        { name: 'percentualGordura', label: '% gordura', type: 'number', step: 0.1 },
      ]}
    />
  );
}
