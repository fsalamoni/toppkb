/**
 * 🔥 Helpers de path do Firestore
 *
 * IMPORTANTE: DocumentReferences precisam de número PAR de segmentos.
 *              CollectionReferences precisam de número ÍMPAR de segmentos.
 *
 * O caminho `toppkb_users/{uid}/treinamento/sessoes` tem 4 segmentos (par)
 * e ERRA ao usar como collection. Por isso, todas as sub-collections de
 * treinamento foram renomeadas para evitar o conflito:
 *
 *   toppkb_users/{uid}/treinamento_sessoes  (3 seg = ímpar = col ✓)
 *   toppkb_users/{uid}/treinamento_sessoes/{id}  (4 seg = par = doc ✓)
 *
 * Esta função é a ÚNICA forma de acessar essas collections no projeto.
 */

import { collection, doc, type CollectionReference, type DocumentReference, type Firestore } from 'firebase/firestore';

type TFirestore = Firestore;

const TREINO_SUBCOLLECTIONS = [
  'sessoes',
  'planos',
  'metas',
  'notas',
  'avaliacoes',
  'templates',
  'composicao',
  'prs',
] as const;

type SubCollection = (typeof TREINO_SUBCOLLECTIONS)[number];

/**
 * Referência a uma collection de treinamento (sessoes, planos, etc).
 * Path: toppkb_users/{uid}/treinamento_{sub} (3 seg = ímpar = col ✓)
 */
export function treinoCol(db: TFirestore, uid: string, sub: SubCollection): CollectionReference {
  return collection(db, 'toppkb_users', uid, `treinamento_${sub}`);
}

/**
 * Referência a um documento específico de uma collection de treinamento.
 * Path: toppkb_users/{uid}/treinamento_{sub}/{docId} (4 seg = par = doc ✓)
 */
export function treinoDoc(db: TFirestore, uid: string, sub: SubCollection, docId: string): DocumentReference {
  return doc(db, 'toppkb_users', uid, `treinamento_${sub}`, docId);
}

/**
 * Plano ativo (Meu Programa) — caminho especial corrigido.
 * Path: toppkb_users/{uid}/programa/atual (4 seg = par = doc ✓)
 */
export function programaAtualDoc(db: TFirestore, uid: string): DocumentReference {
  return doc(db, 'toppkb_users', uid, 'programa', 'atual');
}

export { TREINO_SUBCOLLECTIONS };
export type { SubCollection };
