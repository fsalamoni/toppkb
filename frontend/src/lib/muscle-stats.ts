import { KETTLEBELL_EXERCICIOS, type ExercicioKettlebell } from '@/data/seed/exercicios-kettlebell';

export interface MuscleStat {
  /** Nome normalizado (ex: "Glúteo") */
  nome: string;
  /** Como aparece no mapaMuscularLeigo (ex: "Glúteo máximo") */
  display: string;
  /** Quantos exercícios usam */
  count: number;
  /** IDs dos exercícios */
  exercises: string[];
  /** Categoria visual */
  categoria: 'posterior' | 'anterior' | 'core' | 'ombro' | 'membro-superior' | 'cardio';
  /** Ícone emoji */
  icone: string;
  /** Cor Tailwind para badge */
  cor: string;
}

function normalizeMuscleName(s: string): string {
  return s
    .toLowerCase()
    .replace(/máximo|mínimo|medial|lateral|anterior|posterior/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/glúteos|glúteo/g, 'glúteo')
    .replace(/músculos|músculo/g, 'músculo')
    .replace(/antebraços/g, 'antebraço')
    .replace(/deltoides/g, 'deltóide')
    .replace(/trapezio/g, 'trapézio')
    .replace(/\s+e\s+/g, ' + ')
    .replace(/,\s*/g, ' + ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyMuscle(display: string): MuscleStat['categoria'] {
  const m = display.toLowerCase();
  if (m.includes('coração') || m.includes('cardio') || m.includes('metab')) return 'cardio';
  if (m.includes('core') || m.includes('abdômen') || m.includes('oblíquo') || m.includes('barriga')) return 'core';
  if (m.includes('glúteo') || m.includes('isquiotibial') || m.includes('posterior') || m.includes('lombar') || m.includes('eretores')) return 'posterior';
  if (m.includes('deltóide') || m.includes('trapézio') || m.includes('ombro') || m.includes('manguito')) return 'ombro';
  if (m.includes('quadríceps') || m.includes('panturrilha') || m.includes('adutor')) return 'anterior';
  return 'membro-superior';
}

function getMuscleIcon(display: string): string {
  const m = display.toLowerCase();
  if (m.includes('coração') || m.includes('cardio')) return '❤️';
  if (m.includes('core') || m.includes('abdômen') || m.includes('oblíquo')) return '🧱';
  if (m.includes('glúteo')) return '🍑';
  if (m.includes('isquiotibial')) return '🍗';
  if (m.includes('quadríceps')) return '🦵';
  if (m.includes('panturrilha')) return '🐄';
  if (m.includes('deltóide') || m.includes('ombro')) return '🏔️';
  if (m.includes('trapézio')) return '🔺';
  if (m.includes('peitoral')) return '🫀';
  if (m.includes('antebraço') || m.includes('grip')) return '💪';
  if (m.includes('latíssimo') || m.includes('costas')) return '🔙';
  if (m.includes('adutor')) return '🦿';
  return '💎';
}

function getMuscleCor(categoria: MuscleStat['categoria']): string {
  const cores = {
    posterior: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
    anterior: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    core: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
    ombro: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20',
    'membro-superior': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20',
    cardio: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
  };
  return cores[categoria];
}

/**
 * Conta frequência de cada músculo principal em todos os exercícios KB.
 * O "músculo principal" é a parte ANTES do "—" no mapaMuscularLeigo.
 *
 * IMPORTANTE: ignora variações anatômicas (ex: "Glúteo máximo" e "Glúteo médio"
 * contam como "Glúteo"). Isso evita fragmentar a contagem.
 */
export function getMuscleStats(): MuscleStat[] {
  const map = new Map<string, MuscleStat>();

  for (const ex of KETTLEBELL_EXERCICIOS) {
    if (!ex.mapaMuscularLeigo) continue;
    const seen = new Set<string>(); // dedupe por exercício (não contar 2x mesmo músculo)
    for (const line of ex.mapaMuscularLeigo) {
      const display = line.split('—')[0].trim();
      const key = normalizeMuscleName(display);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      if (!map.has(key)) {
        map.set(key, {
          nome: key,
          display,
          count: 0,
          exercises: [],
          categoria: classifyMuscle(display),
          icone: getMuscleIcon(display),
          cor: getMuscleCor(classifyMuscle(display)),
        });
      }
      const stat = map.get(key)!;
      stat.count += 1;
      stat.exercises.push(ex.id);
    }
  }

  return Array.from(map.values())
    .filter((s) => s.count >= 3) // só mostra músculos com 3+ exercícios
    .sort((a, b) => b.count - a.count);
}

/**
 * Filtra exercícios que trabalham um músculo específico.
 * Match exato no nome normalizado.
 */
export function filterByMuscle(muscleKey: string): ExercicioKettlebell[] {
  const seen = new Set<string>();
  return KETTLEBELL_EXERCICIOS.filter((ex) => {
    if (!ex.mapaMuscularLeigo) return false;
    for (const line of ex.mapaMuscularLeigo) {
      const display = line.split('—')[0].trim();
      const key = normalizeMuscleName(display);
      if (key === muscleKey && !seen.has(ex.id)) {
        seen.add(ex.id);
        return true;
      }
    }
    return false;
  });
}
