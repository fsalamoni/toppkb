import { describe, it, expect } from 'vitest';
import { maskKey, isMaskedKey, defaultBaseUrl, LLM_PROVIDERS, withTimeout } from './llm-providers';

describe('maskKey', () => {
  it('mascara chaves longas', () => {
    expect(maskKey('sk-1234567890abcdef')).toBe('sk-1••••••••cdef');
  });
  it('retorna vazio para string vazia', () => {
    expect(maskKey('')).toBe('');
  });
  it('mascara chaves curtas com ••••', () => {
    expect(maskKey('abc')).toBe('••••••••');
  });
});

describe('isMaskedKey', () => {
  it('detecta string vazia', () => {
    expect(isMaskedKey('')).toBe(true);
  });
  it('detecta chave mascarada', () => {
    expect(isMaskedKey('sk-1••••••••cdef')).toBe(true);
  });
  it('aceita chave real', () => {
    expect(isMaskedKey('sk-1234567890')).toBe(false);
  });
  it('rejeita não-string', () => {
    expect(isMaskedKey(undefined)).toBe(true);
    expect(isMaskedKey(null)).toBe(true);
    expect(isMaskedKey(123)).toBe(true);
  });
});

describe('defaultBaseUrl', () => {
  it('retorna URL para OpenAI', () => {
    expect(defaultBaseUrl('openai')).toBe('https://api.openai.com/v1');
  });
  it('retorna URL para Anthropic', () => {
    expect(defaultBaseUrl('anthropic')).toBe('https://api.anthropic.com/v1');
  });
  it('retorna URL para Ollama', () => {
    expect(defaultBaseUrl('ollama')).toBe('http://localhost:11434/v1');
  });
  it('retorna vazio para Google', () => {
    expect(defaultBaseUrl('google')).toBe('');
  });
});

describe('LLM_PROVIDERS', () => {
  it('lista 17 providers', () => {
    expect(LLM_PROVIDERS).toHaveLength(17);
  });
  it('inclui principais', () => {
    expect(LLM_PROVIDERS).toContain('google');
    expect(LLM_PROVIDERS).toContain('openai');
    expect(LLM_PROVIDERS).toContain('anthropic');
    expect(LLM_PROVIDERS).toContain('deepseek');
  });
});

describe('withTimeout', () => {
  it('resolve quando a promise resolve antes do timeout', async () => {
    const p = new Promise<string>((resolve) => setTimeout(() => resolve('ok'), 10));
    const result = await withTimeout(p, 100, 'test');
    expect(result).toBe('ok');
  });

  it('rejeita quando a promise demora mais que o timeout', async () => {
    const p = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 200));
    await expect(withTimeout(p, 50, 'test')).rejects.toThrow('test excedeu o timeout de 0.05s');
  });
});
