// Uses existing local environment without printing keys, tokens, or response data.
import nextEnv from '@next/env';
const { combinedEnv: env } = nextEnv.loadEnvConfig('apps/web');
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (
  !url ||
  !key ||
  new URL(url).hostname !== 'wspafhlbtlpabypzymjo.supabase.co'
)
  throw Error('Chat test project/configuration mismatch');
const checks = [
  {
    name: 'anonymous table denied',
    path: '/rest/v1/guild_chat_messages?select=id&limit=1',
    expected: [401, 403],
  },
  {
    name: 'anonymous RPC denied',
    path: '/rest/v1/rpc/guild_chat_summary',
    method: 'POST',
    body: JSON.stringify({
      p_guild_id: '00000000-0000-4000-8000-000000000000',
      p_traveler_id: '00000000-0000-4000-8000-000000000000',
    }),
    expected: [401, 403],
  },
  {
    name: 'private schema unexposed',
    path: '/rest/v1/rate_limits?select=kind&limit=1',
    profile: 'guild_chat_private',
    expected: [406],
  },
];
let pass = true;
for (const check of checks) {
  try {
    const response = await fetch(url + check.path, {
      method: check.method ?? 'GET',
      body: check.body,
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
        ...(check.profile ? { 'Accept-Profile': check.profile } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    const ok = check.expected.includes(response.status);
    pass = pass && ok;
    console.log(
      JSON.stringify({
        check: check.name,
        status: response.status,
        result: ok ? 'PASS' : 'FAIL',
      }),
    );
  } catch (error) {
    pass = false;
    console.log(
      JSON.stringify({
        check: check.name,
        result: 'BLOCKED',
        code: error.cause?.code ?? error.name,
      }),
    );
  }
}
if (!pass) process.exitCode = 1;
