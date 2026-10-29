-- 010A production foundation: independent guarded package from the reviewed PROD baseline.
-- No account, bootstrap invocation, inferred privilege, game data or economic permission.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $production_baseline$ DECLARE f jsonb;BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001'
 OR public.economy_protocol_version() IS DISTINCT FROM 3
 OR (SELECT count(*) FROM supabase_migrations.schema_migrations)<>8
 OR to_regnamespace('guild_admin_private') IS NOT NULL
 OR to_regprocedure('extensions.digest(text,text)') IS NULL
 OR to_regprocedure('extensions.gen_random_bytes(integer)') IS NULL
 OR to_regclass('public.guild_members_one_active_guild_per_traveler_idx') IS NULL
 THEN RAISE EXCEPTION '010A production baseline differs; stop and renew preflight'; END IF;
 FOR f IN SELECT value FROM jsonb_array_elements($reviewed$[{"signature":"act_guild_mission_v2(uuid,uuid,text,text,uuid,integer)","md5":"9f2f28acc941f5ee2f189fa867518c64","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"add_coins(uuid,integer)","md5":"4677cb4595d0b56a00109a2ef900f5f3","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"apply_guild_mission_reward(uuid,uuid)","md5":"232ea0a6338e5fb5cfe3d2181196e74a","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"arena_authority_v3(uuid,uuid,text,jsonb)","md5":"787dd35d194e5ac994319d0a0d10e4bf","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"can_lead_mission(uuid)","md5":"77704241905569d0bece712ef9718db5","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"claim_chest_reward(uuid,text)","md5":"bdd77b09c607e2a57a8fe7d8fe5d4056","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"close_guild_mission(uuid,uuid)","md5":"73b9e8cf1242685c0a2c5731bd8a5d31","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"complete_story(uuid,text)","md5":"2c904c22407cdc499170a618756e9574","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"create_guild_link_invite(uuid)","md5":"fdab874eb2ac5a07b9678c375c553ab4","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"create_guild_mission(uuid,text,text,text,text,text,text,text,timestamp with time zone,timestamp with time zone,boolean,jsonb)","md5":"2567032a523bf80c29b78f6c39a50f8a","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"create_guild(uuid,text,text)","md5":"a4e6dce55600d8b48874a1fe51454d32","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"create_traveler(uuid,text,text,text,text,text,text)","md5":"a0b303dddbcfad7cc5bebe3cd98ccfad","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"delete_guild_mission_draft(uuid,uuid)","md5":"33f73c3ffd4cf3bae172cdeb1d928c1e","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.command(uuid,text,uuid,integer,jsonb)","md5":"b679670fd3fbb0fdc7f4b0209686beee","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.eligible(uuid,uuid)","md5":"c806a1810a3a3ea01cc859fdb7e89073","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.manager(uuid,uuid,text)","md5":"5fab4701a42eec47165ada5bc7cac9fc","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.visible(uuid)","md5":"c1b7afd2fc8d4ceedb61e498a1edfcc3","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"ebd_ops.workspace(uuid,integer)","md5":"a6dc1fc6a18f93bba0e28fb1952cc73e","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"economy_authority(uuid,uuid,text,jsonb)","md5":"ace12bdd263301de7784be0cf61a1f93","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.authority(uuid,uuid,text,jsonb)","md5":"5bbbea3a553414d49eaf76bf0c437274","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.base_authority(uuid,uuid,text,jsonb)","md5":"dfbdda1b79abdae9cb5e7ffba8bca421","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.chest(uuid,text,uuid,boolean)","md5":"861ae07c12487a3929c399896488a806","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.claim_phase_chest(uuid,text)","md5":"eb94e36626ab50a824709d611c2fe6b8","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.collection(uuid,uuid)","md5":"77791950c34168c84805aa740d42510d","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.create_traveler(uuid,text,text,text,text,text,text)","md5":"d85ef49ef62cf2471bab40600cc8dd74","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"economy_private.get_owned_cards(uuid)","md5":"79bf1771385ab3e021a3be45355b21da","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"economy_private.initial_journey()","md5":"5a8f2b1f4c200e976757efa7d6ab1444","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.initialize_journey()","md5":"1ec4814000b65da42b9db24290a4a18c","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.mark_new_traveler()","md5":"3634c29872d4ad3845a3c5194ee482e7","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.open_chest(uuid,text,uuid)","md5":"b272aee973ac7162769b1796f5bcddc2","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.protect_journey_checkpoint()","md5":"076bb9d9b481890acf2c03ec09277cd7","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_private.purchase_chest(uuid,text,uuid)","md5":"195383aedfac1b8d4ce0206ac4603dd4","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"economy_protocol_version()","md5":"6521c2be304140a5fff7bfcf4807ec77","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"get_owned_cards(uuid)","md5":"d71c7ab168db150dd8e8dfa345651c96","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"grant_traveler_chest(uuid,text,text,text)","md5":"da1479a0d4e869882e631c8ac8f14de9","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_activity_capture()","md5":"d1e554d37f93637c083ad32f0ac7ca85","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_stats(uuid)","md5":"81b93c05f99406fc68cbf330d835dede","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.actor(uuid,uuid)","md5":"fb90d0f5fdd1a0db953ff31d3d81edc5","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.can_access(uuid,boolean)","md5":"07783955c56f4866f7654f56e8b71979","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.mark_read(uuid,uuid,bigint)","md5":"d18c9d3ab04892b17a7ac5b96c471c1a","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.moderate(uuid,uuid,uuid,text,text)","md5":"68847aab2757b1addf38e859e996d3cd","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.report(uuid,uuid,uuid,text)","md5":"4b52f73a484a2bb9df9120cdb8758538","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.send(uuid,uuid,uuid,text,boolean)","md5":"a6ca1a6c16aa7eeac68bd2b730898bb6","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.summary(uuid,uuid)","md5":"fe833a897ca12ff9f689348d5e9e89fa","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_private.take_rate(text)","md5":"682527bc586091a5aac7a0e780b9b9f3","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_chat_summary(uuid,uuid)","md5":"eda2d829f05f452d63f79082f4bebfb4","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_ebd_command(uuid,text,uuid,integer,jsonb)","md5":"b1c72cafae45e24cdf0e69dc62c747d3","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_ebd_workspace(uuid,integer)","md5":"1a209d108eea56913864bda16d2497a1","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.create_invite(uuid)","md5":"897b1822e17b90dae9ed8519ea196502","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.leader_guild(uuid)","md5":"2ce883bff4adcac0ffe593d1899c5d34","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.list_invites(uuid)","md5":"7b9677b526325085d81fc8024bad22c5","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.preview_invite(text)","md5":"ffdbc4b94ea8b16f17831143cdd76d0d","acl":["postgres=X/postgres","anon=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.request_invite(text,uuid)","md5":"b07abe0020748f6e3b0980e417503af9","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.require_account()","md5":"cfde5459971dd81d962919b22c42f546","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.resolve_invite(text)","md5":"7760d6621bb65994cc973416da70d523","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.revoke_invite(uuid,uuid)","md5":"d302c30443070f2eff5b13ccbc3e9242","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_invite_private.valid_invite(text)","md5":"a207742c90374dbc473ed1cc858d6c93","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_lesson_activity_capture()","md5":"ab1bbde6ff98b3d4f36bcd7ecb59afac","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_mission_workspace(uuid,integer)","md5":"6aa545a9a8efaf577517483e17542b86","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_ops.actor(uuid,uuid,boolean)","md5":"0eec40ebf95e1af38f37dc0721baec30","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_ops.visible(uuid)","md5":"9d6b7933f614787ae50e837bf3b98105","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"guild_public_member_profile(uuid,uuid)","md5":"61455df1ffcb3a6c948c2bd622aec5ba","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"is_active_guild_member(uuid)","md5":"e11c238fde352f6b8db7f9dea8b87747","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"is_guild_leader(uuid)","md5":"608df78b6e184f5688c02f58a95e8cd0","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"leave_guild(uuid)","md5":"dcb89e35196e2a38f2d6293c7617bdb0","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"list_guild_join_requests(uuid)","md5":"1b8e52a91dd06ec2aba3778ca819ce33","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"list_guild_link_invites(uuid)","md5":"62553bc3d2baf21cb9b23c2fca69eb5d","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"list_guild_members(uuid)","md5":"8f3f459a59bcac491464c60d8087b342","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"list_guild_mission_progress(uuid,uuid)","md5":"cfa0763e0d9797cb7676256cfc02fa20","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"mark_guild_chat_read(uuid,uuid,bigint)","md5":"52447b7f54a211b28ab655b5680ff985","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"moderate_guild_chat_message(uuid,uuid,uuid,text,text)","md5":"4aabe3eb9b52edd72f79de96cda5ec56","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"open_chest(uuid,text,uuid)","md5":"2f4e6eeb3d4e1c2aa53cba4cbbc9f894","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"owns_traveler(uuid)","md5":"c443487901b0cb3033c64606d1051d10","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"preview_guild_link_invite(text)","md5":"36670f7044bc5c7f928ce82e318b67a6","acl":["postgres=X/postgres","authenticated=X/postgres","anon=X/postgres"],"owner":"postgres"},{"signature":"publish_guild_mission(uuid,uuid)","md5":"aa0fa1881e2ce72dfae6569dca9ba043","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"purchase_chest(uuid,text,uuid)","md5":"4a73ed902825e0093ad0cb103df57d44","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"release_ebd.no_new_rewards()","md5":"a4375ed58a25f6d22866e7b6e500c00b","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"release_scope()","md5":"5fa53382dafc3862552c2345b047e0ab","acl":["postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"owner":"postgres"},{"signature":"remove_guild_member(uuid,uuid)","md5":"b4dda05b59d23dc6cf994edd2fa0f21a","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"report_guild_chat_message(uuid,uuid,uuid,text)","md5":"53814455f90cd8a807803405c0c3ecd0","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"request_guild_link_invite(text,uuid)","md5":"81a4cddccfdc8e71c21b055194f49408","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"request_join_guild(uuid,uuid)","md5":"cf92693f47853e7f1c21cd6994bd90fb","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"resolve_guild_link_invite(text)","md5":"6e3ecd878587292ea2e186df16556351","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"review_guild_join_request(uuid,uuid,boolean)","md5":"62a3e95b075356ab85bcc53996539376","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"review_guild_mission_v2(uuid,uuid,integer,text,text,uuid)","md5":"91c961fc3849571fa09a162e1811140b","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"review_guild_mission_with_guidance(uuid,uuid,uuid,boolean,text)","md5":"63d10bd867a55e50d7f1efaad52556ca","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"review_guild_mission(uuid,uuid,uuid,boolean)","md5":"035dec8cefe3131c1c7981dc1719deb7","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"revoke_guild_link_invite(uuid,uuid)","md5":"550c188ecffc6330f63eaca9c1d02ab1","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"save_guild_lesson(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,text,timestamp with time zone,uuid,boolean)","md5":"2e597f0bcd73975dea4e640aca8fd4b2","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"save_guild_mission_v2(uuid,uuid,integer,jsonb)","md5":"3291d9c4dfc19f84310ddf11fe52841d","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"send_guild_chat_message(uuid,uuid,uuid,text,boolean)","md5":"c742ff24c494348b55e6e0888ea2b1f4","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"set_active_traveler(uuid)","md5":"c4a581433ff3a284c67bb5c475cad2ac","acl":["postgres=X/postgres","authenticated=X/postgres"],"owner":"postgres"},{"signature":"set_guild_lesson_status(uuid,uuid,text)","md5":"9fc72f82df689b448ce56629423a27e3","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"set_updated_at()","md5":"60e33fb4603325c841b1cee0424f89fe","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"spend_coins(uuid,integer)","md5":"9b197c1c4ff064de19554a1f74336bbc","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"start_guild_mission(uuid,uuid)","md5":"dcdba34df74919fdd75e8c6d4b49879f","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"story_private.refresh_progress()","md5":"c129cf0c364f6aecb1077f8a9ea4ec3e","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"submit_guild_mission(uuid,uuid,text)","md5":"1eaf9a0cc9b05c294374e77165d1e778","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"transition_guild_mission_v2(uuid,uuid,integer,text)","md5":"0f093249179d2444adc39410148fa616","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"update_guild_mission_draft(uuid,uuid,text,text,text,text,text,text,text,timestamp with time zone,timestamp with time zone)","md5":"1ae8d0698f46ae47aed124b69ff2fe23","acl":["postgres=X/postgres"],"owner":"postgres"}]$reviewed$::jsonb) LOOP
  IF to_regprocedure(f->>'signature') IS NULL THEN RAISE EXCEPTION 'Missing reviewed production function: %',f->>'signature';END IF;
  IF EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure(f->>'signature') AND
   (md5(pg_get_functiondef(p.oid))<>f->>'md5' OR to_jsonb(p.proacl) IS DISTINCT FROM nullif(f->'acl','null'::jsonb)
    OR pg_get_userbyid(p.proowner)<>f->>'owner')) THEN RAISE EXCEPTION 'Production function or ACL changed: %',f->>'signature';END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN('public','economy_private','story_private','guild_chat_private','guild_invite_private','ebd_ops','guild_ops','release_ebd')
 AND c.relkind='r' AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'Production RLS baseline differs';END IF;
END $production_baseline$;
CREATE SCHEMA guild_admin_private;
REVOKE ALL ON SCHEMA guild_admin_private FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE guild_admin_private.admin_grants(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 permissions text[] NOT NULL CHECK(cardinality(permissions) BETWEEN 1 AND 4
  AND array_position(permissions,NULL) IS NULL
  AND permissions <@ ARRAY['admins.manage','leadership.manage','guilds.read','audit.read']),
 active boolean NOT NULL,
 revision integer NOT NULL CHECK(revision>0),
 changed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX admin_grants_changed_by_idx ON guild_admin_private.admin_grants(changed_by);
CREATE TABLE guild_admin_private.leadership_invites(
 id uuid PRIMARY KEY,
 issuer_uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 target_uid uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 recipient_hash bytea NOT NULL CHECK(octet_length(recipient_hash)=32),
 token_hash bytea NOT NULL UNIQUE CHECK(octet_length(token_hash)=32),
 created_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 consumed_at timestamptz,
 CHECK(expires_at>created_at AND expires_at<=created_at+interval '7 days'),
 CHECK(consumed_at IS NULL OR(target_uid IS NOT NULL AND revoked_at IS NULL))
);
CREATE INDEX leadership_invites_issuer_idx ON guild_admin_private.leadership_invites(issuer_uid,created_at DESC);
CREATE INDEX leadership_invites_target_idx ON guild_admin_private.leadership_invites(target_uid);
CREATE TABLE guild_admin_private.leader_authorizations(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 invite_id uuid NOT NULL REFERENCES guild_admin_private.leadership_invites(id) ON DELETE RESTRICT,
 granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 granted_at timestamptz NOT NULL,
 revoked_at timestamptz,
 revision integer NOT NULL CHECK(revision>0)
);
CREATE INDEX leader_authorizations_invite_idx ON guild_admin_private.leader_authorizations(invite_id);
CREATE INDEX leader_authorizations_grantor_idx ON guild_admin_private.leader_authorizations(granted_by);
CREATE TABLE guild_admin_private.audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_uid uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 request_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN('bootstrap_admin','set_admin','issue_leadership','accept_leadership','revoke_invite','revoke_leadership')),
 resource_id uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 8 AND 500),
 payload_hash text NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'),
 result jsonb NOT NULL CHECK(jsonb_typeof(result)='object' AND octet_length(result::text)<=2048),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE NULLS NOT DISTINCT(actor_uid,request_id)
);
CREATE INDEX governance_audit_actor_idx ON guild_admin_private.audit(actor_uid,id DESC);
CREATE FUNCTION guild_admin_private.immutable_audit() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 RAISE EXCEPTION 'Governance audit is immutable' USING ERRCODE='42501';
END $$;
CREATE TRIGGER governance_audit_immutable BEFORE UPDATE OR DELETE ON guild_admin_private.audit
 FOR EACH ROW EXECUTE FUNCTION guild_admin_private.immutable_audit();
ALTER TABLE guild_admin_private.admin_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_admin_private.leadership_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_admin_private.leader_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_admin_private.audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA guild_admin_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA guild_admin_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION guild_admin_private.account_uid() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); BEGIN
 IF actor IS NULL OR COALESCE((auth.jwt()->>'is_anonymous')::boolean,true) OR NOT EXISTS(
  SELECT 1 FROM auth.users u WHERE u.id=actor AND u.is_anonymous IS FALSE
 ) THEN RAISE EXCEPTION 'Account required' USING ERRCODE='42501'; END IF;
 RETURN actor;
END $$;
CREATE FUNCTION guild_admin_private.allowed_permissions(p_permissions text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT p_permissions IS NOT NULL AND cardinality(p_permissions) BETWEEN 1 AND 4
 AND array_position(p_permissions,NULL) IS NULL
 AND p_permissions <@ ARRAY['admins.manage','leadership.manage','guilds.read','audit.read']
 AND cardinality(p_permissions)=(SELECT count(DISTINCT x) FROM unnest(p_permissions) x);
$$;
CREATE FUNCTION guild_admin_private.require_admin(p_permission text) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM guild_admin_private.admin_grants g
  WHERE g.user_id=guild_admin_private.account_uid() AND g.active AND p_permission=ANY(g.permissions)) THEN
  RAISE EXCEPTION 'Administrative permission required' USING ERRCODE='42501';
 END IF;
END $$;
CREATE FUNCTION guild_admin_private.exact_keys(p_data jsonb,p_keys text[]) RETURNS void
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$ BEGIN
 IF jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR
  (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(p_data) k) IS DISTINCT FROM
  (SELECT array_agg(k ORDER BY k) FROM unnest(p_keys) k) THEN
  RAISE EXCEPTION 'Unexpected command fields' USING ERRCODE='22023';
 END IF;
END $$;

-- Database owner only, not reachable through a public wrapper or client role.
-- Invocation still requires explicit owner authorization and verified normal-session UID.
CREATE FUNCTION guild_admin_private.bootstrap_admin(p_uid uuid,p_permissions text[],p_reason text,p_request uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL THEN
  RAISE EXCEPTION 'Protected database bootstrap required' USING ERRCODE='42501'; END IF;
 IF p_uid IS NULL OR p_request IS NULL OR p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 8 AND 500
  OR guild_admin_private.allowed_permissions(p_permissions) IS DISTINCT FROM true
  OR NOT 'admins.manage'=ANY(p_permissions) THEN RAISE EXCEPTION 'Invalid bootstrap' USING ERRCODE='22023'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 IF EXISTS(SELECT 1 FROM guild_admin_private.admin_grants) OR NOT EXISTS(
  SELECT 1 FROM auth.users WHERE id=p_uid AND is_anonymous IS FALSE AND email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Bootstrap unavailable' USING ERRCODE='55000'; END IF;
 INSERT INTO guild_admin_private.admin_grants(user_id,permissions,active,revision) VALUES(p_uid,p_permissions,true,1);
 INSERT INTO guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result)
 VALUES(NULL,p_request,'bootstrap_admin',p_uid,btrim(p_reason),encode(extensions.digest(jsonb_build_object(
  'uid',p_uid,'permissions',p_permissions,'reason',btrim(p_reason))::text,'sha256'),'hex'),
  jsonb_build_object('revision',1,'active',true,'permissions',p_permissions));
END $$;

CREATE FUNCTION guild_admin_private.status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=guild_admin_private.account_uid(); permissions text[]; leader_status text; BEGIN
 SELECT g.permissions INTO permissions FROM guild_admin_private.admin_grants g WHERE g.user_id=actor AND g.active;
 SELECT CASE WHEN revoked_at IS NULL THEN 'active' ELSE 'revoked' END INTO leader_status
  FROM guild_admin_private.leader_authorizations WHERE user_id=actor;
 RETURN jsonb_build_object('version',1,'administrator',permissions IS NOT NULL,
  'permissions',COALESCE(permissions,'{}'::text[]),'leadership',COALESCE(leader_status,'none'),
  'multiGuildReady',false,'canCreateAdditionalGuilds',false,'economicRewardsEnabled',false);
END $$;

CREATE FUNCTION guild_admin_private.command(p_action text,p_id uuid,p_request uuid,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=guild_admin_private.account_uid(); permission text; signature text; prior guild_admin_private.audit;
 inv guild_admin_private.leadership_invites; previous_grant guild_admin_private.admin_grants; response jsonb; secret text; email_value text;
 recipient uuid; permission_list text[]; my_permissions text[]; reason text; revision_value integer;
 active_value boolean; issued_at timestamptz; days_value integer;
BEGIN
 IF p_action IS NULL OR p_action NOT IN('set_admin','issue_leadership','accept_leadership','revoke_invite','revoke_leadership')
  OR p_id IS NULL OR p_request IS NULL OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>4096 THEN
  RAISE EXCEPTION 'Invalid governance command' USING ERRCODE='22023'; END IF;
 permission:=CASE WHEN p_action='set_admin' THEN 'admins.manage' ELSE 'leadership.manage' END;
 IF p_action<>'accept_leadership' THEN PERFORM guild_admin_private.require_admin(permission); END IF;
 -- All grant changes and invitation consumption share one lock; revocation is fresh, not a JWT claim.
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 IF p_action<>'accept_leadership' THEN PERFORM guild_admin_private.require_admin(permission); END IF;
 signature:=encode(extensions.digest(jsonb_build_object('action',p_action,'id',p_id,'data',p_data)::text,'sha256'),'hex');
 SELECT * INTO prior FROM guild_admin_private.audit WHERE actor_uid=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.payload_hash<>signature THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
  RETURN prior.result||jsonb_build_object('replayed',true,'token',NULL);
 END IF;
 IF p_action='accept_leadership' THEN
  PERFORM guild_admin_private.exact_keys(p_data,ARRAY['token','travelerId']);
  IF jsonb_typeof(p_data->'token') IS DISTINCT FROM 'string' OR (p_data->>'token') !~ '^[a-f0-9]{64}$'
   OR jsonb_typeof(p_data->'travelerId') IS DISTINCT FROM 'string'
   OR (p_data->>'travelerId') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
  PERFORM 1 FROM public.travelers WHERE id=(p_data->>'travelerId')::uuid AND user_id=actor AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501'; END IF;
  SELECT * INTO inv FROM guild_admin_private.leadership_invites WHERE id=p_id
   AND token_hash=extensions.digest(p_data->>'token','sha256') FOR UPDATE;
  IF NOT FOUND OR inv.revoked_at IS NOT NULL OR inv.consumed_at IS NOT NULL OR inv.expires_at<=clock_timestamp()
   OR NOT EXISTS(SELECT 1 FROM guild_admin_private.admin_grants WHERE user_id=inv.issuer_uid
    AND active AND 'leadership.manage'=ANY(permissions)) THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
  SELECT lower(u.email) INTO email_value FROM auth.users u WHERE u.id=actor AND u.email_confirmed_at IS NOT NULL FOR SHARE;
  IF email_value IS NULL OR extensions.digest('email:'||email_value,'sha256')<>inv.recipient_hash
   OR(inv.target_uid IS NOT NULL AND inv.target_uid<>actor)
   OR (SELECT count(*) FROM auth.users WHERE lower(email)=email_value)<>1 THEN
   RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
  UPDATE guild_admin_private.leadership_invites SET target_uid=actor,consumed_at=clock_timestamp() WHERE id=p_id;
  INSERT INTO guild_admin_private.leader_authorizations(user_id,invite_id,granted_by,granted_at,revision)
   VALUES(actor,p_id,inv.issuer_uid,clock_timestamp(),1)
   ON CONFLICT(user_id) DO UPDATE SET invite_id=excluded.invite_id,granted_by=excluded.granted_by,
    granted_at=excluded.granted_at,revoked_at=NULL,revision=leader_authorizations.revision+1
   RETURNING revision INTO revision_value;
  reason:='Authenticated recipient accepted leadership invitation';
  response:=jsonb_build_object('id',p_id,'revision',revision_value,'status','accepted','legacyGuildsChanged',false);
 ELSE
  reason:=p_data->>'reason';
  IF jsonb_typeof(p_data->'reason') IS DISTINCT FROM 'string' OR length(btrim(reason)) NOT BETWEEN 8 AND 500
   OR reason ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Administrative reason required' USING ERRCODE='22023'; END IF;
  IF p_action='issue_leadership' THEN
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['recipientEmail','expiresInDays','reason']);
   email_value:=lower(btrim(p_data->>'recipientEmail'));
   IF jsonb_typeof(p_data->'recipientEmail') IS DISTINCT FROM 'string' OR length(email_value)>254
    OR email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR jsonb_typeof(p_data->'expiresInDays') IS DISTINCT FROM 'number' OR (p_data->>'expiresInDays') !~ '^[1-7]$' THEN
    RAISE EXCEPTION 'Invalid recipient or expiry' USING ERRCODE='22023'; END IF;
   IF (SELECT count(*) FROM auth.users WHERE lower(email)=email_value)>1 THEN RAISE EXCEPTION 'Recipient unavailable' USING ERRCODE='22023'; END IF;
   SELECT id INTO recipient FROM auth.users WHERE lower(email)=email_value;
   days_value:=(p_data->>'expiresInDays')::integer;issued_at:=clock_timestamp();secret:=encode(extensions.gen_random_bytes(32),'hex');
   INSERT INTO guild_admin_private.leadership_invites(id,issuer_uid,target_uid,recipient_hash,token_hash,created_at,expires_at)
    VALUES(p_id,actor,recipient,extensions.digest('email:'||email_value,'sha256'),extensions.digest(secret,'sha256'),issued_at,issued_at+days_value*interval '1 day');
   response:=jsonb_build_object('id',p_id,'kind','leadership','expiresAt',issued_at+days_value*interval '1 day');
  ELSIF p_action='revoke_invite' THEN
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['reason']);
   UPDATE guild_admin_private.leadership_invites SET revoked_at=COALESCE(revoked_at,clock_timestamp())
    WHERE id=p_id AND consumed_at IS NULL RETURNING * INTO inv;
   IF NOT FOUND THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
   response:=jsonb_build_object('id',p_id,'status','revoked');
  ELSIF p_action='revoke_leadership' THEN
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['reason']);
   UPDATE guild_admin_private.leader_authorizations SET revoked_at=COALESCE(revoked_at,clock_timestamp()),revision=revision+1
    WHERE user_id=p_id RETURNING revision INTO revision_value;
   IF NOT FOUND THEN RAISE EXCEPTION 'Authorization unavailable' USING ERRCODE='P0002'; END IF;
   response:=jsonb_build_object('id',p_id,'revision',revision_value,'status','revoked','legacyGuildsChanged',false);
  ELSE
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['permissions','active','reason']);
   IF jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'permissions') IS DISTINCT FROM 'array'
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_data->'permissions') x WHERE jsonb_typeof(x)<>'string') THEN
    RAISE EXCEPTION 'Invalid administrative grant' USING ERRCODE='22023'; END IF;
   SELECT array_agg(value ORDER BY value) INTO permission_list FROM jsonb_array_elements_text(p_data->'permissions');
   SELECT permissions INTO my_permissions FROM guild_admin_private.admin_grants WHERE user_id=actor AND active;
   active_value:=(p_data->>'active')::boolean;
   SELECT * INTO previous_grant FROM guild_admin_private.admin_grants WHERE user_id=p_id;
   IF active_value THEN
    IF guild_admin_private.allowed_permissions(permission_list) IS DISTINCT FROM true OR NOT permission_list <@ my_permissions
     OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_id AND is_anonymous IS FALSE AND email_confirmed_at IS NOT NULL) THEN
     RAISE EXCEPTION 'Invalid administrative grant' USING ERRCODE='22023'; END IF;
   ELSE
    IF previous_grant.user_id IS NULL THEN RAISE EXCEPTION 'Administrative grant unavailable' USING ERRCODE='P0002'; END IF;
    IF permission_list IS NOT NULL AND guild_admin_private.allowed_permissions(permission_list) IS DISTINCT FROM true THEN
     RAISE EXCEPTION 'Invalid administrative permissions' USING ERRCODE='22023'; END IF;
    -- Revocation preserves the previous permission set, rather than granting or rewriting it.
    permission_list:=previous_grant.permissions;
   END IF;
   IF p_id=actor AND(NOT active_value OR NOT 'admins.manage'=ANY(permission_list)) AND NOT EXISTS(
    SELECT 1 FROM guild_admin_private.admin_grants WHERE user_id<>actor AND active AND 'admins.manage'=ANY(permissions)
   ) THEN RAISE EXCEPTION 'Last administrative manager cannot be removed' USING ERRCODE='55000'; END IF;
   INSERT INTO guild_admin_private.admin_grants(user_id,permissions,active,revision,changed_by)
    VALUES(p_id,permission_list,active_value,1,actor)
    ON CONFLICT(user_id) DO UPDATE SET permissions=excluded.permissions,active=excluded.active,
     revision=admin_grants.revision+1,changed_by=actor,changed_at=clock_timestamp()
    RETURNING revision INTO revision_value;
   response:=jsonb_build_object('id',p_id,'revision',revision_value,'active',active_value,
    'before',jsonb_build_object('permissions',COALESCE(previous_grant.permissions,'{}'::text[]),
     'active',COALESCE(previous_grant.active,false),'revision',COALESCE(previous_grant.revision,0)),
    'after',jsonb_build_object('permissions',permission_list,'active',active_value,'revision',revision_value));
  END IF;
 END IF;
 INSERT INTO guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result)
  VALUES(actor,p_request,p_action,p_id,btrim(reason),signature,response);
 RETURN response||CASE WHEN secret IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('token',secret) END||jsonb_build_object('replayed',false);
END $$;

CREATE FUNCTION guild_admin_private.preview(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE inv guild_admin_private.leadership_invites; BEGIN
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 SELECT * INTO inv FROM guild_admin_private.leadership_invites WHERE token_hash=extensions.digest(p_token,'sha256');
 IF NOT FOUND OR inv.revoked_at IS NOT NULL OR inv.consumed_at IS NOT NULL OR inv.expires_at<=clock_timestamp()
  OR NOT EXISTS(SELECT 1 FROM guild_admin_private.admin_grants WHERE user_id=inv.issuer_uid
   AND active AND 'leadership.manage'=ANY(permissions)) THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 RETURN jsonb_build_object('id',inv.id,'kind','leadership','expiresAt',inv.expires_at);
END $$;

CREATE FUNCTION guild_admin_private.workspace(p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM guild_admin_private.require_admin('guilds.read');
 IF p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('version',1,'guilds',COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM(
  SELECT g.id,g.name,g.status,t.name leader_alias,(SELECT count(*) FROM public.guild_members m WHERE m.guild_id=g.id AND m.status='active') members
   FROM public.guilds g JOIN public.travelers t ON t.id=g.leader_traveler_id ORDER BY g.created_at DESC,g.id LIMIT 25 OFFSET p_offset
 )x),'[]'::jsonb),'invitations',COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM(
  SELECT id,created_at,expires_at,revoked_at,consumed_at FROM guild_admin_private.leadership_invites ORDER BY created_at DESC,id LIMIT 25 OFFSET p_offset
 )x),'[]'::jsonb));
END $$;
CREATE FUNCTION guild_admin_private.history(p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM guild_admin_private.require_admin('audit.read');
 IF p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT id,action,reason,created_at,resource_id FROM guild_admin_private.audit ORDER BY id DESC LIMIT 25 OFFSET p_offset)x),'[]'::jsonb);
END $$;

CREATE FUNCTION public.guild_governance_status() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.status() $$;
CREATE FUNCTION public.guild_governance_command(p_action text,p_id uuid,p_request uuid,p_data jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.command(p_action,p_id,p_request,p_data) $$;
CREATE FUNCTION public.guild_leadership_preview(p_token text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.preview(p_token) $$;
CREATE FUNCTION public.guild_governance_workspace(p_offset integer DEFAULT 0) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.workspace(p_offset) $$;
CREATE FUNCTION public.guild_governance_history(p_offset integer DEFAULT 0) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.history(p_offset) $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA guild_admin_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.guild_governance_status(),public.guild_governance_command(text,uuid,uuid,jsonb),public.guild_leadership_preview(text),public.guild_governance_workspace(integer),public.guild_governance_history(integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA guild_admin_private TO authenticated,anon;
GRANT EXECUTE ON FUNCTION guild_admin_private.status(),guild_admin_private.command(text,uuid,uuid,jsonb),guild_admin_private.workspace(integer),guild_admin_private.history(integer),public.guild_governance_status(),public.guild_governance_command(text,uuid,uuid,jsonb),public.guild_governance_workspace(integer),public.guild_governance_history(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION guild_admin_private.preview(text),public.guild_leadership_preview(text) TO authenticated,anon;
NOTIFY pgrst,'reload schema';
