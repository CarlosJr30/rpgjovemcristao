import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export async function run({
  q,
  uid,
  tid,
  as,
  cmd,
  check,
  rejects,
  newConnection,
  email,
  gameData,
  beforeGame,
  beforeGuilds,
  beforeMembers,
  beforeChestOps,
}) {
  const createdGuild = uid(401),
    createRequest = randomUUID(),
    createData = {
      name: 'Guild pública',
      description: 'Conta regular elegível',
    };
  const createAs = (actor, guild, request, data = createData, client) =>
    as(
      2,
      'select public.guild_scoped_command($1,$2,$3,$4,$5,$6) result',
      [actor, guild, 'create', guild, request, data],
      true,
      client,
    );

  await check(
    'migration backfills existing creators without rewriting Guilds or memberships',
    async () => {
      assert.equal(
        (
          await q(
            'select count(*) n from guild_admin_private.guild_creation_claims',
          )
        ).rows[0].n,
        '2',
      );
      assert.deepEqual(
        (
          await q(
            'select * from public.guilds where id=any($1::uuid[]) order by id',
            [beforeGuilds.map((x) => x.id)],
          )
        ).rows,
        beforeGuilds,
      );
      assert.deepEqual(
        (
          await q(
            'select * from public.guild_members where guild_id=any($1::uuid[]) order by id',
            [beforeGuilds.map((x) => x.id)],
          )
        ).rows,
        beforeMembers,
      );
      const before = JSON.parse(beforeGame),
        after = JSON.parse(await gameData());
      for (const key of ['wallets', 'stats', 'inventory', 'chests'])
        assert.deepEqual(after[key], before[key]);
    },
  );

  await check(
    'eligible regular player creates one Guild and becomes its scoped leader',
    async () => {
      const status = (
        await as(2, 'select public.guild_creation_status($1) result', [tid(2)])
      ).rows[0].result;
      assert.deepEqual(status, {
        eligible: true,
        canCreate: true,
        hasCreated: false,
      });
      const first = (await createAs(tid(2), createdGuild, createRequest))
        .rows[0].result;
      assert.equal(first.status, 'created');
      assert.equal(first.replayed, false);
      const replay = (await createAs(tid(2), createdGuild, createRequest))
        .rows[0].result;
      assert.equal(replay.replayed, true);
      const leader = (
        await q(
          'select role,status from public.guild_members where guild_id=$1 and traveler_id=$2',
          [createdGuild, tid(2)],
        )
      ).rows[0];
      assert.deepEqual(leader, { role: 'leader', status: 'active' });
      assert.deepEqual(
        (
          await as(2, 'select public.guild_creation_status($1) result', [
            tid(2),
          ])
        ).rows[0].result,
        { eligible: true, canCreate: false, hasCreated: true },
      );
    },
  );

  await check(
    'account-wide limit rejects another active avatar and payload conflict',
    async () => {
      await q(
        "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,'Alternate','male','medio','curto','musgo',false)",
        [tid(12), uid(2)],
      );
      await q('update public.travelers set is_active=false where user_id=$1', [
        uid(2),
      ]);
      await q('update public.travelers set is_active=true where id=$1', [
        tid(12),
      ]);
      await rejects(() => createAs(tid(12), uid(402), randomUUID()), '23505');
      await q('update public.travelers set is_active=false where user_id=$1', [
        uid(2),
      ]);
      await q('update public.travelers set is_active=true where id=$1', [
        tid(2),
      ]);
      await rejects(
        () =>
          createAs(tid(2), createdGuild, createRequest, {
            name: 'Alterada',
            description: '',
          }),
        '22023',
      );
      await rejects(
        () =>
          as(2, 'select public.create_guild($1,$2,$3)', [
            tid(2),
            'Legacy bypass',
            '',
          ]),
        '23505',
      );
      assert.equal(
        (
          await q(
            'select count(*) n from public.guilds where created_by_user_id=$1',
            [uid(2)],
          )
        ).rows[0].n,
        '1',
      );
    },
  );

  await check(
    'concurrent requests for one account commit at most one Guild',
    async () => {
      const a = await newConnection(),
        b = await newConnection(),
        g1 = uid(409),
        g2 = uid(410);
      const results = await Promise.allSettled([
        as(
          9,
          'select public.guild_scoped_command($1,$2,$3,$4,$5,$6) result',
          [
            tid(9),
            g1,
            'create',
            g1,
            randomUUID(),
            { name: 'Race A', description: '' },
          ],
          true,
          a,
        ),
        as(
          9,
          'select public.guild_scoped_command($1,$2,$3,$4,$5,$6) result',
          [
            tid(9),
            g2,
            'create',
            g2,
            randomUUID(),
            { name: 'Race B', description: '' },
          ],
          true,
          b,
        ),
      ]);
      assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
      assert.equal(
        results.filter(
          (x) => x.status === 'rejected' && x.reason.code === '23505',
        ).length,
        1,
      );
      assert.equal(
        (
          await q(
            'select count(*) n from public.guilds where created_by_user_id=$1',
            [uid(9)],
          )
        ).rows[0].n,
        '1',
      );
    },
  );

  await check(
    'creator gains no global or third-party Guild authority',
    async () => {
      const status = (await as(2, 'select public.guild_scoped_status() result'))
        .rows[0].result;
      assert.equal(status.administrator, false);
      await rejects(
        () => cmd(2, uid(203), 'review', randomUUID(), { approve: true }),
        '42501',
      );
      assert.equal(
        (
          await as(2, 'select public.guild_scoped_contexts($1) result', [
            tid(2),
          ])
        ).rows[0].result.guilds.length,
        1,
      );
    },
  );

  await check(
    'existing link invitation, join request, and leader approval remain functional',
    async () => {
      const invite = (
        await as(
          2,
          'select public.guild_scoped_create_invite($1,$2,$3) result',
          [tid(2), createdGuild, randomUUID()],
        )
      ).rows[0].result;
      const request = (
        await as(6, 'select guild_invite_private.request_invite($1,$2) id', [
          invite.token,
          tid(6),
        ])
      ).rows[0].id;
      assert(request);
      const result = (
        await cmd(2, createdGuild, 'review', request, { approve: true })
      ).rows[0].result;
      assert.equal(result.status, 'accepted');
      assert.equal(
        (
          await q(
            'select count(*) n from public.guild_members where guild_id=$1 and traveler_id=$2 and status=$3',
            [createdGuild, tid(6), 'active'],
          )
        ).rows[0].n,
        '1',
      );
    },
  );

  await check(
    'anonymous and unverified accounts cannot create; private claims stay inaccessible',
    async () => {
      await q(
        'insert into auth.users(id,is_anonymous,email,email_confirmed_at) values($1,false,$2,null)',
        [uid(8), email(8)],
      );
      await q(
        "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,'Unverified','male','medio','curto','musgo',true)",
        [tid(8), uid(8)],
      );
      await rejects(
        () =>
          as(5, 'select public.guild_scoped_command($1,$2,$3,$4,$5,$6)', [
            tid(5),
            uid(415),
            'create',
            uid(415),
            randomUUID(),
            { name: 'Anon', description: '' },
          ]),
        '42501',
      );
      await rejects(
        () =>
          as(8, 'select public.guild_scoped_command($1,$2,$3,$4,$5,$6)', [
            tid(8),
            uid(416),
            'create',
            uid(416),
            randomUUID(),
            { name: 'Unverified', description: '' },
          ]),
        '42501',
      );
      assert.equal(
        (
          await q(
            "select relrowsecurity from pg_class where oid='guild_admin_private.guild_creation_claims'::regclass",
          )
        ).rows[0].relrowsecurity,
        true,
      );
      assert.equal(
        (
          await q(
            "select has_table_privilege('authenticated','guild_admin_private.guild_creation_claims','SELECT') x",
          )
        ).rows[0].x,
        false,
      );
      assert.equal(
        (
          await q(
            "select has_function_privilege('authenticated','guild_admin_private.claim_guild_creation(uuid,uuid,uuid,uuid,jsonb)','EXECUTE') x",
          )
        ).rows[0].x,
        false,
      );
      await rejects(
        () => as(2, 'select * from guild_admin_private.guild_creation_claims'),
        '42501',
      );
    },
  );

  await check(
    'creation migration leaves economic balances and ledgers unchanged',
    async () => {
      const before = JSON.parse(beforeGame),
        after = JSON.parse(await gameData());
      for (const key of ['wallets', 'stats', 'inventory', 'chests'])
        assert.deepEqual(after[key], before[key]);
      assert.equal(
        (await q('select count(*) n from public.chest_operations')).rows[0].n,
        beforeChestOps,
      );
    },
  );
}
