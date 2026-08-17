/**
 * Feature flags — controlar funcionalidades em runtime.
 */
export const FEATURES = {
  AUTH_MAGIC_LINK: true,
  CHAT_MULTI_AGENTE: true,
  REGISTRO_TREINO: true,
  REGISTRO_PARTIDA: true,
  REGISTRO_ALIMENTACAO: true,
  REGISTRO_PESO: true,
  REGISTRO_DOR: true,
  REGISTRO_SONO: true,
  METRICAS_AGREGADAS: true,
  TORNEIOS: true,
  METAS: true,
  VECTOR_SEARCH_ESTUDOS: false, // fase 2
  LLM_PESSOAL: false, // fase 2
  ADMIN_PANEL: false, // fase 2
  LGPD_CONSENT: true,
} as const;

export type Feature = keyof typeof FEATURES;

export function isEnabled(feature: Feature): boolean {
  return FEATURES[feature] === true;
}
