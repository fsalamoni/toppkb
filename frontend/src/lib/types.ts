// Tipos compartilhados do Top Pickleball 50+

export interface Treino {
  id?: string;
  uid: string;
  data: string;
  tipo: 'quadra' | 'parede' | 'tecnico' | 'fisico' | 'tatico' | 'alongamento' | 'visualizacao' | 'recuperacao' | 'outro';
  categoria?: 'leve' | 'moderado' | 'intenso' | 'muito-intenso';
  duracaoMin: number;
  local?: string;
  comQuem?: string;
  intensidade?: number;
  rpe?: number;
  energia?: number;
  humor?: number;
  drills?: Array<{ id: string; nome: string; categoria: string; duracaoMin?: number; series?: number; repeticoes?: number; observacoes?: string }>;
  drillsRealizados?: any[];
  parceiros?: string[];
  sensacoes?: string;
  conquistas?: string;
  dificuldades?: string;
  proximosPassos?: string;
  observacoes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Partida {
  id?: string;
  uid: string;
  data: string;
  tipo: 'simples' | 'duplas' | 'mista' | 'torneio' | 'amistoso' | 'treino';
  local: string;
  modalidade: 'simples' | 'duplas';
  duracaoMin: number;
  resultado: 'vitoria' | 'derrota' | 'empate';
  placar: string;
  setsVencidos?: number;
  setsPerdidos?: number;
  winners?: number;
  unforcedErrors?: number;
  aces?: number;
  parceiroDupla?: string;
  adversario1?: string;
  adversario2?: string;
  observacoesTaticas?: string;
  pontosFortes?: string;
  pontosFracos?: string;
  proximosTreinos?: string;
  estadoEmocional?: string;
  observacoes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Preparacao {
  id?: string;
  uid: string;
  data: string;
  tipo: 'forca' | 'cardio' | 'mobilidade' | 'core' | 'agilidade' | 'recuperacao';
  duracaoMin: number;
  intensidade: number;
  rpe?: number;
  local?: string;
  exercicios?: Array<{ id: string; nome: string; grupo: string; series?: number; repeticoes?: string; carga?: string; observacoes?: string }>;
  aquecimentoMin?: number;
  desaquecimentoMin?: number;
  energia?: number;
  recuperacao?: string;
  observacoes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  cidade?: string;
  estado?: string;
  parceiroDuplas?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}
