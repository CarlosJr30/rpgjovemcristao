import 'server-only';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import type { Database } from '../supabase/database.types';
import { validateSupabasePublicEnv } from '../supabase/env';
import { INVITE_TOKEN, INVITE_UUID, inviteBaseURL } from './contracts';

const headers = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });
const fail = (status: number) =>
  reply(
    {
      error:
        status === 503
          ? 'Convites indisponíveis. A configuração e a migração precisam ser verificadas pelo responsável.'
          : status === 401
            ? 'Entre em sua conta para continuar.'
            : status === 403
              ? 'Você não tem permissão para esta ação.'
              : status === 404
                ? 'Convite inválido, expirado ou revogado.'
                : 'Não foi possível concluir a ação. Confira os dados e tente novamente.',
    },
    status,
  );

async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw Error('JSON required');
  const reader = request.body?.getReader();
  if (!reader) throw Error('Body required');
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2048) {
      await reader.cancel();
      throw Error('Body too large');
    }
    chunks.push(value);
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Object required');
  return value as Record<string, unknown>;
}

export async function handleGuildInvite(request: Request): Promise<Response> {
  const bearer = request.headers.get('authorization');
  let input: Record<string, unknown>;
  try {
    input = await body(request);
  } catch {
    return fail(400);
  }
  const { action, token, travelerId, inviteId } = input;
  if (
    typeof action !== 'string' ||
    !['preview', 'create', 'list', 'resolve', 'request', 'revoke'].includes(
      action,
    )
  )
    return fail(400);
  const preview = action === 'preview';
  if (
    !preview &&
    (!bearer ||
      bearer.length > 8192 ||
      !/^Bearer [A-Za-z0-9._~-]+$/.test(bearer))
  )
    return fail(401);
  if (
    (preview || action === 'resolve' || action === 'request') &&
    (typeof token !== 'string' || !INVITE_TOKEN.test(token))
  )
    return fail(404);
  if (
    !preview &&
    action !== 'resolve' &&
    (typeof travelerId !== 'string' || !INVITE_UUID.test(travelerId))
  )
    return fail(400);
  if (
    action === 'revoke' &&
    (typeof inviteId !== 'string' || !INVITE_UUID.test(inviteId))
  )
    return fail(400);
  try {
    const config = validateSupabasePublicEnv({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    const client = createClient<Database>(config.url, config.publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      ...(preview ? {} : { global: { headers: { Authorization: bearer! } } }),
    });
    if (!preview) {
      const verified = await client.auth.getUser(bearer!.slice(7));
      if (
        verified.error ||
        !verified.data.user ||
        verified.data.user.is_anonymous
      )
        return fail(401);
    }
    // Resolve the deployment origin solely from validated server configuration, never Host/forwarded headers.
    const base =
      action === 'create'
        ? inviteBaseURL(
            process.env.APP_BASE_URL,
            process.env.NODE_ENV === 'production',
          )
        : null;
    const leader = travelerId as string;
    const result = preview
      ? await client.rpc('preview_guild_link_invite', {
          p_token: token as string,
        })
      : action === 'create'
        ? await client.rpc('create_guild_link_invite', {
            p_leader_traveler_id: leader,
          })
        : action === 'list'
          ? await client.rpc('list_guild_link_invites', {
              p_leader_traveler_id: leader,
            })
          : action === 'resolve'
            ? await client.rpc('resolve_guild_link_invite', {
                p_token: token as string,
              })
            : action === 'request'
              ? await client.rpc('request_guild_link_invite', {
                  p_token: token as string,
                  p_traveler_id: leader,
                })
              : await client.rpc('revoke_guild_link_invite', {
                  p_invite_id: inviteId as string,
                  p_leader_traveler_id: leader,
                });
    if (result.error)
      return fail(
        result.error.code === '42501'
          ? 403
          : result.error.code === 'P0002'
            ? 404
            : ['PGRST202', '42883', '3F000'].includes(result.error.code)
              ? 503
              : 409,
      );
    if (preview) {
      const data = result.data as {
        guild_name?: unknown;
        expires_at?: unknown;
      } | null;
      if (
        !data ||
        typeof data.guild_name !== 'string' ||
        typeof data.expires_at !== 'string'
      )
        return fail(503);
      // Explicit allowlist: no identifiers, membership, leader data or token echoed.
      return reply({
        data: { guild_name: data.guild_name, expires_at: data.expires_at },
      });
    }
    if (action === 'create') {
      const created = result.data as {
        id?: unknown;
        token?: unknown;
        expires_at?: unknown;
      } | null;
      if (
        !created ||
        typeof created.token !== 'string' ||
        !INVITE_TOKEN.test(created.token) ||
        typeof created.id !== 'string' ||
        !INVITE_UUID.test(created.id) ||
        typeof created.expires_at !== 'string'
      )
        return fail(503);
      const url = `${base}/guilda/convite/${created.token}`;
      const svg = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 4,
      });
      return reply({
        id: created.id,
        expires_at: created.expires_at,
        url,
        qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      });
    }
    return reply({ data: result.data ?? null });
  } catch {
    return fail(503);
  }
}
