'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import {
  getAuthenticatedUser,
  getSession,
  signIn,
  signOut,
  signUp,
} from '../../lib/supabase/auth';
import { useAuth } from '../../lib/supabase/auth-context';
import { hasPersistedSupabaseSession } from '../../lib/supabase/client';
import styles from './auth.module.css';
import { GuildInvitePreview } from '../guild-invites/invite-preview';
import Link from 'next/link';
import { EarlyAccessNotice } from '../early-access/notice';
import {
  entryReturn,
  registrationDestination,
} from '../../lib/supabase/auth-return';

type Mode = 'signIn' | 'signUp';

export function AuthScreen({ inviteToken }: { inviteToken?: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signIn');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const displayName = String(data.get('displayName') ?? '').trim();
    setError(null);
    setMessage(null);
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      (mode === 'signIn' ? password.length === 0 : password.length < 8) ||
      (mode === 'signUp' && (displayName.length < 2 || displayName.length > 50))
    ) {
      setError(
        'Confira o nome, o e-mail e use uma senha com pelo menos 8 caracteres.',
      );
      return;
    }
    setPending(true);
    try {
      if (mode === 'signIn') {
        const result = await signIn(email, password);
        if (process.env.NODE_ENV === 'development') {
          console.info(
            '[AUTH SIGNIN] error:',
            result.error
              ? {
                  name: result.error.name,
                  message: result.error.message,
                  status: result.error.status,
                }
              : null,
          );
          console.info(
            '[AUTH SIGNIN] user present:',
            Boolean(result.data.user),
          );
          console.info(
            '[AUTH SIGNIN] session present:',
            Boolean(result.data.session),
          );
        }
        if (result.error || !result.data.user || !result.data.session)
          throw new Error('O Supabase não retornou uma sessão válida.');

        const [session, user] = await Promise.all([
          getSession(),
          getAuthenticatedUser(),
        ]);
        const storagePresent = hasPersistedSupabaseSession();
        if (process.env.NODE_ENV === 'development')
          console.info('SUPABASE SESSION STORAGE PRESENT:', storagePresent);
        if (
          !session ||
          !user ||
          user.is_anonymous ||
          session.user.id !== result.data.user.id ||
          user.id !== result.data.user.id ||
          !storagePresent
        )
          throw new Error('A sessão não permaneceu disponível após o login.');
        router.replace(entryReturn('/'));
      } else {
        const result = await signUp(email, password, displayName);
        if (result.error) throw new Error();
        if (!result.data.session || !result.data.user) {
          setMessage(
            'Cadastro recebido. Entre com seus dados para continuar e siga as instruções do e-mail, se houver.',
          );
          return;
        }
        const [session, user] = await Promise.all([
          getSession(),
          getAuthenticatedUser(),
        ]);
        if (
          !session ||
          !user ||
          user.is_anonymous ||
          session.user.id !== result.data.user.id ||
          user.id !== result.data.user.id ||
          !hasPersistedSupabaseSession()
        )
          throw new Error('Não foi possível manter sua sessão.');
        router.replace(registrationDestination());
      }
    } catch (cause) {
      const developmentDetails =
        process.env.NODE_ENV === 'development' && cause instanceof Error
          ? ` ${cause.message}`
          : '';
      setError(
        (mode === 'signIn'
          ? 'Não foi possível entrar. Confira seus dados e tente novamente.'
          : 'Não foi possível criar a conta. Tente novamente.') +
          developmentDetails,
      );
    } finally {
      setPending(false);
    }
  };

  if (auth.status === 'signedIn') {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>CONTA ONLINE</p>
          <h1>Sua conta está conectada</h1>
          <p>{auth.user.email}</p>
          <button
            type="button"
            onClick={async () => {
              const result = await signOut();
              if (!result.error) router.replace('/');
            }}
          >
            Sair da conta
          </button>
          <button
            type="button"
            onClick={() => router.replace(entryReturn('/'))}
          >
            Voltar ao jogo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>JORNADA ONLINE</p>
        <h1 id="auth-title">{mode === 'signIn' ? 'Entrar' : 'Criar conta'}</h1>
        <EarlyAccessNotice />
        {inviteToken && (
          <GuildInvitePreview key={inviteToken} token={inviteToken} />
        )}
        <p>
          {mode === 'signUp'
            ? 'Crie sua conta e escolha seu herói para começar.'
            : 'Entre para continuar com seu herói e seu progresso.'}
        </p>
        <form onSubmit={submit} noValidate>
          {mode === 'signUp' && (
            <label>
              Nome de exibição
              <input
                name="displayName"
                minLength={2}
                maxLength={50}
                autoComplete="name"
                required
              />
            </label>
          )}
          <label>
            E-mail
            <input
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              minLength={mode === 'signUp' ? 8 : undefined}
              aria-describedby={mode === 'signUp' ? 'password-hint' : undefined}
              autoComplete={
                mode === 'signIn' ? 'current-password' : 'new-password'
              }
              required
            />
          </label>
          {mode === 'signUp' && (
            <span id="password-hint" className={styles.hint}>
              Use pelo menos 8 caracteres. Não há quantidade obrigatória de
              letras maiúsculas, números ou símbolos. Para ficar mais segura,
              recomendamos misturar maiúsculas, minúsculas, números e símbolos.
            </span>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className={styles.notice} role="status">
              {message}
            </p>
          )}
          <button type="submit" disabled={pending || auth.status === 'loading'}>
            {pending
              ? 'Aguarde…'
              : mode === 'signIn'
                ? 'Entrar'
                : 'Criar conta'}
          </button>
        </form>
        {mode === 'signIn' && (
          <Link href="/auth/recover">Esqueci minha senha</Link>
        )}
        <button
          className={styles.secondary}
          type="button"
          disabled={pending}
          onClick={() => {
            setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
            setError(null);
            setMessage(null);
          }}
        >
          {mode === 'signIn' ? 'Criar conta' : 'Já tenho conta'}
        </button>
      </section>
    </main>
  );
}
