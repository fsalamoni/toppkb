import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatAgent } from '@/lib/chat-api';

interface ChatState {
  conversaIdAtual: string | null;
  messages: ChatMessage[];
  agentePreferido: ChatAgent | 'auto';
  setConversaId: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clear: () => void;
  setAgentePreferido: (agente: ChatAgent | 'auto') => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversaIdAtual: null,
      messages: [],
      agentePreferido: 'auto',
      setConversaId: (id) => set({ conversaIdAtual: id }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      clear: () => set({ conversaIdAtual: null, messages: [] }),
      setAgentePreferido: (agente) => set({ agentePreferido: agente }),
    }),
    { name: 'toppkb-chat', partialize: (s) => ({ agentePreferido: s.agentePreferido }) },
  ),
);
