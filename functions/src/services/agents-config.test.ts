import { describe, it, expect } from 'vitest';
import {
  defaultAgentsConfig,
  defaultAgentConfig,
  normalizeAgentsConfig,
  normalizeUserAgentModels,
  resolveAgentLLMConfig,
  AGENT_IDS,
  type AgentConfig,
} from './agents-config';
import type { LLMConfigLike } from './llm-providers';

describe('defaultAgentsConfig', () => {
  it('retorna 5 agentes (TopPKB)', () => {
    const config = defaultAgentsConfig();
    expect(Object.keys(config.agents)).toHaveLength(5);
  });
  it('inclui treinador, preparador, nutricionista, estrategista, general', () => {
    const config = defaultAgentsConfig();
    expect(config.agents.treinador).toBeDefined();
    expect(config.agents.preparador).toBeDefined();
    expect(config.agents.nutricionista).toBeDefined();
    expect(config.agents.estrategista).toBeDefined();
    expect(config.agents.general).toBeDefined();
  });
  it('todos começam com mode=global', () => {
    const config = defaultAgentsConfig();
    for (const id of AGENT_IDS) {
      expect(config.agents[id].model.mode).toBe('global');
    }
  });
  it('todos começam enabled=true', () => {
    const config = defaultAgentsConfig();
    for (const id of AGENT_IDS) {
      expect(config.agents[id].enabled).toBe(true);
    }
  });
  it('treinador tem skills de fundamentos', () => {
    const config = defaultAgentsConfig();
    expect(config.agents.treinador.skills.length).toBeGreaterThan(0);
    expect(config.agents.treinador.skills[0].name).toContain('Fundamentos');
  });
});

describe('normalizeAgentsConfig', () => {
  it('preenche com defaults quando input é vazio', () => {
    const normalized = normalizeAgentsConfig({});
    expect(Object.keys(normalized.agents)).toHaveLength(5);
  });
  it('preenche com defaults quando input é null', () => {
    const normalized = normalizeAgentsConfig(null);
    expect(Object.keys(normalized.agents)).toHaveLength(5);
  });
  it('preserva customização de um agente', () => {
    const input = {
      agents: {
        treinador: { enabled: false, model: { mode: 'custom', provider: 'openai' as const, model: 'gpt-4o' }, skills: [] },
      },
    };
    const normalized = normalizeAgentsConfig(input);
    expect(normalized.agents.treinador.enabled).toBe(false);
    expect(normalized.agents.treinador.model.mode).toBe('custom');
    expect(normalized.agents.treinador.model.provider).toBe('openai');
    expect(normalized.agents.treinador.model.model).toBe('gpt-4o');
  });
  it('mantém defaults para agentes não mencionados', () => {
    const input = { agents: { treinador: { enabled: false } } };
    const normalized = normalizeAgentsConfig(input);
    expect(normalized.agents.preparador.enabled).toBe(true);
  });
});

describe('resolveAgentLLMConfig', () => {
  const global: LLMConfigLike = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: 'global-key',
  };

  it('retorna custom quando tem provider+model+apiKey', () => {
    const agent: AgentConfig = {
      id: 'treinador',
      label: 'Treinador',
      enabled: true,
      model: {
        mode: 'custom',
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: 'openai-key',
      },
      skills: [],
    };
    const result = resolveAgentLLMConfig(agent, global);
    expect(result?.provider).toBe('openai');
    expect(result?.apiKey).toBe('openai-key');
  });

  it('cai no global quando custom incompleto', () => {
    const agent: AgentConfig = {
      id: 'treinador',
      label: 'Treinador',
      enabled: true,
      model: { mode: 'custom', provider: 'openai' },
      skills: [],
    };
    const result = resolveAgentLLMConfig(agent, global);
    expect(result?.provider).toBe('google');
    expect(result?.apiKey).toBe('global-key');
  });

  it('cai no global quando mode=global', () => {
    const agent: AgentConfig = {
      id: 'treinador',
      label: 'Treinador',
      enabled: true,
      model: { mode: 'global' },
      skills: [],
    };
    const result = resolveAgentLLMConfig(agent, global);
    expect(result?.provider).toBe('google');
  });

  it('retorna null se global é null e custom é incompleto', () => {
    const agent: AgentConfig = {
      id: 'treinador',
      label: 'Treinador',
      enabled: true,
      model: { mode: 'global' },
      skills: [],
    };
    const result = resolveAgentLLMConfig(agent, null);
    expect(result).toBeNull();
  });
});

describe('normalizeUserAgentModels', () => {
  it('extrai modelos de { agents: {...} }', () => {
    const input = { agents: { treinador: { mode: 'custom' as const, provider: 'openai' as const, model: 'gpt-4o', apiKey: 'k' } } };
    const result = normalizeUserAgentModels(input);
    expect(result.treinador?.model).toBe('gpt-4o');
  });
  it('extrai modelos de {...} direto', () => {
    const input = { treinador: { mode: 'custom' as const, provider: 'openai' as const, model: 'gpt-4o', apiKey: 'k' } };
    const result = normalizeUserAgentModels(input);
    expect(result.treinador?.model).toBe('gpt-4o');
  });
  it('retorna objeto vazio para input inválido', () => {
    expect(normalizeUserAgentModels(null)).toEqual({});
    expect(normalizeUserAgentModels('string')).toEqual({});
  });
});
