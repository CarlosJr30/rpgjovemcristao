import assert from 'node:assert/strict';
export async function run({ q, check, denied, uid, tid }) {
  const actor = tid(2),
    owner = uid(2),
    mission = uid(42000),
    attempt = uid(42001),
    guild = uid(100);
  await q(
    'update public.travelers set economic_verified_at=clock_timestamp() where id=$1',
    [actor],
  );
  const call = async (kind, event) => {
    try {
      await q('BEGIN;SET LOCAL ROLE authenticated');
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          owner,
          JSON.stringify({
            sub: owner,
            session_id: uid(5002),
            is_anonymous: false,
          }),
        ],
      );
      const r = await q('select public.claim_progress_reward($1,$2,$3) x', [
        actor,
        kind,
        event,
      ]);
      await q('COMMIT');
      return r.rows[0].x;
    } catch (e) {
      await q('ROLLBACK');
      throw e;
    }
  };
  const state = async () =>
    (
      await q(
        "select jsonb_build_object('wallet',(select to_jsonb(v) from public.wallets v where traveler_id=$1),'inventory',(select jsonb_agg(to_jsonb(v) order by id) from public.inventory v where traveler_id=$1),'xp',(select jsonb_build_object('xp',xp,'level',level) from public.travelers where id=$1),'receipts',(select jsonb_agg(to_jsonb(v) order by id) from public.chest_operations v where traveler_id=$1),'chests',(select jsonb_agg(to_jsonb(v) order by chest_type) from public.traveler_chests v where traveler_id=$1)) x",
        [actor],
      )
    ).rows[0].x;
  await check(
    'the existing activity command binds the approved tier to its idempotent draft, without accepting a second reward source',
    async () => {
      const id = uid(42300),
        request = uid(42301),
        payload = {
          title: '041 synthetic mission',
          description: 'Disposable fixture',
          objective: 'Validate economic tier',
          instructions: 'Synthetic fixture only',
          evidenceCriterion: 'Peer validation',
          bibleReference: '',
          startsAt: '',
          dueAt: '',
          audience: 'all',
          targetIds: [],
          kind: 'activity',
          meetingId: '',
          category: 'practical',
          theme: '',
          meetingType: 'in_person',
          responsibleId: tid(1),
          accessDetails: '',
          futureCategory: 'none',
          economyTier: 'great',
        };
      const cmd = async (data, pid = id, req = request) => {
        try {
          await q('BEGIN;SET LOCAL ROLE authenticated');
          await q(
            "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
            [
              uid(1),
              JSON.stringify({
                sub: uid(1),
                session_id: uid(5001),
                is_anonymous: false,
              }),
            ],
          );
          const r = await q(
            "select public.guild_activity_command($1,$2,'save',$3,$4,0,$5) x",
            [tid(1), guild, pid, req, data],
          );
          await q('COMMIT');
          return r.rows[0].x;
        } catch (e) {
          await q('ROLLBACK');
          throw e;
        }
      };
      const r = await cmd(payload);
      assert.equal(r.replayed, false);
      assert.equal((await cmd(payload)).replayed, true);
      assert.equal(
        (
          await q('select reward_tier from public.guild_missions where id=$1', [
            id,
          ])
        ).rows[0].reward_tier,
        'great',
      );
      await denied(() => cmd({ ...payload, economyTier: 'normal' }), 'PT409');
      await denied(
        () =>
          cmd({ ...payload, futureCategory: 'common' }, uid(42302), uid(42303)),
        '22023',
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from public.guild_missions where id=$1',
            [uid(42302)],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await q(
    "insert into public.guild_missions(id,guild_id,created_by_traveler_id,title,description,mission_type,completion_mode,requires_leader_approval,reward_tier,status,published_at,community_protocol,metadata) values($1,$2,$3,'ECONOMY-041 disposable fixture','Synthetic mission validation','practical_activity','leader_approval',true,'normal','published',clock_timestamp(),1,'{\"economy041\":{\"contract\":\"economy041-chest-v1\",\"tier\":\"normal\"}}')",
    [mission, guild, tid(1)],
  );
  await q(
    "insert into guild_activity_private.details(mission_id,kind,category,theme,meeting_type,responsible_id,future_category) values($1,'activity','practical','','in_person',$2,'none')",
    [mission, tid(1)],
  );
  await q(
    "insert into public.guild_mission_progress(mission_id,traveler_id,status,submission_revision,approved_by_traveler_id,approved_at,participant_uid,community_revision) values($1,$2,'approved',1,$3,clock_timestamp(),$4,2)",
    [mission, actor, tid(1), owner],
  );
  await q(
    "insert into public.guild_mission_attempts(id,mission_id,traveler_id,revision,request_id,note,decision,reviewer_traveler_id,decided_at,decision_request_id) values($1,$2,$3,1,$4,'Real evidence field in synthetic fixture','approved',$5,clock_timestamp(),$6)",
    [attempt, mission, actor, uid(42002), tid(1), uid(42003)],
  );
  await q(
    "insert into guild_activity_private.validation_history(request_id,mission_id,traveler_id,reviewer_id,before_status,after_status,reason,revision) values($1,$2,$3,$4,'pending_approval','approved','',2)",
    [uid(42003), mission, actor, tid(1)],
  );
  await q(
    "insert into guild_activity_private.future_eligibility(mission_id,owner_id,traveler_id,category,participation_revision,validated) values($1,$2,$3,'none',2,true)",
    [mission, owner, actor],
  );
  await check(
    'mission must have current independent approval; missing or revoked proof never grants',
    async () => {
      await q(
        'update public.guild_mission_attempts set reviewer_traveler_id=$1 where id=$2',
        [actor, attempt],
      );
      const before = await state();
      await denied(() => call('mission', mission), '42501');
      assert.deepEqual(await state(), before);
      await q(
        'update public.guild_mission_attempts set reviewer_traveler_id=$1 where id=$2',
        [tid(1), attempt],
      );
    },
  );
  await check(
    'a verified approved mission awards exactly its approved coins/chest and zero XP; replay is stable',
    async () => {
      const before = await state(),
        result = await call('mission', mission);
      assert.equal(result.coins, 25);
      assert.equal(result.chestType, 'common');
      assert.equal(
        (await call('mission', mission)).receiptId,
        result.receiptId,
      );
      const after = await state();
      assert.equal(after.wallet.coins, before.wallet.coins + 25);
      assert.deepEqual(after.xp, before.xp);
      assert.deepEqual(after.inventory, before.inventory);
      assert.equal(
        (
          await q(
            'select xp_awarded from public.guild_reward_claims where mission_id=$1',
            [mission],
          )
        ).rows[0].xp_awarded,
        0,
      );
    },
  );
  await check(
    'an approved mission chest opens once, while cancellation preserves the unopened source',
    async () => {
      const open = async () => {
        try {
          await q('BEGIN;SET LOCAL ROLE authenticated');
          await q(
            "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
            [
              owner,
              JSON.stringify({
                sub: owner,
                session_id: uid(5002),
                is_anonymous: false,
              }),
            ],
          );
          const r = await q("select public.open_shop_chest($1,'common',$2) x", [
            actor,
            uid(42500),
          ]);
          await q('COMMIT');
          return r.rows[0].x;
        } catch (e) {
          await q('ROLLBACK');
          throw e;
        }
      };
      await q(
        "update public.guild_missions set status='cancelled' where id=$1",
        [mission],
      );
      const before = await state();
      await denied(open, '42501');
      assert.deepEqual(await state(), before);
      await q(
        "update public.guild_missions set status='published' where id=$1",
        [mission],
      );
      const result = await open();
      assert.equal(result.catalogVersion, 'economy041-chest-v1');
      assert.match(result.source, /^economy041:mission:/);
      assert.equal((await open()).duplicate, true);
    },
  );
  await check(
    'world progress needs published definitions and all private server/video proofs',
    async () => {
      const before = await state();
      await denied(() => call('world', 'origins'), '55000');
      assert.deepEqual(await state(), before);
      // Model future approved content only inside this disposable database. This is not hosted/video acceptance.
      await q(
        "update public.story_definitions set content_ready=true,video_ready=true,reward_ready=true where world_id='origins'",
      );
      for (const [i, d] of (
        await q(
          "select * from public.story_definitions where world_id='origins' order by narrative_order",
        )
      ).rows.entries()) {
        const id = uid(42100 + i);
        await q(
          "insert into public.chest_operations(id,traveler_id,account_id,operation_key,operation_type,chest_type,source,rewards) values($1,$2,$3,$4,'grant','common','synthetic-story-stage','{\"coins\":0}')",
          [id, actor, owner, 'synthetic-stage:' + d.id],
        );
        for (const step of [
          'explore',
          'reading',
          'activity',
          'quiz',
          'reflection',
          'video',
          'reward',
        ])
          await q(
            'insert into story_private.step_receipts(traveler_id,story_id,revision,step,source,proof_reference,observed_seconds,duration_seconds) values($1,$2,$3,$4,$5,$6,$7,$8)',
            [
              actor,
              d.id,
              d.revision,
              step,
              step === 'video'
                ? 'browser-events'
                : step === 'reward'
                  ? 'economic-ledger'
                  : 'server-activity',
              step === 'reward'
                ? id
                : 'synthetic-verified:' + d.id + ':' + step,
              step === 'video' ? 60 : null,
              step === 'video' ? 60 : null,
            ],
          );
        await q(
          'update public.story_progress set completed_at=clock_timestamp() where traveler_id=$1 and story_id=$2',
          [actor, d.id],
        );
      }
      const prepared = await state();
      await denied(() => call('world', 'origins'), '55000');
      assert.deepEqual(await state(), prepared);
    },
  );
  await check(
    'provider-verified world completion pays once without Guild leader approval, XP change or repeated credits',
    async () => {
      await q(
        'update public.story_progress set completed_at=null where traveler_id=$1',
        [actor],
      );
      await q(
        "update story_private.step_receipts set source='provider-api' where traveler_id=$1 and step='video'",
        [actor],
      );
      await q(
        'update public.story_progress set completed_at=clock_timestamp() where traveler_id=$1',
        [actor],
      );
      await q('delete from public.guild_members where traveler_id=$1', [actor]);
      const before = await state(),
        result = await call('world', 'origins');
      assert.equal(result.coins, 30);
      assert.equal(result.chestType, 'common');
      assert.equal(
        (await call('world', 'origins')).receiptId,
        result.receiptId,
      );
      const after = await state();
      assert.equal(after.wallet.coins, before.wallet.coins + 30);
      assert.deepEqual(after.xp, before.xp);
      assert.deepEqual(after.inventory, before.inventory);
    },
  );
  await check(
    'a paid 041 chest opens independently while an old unavailable community source stays intact',
    async () => {
      const id = uid(42400);
      await q(
        "update public.traveler_chests set quantity=quantity+1,sources='[\"community001c:validator-unavailable-fixture\"]'::jsonb||sources where traveler_id=$1 and chest_type='common'",
        [actor],
      );
      const prior = (
        await q(
          "select sources from public.traveler_chests where traveler_id=$1 and chest_type='common'",
          [actor],
        )
      ).rows[0].sources;
      const command = async (sql, args) => {
        try {
          await q('BEGIN;SET LOCAL ROLE authenticated');
          await q(
            "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
            [
              owner,
              JSON.stringify({
                sub: owner,
                session_id: uid(5002),
                is_anonymous: false,
              }),
            ],
          );
          const r = await q(sql, args);
          await q('COMMIT');
          return r.rows[0].x;
        } catch (e) {
          await q('ROLLBACK');
          throw e;
        }
      };
      await command(
        "select public.purchase_expansion_chest($1,'chest','common',$2) x",
        [actor, id],
      );
      const result = await command(
        "select public.open_shop_chest($1,'common',$2) x",
        [actor, id],
      );
      assert.equal(result.source, 'economy041:' + id);
      assert.deepEqual(
        (
          await q(
            "select sources from public.traveler_chests where traveler_id=$1 and chest_type='common'",
            [actor],
          )
        ).rows[0].sources,
        prior,
      );
    },
  );
}
