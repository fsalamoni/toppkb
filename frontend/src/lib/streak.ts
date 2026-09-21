/**
 * streak.ts — calcula streaks (sequências) de dias consecutivos
 *
 * Streak = número de dias consecutivos em que houve pelo menos 1 atividade
 *
 * USO:
 *   const eventos = [{ data: '2025-01-15' }, { data: '2025-01-14' }];
 *   const current = calcularStreakAtual(eventos);
 *   const melhor = calcularMaiorStreak(eventos);
 */

export interface EventoComData {
  data: string | Date;
}

/**
 * Converte data para YYYY-MM-DD (string normalizada)
 */
function toDateString(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula streak ATUAL (quantos dias consecutivos até hoje)
 *
 * Lógica:
 * - Pega o último dia com atividade
 * - Se foi hoje ou ontem: conta dias consecutivos regressivamente
 * - Senão: streak é 0 (quebrou)
 */
export function calcularStreakAtual(eventos: EventoComData[]): number {
  if (eventos.length === 0) return 0;

  // Set de datas únicas (normalizadas)
  const datasUnicas = new Set<string>();
  for (const e of eventos) {
    if (e.data) datasUnicas.add(toDateString(e.data));
  }

  const hoje = toDateString(new Date());
  const ontem = toDateString(addDays(new Date(), -1));

  // Streak começa a contar de hoje (se ativo) ou ontem (se não tem hoje)
  let dataInicio: Date;
  if (datasUnicas.has(hoje)) {
    dataInicio = new Date();
  } else if (datasUnicas.has(ontem)) {
    dataInicio = addDays(new Date(), -1);
  } else {
    return 0;
  }

  let streak = 0;
  while (datasUnicas.has(toDateString(dataInicio))) {
    streak++;
    dataInicio = addDays(dataInicio, -1);
  }

  return streak;
}

/**
 * Calcula o MAIOR streak (recorde pessoal)
 */
export function calcularMaiorStreak(eventos: EventoComData[]): number {
  if (eventos.length === 0) return 0;

  // Ordenar datas únicas
  const datas = Array.from(
    new Set(
      eventos
        .filter((e) => e.data)
        .map((e) => toDateString(e.data)),
    ),
  ).sort();

  let maiorStreak = 1;
  let streakAtual = 1;

  for (let i = 1; i < datas.length; i++) {
    const anterior = new Date(datas[i - 1]);
    const atual = new Date(datas[i]);
    const diffDays = Math.round(
      (atual.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) {
      streakAtual++;
      if (streakAtual > maiorStreak) maiorStreak = streakAtual;
    } else {
      streakAtual = 1; // reinicia
    }
  }

  return maiorStreak;
}

/**
 * Calcula dias totais com atividade
 */
export function calcularDiasAtivos(eventos: EventoComData[]): number {
  const datasUnicas = new Set<string>();
  for (const e of eventos) {
    if (e.data) datasUnicas.add(toDateString(e.data));
  }
  return datasUnicas.size;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Retorna cor/badge baseado em streak
 */
export function getStreakLevel(streak: number): {
  level: 'iniciante' | 'regular' | 'dedicado' | 'elite' | 'lendario';
  color: string;
  emoji: string;
  message: string;
} {
  if (streak >= 365) {
    return {
      level: 'lendario',
      color: 'text-purple-600 dark:text-purple-400',
      emoji: '👑',
      message: 'Lendário! 1 ano de consistência!',
    };
  }
  if (streak >= 100) {
    return {
      level: 'elite',
      color: 'text-amber-600 dark:text-amber-400',
      emoji: '🏆',
      message: 'Elite! 100+ dias consecutivos!',
    };
  }
  if (streak >= 30) {
    return {
      level: 'dedicado',
      color: 'text-blue-600 dark:text-blue-400',
      emoji: '🔥',
      message: 'Dedicado! 30 dias seguidos!',
    };
  }
  if (streak >= 7) {
    return {
      level: 'regular',
      color: 'text-green-600 dark:text-green-400',
      emoji: '⭐',
      message: 'Regular! Continue assim!',
    };
  }
  return {
    level: 'iniciante',
    color: 'text-gray-600 dark:text-gray-400',
    emoji: '🌱',
    message: 'Continue para atingir 7 dias!',
  };
}
