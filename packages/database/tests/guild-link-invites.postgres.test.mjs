import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Existing WSL runtime/image only. No real backup, network, port or host data mount.
const name = `rpg0080-invites-${process.pid}`;
const prefix = ['-d', 'RPG-0078-Restore', '-u', 'root', '--', '/usr/sbin/podman', '--storage-driver', 'overlay', '--cgroup-manager', 'cgroupfs'];
const run = (args, input) => execFileSync('wsl.exe', [...prefix, ...args], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 });
let created = false;
after(() => {
  if (!created) return;
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.Config.Labels.task, 'TASK-0080');
  assert.equal(info.HostConfig.NetworkMode, 'none');
  run(['stop', '--time', '5', name]); // --rm destroys only this synthetic tmpfs container.
});

test('real PostgreSQL: invite secrecy, permissions, expiry, revocation, pending requests and normal approval', async () => {
  run(['run', '-d', '--rm', '--name', name, '--label', 'task=TASK-0080', '--network', 'none', '--read-only',
    '--user', '100:101', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
    '--tmpfs', '/tmp:rw,nosuid,nodev,size=256m,mode=1777', '--entrypoint', '/bin/sh',
    'docker.io/supabase/postgres:17.6.1.166', '-c',
    "initdb -D /tmp/db -U postgres --auth=trust >/tmp/init.log && exec postgres -D /tmp/db -h '' -k /tmp"]);
  created = true;
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { run(['exec', name, 'pg_isready', '-h', '/tmp', '-U', 'postgres']); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 200)); }
  }
  assert.ok(ready, 'Synthetic PostgreSQL did not become ready');
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.HostConfig.ReadonlyRootfs, true);
  assert.equal(info.HostConfig.NetworkMode, 'none');
  assert.equal(Object.keys(info.HostConfig.PortBindings ?? {}).length, 0);
  assert.equal((info.Mounts ?? []).filter(m => m.Type === 'bind').length, 0);
  const original = readFileSync('packages/database/migrations/0001_guild_supabase_v1.sql', 'utf8');
  const extractFunction = name => {
    const start = original.indexOf(`CREATE FUNCTION public.${name}(`);
    assert.ok(start >= 0);
    return original.slice(start, original.indexOf('$$;', start) + 3);
  };
  const tables = ['guilds', 'guild_members', 'guild_join_requests'].map(table => {
    const start = original.indexOf(`CREATE TABLE public.${table} (`);
    return original.slice(start, original.indexOf(';--> statement-breakpoint', start) + 1);
  }).join('\n');
  const sql = `
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth; CREATE SCHEMA extensions;
CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
CREATE TABLE auth.users(id uuid PRIMARY KEY, is_anonymous boolean DEFAULT false);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE public.travelers(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id));
${tables}
CREATE UNIQUE INDEX guild_join_requests_one_pending_idx ON public.guild_join_requests(guild_id,traveler_id) WHERE status='pending';
${extractFunction('owns_traveler')}
${extractFunction('request_join_guild')}
${extractFunction('review_guild_join_request')}
INSERT INTO auth.users(id) SELECT ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(1,4) n;
UPDATE auth.users SET is_anonymous=true WHERE id='00000000-0000-4000-8000-000000000004';
INSERT INTO public.travelers SELECT ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,id FROM auth.users CROSS JOIN LATERAL (SELECT right(id::text,1)::int AS n) s;
INSERT INTO public.guilds(id,name,created_by_user_id,leader_traveler_id) VALUES
 ('20000000-0000-4000-8000-000000000001','Guilda A','00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000003','Guilda C','00000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003');
INSERT INTO public.guild_members(guild_id,traveler_id,role) VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','leader'),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','leader');
${readFileSync('packages/database/migrations/20261019054314_guild_link_invites.sql', 'utf8')}
CREATE TEMP TABLE proof(invite jsonb, request_id uuid);
GRANT ALL ON proof TO authenticated;
GRANT SELECT ON proof TO anon;
DO $t$ BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='guild_invite_private.link_invites'::regclass) THEN RAISE EXCEPTION 'RLS absent'; END IF;
 IF has_table_privilege('authenticated','guild_invite_private.link_invites','SELECT') OR has_table_privilege('authenticated','guild_invite_private.link_invites','INSERT') THEN RAISE EXCEPTION 'Table exposed'; END IF;
 IF has_function_privilege('anon','public.resolve_guild_link_invite(text)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous RPC exposed'; END IF;
 IF NOT has_function_privilege('anon','public.preview_guild_link_invite(text)','EXECUTE') THEN RAISE EXCEPTION 'Preview unavailable'; END IF;
 IF has_function_privilege('anon','public.request_guild_link_invite(text,uuid)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous mutation exposed'; END IF;
 IF has_table_privilege('anon','guild_invite_private.link_invites','SELECT') THEN RAISE EXCEPTION 'Anonymous table exposed'; END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='guild_invite_private' AND column_name IN ('token','raw_token')) THEN RAISE EXCEPTION 'Raw token column'; END IF;
END $t$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $t$ BEGIN
 BEGIN PERFORM public.create_guild_link_invite('10000000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Wrong user created invite'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM count(*) FROM guild_invite_private.link_invites; RAISE EXCEPTION 'Direct table read succeeded'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $t$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
INSERT INTO proof(invite) SELECT public.create_guild_link_invite('10000000-0000-4000-8000-000000000001');
DO $t$ DECLARE a jsonb; b jsonb; BEGIN
 SELECT invite INTO a FROM proof;
 b := public.create_guild_link_invite('10000000-0000-4000-8000-000000000001');
 IF a->>'token' !~ '^[a-f0-9]{64}$' OR a->>'token'=b->>'token' THEN RAISE EXCEPTION 'Token randomness/format'; END IF;
 IF public.list_guild_link_invites('10000000-0000-4000-8000-000000000001')::text LIKE '%'||(a->>'token')||'%' THEN RAISE EXCEPTION 'List leaked token'; END IF;
 FOR i IN 1..8 LOOP PERFORM public.create_guild_link_invite('10000000-0000-4000-8000-000000000001'); END LOOP;
 BEGIN PERFORM public.create_guild_link_invite('10000000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'No active invite limit'; EXCEPTION WHEN program_limit_exceeded THEN NULL; END;
END $t$;
RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub','',false);
DO $t$ DECLARE preview jsonb; BEGIN
 preview := public.preview_guild_link_invite((SELECT invite->>'token' FROM proof));
 IF preview->>'guild_name'<>'Guilda A' OR (SELECT count(*) FROM jsonb_object_keys(preview))<>2 OR NOT preview ? 'expires_at' THEN RAISE EXCEPTION 'Preview privacy failed'; END IF;
 BEGIN PERFORM public.preview_guild_link_invite('invalid'); RAISE EXCEPTION 'Invalid preview accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
 BEGIN PERFORM public.request_guild_link_invite((SELECT invite->>'token' FROM proof),'10000000-0000-4000-8000-000000000002'); RAISE EXCEPTION 'Anonymous membership request'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.create_guild_link_invite('10000000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Anonymous invite creation'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $t$;
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $t$ DECLARE a jsonb; resolved jsonb; r uuid; BEGIN
 SELECT invite INTO a FROM proof;
 resolved := public.resolve_guild_link_invite(a->>'token');
 IF resolved->>'guild_name'<>'Guilda A' OR resolved ? 'guild_id' THEN RAISE EXCEPTION 'Resolution exposes unexpected fields'; END IF;
 BEGIN PERFORM public.request_guild_link_invite(a->>'token','10000000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Traveler impersonation'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 r := public.request_guild_link_invite(a->>'token','10000000-0000-4000-8000-000000000002');
 UPDATE proof SET request_id=r;
 IF r<>public.request_guild_link_invite(a->>'token','10000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'Repeated request differs'; END IF;
 BEGIN PERFORM public.review_guild_join_request(r,'10000000-0000-4000-8000-000000000002',true); RAISE EXCEPTION 'Approval bypass'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $t$;
RESET ROLE;
DO $t$ BEGIN
 IF EXISTS(SELECT 1 FROM public.guild_members WHERE traveler_id='10000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'Invite activated membership'; END IF;
 IF (SELECT count(*) FROM public.guild_join_requests WHERE status='pending')<>1 THEN RAISE EXCEPTION 'Pending request absent/duplicated'; END IF;
 IF EXISTS(SELECT 1 FROM proof p JOIN guild_invite_private.link_invites i ON i.id=(p.invite->>'id')::uuid WHERE i.token_hash<>extensions.digest(p.invite->>'token','sha256') OR i.expires_at<>i.created_at+interval '7 days') THEN RAISE EXCEPTION 'Hash/expiry differ'; END IF;
END $t$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT public.review_guild_join_request(request_id,'10000000-0000-4000-8000-000000000001',true) FROM proof;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
DO $t$ BEGIN
 BEGIN PERFORM public.revoke_guild_link_invite((SELECT (invite->>'id')::uuid FROM proof),'10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'Cross-guild revocation'; EXCEPTION WHEN no_data_found THEN NULL; END;
END $t$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT public.revoke_guild_link_invite((invite->>'id')::uuid,'10000000-0000-4000-8000-000000000001') FROM proof;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $t$ BEGIN
 BEGIN PERFORM public.resolve_guild_link_invite((SELECT invite->>'token' FROM proof)); RAISE EXCEPTION 'Revoked invite accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
 BEGIN PERFORM public.preview_guild_link_invite((SELECT invite->>'token' FROM proof)); RAISE EXCEPTION 'Revoked preview accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
END $t$;
RESET ROLE;
UPDATE guild_invite_private.link_invites SET revoked_at=NULL, created_at=clock_timestamp()-interval '2 days', expires_at=clock_timestamp()-interval '1 day';
SET ROLE authenticated;
DO $t$ BEGIN
 BEGIN PERFORM public.resolve_guild_link_invite((SELECT invite->>'token' FROM proof)); RAISE EXCEPTION 'Expired invite accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
 BEGIN PERFORM public.preview_guild_link_invite((SELECT invite->>'token' FROM proof)); RAISE EXCEPTION 'Expired preview accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
END $t$;
RESET ROLE;
UPDATE guild_invite_private.link_invites SET created_at=clock_timestamp(), expires_at=clock_timestamp()+interval '6 days';
UPDATE public.guild_members SET status='removed' WHERE role='leader' AND guild_id='20000000-0000-4000-8000-000000000001';
SET ROLE authenticated;
DO $t$ BEGIN
 BEGIN PERFORM public.resolve_guild_link_invite((SELECT invite->>'token' FROM proof)); RAISE EXCEPTION 'Removed leader invite accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
END $t$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
DO $t$ BEGIN
 BEGIN PERFORM public.resolve_guild_link_invite((SELECT invite->>'token' FROM proof)); RAISE EXCEPTION 'Anonymous account accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $t$;
RESET ROLE;
DO $t$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.guild_members WHERE traveler_id='10000000-0000-4000-8000-000000000002' AND role='member' AND status='active') THEN RAISE EXCEPTION 'Normal approval did not activate membership'; END IF;
END $t$;
SELECT 'TASK-0080 PostgreSQL invariants PASS';
`;
  const output = run(['exec', '-i', name, 'psql', '-X', '-q', '-h', '/tmp', '-U', 'postgres', '-d', 'postgres', '--single-transaction', '-v', 'ON_ERROR_STOP=1', '-At'], sql);
  assert.match(output, /TASK-0080 PostgreSQL invariants PASS/);
});
