import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const name = `rpg0082-guild-${process.pid}`;
const prefix = [
  '-d',
  'RPG-0078-Restore',
  '-u',
  'root',
  '--',
  '/usr/sbin/podman',
  '--storage-driver',
  'overlay',
  '--cgroup-manager',
  'cgroupfs',
];
const run = (args, input) =>
  execFileSync('wsl.exe', [...prefix, ...args], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000,
  });
const psql = [
  'exec',
  '-i',
  name,
  'psql',
  '-X',
  '-q',
  '-h',
  '/tmp',
  '-U',
  'postgres',
  '-d',
  'postgres',
  '-v',
  'ON_ERROR_STOP=1',
  '-At',
];
const query = (sql) => run(psql, sql).trim();
const id = (prefix, n) =>
  `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const user = (n) => id('0', n);
const actor = (n) => id('1', n);
const mission = (n) => id('3', n);
const request = (n) => id('4', n);
const session = (n, sql) =>
  `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${user(n)}';${sql};COMMIT;`;
const as = (n, sql) => query(session(n, sql));
const denied = (n, sql, pattern) => assert.throws(() => as(n, sql), pattern);
function parallel(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('wsl.exe', [...prefix, ...psql], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '',
      err = '';
    child.stdout.on('data', (v) => {
      out += v;
    });
    child.stderr.on('data', (v) => {
      err += v;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(err)),
    );
    child.stdin.end(sql);
  });
}
const data = (extra = {}) => ({
  ...{
    title: 'Missao sintetica',
    description: 'Somente banco descartavel',
    objective: 'Registrar participacao',
    instructions: 'Concluir a atividade de teste',
    evidenceCriterion: 'Informar conclusao objetiva',
    bibleReference: '',
    startsAt: '',
    dueAt: '',
    kind: 'mission',
    rewardTier: 'normal',
    audience: 'all',
    targetIds: [],
  },
  ...extra,
});
const save = (n, m, revision, payload = data()) =>
  `SELECT public.save_guild_mission_v2('${actor(n)}','${mission(m)}',${revision},'${JSON.stringify(payload)}'::jsonb)`;
const transition = (n, m, revision, action) =>
  `SELECT public.transition_guild_mission_v2('${actor(n)}','${mission(m)}',${revision},'${action}')`;
const act = (n, m, action, key, attempt = 0, note = 'Comprovacao sintetica') =>
  `SELECT public.act_guild_mission_v2('${actor(n)}','${mission(m)}','${action}','${note}','${request(key)}',${attempt})`;
const attempt = (m, n) =>
  query(
    `SELECT id FROM public.guild_mission_attempts WHERE mission_id='${mission(m)}' AND traveler_id='${actor(n)}' ORDER BY revision DESC LIMIT 1`,
  );
const review = (n, a, revision, decision, key, reason = '') =>
  `SELECT public.review_guild_mission_v2('${actor(n)}','${a}',${revision},'${decision}','${reason}','${request(key)}')`;
let created = false;
after(() => {
  if (!created) return;
  const c = JSON.parse(run(['inspect', name]))[0];
  assert.equal(c.Config.Labels.task, 'TASK-0082');
  assert.equal(c.HostConfig.NetworkMode, 'none');
  run(['stop', '--time', '5', name]);
});
test('Guild panel against complete existing baseline: permissions, evidence, approvals and idempotency', async (t) => {
  run([
    'run',
    '-d',
    '--rm',
    '--name',
    name,
    '--label',
    'task=TASK-0082',
    '--network',
    'none',
    '--read-only',
    '--user',
    '100:101',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--tmpfs',
    '/tmp:rw,nosuid,nodev,size=256m,mode=1777',
    '--entrypoint',
    '/bin/sh',
    'docker.io/supabase/postgres:17.6.1.166',
    '-c',
    "initdb -D /tmp/db -U postgres --auth=trust >/tmp/init.log && exec postgres -D /tmp/db -h '' -k /tmp -c wal_level=logical",
  ]);
  created = true;
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      run(['exec', name, 'pg_isready', '-h', '/tmp', '-U', 'postgres']);
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  assert.ok(ready);
  const c = JSON.parse(run(['inspect', name]))[0];
  assert.equal(c.HostConfig.ReadonlyRootfs, true);
  assert.equal(Object.keys(c.HostConfig.PortBindings ?? {}).length, 0);
  assert.equal(c.Mounts.filter((m) => m.Type === 'bind').length, 0);
  const journal = JSON.parse(
    readFileSync('packages/database/migrations/meta/_journal.json', 'utf8'),
  );
  const baseline = journal.entries
    .map((e) =>
      readFileSync(`packages/database/migrations/${e.tag}.sql`, 'utf8'),
    )
    .concat(
      readFileSync(
        'packages/database/migrations/20261019054314_guild_link_invites.sql',
        'utf8',
      ),
    )
    .join('\n');
  query(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;
 CREATE SCHEMA auth;CREATE SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon,authenticated,service_role;
 CREATE PUBLICATION supabase_realtime;
 ${baseline}`);
  for (const n of [1, 2, 3, 4, 6, 7]) {
    query(`INSERT INTO auth.users VALUES('${user(n)}',${n === 6});`);
    as(
      n,
      `INSERT INTO public.profiles(id,display_name) VALUES(auth.uid(),'Fixture');SELECT public.create_traveler('${actor(n)}','Viajante ${String.fromCharCode(64 + n)}','male','medio','curto','castanho','musgo')`,
    );
  }
  as(
    1,
    `SELECT public.create_traveler('${actor(5)}','Outro Avatar','female','medio','curto','castanho','musgo')`,
  );
  as(1, `SELECT public.create_guild('${actor(1)}','Guilda Alfa',NULL)`);
  as(3, `SELECT public.create_guild('${actor(3)}','Guilda Beta',NULL)`);
  const guildA = query(
    `SELECT guild_id FROM public.guild_members WHERE traveler_id='${actor(1)}'`,
  );
  const guildB = query(
    `SELECT guild_id FROM public.guild_members WHERE traveler_id='${actor(3)}'`,
  );
  for (const n of [2, 5, 6])
    query(
      `INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${guildA}','${actor(n)}','member','active')`,
    );
  query(`INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${guildB}','${actor(4)}','member','active');
 INSERT INTO public.guild_missions(id,guild_id,created_by_traveler_id,title,mission_type,completion_mode,requires_leader_approval,reward_tier,status) VALUES('${mission(9)}','${guildA}','${actor(1)}','Legado pendente','practical_activity','leader_approval',true,'normal','published');
 INSERT INTO public.guild_mission_progress(mission_id,traveler_id,status) VALUES('${mission(9)}','${actor(2)}','pending_approval');
 ${readFileSync('packages/database/proposals/task0082-guild-missions.sql', 'utf8')}`);
  const balance = query(
    'SELECT jsonb_agg(to_jsonb(w) ORDER BY traveler_id)::text FROM public.wallets w',
  );
  const xp = query(
    'SELECT jsonb_agg(jsonb_build_array(id,xp,level) ORDER BY id)::text FROM public.travelers',
  );
  await t.test(
    'leader creates/edits a draft idempotently; member and other guild cannot',
    () => {
      assert.equal(as(1, save(1, 1, 0)), mission(1));
      assert.equal(as(1, save(1, 1, 0)), mission(1));
      denied(
        1,
        save(1, 1, 0, data({ title: 'Alteracao com mesma chave' })),
        /conflict/,
      );
      denied(2, save(2, 2, 0), /access denied/);
      denied(3, save(3, 1, 1), /access denied/);
      assert.equal(
        as(1, save(1, 1, 1, data({ title: 'Missao revisada' }))),
        mission(1),
      );
      denied(1, save(1, 1, 1), /Stale draft/);
      assert.equal(as(2, 'SELECT count(*) FROM public.guild_missions'), '1'); // only imported published mission
    },
  );
  await t.test(
    'structured fields, dates, audience and tier are validated server-side',
    () => {
      denied(
        1,
        `SELECT public.transition_guild_mission_v2('${actor(1)}','${mission(1)}',NULL,'publish')`,
        /Invalid mission revision/,
      );
      denied(
        1,
        save(1, 2, 0, data({ rewardTier: 'unlimited' })),
        /Invalid mission/,
      );
      denied(1, save(1, 2, 0, data({ objective: ' ' })), /Invalid mission/);
      denied(
        1,
        save(1, 2, 0, data({ audience: 'selected', targetIds: [actor(4)] })),
        /outside guild/,
      );
      denied(
        1,
        save(1, 2, 0, data({ audience: 'selected' })),
        /Invalid mission/,
      );
      denied(
        1,
        save(
          1,
          2,
          0,
          data({
            startsAt: '2030-10-21T12:00:00Z',
            dueAt: '2030-10-20T12:00:00Z',
          }),
        ),
        /Invalid mission/,
      );
      denied(1, save(1, 2, 0, { ...data(), xp: 999 }), /Unexpected/);
    },
  );
  await t.test(
    'publication makes mission visible only to eligible guild members',
    () => {
      as(1, transition(1, 1, 2, 'publish'));
      assert.equal(
        as(
          2,
          `SELECT count(*) FROM public.guild_missions WHERE id='${mission(1)}'`,
        ),
        '1',
      );
      assert.equal(
        as(
          4,
          `SELECT count(*) FROM public.guild_missions WHERE id='${mission(1)}'`,
        ),
        '0',
      );
      as(
        1,
        save(
          1,
          2,
          0,
          data({
            kind: 'special',
            audience: 'selected',
            targetIds: [actor(2)],
          }),
        ),
      );
      as(1, transition(1, 2, 1, 'publish'));
      assert.equal(
        as(
          6,
          `SELECT count(*) FROM public.guild_missions WHERE id='${mission(2)}'`,
        ),
        '0',
      );
      denied(1, act(5, 2, 'start', 10), /Not eligible/); // same account, wrong targeted avatar
      const snapshot = JSON.parse(
        as(1, `SELECT public.guild_mission_workspace('${actor(5)}',0)`),
      );
      assert.equal(
        snapshot.missions.some((m) => m.id === mission(2)),
        false,
      );
    },
  );
  await t.test(
    'direct writes and previous payout/bypass APIs denied; anonymous Auth blocked',
    () => {
      denied(
        2,
        `UPDATE public.guild_missions SET status='published'`,
        /permission denied/,
      );
      denied(
        2,
        `INSERT INTO public.guild_mission_progress(mission_id,traveler_id) VALUES('${mission(1)}','${actor(2)}')`,
        /permission denied/,
      );
      denied(
        1,
        `DELETE FROM public.guild_mission_attempts`,
        /permission denied/,
      );
      denied(
        1,
        `INSERT INTO public.guild_activity_log(guild_id,event_type) VALUES('${guildA}','fake')`,
        /permission denied/,
      );
      denied(
        1,
        `SELECT public.review_guild_mission('${mission(1)}','${actor(2)}','${actor(1)}',true)`,
        /permission denied/,
      );
      denied(
        1,
        `SELECT public.submit_guild_mission('${mission(1)}','${actor(2)}','fake')`,
        /permission denied/,
      );
      denied(
        6,
        `SELECT public.guild_mission_workspace('${actor(6)}',0)`,
        /access denied/,
      );
    },
  );
  await t.test(
    'concurrent duplicate submission creates exactly one immutable attempt',
    async () => {
      denied(2, act(2, 1, 'submit', 20), /unavailable/);
      as(2, act(2, 1, 'start', 21));
      denied(2, act(2, 1, 'submit', 20, 0, ''), /missing/);
      const result = await Promise.all([
        parallel(session(2, act(2, 1, 'submit', 20))),
        parallel(session(2, act(2, 1, 'submit', 20))),
      ]);
      assert.deepEqual(result, ['pending_approval', 'pending_approval']);
      assert.equal(
        query(
          `SELECT count(*) FROM public.guild_mission_attempts WHERE mission_id='${mission(1)}'`,
        ),
        '1',
      );
      denied(2, act(2, 1, 'submit', 20, 0, 'Troca de prova'), /key reused/);
    },
  );
  await t.test(
    'proof isolation, nonleader rejection and account-level self-review prevention',
    () => {
      assert.equal(
        as(4, 'SELECT count(*) FROM public.guild_mission_attempts'),
        '0',
      );
      const a = attempt(1, 2);
      denied(2, review(2, a, 1, 'approved', 22), /access denied/);
      denied(3, review(3, a, 1, 'approved', 22), /access denied/);
      as(1, act(5, 1, 'start', 23));
      as(1, act(5, 1, 'submit', 24));
      denied(1, review(1, attempt(1, 5), 1, 'approved', 25), /Self review/);
    },
  );
  await t.test(
    'correction/rejection need reason and resubmission preserves every attempt',
    () => {
      const a = attempt(1, 2);
      denied(1, review(1, a, 1, 'rejected', 26), /reason/);
      denied(1, review(1, a, 1, 'changes_requested', 26), /reason/);
      assert.equal(
        as(
          1,
          review(
            1,
            a,
            1,
            'changes_requested',
            26,
            'Informe o registro objetivo',
          ),
        ),
        'changes_requested',
      );
      as(2, act(2, 1, 'start', 27, 1));
      as(2, act(2, 1, 'submit', 28, 1, 'Prova corrigida'));
      assert.equal(
        query(
          `SELECT count(*) FROM public.guild_mission_attempts WHERE mission_id='${mission(1)}' AND traveler_id='${actor(2)}'`,
        ),
        '2',
      );
      denied(1, review(1, a, 1, 'approved', 29), /already reviewed/);
      assert.equal(
        as(
          1,
          review(
            1,
            attempt(1, 2),
            2,
            'rejected',
            29,
            'Atividade ainda nao cumprida',
          ),
        ),
        'rejected',
      );
      as(2, act(2, 1, 'start', 30, 2));
      as(2, act(2, 1, 'submit', 31, 2, 'Terceira tentativa objetiva'));
    },
  );
  await t.test(
    'concurrent approval is idempotent, leaves reward pending and cannot reverse decision',
    async () => {
      const a = attempt(1, 2);
      const call = session(1, review(1, a, 3, 'approved', 32));
      assert.deepEqual(await Promise.all([parallel(call), parallel(call)]), [
        'approved',
        'approved',
      ]);
      denied(
        1,
        review(1, a, 3, 'rejected', 33, 'Mudar decisao'),
        /already reviewed/,
      );
      assert.equal(
        query(
          `SELECT status||':'||(reward_claimed_at IS NULL) FROM public.guild_mission_progress WHERE mission_id='${mission(1)}' AND traveler_id='${actor(2)}'`,
        ),
        'approved:true',
      );
      assert.equal(
        query('SELECT count(*) FROM public.guild_reward_claims'),
        '0',
      );
      assert.equal(
        query(
          'SELECT jsonb_agg(to_jsonb(w) ORDER BY traveler_id)::text FROM public.wallets w',
        ),
        balance,
      );
      assert.equal(
        query(
          'SELECT jsonb_agg(jsonb_build_array(id,xp,level) ORDER BY id)::text FROM public.travelers',
        ),
        xp,
      );
    },
  );
  await t.test(
    'legacy pending evidence is preserved; missing proof cannot be approved',
    () => {
      const a = attempt(9, 2);
      assert.ok(a);
      denied(1, review(1, a, 1, 'approved', 34), /Evidence missing/);
      assert.equal(
        as(
          1,
          review(
            1,
            a,
            1,
            'changes_requested',
            35,
            'Envie a comprovacao objetiva',
          ),
        ),
        'changes_requested',
      );
    },
  );
  await t.test(
    'cancellation/deadlines prevent new submissions; close still permits already-submitted review',
    () => {
      as(2, act(2, 2, 'start', 36));
      as(2, act(2, 2, 'submit', 37));
      as(1, transition(1, 2, 2, 'close'));
      assert.equal(
        as(1, review(1, attempt(2, 2), 1, 'approved', 38)),
        'approved',
      );
      denied(2, act(2, 2, 'start', 39), /not available/);
      as(1, save(1, 3, 0));
      as(1, transition(1, 3, 1, 'publish'));
      as(2, act(2, 3, 'start', 40));
      as(2, act(2, 3, 'submit', 41));
      as(1, transition(1, 3, 2, 'cancel'));
      denied(
        1,
        review(1, attempt(3, 2), 1, 'approved', 42),
        /Stale submission/,
      );
      as(1, save(1, 4, 0, data({ dueAt: '2000-01-01T00:00:00Z' })));
      denied(1, transition(1, 4, 1, 'publish'), /before publication/);
    },
  );
  await t.test(
    'audit contains actor/time/result but never private proof; other guild snapshot is isolated',
    () => {
      const snapshot = JSON.parse(
        as(1, `SELECT public.guild_mission_workspace('${actor(1)}',0)`),
      );
      assert.ok(
        snapshot.history.some(
          (h) =>
            h.event_type === 'mission_decision' &&
            h.actor_traveler_id === actor(1),
        ),
      );
      assert.ok(
        snapshot.attempts.some(
          (a) =>
            a.decision === 'approved' &&
            a.decided_at &&
            a.reviewer_traveler_id === actor(1),
        ),
      );
      assert.equal(
        JSON.stringify(snapshot.history).includes(
          'Terceira tentativa objetiva',
        ),
        false,
      );
      assert.equal(
        JSON.parse(
          as(3, `SELECT public.guild_mission_workspace('${actor(3)}',0)`),
        ).missions.length,
        0,
      );
    },
  );
  await t.test(
    'existing QR invitation/request/member approval survives mission cutover',
    () => {
      const invite = JSON.parse(
        as(1, `SELECT public.create_guild_link_invite('${actor(1)}')`),
      );
      assert.match(invite.token, /^[a-f0-9]{64}$/);
      const join = as(
        7,
        `SELECT public.request_guild_link_invite('${invite.token}','${actor(7)}')`,
      );
      assert.equal(
        query(
          `SELECT count(*) FROM public.guild_members WHERE traveler_id='${actor(7)}' AND status='active'`,
        ),
        '0',
      );
      as(
        1,
        `SELECT public.review_guild_join_request('${join}','${actor(1)}',true)`,
      );
      assert.equal(
        query(
          `SELECT count(*) FROM public.guild_members WHERE traveler_id='${actor(7)}' AND status='active'`,
        ),
        '1',
      );
      as(
        1,
        `SELECT public.revoke_guild_link_invite('${invite.id}','${actor(1)}')`,
      );
    },
  );
});
