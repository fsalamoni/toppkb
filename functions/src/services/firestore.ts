/**
 * Helper para Firestore com tipagem.
 *
 * CRÍTICO: Cloud Functions Gen 2 cria app admin com nome `__FIREBASE_FUNCTIONS_SDK__`
 * (NÃO `[DEFAULT]`). `admin.firestore()` falha com
 * "The default Firebase app does not exist" se chamado sem app explícito.
 *
 * Solução: usa o shim centralizado em `config/firestore-shim.ts`.
 */
import * as admin from 'firebase-admin';
import { getOrCreateApp } from '../config/firestore-shim';

export function getFirestore() {
  return admin.firestore(getOrCreateApp());
}

export { FieldValue, Timestamp } from 'firebase-admin/firestore';
