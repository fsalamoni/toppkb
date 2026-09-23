/**
 * Lógica pura do MuscleHeatmap — separada do componente para testabilidade.
 * Recebe sessões + número de dias e retorna células com intensidade.
 */

import { KETTLEBELL_EXERCICIOS, getTopMusculaturas } from '@/data/seed/exercicios-kettlebell';

export interface HeatmapDay {
  date: Date;
  dateStr: string;
  intensity: 0 | 1 | 2 | 3 | 4;
  muscles: string[];
  sessionCount: number;
}

export interface HeatmapSession {
  data: string;
  exercicios: string[];
}

/**
 * Calcula intensidade com base na contagem de músculos únicos do dia.
 * 1=sessão leve (1-2 músculos), 2=moderada (3-4), 3=intensa (5-6), 4=muito intensa (7+)
 */
export function calculateIntensity(muscleCount: number): 0 | 1 | 2 | 3 | 4 {
  if (muscleCount >= 7) return 4;
  if (muscleCount >= 5) return 3;
  if (muscleCount >= 3) return 2;
  if (muscleCount >= 1) return 1;
  return 0;
}

/**
 * Resolve um exercício por ID ou nome (com ou sem prefixo kb-).
 * Retorna o ID canônico ou null se não encontrado.
 */
export function resolveExerciseId(idOrName: string): string | null {
  const ex = KETTLEBELL_EXERCICIOS.find(
    (e) => e.id === idOrName || e.id === `kb-${idOrName}` || e.nome === idOrName,
  );
  return ex?.id ?? null;
}

/**
 * Extrai músculos únicos do dia a partir das sessões.
 */
export function extractMusclesForDay(sessoes: HeatmapSession[]): string[] {
  const musclesSet = new Set<string>();
  for (const sessao of sessoes) {
    for (const exId of sessao.exercicios) {
      const canonicalId = resolveExerciseId(exId);
      if (canonicalId) {
        const topMuscles = getTopMusculaturas(canonicalId, 2);
        for (const m of topMuscles) {
          const key = m.split('—')[0].trim().toLowerCase();
          if (key) musclesSet.add(key);
        }
      }
    }
  }
  return Array.from(musclesSet);
}

/**
 * Filtra sessões que ocorrem em um dia específico (UTC).
 */
export function filterSessoesForDay(sessoes: HeatmapSession[], day: Date): HeatmapSession[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return sessoes.filter((s) => {
    const sd = new Date(s.data);
    return sd >= dayStart && sd < dayEnd;
  });
}

/**
 * Gera array de dias para o heatmap (alinhado por domingo).
 */
export function generateHeatmapDays(dias: number, today: Date = new Date()): HeatmapDay[] {
  const result: HeatmapDay[] = [];
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - dias + 1);
  const dow = startDate.getDay();
  startDate.setDate(startDate.getDate() - dow);

  for (let i = 0; i < dias + dow; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    if (date > today) continue;
    result.push({
      date,
      dateStr: date.toISOString().slice(0, 10),
      intensity: 0,
      muscles: [],
      sessionCount: 0,
    });
  }
  return result;
}

/**
 * Calcula heatmap completo combinando dias + sessões.
 */
export function computeHeatmap(sessoes: HeatmapSession[], dias: number = 84, today: Date = new Date()): HeatmapDay[] {
  const days = generateHeatmapDays(dias, today);
  for (const cell of days) {
    const daySessoes = filterSessoesForDay(sessoes, cell.date);
    if (daySessoes.length === 0) continue;
    cell.sessionCount = daySessoes.length;
    cell.muscles = extractMusclesForDay(daySessoes);
    cell.intensity = calculateIntensity(cell.muscles.length);
  }
  return days;
}

/**
 * Agrupa dias em semanas (colunas de 7).
 */
export function groupIntoWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const w: HeatmapDay[][] = [];
  let current: HeatmapDay[] = [];
  for (const d of days) {
    current.push(d);
    if (current.length === 7) {
      w.push(current);
      current = [];
    }
  }
  if (current.length > 0) w.push(current);
  return w;
}
