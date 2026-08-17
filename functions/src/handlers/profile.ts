/**
 * Handler de profile — gerencia dados do perfil do atleta.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getUserProfile, updateUserProfile } from '../services/profile';

export const getMeHandler = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const profile = await getUserProfile(request.auth.uid);
    if (!profile) throw new HttpsError('not-found', 'Perfil não encontrado');
    return profile;
  },
);

export const updateMeHandler = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    const allowed = [
      'displayName', 'photoURL', 'preferences',
      'onboardingComplete', 'ladoDominante', 'cidade', 'estado',
      'parceiroDuplas', 'tempoDeJogoMeses', 'outrosEsportes',
      'historicoLesoes', 'pesoMeta', 'metaPosicao',
    ];
    const patch: any = {};
    for (const k of allowed) {
      if (k in request.data) patch[k] = request.data[k];
    }
    if (Object.keys(patch).length === 0) {
      throw new HttpsError('invalid-argument', 'Nenhum campo válido enviado');
    }
    await updateUserProfile(request.auth.uid, patch);
    return { ok: true };
  },
);
