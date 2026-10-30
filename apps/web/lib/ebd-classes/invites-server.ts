import 'server-only';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import type { Database } from '../supabase/database.types';
import { validateSupabasePublicEnv } from '../supabase/env';
import {
  INVITE_UUID,
  INVITE_TOKEN,
  inviteBaseURL,
} from '../guild-invites/contracts';
import { MEMBER_INVITE_COOKIE, MEMBER_INVITE_PATH } from './invites-contracts';
const headers = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};
const reply = (data: unknown, status = 200, cookie?: string) =>
  Response.json(
    { data },
    {
      status,
      headers: { ...headers, ...(cookie ? { 'Set-Cookie': cookie } : {}) },
    },
  );
const fail = (status: number) =>
  Response.json(
    {
      error:
        status === 401
          ? 'Entre normalmente em sua conta para continuar.'
          : status === 403
            ? 'Você não tem permissão para esta ação.'
            : status === 404
              ? 'Convite indisponível, expirado, esgotado ou revogado.'
              : 'Não foi possível confirmar a operação. Confira sua permissão e os dados.',
    },
    { status, headers },
  );
const id = (x: unknown): x is string =>
  typeof x === 'string' && INVITE_UUID.test(x);
const keys = (data: Record<string, unknown>, expected: string[]) =>
  Object.keys(data).sort().join(',') === expected.sort().join(',');
async function input(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw Error('JSON required');
  const reader = request.body?.getReader();
  if (!reader) throw Error('Body required');
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.length;
    if (size > 4096) {
      await reader.cancel();
      throw Error('Bound exceeded');
    }
    chunks.push(r.value);
  }
  const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw Error('Object required');
  return data as Record<string, unknown>;
}
function storedToken(request: Request) {
  const matches = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((x) => x.trim())
    .filter((x) => x.startsWith(MEMBER_INVITE_COOKIE + '='));
  if (matches.length !== 1) return null;
  const t = matches[0].slice(MEMBER_INVITE_COOKIE.length + 1);
  return INVITE_TOKEN.test(t) ? t : null;
}
export async function handleMemberInvite(request: Request): Promise<Response> {
  let data: Record<string, unknown>;
  try {
    data = await input(request);
  } catch {
    return fail(400);
  }
  const action = data.action;
  const expected =
    action === 'remember'
      ? ['action', 'token']
      : action === 'preview'
        ? ['action']
        : action === 'accept'
          ? ['action', 'actor', 'requestId']
          : action === 'create'
            ? [
                'action',
                'actor',
                'guildId',
                'classId',
                'days',
                'maxUses',
                'requestId',
              ]
            : action === 'list'
              ? ['action', 'actor', 'guildId', 'classId']
              : action === 'revoke'
                ? ['action', 'actor', 'guildId', 'classId', 'id']
                : null;
  if (!expected || !keys(data, expected)) return fail(400);
  if (
    action === 'remember' &&
    (typeof data.token !== 'string' || !INVITE_TOKEN.test(data.token))
  )
    return fail(404);
  const publicAction = action === 'preview' || action === 'remember';
  if (!publicAction && !id(data.actor)) return fail(400);
  if (
    ['create', 'list', 'revoke'].includes(String(action)) &&
    (!id(data.guildId) || (data.classId !== null && !id(data.classId)))
  )
    return fail(400);
  if ((action === 'create' || action === 'accept') && !id(data.requestId))
    return fail(400);
  if (action === 'revoke' && !id(data.id)) return fail(400);
  if (
    action === 'create' &&
    (!Number.isInteger(data.days) ||
      Number(data.days) < 1 ||
      Number(data.days) > 30 ||
      !Number.isInteger(data.maxUses) ||
      Number(data.maxUses) < 1 ||
      Number(data.maxUses) > 100)
  )
    return fail(400);
  try {
    const config = validateSupabasePublicEnv({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    const preview = process.env.VERCEL_ENV === 'preview';
    if (
      preview &&
      (!process.env.VERCEL_URL?.endsWith('.vercel.app') ||
        config.url !== 'https://wkdvdzfkbwvhyjmamrsg.supabase.co')
    )
      return fail(503);
    const origin = inviteBaseURL(
      preview ? `https://${process.env.VERCEL_URL}` : process.env.APP_BASE_URL,
      process.env.NODE_ENV === 'production',
    );
    if (request.headers.get('origin') !== origin) return fail(403);
    const bearer = request.headers.get('authorization');
    if (
      !publicAction &&
      (!bearer ||
        bearer.length > 8192 ||
        !/^Bearer [A-Za-z0-9._~-]+$/.test(bearer))
    )
      return fail(401);
    const client = createClient<Database>(config.url, config.publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      ...(!publicAction
        ? { global: { headers: { Authorization: bearer! } } }
        : {}),
    });
    if (!publicAction) {
      const verified = await client.auth.getUser(bearer!.slice(7));
      if (
        verified.error ||
        !verified.data.user ||
        verified.data.user.is_anonymous
      )
        return fail(401);
    }
    const token =
      action === 'remember' ? String(data.token) : storedToken(request);
    const scope = {
      p_actor: data.actor as string,
      p_guild: data.guildId as string,
      p_class: data.classId as string | null,
    };
    const result = publicAction
      ? token
        ? await client.rpc('ebd_member_invite_preview', { p_token: token })
        : { data: null, error: { code: 'P0002' } }
      : action === 'create'
        ? await client.rpc('ebd_member_invite_create', {
            ...scope,
            p_request: data.requestId as string,
            p_days: Number(data.days),
            p_uses: Number(data.maxUses),
          })
        : action === 'list'
          ? await client.rpc('ebd_member_invite_list', scope)
          : action === 'revoke'
            ? await client.rpc('ebd_member_invite_revoke', {
                ...scope,
                p_id: data.id as string,
              })
            : token
              ? await client.rpc('ebd_member_invite_accept', {
                  p_token: token,
                  p_actor: data.actor as string,
                  p_request: data.requestId as string,
                })
              : { data: null, error: { code: 'P0002' } };
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
    if (publicAction) {
      const p = result.data as Record<string, unknown> | null;
      if (
        !p ||
        typeof p.guildName !== 'string' ||
        (p.className !== null && typeof p.className !== 'string') ||
        typeof p.expiresAt !== 'string'
      )
        return fail(503);
      const cookie =
        action === 'remember'
          ? `${MEMBER_INVITE_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${origin.startsWith('https:') ? '; Secure' : ''}`
          : undefined;
      return reply(
        {
          guildName: p.guildName,
          className: p.className,
          expiresAt: p.expiresAt,
        },
        200,
        cookie,
      );
    }
    if (action === 'create') {
      const issued = result.data as Record<string, unknown> | null;
      if (
        !issued ||
        !id(issued.id) ||
        typeof issued.expiresAt !== 'string' ||
        typeof issued.replayed !== 'boolean'
      )
        return fail(503);
      if (issued.replayed && issued.token === null)
        return reply({
          id: issued.id,
          expiresAt: issued.expiresAt,
          replayed: true,
        });
      if (typeof issued.token !== 'string' || !INVITE_TOKEN.test(issued.token))
        return fail(503);
      const url = origin + MEMBER_INVITE_PATH + '#' + issued.token;
      const qr = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 4,
      });
      return reply({
        id: issued.id,
        expiresAt: issued.expiresAt,
        replayed: false,
        url,
        qr,
      });
    }
    return reply(result.data);
  } catch {
    return fail(503);
  }
}
