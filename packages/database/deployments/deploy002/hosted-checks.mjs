// SQL-role fixture, not Auth registration or JWT verification. All rows rollback.
export function hostedChecksSql() {
  const uid = (n) => `d0020000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const tid = (n) => `d0021000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const id = (n) => `d0022000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
  const json = (v) => quote(JSON.stringify(v)) + '::jsonb';
  const perform = (expr) => `DO $p$ BEGIN PERFORM ${expr}; END $p$;`;
  let checks = 0;
  const assert = (condition, label) => {
    checks++;
    return `DO $a$ BEGIN IF NOT (${condition}) THEN RAISE EXCEPTION ${quote('DEPLOY002 assertion: ' + label)}; END IF; END $a$;`;
  };
  const denied = (
    sql,
    label,
    pattern = 'denied|permission|owned|required|unavailable|pending',
  ) => {
    checks++;
    return `DO $n$ DECLARE rejected boolean:=false; BEGIN BEGIN EXECUTE ${quote(sql)}; EXCEPTION WHEN OTHERS THEN IF SQLERRM ~* ${quote(pattern)} THEN rejected:=true; ELSE RAISE; END IF; END; IF NOT rejected THEN RAISE EXCEPTION ${quote('DEPLOY002 expected denial: ' + label)}; END IF; END $n$;`;
  };
  const as = (n, sql) =>
    `SET LOCAL ROLE authenticated;${perform(`set_config('request.jwt.claim.sub','${uid(n)}',true)`)}${perform(`set_config('request.jwt.claims',${quote(JSON.stringify({ sub: uid(n), role: 'authenticated', is_anonymous: false }))},true)`)}${sql}RESET ROLE;`;
  const guildA = "current_setting('deploy002.guild_a')::uuid";
  const token = "current_setting('deploy002.invite')";
  const out = [
    'BEGIN;',
    assert(
      `NOT EXISTS(SELECT 1 FROM auth.users WHERE id IN (${[1, 2, 3, 4, 5].map((n) => quote(uid(n))).join(',')}))`,
      'fixture IDs unused',
    ),
  ];
  for (let n = 1; n <= 5; n++) {
    out.push(
      `INSERT INTO auth.users(id,is_anonymous) VALUES('${uid(n)}',false);`,
    );
    out.push(
      as(
        n,
        `INSERT INTO public.profiles(id,display_name) VALUES(auth.uid(),'DEPLOY002 synthetic');${perform(`public.create_traveler('${tid(n)}','Synthetic ${String.fromCharCode(64 + n)}','male','medio','curto','castanho','musgo')`)}`,
      ),
    );
  }
  out.push(
    as(
      1,
      assert(
        `(SELECT count(*) FROM public.travelers WHERE id='${tid(1)}')=1`,
        'own Traveler visible',
      ) +
        assert(
          `(SELECT count(*) FROM public.travelers WHERE id='${tid(2)}')=0`,
          'other Traveler hidden',
        ),
    ),
  );
  out.push(
    as(
      2,
      perform(
        `set_config('deploy002.guild_a',public.create_guild('${tid(2)}','DEPLOY002 synthetic A',NULL)::text,true)`,
      ) +
        perform(
          `set_config('deploy002.invite',public.create_guild_link_invite('${tid(2)}')->>'token',true)`,
        ),
    ),
  );
  out.push(
    as(
      5,
      perform(`public.create_guild('${tid(5)}','DEPLOY002 synthetic B',NULL)`),
    ),
  );
  out.push(
    `SET LOCAL ROLE anon;${assert(`jsonb_typeof(public.preview_guild_link_invite(${token}))='object'`, 'anonymous limited invite preview')}RESET ROLE;`,
  );
  out.push(
    as(
      3,
      perform(
        `set_config('deploy002.request3',public.request_guild_link_invite(${token},'${tid(3)}')::text,true)`,
      ),
    ),
  );
  out.push(
    assert(
      `NOT EXISTS(SELECT 1 FROM public.guild_members WHERE traveler_id='${tid(3)}' AND status='active')`,
      'invite does not auto-join',
    ),
  );
  out.push(
    as(
      2,
      perform(
        `public.review_guild_join_request(current_setting('deploy002.request3')::uuid,'${tid(2)}',true)`,
      ),
    ),
  );
  out.push(
    as(
      4,
      perform(
        `set_config('deploy002.request4',public.request_join_guild(${guildA},'${tid(4)}')::text,true)`,
      ),
    ),
  );
  out.push(
    as(
      2,
      perform(
        `public.review_guild_join_request(current_setting('deploy002.request4')::uuid,'${tid(2)}',true)`,
      ),
    ),
  );
  out.push(
    as(
      5,
      assert(
        `(SELECT count(*) FROM public.guild_members WHERE guild_id=${guildA})=0`,
        'cross-Guild RLS',
      ) +
        denied(
          `SELECT public.guild_public_member_profile('${tid(5)}','${tid(4)}')`,
          'cross-Guild profile',
        ),
    ),
  );
  out.push(
    as(
      4,
      denied(
        `SELECT public.create_guild_link_invite('${tid(2)}')`,
        'forged leader invite',
      ) +
        denied(
          'SELECT * FROM guild_invite_private.link_invites',
          'private token table',
        ),
    ),
  );
  const mission = {
    title: 'DEPLOY002 synthetic mission',
    description: 'Transient SQL-role validation',
    objective: 'Verify permissions',
    instructions: 'Synthetic proof',
    evidenceCriterion: 'Synthetic text',
    bibleReference: '',
    startsAt: '',
    dueAt: '',
    kind: 'mission',
    rewardTier: 'normal',
    audience: 'all',
    targetIds: [],
  };
  out.push(
    as(
      2,
      perform(
        `public.save_guild_mission_v2('${tid(2)}','${id(1)}',0,${json(mission)})`,
      ) +
        perform(
          `public.transition_guild_mission_v2('${tid(2)}','${id(1)}',1,'publish')`,
        ),
    ),
  );
  out.push(
    as(
      4,
      perform(
        `public.act_guild_mission_v2('${tid(4)}','${id(1)}','start','','${id(2)}',0)`,
      ) +
        perform(
          `public.act_guild_mission_v2('${tid(4)}','${id(1)}','submit','DEPLOY002 synthetic proof','${id(3)}',0)`,
        ),
    ),
  );
  out.push(
    perform(
      `set_config('deploy002.attempt',(SELECT id::text FROM public.guild_mission_attempts WHERE mission_id='${id(1)}'),true)`,
    ),
  );
  out.push(
    as(
      4,
      denied(
        `SELECT public.review_guild_mission_v2('${tid(4)}',current_setting('deploy002.attempt')::uuid,1,'approved','','${id(4)}')`,
        'self approval',
      ),
    ),
  );
  const review = `public.review_guild_mission_v2('${tid(2)}',current_setting('deploy002.attempt')::uuid,1,'approved','','${id(4)}')`;
  out.push(as(2, perform(review) + perform(review)));
  out.push(
    assert(
      `EXISTS(SELECT 1 FROM public.guild_mission_progress WHERE mission_id='${id(1)}' AND status='approved' AND reward_claimed_at IS NULL)`,
      'approval pending without credit',
    ),
  );
  out.push(
    as(
      4,
      denied(
        `SELECT public.guild_ebd_command('${tid(4)}','teacher','${tid(4)}',0,'{"active":true,"publish":true,"attend":true}')`,
        'student cannot self-authorize teacher',
      ),
    ),
  );
  out.push(
    as(
      2,
      perform(
        `public.guild_ebd_command('${tid(2)}','teacher','${tid(3)}',0,'{"active":true,"publish":true,"attend":true}')`,
      ),
    ),
  );
  const lesson = {
    title: 'DEPLOY002 synthetic lesson',
    theme: 'Permissions fixture',
    description: '',
    content: 'Transient SQL integration fixture; not educational content.',
    reference: '',
    scheduledAt: '2026-10-21T12:00:00Z',
    teacherId: tid(3),
    audience: 'all',
    targetIds: [],
    materials: [],
    objectives: 'Verify isolation',
    rewardTier: 'normal',
  };
  const activity = {
    lessonId: id(5),
    title: 'DEPLOY002 synthetic activity',
    kind: 'choice',
    prompt: 'Select first synthetic option',
    options: ['First', 'Second'],
    answerKey: 0,
    attemptLimit: 2,
    deadline: '',
    criterion: 'correct',
  };
  out.push(
    as(
      3,
      perform(
        `public.guild_ebd_command('${tid(3)}','lesson','${id(5)}',0,${json(lesson)})`,
      ) +
        perform(
          `public.guild_ebd_command('${tid(3)}','activity','${id(6)}',0,${json(activity)})`,
        ) +
        perform(
          `public.guild_ebd_command('${tid(3)}','state','${id(5)}',1,'{"state":"published"}')`,
        ),
    ),
  );
  out.push(
    as(
      4,
      perform(
        `public.guild_ebd_command('${tid(4)}','submit','${id(7)}',0,${json({ activityId: id(6), choice: 0, response: 'First synthetic option' })})`,
      ) +
        denied(
          'SELECT * FROM public.guild_ebd_teachers',
          'RPC-only teacher table',
        ) +
        denied(
          `SELECT public.guild_ebd_command('${tid(4)}','attendance','${id(5)}',0,${json({ travelerId: tid(4), status: 'present', reason: '' })})`,
          'student cannot mark attendance',
        ),
    ),
  );
  out.push(
    as(
      3,
      perform(
        `public.guild_ebd_command('${tid(3)}','attendance','${id(5)}',0,${json({ travelerId: tid(4), status: 'present', reason: '' })})`,
      ),
    ),
  );
  out.push(
    as(
      5,
      denied(
        `SELECT public.guild_ebd_command('${tid(5)}','attendance','${id(5)}',0,${json({ travelerId: tid(4), status: 'present', reason: '' })})`,
        'other Guild leader cannot mark attendance',
      ),
    ),
  );
  out.push(
    assert(
      `EXISTS(SELECT 1 FROM public.guild_ebd_attendance WHERE lesson_id='${id(5)}' AND traveler_id='${tid(4)}' AND status='present')`,
      'authorized attendance',
    ),
  );
  out.push(
    as(
      1,
      denied(
        `SELECT public.complete_story('${tid(1)}','creation')`,
        'individual Story without proof',
      ) +
        assert(
          `(SELECT count(*) FROM public.guild_members WHERE traveler_id='${tid(1)}')=0`,
          'Story actor needs no leader',
        ),
    ),
  );
  for (const [sql, label] of [
    [`UPDATE public.travelers SET xp=99999 WHERE id='${tid(1)}'`, 'XP'],
    [
      `UPDATE public.wallets SET coins=99999 WHERE traveler_id='${tid(1)}'`,
      'coins',
    ],
    [
      `INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES('${tid(1)}','fake-card',1)`,
      'inventory',
    ],
    [`SELECT public.add_coins('${tid(1)}',999)`, 'generic credit'],
    [`SELECT public.spend_coins('${tid(1)}',1)`, 'generic spend'],
    [
      `SELECT public.grant_traveler_chest('${tid(1)}','common','fake','fake')`,
      'arbitrary chest',
    ],
    [
      `SELECT public.claim_chest_reward('${tid(1)}','phase:garden-choice')`,
      'unproved phase',
    ],
    [
      `SELECT public.arena_authority_v3('${uid(1)}','${tid(1)}','commit','{"winnerId":"forged","coins":999}')`,
      'browser authority',
    ],
  ])
    out.push(as(1, denied(sql, label, 'permission denied')));
  out.push(
    `SET LOCAL ROLE anon;${denied('SELECT * FROM public.wallets', 'anonymous wallet', 'permission denied')}RESET ROLE;`,
  );
  out.push(
    `SET LOCAL ROLE service_role;${denied(`SELECT public.arena_authority_v3('${uid(1)}','${tid(1)}','starter','{}')`, 'unapproved starter', 'unavailable')}${denied(`SELECT public.add_coins('${tid(1)}',999)`, 'old gateway not available to service', 'permission denied')}RESET ROLE;`,
  );
  out.push(
    assert(
      `(SELECT count(*) FROM public.chest_operations WHERE traveler_id IN (${[1, 2, 3, 4, 5].map((n) => quote(tid(n))).join(',')}))=0`,
      'no economic receipt from approvals or presentation',
    ),
  );
  out.push(
    assert(
      `NOT EXISTS(SELECT 1 FROM public.wallets WHERE traveler_id IN (${[1, 2, 3, 4, 5].map((n) => quote(tid(n))).join(',')}) AND coins<>0)`,
      'no wallet change',
    ),
  );
  out.push(
    `SELECT jsonb_build_object('passed',true,'assertions',${checks},'syntheticRoles',5,'scope','hosted PostgreSQL ROLE/claim emulation; not Auth JWT','rolledBack',true) AS validation;ROLLBACK;`,
  );
  return out.join('\n');
}
