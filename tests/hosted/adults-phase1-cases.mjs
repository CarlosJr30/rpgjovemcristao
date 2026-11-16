import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
export async function verifyPhase1({
  q,
  check,
  denied,
  login,
  reset,
  db,
  uid,
}) {
  const sql = readFileSync(
    'packages/database/deployments/community043b/sql/adults_phase1_global_access.sql.in',
    'utf8',
  );
  await q(`CREATE ROLE authenticator;CREATE ROLE supabase_auth_admin;
 CREATE TABLE public.phase1_fixture_data(owner_uid uuid,value int);
 ALTER TABLE public.phase1_fixture_data ENABLE ROW LEVEL SECURITY;
 CREATE POLICY old_owner ON public.phase1_fixture_data FOR ALL TO authenticated USING(owner_uid=auth.uid()) WITH CHECK(owner_uid=auth.uid());
 GRANT SELECT,INSERT,UPDATE,DELETE ON public.phase1_fixture_data TO authenticated,anon;
 CREATE SCHEMA storage;CREATE TABLE storage.objects(owner_uid uuid);
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE POLICY old_owner ON storage.objects TO authenticated USING(owner_uid=auth.uid()) WITH CHECK(owner_uid=auth.uid());
 GRANT USAGE ON SCHEMA storage TO authenticated;GRANT SELECT ON storage.objects TO authenticated;
 CREATE SCHEMA realtime;CREATE TABLE realtime.messages(owner_uid uuid);
 ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
 CREATE POLICY old_owner ON realtime.messages TO authenticated USING(owner_uid=auth.uid()) WITH CHECK(owner_uid=auth.uid());
 GRANT USAGE ON SCHEMA realtime TO authenticated;GRANT SELECT ON realtime.messages TO authenticated;`);
  await check(
    'global installation rejects missing explicit authorization atomically',
    async () => {
      await q('BEGIN');
      await denied(() => q(sql));
      await q('ROLLBACK');
      assert.equal(
        (await q("select to_regprocedure('public.phase1_is_adult()') v"))
          .rows[0].v,
        null,
      );
    },
  );
  const start =
    "BEGIN;SET LOCAL rpg.community043b.target_project='wspafhlbtlpabypzymjo';SET LOCAL rpg.community043b.phase1_install='reviewed-production';";
  await check(
    'global installation refuses unreviewed client table without RLS',
    async () => {
      await q(
        start +
          'CREATE TABLE public.phase1_unreviewed(id int); GRANT SELECT ON public.phase1_unreviewed TO authenticated;',
      );
      await assert.rejects(
        () => q(sql),
        (e) => e.message.includes('without reviewed RLS'),
      );
      await q('ROLLBACK');
      assert.equal(
        (await q("select to_regprocedure('public.phase1_is_adult()') v"))
          .rows[0].v,
        null,
      );
    },
  );
  await check(
    'global installation refuses overwriting another pre-request hook',
    async () => {
      await q(
        start +
          "ALTER ROLE authenticator SET pgrst.db_pre_request='public.other_hook';",
      );
      await assert.rejects(
        () => q(sql),
        (e) => e.message.includes('explicit composition'),
      );
      await q('ROLLBACK');
    },
  );
  await q(start);
  await q(sql);
  await q('COMMIT');
  const before = (await q('select count(*)::int n from public.travelers'))
    .rows[0].n;
  await q(
    "insert into community_age_private.attestations values(community_retention_private.subject($1),true,now()-interval '1 minute',now()+interval '1 hour',decode(repeat('cd',32),'hex'))",
    [uid(28)],
  );
  for (const n of [28, 29]) {
    await q('insert into public.phase1_fixture_data values($1,10)', [uid(n)]);
    await q('insert into storage.objects values($1)', [uid(n)]);
    await q('insert into realtime.messages values($1)', [uid(n)]);
  }
  await check(
    'DOB robot calculates full eighteen years and never creates evidence',
    async () => {
      const count = (
        await q(
          'select count(*)::int n from community_age_private.attestations',
        )
      ).rows[0].n;
      for (const [birth, today, expected] of [
        ['2008-11-15', '2026-11-15', true],
        ['2008-11-16', '2026-11-15', false],
        ['2008-02-29', '2026-02-28', false],
        ['2008-02-29', '2026-03-01', true],
        ['2030-01-01', '2026-11-15', false],
        [null, '2026-11-15', false],
      ]) {
        assert.equal(
          (
            await q('select community_age_private.declared_adult($1,$2) v', [
              birth,
              today,
            ])
          ).rows[0].v,
          expected,
        );
      }
      assert.equal(
        (
          await q(
            'select count(*)::int n from community_age_private.attestations',
          )
        ).rows[0].n,
        count,
      );
    },
  );
  await check(
    'old token unknown age denied by API guard and restrictive policies',
    async () => {
      await login(db, 29);
      try {
        await q(
          "select set_config('request.path','/rpc/community_create_own_guild',false)",
        );
        await denied(() => q('select public.phase1_check_request()'));
        assert.deepEqual(
          (await q('select public.phase1_game_access() v')).rows[0].v,
          { version: 1, allowed: false },
        );
        for (const table of [
          'public.phase1_fixture_data',
          'storage.objects',
          'realtime.messages',
        ])
          assert.equal(
            (await q(`select count(*)::int n from ${table}`)).rows[0].n,
            0,
          );
        await denied(() =>
          q('insert into public.phase1_fixture_data values($1,10)', [uid(29)]),
        );
        await q(
          "select set_config('request.path','/rpc/phase1_game_access',false)",
        );
        await q('select public.phase1_check_request()');
      } finally {
        await reset();
      }
    },
  );
  await check(
    'verified adult accesses only owned rows preserving previous RLS',
    async () => {
      await login(db, 28);
      try {
        await q(
          "select set_config('request.path','/rpc/community_create_own_guild',false)",
        );
        await q('select public.phase1_check_request()');
        assert.deepEqual(
          (await q('select public.phase1_game_access() v')).rows[0].v,
          { version: 1, allowed: true },
        );
        for (const table of [
          'public.phase1_fixture_data',
          'storage.objects',
          'realtime.messages',
        ])
          assert.equal(
            (await q(`select count(*)::int n from ${table}`)).rows[0].n,
            1,
          );
        await denied(() =>
          q('insert into public.phase1_fixture_data values($1,10)', [uid(29)]),
        );
        await denied(() => q("select public.phase1_access_token('{}')"));
      } finally {
        await reset();
      }
    },
  );
  await check(
    'revoked assertion or expired session immediately closes legacy data access',
    async () => {
      await q('update auth.sessions set not_after=now() where user_id=$1', [
        uid(28),
      ]);
      await login(db, 28);
      try {
        assert.equal(
          (await q('select public.phase1_is_adult() v')).rows[0].v,
          false,
        );
      } finally {
        await reset();
      }
      await q('update auth.sessions set not_after=null where user_id=$1', [
        uid(28),
      ]);
      await q(
        'update community_age_private.attestations set adult=false where subject=community_retention_private.subject($1)',
        [uid(28)],
      );
      await login(db, 28);
      try {
        assert.equal(
          (await q('select count(*)::int n from public.phase1_fixture_data'))
            .rows[0].n,
          0,
        );
      } finally {
        await reset();
      }
    },
  );
  await check(
    'Auth hooks reject self-declared birthdate metadata and every enrollment provider',
    async () => {
      await q('SET ROLE supabase_auth_admin');
      try {
        for (const provider of [
          'email',
          'google',
          'azure',
          'invite',
          'anonymous',
        ]) {
          const result = (
            await q('select public.phase1_before_user_created($1) v', [
              {
                user: {
                  app_metadata: { provider },
                  user_metadata: { birthdate: '1980-01-01', adult: true },
                },
              },
            ])
          ).rows[0].v;
          assert.equal(result.error.http_code, 403);
        }
        for (const method of [
          'password',
          'oauth',
          'invite',
          'token_refresh',
          'recovery',
        ]) {
          const result = (
            await q('select public.phase1_access_token($1) v', [
              {
                user_id: uid(29),
                authentication_method: method,
                claims: { sub: uid(29), user_metadata: { adult: true } },
              },
            ])
          ).rows[0].v;
          assert.equal(result.error.http_code, 403);
        }
      } finally {
        await reset();
      }
    },
  );
  await check(
    'Auth token hook preserves verified adult claims and rejects mismatched identity',
    async () => {
      await q(
        'update community_age_private.attestations set adult=true where subject=community_retention_private.subject($1)',
        [uid(28)],
      );
      await q('SET ROLE supabase_auth_admin');
      try {
        const claims = {
          sub: uid(28),
          session_id: uid(28),
          role: 'authenticated',
        };
        assert.deepEqual(
          (
            await q('select public.phase1_access_token($1) v', [
              { user_id: uid(28), claims },
            ])
          ).rows[0].v,
          { claims },
        );
        assert.equal(
          (
            await q('select public.phase1_access_token($1) v', [
              { user_id: uid(29), claims },
            ])
          ).rows[0].v.error.http_code,
          403,
        );
      } finally {
        await reset();
      }
    },
  );
  await check(
    'global installation preserves avatars and keeps registration unavailable',
    async () => {
      assert.equal(
        (await q('select count(*)::int n from public.travelers')).rows[0].n,
        before,
      );
      assert.deepEqual(
        (await q('select public.phase1_enrollment_access() v')).rows[0].v,
        { version: 1, allowed: false },
      );
    },
  );
}
