import { getSupabaseBrowserClient } from '../supabase/client';
export async function requestAuthority<T>(body: object): Promise<T> {
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error || !data.session)
    throw new Error('Entre novamente para consultar o servidor.');
  const response = await fetch('/api/authority', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok)
    throw new Error(
      response.status === 409
        ? 'Estado atualizado em outra sessão. Retome a batalha.'
        : 'Servidor oficial indisponível. Nenhum resultado local será premiado.',
    );
  return (await response.json()) as T;
}
