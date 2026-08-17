/**
 * Profile service — gerencia perfil do atleta.
 */

import { db } from '../config/env';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  onboardingComplete: boolean;
  ladoDominante: 'destro' | 'canhoto';
  cidade?: string;
  estado?: string;
  parceiroDuplas?: string;
  tempoDeJogoMeses?: number;
  outrosEsportes?: string[];
  historicoLesoes?: string[];
  pesoInicial: number;
  altura: number;
  imcInicial: number;
  nivelInicial: 'iniciante' | 'iniciante-bom' | 'intermediario' | 'avancado';
  objetivoFinal: string;
  prazoMeses: number;
  pesoMeta: number;
  metaPosicao?: string;
  consent?: { acceptedAt: any; version: string; ip?: string };
  createdAt: any;
  updatedAt?: any;
  lastSeen?: any;
  preferences?: { theme: 'light' | 'dark' | 'auto'; language: 'pt-BR'; units: 'metric' };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  await db.collection('users').doc(uid).update({
    ...patch,
    updatedAt: new Date(),
  });
}
