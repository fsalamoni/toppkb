/**
 * Helpers de analytics + lista de exercícios para admin dashboard.
 * Sprint 75.1 — usado por /admin/analytics
 */

import {
  getMostViewed as _getMostViewed,
  getLeastViewedExercises as _getLeastViewed,
  getEventCount as _getEventCount,
  getEventSummary as _getEventSummary,
  getStepsViewedCount as _getStepsViewedCount,
  clearAnalytics as _clearAnalytics,
} from './analytics';
import { KETTLEBELL_EXERCICIOS } from '@/data/seed/exercicios-kettlebell';

export {
  _getMostViewed as getMostViewed,
  _getLeastViewed as getLeastViewedExercises,
  _getEventCount as getEventCount,
  _getEventSummary as getEventSummary,
  _getStepsViewedCount as getStepsViewedCount,
  _clearAnalytics as clearAnalytics,
};

export const KETTLEBELL_EXERCICIOS_LIST = KETTLEBELL_EXERCICIOS.map((e) => e.id);
