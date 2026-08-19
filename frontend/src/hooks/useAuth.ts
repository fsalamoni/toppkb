import * as React from 'react';
import { useEffect, useState, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';

export interface UserDoc {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  pesoInicial?: number;
  pesoMeta?: number;
  altura?: number;
  imcInicial?: number;
  objetivoFinal?: string;
  ladoDominante?: string;
  consent?: boolean;
  onboardingComplete?: boolean;
  role?: 'user' | 'admin' | 'master';
  cidade?: string;
  estado?: string;
  parceiroDuplas?: string;
  [key: string]: any;
}

export interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  claims: { admin?: 'admin' | 'master' } | null;
  isAdmin: boolean;
  isMaster: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, userDoc, setUser, setUserDoc, setLoading, signOut: clearStore, loading } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [claims, setClaims] = useState<{ admin?: 'admin' | 'master' } | null>(null);

  // Bootstrap do user + claims + role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // CRÍTICO: getDoc pode pendurar indefinidamente (Firestore sem índice, offline, etc).
        // SEMPRE usar com timeout para garantir que o app não fique travado.
        const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T | null> =>
          Promise.race([
            p,
            new Promise<null>((resolve) => setTimeout(() => {
              console.warn(`[auth] ${label} timeout ${ms}ms`);
              resolve(null);
            }, ms)),
          ]);

        try {
          // Namespace toppkb_ (isolamento total)
          const ref = doc(db, 'toppkb_users', fbUser.uid, 'profile', 'main');
          const snap = await withTimeout(getDoc(ref), 5000, 'load profile');
          if (snap && snap.exists()) {
            setUserDoc(snap.data() as UserDoc);
          } else {
            // Cria o doc de usuário com dados básicos do Google
            const newDoc: UserDoc = {
              uid: fbUser.uid,
              email: fbUser.email || undefined,
              displayName: fbUser.displayName || undefined,
              photoURL: fbUser.photoURL || undefined,
              consent: false,
              onboardingComplete: false,
              role: 'user',
            };
            setUserDoc(newDoc);
            // Tenta criar o doc no Firestore (best-effort, não bloqueia)
            const { setDoc } = await import('firebase/firestore');
            setDoc(ref, newDoc, { merge: true }).catch((e) => console.warn('[auth] setDoc profile falhou:', e));
          }
        } catch (e) {
          console.warn('[auth] load profile falhou:', e);
          setUserDoc({
            uid: fbUser.uid,
            email: fbUser.email || undefined,
            displayName: fbUser.displayName || undefined,
            role: 'user',
          } as UserDoc);
        }
        try {
          // checa custom claims (também com timeout)
          const tokenResult = await withTimeout(fbUser.getIdTokenResult(), 3000, 'getIdTokenResult');
          if (tokenResult && tokenResult.claims?.admin) {
            setClaims({ admin: tokenResult.claims.admin as 'admin' | 'master' });
          } else {
            // checa doc admins/{uid} (namespace toppkb_) — também com timeout
            const adminSnap = await withTimeout(
              getDoc(doc(db, 'toppkb_admin', 'admins', fbUser.uid)),
              3000,
              'load admin',
            );
            if (adminSnap && adminSnap.exists()) {
              const data = adminSnap.data() as any;
              if (data?.active !== false) {
                setClaims({ admin: data.role === 'master' ? 'master' : 'admin' });
              } else {
                setClaims(null);
              }
            } else {
              setClaims(null);
            }
          }
        } catch (e) {
          console.warn('[auth] load claims falhou:', e);
          setClaims(null);
        }
      } else {
        setUserDoc(null);
        setClaims(null);
      }
      setLoading(false);
      setBootstrapping(false);
    });
    return unsub;
  }, [setUser, setUserDoc, setLoading]);

  // Live listener do userDoc
  useEffect(() => {
    if (!user) return;
    try {
      const ref = doc(db, 'toppkb_users', user.uid, 'profile', 'main');
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) setUserDoc(snap.data() as UserDoc);
        },
        (err) => {
          console.warn('[auth] snapshot profile falhou:', err);
        },
      );
      return unsub;
    } catch (e) {
      console.warn('[auth] setup snapshot falhou:', e);
      return undefined;
    }
  }, [user, setUserDoc]);

  const signInWithGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  const signOut = async () => {
    await fbSignOut(auth);
    clearStore();
  };

  const value: AuthContextValue = {
    user,
    userDoc,
    claims,
    isAdmin: !!claims?.admin,
    isMaster: claims?.admin === 'master',
    loading: loading || bootstrapping,
    signInWithGoogle,
    signOut,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
