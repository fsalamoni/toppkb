/**
 * useExercisePractice — Hook para abrir o PracticeMode de qualquer lugar.
 */
import { useState, useCallback } from 'react';
import type { ExercicioKettlebell } from '@/data/seed/exercicios-kettlebell';

export function useExercisePractice() {
  const [practiceEx, setPracticeEx] = useState<ExercicioKettlebell | null>(null);

  const openPractice = useCallback((ex: ExercicioKettlebell) => {
    setPracticeEx(ex);
  }, []);

  const closePractice = useCallback(() => {
    setPracticeEx(null);
  }, []);

  return {
    practiceEx,
    openPractice,
    closePractice,
  };
}
