/**
 * Helpers Firestore que forçam refresh do token antes de writes
 * para evitar "Missing or insufficient permissions" causado por
 * token stale cacheado no Firebase Auth.
 */

import {
  setDoc, addDoc, updateDoc, deleteDoc,
  DocumentReference, CollectionReference, WithFieldValue, SetOptions,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout após ${ms}ms`)), ms),
    ),
  ]);
}

/** Garante que o token JWT do user está atualizado (resolve PERMISSION_DENIED por stale token). */
export async function ensureFreshToken(user: User | null | undefined, timeoutMs = 5000): Promise<void> {
  if (!user) return;
  try {
    await withTimeout(user.getIdToken(true), timeoutMs, 'refresh token');
  } catch (e) {
    console.warn('[firestoreWithAuth] token refresh falhou, tentando mesmo assim:', e);
  }
}

/** setDoc com refresh de token + timeout */
export async function safeSetDoc<T>(
  user: User | null | undefined,
  ref: DocumentReference<T>,
  data: WithFieldValue<T>,
  options?: { merge?: boolean; timeoutMs?: number },
): Promise<void> {
  await ensureFreshToken(user);
  const { timeoutMs, ...setOptions } = options || {};
  await withTimeout(
    setDoc(ref, data, setOptions as SetOptions),
    timeoutMs ?? 10000,
    'setDoc',
  );
}

/** addDoc com refresh de token + timeout */
export async function safeAddDoc<T>(
  user: User | null | undefined,
  colRef: CollectionReference<T>,
  data: WithFieldValue<T>,
  options?: { timeoutMs?: number },
): Promise<DocumentReference<T>> {
  await ensureFreshToken(user);
  return withTimeout(
    addDoc(colRef, data),
    options?.timeoutMs ?? 10000,
    'addDoc',
  );
}

/** updateDoc com refresh de token + timeout */
export async function safeUpdateDoc(
  user: User | null | undefined,
  ref: DocumentReference<any>,
  data: any,
  options?: { timeoutMs?: number },
): Promise<void> {
  await ensureFreshToken(user);
  await withTimeout(
    updateDoc(ref, data),
    options?.timeoutMs ?? 10000,
    'updateDoc',
  );
}

/** deleteDoc com refresh de token + timeout */
export async function safeDeleteDoc(
  user: User | null | undefined,
  ref: DocumentReference<any>,
  options?: { timeoutMs?: number },
): Promise<void> {
  await ensureFreshToken(user);
  await withTimeout(
    deleteDoc(ref),
    options?.timeoutMs ?? 10000,
    'deleteDoc',
  );
}
