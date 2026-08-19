/**
 * Paths de Firestore (frontend) — namespace toppkb_.
 * Todas as coleções desta plataforma começam com `toppkb_`.
 */

export const NS = 'toppkb';
export const NS_PREFIX = 'toppkb_';

/** /toppkb_users/{uid} */
export const userDoc = (uid: string): string => `${NS_PREFIX}users/${uid}`;

/** /toppkb_users/{uid}/{collection}/{id?} */
export const userSubCol = (uid: string, collection: string, id?: string): string => {
  const base = `${NS_PREFIX}users/${uid}/${collection}`;
  return id ? `${base}/${id}` : base;
};

/** /toppkb_{collection}/{id} */
export const globalDoc = (collection: string, id: string): string =>
  `${NS_PREFIX}${collection}/${id}`;

/** /toppkb_{collection} */
export const globalCol = (collection: string): string => `${NS_PREFIX}${collection}`;

/** Sub-coleções do usuário */
export const USER_COLLECTIONS = {
  treinos: 'treinos',
  partidas: 'partidas',
  preparacao: 'preparacao',
  nutricao: 'nutricao',
  nutricaoAgua: 'nutricao_agua',
  nutricaoSuplementos: 'nutricao_suplementos',
  sono: 'sono',
  peso: 'peso',
  medidas: 'medidas',
  dores: 'dores',
  lesoes: 'lesoes',
  torneios: 'torneios',
  metas: 'metas',
  estudos: 'estudos',
  notas: 'notas',
  agregados: 'agregados',
} as const;
