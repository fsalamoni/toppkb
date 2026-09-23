/**
 * Lógica pura do WorkoutFocusCard — separada para testabilidade.
 * Agrupa músculos por exercícios do treino, com cores + dica.
 */

import {
  KETTLEBELL_EXERCICIOS,
  getTopMusculaturas,
  getDicaMuscularCurta,
  getErroMuscularCurto,
} from '@/data/seed/exercicios-kettlebell';

export interface WorkoutExercise {
  id?: string;
  nome: string;
  series: number;
  reps: string;
  carga?: string;
}

export interface GroupedMuscle {
  name: string;
  count: number;
  exercises: string[];
  exemplo?: string;
  onde_sentir?: string;
  erro_muscular?: string; // Sprint 65.4: sintoma → causa
  color: string;
}

const COLOR_MAP: Record<string, string> = {
  'glúteo': '#10b981',
  'isquiotibial': '#10b981',
  'quadríceps': '#f59e0b',
  'deltóide': '#a855f7',
  'peitoral': '#06b6d4',
  'latíssimo': '#06b6d4',
  'trapézio': '#a855f7',
  'core': '#ec4899',
  'abdômen': '#ec4899',
  'oblíquo': '#ec4899',
  'tríceps': '#06b6d4',
  'bíceps': '#06b6d4',
  'lombar': '#ec4899',
  'antebraço': '#06b6d4',
  'panturrilha': '#f59e0b',
};

/**
 * Mapeia nome do músculo para cor hex baseada em categorias.
 */
export function muscleColor(display: string): string {
  const lower = display.toLowerCase();
  const key = Object.keys(COLOR_MAP).find((k) => lower.includes(k));
  return key ? COLOR_MAP[key] : '#94a3b8';
}

/**
 * Encontra o exercício canônico (com prefixo kb-) por ID ou nome.
 */
export function findExercise(idOrName: string) {
  return KETTLEBELL_EXERCICIOS.find(
    (e) => e.id === idOrName || e.id === `kb-${idOrName}` || e.nome === idOrName,
  );
}

// Mapeamento manual para músculos que não matcheiam por substring
const KEY_MAP: Record<string, string> = {
  'abdômen': 'core',
  'abdomen': 'core',
  'barriga': 'core',
  'estômago': 'core',
};

/**
 * Normaliza nome do músculo para agrupar (lowercase + remove prefixo).
 * "Glúteo máximo" → "glúteo" (mesmo grupo)
 * "Abdômen" → "core" (variação de core)
 */
export function muscleKey(display: string): string {
  const lower = display.toLowerCase();
  // Mapeamento manual primeiro
  for (const [from, to] of Object.entries(KEY_MAP)) {
    if (lower.includes(from)) return to;
  }
  // Match por substring nas chaves do COLOR_MAP
  const key = Object.keys(COLOR_MAP).find((k) => lower.includes(k));
  return key ?? lower;
}

/**
 * Calcula estatísticas de foco do treino.
 */
export interface WorkoutFocus {
  grupos: GroupedMuscle[];
  totalSeries: number;
  totalExercicios: number;
  totalGrupos: number;
}

export function computeWorkoutFocus(exercicios: WorkoutExercise[]): WorkoutFocus {
  const grouped: Record<string, GroupedMuscle> = {};

  for (const ex of exercicios) {
    const kbEx = findExercise(ex.id ?? ex.nome);
    if (!kbEx) continue;

    const muscles = getTopMusculaturas(kbEx.id, 2);
    for (const m of muscles) {
      const display = m.split('—')[0].trim();
      const key = muscleKey(display);
      const color = muscleColor(display);

      if (!grouped[key]) {
        grouped[key] = {
          name: display,
          count: 0,
          exercises: [],
          exemplo: kbEx.nome,
          onde_sentir: getDicaMuscularCurta(kbEx.id) ?? undefined,
          erro_muscular: getErroMuscularCurto(kbEx.id) ?? undefined, // Sprint 65.4
          color,
        };
      }
      grouped[key].count += ex.series;
      if (!grouped[key].exercises.includes(kbEx.nome)) {
        grouped[key].exercises.push(kbEx.nome);
      }
    }
  }

  return {
    grupos: Object.values(grouped).sort((a, b) => b.count - a.count),
    totalSeries: exercicios.reduce((sum, e) => sum + e.series, 0),
    totalExercicios: exercicios.length,
    totalGrupos: Object.keys(grouped).length,
  };
}
