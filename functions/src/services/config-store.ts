/**
 * Config Store — wrapper para salvar configs com envelope de auditoria.
 * Cada save registra quem/quando atualizou.
 */
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from './firestore';

export interface SaveConfigOptions {
  uid: string;
  path: string;
  tag: string;
}

/**
 * Salva uma config com envelope de auditoria.
 * Estrutura final em /<path>:
 * {
 *   data: {...config},
 *   updatedAt: Timestamp,
 *   updatedBy: uid,
 *   tag: string,
 * }
 */
export async function saveConfigDoc<T extends Record<string, unknown>>(
  data: T,
  options: SaveConfigOptions,
): Promise<{ savedAt: FirebaseFirestore.Timestamp }> {
  const db = getFirestore();
  const ref = db.doc(options.path);

  const payload = {
    data,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: options.uid,
    tag: options.tag,
  };

  await ref.set(payload, { merge: true });

  // Audit log
  await db.collection('audit').add({
    uid: options.uid,
    acao: 'config.saved',
    metadata: { path: options.path, tag: options.tag },
    timestamp: FieldValue.serverTimestamp(),
  });

  logger.info('config-store.saved', { path: options.path, tag: options.tag, uid: options.uid });

  const snap = await ref.get();
  const savedAt = snap.get('updatedAt') as FirebaseFirestore.Timestamp;
  return { savedAt };
}

/**
 * Carrega uma config do envelope. Retorna null se não existir.
 */
export async function loadConfigDoc<T = unknown>(
  path: string,
  _tag?: string,
): Promise<{ data: T; updatedAt: FirebaseFirestore.Timestamp; updatedBy: string } | null> {
  const db = getFirestore();
  const snap = await db.doc(path).get();
  if (!snap.exists) return null;
  const fields = snap.data() as Record<string, unknown>;
  return {
    data: fields.data as T,
    updatedAt: fields.updatedAt as FirebaseFirestore.Timestamp,
    updatedBy: fields.updatedBy as string,
  };
}
