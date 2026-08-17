import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { logger } from '../config/env';

export interface AuthedRequest extends Request {
  uid: string;
  email?: string;
  user: admin.auth.DecodedIdToken;
}

/**
 * Middleware que valida o ID Token do Firebase Auth.
 * Espera header: Authorization: Bearer {token}
 */
export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Token ausente' } });
  }
  const token = match[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    req.user = decoded;
    next();
  } catch (e: any) {
    logger('auth-middleware.error', { message: e.message });
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Token inválido' } });
  }
}
