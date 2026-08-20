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

// Perfil vive em /toppkb_users/{uid}/profile/main (mesmo caminho usado pelo
// frontend e pelo onboarding). O caminho antigo 'users/{uid}' foi migrado.
function profileRef(uid: string) {
  return db.collection('toppkb_users').doc(uid).collection('profile').doc('main');
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await profileRef(uid).get();
  if (!snap.exists) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  // set com merge cria o doc se ainda não existir (update falharia).
  await profileRef(uid).set(
    {
      ...patch,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}
