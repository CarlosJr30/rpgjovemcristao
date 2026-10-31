'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import css from './auth.module.css';
import { EarlyAccessNotice } from '../early-access/notice';
export function RecoveryScreen() {
  const auth = useAuth(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const client = getSupabaseBrowserClient();
      if (auth.status === 'signedIn') {
        const password = String(form.get('password') ?? '');
        if (password.length < 8 || password !== String(form.get('confirm')))
          throw Error('password');
        const r = await client.auth.updateUser({ password });
        if (r.error) throw Error('save');
        await client.auth.signOut();
        setMessage('Senha atualizada. Entre novamente com sua nova senha.');
      } else {
        const email = String(form.get('email') ?? '').trim();
        if (!email.includes('@')) throw Error('email');
        const r = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/auth/recover',
        });
        if (r.error) throw Error('send');
        setMessage(
          'Se houver uma conta para esse e-mail, você receberá um link de recuperação.',
        );
      }
    } catch {
      setError(
        'Não foi possível concluir. Confira os dados e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className={css.page}>
      <section className={css.card}>
        <h1>
          {auth.status === 'signedIn'
            ? 'Definir nova senha'
            : 'Recuperar acesso'}
        </h1>
        <EarlyAccessNotice />
        <form onSubmit={submit}>
          {auth.status === 'signedIn' ? (
            <>
              <label>
                Nova senha
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label>
                Confirmar nova senha
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </>
          ) : (
            <label>
              E-mail
              <input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          <button disabled={busy || auth.status === 'loading'}>
            {busy
              ? 'Aguarde…'
              : auth.status === 'signedIn'
                ? 'Salvar nova senha'
                : 'Enviar link de recuperação'}
          </button>
        </form>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
        <Link href="/auth">Voltar para entrar</Link>
      </section>
    </main>
  );
}
