// Synthetic assertions inserted only by postgres in the loopback fixture.
// No assertion issuer or age-assurance provider is simulated as hosted proof.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

export async function verifyAge({
  q,
  check,
  denied,
  login,
  reset,
  db,
  uid,
  tid,
  create,
}) {
  const sql = readFileSync(
    'packages/database/deployments/community043b/sql/community_age_eligibility_v1.sql.in',
    'utf8',
  );
  await check(
    'age installation rejects missing explicit production guard',
    async () => {
      await q('BEGIN');
      await denied(() => q(sql));
      await q('ROLLBACK');
      assert.equal(
        (await q("select to_regnamespace('community_age_private') n")).rows[0]
          .n,
        null,
      );
    },
  );
  const before = (
    await q(
      'select (select count(*) from public.guilds) g,(select count(*) from public.guild_members) m,(select count(*) from public.guild_invites) i',
    )
  ).rows;
  await q(
    "BEGIN;SET LOCAL rpg.community043b.target_project='wspafhlbtlpabypzymjo';SET LOCAL rpg.community043b.age_install='reviewed-production'",
  );
  await q(sql);
  await q('COMMIT');
  await check(
    'age installation preserves historical Guilds memberships and invites',
    async () => {
      assert.deepEqual(
        (
          await q(
            'select (select count(*) from public.guilds) g,(select count(*) from public.guild_members) m,(select count(*) from public.guild_invites) i',
          )
        ).rows,
        before,
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from community_age_private.attestations',
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await q(
    "update cron.job set active=true;update community_retention_private.health set last_success=now();update guild_admin_private.multiguild_control set writes_enabled=true,community_creation_enabled=true,community_environment='production'",
  );
  for (let n = 20; n <= 29; n++) {
    await q('insert into auth.users(id) values($1)', [uid(n)]);
    await q('insert into auth.sessions values($1,$1,null)', [uid(n)]);
    if (n !== 23)
      await q('insert into public.travelers(id,user_id) values($1,$2)', [
        tid(n),
        uid(n),
      ]);
  }
  const attest = (n, adult = true, expiry = '1 hour') =>
    q(
      `insert into community_age_private.attestations values(community_retention_private.subject($1),$2,now()-interval '1 minute',now()+$3::interval,decode(repeat('ab',32),'hex')) on conflict(subject) do update set adult=excluded.adult,valid_until=excluded.valid_until`,
      [uid(n), adult, expiry],
    );
  await attest(20);
  await attest(21, false);
  await check('unknown age and known minor cannot create', async () => {
    await denied(() => create(22));
    await denied(() => create(21));
  });
  let guild;
  await check(
    'verified adult creates leads and replay preserves one Guild',
    async () => {
      const request = randomUUID();
      const result = await create(20, request);
      guild = result.id;
      assert.equal((await create(20, request)).id, guild);
      assert.equal(
        (
          await q(
            'select role from public.guild_members where guild_id=$1 and traveler_id=$2',
            [guild, tid(20)],
          )
        ).rows[0].role,
        'leader',
      );
      await denied(() => create(20), '23505');
    },
  );
  await check(
    'minor administrative promotion transfer grant and direct creation denied',
    async () => {
      await denied(() =>
        q(
          "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'leader','active')",
          [guild, tid(21)],
        ),
      );
      await denied(() =>
        q('update public.guilds set leader_traveler_id=$1 where id=$2', [
          tid(21),
          guild,
        ]),
      );
      await denied(() =>
        q(
          'insert into guild_admin_private.leader_authorizations(user_id) values($1)',
          [uid(21)],
        ),
      );
      await denied(() =>
        q(
          "insert into public.guilds(name,created_by_user_id,leader_traveler_id) values('Denied',$1,$2)",
          [uid(21), tid(21)],
        ),
      );
    },
  );
  await check(
    'new minor or unknown participation closed pending supervised safeguards',
    async () => {
      for (const n of [21, 22])
        await denied(() =>
          q(
            "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','pending')",
            [guild, tid(n)],
          ),
        );
    },
  );
  await check(
    'ordinary player cannot read or write age assertions or bypass helpers',
    async () => {
      await login(db, 21);
      try {
        await denied(() =>
          q('select * from community_age_private.attestations'),
        );
        await denied(() => q('delete from community_age_private.attestations'));
        await denied(() =>
          q('select community_age_private.require_adult($1)', [uid(21)]),
        );
        assert.deepEqual(
          (
            await q('select public.community_own_guild_capability($1) v', [
              tid(21),
            ])
          ).rows[0].v,
          { version: 1, available: false },
        );
      } finally {
        await reset();
      }
    },
  );
  await check(
    'turning eighteen requires fresh trusted validation, not a browser change',
    async () => {
      assert.equal(
        (await q('select community_age_private.adult_account($1) v', [uid(21)]))
          .rows[0].v,
        false,
      );
      await attest(21, true);
      await login(db, 21);
      try {
        assert.deepEqual(
          (
            await q('select public.community_own_guild_capability($1) v', [
              tid(21),
            ])
          ).rows[0].v,
          { version: 1, available: true },
        );
      } finally {
        await reset();
      }
    },
  );
  await check(
    'expired assertion no avatar suspended account or missing session denied',
    async () => {
      for (const n of [23, 24, 25, 26]) await attest(n);
      await attest(26, true, '-1 second');
      await q(
        "update auth.users set banned_until=now()+interval '1 day' where id=$1",
        [uid(24)],
      );
      await q('delete from auth.sessions where user_id=$1', [uid(25)]);
      for (const n of [23, 24, 25, 26]) await denied(() => create(n));
    },
  );
  await check(
    'existing effective leadership closes after evidence expiry',
    async () => {
      assert.equal(
        (
          await q('select guild_admin_private.leader_not_revoked($1) v', [
            tid(20),
          ])
        ).rows[0].v,
        true,
      );
      await attest(20, true, '-1 second');
      assert.equal(
        (
          await q('select guild_admin_private.leader_not_revoked($1) v', [
            tid(20),
          ])
        ).rows[0].v,
        false,
      );
    },
  );
  await check(
    'Auth deletion erases assertion and restoration cannot recover authority',
    async () => {
      await q('update auth.users set deleted_at=now() where id=$1', [uid(21)]);
      await q('update auth.users set deleted_at=null where id=$1', [uid(21)]);
      assert.equal(
        (await q('select community_age_private.adult_account($1) v', [uid(21)]))
          .rows[0].v,
        false,
      );
    },
  );
  await check(
    'age tables have RLS and no client service-role privileges',
    async () => {
      assert.equal(
        (
          await q(
            "select relrowsecurity from pg_class where oid='community_age_private.attestations'::regclass",
          )
        ).rows[0].relrowsecurity,
        true,
      );
      for (const role of ['anon', 'authenticated', 'service_role'])
        assert.equal(
          (
            await q(
              "select has_schema_privilege($1,'community_age_private','USAGE') v",
              [role],
            )
          ).rows[0].v,
          false,
        );
    },
  );
}
