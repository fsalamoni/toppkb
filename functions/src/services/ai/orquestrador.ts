/**
 * Orquestrador multi-agente.
 *
 * Fluxo de uma mensagem do usuário:
 *  1. Detecta o agente (router.ts) se for 'auto'
 *  2. Carrega config do agente (admin) + config pessoal (user) + global
 *  3. Resolve LLMConfigLike efetivo (hierarquia)
 *  4. Carrega system prompt do agente (carrega skills default + custom)
 *  5. Carrega contexto do usuário (peso, lesões, último treino, etc)
 *  6. Carrega histórico recente da conversa
 *  7. Monta mensagens e chama o provider via generateWithProvider
 */

import { AgenteId, detectarAgente } from './router';
import { carregarSystemPrompt, PROMPTS } from '../../prompts';
import { generateWithProvider } from '../llm-providers';
import { resolveEffectiveLLMConfig } from '../llm-config';
import { loadAgentsConfig, resolveAgentLLMConfig, defaultAgentsConfig, type AgentConfig, type AgentsConfig } from '../agents-config';
import { db, logger } from '../../config/env';
import { LLMMessage } from '../llm-providers';

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

    // Próximo torneio
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

/**
 * Monta o system prompt final combinando:
 *  - System prompt base do agente (do arquivo .ts)
 *  - Skills customizadas do agente (admin-config/agents/{id}.skills)
 *  - Contexto do usuário (peso, lesões, etc)
 */
function montarSystemPrompt(
  agente: AgenteId,
  agentConfig: AgentConfig | undefined,
  ctx: ContextoUsuario,
): string {
  const base = PROMPTS[agente] || PROMPTS.general;

  // Adiciona skills customizadas (se habilitadas)
  let skillsExtra = '';
  if (agentConfig && agentConfig.skills.length > 0) {
    const ativas = agentConfig.skills.filter((s) => s.enabled);
    if (ativas.length > 0) {
      skillsExtra = '\n\n# INSTRUÇÕES CUSTOMIZADAS (pelo admin)\n' +
        ativas.map((s) => `## ${s.name}\n${s.prompt}`).join('\n\n');
    }
  }

  // Contexto do usuário
  const contextoStr = `
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

  return `${base}${skillsExtra}${contextoStr}`;
}

export interface RespostaOrquestrador {
  texto: string;
  agenteUsado: AgenteId;
  tokens: { input: number; output: number; total: number };
  latenciaMs: number;
  model: string;
  provider: string;
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

  // 2) Carrega config dos agentes (admin)
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
    };
  }

  // 3) Resolve config LLM efetivo (hierarquia)
  const llmConfig = await resolveEffectiveLLMConfig(agentConfig, uid);

  if (!llmConfig || !llmConfig.apiKey) {
    if (llmConfig && llmConfig.provider !== 'google') {
      return {
        texto: '⚠️ Configure uma API key para este LLM em Configurações → LLM.',
        agenteUsado: agente,
        tokens: { input: 0, output: 0, total: 0 },
        latenciaMs: Date.now() - start,
        model: llmConfig.model,
        provider: llmConfig.provider,
      };
    }
    return {
      texto: '⚠️ Nenhum LLM configurado. Peça ao administrador para configurar a chave global ou adicione sua própria em Configurações.',
      agenteUsado: agente,
      tokens: { input: 0, output: 0, total: 0 },
      latenciaMs: Date.now() - start,
      model: 'n/a',
      provider: 'n/a',
    };
  }

  // 4) System prompt
  const ctx = await carregarContextoUsuario(uid);
  const systemPrompt = montarSystemPrompt(agente, agentConfig, ctx);

  // 5) Histórico
  const historico = await carregarHistorico(uid, conversaId);

  // 6) Monta mensagens
  const messages: LLMMessage[] = [
    ...historico,
    { role: 'user', content: mensagem },
  ];

  // 7) Chama provider
  const result = await generateWithProvider({
    systemPrompt,
    messages,
    config: llmConfig,
  });

  return {
    texto: result.content,
    agenteUsado: agente,
    tokens: result.tokens,
    latenciaMs: Date.now() - start,
    model: result.model,
    provider: result.provider,
  };
}

/**
 * Sugere redirecionamento para outro agente (cross-sell no chat).
 */
export function sugerirAgente(mensagem: string): AgenteId | null {
  const ag = detectarAgente(mensagem);
  // Se for 'general', não sugere
  if (ag === 'general') return null;
  return ag;
}
