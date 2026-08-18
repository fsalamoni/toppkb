import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  temaEscuro: boolean;
  theme?: 'light' | 'dark';
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleTema: () => void;
  setTema: (escuro: boolean) => void;
  setTheme?: (theme: 'light' | 'dark') => void;
  addToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  temaEscuro: true,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  toggleTema: () => set((s) => ({ temaEscuro: !s.temaEscuro })),
  setTema: (escuro) => set({ temaEscuro: escuro }),
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
