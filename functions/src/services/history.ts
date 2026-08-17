/**
 * History service — gerencia conversas e mensagens no Firestore.
 */

import { db } from '../config/env';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AgenteId } from './ai/router';

export interface Conversa {
  id: string;
  titulo: string;
  agente: AgenteId | 'auto';
  topico: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  ativo: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agente?: AgenteId;
  metadata?: {
    tokensUsados?: number;
    tokensInput?: number;
    tokensOutput?: number;
    latenciaMs?: number;
    model?: string;
    provider?: string;
    feedbackPositivo?: boolean;
  };
  createdAt: Timestamp;
}

/**
 * Salva mensagem em uma conversa existente ou cria uma nova.
 * Retorna o ID da conversa (existente ou nova) e o ID da mensagem.
 */
export async function saveMessage(
  uid: string,
  conversaId: string | undefined,
  role: 'user' | 'assistant' | 'system',
  content: string,
  agente?: AgenteId,
  metadata?: Message['metadata'],
): Promise<{ conversationId: string; messageId: string }> {
  let convId = conversaId;

  // Cria conversa se necessário
  if (!convId) {
    const ref = db.collection('users').doc(uid).collection('conversas').doc();
    convId = ref.id;
    await ref.set({
      titulo: content.slice(0, 50),
      agente: agente || 'general',
      topico: agente || 'general',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      messageCount: 0,
      ativo: true,
    });
  }

  // Salva mensagem
  const msgRef = await db
    .collection('users').doc(uid)
    .collection('conversas').doc(convId)
    .collection('messages').add({
      role,
      content,
      agente: agente || null,
      metadata: metadata || null,
      createdAt: FieldValue.serverTimestamp(),
    });

  // Atualiza conversa
  await db
    .collection('users').doc(uid)
    .collection('conversas').doc(convId)
    .update({
      updatedAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      agente: agente || 'general',
    });

  return { conversationId: convId, messageId: msgRef.id };
}

/**
 * Carrega histórico recente de uma conversa.
 */
export async function getRecentHistory(
  uid: string,
  conversaId: string | undefined,
  limit = 6,
): Promise<Message[]> {
  if (!conversaId) return [];

  try {
    const snap = await db
      .collection('users').doc(uid)
      .collection('conversas').doc(conversaId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snap.docs
      .reverse()
      .map((d) => ({ id: d.id, ...d.data() } as Message));
  } catch {
    return [];
  }
}

/**
 * Lista todas as conversas do user.
 */
export async function listConversations(uid: string, limit = 50): Promise<Conversa[]> {
  const snap = await db
    .collection('users').doc(uid)
    .collection('conversas')
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversa));
}
