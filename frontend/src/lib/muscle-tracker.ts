/**
 * MuscleTracker — Rastreia quais músculos foram trabalhados em cada sessão.
 * Usa dados de sessões + mapa muscular leigo.
 */

import { 
  KETTLEBELL_EXERCICIOS, 
  getTopMusculaturas,
  type ExercicioKettlebell,
} from '@/data/seed/exercicios-kettlebell';

export interface MuscleFrequency {
  muscle: string;
  count: number;
  lastDate?: string;
  exercises: string[];
}

// GRUPO_PARA_MUSCULOS removido (não utilizado na lógica atual; reservado para futuro)

/**
 * Analisa sessões e retorna frequência de grupos musculares.
 */
export function analyzeMuscleFrequency(
  sessoes: Array<{
    data: string;
    exercicios: string[]; // IDs ou nomes
  }>,
  options: { diasAtras?: number } = {}
): { grupos: MuscleFrequency[]; totalSessoes: number } {
  const diasAtras = options.diasAtras ?? 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - diasAtras);

  const grupos: Record<string, MuscleFrequency> = {};

  for (const sessao of sessoes) {
    const sessaoDate = new Date(sessao.data);
    if (sessaoDate < cutoff) continue;

    // dedupe: mesmo exercício só conta 1x por sessão
    const seenExercises = new Set<string>();
    const seenMusclesInSession = new Set<string>();

    for (const exId of sessao.exercicios) {
      // Encontrar exercício por ID ou nome
      const ex = KETTLEBELL_EXERCICIOS.find(
        (e) => e.id === exId || e.id === `kb-${exId}` || e.nome === exId,
      );
      if (!ex) continue;

      // Pular se já vimos este exercício nesta sessão
      if (seenExercises.has(ex.id)) continue;
      seenExercises.add(ex.id);

      // Pegar mapa muscular leigo
      const muscles = getTopMusculaturas(ex.id, 3);
      for (const m of muscles) {
        const key = m.split('—')[0].trim().toLowerCase();
        // dedupe dentro da sessão: músculo do mesmo exercício conta 1x
        const muscleKey = `${ex.id}::${key}`;
        if (seenMusclesInSession.has(muscleKey)) continue;
        seenMusclesInSession.add(muscleKey);

        if (!grupos[key]) {
          grupos[key] = { muscle: key, count: 0, exercises: [] };
        }
        grupos[key].count++;
        if (sessaoDate > new Date(grupos[key].lastDate ?? 0)) {
          grupos[key].lastDate = sessao.data;
        }
        if (!grupos[key].exercises.includes(ex.nome)) {
          grupos[key].exercises.push(ex.nome);
        }
      }
    }
  }

  const sorted = Object.values(grupos).sort((a, b) => b.count - a.count);
  return { grupos: sorted, totalSessoes: sessoes.length };
}

/**
 * Identifica músculos "negligenciados" (não trabalhados há N dias).
 */
export function findNeglectedMuscles(
  sessoes: Array<{ data: string; exercicios: string[] }>,
  options: { diasSemAtividade?: number } = {}
): MuscleFrequency[] {
  const diasSemAtividade = options.diasSemAtividade ?? 5;
  const { grupos } = analyzeMuscleFrequency(sessoes, { diasAtras: 14 });

  return grupos.filter((g) => {
    if (!g.lastDate) return true;
    const lastDate = new Date(g.lastDate);
    const diasPassados = Math.floor(
      (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diasPassados >= diasSemAtividade;
  });
}

/**
 * Recomenda exercícios para trabalhar um músculo negligenciado.
 */
export function recommendExercisesForMuscle(
  muscle: string,
  maxResults = 3,
): ExercicioKettlebell[] {
  const mLower = muscle.toLowerCase();
  const matches: Array<{ ex: ExercicioKettlebell; score: number }> = [];

  for (const ex of KETTLEBELL_EXERCICIOS) {
    let score = 0;
    if (ex.mapaMuscularLeigo) {
      for (const m of ex.mapaMuscularLeigo) {
        if (m.toLowerCase().includes(mLower)) score += 2;
        // Bonus para músculo principal (1º item)
        if (ex.mapaMuscularLeigo[0]?.toLowerCase().includes(mLower)) score += 3;
      }
    }
    if (score > 0) {
      matches.push({ ex, score });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((m) => m.ex);
}
