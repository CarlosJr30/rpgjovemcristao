-- 010A.2 production compatibility, final tested workspace/error semantics from first install.
-- Starts CONTAINED. A separately approved owner operation is required to activate writes.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $production_compatibility$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' OR public.economy_protocol_version()<>3
 OR (SELECT count(*) FROM supabase_migrations.schema_migrations)<>9
 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE name='rpg_dev_010a_governance_production')
 OR to_regclass('guild_admin_private.admin_grants') IS NULL
 OR to_regclass('guild_admin_private.multiguild_control') IS NOT NULL
 OR to_regclass('public.guild_members_one_active_guild_per_traveler_idx') IS NULL
 OR EXISTS(SELECT 1 FROM guild_admin_private.admin_grants)
 OR EXISTS(SELECT 1 FROM guild_admin_private.audit)
 OR EXISTS(SELECT 1 FROM guild_admin_private.leadership_invites)
 OR EXISTS(SELECT 1 FROM guild_admin_private.leader_authorizations)
 THEN RAISE EXCEPTION '010A.2 requires the empty reviewed production foundation';END IF;
END $production_compatibility$;
DO $baseline$ DECLARE f jsonb;BEGIN FOR f IN SELECT value FROM jsonb_array_elements($expected$[{"signature":"is_guild_leader(uuid)","md5":"608df78b6e184f5688c02f58a95e8cd0"},{"signature":"can_lead_mission(uuid)","md5":"77704241905569d0bece712ef9718db5"},{"signature":"guild_ops.actor(uuid,uuid,boolean)","md5":"0eec40ebf95e1af38f37dc0721baec30"},{"signature":"guild_ops.visible(uuid)","md5":"9d6b7933f614787ae50e837bf3b98105"},{"signature":"ebd_ops.manager(uuid,uuid,text)","md5":"5fab4701a42eec47165ada5bc7cac9fc"},{"signature":"guild_chat_private.actor(uuid,uuid)","md5":"fb90d0f5fdd1a0db953ff31d3d81edc5"},{"signature":"guild_chat_private.can_access(uuid,boolean)","md5":"07783955c56f4866f7654f56e8b71979"},{"signature":"ebd_ops.command(uuid,text,uuid,integer,jsonb)","md5":"b679670fd3fbb0fdc7f4b0209686beee"},{"signature":"ebd_ops.workspace(uuid,integer)","md5":"a6dc1fc6a18f93bba0e28fb1952cc73e"},{"signature":"guild_invite_private.leader_guild(uuid)","md5":"2ce883bff4adcac0ffe593d1899c5d34"},{"signature":"guild_invite_private.create_invite(uuid)","md5":"897b1822e17b90dae9ed8519ea196502"},{"signature":"guild_invite_private.list_invites(uuid)","md5":"7b9677b526325085d81fc8024bad22c5"},{"signature":"guild_invite_private.revoke_invite(uuid,uuid)","md5":"d302c30443070f2eff5b13ccbc3e9242"},{"signature":"guild_invite_private.valid_invite(text)","md5":"a207742c90374dbc473ed1cc858d6c93"},{"signature":"guild_invite_private.request_invite(text,uuid)","md5":"b07abe0020748f6e3b0980e417503af9"},{"signature":"create_guild(uuid,text,text)","md5":"a4e6dce55600d8b48874a1fe51454d32"},{"signature":"request_join_guild(uuid,uuid)","md5":"cf92693f47853e7f1c21cd6994bd90fb"},{"signature":"review_guild_join_request(uuid,uuid,boolean)","md5":"62a3e95b075356ab85bcc53996539376"},{"signature":"leave_guild(uuid)","md5":"dcb89e35196e2a38f2d6293c7617bdb0"},{"signature":"remove_guild_member(uuid,uuid)","md5":"b4dda05b59d23dc6cf994edd2fa0f21a"},{"signature":"list_guild_members(uuid)","md5":"8f3f459a59bcac491464c60d8087b342"},{"signature":"list_guild_join_requests(uuid)","md5":"1b8e52a91dd06ec2aba3778ca819ce33"},{"signature":"guild_admin_stats(uuid)","md5":"81b93c05f99406fc68cbf330d835dede"},{"signature":"guild_governance_command(text,uuid,uuid,jsonb)","md5":"f2d7df2bc631402aca9f22e6bce0487f"},{"signature":"guild_governance_status()","md5":"d8b52b08e1f3c25f3d13ddfdb71debaf"}]$expected$::jsonb) LOOP IF to_regprocedure(f->>'signature') IS NULL OR md5(pg_get_functiondef(to_regprocedure(f->>'signature')))<>f->>'md5' THEN RAISE EXCEPTION '010A.2 function baseline mismatch: %',f->>'signature';END IF;END LOOP;END $baseline$;
DO $production_functions$ DECLARE f jsonb;BEGIN
 FOR f IN SELECT value FROM jsonb_array_elements($manifest$[{"signature":"is_guild_leader(uuid)","md5":"608df78b6e184f5688c02f58a95e8cd0","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"can_lead_mission(uuid)","md5":"77704241905569d0bece712ef9718db5","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_ops.actor(uuid,uuid,boolean)","md5":"0eec40ebf95e1af38f37dc0721baec30","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_ops.visible(uuid)","md5":"9d6b7933f614787ae50e837bf3b98105","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.manager(uuid,uuid,text)","md5":"5fab4701a42eec47165ada5bc7cac9fc","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.actor(uuid,uuid)","md5":"fb90d0f5fdd1a0db953ff31d3d81edc5","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.can_access(uuid,boolean)","md5":"07783955c56f4866f7654f56e8b71979","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.command(uuid,text,uuid,integer,jsonb)","md5":"b679670fd3fbb0fdc7f4b0209686beee","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.workspace(uuid,integer)","md5":"a6dc1fc6a18f93bba0e28fb1952cc73e","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.leader_guild(uuid)","md5":"2ce883bff4adcac0ffe593d1899c5d34","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.create_invite(uuid)","md5":"897b1822e17b90dae9ed8519ea196502","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.list_invites(uuid)","md5":"7b9677b526325085d81fc8024bad22c5","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.revoke_invite(uuid,uuid)","md5":"d302c30443070f2eff5b13ccbc3e9242","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.valid_invite(text)","md5":"a207742c90374dbc473ed1cc858d6c93","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.request_invite(text,uuid)","md5":"b07abe0020748f6e3b0980e417503af9","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"create_guild(uuid,text,text)","md5":"a4e6dce55600d8b48874a1fe51454d32","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"request_join_guild(uuid,uuid)","md5":"cf92693f47853e7f1c21cd6994bd90fb","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"review_guild_join_request(uuid,uuid,boolean)","md5":"62a3e95b075356ab85bcc53996539376","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"leave_guild(uuid)","md5":"dcb89e35196e2a38f2d6293c7617bdb0","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"remove_guild_member(uuid,uuid)","md5":"b4dda05b59d23dc6cf994edd2fa0f21a","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"list_guild_members(uuid)","md5":"8f3f459a59bcac491464c60d8087b342","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"list_guild_join_requests(uuid)","md5":"1b8e52a91dd06ec2aba3778ca819ce33","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_stats(uuid)","md5":"81b93c05f99406fc68cbf330d835dede","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.account_uid()","md5":"44416350d1f76a0960c60565c628932b","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.allowed_permissions(text[])","md5":"655e56fab6483988b2677fb2948396eb","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.bootstrap_admin(uuid,text[],text,uuid)","md5":"4c24a887186b1697194f59bf060b9c4a","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.command(text,uuid,uuid,jsonb)","md5":"274f578aa492fcaf9c12faf80c8baff9","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.exact_keys(jsonb,text[])","md5":"88baa8537542e67e7e11fb788c40cdc8","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.history(integer)","md5":"b4d09a12cb8a953a6ddc5d7734fbe86f","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.immutable_audit()","md5":"0ee8905ac5a78d80a5ab5927d413d608","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.preview(text)","md5":"663c6c982d4377756bc82a8ed39a603a","acl":["postgres=X/postgres","authenticated=X/postgres","anon=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.require_admin(text)","md5":"8f4bf562e9893b2093b73c9225196a4c","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.status()","md5":"19fd846b42b0817bae4d19b30a7213f6","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.workspace(integer)","md5":"020cc7caffbbf5c9801af9dddc8862eb","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_governance_command(text,uuid,uuid,jsonb)","md5":"f2d7df2bc631402aca9f22e6bce0487f","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_governance_history(integer)","md5":"c7470507009842158caefa7805ea99ca","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_governance_status()","md5":"d8b52b08e1f3c25f3d13ddfdb71debaf","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_governance_workspace(integer)","md5":"8a11f4dc5022ec35bd7a879b52c0daeb","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_leadership_preview(text)","md5":"9017c751d99d7ca7b7024cd86470dd10","acl":["postgres=X/postgres","authenticated=X/postgres","anon=X/postgres"],"owner":"postgres"}]$manifest$::jsonb) LOOP
 IF to_regprocedure(f->>'signature') IS NULL THEN RAISE EXCEPTION 'Missing production compatibility baseline';END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure(f->>'signature') AND
 (md5(pg_get_functiondef(p.oid))<>f->>'md5' OR to_jsonb(p.proacl) IS DISTINCT FROM nullif(f->'acl','null'::jsonb)
 OR pg_get_userbyid(p.proowner)<>f->>'owner')) THEN RAISE EXCEPTION 'Production compatibility ACL or definition drift: %',f->>'signature';END IF;
 END LOOP;END $production_functions$;

CREATE TABLE guild_admin_private.multiguild_control(
 singleton boolean PRIMARY KEY CHECK(singleton), writes_enabled boolean NOT NULL,
 revision integer NOT NULL CHECK(revision>0)
);
INSERT INTO guild_admin_private.multiguild_control VALUES(true,false,1);
ALTER TABLE guild_admin_private.multiguild_control ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON guild_admin_private.multiguild_control FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION guild_admin_private.require_writes() RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM guild_admin_private.multiguild_control WHERE singleton AND writes_enabled)
 THEN RAISE EXCEPTION 'Guild management temporarily unavailable' USING ERRCODE='55000'; END IF;
END $$;

-- Current revocation state complements, rather than invents, legacy grants.
CREATE TABLE guild_admin_private.leadership_revocations(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 revoked_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 revoked_at timestamptz NOT NULL,
 cleared_at timestamptz,
 revision integer NOT NULL CHECK(revision>0)
);
CREATE INDEX leadership_revocations_actor_idx ON guild_admin_private.leadership_revocations(revoked_by);
ALTER TABLE guild_admin_private.leadership_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON guild_admin_private.leadership_revocations FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE guild_admin_private.audit DROP CONSTRAINT audit_action_check;
ALTER TABLE guild_admin_private.audit ADD CONSTRAINT audit_action_check CHECK(action IN(
 'bootstrap_admin','set_admin','issue_leadership','accept_leadership','revoke_invite','revoke_leadership',
 'guild_create','guild_join','guild_review','guild_leave','guild_remove','guild_invite'));

CREATE FUNCTION guild_admin_private.leader_not_revoked(p_actor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.travelers t WHERE t.id=p_actor
 AND NOT EXISTS(SELECT 1 FROM guild_admin_private.leadership_revocations r WHERE r.user_id=t.user_id AND r.cleared_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM guild_admin_private.leader_authorizations a WHERE a.user_id=t.user_id AND a.revoked_at IS NOT NULL))
$$;
CREATE FUNCTION guild_admin_private.active_actor(p_actor uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=guild_admin_private.account_uid(); BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND user_id=actor AND is_active)
 THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501'; END IF;
 RETURN actor;
END $$;
CREATE FUNCTION guild_admin_private.guild_role(p_actor uuid,p_guild uuid,p_leader boolean DEFAULT false) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE role_value text; BEGIN
 PERFORM guild_admin_private.active_actor(p_actor);
 SELECT gm.role INTO role_value FROM public.guild_members gm JOIN public.guilds g ON g.id=gm.guild_id
 WHERE gm.guild_id=p_guild AND gm.traveler_id=p_actor AND gm.status='active' AND g.status='active'
 AND(gm.role<>'leader' OR g.leader_traveler_id=p_actor);
 IF role_value='leader' AND NOT guild_admin_private.leader_not_revoked(p_actor) THEN role_value:='member'; END IF;
 IF role_value IS NULL OR(p_leader AND role_value<>'leader')
 THEN RAISE EXCEPTION 'Guild permission required' USING ERRCODE='42501'; END IF;
 RETURN role_value;
END $$;
CREATE FUNCTION guild_admin_private.only_guild(p_actor uuid,p_leader boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE ids uuid[]; BEGIN
 PERFORM guild_admin_private.active_actor(p_actor);
 SELECT array_agg(guild_id) INTO ids FROM public.guild_members WHERE traveler_id=p_actor AND status='active';
 IF COALESCE(cardinality(ids),0)<>1 THEN RAISE EXCEPTION 'Explicit Guild selection required' USING ERRCODE='55000'; END IF;
 PERFORM guild_admin_private.guild_role(p_actor,ids[1],p_leader);RETURN ids[1];
END $$;
CREATE FUNCTION guild_admin_private.require_creation(p_actor uuid) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=guild_admin_private.active_actor(p_actor); BEGIN
 IF NOT guild_admin_private.leader_not_revoked(p_actor) OR NOT EXISTS(
  SELECT 1 FROM guild_admin_private.leader_authorizations WHERE user_id=actor AND revoked_at IS NULL
 ) THEN RAISE EXCEPTION 'Explicit leadership authorization required' USING ERRCODE='42501'; END IF;
END $$;

CREATE FUNCTION guild_admin_private.governance_command(p_action text,p_id uuid,p_request uuid,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=guild_admin_private.account_uid(); signature text; prior guild_admin_private.audit;
 response jsonb; next_revision integer; reason text; BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 PERFORM guild_admin_private.require_writes();
 IF p_action<>'revoke_leadership' OR p_action IS NULL THEN
  response:=guild_admin_private.command(p_action,p_id,p_request,p_data);
  -- A replay of an earlier acceptance must never clear a later revocation.
  IF p_action='accept_leadership' AND response->>'replayed'='false' THEN
   UPDATE guild_admin_private.leadership_revocations SET cleared_at=clock_timestamp(),revision=revision+1
   WHERE user_id=actor AND cleared_at IS NULL;
  END IF;
  RETURN response;
 END IF;
 PERFORM guild_admin_private.require_admin('leadership.manage');
 IF p_id IS NULL OR p_request IS NULL OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>4096
 THEN RAISE EXCEPTION 'Invalid governance command' USING ERRCODE='22023'; END IF;
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['reason']);reason:=p_data->>'reason';
 IF jsonb_typeof(p_data->'reason') IS DISTINCT FROM 'string' OR length(btrim(reason)) NOT BETWEEN 8 AND 500 OR reason ~ '[[:cntrl:]]'
 THEN RAISE EXCEPTION 'Administrative reason required' USING ERRCODE='22023'; END IF;
 signature:=encode(extensions.digest(jsonb_build_object('action',p_action,'id',p_id,'data',p_data)::text,'sha256'),'hex');
 SELECT * INTO prior FROM guild_admin_private.audit WHERE actor_uid=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.payload_hash<>signature THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
  RETURN prior.result||jsonb_build_object('replayed',true,'token',NULL);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM guild_admin_private.leader_authorizations WHERE user_id=p_id)
 AND NOT EXISTS(SELECT 1 FROM public.travelers t JOIN public.guild_members m ON m.traveler_id=t.id
  JOIN public.guilds g ON g.id=m.guild_id WHERE t.user_id=p_id AND m.role='leader' AND m.status='active' AND g.leader_traveler_id=t.id)
 THEN RAISE EXCEPTION 'Authorization unavailable' USING ERRCODE='P0002'; END IF;
 INSERT INTO guild_admin_private.leadership_revocations(user_id,revoked_by,revoked_at,revision)
 VALUES(p_id,actor,clock_timestamp(),1) ON CONFLICT(user_id) DO UPDATE SET revoked_by=actor,
 revoked_at=clock_timestamp(),cleared_at=NULL,revision=leadership_revocations.revision+1 RETURNING revision INTO next_revision;
 UPDATE guild_admin_private.leader_authorizations SET revoked_at=COALESCE(revoked_at,clock_timestamp()),revision=revision+1 WHERE user_id=p_id;
 response:=jsonb_build_object('id',p_id,'revision',next_revision,'status','revoked','legacyGuildsChanged',false,'legacyPrivilegesRevoked',true);
 INSERT INTO guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result)
 VALUES(actor,p_request,p_action,p_id,btrim(reason),signature,response);
 RETURN response||jsonb_build_object('replayed',false);
END $$;
CREATE FUNCTION guild_admin_private.current_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=guild_admin_private.account_uid(); response jsonb:=guild_admin_private.status(); can_create boolean; enabled boolean; BEGIN
 SELECT writes_enabled INTO enabled FROM guild_admin_private.multiguild_control WHERE singleton;
 SELECT EXISTS(SELECT 1 FROM guild_admin_private.leader_authorizations a WHERE a.user_id=actor AND a.revoked_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM guild_admin_private.leadership_revocations r WHERE r.user_id=actor AND r.cleared_at IS NULL)) INTO can_create;
 IF EXISTS(SELECT 1 FROM guild_admin_private.leadership_revocations WHERE user_id=actor AND cleared_at IS NULL)
 THEN response:=response||jsonb_build_object('leadership','revoked'); END IF;
 RETURN response||jsonb_build_object('version',2,'multiGuildReady',true,'canCreateAdditionalGuilds',can_create AND enabled,'writesEnabled',enabled);
END $$;
CREATE OR REPLACE FUNCTION public.guild_governance_command(p_action text,p_id uuid,p_request uuid,p_data jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.governance_command(p_action,p_id,p_request,p_data) $$;
CREATE FUNCTION public.guild_scoped_status() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.current_status() $$;

CREATE FUNCTION guild_admin_private.contexts(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM guild_admin_private.active_actor(p_actor);
 RETURN jsonb_build_object('version',1,'guilds',COALESCE((SELECT jsonb_agg(jsonb_build_object('guild',to_jsonb(g),
  'membership',to_jsonb(m),'canManage',m.role='leader' AND g.leader_traveler_id=p_actor AND guild_admin_private.leader_not_revoked(p_actor))
  ORDER BY g.created_at,g.id) FROM public.guild_members m JOIN public.guilds g ON g.id=m.guild_id
  WHERE m.traveler_id=p_actor AND m.status='active' AND g.status='active'),'[]'::jsonb));
END $$;
CREATE FUNCTION public.guild_scoped_contexts(p_actor uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $$ SELECT guild_admin_private.contexts(p_actor) $$;

CREATE FUNCTION guild_admin_private.guild_command(p_actor uuid,p_guild uuid,p_action text,p_id uuid,p_request uuid,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; signature text; prior guild_admin_private.audit; response jsonb; req public.guild_join_requests;
 name_value text; description_value text; target uuid; status_value text; BEGIN
 -- Same lock order as administrative grants/revocations and EBD writes.
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 PERFORM guild_admin_private.require_writes();
 actor:=guild_admin_private.active_actor(p_actor);
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND user_id=actor AND is_active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501';END IF;
 IF p_guild IS NULL OR p_id IS NULL OR p_request IS NULL OR p_action IS NULL
 OR p_action NOT IN('create','join','review','leave','remove') OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>4096
 THEN RAISE EXCEPTION 'Invalid scoped Guild command' USING ERRCODE='22023'; END IF;
 IF p_action='create' THEN PERFORM guild_admin_private.require_creation(p_actor);
 ELSIF p_action IN('review','remove') THEN PERFORM guild_admin_private.guild_role(p_actor,p_guild,true);
 END IF;
 signature:=encode(extensions.digest(jsonb_build_object('kind','scoped-guild','actor',p_actor,'guild',p_guild,'action',p_action,'id',p_id,'data',p_data)::text,'sha256'),'hex');
 SELECT * INTO prior FROM guild_admin_private.audit WHERE actor_uid=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.payload_hash<>signature THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
  RETURN prior.result||jsonb_build_object('replayed',true);
 END IF;
 IF p_action='leave' THEN PERFORM guild_admin_private.guild_role(p_actor,p_guild); END IF;
 IF p_action='create' THEN
  PERFORM guild_admin_private.exact_keys(p_data,ARRAY['name','description']);
  name_value:=btrim(p_data->>'name');description_value:=btrim(p_data->>'description');
  IF p_id<>p_guild OR jsonb_typeof(p_data->'name') IS DISTINCT FROM 'string' OR length(name_value) NOT BETWEEN 2 AND 60
  OR jsonb_typeof(p_data->'description') IS DISTINCT FROM 'string' OR length(description_value)>500
  THEN RAISE EXCEPTION 'Invalid Guild data' USING ERRCODE='22023'; END IF;
  INSERT INTO public.guilds(id,name,description,created_by_user_id,leader_traveler_id)
  VALUES(p_guild,name_value,NULLIF(description_value,''),actor,p_actor);
  INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES(p_guild,p_actor,'leader','active');
  response:=jsonb_build_object('id',p_guild,'status','created');
 ELSIF p_action='join' THEN
  PERFORM guild_admin_private.exact_keys(p_data,'{}'::text[]);
  IF NOT EXISTS(SELECT 1 FROM public.guilds WHERE id=p_guild AND status='active')
  THEN RAISE EXCEPTION 'Guild unavailable' USING ERRCODE='P0002'; END IF;
  IF EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=p_actor AND status='active')
  THEN RAISE EXCEPTION 'Already a member of this Guild' USING ERRCODE='23505'; END IF;
  INSERT INTO public.guild_join_requests(id,guild_id,traveler_id) VALUES(p_id,p_guild,p_actor)
  ON CONFLICT(guild_id,traveler_id) WHERE status='pending' DO UPDATE SET updated_at=guild_join_requests.updated_at
  RETURNING * INTO req;
  response:=jsonb_build_object('id',req.id,'status',req.status);
 ELSIF p_action='review' THEN
  PERFORM guild_admin_private.exact_keys(p_data,ARRAY['approve']);
  IF jsonb_typeof(p_data->'approve') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid review' USING ERRCODE='22023'; END IF;
  SELECT * INTO req FROM public.guild_join_requests WHERE id=p_id AND guild_id=p_guild AND status='pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable' USING ERRCODE='P0002'; END IF;
  IF (p_data->>'approve')::boolean AND EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=req.traveler_id AND(status='active' OR role='leader'))
  THEN RAISE EXCEPTION 'Membership unavailable' USING ERRCODE='23505'; END IF;
  status_value:=CASE WHEN(p_data->>'approve')::boolean THEN 'accepted' ELSE 'rejected' END;
  UPDATE public.guild_join_requests SET status=status_value,reviewed_by_traveler_id=p_actor,reviewed_at=clock_timestamp() WHERE id=p_id;
  IF status_value='accepted' THEN
   INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES(p_guild,req.traveler_id,'member','active')
   ON CONFLICT(guild_id,traveler_id) DO UPDATE SET status='active',joined_at=clock_timestamp(),updated_at=clock_timestamp();
  END IF;
  response:=jsonb_build_object('id',p_id,'status',status_value);
 ELSE
  PERFORM guild_admin_private.exact_keys(p_data,'{}'::text[]);
  target:=CASE WHEN p_action='leave' THEN p_actor ELSE p_id END;
  IF p_action='leave' AND p_id<>p_actor THEN RAISE EXCEPTION 'Owned membership required' USING ERRCODE='42501'; END IF;
  status_value:=CASE WHEN p_action='leave' THEN 'left' ELSE 'removed' END;
  UPDATE public.guild_members SET status=status_value,updated_at=clock_timestamp()
   WHERE guild_id=p_guild AND traveler_id=target AND status='active' AND role='member';
  IF NOT FOUND THEN RAISE EXCEPTION 'Member unavailable or leader must transfer' USING ERRCODE='42501'; END IF;
  UPDATE public.guild_ebd_teachers SET active=false,revision=revision+1,updated_at=clock_timestamp()
   WHERE guild_id=p_guild AND traveler_id=target AND active;
  response:=jsonb_build_object('id',target,'status',status_value);
 END IF;
 INSERT INTO guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result)
 VALUES(actor,p_request,'guild_'||p_action,p_guild,'Authenticated account confirmed scoped Guild action: '||p_action,signature,response);
 RETURN response||jsonb_build_object('replayed',false);
END $$;
CREATE FUNCTION public.guild_scoped_command(p_actor uuid,p_guild uuid,p_action text,p_id uuid,p_request uuid,p_data jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.guild_command(p_actor,p_guild,p_action,p_id,p_request,p_data) $$;

CREATE FUNCTION guild_admin_private.members(p_actor uuid,p_guild uuid)
RETURNS TABLE(traveler_id uuid,traveler_name text,role text,member_status text,joined_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM guild_admin_private.guild_role(p_actor,p_guild);
 RETURN QUERY SELECT t.id,t.name,m.role,m.status,m.joined_at FROM public.guild_members m JOIN public.travelers t ON t.id=m.traveler_id
 WHERE m.guild_id=p_guild ORDER BY m.joined_at,m.id;
END $$;
CREATE FUNCTION public.guild_scoped_members(p_actor uuid,p_guild uuid)
RETURNS TABLE(traveler_id uuid,traveler_name text,role text,member_status text,joined_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT * FROM guild_admin_private.members(p_actor,p_guild) $$;
CREATE FUNCTION guild_admin_private.requests(p_actor uuid,p_guild uuid)
RETURNS TABLE(request_id uuid,traveler_id uuid,traveler_name text,request_status text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM guild_admin_private.guild_role(p_actor,p_guild,true);
 RETURN QUERY SELECT r.id,t.id,t.name,r.status,r.created_at FROM public.guild_join_requests r JOIN public.travelers t ON t.id=r.traveler_id
 WHERE r.guild_id=p_guild AND r.status='pending' ORDER BY r.created_at,r.id;
END $$;
CREATE FUNCTION public.guild_scoped_requests(p_actor uuid,p_guild uuid)
RETURNS TABLE(request_id uuid,traveler_id uuid,traveler_name text,request_status text,created_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT * FROM guild_admin_private.requests(p_actor,p_guild) $$;

-- Reviewed compatibility replacements and scoped EBD/invites follow below.
CREATE OR REPLACE FUNCTION public.is_guild_leader(p_guild_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ SELECT EXISTS (
  SELECT 1 FROM public.guild_members gm
  JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE gm.guild_id = p_guild_id AND gm.status = 'active' AND gm.role = 'leader' AND t.user_id = auth.uid() AND guild_admin_private.leader_not_revoked(t.id)
) $function$;

CREATE OR REPLACE FUNCTION public.can_lead_mission(p_mission_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ SELECT EXISTS (
  SELECT 1 FROM public.guild_missions m
  JOIN public.guild_members gm ON gm.guild_id = m.guild_id
  JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE m.id = p_mission_id AND gm.status = 'active' AND gm.role = 'leader' AND t.user_id = auth.uid() AND guild_admin_private.leader_not_revoked(t.id)
) $function$;

CREATE OR REPLACE FUNCTION guild_ops.actor(p_actor uuid, p_guild uuid, p_leader boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_role text;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 SELECT gm.role INTO v_role FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id
 JOIN auth.users u ON u.id=t.user_id JOIN public.guilds g ON g.id=gm.guild_id
 WHERE gm.traveler_id=p_actor AND gm.guild_id=p_guild AND gm.status='active' AND g.status='active'
   AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
   AND (gm.role<>'leader' OR g.leader_traveler_id=p_actor)
   AND (NOT p_leader OR (gm.role='leader' AND g.leader_traveler_id=p_actor)) FOR SHARE OF gm,g;
 IF v_role='leader' AND NOT guild_admin_private.leader_not_revoked(p_actor) THEN IF p_leader THEN RAISE EXCEPTION 'Guild leadership revoked' USING ERRCODE='42501'; END IF;v_role:='member';END IF;
 IF v_role IS NULL THEN RAISE EXCEPTION 'Guild access denied' USING ERRCODE='42501'; END IF;
 RETURN v_role;
END $function$;

CREATE OR REPLACE FUNCTION guild_ops.visible(p_mission uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.guild_missions m JOIN public.guild_members gm ON gm.guild_id=m.guild_id
 JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id JOIN public.guilds g ON g.id=gm.guild_id
 WHERE m.id=p_mission AND gm.status='active' AND g.status='active' AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
 AND ((gm.role='leader' AND g.leader_traveler_id=gm.traveler_id AND guild_admin_private.leader_not_revoked(gm.traveler_id)) OR
   (m.status<>'draft' AND ((m.status='published' AND (m.audience='all' OR gm.traveler_id=ANY(m.target_traveler_ids))) OR
     EXISTS(SELECT 1 FROM public.guild_mission_progress p WHERE p.mission_id=m.id AND p.traveler_id=gm.traveler_id)))))
$function$;

CREATE OR REPLACE FUNCTION ebd_ops.manager(p_actor uuid, p_lesson uuid, p_permission text DEFAULT 'edit'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.guild_lessons l JOIN public.guild_members gm ON gm.guild_id=l.guild_id AND gm.traveler_id=p_actor
 JOIN public.guilds g ON g.id=gm.guild_id JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id
 LEFT JOIN public.guild_ebd_teachers et ON et.guild_id=l.guild_id AND et.traveler_id=p_actor
 WHERE l.id=p_lesson AND gm.status='active' AND g.status='active' AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
 AND ((gm.role='leader' AND g.leader_traveler_id=p_actor AND guild_admin_private.leader_not_revoked(p_actor)) OR
 (l.teacher_id=p_actor AND et.active AND CASE p_permission WHEN 'publish' THEN et.can_publish WHEN 'attend' THEN et.can_attend ELSE true END)))
$function$;

CREATE OR REPLACE FUNCTION guild_chat_private.actor(p_guild_id uuid, p_traveler_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor_role text;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Chat access denied' USING ERRCODE='42501'; END IF;
  SELECT gm.role INTO actor_role FROM public.guild_members gm
    JOIN public.travelers t ON t.id=gm.traveler_id JOIN public.guilds g ON g.id=gm.guild_id JOIN auth.users u ON u.id=t.user_id
    WHERE gm.guild_id=p_guild_id AND t.id=p_traveler_id AND t.user_id=auth.uid()
      AND gm.status='active' AND g.status='active' AND NOT coalesce(u.is_anonymous,false)
    FOR SHARE OF gm,t,g;
  IF actor_role IS NULL THEN RAISE EXCEPTION 'Chat access denied' USING ERRCODE='42501'; END IF;
  IF actor_role IN('leader','co_leader','moderator') AND NOT guild_admin_private.leader_not_revoked(p_traveler_id) THEN actor_role:='member';END IF;
 RETURN actor_role;
END $function$;

CREATE OR REPLACE FUNCTION guild_chat_private.can_access(p_guild_id uuid, p_moderate boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id
    JOIN public.guilds g ON g.id=gm.guild_id JOIN auth.users u ON u.id=t.user_id
    WHERE gm.guild_id=p_guild_id AND gm.status='active' AND g.status='active'
      AND u.id=auth.uid() AND NOT coalesce(u.is_anonymous,false)
      AND (NOT p_moderate OR (gm.role IN ('leader','co_leader','moderator') AND guild_admin_private.leader_not_revoked(t.id)))
  )
$function$;

CREATE OR REPLACE FUNCTION ebd_ops.command(p_actor uuid, p_guild uuid, p_action text, p_id uuid, p_revision integer, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_guild uuid; v_role text; l public.guild_lessons; a public.guild_ebd_activities;
 ans public.guild_ebd_answers; att public.guild_ebd_attendance; et public.guild_ebd_teachers;
 v_teacher uuid; v_target uuid; v_targets uuid[]; v_state text; v_revision integer; v_count integer;
 v_item jsonb; v_options jsonb; v_key integer; v_choice integer; v_snapshot jsonb;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes();
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND user_id=auth.uid() AND is_active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501';END IF;
 IF p_actor IS NULL OR p_id IS NULL OR p_action IS NULL OR p_revision IS NULL OR p_revision<0
 OR p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR length(p_data::text)>60000 THEN RAISE EXCEPTION 'Invalid EBD request'; END IF;
v_guild:=p_guild;
 PERFORM guild_admin_private.active_actor(p_actor);PERFORM guild_admin_private.guild_role(p_actor,p_guild);
 IF p_action='lesson' AND coalesce(p_data->>'rewardTier','')<>'' THEN RAISE EXCEPTION 'Rewards are unavailable in this release' USING ERRCODE='42501';END IF;
 IF p_action IN('state','attendance') AND NOT EXISTS(SELECT 1 FROM public.guild_lessons WHERE id=p_id AND guild_id=p_guild)
 OR p_action='lesson' AND EXISTS(SELECT 1 FROM public.guild_lessons WHERE id=p_id AND guild_id<>p_guild)
 OR p_action='activity' AND(NOT EXISTS(SELECT 1 FROM public.guild_lessons WHERE id=(p_data->>'lessonId')::uuid AND guild_id=p_guild)
  OR EXISTS(SELECT 1 FROM public.guild_ebd_activities scoped_a JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE scoped_a.id=p_id AND scoped_l.guild_id<>p_guild))
 OR p_action='submit' AND(NOT EXISTS(SELECT 1 FROM public.guild_ebd_activities scoped_a JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE scoped_a.id=(p_data->>'activityId')::uuid AND scoped_l.guild_id=p_guild)
  OR EXISTS(SELECT 1 FROM public.guild_ebd_answers x JOIN public.guild_ebd_activities scoped_a ON scoped_a.id=x.activity_id JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE x.id=p_id AND scoped_l.guild_id<>p_guild))
 OR p_action='grade' AND NOT EXISTS(SELECT 1 FROM public.guild_ebd_answers x JOIN public.guild_ebd_activities scoped_a ON scoped_a.id=x.activity_id JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE x.id=p_id AND scoped_l.guild_id=p_guild)
 THEN RAISE EXCEPTION 'Resource is unavailable in selected Guild' USING ERRCODE='42501';END IF;

 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_guild::text,83));
 v_role:=guild_ops.actor(p_actor,v_guild);
 -- Serialize EBD commands per Guilda, including grant revocations/member eligibility.
 PERFORM 1 FROM public.guilds WHERE id=v_guild FOR UPDATE;
 IF p_action='teacher' THEN
  PERFORM guild_ops.actor(p_actor,v_guild,true);
  PERFORM 1 FROM public.guild_members WHERE guild_id=v_guild AND traveler_id=p_id AND status='active' AND role<>'leader' FOR SHARE;
  IF NOT FOUND OR jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean'
   OR jsonb_typeof(p_data->'publish') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'attend') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Teacher unavailable'; END IF;
  SELECT * INTO et FROM public.guild_ebd_teachers WHERE guild_id=v_guild AND traveler_id=p_id FOR UPDATE;
  IF coalesce(et.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
  INSERT INTO public.guild_ebd_teachers VALUES(v_guild,p_id,(p_data->>'active')::boolean,(p_data->>'publish')::boolean,(p_data->>'attend')::boolean,p_revision+1,clock_timestamp())
   ON CONFLICT(guild_id,traveler_id) DO UPDATE SET active=excluded.active,can_publish=excluded.can_publish,can_attend=excluded.can_attend,revision=excluded.revision,updated_at=excluded.updated_at;
  INSERT INTO public.guild_ebd_history(guild_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_actor,'teacher',p_id,p_revision+1,p_data);
  RETURN jsonb_build_object('id',p_id,'revision',p_revision+1);
 ELSIF p_action='lesson' THEN
  v_teacher:=(p_data->>'teacherId')::uuid;
  IF v_role<>'leader' AND (v_teacher IS DISTINCT FROM p_actor OR NOT EXISTS(SELECT 1 FROM public.guild_ebd_teachers WHERE guild_id=v_guild AND traveler_id=p_actor AND active)) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.guild_members gm JOIN public.guilds g ON g.id=gm.guild_id
   LEFT JOIN public.guild_ebd_teachers t ON t.guild_id=gm.guild_id AND t.traveler_id=gm.traveler_id
   WHERE gm.guild_id=v_guild AND gm.traveler_id=v_teacher AND gm.status='active' AND ((gm.role='leader' AND g.leader_traveler_id=v_teacher AND guild_admin_private.leader_not_revoked(v_teacher)) OR t.active)) THEN RAISE EXCEPTION 'Teacher unavailable'; END IF;
  IF jsonb_typeof(p_data->'targetIds') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'targetIds')>100
   OR jsonb_typeof(p_data->'materials') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'materials')>20
   OR coalesce(p_data->>'audience','') NOT IN ('all','selected')
   OR length(btrim(coalesce(p_data->>'title',''))) NOT BETWEEN 2 AND 100
   OR length(btrim(coalesce(p_data->>'theme',''))) NOT BETWEEN 2 AND 100
   OR length(coalesce(p_data->>'description',''))>2000 OR length(coalesce(p_data->>'content',''))>10000
   OR length(coalesce(p_data->>'reference',''))>100 OR length(coalesce(p_data->>'objectives',''))>2000
   OR coalesce(p_data->>'rewardTier','') NOT IN ('','normal','great','epic','extraordinary') THEN RAISE EXCEPTION 'Invalid lesson'; END IF;
  SELECT coalesce(array_agg(value::uuid),'{}') INTO v_targets FROM jsonb_array_elements_text(p_data->'targetIds');
  IF (p_data->>'audience'='selected' AND cardinality(v_targets)=0) OR (p_data->>'audience'='all' AND cardinality(v_targets)>0)
   OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=v_guild AND traveler_id=t AND status='active')) THEN RAISE EXCEPTION 'Audience unavailable'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_data->'materials') LOOP
   IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' OR coalesce(v_item->>'kind','') NOT IN ('link','image','pdf','text','reference')
    OR length(btrim(coalesce(v_item->>'title',''))) NOT BETWEEN 1 AND 100 OR length(btrim(coalesce(v_item->>'value',''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid material'; END IF;
   -- References only: never fetch/embed remote files or render HTML; no credentials/ports/local hosts.
   IF v_item->>'kind' IN ('link','image','pdf') AND
    (length(v_item->>'value')>500 OR (v_item->>'value') !~ '^https://[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(/[A-Za-z0-9/._~!$&()*+,;=:@%?#-]*)?$'
     OR (v_item->>'value') ~* '^https://([^/]*\.)?(localhost|local|internal|invalid|test|example)(/|$)' OR (v_item->>'value') ~* '^https://[^/]*\.(local|internal|invalid|test|example)(/|$)') THEN RAISE EXCEPTION 'Unsafe material URL'; END IF;
  END LOOP;
  SELECT * INTO l FROM public.guild_lessons WHERE id=p_id FOR UPDATE;
  IF FOUND THEN
   IF l.guild_id<>v_guild OR NOT ebd_ops.manager(p_actor,p_id) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
   IF p_revision=0 AND l.creation_hash=md5(p_data::text) THEN RETURN jsonb_build_object('id',p_id,'revision',l.ebd_revision); END IF;
   IF l.status<>'draft' OR l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
   UPDATE public.guild_lessons SET title=btrim(p_data->>'title'),theme=btrim(p_data->>'theme'),introduction=coalesce(p_data->>'description',''),content=coalesce(p_data->>'content',''),bible_reference=coalesce(p_data->>'reference',''),scheduled_at=nullif(p_data->>'scheduledAt','')::timestamptz,teacher_id=v_teacher,audience=p_data->>'audience',target_ids=v_targets,materials=p_data->'materials',objectives=coalesce(p_data->>'objectives',''),reward_tier=nullif(p_data->>'rewardTier',''),ebd_revision=ebd_revision+1 WHERE id=p_id;
  ELSE
   IF p_revision<>0 THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
   INSERT INTO public.guild_lessons(id,guild_id,created_by_traveler_id,teacher_id,title,theme,introduction,content,bible_reference,scheduled_at,audience,target_ids,materials,objectives,reward_tier,creation_hash)
    VALUES(p_id,v_guild,p_actor,v_teacher,btrim(p_data->>'title'),btrim(p_data->>'theme'),coalesce(p_data->>'description',''),coalesce(p_data->>'content',''),coalesce(p_data->>'reference',''),nullif(p_data->>'scheduledAt','')::timestamptz,p_data->>'audience',v_targets,p_data->'materials',coalesce(p_data->>'objectives',''),nullif(p_data->>'rewardTier',''),md5(p_data::text));
  END IF;
  SELECT to_jsonb(x),x.ebd_revision INTO v_snapshot,v_revision FROM public.guild_lessons x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_id,p_actor,'lesson_saved',p_id,v_revision,v_snapshot);
 ELSIF p_action='state' THEN
  SELECT * INTO l FROM public.guild_lessons WHERE id=p_id FOR UPDATE;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,p_id,'publish') THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  v_state:=p_data->>'state';
  IF l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
  IF v_state IS NULL OR NOT ((l.status='draft' AND v_state IN ('scheduled','published','archived')) OR (l.status='scheduled' AND v_state IN ('draft','published','archived')) OR (l.status='published' AND v_state='closed') OR (l.status IN ('closed','completed','cancelled') AND v_state='archived')) THEN RAISE EXCEPTION 'Invalid EBD state'; END IF;
  IF v_state IN ('scheduled','published') AND (length(btrim(l.content))=0 OR l.scheduled_at IS NULL) THEN RAISE EXCEPTION 'Lesson needs content and date'; END IF;
  UPDATE public.guild_lessons SET status=v_state,ebd_revision=ebd_revision+1,published_at=CASE WHEN v_state='published' THEN clock_timestamp() ELSE published_at END,completed_at=CASE WHEN v_state='closed' THEN clock_timestamp() ELSE completed_at END WHERE id=p_id;
  SELECT to_jsonb(x),x.ebd_revision INTO v_snapshot,v_revision FROM public.guild_lessons x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_id,p_actor,'state',p_id,v_revision,v_snapshot);
 ELSIF p_action='activity' THEN
  SELECT * INTO l FROM public.guild_lessons WHERE id=(p_data->>'lessonId')::uuid FOR UPDATE;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,l.id) OR l.status<>'draft' THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_data->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'options')>6
   OR coalesce(p_data->>'kind','') NOT IN ('choice','open','reflective','in_person','homework')
   OR coalesce(p_data->>'criterion','') NOT IN ('participation','correct','manual') THEN RAISE EXCEPTION 'Invalid activity'; END IF;
  v_options:=p_data->'options'; v_key:=nullif(p_data->>'answerKey','')::integer;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_options) x WHERE jsonb_typeof(x)<>'string' OR length(btrim(x#>>'{}')) NOT BETWEEN 1 AND 300)
   OR (p_data->>'kind'='choice' AND p_data->>'criterion'='manual') THEN RAISE EXCEPTION 'Invalid choices'; END IF;
  SELECT * INTO a FROM public.guild_ebd_activities WHERE id=p_id FOR UPDATE;
  IF FOUND THEN
   IF a.lesson_id<>l.id THEN RAISE EXCEPTION 'EBD access denied'; END IF;
   IF p_revision=0 AND a.creation_hash=md5(p_data::text) THEN RETURN jsonb_build_object('id',p_id,'revision',a.revision); END IF;
   IF a.revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
   UPDATE public.guild_ebd_activities SET title=btrim(p_data->>'title'),kind=p_data->>'kind',prompt=p_data->>'prompt',options=v_options,answer_key=v_key,deadline=nullif(p_data->>'deadline','')::timestamptz,attempt_limit=(p_data->>'attemptLimit')::integer,criterion=p_data->>'criterion',revision=revision+1 WHERE id=p_id;
  ELSE
   IF p_revision<>0 THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
   IF (SELECT count(*) FROM public.guild_ebd_activities WHERE lesson_id=l.id)>=20 THEN RAISE EXCEPTION 'Activity limit reached'; END IF;
   INSERT INTO public.guild_ebd_activities(id,lesson_id,title,kind,prompt,options,answer_key,deadline,attempt_limit,criterion,creation_hash)
    VALUES(p_id,l.id,btrim(p_data->>'title'),p_data->>'kind',p_data->>'prompt',v_options,v_key,nullif(p_data->>'deadline','')::timestamptz,(p_data->>'attemptLimit')::integer,p_data->>'criterion',md5(p_data::text));
  END IF;
  SELECT to_jsonb(x),x.revision INTO v_snapshot,v_revision FROM public.guild_ebd_activities x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,l.id,p_actor,'activity_saved',p_id,v_revision,v_snapshot);
 ELSIF p_action='submit' THEN
  SELECT * INTO a FROM public.guild_ebd_activities WHERE id=(p_data->>'activityId')::uuid FOR UPDATE;
  SELECT * INTO l FROM public.guild_lessons WHERE id=a.lesson_id;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.eligible(p_actor,l.id) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  v_choice:=nullif(p_data->>'choice','')::integer;
  SELECT * INTO ans FROM public.guild_ebd_answers WHERE id=p_id;
  IF FOUND THEN
   IF ans.traveler_id=p_actor AND ans.activity_id=a.id AND ans.response=btrim(p_data->>'response') AND ans.choice IS NOT DISTINCT FROM v_choice THEN RETURN jsonb_build_object('id',p_id,'revision',ans.revision); END IF;
   RAISE EXCEPTION 'Submission key conflict';
  END IF;
  IF l.status<>'published' OR (a.deadline IS NOT NULL AND a.deadline<=clock_timestamp()) THEN RAISE EXCEPTION 'Activity closed'; END IF;
  SELECT count(*) INTO v_count FROM public.guild_ebd_answers WHERE activity_id=a.id AND traveler_id=p_actor;
  IF v_count<>p_revision OR v_count>=a.attempt_limit OR EXISTS(SELECT 1 FROM public.guild_ebd_answers WHERE activity_id=a.id AND traveler_id=p_actor AND status IN ('completed','pending')) THEN RAISE EXCEPTION 'Attempt unavailable'; END IF;
  IF (a.kind='choice' AND (v_choice IS NULL OR v_choice<0 OR v_choice>=jsonb_array_length(a.options))) OR (a.kind<>'choice' AND v_choice IS NOT NULL) THEN RAISE EXCEPTION 'Invalid answer'; END IF;
  v_state:=CASE WHEN a.kind<>'choice' THEN 'pending' WHEN a.criterion='participation' OR v_choice=a.answer_key THEN 'completed' ELSE 'revise' END;
  INSERT INTO public.guild_ebd_answers(id,activity_id,traveler_id,attempt,response,choice,status,evaluated_at)
   VALUES(p_id,a.id,p_actor,v_count+1,btrim(p_data->>'response'),v_choice,v_state,CASE WHEN a.kind='choice' THEN clock_timestamp() END);
  v_revision:=1;
 ELSIF p_action='grade' THEN
  SELECT * INTO ans FROM public.guild_ebd_answers WHERE id=p_id FOR UPDATE;
  SELECT * INTO a FROM public.guild_ebd_activities WHERE id=ans.activity_id;
  SELECT * INTO l FROM public.guild_lessons WHERE id=a.lesson_id;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,l.id) OR EXISTS(SELECT 1 FROM public.travelers WHERE id=ans.traveler_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  IF ans.revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
  IF ans.status<>'pending' OR coalesce(p_data->>'status','') NOT IN ('completed','revise') THEN RAISE EXCEPTION 'Answer already evaluated'; END IF;
  UPDATE public.guild_ebd_answers SET status=p_data->>'status',feedback=coalesce(p_data->>'feedback',''),reviewer_id=p_actor,evaluated_at=clock_timestamp(),revision=revision+1 WHERE id=p_id;
  SELECT to_jsonb(x),x.revision INTO v_snapshot,v_revision FROM public.guild_ebd_answers x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,l.id,p_actor,'grade',p_id,v_revision,v_snapshot);
 ELSIF p_action='attendance' THEN
  SELECT * INTO l FROM public.guild_lessons WHERE id=p_id FOR UPDATE;
  v_target:=(p_data->>'travelerId')::uuid;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,p_id,'attend') OR l.status NOT IN ('published','closed','completed') THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.guild_members WHERE guild_id=v_guild AND traveler_id=v_target AND status='active' FOR SHARE;
  IF NOT FOUND OR (l.audience='selected' AND NOT v_target=ANY(l.target_ids)) THEN RAISE EXCEPTION 'Student unavailable'; END IF;
  SELECT * INTO att FROM public.guild_ebd_attendance WHERE lesson_id=p_id AND traveler_id=v_target FOR UPDATE;
  IF coalesce(att.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
  INSERT INTO public.guild_ebd_attendance VALUES(p_id,v_target,p_data->>'status',coalesce(p_data->>'reason',''),p_revision+1,p_actor,clock_timestamp())
   ON CONFLICT(lesson_id,traveler_id) DO UPDATE SET status=excluded.status,reason=excluded.reason,revision=excluded.revision,marked_by=excluded.marked_by,updated_at=excluded.updated_at;
  SELECT to_jsonb(x) INTO v_snapshot FROM public.guild_ebd_attendance x WHERE lesson_id=p_id AND traveler_id=v_target;
  v_revision:=p_revision+1;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_id,p_actor,'attendance',v_target,v_revision,jsonb_build_object('before',to_jsonb(att),'after',v_snapshot));
 ELSE RAISE EXCEPTION 'Unknown EBD action'; END IF;
 IF p_action IN ('submit','grade') THEN
  INSERT INTO public.guild_ebd_reward_pending(lesson_id,traveler_id,activity_id,answer_id,tier,criterion)
   SELECT l.id,x.traveler_id,a.id,x.id,l.reward_tier,a.criterion FROM public.guild_ebd_answers x
   WHERE x.id=p_id AND x.status='completed' AND l.reward_tier IS NOT NULL ON CONFLICT(lesson_id,traveler_id) DO NOTHING;
 END IF;
 RETURN jsonb_build_object('id',p_id,'revision',v_revision);
END $function$;

CREATE OR REPLACE FUNCTION ebd_ops.command(p_actor uuid, p_action text, p_id uuid, p_revision integer, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN ebd_ops.command(p_actor,guild_admin_private.only_guild(p_actor),p_action,p_id,p_revision,p_data);END
$function$;

CREATE OR REPLACE FUNCTION ebd_ops.workspace(p_actor uuid, p_guild uuid, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE g uuid; r text; ids uuid[]; total integer; teacher boolean;
BEGIN
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid EBD page'; END IF;
 g:=p_guild; PERFORM guild_admin_private.guild_role(p_actor,p_guild);
 r:=guild_ops.actor(p_actor,g);
 teacher:=r='leader' OR EXISTS(SELECT 1 FROM public.guild_ebd_teachers WHERE guild_id=g AND traveler_id=p_actor AND active);
 SELECT count(*) INTO total FROM public.guild_lessons l WHERE guild_id=g AND (ebd_ops.manager(p_actor,l.id) OR ebd_ops.eligible(p_actor,l.id));
 SELECT coalesce(array_agg(id),'{}') INTO ids FROM (SELECT id FROM public.guild_lessons l WHERE guild_id=g AND (ebd_ops.manager(p_actor,l.id) OR ebd_ops.eligible(p_actor,l.id)) ORDER BY created_at DESC,id LIMIT 20 OFFSET p_offset) page;
 RETURN jsonb_build_object('version',1,'guildId',g,'leader',r='leader','teacher',teacher,'total',total,
  'lessons',coalesce((SELECT jsonb_agg(to_jsonb(l)||jsonb_build_object('canEdit',ebd_ops.manager(p_actor,l.id),'canPublish',ebd_ops.manager(p_actor,l.id,'publish'),'canAttend',ebd_ops.manager(p_actor,l.id,'attend')) ORDER BY created_at DESC,id) FROM public.guild_lessons l WHERE id=ANY(ids)),'[]'::jsonb),
  'activities',coalesce((SELECT jsonb_agg((to_jsonb(a)-'answer_key'-'creation_hash')||CASE WHEN ebd_ops.manager(p_actor,a.lesson_id) OR EXISTS(SELECT 1 FROM public.guild_ebd_answers x WHERE x.activity_id=a.id AND x.traveler_id=p_actor AND (x.status='completed' OR (x.status='revise' AND x.attempt>=a.attempt_limit))) THEN jsonb_build_object('answer_key',a.answer_key) ELSE '{}'::jsonb END) FROM public.guild_ebd_activities a WHERE lesson_id=ANY(ids)),'[]'::jsonb),
  'answers',coalesce((SELECT jsonb_agg(to_jsonb(x)||jsonb_build_object('traveler_name',t.name) ORDER BY submitted_at DESC) FROM public.guild_ebd_answers x JOIN public.guild_ebd_activities a ON a.id=x.activity_id JOIN public.travelers t ON t.id=x.traveler_id WHERE a.lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,a.lesson_id))),'[]'::jsonb),
  'attendance',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.guild_ebd_attendance x WHERE lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,x.lesson_id))),'[]'::jsonb),
  'rewards',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.guild_ebd_reward_pending x WHERE lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,x.lesson_id))),'[]'::jsonb),
  'members',CASE WHEN teacher THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'leader',gm.role='leader')) FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id WHERE gm.guild_id=g AND gm.status='active'),'[]'::jsonb) ELSE '[]'::jsonb END,
  'teachers',CASE WHEN teacher THEN coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM public.guild_ebd_teachers t WHERE guild_id=g AND (r='leader' OR traveler_id=p_actor OR active)),'[]'::jsonb) ELSE '[]'::jsonb END,
  'history',coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM (SELECT id,lesson_id,actor_id,action,entity_id,revision,created_at FROM public.guild_ebd_history h WHERE guild_id=g AND (r='leader' OR (lesson_id=ANY(ids) AND ebd_ops.manager(p_actor,lesson_id))) ORDER BY id DESC LIMIT 100) h),'[]'::jsonb));
END $function$;

CREATE OR REPLACE FUNCTION ebd_ops.workspace(p_actor uuid, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN ebd_ops.workspace(p_actor,guild_admin_private.only_guild(p_actor),p_offset);END
$function$;

CREATE FUNCTION public.guild_scoped_ebd_workspace(p_actor uuid,p_guild uuid,p_offset integer DEFAULT 0) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_ops.workspace(p_actor,p_guild,p_offset) $$;

CREATE FUNCTION public.guild_scoped_ebd_command(p_actor uuid,p_guild uuid,p_action text,p_id uuid,p_revision integer,p_data jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_ops.command(p_actor,p_guild,p_action,p_id,p_revision,p_data) $$;

CREATE FUNCTION guild_invite_private.leader_guild(p_leader uuid,p_guild uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.guild_role(p_leader,p_guild,true);
 PERFORM 1 FROM public.travelers WHERE id=p_leader AND user_id=auth.uid() AND is_active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.guilds WHERE id=p_guild FOR UPDATE;RETURN p_guild;
END $$;

CREATE OR REPLACE FUNCTION guild_invite_private.leader_guild(p_leader uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN guild_invite_private.leader_guild(p_leader,guild_admin_private.only_guild(p_leader,true));END
$function$;

CREATE OR REPLACE FUNCTION guild_invite_private.create_invite(p_leader uuid, p_guild uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE guild_key uuid; raw_token text; new_row guild_invite_private.link_invites;
  issued_at timestamptz := clock_timestamp();
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes();
  guild_key := guild_invite_private.leader_guild(p_leader,p_guild);
  IF (SELECT count(*) FROM guild_invite_private.link_invites
      WHERE guild_id = guild_key AND revoked_at IS NULL AND expires_at > clock_timestamp()) >= 10 THEN
    RAISE EXCEPTION 'Active invite limit reached' USING ERRCODE = '54000';
  END IF;
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO guild_invite_private.link_invites(guild_id, leader_traveler_id, token_hash, created_at, expires_at)
    VALUES (guild_key, p_leader, extensions.digest(raw_token, 'sha256'), issued_at, issued_at + interval '7 days')
    RETURNING * INTO new_row;
  RETURN jsonb_build_object('id', new_row.id, 'token', raw_token, 'expires_at', new_row.expires_at);
END $function$;

CREATE OR REPLACE FUNCTION guild_invite_private.create_invite(p_leader uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN guild_invite_private.create_invite(p_leader,guild_admin_private.only_guild(p_leader,true));END
$function$;

CREATE OR REPLACE FUNCTION guild_invite_private.list_invites(p_leader uuid, p_guild uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE guild_key uuid;
BEGIN
  guild_key := guild_invite_private.leader_guild(p_leader,p_guild);
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(v)) FROM (
    SELECT id, created_at, expires_at, revoked_at FROM guild_invite_private.link_invites
    WHERE guild_id = guild_key ORDER BY created_at DESC LIMIT 50
  ) v), '[]'::jsonb);
END $function$;

CREATE OR REPLACE FUNCTION guild_invite_private.list_invites(p_leader uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN guild_invite_private.list_invites(p_leader,guild_admin_private.only_guild(p_leader,true));END
$function$;

CREATE OR REPLACE FUNCTION guild_invite_private.revoke_invite(p_id uuid, p_leader uuid, p_guild uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE guild_key uuid;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes();
  guild_key := guild_invite_private.leader_guild(p_leader,p_guild);
  UPDATE guild_invite_private.link_invites SET revoked_at = coalesce(revoked_at, clock_timestamp())
    WHERE id = p_id AND guild_id = guild_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE = 'P0002'; END IF;
END $function$;

CREATE OR REPLACE FUNCTION guild_invite_private.revoke_invite(p_id uuid, p_leader uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN PERFORM guild_invite_private.revoke_invite(p_id,p_leader,guild_admin_private.only_guild(p_leader,true));END
$function$;

CREATE OR REPLACE FUNCTION guild_invite_private.valid_invite(p_token text)
 RETURNS guild_invite_private.link_invites
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE invite_row guild_invite_private.link_invites;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invite unavailable' USING ERRCODE = 'P0002';
  END IF;
  SELECT i.* INTO invite_row FROM guild_invite_private.link_invites i
    JOIN public.guilds g ON g.id = i.guild_id
    JOIN public.guild_members gm ON gm.guild_id = g.id AND gm.traveler_id = i.leader_traveler_id
    WHERE i.token_hash = extensions.digest(p_token, 'sha256')
      AND i.revoked_at IS NULL AND i.expires_at > clock_timestamp()
      AND g.status = 'active' AND gm.role = 'leader' AND gm.status = 'active' AND guild_admin_private.leader_not_revoked(gm.traveler_id)
    FOR SHARE OF i, g, gm;
  -- A row lock can wait beyond expiry even when the WHERE matched before waiting.
  IF NOT FOUND OR invite_row.expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Invite unavailable' USING ERRCODE = 'P0002';
  END IF;
  RETURN invite_row;
END $function$;

CREATE OR REPLACE FUNCTION guild_invite_private.request_invite(p_token text, p_traveler uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE invite_row guild_invite_private.link_invites;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes();
  PERFORM guild_invite_private.require_account();
  invite_row := guild_invite_private.valid_invite(p_token);
  IF NOT public.owns_traveler(p_traveler) THEN
    RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501';
  END IF;
  -- Existing RPC creates/reuses a PENDING request; only its normal review may add membership.
  RETURN public.request_join_guild(invite_row.guild_id, p_traveler);
END $function$;

CREATE FUNCTION guild_admin_private.create_scoped_invite(p_actor uuid,p_guild uuid,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; signature text; prior guild_admin_private.audit; response jsonb; BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();
 actor:=guild_admin_private.active_actor(p_actor);PERFORM guild_admin_private.guild_role(p_actor,p_guild,true);
 IF p_request IS NULL THEN RAISE EXCEPTION 'Request required' USING ERRCODE='22023';END IF;
 signature:=encode(extensions.digest(jsonb_build_object('kind','scoped-invite','actor',p_actor,'guild',p_guild)::text,'sha256'),'hex');
 SELECT * INTO prior FROM guild_admin_private.audit WHERE actor_uid=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.payload_hash<>signature THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023';END IF;
  RETURN prior.result||jsonb_build_object('replayed',true,'token',NULL);
 END IF;
 response:=guild_invite_private.create_invite(p_actor,p_guild);
 INSERT INTO guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result)
 VALUES(actor,p_request,'guild_invite',p_guild,'Leader confirmed invitation for selected Guild',signature,response-'token');
 RETURN response||jsonb_build_object('replayed',false);
END $$;
CREATE FUNCTION public.guild_scoped_create_invite(p_actor uuid,p_guild uuid,p_request uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.create_scoped_invite(p_actor,p_guild,p_request) $$;

CREATE FUNCTION public.guild_scoped_list_invites(p_actor uuid,p_guild uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_invite_private.list_invites(p_actor,p_guild) $$;

CREATE FUNCTION public.guild_scoped_revoke_invite(p_id uuid,p_actor uuid,p_guild uuid) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_invite_private.revoke_invite(p_id,p_actor,p_guild) $$;

CREATE OR REPLACE FUNCTION public.create_guild(p_leader_traveler_id uuid, p_name text, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE id uuid:=gen_random_uuid(); BEGIN PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes(); PERFORM guild_admin_private.require_creation(p_leader_traveler_id);IF EXISTS(SELECT 1 FROM public.guild_members WHERE traveler_id=p_leader_traveler_id AND status='active') THEN RAISE EXCEPTION 'Explicit scoped creation required' USING ERRCODE='55000';END IF;PERFORM guild_admin_private.guild_command(p_leader_traveler_id,id,'create',id,gen_random_uuid(),jsonb_build_object('name',p_name,'description',COALESCE(p_description,'')));RETURN id;END
$function$;

CREATE OR REPLACE FUNCTION public.request_join_guild(p_guild_id uuid, p_traveler_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE result jsonb;BEGIN result:=guild_admin_private.guild_command(p_traveler_id,p_guild_id,'join',gen_random_uuid(),gen_random_uuid(),'{}'::jsonb);RETURN(result->>'id')::uuid;END
$function$;

CREATE OR REPLACE FUNCTION public.review_guild_join_request(p_request_id uuid, p_reviewer_traveler_id uuid, p_approve boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE g uuid;BEGIN PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes(); SELECT guild_id INTO g FROM public.guild_join_requests WHERE id=p_request_id;IF g IS NULL THEN RAISE EXCEPTION 'Request unavailable' USING ERRCODE='42501';END IF;PERFORM guild_admin_private.guild_command(p_reviewer_traveler_id,g,'review',p_request_id,gen_random_uuid(),jsonb_build_object('approve',p_approve));END
$function$;

CREATE OR REPLACE FUNCTION public.leave_guild(p_traveler_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes(); PERFORM guild_admin_private.guild_command(p_traveler_id,guild_admin_private.only_guild(p_traveler_id),'leave',p_traveler_id,gen_random_uuid(),'{}'::jsonb);END
$function$;

CREATE OR REPLACE FUNCTION public.remove_guild_member(p_member_traveler_id uuid, p_leader_traveler_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes(); PERFORM guild_admin_private.guild_command(p_leader_traveler_id,guild_admin_private.only_guild(p_leader_traveler_id,true),'remove',p_member_traveler_id,gen_random_uuid(),'{}'::jsonb);END
$function$;

CREATE OR REPLACE FUNCTION public.list_guild_members(p_requester_traveler_id uuid)
 RETURNS TABLE(traveler_id uuid, traveler_name text, role text, member_status text, joined_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN QUERY SELECT * FROM guild_admin_private.members(p_requester_traveler_id,guild_admin_private.only_guild(p_requester_traveler_id,false));END
$function$;

CREATE OR REPLACE FUNCTION public.list_guild_join_requests(p_leader_traveler_id uuid)
 RETURNS TABLE(request_id uuid, traveler_id uuid, traveler_name text, request_status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN QUERY SELECT * FROM guild_admin_private.requests(p_leader_traveler_id,guild_admin_private.only_guild(p_leader_traveler_id,true));END
$function$;

CREATE OR REPLACE FUNCTION public.guild_admin_stats(p_leader_traveler_id uuid)
 RETURNS TABLE(mission_id uuid, participants bigint, completed bigint, pending bigint, completed_recent bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 PERFORM guild_admin_private.only_guild(p_leader_traveler_id,true);
  IF NOT public.owns_traveler(p_leader_traveler_id) OR NOT EXISTS
    (SELECT 1 FROM public.guild_members WHERE traveler_id = p_leader_traveler_id AND role = 'leader' AND status = 'active')
  THEN RAISE EXCEPTION 'Leader role required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT m.id, count(p.id), count(p.id) FILTER (WHERE p.status = 'completed'),
    count(p.id) FILTER (WHERE p.status = 'pending_approval' AND EXISTS
      (SELECT 1 FROM public.guild_members participant WHERE participant.guild_id = m.guild_id
        AND participant.traveler_id = p.traveler_id AND participant.status = 'active')),
    count(p.id) FILTER (WHERE p.status = 'completed' AND p.completed_at >= now() - interval '30 days')
  FROM public.guild_missions m JOIN public.guild_members own ON own.guild_id = m.guild_id
  LEFT JOIN public.guild_mission_progress p ON p.mission_id = m.id
  WHERE own.traveler_id = p_leader_traveler_id AND own.role = 'leader' AND own.status = 'active'
    AND m.status <> 'cancelled' GROUP BY m.id;
END $function$;
REVOKE ALL ON FUNCTION guild_admin_private.require_writes(),guild_admin_private.leader_not_revoked(uuid),guild_admin_private.active_actor(uuid),guild_admin_private.guild_role(uuid,uuid,boolean),guild_admin_private.only_guild(uuid,boolean),guild_admin_private.require_creation(uuid),guild_invite_private.leader_guild(uuid,uuid),guild_admin_private.governance_command(text,uuid,uuid,jsonb),guild_admin_private.current_status(),guild_admin_private.contexts(uuid),guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb),guild_admin_private.members(uuid,uuid),guild_admin_private.requests(uuid,uuid),public.guild_scoped_contexts(uuid),public.guild_scoped_command(uuid,uuid,text,uuid,uuid,jsonb),public.guild_scoped_members(uuid,uuid),public.guild_scoped_requests(uuid,uuid),ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb),ebd_ops.workspace(uuid,uuid,integer),public.guild_scoped_ebd_workspace(uuid,uuid,integer),public.guild_scoped_ebd_command(uuid,uuid,text,uuid,integer,jsonb),guild_invite_private.create_invite(uuid,uuid),guild_invite_private.list_invites(uuid,uuid),guild_invite_private.revoke_invite(uuid,uuid,uuid),public.guild_scoped_create_invite(uuid,uuid,uuid),public.guild_scoped_list_invites(uuid,uuid),public.guild_scoped_revoke_invite(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_private.governance_command(text,uuid,uuid,jsonb),guild_admin_private.current_status(),guild_admin_private.contexts(uuid),guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb),guild_admin_private.members(uuid,uuid),guild_admin_private.requests(uuid,uuid),public.guild_scoped_contexts(uuid),public.guild_scoped_command(uuid,uuid,text,uuid,uuid,jsonb),public.guild_scoped_members(uuid,uuid),public.guild_scoped_requests(uuid,uuid),ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb),ebd_ops.workspace(uuid,uuid,integer),public.guild_scoped_ebd_workspace(uuid,uuid,integer),public.guild_scoped_ebd_command(uuid,uuid,text,uuid,integer,jsonb),guild_invite_private.create_invite(uuid,uuid),guild_invite_private.list_invites(uuid,uuid),guild_invite_private.revoke_invite(uuid,uuid,uuid),public.guild_scoped_create_invite(uuid,uuid,uuid),public.guild_scoped_list_invites(uuid,uuid),public.guild_scoped_revoke_invite(uuid,uuid,uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION guild_admin_private.command(text,uuid,uuid,jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.guild_scoped_status() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.guild_scoped_status() TO authenticated;
REVOKE ALL ON FUNCTION guild_admin_private.create_scoped_invite(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_private.create_scoped_invite(uuid,uuid,uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION guild_invite_private.create_invite(uuid,uuid) FROM authenticated;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.guild_members'::regclass AND contype='u' AND pg_get_constraintdef(oid)='UNIQUE (guild_id, traveler_id)') THEN RAISE EXCEPTION 'Guild/avatar uniqueness required';END IF;END $$;
DROP INDEX public.guild_members_one_active_guild_per_traveler_idx;
CREATE INDEX guild_members_active_traveler_idx ON public.guild_members(traveler_id,guild_id) WHERE status='active';
NOTIFY pgrst,'reload schema';
