// Real TEST Auth/RLS/RPC validation. Credentials arrive only on stdin.
// Never seeds inventory or runs against PROD; each owned selection is restored.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const input = JSON.parse(readFileSync(0, 'utf8'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.equal(input.environment, 'preview');
assert.equal(url, 'https://wkdvdzfkbwvhyjmamrsg.supabase.co');
assert.ok(key?.startsWith('sb_publishable_'));
const result = { backend: new URL(url).hostname, realServer: true, runs: [] };
const sessions = [];
async function api(path, token, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(url + path, {
    method,
    headers: {
      apikey: key,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000),
  });
  return {
    status: response.status,
    ok: response.ok,
    data: await response.json(),
  };
}
const select = async (s, table, fields = '*') => {
  const r = await api(
    `/rest/v1/${table}?select=${fields}&${table === 'travelers' ? 'id' : 'traveler_id'}=eq.${s.traveler.id}&order=${table === 'inventory' ? 'item_id' : table === 'equipped_items' ? 'slot' : table === 'travelers' ? 'id' : 'traveler_id'}`,
    s.token,
  );
  assert.ok(r.ok, 'Owned data read');
  return r.data;
};
const snapshot = async (s) => ({
  inventory: await select(s, 'inventory'),
  equipment: await select(s, 'equipped_items', 'slot,item_id'),
  stats: await select(s, 'traveler_stats'),
  wallet: await select(s, 'wallets'),
  traveler: await select(s, 'travelers'),
});
const set = (s, item, expected, traveler = s.traveler.id, slot = 'boots') =>
  api('/rest/v1/rpc/set_owned_equipment', s.token, {
    p_traveler_id: traveler,
    p_slot: slot,
    p_item_id: item,
    p_expected_item_id: expected,
  });
try {
  for (const [role, credentials] of Object.entries(input.accounts)) {
    const login = await api(
      '/auth/v1/token?grant_type=password',
      null,
      credentials,
    );
    assert.ok(login.ok, 'Normal dedicated login');
    const s = { role, token: login.data.access_token };
    sessions.push(s);
    const user = await api('/auth/v1/user', s.token);
    assert.ok(user.ok, 'Verified actor');
    const travelers = await api(
      '/rest/v1/travelers?select=*&user_id=eq.' +
        user.data.id +
        '&is_active=eq.true',
      s.token,
    );
    assert.ok(
      travelers.ok && travelers.data.length === 1,
      'Original active traveler',
    );
    s.traveler = travelers.data[0];
  }
  for (const s of sessions) {
    const run = { role: s.role, checks: [], passed: false };
    result.runs.push(run);
    const check = (name, ok) => {
      run.checks.push({ name, passed: !!ok });
      assert.ok(ok, name);
    };
    const before = await snapshot(s),
      boots = before.inventory.find(
        (i) => i.item_id === 'traveler-boots' && i.quantity > 0,
      );
    check('existing legitimate owned boots available', !!boots);
    const original =
      before.equipment.find((e) => e.slot === 'boots')?.item_id ?? null;
    let restoreRequired = true;
    try {
      let r = await set(s, null, original);
      check('unequip confirmed by RPC', r.ok && !r.data.boots);
      r = await set(s, 'traveler-boots', null);
      check(
        'equip confirmed by RPC',
        r.ok && r.data.boots === 'traveler-boots',
      );
      r = await set(s, 'traveler-boots', null);
      check(
        'lost-response retry is idempotent',
        r.ok && r.data.boots === 'traveler-boots',
      );
      r = await set(s, null, 'stale-item');
      check(
        'stale tab receives HTTP409',
        r.status === 409 && r.data.code === 'PT409',
      );
      r = await set(s, 'forged-boots', 'traveler-boots');
      check('unknown variant denied', r.status === 403);
      const foreign = sessions.find((other) => other !== s);
      r = await set(s, null, null, foreign.traveler.id);
      check('foreign traveler denied', r.status === 403);
      r = await set(s, 'traveler-boots', null, s.traveler.id, 'weapon');
      check('wrong slot denied', r.status === 403);
      const simultaneous = await Promise.all([
        set(s, null, 'traveler-boots'),
        set(s, null, 'traveler-boots'),
      ]);
      check(
        'concurrent retries both confirmed without duplicate selection',
        simultaneous.every((r) => r.ok && !r.data.boots),
      );
      const inventoryWrite = await api(
        '/rest/v1/inventory?item_id=eq.traveler-boots&traveler_id=eq.' +
          s.traveler.id,
        s.token,
        { quantity: boots.quantity },
        'PATCH',
      );
      check('direct inventory write denied', inventoryWrite.status === 403);
      const equipmentWrite = await api(
        '/rest/v1/equipped_items?slot=eq.boots&traveler_id=eq.' + s.traveler.id,
        s.token,
        { item_id: 'traveler-boots' },
        'PATCH',
      );
      check('direct equipment write denied', equipmentWrite.status === 403);
      r = await set(s, original, null);
      check('original selection restored through RPC', r.ok);
      const after = await snapshot(s);
      check(
        'inventory equipment attributes balances and progression preserved',
        JSON.stringify(after) === JSON.stringify(before),
      );
      restoreRequired = false;
      run.passed = true;
    } finally {
      if (restoreRequired) {
        const current = await select(s, 'equipped_items', 'slot,item_id');
        const r = await set(
          s,
          original,
          current.find((e) => e.slot === 'boots')?.item_id ?? null,
        );
        assert.ok(r.ok, 'Cleanup through original server authority');
      }
    }
  }
} finally {
  for (const s of sessions)
    await fetch(url + '/auth/v1/logout', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + s.token },
    });
  writeFileSync(
    'build/rpg-dev-006/api-real-test.json',
    JSON.stringify(result, null, 2),
  );
}
console.log(
  JSON.stringify({
    runs: result.runs.map((r) => ({
      role: r.role,
      checks: r.checks.length,
      passed: r.passed,
    })),
  }),
);
assert.equal(result.runs.length, 3);
assert.ok(result.runs.every((r) => r.passed));
