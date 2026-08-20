import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Regressão: as rotas internas do AppShell (aninhadas sob o parent "/app/*")
// precisam ser RELATIVAS. Se voltarem a ser absolutas ("/app/dashboard"),
// nenhuma rota casa, tudo cai no NotFoundRedirectInner e o conteúdo fica
// preso no spinner para sempre — foi o bug do "site sem conteúdo".

vi.mock('@/lib/firebase', () => ({
  auth: { __mock: 'auth' },
  db: { __mock: 'db' },
  functions: {},
  storage: {},
  default: {},
}));

vi.mock('firebase/auth', () => {
  const fakeUser = {
    uid: 'u1',
    email: 'flavio@gmail.com',
    displayName: 'Flavio Salomone',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  };
  return {
    onAuthStateChanged: (_auth: any, cb: any) => {
      Promise.resolve().then(() => cb(fakeUser));
      return () => {};
    },
    GoogleAuthProvider: class {
      setCustomParameters() {}
    },
    signInWithPopup: async () => ({ user: fakeUser }),
    signOut: async () => {},
    getAuth: () => ({}),
    connectAuthEmulator: () => {},
  };
});

vi.mock('firebase/firestore', () => {
  class Timestamp {
    seconds: number;
    constructor(s: number) { this.seconds = s; }
    toDate() { return new Date(this.seconds * 1000); }
    static now() { return new Timestamp(Date.now() / 1000); }
  }
  const profileData = {
    uid: 'u1',
    displayName: 'Flavio Salomone',
    email: 'flavio@gmail.com',
    consent: true,
    onboardingComplete: true,
    role: 'user',
  };
  return {
    doc: (...args: any[]) => ({ __doc: args.slice(1).join('/') }),
    collection: (...args: any[]) => ({ __col: args.slice(1).join('/') }),
    query: (...a: any[]) => ({ __query: a }),
    where: () => ({}),
    orderBy: () => ({}),
    limit: () => ({}),
    getDoc: async (ref: any) => {
      if (String(ref.__doc).includes('profile')) {
        return { exists: () => true, data: () => profileData, id: 'main' };
      }
      return { exists: () => false, data: () => undefined };
    },
    getDocs: async () => ({ docs: [] }),
    onSnapshot: (_ref: any, cb: any) => {
      Promise.resolve().then(() => cb({ exists: () => true, data: () => profileData }));
      return () => {};
    },
    setDoc: async () => {},
    addDoc: async () => ({ id: 'x' }),
    deleteDoc: async () => {},
    getFirestore: () => ({}),
    connectFirestoreEmulator: () => {},
    Timestamp,
    serverTimestamp: () => new Timestamp(Date.now() / 1000),
  };
});

import App from '../App';

describe('repro: dashboard render for authed user', () => {
  it('renderiza conteúdo do dashboard (não fica preso no spinner)', async () => {
    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(
      () => {
        const body = document.body.textContent || '';
        const hasContent = /Bom dia|Comece sua jornada|Ações rápidas|Treinos \(7d\)/.test(body);
        if (!hasContent) throw new Error('conteúdo do dashboard não renderizou: ' + body.slice(0, 200));
        expect(hasContent).toBe(true);
      },
      { timeout: 12000, interval: 200 },
    );
  }, 20000);
});
