import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import type { UserDoc } from '@/lib/api';

const ACTION_CODE_SETTINGS = {
  url: window.location.origin + '/auth/verify',
  handleCodeInApp: true,
};

export function useAuth() {
  const { user, userDoc, setUser, setUserDoc, setLoading, signOut: clearStore, loading } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        const ref = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserDoc(snap.data() as UserDoc);
        } else {
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
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

  const sendLink = async (email: string) => {
    await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
    window.localStorage.setItem('emailForSignIn', email);
  };

  const completeSignIn = async (email: string, link: string) => {
    if (isSignInWithEmailLink(auth, link)) {
      await signInWithEmailLink(auth, email, link);
      window.localStorage.removeItem('emailForSignIn');
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    clearStore();
  };

  return {
    user,
    userDoc,
    loading: loading || bootstrapping,
    sendLink,
    completeSignIn,
    signOut,
  };
}
