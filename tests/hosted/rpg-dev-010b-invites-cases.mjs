// Additional synthetic cases on the same isolated cluster; never Auth/hosted proof.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
export async function run({
  q,
  as,
  cmd,
  check,
  denied,
  uid,
  tid,
  options,
  connections,
}) {
  const create = (
    n,
    g = 100,
    c = null,
    days = 30,
    uses = 100,
    request = randomUUID(),
  ) =>
    as(n, 'select public.ebd_member_invite_create($1,$2,$3,$4,$5,$6) x', [
      tid(n),
      uid(g),
      c === null ? null : uid(c),
      request,
      days,
      uses,
    ]).then((r) => r.rows[0].x);
  const accept = (n, token, request = randomUUID(), client) =>
    as(
      n,
      'select public.ebd_member_invite_accept($1,$2,$3) x',
      [token, tid(n), request],
      'authenticated',
      client,
    ).then((r) => r.rows[0].x);
  const preview = (token, role = 'anon') =>
    as(
      null,
      'select public.ebd_member_invite_preview($1) x',
      [token],
      role,
    ).then((r) => r.rows[0].x);
  const revoke = (n, g, c, id) =>
    as(n, 'select public.ebd_member_invite_revoke($1,$2,$3,$4)', [
      tid(n),
      uid(g),
      c === null ? null : uid(c),
      id,
    ]);
  await check('common invite limits enforce 30days and100uses', async () => {
    for (const [days, uses] of [
      [0, 1],
      [31, 1],
      [1, 0],
      [1, 101],
    ])
      await denied(() => create(1, 100, null, days, uses), '22023');
  });
  let invitation;
  const request = randomUUID();
  await check(
    'common invitation stores only token hash and replays without secret',
    async () => {
      invitation = await create(1, 100, null, 30, 100, request);
      assert.match(invitation.token, /^[a-f0-9]{64}$/);
      const replay = await create(1, 100, null, 30, 100, request);
      assert.equal(replay.token, null);
      assert.equal(replay.replayed, true);
      assert.equal(replay.id, invitation.id);
      await denied(() => create(1, 100, null, 7, 100, request), '22023');
    },
  );
  await check(
    'anonymous preview shows only Guild/class labels and expiry',
    async () => {
      const p = await preview(invitation.token);
      assert.deepEqual(Object.keys(p).sort(), [
        'className',
        'expiresAt',
        'guildName',
      ]);
      assert.equal(p.className, null);
      assert.equal(p.guildName, 'Fixture 100');
      await denied(() => preview('f'.repeat(64)), 'P0002');
    },
  );
  await check('student cannot issue Guild or class invites', async () => {
    await denied(() => create(3), '42501');
    await denied(() => create(3, 100, 201), '42501');
  });
  await cmd(1, 100, 201, 'teacher', 0, {
    travelerId: tid(2),
    active: true,
    publish: true,
    attend: true,
  });
  let teacherInvite;
  await check(
    'teacher issues invite only to own class, never Guild-only or another class',
    async () => {
      teacherInvite = await create(2, 100, 201);
      await denied(() => create(2), '42501');
      await denied(() => create(2, 100, 200), '42501');
      await denied(() => create(1, 101, 201), 'P0002');
    },
  );
  await check(
    'class invitation accepts automatically with no leader request and no privileged role',
    async () => {
      const response = await accept(3, teacherInvite.token);
      assert.equal(response.enrolled, true);
      assert.equal(response.classId, uid(201));
      assert.equal(
        (
          await q(
            'select status from ebd_class_private.members where class_id=$1 and traveler_id=$2',
            [uid(201), tid(3)],
          )
        ).rows[0].status,
        'active',
      );
      assert.equal(
        (await q('select count(*)::int n from public.guild_join_requests'))
          .rows[0].n,
        0,
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from ebd_class_private.teachers where traveler_id=$1',
            [tid(3)],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    'accept replay cannot use another slot or create duplicate enrollment',
    async () => {
      const replay = await accept(3, teacherInvite.token);
      assert.equal(replay.replayed, true);
      assert.equal(
        (
          await q(
            'select use_count from ebd_class_private.invites where id=$1',
            [teacherInvite.id],
          )
        ).rows[0].use_count,
        1,
      );
    },
  );
  await check(
    'a new student joins Guild and class atomically, without manual approval or teacher grant',
    async () => {
      assert.equal(
        (
          await q(
            'select count(*)::int n from public.guild_members where traveler_id=$1',
            [tid(4)],
          )
        ).rows[0].n,
        0,
      );
      const i = await create(1, 100, 201);
      await accept(4, i.token);
      assert.deepEqual(
        (
          await q(
            'select role,status from public.guild_members where guild_id=$1 and traveler_id=$2',
            [uid(100), tid(4)],
          )
        ).rows,
        [{ role: 'member', status: 'active' }],
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from ebd_class_private.teachers where traveler_id=$1',
            [tid(4)],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check('paused or archived class denies new invitations', () =>
    denied(() => create(1, 100, 200), 'P0002'),
  );
  await check(
    'teacher revocation invalidates unconsumed old invitations immediately',
    async () => {
      await cmd(1, 100, 201, 'teacher', 1, {
        travelerId: tid(2),
        active: false,
        publish: false,
        attend: false,
      });
      await denied(() => preview(teacherInvite.token), 'P0002');
      await denied(() => accept(2, teacherInvite.token), 'P0002');
    },
  );
  await check(
    'revoked and expired invitations reject new acceptance',
    async () => {
      const revoked = await create(1);
      await revoke(1, 100, null, revoked.id);
      await denied(() => accept(3, revoked.token), 'P0002');
      const expired = await create(1, 100, null, 1, 5);
      await q(
        "update ebd_class_private.invites set created_at=now()-interval '3 days',expires_at=now()-interval '1 day' where id=$1",
        [expired.id],
      );
      await denied(() => accept(3, expired.token), 'P0002');
    },
  );
  await check(
    'one remaining use under concurrent different accounts is consumed once',
    async () => {
      const i = await create(1, 100, null, 1, 1),
        a = new Client(options),
        b = new Client(options);
      await a.connect();
      await b.connect();
      connections.push(a, b);
      const results = await Promise.allSettled([
        accept(2, i.token, randomUUID(), a),
        accept(3, i.token, randomUUID(), b),
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
            'select use_count from ebd_class_private.invites where id=$1',
            [i.id],
          )
        ).rows[0].use_count,
        1,
      );
      await denied(() => preview(i.token), 'P0002');
    },
  );
  await check(
    'a removed enrollment cannot be revived by replaying the consumed invite',
    async () => {
      await cmd(1, 100, 201, 'member', 1, {
        travelerId: tid(3),
        active: false,
      });
      const replacement = await create(1, 100, 201);
      await accept(3, replacement.token);
      await cmd(1, 100, 201, 'member', 3, {
        travelerId: tid(3),
        active: false,
      });
      await denied(() => accept(3, replacement.token), '42501');
    },
  );
  await check(
    'private tokens, uses and history deny application reads and writes',
    async () => {
      for (const table of ['invites', 'invite_uses', 'invite_history'])
        for (const role of ['anon', 'authenticated', 'service_role']) {
          await denied(
            () => as(2, `select * from ebd_class_private.${table}`, [], role),
            '42501',
          );
          await denied(
            () => as(2, `delete from ebd_class_private.${table}`, [], role),
            '42501',
          );
        }
    },
  );
  await check(
    'invitation never authenticates anonymous user or another owned avatar',
    async () => {
      await denied(
        () =>
          as(
            null,
            'select public.ebd_member_invite_accept($1,$2,$3)',
            [invitation.token, tid(2), randomUUID()],
            'anon',
          ),
        '42501',
      );
      await denied(
        () =>
          as(2, 'select public.ebd_member_invite_accept($1,$2,$3)', [
            invitation.token,
            tid(3),
            randomUUID(),
          ]),
        '42501',
      );
    },
  );
}
