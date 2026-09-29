'use client';

import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAuthenticatedUser,
  getSession,
  onAuthStateChange,
} from './auth';
import {
  hydrateOnlineTravelers,
  protectSignedOutCache,
  setCurrentOnlineUser,
} from './online-sync';
import { profileRepository } from './repositories/profile-repository';

type AuthState =
  | { status: 'loading'; session: null; user: null }
  | { status: 'signedOut'; session: null; user: null }
  | { status: 'local'; session: null; user: null }
  | { status: 'signedIn'; session: Session; user: User };

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  continueLocally: () => void;
};

const LOCAL_MODE_KEY = 'rpg-jovem-cristao:auth-mode:v1';
const localModeSelected = () =>
  typeof window !== 'undefined' && localStorage.getItem(LOCAL_MODE_KEY) === 'local';
const setLocalMode = (enabled: boolean) => {
  if (enabled) localStorage.setItem(LOCAL_MODE_KEY, 'local');
  else localStorage.removeItem(LOCAL_MODE_KEY);
};

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  session: null,
  user: null,
  isAuthenticated: false,
  continueLocally: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
    user: null,
  });

  const continueLocally = useCallback(() => {
    setLocalMode(true);
    setCurrentOnlineUser(null);
    protectSignedOutCache();
    setState({ status: 'local', session: null, user: null });
  }, []);

  useEffect(() => {
    let active = true;
    let currentSessionUserId: string | null | undefined;
    let sessionQueue = Promise.resolve();
    let bootCompleted = false;
    let bufferedAuthChange: {
      event: AuthChangeEvent;
      session: Session | null;
    } | null = null;
    const applySession = async (session: Session | null) => {
      if (!active) return;
      const nextUserId = session?.user.id ?? null;
      if (currentSessionUserId === nextUserId) {
        if (session)
          setState({ status: 'signedIn', session, user: session.user });
        return;
      }
      currentSessionUserId = nextUserId;
      if (!session) {
        setCurrentOnlineUser(null);
        protectSignedOutCache();
        setState({
          status: localModeSelected() ? 'local' : 'signedOut',
          session: null,
          user: null,
        });
        return;
      }
      setLocalMode(false);
      setState({ status: 'loading', session: null, user: null });
      setCurrentOnlineUser(session.user.id);
      try {
        try {
          await profileRepository.ensure(session.user);
        } catch {
          // O carregamento abaixo ativa o fallback local e sua mensagem redigida.
        }
        await hydrateOnlineTravelers(session.user.id);
      } finally {
        if (active)
          setState({ status: 'signedIn', session, user: session.user });
      }
    };

    const scheduleSession = (session: Session | null) => {
      sessionQueue = sessionQueue.then(() => applySession(session));
      return sessionQueue;
    };

    const boot = async () => {
      try {
        const session = await getSession();
        const user = session ? await getAuthenticatedUser() : null;
        const validSession =
          session && user && session.user.id === user.id ? session : null;
        if (process.env.NODE_ENV === 'development') {
          console.info('[AUTH BOOT] session present:', Boolean(validSession));
          console.info('[AUTH BOOT] user present:', Boolean(user));
        }
        await scheduleSession(validSession);
      } catch {
        await scheduleSession(null);
      } finally {
        bootCompleted = true;
        const pending = bufferedAuthChange;
        bufferedAuthChange = null;
        if (pending && active) void scheduleSession(pending.session);
      }
    };
    const subscription = onAuthStateChange(
      (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.info('[AUTH STATE] event:', event);
          console.info('[AUTH STATE] user present:', Boolean(session?.user));
        }
        if (!bootCompleted) {
          bufferedAuthChange = { event, session };
          return;
        }
        void scheduleSession(session);
      },
    );
    void boot();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: state.status === 'signedIn',
      continueLocally,
    }),
    [continueLocally, state],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
