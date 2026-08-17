import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserDoc } from '@/lib/api';

interface AuthState {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;

  setUser: (user: User | null) => void;
  setUserDoc: (doc: UserDoc | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userDoc: null,
  loading: true,

  setUser: (user) => set({ user }),
  setUserDoc: (userDoc) => set({ userDoc }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, userDoc: null, loading: false }),
}));
