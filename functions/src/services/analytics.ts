/**
 * Analytics — log estruturado de eventos para métricas internas.
 */

import { db } from '../config/env';

export type AnalyticsEvent =
  | 'chat'
  | 'registro.criado'
  | 'registro.deletado'
  | 'login'
  | 'logout'
  | 'avaliacao.preenchida'
  | 'torneio.inscrito'
  | 'meta.criada'
  | 'meta.conquistada'
  | 'admin.llm.configurado'
  | 'admin.agente.configurado'
  | 'exportar.dados'
  | 'conta.deletada';

export async function logAnalytics(
  event: AnalyticsEvent,
  metadata: Record<string, any> = {},
  uid?: string,
): Promise<void> {
  try {
    await db.collection('analytics').add({
      event,
      metadata,
      uid: uid || null,
      timestamp: new Date(),
    });
  } catch (e) {
    // não bloqueia o fluxo principal se analytics falhar
    console.warn('analytics.log.error', e);
  }
}
