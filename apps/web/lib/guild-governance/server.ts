import 'server-only';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import type { Database, Json } from '../supabase/database.types';
import { validateSupabasePublicEnv } from '../supabase/env';
import {
  INVITE_TOKEN,
  INVITE_UUID,
  inviteBaseURL,
} from '../guild-invites/contracts';
import { LEADERSHIP_COOKIE, LEADERSHIP_PATH } from './contracts';

const headers = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};
const reply = (value: unknown, status = 200, cookie?: string) =>
  Response.json(value, {
    status,
    headers: { ...headers, ...(cookie ? { 'Set-Cookie': cookie } : {}) },
  });
const fail = (status: number) =>
  reply(
    {
      error:
        status === 401
          ? 'Entre normalmente em sua conta para continuar.'
          : status === 403
            ? 'Você não tem permissão para esta ação.'
            : status === 404
              ? 'Convite indisponível, expirado ou revogado.'
              : status === 409
                ? 'A operação depende de requisitos ainda não atendidos.'
                : 'Não foi possível confirmar a operação. Confira os dados e tente novamente.',
    },
    status,
  );
function configuredOrigin() {
  const preview = process.env.VERCEL_ENV === 'preview';
  const origin = preview
    ? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined
    : process.env.APP_BASE_URL;
  if (
    preview &&
    (!process.env.VERCEL_URL?.endsWith('.vercel.app') ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !==
        'https://wkdvdzfkbwvhyjmamrsg.supabase.co')
  )
    throw Error('Verified TEST preview required');
  return inviteBaseURL(origin, process.env.NODE_ENV === 'production');
}
function cookieToken(request: Request) {
  const values = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((x) => x.trim())
    .filter((x) => x.startsWith(LEADERSHIP_COOKIE + '='));
  if (values.length !== 1) return null;
  const token = values[0].slice(LEADERSHIP_COOKIE.length + 1);
  return INVITE_TOKEN.test(token) ? token : null;
}
function cookie(value: string, seconds: number, origin: string) {
  return `${LEADERSHIP_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${origin.startsWith('https:') ? '; Secure' : ''}`;
}
async function input(request: Request): Promise<Record<string, unknown>> {
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
    if (size > 8192) {
      await reader.cancel();
      throw Error('Request too large');
    }
    chunks.push(r.value);
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Object required');
  return value as Record<string, unknown>;
}
const keys = (data: Record<string, unknown>, expected: string[]) =>
  Object.keys(data).sort().join(',') === expected.sort().join(',');
export async function handleGovernance(request: Request): Promise<Response> {
  let data: Record<string, unknown>;
  try {
    data = await input(request);
  } catch {
    return fail(400);
  }
  const action = data.action;
  if (
    ![
      'status',
      'scopeStatus',
      'workspace',
      'history',
      'command',
      'remember',
      'preview',
      'accept',
    ].includes(String(action))
  )
    return fail(400);
  let origin: string;
  try {
    origin = configuredOrigin();
  } catch {
    return fail(503);
  }
  const trustedOrigins = [origin];
  if (
    process.env.VERCEL_ENV === 'production' &&
    process.env.VERCEL_URL?.endsWith('.vercel.app')
  ) {
    try {
      trustedOrigins.push(inviteBaseURL(`https://${process.env.VERCEL_URL}`));
    } catch {
      return fail(503);
    }
  }
  const source = request.headers.get('origin');
  if (
    (source && !trustedOrigins.includes(source)) ||
    (action === 'remember' && !source)
  )
    return fail(403);
  if (source) origin = source;
  const publicAction = action === 'remember' || action === 'preview';
  const bearer = request.headers.get('authorization');
  if (
    !publicAction &&
    (!bearer ||
      bearer.length > 8192 ||
      !/^Bearer [A-Za-z0-9._~-]+$/.test(bearer))
  )
    return fail(401);
  const expected =
    action === 'command'
      ? ['action', 'kind', 'id', 'requestId', 'data']
      : action === 'accept'
        ? ['action', 'id', 'requestId', 'travelerId']
        : action === 'remember'
          ? ['action', 'token']
          : action === 'workspace' || action === 'history'
            ? ['action', 'offset']
            : ['action'];
  if (!keys(data, expected)) return fail(400);
  if (
    (action === 'command' || action === 'accept') &&
    (typeof data.id !== 'string' ||
      !INVITE_UUID.test(data.id) ||
      typeof data.requestId !== 'string' ||
      !INVITE_UUID.test(data.requestId))
  )
    return fail(400);
  if (
    action === 'accept' &&
    (typeof data.travelerId !== 'string' || !INVITE_UUID.test(data.travelerId))
  )
    return fail(400);
  if (
    (action === 'workspace' || action === 'history') &&
    (!Number.isInteger(data.offset) ||
      (data.offset as number) < 0 ||
      (data.offset as number) > 100000)
  )
    return fail(400);
  if (
    action === 'command' &&
    (![
      'set_admin',
      'issue_leadership',
      'revoke_invite',
      'revoke_leadership',
    ].includes(String(data.kind)) ||
      !data.data ||
      typeof data.data !== 'object' ||
      Array.isArray(data.data))
  )
    return fail(400);
  const token = action === 'remember' ? data.token : cookieToken(request);
  if (
    ['remember', 'preview', 'accept'].includes(String(action)) &&
    (typeof token !== 'string' || !INVITE_TOKEN.test(token))
  )
    return fail(404);
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
      ...(publicAction
        ? {}
        : { global: { headers: { Authorization: bearer! } } }),
    });
    if (!publicAction) {
      const u = await client.auth.getUser(bearer!.slice(7));
      if (u.error || !u.data.user || u.data.user.is_anonymous) return fail(401);
    }
    const result =
      action === 'scopeStatus'
        ? await client.rpc('guild_scoped_status', {})
        : action === 'status'
          ? await client.rpc('guild_governance_status', {})
          : action === 'workspace'
            ? await client.rpc('guild_governance_workspace', {
                p_offset: data.offset as number,
              })
            : action === 'history'
              ? await client.rpc('guild_governance_history', {
                  p_offset: data.offset as number,
                })
              : action === 'remember' || action === 'preview'
                ? await client.rpc('guild_leadership_preview', {
                    p_token: token as string,
                  })
                : await client.rpc('guild_governance_command', {
                    p_action:
                      action === 'accept'
                        ? 'accept_leadership'
                        : (data.kind as string),
                    p_id: data.id as string,
                    p_request: data.requestId as string,
                    p_data:
                      action === 'accept'
                        ? {
                            token: token as string,
                            travelerId: data.travelerId as string,
                          }
                        : (data.data as Json),
                  });
    if (result.error)
      return fail(
        result.error.code === '42501'
          ? 403
          : result.error.code === 'P0002'
            ? 404
            : result.error.code === '55000'
              ? 409
              : 400,
      );
    const value = result.data;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      if (action === 'history' && Array.isArray(value))
        return reply({ data: value });
      return fail(503);
    }
    if (action === 'remember') {
      const seconds = Math.min(
        604800,
        Math.floor((Date.parse(String(value.expiresAt)) - Date.now()) / 1000),
      );
      if (!Number.isFinite(seconds) || seconds <= 0) return fail(404);
      return reply(
        { data: value },
        200,
        cookie(token as string, seconds, origin),
      );
    }
    if (action === 'command' && data.kind === 'issue_leadership') {
      const { token: issuedToken, ...safe } = value;
      if (issuedToken === undefined || issuedToken === null)
        return reply({ data: safe });
      if (typeof issuedToken !== 'string' || !INVITE_TOKEN.test(issuedToken))
        return fail(503);
      // Fragment never reaches the HTTP URL/access log. No external QR service.
      const url = `${origin}${LEADERSHIP_PATH}#${issuedToken}`;
      return reply({
        data: {
          ...safe,
          url,
          qr: await QRCode.toDataURL(url, { width: 256, margin: 2 }),
        },
      });
    }
    return reply(
      { data: value },
      200,
      action === 'accept' ? cookie('', 0, origin) : undefined,
    );
  } catch {
    return fail(503);
  }
}
