import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  chatOpen: boolean;

  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  openChat: () => void;
  closeChat: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      chatOpen: false,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'dark') document.documentElement.classList.add('dark');
          else if (theme === 'light') document.documentElement.classList.remove('dark');
          else {
            const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefers) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
          }
        }
      },
      openChat: () => set({ chatOpen: true }),
      closeChat: () => set({ chatOpen: false }),
    }),
    { name: 'toppkb-ui' },
  ),
);
