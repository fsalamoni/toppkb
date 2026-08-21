import { describe, it, expect } from 'vitest';
import { nsPath, isToppkbPath, filterToppkbDocs, NS_PREFIX } from './db-namespace';

describe('db-namespace — isolamento total', () => {
  it('mapeia raízes legadas para o namespace toppkb_ canônico', () => {
    expect(nsPath('users')).toBe('toppkb_users');
    expect(nsPath('users/abc')).toBe('toppkb_users/abc');
    expect(nsPath('users/abc/treinos')).toBe('toppkb_users/abc/treinos');
    expect(nsPath('admins/uid1')).toBe('toppkb_admin/admins/uid1');
    expect(nsPath('admin-config/llm')).toBe('toppkb_admin/config/llm');
    expect(nsPath('audit')).toBe('toppkb_admin/audit_logs/logs');
    expect(nsPath('analytics')).toBe('toppkb_analytics');
    expect(nsPath('system/analytics-weekly')).toBe('toppkb_system/analytics-weekly');
    expect(nsPath('corpus/studies/studies')).toBe('toppkb_corpus/studies/studies');
  });

  it('NUNCA deixa uma raiz sem prefixo (fail-safe) — raiz desconhecida é prefixada', () => {
    expect(nsPath('qualquer_coisa')).toBe('toppkb_qualquer_coisa');
    expect(nsPath('cofrito/dados')).toBe('toppkb_cofrito/dados');
    // toda saída começa com toppkb_
    for (const p of ['users', 'admins', 'x', 'a/b/c', 'system', 'analytics']) {
      expect(nsPath(p).startsWith(NS_PREFIX)).toBe(true);
    }
  });

  it('não prefixa duas vezes um path já namespaced', () => {
    expect(nsPath('toppkb_users')).toBe('toppkb_users');
    expect(nsPath('toppkb_users/abc/treinos')).toBe('toppkb_users/abc/treinos');
    expect(nsPath('toppkb_admin/config/llm')).toBe('toppkb_admin/config/llm');
  });

  it('tolera barras iniciais', () => {
    expect(nsPath('/users/abc')).toBe('toppkb_users/abc');
  });

  it('isToppkbPath identifica o que pertence a este app', () => {
    expect(isToppkbPath('toppkb_users/abc')).toBe(true);
    expect(isToppkbPath('users/abc')).toBe(false);
    expect(isToppkbPath('cofrito_users/abc')).toBe(false);
  });

  it('filterToppkbDocs isola resultados de collectionGroup (cross-namespace)', () => {
    const docs = [
      { ref: { path: 'toppkb_users/u1/chat/c1/mensagens/m1' } },
      { ref: { path: 'cofrito_users/u2/chat/c2/mensagens/m2' } },
      { ref: { path: 'toppkb_corpus/studies/studies/s1/chunks/k1' } },
      { ref: { path: 'other/x/chunks/k2' } },
    ] as any[];
    const kept = filterToppkbDocs(docs);
    expect(kept).toHaveLength(2);
    expect(kept.every((d) => d.ref.path.startsWith('toppkb_'))).toBe(true);
  });
});
