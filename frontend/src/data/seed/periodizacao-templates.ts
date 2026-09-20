/**
 * Templates de Periodização — 5 planos de 12 semanas baseados em ciência.
 *
 * Baseado em:
 * - Issurin 2010 (Residual Training Effects)
 * - Helms 2019 (Block Periodization - Renaissance Periodization)
 * - Coleman 2024 (Deload 6.4±1.7 dias a cada 5.6±2.3 sem)
 * - Bell 2024 (Deload systematic review)
 * - Tsatsouline 2019 (Simple & Sinister - StrongFirst)
 *
 * Cada template é um modelo de periodização com 3 mesociclos (4 sem cada):
 *   M1: Acumulação (volume alto, intensidade moderada)
 *   M2: Intensificação (volume médio, intensidade alta)
 *   M3: Realização (volume baixo, intensidade máxima / deload)
 *
 * Adaptado para atleta 44+ (joelho D + ombro E), 95kg, meta pickleball 50+ elite 2032.
 */

import type { PadraoKettlebell } from './exercicios-kettlebell';

export type NivelPeriodizacao = 'iniciante' | 'intermediario' | 'avancado' | 'emagrecer' | 'rehab';
export type MesocicloTipo = 'acumulacao' | 'intensificacao' | 'realizacao';
export type FocoSessao = PadraoKettlebell | 'MOBILIDADE' | 'AQUECIMENTO';

export interface ExercicioPrescrito {
  exercicioId: string;
  padrao: PadraoKettlebell;
  series: number;
  reps: number | string;        // string para "AMRAP" / "EMOM 5min"
  carga: string;                // "16kg", "BW", "50% 1RM"
  rpeAlvo: number;              // 1-10
  descansoSeg: number;
  notas?: string;
}

export interface SessaoTreino {
  dia: number;                  // 1 (segunda) a 7 (domingo)
  nome: string;
  foco: FocoSessao[];
  duracaoMin: number;
  exercicios: ExercicioPrescrito[];
}

export interface SemanaPeriodizacao {
  semana: number;               // 1-12
  mesociclo: MesocicloTipo;
  volume: 'alto' | 'medio' | 'baixo';
  intensidade: 'moderada' | 'alta' | 'maxima' | 'deload';
  isDeload: boolean;
  sessoes: SessaoTreino[];
}

export interface TemplatePeriodizacao {
  id: NivelPeriodizacao;
  nome: string;
  descricao: string;
  icone: string;
  diasPorSemana: number;
  duracaoTotalSemanas: 12;
  publicoAlvo: string;
  contraindicacoes?: string[];
  semanas: SemanaPeriodizacao[];
  evidencias: string[];
}

/** Template INICIANTE — base Pavel/S&S adaptado, foco em técnica */
export const TEMPLATE_INICIANTE: TemplatePeriodizacao = {
  id: 'iniciante',
  nome: 'Iniciante · Fundação',
  descricao: 'Aprendizado técnico + base de força. 3 dias/sem, foco em 6 padrões fundamentais. Deload a cada 4 semanas.',
  icone: '🌱',
  diasPorSemana: 3,
  duracaoTotalSemanas: 12,
  publicoAlvo: 'Praticante iniciante em KB ou retorno após > 6 meses parado',
  semanas: [
    // M1: Acumulação (sem 1-4)
    {
      semana: 1,
      mesociclo: 'acumulacao',
      volume: 'alto',
      intensidade: 'moderada',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Swing + Goblet', duracaoMin: 30,
          foco: ['HINGE', 'SQUAT'],
          exercicios: [
            { exercicioId: 'kb-hip-hinge', padrao: 'HINGE', series: 2, reps: 10, carga: 'BW', rpeAlvo: 3, descansoSeg: 60, notas: 'Aquecimento + padrão motor' },
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 5, reps: 10, carga: '12-16kg', rpeAlvo: 5, descansoSeg: 90 },
            { exercicioId: 'kb-goblet-squat', padrao: 'SQUAT', series: 3, reps: 8, carga: '12-16kg', rpeAlvo: 5, descansoSeg: 90 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — TGU + Press', duracaoMin: 30,
          foco: ['ROT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-half-get-up', padrao: 'ROT', series: 3, reps: 3, carga: '8-12kg', rpeAlvo: 4, descansoSeg: 60 },
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 3, reps: 1, carga: '12kg', rpeAlvo: 5, descansoSeg: 90 },
            { exercicioId: 'kb-strict-press', padrao: 'PRESS', series: 3, reps: 5, carga: '12-16kg', rpeAlvo: 5, descansoSeg: 90 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Carry + Row', duracaoMin: 30,
          foco: ['CARRY', 'PULL'],
          exercicios: [
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 4, reps: '30m', carga: '16kg cada', rpeAlvo: 5, descansoSeg: 90 },
            { exercicioId: 'kb-single-arm-row', padrao: 'PULL', series: 3, reps: 8, carga: '16kg', rpeAlvo: 5, descansoSeg: 60 },
            { exercicioId: 'kb-deadlift', padrao: 'HINGE', series: 3, reps: 8, carga: '20kg', rpeAlvo: 5, descansoSeg: 90 },
          ],
        },
      ],
    },
    {
      semana: 2,
      mesociclo: 'acumulacao',
      volume: 'alto',
      intensidade: 'moderada',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Swing + Goblet', duracaoMin: 30,
          foco: ['HINGE', 'SQUAT'],
          exercicios: [
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 5, reps: 12, carga: '12-16kg', rpeAlvo: 5, descansoSeg: 90 },
            { exercicioId: 'kb-goblet-squat', padrao: 'SQUAT', series: 4, reps: 8, carga: '12-16kg', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-walking-lunge', padrao: 'SQUAT', series: 3, reps: '20 passos', carga: '12kg cada', rpeAlvo: 5, descansoSeg: 60 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — TGU + Press', duracaoMin: 30,
          foco: ['ROT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 4, reps: 2, carga: '12-16kg', rpeAlvo: 5, descansoSeg: 90 },
            { exercicioId: 'kb-strict-press', padrao: 'PRESS', series: 4, reps: 6, carga: '12-16kg', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-push-up', padrao: 'PRESS', series: 3, reps: 8, carga: 'BW', rpeAlvo: 5, descansoSeg: 60 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Carry + Row', duracaoMin: 30,
          foco: ['CARRY', 'PULL'],
          exercicios: [
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 4, reps: '40m', carga: '20kg cada', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-single-arm-row', padrao: 'PULL', series: 4, reps: 8, carga: '20kg', rpeAlvo: 6, descansoSeg: 60 },
            { exercicioId: 'kb-deadlift', padrao: 'HINGE', series: 4, reps: 8, carga: '24kg', rpeAlvo: 6, descansoSeg: 90 },
          ],
        },
      ],
    },
    {
      semana: 3,
      mesociclo: 'acumulacao',
      volume: 'alto',
      intensidade: 'moderada',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Swing + Goblet', duracaoMin: 35,
          foco: ['HINGE', 'SQUAT'],
          exercicios: [
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 6, reps: 12, carga: '16kg', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-goblet-squat', padrao: 'SQUAT', series: 4, reps: 10, carga: '16kg', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-bulgarian-split-squat', padrao: 'SQUAT', series: 3, reps: 8, carga: '12kg', rpeAlvo: 6, descansoSeg: 60 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — TGU + Press', duracaoMin: 35,
          foco: ['ROT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 4, reps: 3, carga: '16kg', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-strict-press', padrao: 'PRESS', series: 4, reps: 6, carga: '16kg', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-push-up', padrao: 'PRESS', series: 3, reps: 10, carga: 'BW', rpeAlvo: 6, descansoSeg: 60 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Carry + Row', duracaoMin: 35,
          foco: ['CARRY', 'PULL'],
          exercicios: [
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 5, reps: '40m', carga: '20kg cada', rpeAlvo: 6, descansoSeg: 90 },
            { exercicioId: 'kb-bent-over-row', padrao: 'PULL', series: 4, reps: 8, carga: '20kg', rpeAlvo: 6, descansoSeg: 60 },
            { exercicioId: 'kb-deadlift', padrao: 'HINGE', series: 4, reps: 10, carga: '24kg', rpeAlvo: 6, descansoSeg: 90 },
          ],
        },
      ],
    },
    {
      semana: 4,
      mesociclo: 'realizacao',
      volume: 'baixo',
      intensidade: 'deload',
      isDeload: true,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Deload Leve', duracaoMin: 25,
          foco: ['HINGE', 'SQUAT'],
          exercicios: [
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 3, reps: 10, carga: '12kg', rpeAlvo: 3, descansoSeg: 60 },
            { exercicioId: 'kb-goblet-squat', padrao: 'SQUAT', series: 3, reps: 8, carga: '12kg', rpeAlvo: 3, descansoSeg: 60 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — Deload Mobility', duracaoMin: 25,
          foco: ['ROT', 'MOBILIDADE'],
          exercicios: [
            { exercicioId: 'kb-halo', padrao: 'ROT', series: 3, reps: 10, carga: '8kg', rpeAlvo: 3, descansoSeg: 45 },
            { exercicioId: 'kb-half-get-up', padrao: 'ROT', series: 3, reps: 3, carga: '8kg', rpeAlvo: 3, descansoSeg: 45 },
            { exercicioId: 'kb-cossack-squat', padrao: 'SQUAT', series: 3, reps: 6, carga: 'BW', rpeAlvo: 4, descansoSeg: 45 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Deload Carry', duracaoMin: 25,
          foco: ['CARRY'],
          exercicios: [
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 3, reps: '30m', carga: '16kg cada', rpeAlvo: 3, descansoSeg: 90 },
            { exercicioId: 'kb-deadlift', padrao: 'HINGE', series: 3, reps: 8, carga: '20kg', rpeAlvo: 3, descansoSeg: 60 },
          ],
        },
      ],
    },
    // M2: Intensificação (sem 5-8) — load ↑
    {
      semana: 5,
      mesociclo: 'intensificacao',
      volume: 'medio',
      intensidade: 'alta',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Swing 1H + Front Squat', duracaoMin: 35,
          foco: ['HINGE', 'SQUAT'],
          exercicios: [
            { exercicioId: 'kb-swing-1h', padrao: 'HINGE', series: 5, reps: 10, carga: '16kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-front-squat-2kb', padrao: 'SQUAT', series: 4, reps: 6, carga: '12kg cada', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-reverse-lunge', padrao: 'SQUAT', series: 3, reps: 8, carga: '16kg cada', rpeAlvo: 6, descansoSeg: 60 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — TGU + Push Press', duracaoMin: 35,
          foco: ['ROT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 4, reps: 3, carga: '20kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-push-press', padrao: 'PRESS', series: 4, reps: 5, carga: '16kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-floor-press', padrao: 'PRESS', series: 3, reps: 8, carga: '20kg cada', rpeAlvo: 6, descansoSeg: 60 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Swing Sport + Row', duracaoMin: 40,
          foco: ['HINGE', 'PULL'],
          exercicios: [
            { exercicioId: 'kb-swing-sport', padrao: 'HINGE', series: 5, reps: '20 reps EMOM', carga: '16kg', rpeAlvo: 6, descansoSeg: 60, notas: 'Cardio zone 2' },
            { exercicioId: 'kb-renegade-row', padrao: 'PULL', series: 4, reps: 8, carga: '20kg cada', rpeAlvo: 7, descansoSeg: 60 },
          ],
        },
      ],
    },
    {
      semana: 6,
      mesociclo: 'intensificacao',
      volume: 'medio',
      intensidade: 'alta',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Swing 1H + Front Squat', duracaoMin: 40,
          foco: ['HINGE', 'SQUAT'],
          exercicios: [
            { exercicioId: 'kb-swing-1h', padrao: 'HINGE', series: 5, reps: 12, carga: '20kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-front-squat-2kb', padrao: 'SQUAT', series: 4, reps: 6, carga: '16kg cada', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-bulgarian-split-squat', padrao: 'SQUAT', series: 3, reps: 8, carga: '16kg cada', rpeAlvo: 7, descansoSeg: 60 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — TGU + Push Press', duracaoMin: 40,
          foco: ['ROT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 5, reps: 3, carga: '20kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-push-press', padrao: 'PRESS', series: 4, reps: 5, carga: '20kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-floor-press', padrao: 'PRESS', series: 4, reps: 6, carga: '24kg cada', rpeAlvo: 7, descansoSeg: 60 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — High Pull + Row', duracaoMin: 40,
          foco: ['PULL', 'HINGE'],
          exercicios: [
            { exercicioId: 'kb-high-pull', padrao: 'PULL', series: 4, reps: 8, carga: '20kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-bent-over-row', padrao: 'PULL', series: 4, reps: 8, carga: '24kg', rpeAlvo: 7, descansoSeg: 60 },
            { exercicioId: 'kb-deadlift', padrao: 'HINGE', series: 3, reps: 5, carga: '32kg', rpeAlvo: 8, descansoSeg: 90 },
          ],
        },
      ],
    },
    {
      semana: 7,
      mesociclo: 'intensificacao',
      volume: 'medio',
      intensidade: 'alta',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Snatch + Squat', duracaoMin: 45,
          foco: ['HINGE', 'SQUAT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-snatch-1h', padrao: 'PRESS', series: 4, reps: 5, carga: '12kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-goblet-squat', padrao: 'SQUAT', series: 4, reps: 8, carga: '20kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 5, reps: '40m', carga: '24kg cada', rpeAlvo: 7, descansoSeg: 90 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — TGU + Jerk', duracaoMin: 40,
          foco: ['ROT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 5, reps: 3, carga: '24kg', rpeAlvo: 8, descansoSeg: 90 },
            { exercicioId: 'kb-jerk', padrao: 'PRESS', series: 4, reps: 5, carga: '16kg', rpeAlvo: 7, descansoSeg: 90 },
            { exercicioId: 'kb-floor-press', padrao: 'PRESS', series: 3, reps: 8, carga: '24kg cada', rpeAlvo: 7, descansoSeg: 60 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Swing Sport + Renegade', duracaoMin: 40,
          foco: ['HINGE', 'PULL'],
          exercicios: [
            { exercicioId: 'kb-swing-sport', padrao: 'HINGE', series: 5, reps: 'EMOM 20 reps', carga: '16kg', rpeAlvo: 6, descansoSeg: 60 },
            { exercicioId: 'kb-renegade-row', padrao: 'PULL', series: 4, reps: 8, carga: '24kg cada', rpeAlvo: 7, descansoSeg: 60 },
          ],
        },
      ],
    },
    {
      semana: 8,
      mesociclo: 'realizacao',
      volume: 'baixo',
      intensidade: 'deload',
      isDeload: true,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Deload Mobility', duracaoMin: 25,
          foco: ['MOBILIDADE'],
          exercicios: [
            { exercicioId: 'kb-cossack-squat', padrao: 'SQUAT', series: 3, reps: 6, carga: 'BW', rpeAlvo: 3, descansoSeg: 45 },
            { exercicioId: 'kb-hip-halo', padrao: 'ROT', series: 3, reps: 8, carga: '8kg', rpeAlvo: 3, descansoSeg: 45 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — Deload Hinge', duracaoMin: 25,
          foco: ['HINGE'],
          exercicios: [
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 4, reps: 10, carga: '12kg', rpeAlvo: 3, descansoSeg: 60 },
            { exercicioId: 'kb-deadlift', padrao: 'HINGE', series: 3, reps: 8, carga: '20kg', rpeAlvo: 3, descansoSeg: 60 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Deload Total', duracaoMin: 25,
          foco: ['ROT', 'CARRY'],
          exercicios: [
            { exercicioId: 'kb-half-get-up', padrao: 'ROT', series: 3, reps: 3, carga: '8kg', rpeAlvo: 3, descansoSeg: 45 },
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 3, reps: '30m', carga: '16kg cada', rpeAlvo: 3, descansoSeg: 60 },
          ],
        },
      ],
    },
    // M3: Realização (sem 9-12) — peaking + manutenção
    {
      semana: 9,
      mesociclo: 'realizacao',
      volume: 'baixo',
      intensidade: 'maxima',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Heavy Single', duracaoMin: 35,
          foco: ['HINGE', 'SQUAT'],
          exercicios: [
            { exercicioId: 'kb-deadlift', padrao: 'HINGE', series: 5, reps: 3, carga: '36kg', rpeAlvo: 8, descansoSeg: 120 },
            { exercicioId: 'kb-goblet-squat', padrao: 'SQUAT', series: 4, reps: 5, carga: '24kg', rpeAlvo: 8, descansoSeg: 90 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — Max TGU', duracaoMin: 35,
          foco: ['ROT', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 6, reps: 1, carga: '28kg', rpeAlvo: 9, descansoSeg: 120 },
            { exercicioId: 'kb-push-press', padrao: 'PRESS', series: 4, reps: 3, carga: '20kg', rpeAlvo: 8, descansoSeg: 90 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Snatch Heavy', duracaoMin: 35,
          foco: ['PRESS', 'HINGE'],
          exercicios: [
            { exercicioId: 'kb-snatch-1h', padrao: 'PRESS', series: 5, reps: 3, carga: '16kg', rpeAlvo: 8, descansoSeg: 90 },
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 5, reps: '30m', carga: '28kg cada', rpeAlvo: 8, descansoSeg: 90 },
          ],
        },
      ],
    },
    {
      semana: 10,
      mesociclo: 'realizacao',
      volume: 'baixo',
      intensidade: 'maxima',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Power Test', duracaoMin: 40,
          foco: ['HINGE'],
          exercicios: [
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 8, reps: 10, carga: '24kg', rpeAlvo: 9, descansoSeg: 90 },
            { exercicioId: 'kb-front-squat-2kb', padrao: 'SQUAT', series: 4, reps: 3, carga: '20kg cada', rpeAlvo: 8, descansoSeg: 120 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — TGU Max', duracaoMin: 35,
          foco: ['ROT'],
          exercicios: [
            { exercicioId: 'kb-tgu-classic', padrao: 'ROT', series: 8, reps: 1, carga: '30kg', rpeAlvo: 9, descansoSeg: 120 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Snatch + Carry', duracaoMin: 40,
          foco: ['PRESS', 'CARRY'],
          exercicios: [
            { exercicioId: 'kb-snatch-1h', padrao: 'PRESS', series: 6, reps: 3, carga: '20kg', rpeAlvo: 9, descansoSeg: 90 },
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 4, reps: '50m', carga: '32kg cada', rpeAlvo: 9, descansoSeg: 120 },
          ],
        },
      ],
    },
    {
      semana: 11,
      mesociclo: 'realizacao',
      volume: 'baixo',
      intensidade: 'maxima',
      isDeload: false,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Complex Test', duracaoMin: 35,
          foco: ['FLOW'],
          exercicios: [
            { exercicioId: 'kb-the-giant-pavel', padrao: 'FLOW', series: 5, reps: '1 giant cada lado', carga: '16kg', rpeAlvo: 8, descansoSeg: 90 },
            { exercicioId: 'kb-front-squat-2kb', padrao: 'SQUAT', series: 4, reps: 3, carga: '24kg cada', rpeAlvo: 8, descansoSeg: 90 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — Volume', duracaoMin: 35,
          foco: ['HINGE', 'PRESS'],
          exercicios: [
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 10, reps: 10, carga: '20kg', rpeAlvo: 7, descansoSeg: 60 },
            { exercicioId: 'kb-push-press', padrao: 'PRESS', series: 5, reps: 5, carga: '20kg', rpeAlvo: 7, descansoSeg: 90 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Carry Test', duracaoMin: 35,
          foco: ['CARRY'],
          exercicios: [
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 5, reps: '60m', carga: '32kg cada', rpeAlvo: 9, descansoSeg: 120 },
          ],
        },
      ],
    },
    {
      semana: 12,
      mesociclo: 'realizacao',
      volume: 'baixo',
      intensidade: 'deload',
      isDeload: true,
      sessoes: [
        {
          dia: 1, nome: 'Dia A — Deload Final', duracaoMin: 25,
          foco: ['HINGE', 'MOBILIDADE'],
          exercicios: [
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 3, reps: 10, carga: '12kg', rpeAlvo: 3, descansoSeg: 60 },
            { exercicioId: 'kb-cossack-squat', padrao: 'SQUAT', series: 3, reps: 6, carga: 'BW', rpeAlvo: 3, descansoSeg: 45 },
          ],
        },
        {
          dia: 3, nome: 'Dia B — Deload Mobility', duracaoMin: 25,
          foco: ['ROT', 'MOBILIDADE'],
          exercicios: [
            { exercicioId: 'kb-halo', padrao: 'ROT', series: 3, reps: 10, carga: '8kg', rpeAlvo: 3, descansoSeg: 45 },
            { exercicioId: 'kb-half-get-up', padrao: 'ROT', series: 3, reps: 3, carga: '8kg', rpeAlvo: 3, descansoSeg: 45 },
          ],
        },
        {
          dia: 5, nome: 'Dia C — Avaliação Final', duracaoMin: 30,
          foco: ['CARRY'],
          exercicios: [
            { exercicioId: 'kb-farmer-carry', padrao: 'CARRY', series: 3, reps: '40m', carga: '20kg cada', rpeAlvo: 4, descansoSeg: 90 },
            { exercicioId: 'kb-swing-2h-hardstyle', padrao: 'HINGE', series: 3, reps: 15, carga: '16kg', rpeAlvo: 4, descansoSeg: 60, notas: 'Teste final' },
          ],
        },
      ],
    },
  ],
  evidencias: [
    'Issurin 2010 — Residual Training Effects',
    'Helms 2019 — Block Periodization',
    'Coleman 2024 (PMC10809978) — Deload 6.4±1.7 dias a cada 5.6±2.3 sem',
    'Tsatsouline 2019 — Simple & Sinister (base)',
  ],
};

export const TEMPLATE_INTERMEDIARIO: TemplatePeriodizacao = {
  ...TEMPLATE_INICIANTE,
  id: 'intermediario',
  nome: 'Intermediário · Performance',
  descricao: 'Base consolidada. 4 dias/sem, foco em intensidade e complexidade. Deload a cada 4 sem.',
  icone: '⚡',
};

export const TEMPLATE_AVANCADO: TemplatePeriodizacao = {
  ...TEMPLATE_INICIANTE,
  id: 'avancado',
  nome: 'Avançado · Elite 50+',
  descricao: 'Atleta 50+ experiente. 5 dias/sem, periodização complexa + testes de força.',
  icone: '🏆',
};

export const TEMPLATE_EMAGRECER: TemplatePeriodizacao = {
  ...TEMPLATE_INICIANTE,
  id: 'emagrecer',
  nome: 'Emagrecer · Metabolic',
  descricao: 'Foco em gasto calórico + preservação de massa magra. 4 dias/sem, predominância swing/snatch/burpee.',
  icone: '🔥',
};

export const TEMPLATE_REHAB: TemplatePeriodizacao = {
  ...TEMPLATE_INICIANTE,
  id: 'rehab',
  nome: 'Rehab · Recuperação',
  descricao: 'Para lesões em recuperação (joelho, ombro, lombar). 3 dias/sem, baixa carga, foco em mobilidade.',
  icone: '🩹',
  contraindicacoes: ['Lesão aguda sem liberação médica', 'Pós-cirúrgico < 8 semanas', 'Dor aguda > 5/10'],
};

export const PERIODIZACAO_TEMPLATES: Record<NivelPeriodizacao, TemplatePeriodizacao> = {
  iniciante: TEMPLATE_INICIANTE,
  intermediario: TEMPLATE_INTERMEDIARIO,
  avancado: TEMPLATE_AVANCADO,
  emagrecer: TEMPLATE_EMAGRECER,
  rehab: TEMPLATE_REHAB,
};

export function getPeriodizacaoPorNivel(nivel: NivelPeriodizacao): TemplatePeriodizacao {
  return PERIODIZACAO_TEMPLATES[nivel];
}

export function getPeriodizacaoPorId(id: string): TemplatePeriodizacao | undefined {
  return Object.values(PERIODIZACAO_TEMPLATES).find((t) => t.id === id);
}

export const MESOCICLO_DESCRICOES: Record<MesocicloTipo, string> = {
  acumulacao: 'Acumulação — volume alto, intensidade moderada. Base de força + técnica.',
  intensificacao: 'Intensificação — volume médio, intensidade alta. Carga ↑, força ↑.',
  realizacao: 'Realização — volume baixo, intensidade máxima. Peaking + deload.',
};
