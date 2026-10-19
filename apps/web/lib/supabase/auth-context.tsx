'use client';

import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
  createContext,
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
  | { status: 'signedIn'; session: Session; user: User };

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
};

const LOCAL_MODE_KEY = 'rpg-jovem-cristao:auth-mode:v1';

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  session: null,
  user: null,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
    user: null,
  });

  useEffect(() => {
    let active = true;
    let currentSessionUserId: string | null | undefined;
    let sessionQueue = Promise.resolve();
    let bootCompleted = false;
    let bufferedAuthChange: {
      event: AuthChangeEvent;
      session: Session | null;
    } | null = null;
    const applySession = async (incoming: Session | null) => {
      const session = incoming?.user.is_anonymous ? null : incoming;
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
          status: 'signedOut',
          session: null,
          user: null,
        });
        return;
      }
      localStorage.removeItem(LOCAL_MODE_KEY);
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
      sessionQueue = sessionQueue.then(async () => {
        let verifiedSession: Session | null = null;
        if (session && !session.user.is_anonymous) {
          try {
            const user = await getAuthenticatedUser();
            if (user && !user.is_anonymous && user.id === session.user.id)
              verifiedSession = { ...session, user };
          } catch {
            // Cached SDK events never replace verification by the Auth server.
          }
        }
        await applySession(verifiedSession);
      });
      return sessionQueue;
    };

    const boot = async () => {
      try {
        const session = await getSession();
        await scheduleSession(session);
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
    }),
    [state],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
