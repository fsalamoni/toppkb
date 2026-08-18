import { db } from '../config/env';

/**
 * Verifica se o usuário aceitou o termo de consentimento.
 */
export async function consentMiddleware(req: any, res: any, next: any): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: { code: 'unauthenticated', message: 'Usuário não autenticado' } });
      return;
    }
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      res.status(403).json({ error: { code: 'forbidden', message: 'Usuário não encontrado' } });
      return;
    }
    const consent = snap.data()?.consent;
    if (!consent) {
      res.status(403).json({ error: { code: 'consent_required', message: 'Consentimento não aceito' } });
      return;
    }
    next();
  } catch (e: any) {
    res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
}
