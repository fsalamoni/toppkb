/**
 * Error tracking — usando Cloud Logging + console estruturado.
 * Em produção, pode-se integrar Sentry adicionando @sentry/node.
 */

import { logger } from '../config/env';

let initialized = false;

export function sentryInit() {
  if (initialized) return;
  initialized = true;
  logger('error-tracking init', { mode: 'console-structured' });
}

export function captureError(err: Error, context?: Record<string, unknown>) {
  console.error(JSON.stringify({
    type: 'error',
    message: err.message,
    stack: err.stack,
    ...context,
    timestamp: new Date().toISOString(),
  }));
}

export function captureMessage(msg: string, level: 'info' | 'warn' | 'error' = 'info', context?: Record<string, unknown>) {
  console[level === 'info' ? 'log' : level](JSON.stringify({
    type: 'message',
    level,
    msg,
    ...context,
    timestamp: new Date().toISOString(),
  }));
}
