/**
 * Agents Config — configuração unificada dos agentes do Top Pickleball 50+.
 *
 * Modela cada agente (treinador, preparador, nutricionista, estrategista, general) com:
 *  - enabled: se o agente está ativo
 *  - model: como o agente resolve seu modelo LLM
 *      - mode 'global': usa o LLM global do admin
 *      - mode 'custom': usa provider/model/apiKey/baseUrl próprios
 *  - skills: comandos/instruções que orientam o agente (CRUD pelo admin)
 *
 * Persistido em `admin-config/agents` (via config-store, com envelope de auditoria).
 * O apiKey NUNCA é devolvido cru ao front — só `hasApiKey` + máscara. Ver handler.
 *
 * Inspirado no Cofrito.
 */
import { logger } from 'firebase-functions';
import { loadConfigDoc } from './config-store';
import type { LLMConfigLike, LLMProvider } from './llm-providers';

// ── Tipos ──────────────────────────────────────────────────────────────

/** IDs canônicos dos agentes configuráveis. */
export type AgentId =
  | 'treinador'
  | 'preparador'
  | 'nutricionista'
  | 'estrategista'
  | 'general';

export const AGENT_IDS: AgentId[] = [
  'treinador',
  'preparador',
  'nutricionista',
  'estrategista',
  'general',
];

/** Agentes que o usuário pode customizar por conta própria. */
export const USER_AGENT_IDS: AgentId[] = [
  'treinador',
  'preparador',
  'nutricionista',
  'estrategista',
  'general',
];

/** Skill/instrução que orienta um agente. */
export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  /** instrução/prompt injetado no system prompt do agente */
  prompt: string;
  enabled: boolean;
}

/** Como o agente resolve seu modelo LLM. */
export interface AgentModelConfig {
  /** 'global' = usa o LLM global do admin; 'custom' = usa os campos abaixo */
  mode: 'global' | 'custom';
  provider?: LLMProvider;
  model?: string;
  /** Guardado só no server; nunca devolvido cru ao front. */
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Configuração completa de um agente. */
export interface AgentConfig {
  id: AgentId;
  label: string;
  enabled: boolean;
  model: AgentModelConfig;
  skills: AgentSkill[];
}

/** Documento raiz da config de agentes. */
export interface AgentsConfig {
  agents: Record<AgentId, AgentConfig>;
}

// ── Defaults ────────────────────────────────────────────────────────────

const AGENT_LABELS: Record<AgentId, string> = {
  treinador: '🏓 Treinador (técnica/tática)',
  preparador: '💪 Preparador Físico (fisio/força)',
  nutricionista: '🥗 Nutricionista (alimentação)',
  estrategista: '🧠 Estrategista (torneios/métricas)',
  general: '🤖 Assistente Geral (navegação)',
};

function defaultSkill(id: string, name: string, description: string, prompt: string): AgentSkill {
  return { id, name, description, prompt, enabled: true };
}

function defaultSkillsFor(id: AgentId): AgentSkill[] {
  switch (id) {
    case 'treinador':
      return [
        defaultSkill(
          'treinador-fundamentos',
          'Fundamentos sólidos',
          'Prioriza domínio de dink, third shot drop, volley — não power.',
          'Para atletas 50+, priorize FUNDAMENTOS: dink consistente, third shot drop preciso, volley firme. Potência vem com técnica, não antes. Use drills progressivos e métricas simples (rally 20+, 8/10 no drop).',
        ),
        defaultSkill(
          'treinador-duplas',
          'Comunicação em duplas',
          'Enfatiza comunicação no jogo de duplas: mine/yours, switch.',
          'Em duplas, comunicação é tudo. Ensine o atleta a chamar "MINE!", "YOURS!", "SWITCH!" sempre. Posição stack para 50+ é mais simples e dá mais controle.',
        ),
        defaultSkill(
          'treinador-mental',
          'Jogo mental',
          'Rotina pré-ponto e gestão de erro.',
          'Atleta 50+ precisa de rotina: 1 respiração + split step + decisão. Erro passou, próximo ponto. Sem carregar emocionalmente. Foco no PROCESSO (execução) e não no RESULTADO.',
        ),
      ];

    case 'preparador':
      return [
        defaultSkill(
          'preparador-protocolo-lesao',
          'Protocolo lesão joelho/ombro',
          'Adapta treinos para não piorar joelho D e ombro E.',
          'O atleta tem joelho direito (prioridade #1) e ombro esquerdo (prioridade #2). NUNCA sugira agachamento profundo, corrida longa, saltos ou desenvolvimento militar pesado. Substitua por variações seguras (isometria parede, búlgaro, face pull, YTW).',
        ),
        defaultSkill(
          'preparador-periodizacao',
          'Periodização 50+',
          'Progressão 5-10% por semana, longevidade > potência.',
          'Para 50+, progressão máxima de 5-10% por semana. Longevidade > potência. Mover bem > mover muito. Rotina semanal: 2x força, 2x mobilidade, 1x cardio, 1x fisio, restante pickleball.',
        ),
        defaultSkill(
          'preparador-aquecimento',
          'Aquecimento 10min obrigatório',
          'Garante aquecimento antes de QUALQUER treino de pickleball.',
          'Antes de qualquer treino de pickleball, faça 10min de aquecimento: marcha + braço (2min), mobilidade 90/90 + torácica + cat-cow (3min), ativação band pull-apart + glute bridge + bird-dog (3min), dink leve (2min).',
        ),
      ];

    case 'nutricionista':
      return [
        defaultSkill(
          'nutricionista-comida-brasileira',
          'Comida brasileira acessível',
          'Recomenda arroz, feijão, frango, ovo — não modismos importados.',
          'SEMPRE use comida brasileira acessível: arroz, feijão, frango, ovo, peixe, frutas, legumes. Sem low-carb extremo, sem jejum agressivo, sem dieta da moda. Sustentabilidade > resultado rápido.',
        ),
        defaultSkill(
          'nutricionista-anti-inflamatorio',
          'Alimentação anti-inflamatória',
          'Prioriza ômega 3, cúrcuma, gengibre, frutas vermelhas — para joelho/ombro.',
          'Para reduzir inflamação no joelho e ombro, recomende: ômega 3 (peixe 3x/sem), cúrcuma 1g/dia com pimenta preta, gengibre, frutas vermelhas 1 xícara/dia. EVITAR: açúcar refinado, ultraprocessados, álcool, frituras.',
        ),
        defaultSkill(
          'nutricionista-deficit',
          'Déficit calórico moderado',
          'Déficit de -500 kcal/dia para emagrecimento sustentável.',
          'Para o atleta (95kg, meta 80kg), TMB ~1900 kcal, TDEE ~2950 kcal, déficit alvo -500 kcal/dia → 2450 kcal/dia. Macros: 190g proteína, 85g gordura, 230g carbo. NUNCA combine déficit agressivo com treino pesado.',
        ),
      ];

    case 'estrategista':
      return [
        defaultSkill(
          'estrategista-calendario',
          'Calendário competitivo inteligente',
          'Ajuda a escolher torneios (nível, categoria, data, custo).',
          'Para escolher torneio, considere: (1) nível compatível, (2) categoria certa (50+ quando completar 50; 45+ antes), (3) local acessível, (4) data no calendário (sem empilhar), (5) formato (round-robin p/ iniciante).',
        ),
        defaultSkill(
          'estrategista-metas',
          'Metas SMART trimestrais',
          'Quebra a meta "Top 1 Brasil 50+ em 2032" em metas SMART.',
          'Meta final 2032 = Top 10 nacional 50+. Quebre em: M12 = top 20% regional; M24 = top 10% estadual; M36 = top 5% estadual; M60 = top 3% estadual. Use DUPR como métrica (3.0 → 5.0 em 6 anos).',
        ),
        defaultSkill(
          'estrategista-metricas',
          'Métricas que importam',
          'Foca em métricas mensuráveis, não em vaidade.',
          'Acompanhe: peso semanal (meta -1,2kg/mês), horas treino/sem (12-15h), win rate (60% em 6m), ranking regional, dias sem dor aguda, avaliação mensal preenchida. Sem métrica, sem progresso.',
        ),
      ];

    case 'general':
      return [
        defaultSkill(
          'general-orientacao',
          'Orientação no app',
          'Ajuda o atleta a navegar o app e entender funcionalidades.',
          'Saudação acolhedora. Oriente sobre: dashboard, registros (treinos, partidas, peso, dor, sono, refeições), chat com especialistas, métricas, torneios, configurações. Use tom motivador e direto.',
        ),
        defaultSkill(
          'general-redirecionamento',
          'Detecta tema e sugere especialista',
          'Identifica o domínio da pergunta e sugere o agente certo.',
          'Se detectar tema técnico (drill, dink, third shot) → sugira Treinador. Lesão (joelho, ombro, dor) → Preparador. Comida → Nutricionista. Torneio/ranking → Estrategista. Redirecione, mas não force.',
        ),
      ];
  }
}

export function defaultAgentConfig(id: AgentId): AgentConfig {
  return {
    id,
    label: AGENT_LABELS[id],
    enabled: true,
    model: { mode: 'global' },
    skills: defaultSkillsFor(id),
  };
}

export function defaultAgentsConfig(): AgentsConfig {
  return {
    agents: {
      treinador: defaultAgentConfig('treinador'),
      preparador: defaultAgentConfig('preparador'),
      nutricionista: defaultAgentConfig('nutricionista'),
      estrategista: defaultAgentConfig('estrategista'),
      general: defaultAgentConfig('general'),
    },
  };
}

// ── Normalização (merge do que está salvo com os defaults) ──────────────

function normalizeSkill(raw: unknown): AgentSkill | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === 'string' ? r.name.trim() : '';
  if (!name) return null;
  const id = typeof r.id === 'string' && r.id ? r.id : `skill-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    name: name.slice(0, 120),
    description: typeof r.description === 'string' ? r.description.slice(0, 500) : '',
    prompt: typeof r.prompt === 'string' ? r.prompt.slice(0, 4000) : '',
    enabled: r.enabled !== false,
  };
}

function normalizeModel(raw: unknown): AgentModelConfig {
  if (typeof raw !== 'object' || raw === null) return { mode: 'global' };
  const r = raw as Record<string, unknown>;
  const mode = r.mode === 'custom' ? 'custom' : 'global';
  const model: AgentModelConfig = { mode };
  if (typeof r.provider === 'string') model.provider = r.provider as LLMProvider;
  if (typeof r.model === 'string') model.model = r.model;
  if (typeof r.apiKey === 'string') model.apiKey = r.apiKey;
  if (typeof r.baseUrl === 'string') model.baseUrl = r.baseUrl;
  if (typeof r.temperature === 'number') model.temperature = r.temperature;
  if (typeof r.maxTokens === 'number') model.maxTokens = r.maxTokens;
  return model;
}

function normalizeAgent(id: AgentId, raw: unknown): AgentConfig {
  const base = defaultAgentConfig(id);
  if (typeof raw !== 'object' || raw === null) return base;
  const r = raw as Record<string, unknown>;
  const skills = Array.isArray(r.skills)
    ? r.skills.map(normalizeSkill).filter((s): s is AgentSkill => s !== null)
    : base.skills;
  return {
    id,
    label: typeof r.label === 'string' && r.label ? r.label : base.label,
    enabled: r.enabled !== false,
    model: normalizeModel(r.model),
    // se o admin apagou todas as skills, respeitamos (lista vazia é válida)
    skills,
  };
}

/**
 * Normaliza um documento cru (parcial/legado) para a AgentsConfig completa,
 * preenchendo agentes ausentes com defaults.
 */
export function normalizeAgentsConfig(raw: unknown): AgentsConfig {
  const rawAgents = (typeof raw === 'object' && raw !== null && 'agents' in (raw as Record<string, unknown>))
    ? (raw as { agents?: unknown }).agents
    : raw;
  const agentsRecord = (typeof rawAgents === 'object' && rawAgents !== null)
    ? rawAgents as Record<string, unknown>
    : {};
  return {
    agents: {
      treinador: normalizeAgent('treinador', agentsRecord.treinador),
      preparador: normalizeAgent('preparador', agentsRecord.preparador),
      nutricionista: normalizeAgent('nutricionista', agentsRecord.nutricionista),
      estrategista: normalizeAgent('estrategista', agentsRecord.estrategista),
      general: normalizeAgent('general', agentsRecord.general),
    },
  };
}

// ── Load ────────────────────────────────────────────────────────────────

export const AGENTS_CONFIG_PATH = 'admin-config/agents';

/**
 * Lê a AgentsConfig persistida (sempre completa, mesclada com defaults).
 * Nunca lança — em erro, devolve os defaults.
 */
export async function loadAgentsConfig(): Promise<AgentsConfig> {
  try {
    const loaded = await loadConfigDoc<unknown>(AGENTS_CONFIG_PATH, 'agents');
    if (!loaded) return defaultAgentsConfig();
    return normalizeAgentsConfig(loaded.data);
  } catch (err) {
    logger.warn('loadAgentsConfig: falhou, usando defaults', { err: (err as Error).message });
    return defaultAgentsConfig();
  }
}

// ── Resolução do modelo efetivo ─────────────────────────────────────────

/**
 * Resolve o LLMConfigLike efetivo para um agente.
 *  - Se o agente está em modo 'custom' e tem provider+model+apiKey → usa o dele.
 *  - Caso contrário → cai no `global` fornecido.
 * Retorna null se nem custom nem global forem utilizáveis.
 */
export function resolveAgentLLMConfig(
  agent: AgentConfig | undefined,
  global: LLMConfigLike | null,
): LLMConfigLike | null {
  if (agent && agent.model.mode === 'custom') {
    const m = agent.model;
    if (m.provider && m.model && m.apiKey) {
      return {
        provider: m.provider,
        model: m.model,
        apiKey: m.apiKey,
        baseUrl: m.baseUrl,
        temperature: m.temperature,
        maxTokens: m.maxTokens,
      };
    }
    // custom incompleto → fallback para global (não trava a plataforma)
    logger.warn('resolveAgentLLMConfig: modo custom incompleto, usando global', { agentId: agent.id });
  }
  return global;
}

// ── Config por usuário (apenas modelos, sem skills) ─────────────────────

/** Mapa de modelos por-agente definidos por um usuário. */
export type UserAgentModels = Partial<Record<AgentId, AgentModelConfig>>;

/**
 * Normaliza a config de agentes de um usuário (só os modelos).
 * Aceita `{ agents: {...} }` ou o mapa direto `{ treinador: {...} }`.
 */
export function normalizeUserAgentModels(raw: unknown): UserAgentModels {
  const source = (typeof raw === 'object' && raw !== null && 'agents' in (raw as Record<string, unknown>))
    ? (raw as { agents?: unknown }).agents
    : raw;
  const out: UserAgentModels = {};
  if (typeof source !== 'object' || source === null) return out;
  const rec = source as Record<string, unknown>;
  for (const id of USER_AGENT_IDS) {
    if (id in rec) {
      out[id] = normalizeModel(rec[id]);
    }
  }
  return out;
}
