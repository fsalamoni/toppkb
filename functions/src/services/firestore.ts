/**
 * Helper para Firestore com tipagem.
 */
import * as admin from 'firebase-admin';

export function getFirestore() {
  return admin.firestore();
}

export { FieldValue, Timestamp } from 'firebase-admin/firestore';
