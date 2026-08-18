/**
 * Namespace isolador do Top Pickleball 50+.
 * TODOS os paths deste app começam com `toppkb_`. Outras plataformas
 * (Cofrito, SIGO/CAOCIPP) usam outros paths e são invisíveis.
 */

export const NS = 'toppkb' as const;
export const NS_PREFIX = 'toppkb_' as const;

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

/** Valida que path começa com toppkb_. Throw se não. */
export function assertToppkbPath(path: string, context = ''): void {
  if (!path.startsWith(NS_PREFIX)) {
    throw new Error(
      `[namespace] Path inválido: "${path}"${context ? ` (${context})` : ''}. Deve começar com "${NS_PREFIX}".`,
    );
  }
}

/** Valida que uid é string não-vazia. */
export function assertUid(uid: unknown, context = ''): asserts uid is string {
  if (typeof uid !== 'string' || uid.length === 0) {
    throw new Error(`[namespace] UID inválido${context ? ` (${context})` : ''}`);
  }
}
