/**
 * Chat API — wrapper para envio/recebimento de mensagens.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export type ChatAgent = 'treinador' | 'preparador' | 'nutricionista' | 'estrategista' | 'general';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    agente?: ChatAgent;
    model?: string;
    provider?: string;
    latenciaMs?: number;
    piiRemoved?: number;
    feedbackPositivo?: boolean;
    feedbackComentario?: string;
  };
  sources?: Array<{ id: string; content: string; similarity: number }>;
}

export interface ChatRequest {
  message: string;
  conversaId?: string;
  agente?: ChatAgent | 'auto';
}

export interface ChatResponse {
  text: string;
  agenteUsado: ChatAgent;
  tokens: { input: number; output: number; total: number };
  latenciaMs: number;
  model: string;
  provider: string;
  sources: Array<{ id: string; content: string; similarity: number }>;
  piiRemoved: number;
  conversaId: string;
  messageId: string;
}

export async function sendMessage(req: ChatRequest): Promise<ChatResponse> {
  const fn = httpsCallable(functions, 'api');
  const result = await fn({ path: '/chat/message', body: req });
  return (result.data as any).data as ChatResponse;
}

export async function listConversas(): Promise<Array<{ id: string; titulo: string; updatedAt: string }>> {
  const fn = httpsCallable<unknown, { items: any[] }>(functions, 'listConversas');
  const result = await fn({});
  return result.data.items;
}

export async function listMensagens(conversaId: string): Promise<ChatMessage[]> {
  const fn = httpsCallable<unknown, { items: ChatMessage[] }>(functions, 'listMensagens');
  const result = await fn({ conversaId });
  return result.data.items;
}

export async function saveFeedback(messageId: string, conversaId: string, feedbackPositivo: boolean, comentario?: string) {
  const fn = httpsCallable(functions, 'saveFeedback');
  await fn({ messageId, conversaId, feedbackPositivo, comentario });
}
