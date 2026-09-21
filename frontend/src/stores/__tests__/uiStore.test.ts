/**
 * Testes do uiStore — gerencia estado global de UI
 *
 * Cobre:
 * - Theme dark/light
 * - Sidebar open/close
 * - Toasts add/remove
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore - theme', () => {
  beforeEach(() => {
    // Reset do estado antes de cada teste
    useUIStore.setState({ theme: 'dark', sidebarOpen: true, toasts: [] });
  });

  it('inicia com tema dark por padrão', () => {
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('toggleTheme alterna entre dark e light', () => {
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');

    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('setTheme define tema explicitamente', () => {
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');

    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('alias setTema funciona (compat)', () => {
    useUIStore.getState().setTema(true);
    expect(useUIStore.getState().theme).toBe('dark');

    useUIStore.getState().setTema(false);
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('alias toggleTema funciona (compat)', () => {
    useUIStore.getState().toggleTema();
    expect(useUIStore.getState().theme).toBe('light');
  });
});

describe('uiStore - sidebar', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true });
  });

  it('toggleSidebar alterna open/closed', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('setSidebar define estado explicitamente', () => {
    useUIStore.getState().setSidebar(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().setSidebar(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });
});

describe('uiStore - toasts', () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [] });
  });

  it('addToast adiciona novo toast com id único', () => {
    useUIStore.getState().addToast({ type: 'info', message: 'Hello' });

    const toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].id).toBeDefined();
  });

  it('addToast suporta múltiplos tipos', () => {
    useUIStore.getState().addToast({ type: 'success', message: 'OK' });
    useUIStore.getState().addToast({ type: 'error', message: 'Erro' });
    useUIStore.getState().addToast({ type: 'warning', message: 'Cuidado' });
    useUIStore.getState().addToast({ type: 'info', message: 'Info' });

    const toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(4);
    expect(toasts.map((t) => t.type)).toEqual(['success', 'error', 'warning', 'info']);
  });

  it('removeToast remove toast pelo id', () => {
    useUIStore.getState().addToast({ type: 'info', message: 'a' });
    useUIStore.getState().addToast({ type: 'info', message: 'b' });

    const [, second] = useUIStore.getState().toasts;
    useUIStore.getState().removeToast(second.id);

    const remaining = useUIStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('a');
  });

  it('removeToast ignora ids inexistentes', () => {
    useUIStore.getState().addToast({ type: 'info', message: 'a' });
    useUIStore.getState().removeToast('id-que-nao-existe');

    expect(useUIStore.getState().toasts).toHaveLength(1);
  });

  it('toast expira após 5 segundos', async () => {
    useUIStore.setState({ toasts: [] });
    useUIStore.getState().addToast({ type: 'info', message: 'expirar' });
    expect(useUIStore.getState().toasts).toHaveLength(1);

    // Espera 5.1 segundos
    await new Promise((resolve) => setTimeout(resolve, 5100));
    expect(useUIStore.getState().toasts).toHaveLength(0);
  }, 6000);
});
