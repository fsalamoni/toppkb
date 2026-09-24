/**
 * Sistema de medalhas/conquistas (Achievements) — Sprint 77
 *
 * O usuário desbloqueia medalhas conforme usa o app:
 * - Visualizou X exercícios
 * - Fez X sessões de preparação
 * - Atingiu X dias de streak
 * - Praticou Y exercícios via PracticeMode
 * - Tocou X músculos no MuscleMap
 *
 * Os dados vêm do analytics (localStorage). As medalhas são persistidas também
 * em localStorage para evitar desbloquear repetidamente.
 */

import {
  getMostViewed,
  getEventCount,
  getEventSummary,
} from './analytics';
import { KETTLEBELL_EXERCICIOS_LIST } from './analytics-helpers';
import { calcularStreakAtual, calcularMaiorStreak } from './streak';

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Medal {
  id: string;
  titulo: string;
  descricao: string;
  tier: MedalTier;
  emoji: string;
  /** Condição para desbloquear */
  condicao: (stats: UserStats) => boolean;
  /** Threshold para display (ex: 10 exercícios = bronze, 25 = silver, etc) */
  thresholds?: number[];
}

export interface UserStats {
  totalEventos: number;
  exerciciosVisualizados: number;
  eventosPorTipo: Record<string, number>;
  /** sessionCount é estimado a partir de exercise_saved_to_session */
  sessoesRegistradas: number;
  practiceModeIniciado: number;
  muscleClicked: number;
  bestStreak: number;
  currentStreak: number;
  todosExercicios: number;
}

const MEDALS: Medal[] = [
  // === STREAKS ===
  {
    id: 'streak_3',
    titulo: '3 dias seguidos',
    descricao: 'Mantenha uma sequência de 3 dias ativos',
    tier: 'bronze',
    emoji: '🔥',
    condicao: (s) => s.bestStreak >= 3 || s.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    titulo: 'Uma semana',
    descricao: '7 dias consecutivos de treino',
    tier: 'silver',
    emoji: '🔥🔥',
    condicao: (s) => s.bestStreak >= 7 || s.currentStreak >= 7,
  },
  {
    id: 'streak_30',
    titulo: 'Hábito formado',
    descricao: '30 dias consecutivos (mês inteiro!)',
    tier: 'gold',
    emoji: '🔥🔥🔥',
    condicao: (s) => s.bestStreak >= 30 || s.currentStreak >= 30,
  },
  {
    id: 'streak_100',
    titulo: 'Centenário',
    descricao: '100 dias consecutivos! Você é lendário.',
    tier: 'platinum',
    emoji: '👑🔥',
    condicao: (s) => s.bestStreak >= 100 || s.currentStreak >= 100,
  },

  // === EXPLORAÇÃO (visualizações) ===
  {
    id: 'explorer_5',
    titulo: 'Curioso',
    descricao: 'Visualize 5 exercícios diferentes',
    tier: 'bronze',
    emoji: '👀',
    condicao: (s) => s.exerciciosVisualizados >= 5,
  },
  {
    id: 'explorer_25',
    titulo: 'Bibliófilo',
    descricao: 'Visualize 25 exercícios',
    tier: 'silver',
    emoji: '📚',
    condicao: (s) => s.exerciciosVisualizados >= 25,
  },
  {
    id: 'explorer_50',
    titulo: 'Colecionador',
    descricao: 'Visualize 50 exercícios',
    tier: 'gold',
    emoji: '🏆',
    condicao: (s) => s.exerciciosVisualizados >= 50,
  },
  {
    id: 'explorer_all',
    titulo: 'Mestre KB',
    descricao: 'Visualize todos os 89 exercícios',
    tier: 'platinum',
    emoji: '🌟',
    condicao: (s) => s.exerciciosVisualizados >= s.todosExercicios,
  },

  // === PRÁTICA (PracticeMode) ===
  {
    id: 'practice_first',
    titulo: 'Primeira prática',
    descricao: 'Use o PracticeMode pela primeira vez',
    tier: 'bronze',
    emoji: '🎬',
    condicao: (s) => s.practiceModeIniciado >= 1,
  },
  {
    id: 'practice_10',
    titulo: 'Dedicado',
    descricao: 'Pratique 10 vezes',
    tier: 'silver',
    emoji: '💪',
    condicao: (s) => s.practiceModeIniciado >= 10,
  },
  {
    id: 'practice_50',
    titulo: 'Atleta',
    descricao: 'Pratique 50 vezes',
    tier: 'gold',
    emoji: '🏅',
    condicao: (s) => s.practiceModeIniciado >= 50,
  },

  // === ANATOMIA (muscle_clicked) ===
  {
    id: 'anatomy_curious',
    titulo: 'Estudioso',
    descricao: 'Clique em 10 músculos diferentes',
    tier: 'bronze',
    emoji: '🔬',
    condicao: (s) => s.muscleClicked >= 10,
  },
  {
    id: 'anatomy_master',
    titulo: 'Anatomista',
    descricao: 'Clique em 50 músculos',
    tier: 'silver',
    emoji: '💎',
    condicao: (s) => s.muscleClicked >= 50,
  },

  // === ENGAJAMENTO TOTAL ===
  {
    id: 'engagement_50',
    titulo: 'Engajado',
    descricao: 'Realize 50 ações no app',
    tier: 'bronze',
    emoji: '⚡',
    condicao: (s) => s.totalEventos >= 50,
  },
  {
    id: 'engagement_500',
    titulo: 'Power user',
    descricao: 'Realize 500 ações no app',
    tier: 'silver',
    emoji: '🚀',
    condicao: (s) => s.totalEventos >= 500,
  },
  {
    id: 'engagement_2000',
    titulo: 'Lendário',
    descricao: 'Realize 2000 ações no app',
    tier: 'gold',
    emoji: '⭐',
    condicao: (s) => s.totalEventos >= 2000,
  },
];

const STORAGE_KEY = 'toppkb-achievements-unlocked';

interface UnlockedRecord {
  id: string;
  unlockedAt: number;
}

/**
 * Lê achievements desbloqueadas do localStorage
 */
function readUnlocked(): UnlockedRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeUnlocked(records: UnlockedRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

/**
 * Retorna estatísticas do usuário baseado em analytics + outras fontes.
 */
export function getUserStats(sessoes: { data: string }[] = []): UserStats {
  const totalEventos = getEventCount();
  const topViewed = getMostViewed(KETTLEBELL_EXERCICIOS_LIST.length);
  const exerciciosVisualizados = topViewed.filter((e) => e.count > 0).length;
  const eventosPorTipo = getEventSummary();
  const practiceModeIniciado = eventosPorTipo['practice_mode_started'] ?? 0;
  const muscleClicked = eventosPorTipo['muscle_clicked'] ?? 0;
  const sessoesRegistradas = eventosPorTipo['exercise_saved_to_session'] ?? 0;

  const currentStreak = calcularStreakAtual(sessoes);
  const bestStreak = calcularMaiorStreak(sessoes);

  return {
    totalEventos,
    exerciciosVisualizados,
    eventosPorTipo,
    sessoesRegistradas,
    practiceModeIniciado,
    muscleClicked,
    bestStreak,
    currentStreak,
    todosExercicios: KETTLEBELL_EXERCICIOS_LIST.length,
  };
}

/**
 * Calcula quais medals estão desbloqueadas vs. bloqueadas.
 * Retorna lista com todas + flag unlocked + tier.
 */
export function getAllMedals(sessoes: { data: string }[] = []): Array<Medal & { unlocked: boolean; unlockedAt?: number; progress?: number }> {
  const stats = getUserStats(sessoes);
  const unlocked = readUnlocked();

  return MEDALS.map((m) => {
    const unlockedRec = unlocked.find((u) => u.id === m.id);
    return {
      ...m,
      unlocked: !!unlockedRec,
      unlockedAt: unlockedRec?.unlockedAt,
      // Progresso: quanto falta (0..1)
      progress: m.thresholds
        ? Math.min(1, stats.totalEventos / m.thresholds[m.thresholds.length - 1])
        : (m.condicao(stats) ? 1 : 0),
    };
  });
}

/**
 * Verifica novas medals desbloqueadas e retorna APENAS as novas (não persistidas ainda).
 */
export function checkNewAchievements(sessoes: { data: string }[] = []): Medal[] {
  const stats = getUserStats(sessoes);
  const existing = readUnlocked();
  const existingIds = new Set(existing.map((e) => e.id));

  const newOnes: Medal[] = [];
  for (const m of MEDALS) {
    if (existingIds.has(m.id)) continue;
    if (m.condicao(stats)) {
      newOnes.push(m);
    }
  }

  if (newOnes.length > 0) {
    const updated = [
      ...existing,
      ...newOnes.map((m) => ({ id: m.id, unlockedAt: Date.now() })),
    ];
    writeUnlocked(updated);
  }

  return newOnes;
}

/**
 * Reseta todas as medalhas (para testes)
 */
export function resetAchievements() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export const ALL_MEDALS = MEDALS;
