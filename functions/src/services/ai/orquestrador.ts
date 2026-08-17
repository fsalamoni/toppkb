/**
 * Orquestrador multi-agente.
 *
 * Fluxo de uma mensagem do usuário:
 *  1. Detecta o agente (router.ts) se for 'auto'
 *  2. Anonimiza PII
 *  3. Recupera chunks relevantes do corpus (RAG)
 *  4. Carrega config do agente (admin) + config pessoal (user) + global
 *  5. Resolve LLMConfigLike efetivo (hierarquia 4 níveis)
 *  6. Carrega system prompt do agente + skills customizadas
 *  7. Carrega contexto do usuário (peso, lesões, último treino, etc)
 *  8. Carrega histórico recente da conversa
 *  9. Monta prompt e chama o agent runner
 */

import { AgenteId, detectarAgente } from './router';
import { carregarSystemPrompt, PROMPTS } from '../../prompts';
import { resolveEffectiveLLMConfig } from '../llm-config';
import { loadAgentsConfig, type AgentsConfig, type AgentConfigRef } from '../agents-config';
import { db, logger } from '../../config/env';
import { LLMMessage } from '../llm-providers';
import { runAgent } from '../../agents/runner';
import { retrieveRelevantChunks, RetrievedChunk } from '../retrieval';
import { anonymizeText } from '../anonymizer';
import { getUserProfile } from '../profile';

export interface ContextoUsuario {
  displayName?: string;
  pesoAtual?: number;
  pesoMeta?: number;
  altura?: number;
  imc?: number;
  objetivoFinal?: string;
  ladoDominante?: string;
  lesoesAtivas?: string[];
  ultimoTreino?: any;
  ultimaDor?: any;
  proximoTorneio?: any;
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
      ctx.altura = d.altura;
      ctx.imc = d.imcInicial;
      ctx.objetivoFinal = d.objetivoFinal;
      ctx.ladoDominante = d.ladoDominante;
    }

    const ultimoTreino = await db
      .collection('users').doc(uid)
      .collection('treinos')
      .orderBy('data', 'desc')
      .limit(1)
      .get();
    if (!ultimoTreino.empty) {
      ctx.ultimoTreino = { id: ultimoTreino.docs[0].id, ...ultimoTreino.docs[0].data() };
    }

    const ultimaDor = await db
      .collection('users').doc(uid)
      .collection('dores')
      .orderBy('data', 'desc')
      .limit(1)
      .get();
    if (!ultimaDor.empty) {
      ctx.ultimaDor = { id: ultimaDor.docs[0].id, ...ultimaDor.docs[0].data() };
    }

    const proxTorneio = await db
      .collection('users').doc(uid)
      .collection('torneios')
      .where('dataInicio', '>=', new Date().toISOString())
      .orderBy('dataInicio', 'asc')
      .limit(1)
      .get();
    if (!proxTorneio.empty) {
      ctx.proximoTorneio = { id: proxTorneio.docs[0].id, ...proxTorneio.docs[0].data() };
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
): Promise<LLMMessage[]> {
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
      .map((d) => {
        const data = d.data();
        return {
          role: data.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: data.content,
        };
      });
  } catch {
    return [];
  }
}

export interface RespostaOrquestrador {
  texto: string;
  agenteUsado: AgenteId;
  tokens: { input: number; output: number; total: number };
  latenciaMs: number;
  model: string;
  provider: string;
  sources?: RetrievedChunk[];
  piiRemoved?: number;
}

/**
 * Responde uma mensagem do usuário usando o agente apropriado.
 * Detecta automaticamente o agente se for 'auto'.
 */
export async function responderComoAgente(
  uid: string,
  agenteParam: AgenteId | 'auto',
  mensagem: string,
  conversaId: string,
): Promise<RespostaOrquestrador> {
  const start = Date.now();

  // 1) Detecta agente se for 'auto'
  const agente: AgenteId = agenteParam === 'auto' ? detectarAgente(mensagem) : agenteParam;

  // 2) Anonimiza PII
  const { text: mensagemLimpa, piiRemoved } = anonymizeText(mensagem);

  // 3) RAG — recupera chunks relevantes do corpus (usa provider de embedding configurado)
  const sources = await retrieveRelevantChunks(mensagemLimpa, {
    topK: 5,
    minSimilarity: 0.5,
    uid,
  });

  // 4) Carrega config dos agentes (admin)
  const agentsConfig: AgentsConfig = await loadAgentsConfig();
  const agentConfig = agentsConfig.agents[agente];

  if (agentConfig && !agentConfig.enabled) {
    return {
      texto: `O agente "${agente}" está desabilitado pelo administrador. Por favor, use outro agente.`,
      agenteUsado: agente,
      tokens: { input: 0, output: 0, total: 0 },
      latenciaMs: Date.now() - start,
      model: 'n/a',
      provider: 'n/a',
      sources: [],
      piiRemoved,
    };
  }

  // 5) Resolve config LLM efetivo (hierarquia)
  const llmConfig = await resolveEffectiveLLMConfig(agentConfig, uid);

  // 6) System prompt base
  const systemPromptBase = PROMPTS[agente] || PROMPTS.general;

  // 7) Contexto do usuário
  const ctx = await carregarContextoUsuario(uid);
  const contextoUsuario = `
# CONTEXTO DO ATLETA
- Nome: ${ctx.displayName || 'Atleta'}
${ctx.ladoDominante ? `- Lado dominante: ${ctx.ladoDominante}` : ''}
${ctx.pesoAtual ? `- Peso atual: ${ctx.pesoAtual}kg (meta: ${ctx.pesoMeta}kg)` : ''}
${ctx.altura ? `- Altura: ${ctx.altura}cm, IMC: ${ctx.imc?.toFixed(1) || 'N/A'}` : ''}
${ctx.objetivoFinal ? `- Objetivo: ${ctx.objetivoFinal}` : ''}
${ctx.ultimoTreino ? `- Último treino: ${ctx.ultimoTreino.tipo} (intensidade ${ctx.ultimoTreino.intensidade}/10)` : ''}
${ctx.ultimaDor ? `- Última dor: ${ctx.ultimaDor.regiao} (intensidade ${ctx.ultimaDor.intensidade}/10)` : ''}
${ctx.proximoTorneio ? `- Próximo torneio: ${ctx.proximoTorneio.nome} em ${new Date(ctx.proximoTorneio.dataInicio).toLocaleDateString('pt-BR')}` : ''}
`;

  // 8) Adiciona contexto de retrieval (RAG)
  let contextoRag = '';
  if (sources.length > 0) {
    contextoRag = `
# MATERIAL DE REFERÊNCIA (do seu corpus)
${sources.map((s, i) => `[${i + 1}] ${s.content.slice(0, 500)}...`).join('\n\n')}
`;
  }

  // 9) Histórico
  const historico = await carregarHistorico(uid, conversaId);

  // 10) Converte config (compatibilidade com AgentConfigRef)
  const agentConfigRef: AgentConfigRef = agentConfig
    ? {
        id: agentConfig.id,
        label: agentConfig.label,
        enabled: agentConfig.enabled,
        model: agentConfig.model,
        skills: agentConfig.skills,
      }
    : {
        id: agente,
        label: agente,
        enabled: true,
        model: { mode: 'global' },
        skills: [],
      };

  // 11) Executa o agent runner
  const result = await runAgent({
    agent: agentConfigRef,
    globalLLM: llmConfig,
    userMessage: mensagemLimpa,
    systemPromptBase,
    history: historico.filter((h) => h.role !== 'system'),
    additionalContext: contextoUsuario + contextoRag,
  });

  return {
    texto: result.text,
    agenteUsado: agente,
    tokens: result.tokens,
    latenciaMs: Date.now() - start,
    model: result.model,
    provider: result.provider,
    sources,
    piiRemoved,
  };
}

/**
 * Sugere redirecionamento para outro agente (cross-sell no chat).
 */
export function sugerirAgente(mensagem: string): AgenteId | null {
  const ag = detectarAgente(mensagem);
  if (ag === 'general') return null;
  return ag;
}
