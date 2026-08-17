/**
 * Orquestrador — combina detecção de agente + contexto do usuário + Gemini.
 */

import { AgenteId } from './router';
import { carregarSystemPrompt } from '../../prompts';
import { gerarResposta } from './gemini';
import { db } from '../../config/env';
import { logger } from '../../config/env';

export interface ContextoUsuario {
  displayName?: string;
  pesoAtual?: number;
  pesoMeta?: number;
  objetivoFinal?: string;
  lesoesAtivas?: string[];
  ultimoTreino?: any;
  ultimaDor?: any;
}

export async function carregarContextoUsuario(uid: string): Promise<ContextoUsuario> {
  const ctx: ContextoUsuario = {};

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const d = userDoc.data()!;
      ctx.displayName = d.displayName;
      ctx.pesoAtual = d.pesoInicial;
      ctx.pesoMeta = d.pesoMeta;
      ctx.objetivoFinal = d.objetivoFinal;
    }

    // Último treino
    const ultimoTreino = await db
      .collection('users').doc(uid)
      .collection('treinos')
      .orderBy('data', 'desc')
      .limit(1)
      .get();
    if (!ultimoTreino.empty) {
      ctx.ultimoTreino = { id: ultimoTreino.docs[0].id, ...ultimoTreino.docs[0].data() };
    }

    // Última dor
    const ultimaDor = await db
      .collection('users').doc(uid)
      .collection('dores')
      .orderBy('data', 'desc')
      .limit(1)
      .get();
    if (!ultimaDor.empty) {
      ctx.ultimaDor = { id: ultimaDor.docs[0].id, ...ultimaDor.docs[0].data() };
    }
  } catch (e: any) {
    logger('orquestrador.carregarContexto.error', { message: e.message });
  }

  return ctx;
}

export async function carregarHistorico(
  uid: string,
  conversaId: string,
  limit = 10,
): Promise<{ role: 'user' | 'model'; content: string }[]> {
  try {
    const snap = await db
      .collection('users').doc(uid)
      .collection('conversas').doc(conversaId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // Reverse para ordem cronológica
    return snap.docs
      .reverse()
      .map((d) => {
        const data = d.data();
        return {
          role: data.role === 'user' ? 'user' as const : 'model' as const,
          content: data.content,
        };
      });
  } catch {
    return [];
  }
}

export async function responderComoAgente(
  uid: string,
  agente: AgenteId,
  mensagem: string,
  conversaId: string,
  usePro = false,
): Promise<{ texto: string; tokensUsados: number; latenciaMs: number }> {
  const systemPrompt = carregarSystemPrompt(agente);
  const contexto = await carregarContextoUsuario(uid);
  const historico = await carregarHistorico(uid, conversaId);

  // Monta contexto adicional no prompt
  const contextoStr = `
CONTEXTO DO ATLETA:
- Nome: ${contexto.displayName || 'Atleta'}
${contexto.pesoAtual ? `- Peso atual: ${contexto.pesoAtual}kg (meta: ${contexto.pesoMeta}kg)` : ''}
${contexto.objetivoFinal ? `- Objetivo: ${contexto.objetivoFinal}` : ''}
${contexto.ultimoTreino ? `- Último treino: ${contexto.ultimoTreino.tipo} (intensidade ${contexto.ultimoTreino.intensidade}/10)` : ''}
${contexto.ultimaDor ? `- Última dor: ${contexto.ultimaDor.regiao} (intensidade ${contexto.ultimaDor.intensidade}/10)` : ''}
`;

  const promptCompleto = `${systemPrompt}\n\n${contextoStr}`;

  const result = await gerarResposta(promptCompleto, mensagem, historico, usePro);

  return {
    texto: result.text,
    tokensUsados: result.tokensUsados,
    latenciaMs: result.latenciaMs,
  };
}
