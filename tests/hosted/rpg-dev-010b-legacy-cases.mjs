// Compatibility proof uses only synthetic loopback identities. Never hosted/player evidence.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { readFileSync } from 'node:fs';
export async function run({
  q,
  as,
  check,
  denied,
  uid,
  tid,
  options,
  connections,
}) {
  const issue = () =>
    as(1, 'select public.guild_scoped_create_invite($1,$2,$3) x', [
      tid(1),
      uid(101),
      randomUUID(),
    ]).then((r) => r.rows[0].x);
  const accept = (n, token, client) =>
    as(
      n,
      'select public.ebd_member_invite_accept($1,$2,$3) x',
      [token, tid(n), randomUUID()],
      'authenticated',
      client,
    ).then((r) => r.rows[0].x);
  const oldAccept = (n, token) =>
    as(n, 'select public.request_guild_link_invite($1,$2) x', [
      token,
      tid(n),
    ]).then((r) => r.rows[0].x);
  const preview = (token) =>
    as(
      null,
      'select public.ebd_member_invite_preview($1) x',
      [token],
      'anon',
    ).then((r) => r.rows[0].x);
  const invite = await issue();
  let pending;
  await check(
    'legacy invitation is safe for anonymous preview and preserves expiry',
    async () => {
      const p = await preview(invite.token);
      assert.equal(p.guildName, 'Fixture 101');
      assert.equal(p.className, null);
      assert(!JSON.stringify(p).includes(invite.token));
      assert.equal(
        new Date(p.expiresAt).getTime(),
        new Date(invite.expires_at).getTime(),
      );
    },
  );
  await check(
    'historical pending request stays byte-identical after explicit invitation enrollment',
    async () => {
      await as(5, 'select public.request_join_guild($1,$2)', [
        uid(101),
        tid(5),
      ]);
      pending = (
        await q(
          'select to_jsonb(r) x from public.guild_join_requests r where traveler_id=$1',
          [tid(5)],
        )
      ).rows;
      await accept(5, invite.token);
      assert.deepEqual(
        (
          await q(
            'select to_jsonb(r) x from public.guild_join_requests r where traveler_id=$1',
            [tid(5)],
          )
        ).rows,
        pending,
      );
      assert.equal(pending[0].x.status, 'pending');
    },
  );
  await check(
    'old and new invitation entrypoints share idempotent automatic membership',
    async () => {
      const member = await oldAccept(4, invite.token);
      assert(member);
      assert.equal((await accept(4, invite.token)).replayed, true);
      assert.equal(
        (
          await q(
            'select count(*)::int n from public.guild_members where guild_id=$1 and traveler_id=$2 and status=$3',
            [uid(101), tid(4), 'active'],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from ebd_class_private.legacy_uses where invite_id=$1 and traveler_id=$2',
            [invite.id, tid(4)],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  await check(
    'existing Guild bindings and roles survive invitation use without privileged grants',
    async () => {
      const before = (
        await q(
          'select to_jsonb(m) x from public.guild_members m where traveler_id=$1 order by guild_id',
          [tid(1)],
        )
      ).rows;
      await accept(1, invite.token);
      assert.deepEqual(
        (
          await q(
            'select to_jsonb(m) x from public.guild_members m where traveler_id=$1 order by guild_id',
            [tid(1)],
          )
        ).rows,
        before,
      );
      assert.equal(
        (
          await q(
            'select role from public.guild_members where guild_id=$1 and traveler_id=$2',
            [uid(101), tid(5)],
          )
        ).rows[0].role,
        'member',
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from ebd_class_private.teachers where traveler_id=$1',
            [tid(5)],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    'idempotency nonce cannot be reused across old and new invitation contracts',
    async () => {
      const nonce = randomUUID();
      await as(5, 'select public.ebd_member_invite_accept($1,$2,$3)', [
        invite.token,
        tid(5),
        nonce,
      ]);
      // A replay above already has a receipt; issue a fresh legacy link to bind the nonce.
      const legacy = await issue();
      const bound = randomUUID();
      await as(5, 'select public.ebd_member_invite_accept($1,$2,$3)', [
        legacy.token,
        tid(5),
        bound,
      ]);
      const common = (
        await as(
          1,
          'select public.ebd_member_invite_create($1,$2,null,$3,7,5) x',
          [tid(1), uid(101), randomUUID()],
        )
      ).rows[0].x;
      await denied(
        () =>
          as(5, 'select public.ebd_member_invite_accept($1,$2,$3)', [
            common.token,
            tid(5),
            bound,
          ]),
        '22023',
      );
      const other = randomUUID();
      await as(5, 'select public.ebd_member_invite_accept($1,$2,$3)', [
        common.token,
        tid(5),
        other,
      ]);
      await denied(
        () =>
          as(5, 'select public.ebd_member_invite_accept($1,$2,$3)', [
            legacy.token,
            tid(5),
            other,
          ]),
        '22023',
      );
    },
  );
  await check(
    'revocation through old API invalidates both versions with a single audit event',
    async () => {
      await as(1, 'select public.guild_scoped_revoke_invite($1,$2,$3)', [
        invite.id,
        tid(1),
        uid(101),
      ]);
      await as(1, 'select public.guild_scoped_revoke_invite($1,$2,$3)', [
        invite.id,
        tid(1),
        uid(101),
      ]);
      await denied(() => preview(invite.token), 'P0002');
      await denied(() => oldAccept(6, invite.token), 'P0002');
      await denied(() => accept(6, invite.token), 'P0002');
      assert.equal(
        (
          await q(
            "select count(*)::int n from ebd_class_private.legacy_events where invite_id=$1 and action='revoked'",
            [invite.id],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  await check('legacy expiration never becomes eligible again', async () => {
    const i = await issue();
    await q(
      "update guild_invite_private.link_invites set created_at=now()-interval '8 days',expires_at=now()-interval '1 day' where id=$1",
      [i.id],
    );
    await denied(() => preview(i.token), 'P0002');
    await denied(() => accept(6, i.token), 'P0002');
  });
  await check(
    'legacy last available use is atomic across distinct connections and cannot exceed100',
    async () => {
      const i = await issue();
      for (let n = 6; n <= 104; n++) await accept(n, i.token);
      const a = new Client(options),
        b = new Client(options);
      await a.connect();
      await b.connect();
      connections.push(a, b);
      const results = await Promise.allSettled([
        accept(2, i.token, a),
        accept(3, i.token, b),
      ]);
      assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
      assert.deepEqual(
        results
          .filter((x) => x.status === 'rejected')
          .map((x) => x.reason.code),
        ['P0002'],
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from ebd_class_private.legacy_uses where invite_id=$1',
            [i.id],
          )
        ).rows[0].n,
        100,
      );
      await denied(() => preview(i.token), 'P0002');
      await denied(() => accept(5, i.token), 'P0002');
    },
  );
  await check(
    'legacy private receipts and helpers deny all application roles',
    async () => {
      for (const role of ['anon', 'authenticated', 'service_role'])
        for (const table of ['legacy_uses', 'legacy_events'])
          await denied(
            () => as(2, `select * from ebd_class_private.${table}`, [], role),
            '42501',
          );
      await denied(
        () =>
          as(2, 'select ebd_class_private.legacy_accept($1,$2,$3)', [
            invite.token,
            tid(2),
            randomUUID(),
          ]),
        '42501',
      );
      await denied(
        () =>
          as(2, 'select public.ebd_member_invite_accept($1,$2,$3)', [
            invite.token,
            tid(1),
            randomUUID(),
          ]),
        '42501',
      );
    },
  );
  await check(
    'issued legacy evidence prevents destructive empty recovery',
    async () => {
      await q('BEGIN');
      try {
        await denied(
          () =>
            q(
              readFileSync(
                'packages/database/proposals/rpg-dev-010b-legacy-recovery-empty.sql',
                'utf8',
              ),
            ),
          'P0001',
        );
      } finally {
        await q('ROLLBACK');
      }
    },
  );
  await check(
    'protected containment stops old invitation entrypoint without deleting bindings',
    async () => {
      const i = await issue();
      const before = (
        await q('select to_jsonb(m) x from public.guild_members m order by id')
      ).rows;
      await q('BEGIN');
      await q(
        'update guild_admin_private.multiguild_control set writes_enabled=false',
      );
      await q('COMMIT');
      await denied(() => oldAccept(5, i.token), '55000');
      assert.deepEqual(
        (
          await q(
            'select to_jsonb(m) x from public.guild_members m order by id',
          )
        ).rows,
        before,
      );
      await q(
        'update guild_admin_private.multiguild_control set writes_enabled=true',
      );
    },
  );
}
