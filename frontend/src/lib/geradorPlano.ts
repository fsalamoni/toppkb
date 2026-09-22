/**
 * 🏋️ Gerador Inteligente de Plano de Treino
 *
 * Recebe objetivo, frequência, duração, equipamento e nível → gera plano estruturado
 * semana-a-semana com sessões específicas (exercícios, séries, reps).
 *
 * Usa a biblioteca KB + periodização existente como base.
 */

import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';

export type Objetivo =
  | 'forca_geral'
  | 'hipertrofia'
  | 'perda_peso'
  | 'mobilidade'
  | 'condicionamento'
  | 'pickleball';

export type Nivel = 'iniciante' | 'intermediario' | 'avancado';

export type Equipamento =
  | 'kb_leve'
  | 'kb_completo'
  | 'peso_corporal'
  | 'academia_completa';

export interface SessaoPlano {
  id: string; // ex: s1a, s2b
  semanaIdx: number; // 0..N
  tipo: string; // A, B, C, D, E
  nome: string; // "Treino A — Peito/Costas"
  duracaoMin: number;
  foco: string; // descrição curta
  exercicios: {
    nome: string;
    id?: string; // ID do exercício na biblioteca (para abrir modal de detalhes)
    series: number;
    reps: string; // "8-10", "AMRAP", "30s"
    carga: string; // "16kg", "BW", "moderado"
    descansoSeg: number;
    rpeAlvo?: number;
  }[];
}

export interface Plano {
  id: string;
  nome: string;
  objetivo: Objetivo;
  nivel: Nivel;
  equipamento: Equipamento;
  duracaoSemanas: number;
  sessoesPorSemana: number;
  duracaoSessaoMin: number;
  criadoEm: string;
  ativo: boolean;
  sessoes: SessaoPlano[];
}

const OBJETIVOS_LABEL: Record<Objetivo, string> = {
  forca_geral: 'Força geral',
  hipertrofia: 'Hipertrofia',
  perda_peso: 'Perda de peso',
  mobilidade: 'Mobilidade & Saúde',
  condicionamento: 'Condicionamento',
  pickleball: 'Pickleball (transferência)',
};

const OBJETIVOS_ICONE: Record<Objetivo, string> = {
  forca_geral: '💪',
  hipertrofia: '🏗️',
  perda_peso: '🔥',
  mobilidade: '🧘',
  condicionamento: '⚡',
  pickleball: '🏓',
};

// ─────────────────────────────────────────────────────────────
//   Templates de divisão de treino por objetivo + frequência
// ─────────────────────────────────────────────────────────────

interface TipoSessao {
  tipo: string;
  nome: string;
  foco: string;
  padroes: string[]; // padrões KB
  duracaoPadraoMin: number;
}

const TIPOS_FORCA: Record<number, TipoSessao[]> = {
  2: [
    { tipo: 'A', nome: 'Full Body Força', foco: 'Todo o corpo, movimentos básicos', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 45 },
    { tipo: 'B', nome: 'Full Body Potência', foco: 'Movimentos explosivos', padroes: ['HINGE', 'COND', 'SQUAT', 'PRESS'], duracaoPadraoMin: 45 },
  ],
  3: [
    { tipo: 'A', nome: 'Empurrar + Pull', foco: 'Peito/costas/ombros', padroes: ['PRESS', 'PULL', 'SQUAT'], duracaoPadraoMin: 45 },
    { tipo: 'B', nome: 'Pernas + Posterior', foco: 'Quadríceps/posterior/glúteo', padroes: ['SQUAT', 'HINGE', 'CARRY'], duracaoPadraoMin: 45 },
    { tipo: 'C', nome: 'Full Body', foco: 'Força geral', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 45 },
  ],
  4: [
    { tipo: 'A', nome: 'Upper Push', foco: 'Empurrar superior', padroes: ['PRESS', 'PRESS'], duracaoPadraoMin: 40 },
    { tipo: 'B', nome: 'Lower', foco: 'Membros inferiores', padroes: ['SQUAT', 'HINGE', 'SQUAT'], duracaoPadraoMin: 40 },
    { tipo: 'C', nome: 'Upper Pull', foco: 'Puxar + costas', padroes: ['PULL', 'PULL', 'CARRY'], duracaoPadraoMin: 40 },
    { tipo: 'D', nome: 'Full Body', foco: 'Compensatório', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 40 },
  ],
};

const TIPOS_HIPERTROFIA: Record<number, TipoSessao[]> = {
  3: [
    { tipo: 'A', nome: 'Peito + Tríceps', foco: 'Volume médio-alto', padroes: ['PRESS', 'PRESS', 'SQUAT'], duracaoPadraoMin: 50 },
    { tipo: 'B', nome: 'Costas + Bíceps', foco: 'Volume médio-alto', padroes: ['PULL', 'PULL', 'PULL'], duracaoPadraoMin: 50 },
    { tipo: 'C', nome: 'Pernas', foco: 'Quadríceps + posterior', padroes: ['SQUAT', 'HINGE', 'SQUAT', 'CARRY'], duracaoPadraoMin: 50 },
  ],
  4: [
    { tipo: 'A', nome: 'Peito + Ombro', foco: 'Empurrar', padroes: ['PRESS', 'PRESS'], duracaoPadraoMin: 50 },
    { tipo: 'B', nome: 'Costas', foco: 'Puxar', padroes: ['PULL', 'PULL', 'PULL'], duracaoPadraoMin: 50 },
    { tipo: 'C', nome: 'Pernas (ênfase quad)', foco: 'Quadríceps', padroes: ['SQUAT', 'SQUAT'], duracaoPadraoMin: 50 },
    { tipo: 'D', nome: 'Pernas (ênfase post)', foco: 'Posterior + glúteo', padroes: ['HINGE', 'HINGE', 'CARRY'], duracaoPadraoMin: 50 },
  ],
  5: [
    { tipo: 'A', nome: 'Peito', foco: 'Empurrar horizontal', padroes: ['PRESS', 'PRESS'], duracaoPadraoMin: 45 },
    { tipo: 'B', nome: 'Costas', foco: 'Puxar vertical', padroes: ['PULL', 'PULL'], duracaoPadraoMin: 45 },
    { tipo: 'C', nome: 'Pernas (quad)', foco: 'Quadríceps', padroes: ['SQUAT', 'SQUAT'], duracaoPadraoMin: 45 },
    { tipo: 'D', nome: 'Ombros + Braços', foco: 'Deltóide + bíceps', padroes: ['PRESS', 'PULL'], duracaoPadraoMin: 45 },
    { tipo: 'E', nome: 'Pernas (post)', foco: 'Posterior', padroes: ['HINGE', 'HINGE', 'CARRY'], duracaoPadraoMin: 45 },
  ],
};

const TIPOS_PERDA_PESO: Record<number, TipoSessao[]> = {
  3: [
    { tipo: 'A', nome: 'Cardio + Força', foco: 'Alta queima calórica', padroes: ['HINGE', 'SQUAT', 'CARRY'], duracaoPadraoMin: 40 },
    { tipo: 'B', nome: 'HIIT Funcional', foco: 'Circuitos curtos', padroes: ['HINGE', 'SQUAT', 'PRESS'], duracaoPadraoMin: 35 },
    { tipo: 'C', nome: 'Full Body Metabólico', foco: 'Volume moderado, descansos curtos', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 45 },
  ],
  4: [
    { tipo: 'A', nome: 'Cardio + Força', foco: 'Queima + força', padroes: ['HINGE', 'SQUAT', 'CARRY'], duracaoPadraoMin: 40 },
    { tipo: 'B', nome: 'HIIT KB', foco: 'Alta intensidade', padroes: ['HINGE', 'COND', 'SQUAT'], duracaoPadraoMin: 35 },
    { tipo: 'C', nome: 'Força', foco: 'Resistência muscular', padroes: ['PRESS', 'PULL', 'SQUAT', 'HINGE'], duracaoPadraoMin: 45 },
    { tipo: 'D', nome: 'Metabólico', foco: 'Circuito longo', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL', 'CARRY'], duracaoPadraoMin: 45 },
  ],
};

const TIPOS_MOBILIDADE: Record<number, TipoSessao[]> = {
  3: [
    { tipo: 'A', nome: 'Mobilidade Total', foco: 'Ombros, quadril, coluna', padroes: ['SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 30 },
    { tipo: 'B', nome: 'Yoga + Força Leve', foco: 'Alongamento + ativação', padroes: ['HINGE', 'SQUAT', 'CARRY'], duracaoPadraoMin: 30 },
    { tipo: 'C', nome: 'TGU + Mobilidade', foco: 'Turkish Get-Up + correção postural', padroes: ['SQUAT', 'PRESS', 'CARRY'], duracaoPadraoMin: 30 },
  ],
  5: [
    { tipo: 'A', nome: 'Quadril', foco: 'Mobilidade de quadril', padroes: ['SQUAT', 'HINGE'], duracaoPadraoMin: 25 },
    { tipo: 'B', nome: 'Ombros', foco: 'Mobilidade de ombro', padroes: ['PRESS', 'PULL'], duracaoPadraoMin: 25 },
    { tipo: 'C', nome: 'Coluna', foco: 'Extensão + rotação', padroes: ['CARRY', 'HINGE'], duracaoPadraoMin: 25 },
    { tipo: 'D', nome: 'Tornozelos', foco: 'Mobilidade + agachamento', padroes: ['SQUAT', 'SQUAT'], duracaoPadraoMin: 25 },
    { tipo: 'E', nome: 'Full Body', foco: 'Compensatório', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 30 },
  ],
  6: [
    { tipo: 'A', nome: 'Quadril', foco: 'Mobilidade de quadril', padroes: ['SQUAT', 'HINGE'], duracaoPadraoMin: 20 },
    { tipo: 'B', nome: 'Ombros', foco: 'Mobilidade de ombro', padroes: ['PRESS', 'PULL'], duracaoPadraoMin: 20 },
    { tipo: 'C', nome: 'Coluna', foco: 'Extensão + rotação', padroes: ['CARRY', 'HINGE'], duracaoPadraoMin: 20 },
    { tipo: 'D', nome: 'Tornozelos', foco: 'Mobilidade + agachamento', padroes: ['SQUAT', 'SQUAT'], duracaoPadraoMin: 20 },
    { tipo: 'E', nome: 'Ativação', foco: 'Glúteo + core', padroes: ['SQUAT', 'CARRY'], duracaoPadraoMin: 20 },
    { tipo: 'F', nome: 'Full Body', foco: 'Compensatório', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 25 },
  ],
};

const TIPOS_CONDICIONAMENTO: Record<number, TipoSessao[]> = {
  3: [
    { tipo: 'A', nome: 'Cardio KB', foco: 'Alta frequência', padroes: ['HINGE', 'COND', 'COND'], duracaoPadraoMin: 40 },
    { tipo: 'B', nome: 'Força-Resistência', foco: 'Reps altas, descansos curtos', padroes: ['SQUAT', 'PRESS', 'PULL', 'CARRY'], duracaoPadraoMin: 45 },
    { tipo: 'C', nome: 'EMOM / AMRAP', foco: 'Workout cronometrado', padroes: ['HINGE', 'SQUAT', 'PRESS'], duracaoPadraoMin: 40 },
  ],
  4: [
    { tipo: 'A', nome: 'Cardio KB', foco: 'Alta frequência', padroes: ['HINGE', 'COND', 'COND'], duracaoPadraoMin: 35 },
    { tipo: 'B', nome: 'Força-Resistência', foco: 'Volume alto', padroes: ['SQUAT', 'PRESS', 'PULL', 'CARRY'], duracaoPadraoMin: 40 },
    { tipo: 'C', nome: 'EMOM / AMRAP', foco: 'Workout cronometrado', padroes: ['HINGE', 'SQUAT', 'PRESS'], duracaoPadraoMin: 35 },
    { tipo: 'D', nome: 'Full Body', foco: 'Compensatório', padroes: ['HINGE', 'SQUAT', 'PRESS', 'PULL'], duracaoPadraoMin: 40 },
  ],
};

const TIPOS_PICKLEBALL: Record<number, TipoSessao[]> = {
  3: [
    { tipo: 'A', nome: 'Agilidade + Lateralidade', foco: 'Deslocamento lateral, primeira passada', padroes: ['SQUAT', 'HINGE', 'CARRY'], duracaoPadraoMin: 40 },
    { tipo: 'B', nome: 'Rotação + Reação', foco: 'Rotação de tronco, tempo de reação', padroes: ['HINGE', 'COND', 'PRESS'], duracaoPadraoMin: 40 },
    { tipo: 'C', nome: 'Resistência Específica', foco: 'Resistência pra rallies longos', padroes: ['HINGE', 'COND', 'SQUAT', 'CARRY'], duracaoPadraoMin: 45 },
  ],
  4: [
    { tipo: 'A', nome: 'Agilidade Lateral', foco: 'Deslocamento + primeira passada', padroes: ['SQUAT', 'HINGE', 'CARRY'], duracaoPadraoMin: 40 },
    { tipo: 'B', nome: 'Rotação de Tronco', foco: 'Saque + smash', padroes: ['HINGE', 'COND', 'PRESS'], duracaoPadraoMin: 40 },
    { tipo: 'C', nome: 'Resistência', foco: 'Rallies longos', padroes: ['HINGE', 'COND', 'SQUAT', 'CARRY'], duracaoPadraoMin: 45 },
    { tipo: 'D', nome: 'Força + Prevenção', foco: 'Ombro + joelho', padroes: ['PRESS', 'PULL', 'SQUAT', 'CARRY'], duracaoPadraoMin: 40 },
  ],
};

function escolherTipoPorObjetivo(obj: Objetivo, freq: number): TipoSessao[] {
  const map: Record<Objetivo, Record<number, TipoSessao[]>> = {
    forca_geral: TIPOS_FORCA,
    hipertrofia: TIPOS_HIPERTROFIA,
    perda_peso: TIPOS_PERDA_PESO,
    mobilidade: TIPOS_MOBILIDADE,
    condicionamento: TIPOS_CONDICIONAMENTO,
    pickleball: TIPOS_PICKLEBALL,
  };
  const opcoes = map[obj];
  // Escolhe a configuração mais próxima da frequência
  if (opcoes[freq]) return opcoes[freq];
  const chaves = Object.keys(opcoes).map(Number).sort((a, b) => a - b);
  // Pega a mais próxima
  let melhor = chaves[0];
  let menorDiff = Math.abs(freq - chaves[0]);
  for (const k of chaves) {
    const diff = Math.abs(freq - k);
    if (diff < menorDiff) {
      melhor = k;
      menorDiff = diff;
    }
  }
  // Repete tipos se a freq desejada for maior
  const base = opcoes[melhor];
  if (freq <= melhor) return base.slice(0, freq);
  const resultado: TipoSessao[] = [...base];
  while (resultado.length < freq) {
    resultado.push(base[resultado.length % base.length]);
  }
  return resultado.slice(0, freq);
}

// ─────────────────────────────────────────────────────────────
//   Volume/Intensidade por nível + semana
// ─────────────────────────────────────────────────────────────

const VOLUME_POR_NIVEL: Record<Nivel, { series: [number, number]; reps: string; descansoSeg: [number, number] }> = {
  iniciante: { series: [2, 3], reps: '8-12', descansoSeg: [60, 90] },
  intermediario: { series: [3, 4], reps: '6-10', descansoSeg: [90, 120] },
  avancado: { series: [4, 5], reps: '3-8', descansoSeg: [120, 180] },
};

const RPE_POR_SEMANA: Record<Nivel, number[]> = {
  iniciante: [5, 6, 6, 7, 5, 6, 6, 7, 5, 6, 6, 7], // 12 semanas
  intermediario: [6, 7, 7, 8, 8, 5, 7, 8, 8, 9, 9, 5],
  avancado: [7, 8, 8, 9, 9, 5, 8, 9, 9, 9, 10, 5],
};

function volumeParaSemana(nivel: Nivel, semanaIdx: number) {
  // 4 semanas = bloco. Semana 4 = deload
  const cicloSemana = semanaIdx % 4;
  const isDeload = cicloSemana === 3;
  const cfg = VOLUME_POR_NIVEL[nivel];

  const series = isDeload ? cfg.series[0] : cfg.series[1];
  const descanso = isDeload ? cfg.descansoSeg[0] : cfg.descansoSeg[1];
  const rpeArr = RPE_POR_SEMANA[nivel];
  // Deload: RPE fixo 4 (regenerativo). Normal: ciclo progressivo.
  const rpe = isDeload ? 4 : rpeArr[semanaIdx % rpeArr.length];

  return { series, reps: isDeload ? '8-12 (volume baixo)' : cfg.reps, descansoSeg: descanso, rpeAlvo: rpe };
}

// ─────────────────────────────────────────────────────────────
//   Picker de exercício por padrão
// ─────────────────────────────────────────────────────────────

function pegarExerciciosPorPadrao(padroes: string[], quantidade: number, equipamento: Equipamento, nivel: Nivel): { id: string; nome: string }[] {
  const candidatos = KETTLEBELL_EXERCICIOS.filter((ex: any) => {
    if (equipamento === 'peso_corporal' && ex.equipamento !== 'peso_corporal') return false;
    if (equipamento === 'kb_leve' && ex.carga === 'pesado') return false;
    if (nivel === 'iniciante' && ex.nivel === 'avancado') return false;
    return padroes.includes((ex as any).padraoKb);
  });

  if (candidatos.length === 0) {
    // Fallback: pegar qualquer exercício do padrão
    return KETTLEBELL_EXERCICIOS
      .filter((ex: any) => padroes.includes((ex as any).padraoKb))
      .slice(0, quantidade)
      .map((ex: any) => ({ id: ex.id, nome: ex.nome }));
  }

  // Embaralhar levemente (mas deterministicamente pelo seed = idx)
  const resultado: { id: string; nome: string }[] = [];
  const usados = new Set<number>();
  let padraoIdx = 0;
  for (let i = 0; i < quantidade && i < candidatos.length; i++) {
    const idx = (i + padraoIdx) % candidatos.length;
    if (!usados.has(idx)) {
      usados.add(idx);
      resultado.push({ id: candidatos[idx].id, nome: candidatos[idx].nome });
    }
    padraoIdx++;
  }

  // Preencher com swing se faltar
  while (resultado.length < quantidade) {
    const swing = KETTLEBELL_EXERCICIOS.find((ex: any) => ex.nome.toLowerCase().includes('swing'));
    if (swing) resultado.push({ id: swing.id, nome: swing.nome });
    else break;
  }

  return resultado;
}

// ─────────────────────────────────────────────────────────────
//   Geração principal do plano
// ─────────────────────────────────────────────────────────────

export interface PlanoInput {
  nome: string;
  objetivo: Objetivo;
  nivel: Nivel;
  equipamento: Equipamento;
  duracaoSemanas: number;
  sessoesPorSemana: number;
  duracaoSessaoMin: number;
  idade?: number;
  limitacoes?: string;
}

export function gerarPlano(input: PlanoInput): Plano {
  const tipos = escolherTipoPorObjetivo(input.objetivo, input.sessoesPorSemana);
  const sessoes: SessaoPlano[] = [];

  // Quantos exercícios por sessão baseado na duração
  // 1 exercício = ~7min (séries + descanso)
  const exerciciosPorSessao = Math.max(3, Math.floor(input.duracaoSessaoMin / 7));

  for (let sem = 0; sem < input.duracaoSemanas; sem++) {
    const vol = volumeParaSemana(input.nivel, sem);
    tipos.forEach((tipo) => {
      const exNames = pegarExerciciosPorPadrao(tipo.padroes, exerciciosPorSessao, input.equipamento, input.nivel);
      sessoes.push({
        id: `s${sem + 1}${tipo.tipo.toLowerCase()}`,
        semanaIdx: sem,
        tipo: tipo.tipo,
        nome: tipo.nome,
        duracaoMin: input.duracaoSessaoMin,
        foco: tipo.foco,
        exercicios: exNames.map(({ id, nome }) => ({
          id,
          nome,
          series: vol.series,
          reps: vol.reps,
          carga: input.equipamento === 'peso_corporal' ? 'BW' : input.equipamento === 'kb_leve' ? '12kg' : 'moderado',
          descansoSeg: vol.descansoSeg,
          rpeAlvo: vol.rpeAlvo,
        })),
      });
    });
  }

  return {
    id: `plano-${Date.now()}`,
    nome: input.nome || `${OBJETIVOS_LABEL[input.objetivo]} - ${input.duracaoSemanas}sem`,
    objetivo: input.objetivo,
    nivel: input.nivel,
    equipamento: input.equipamento,
    duracaoSemanas: input.duracaoSemanas,
    sessoesPorSemana: input.sessoesPorSemana,
    duracaoSessaoMin: input.duracaoSessaoMin,
    criadoEm: new Date().toISOString(),
    ativo: true,
    sessoes,
  };
}

// ─────────────────────────────────────────────────────────────
//   Helpers para UI
// ─────────────────────────────────────────────────────────────

export { OBJETIVOS_LABEL, OBJETIVOS_ICONE };
