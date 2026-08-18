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
        const ref = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
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
        }
        // checa custom claims
        const tokenResult = await fbUser.getIdTokenResult();
        if (tokenResult.claims?.admin) {
          setClaims({ admin: tokenResult.claims.admin as 'admin' | 'master' });
        } else {
          // checa doc admins/{uid}
          const adminSnap = await getDoc(doc(db, 'admins', fbUser.uid));
          if (adminSnap.exists()) {
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
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setUserDoc(snap.data() as UserDoc);
    });
    return unsub;
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
