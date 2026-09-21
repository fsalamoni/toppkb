import { create } from 'zustand';

interface UIState {
  /** Tema atual (light/dark) — dark é default */
  theme: 'light' | 'dark';

  /** Sidebar aberta ou fechada (mobile) */
  sidebarOpen: boolean;

  /** Lista de toasts ativos */
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>;

  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;

  /** Toggle entre light e dark */
  toggleTheme: () => void;

  /** Define o tema explicitamente */
  setTheme: (theme: 'light' | 'dark') => void;

  /** Compat — alias de setTheme */
  setTema: (escuro: boolean) => void;

  /** Compat — alias de toggleTheme */
  toggleTema: () => void;

  addToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),

  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),

  // Compat — aliases para o código antigo
  setTema: (escuro) => set({ theme: escuro ? 'dark' : 'light' }),
  toggleTema: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
