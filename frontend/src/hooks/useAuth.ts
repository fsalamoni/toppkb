import * as React from 'react';
import { useEffect, useState, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
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
    // Garante que o app NUNCA fica preso na tela de loading, aconteça o que
    // acontecer com Firestore / Auth / rede. Assim que sabemos se há usuário,
    // liberamos a renderização; perfil e claims carregam em segundo plano.
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      setLoading(false);
      setBootstrapping(false);
    };
    // Watchdog absoluto: se o onAuthStateChanged nem chegar a disparar
    // (ex.: Auth travado), libera mesmo assim após 8s.
    const watchdog = setTimeout(() => {
      console.warn('[auth] watchdog: liberando app após 8s sem resolver auth');
      finish();
    }, 8000);

    const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T | null> =>
      Promise.race([
        p,
        new Promise<null>((resolve) => setTimeout(() => {
          console.warn(`[auth] ${label} timeout ${ms}ms`);
          resolve(null);
        }, ms)),
      ]);

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);

      if (!fbUser) {
        setUserDoc(null);
        setClaims(null);
        finish();
        return;
      }

      // Sabemos que há um usuário autenticado: libera o app IMEDIATAMENTE.
      // Nada abaixo pode travar a UI — é tudo best-effort em background.
      finish();

      // Perfil (best-effort)
      try {
        const ref = doc(db, 'toppkb_users', fbUser.uid, 'profile', 'main');
        const snap = await withTimeout(getDoc(ref), 5000, 'load profile');
        if (snap && snap.exists()) {
          setUserDoc(snap.data() as UserDoc);
        } else {
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

      // Claims / role (best-effort)
      try {
        const tokenResult = await withTimeout(fbUser.getIdTokenResult(), 3000, 'getIdTokenResult');
        if (tokenResult && tokenResult.claims?.admin) {
          setClaims({ admin: tokenResult.claims.admin as 'admin' | 'master' });
        } else {
          const adminSnap = await withTimeout(
            getDoc(doc(db, 'toppkb_admin', 'admins', fbUser.uid)),
            3000,
            'load admin',
          );
          if (adminSnap && adminSnap.exists()) {
            const data = adminSnap.data() as any;
            setClaims(data?.active !== false ? { admin: data.role === 'master' ? 'master' : 'admin' } : null);
          } else {
            setClaims(null);
          }
        }
      } catch (e) {
        console.warn('[auth] load claims falhou:', e);
        setClaims(null);
      }
    });

    return () => {
      clearTimeout(watchdog);
      unsub();
    };
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
