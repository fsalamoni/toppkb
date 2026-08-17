import { Response, NextFunction } from 'express';
import { db } from '../config/env';
import { AuthedRequest } from './auth';

/**
 * Verifica se o usuário aceitou o termo de consentimento.
 */
export async function consentMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const snap = await db.collection('users').doc(req.uid).get();
    if (!snap.exists) {
      return res.status(403).json({ error: { code: 'forbidden', message: 'Usuário não encontrado' } });
    }
    const consent = snap.data()?.consent;
    if (!consent) {
      return res.status(403).json({ error: { code: 'consent_required', message: 'Consentimento não aceito' } });
    }
    next();
  } catch (e: any) {
    return res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
}
