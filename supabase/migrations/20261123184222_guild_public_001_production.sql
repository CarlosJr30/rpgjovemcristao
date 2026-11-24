SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $guard$ BEGIN
 IF current_setting('guild_public_001.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001'
 OR public.economy_protocol_version() IS DISTINCT FROM 3
 OR to_regclass('guild_admin_private.guild_creation_claims') IS NOT NULL
 THEN RAISE EXCEPTION 'Reviewed GUILD-PUBLIC-001 PRODUCTION scope required' USING ERRCODE='42501'; END IF;
 IF md5(replace(pg_get_functiondef('guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb)'::regprocedure),E'\r\n',E'\n')) <> '6a08e2bf098136540ee14de433ab3d8c'
 OR md5(replace(pg_get_functiondef('public.create_guild(uuid,text,text)'::regprocedure),E'\r\n',E'\n')) <> 'cc793fdc3e83b51047d9102ac231dba5'
 OR md5(replace(pg_get_functiondef('public.guild_scoped_command(uuid,uuid,text,uuid,uuid,jsonb)'::regprocedure),E'\r\n',E'\n')) <> '698c791ffb195dfa57b318609d450c6c'
 OR md5(replace(pg_get_functiondef('public.guild_scoped_status()'::regprocedure),E'\r\n',E'\n')) <> 'dad7cd79ac00cb19a3d509660f8c1605'
 THEN RAISE EXCEPTION 'Reviewed Guild command baseline required' USING ERRCODE='42501'; END IF;
 IF EXISTS (SELECT 1 FROM public.guilds g LEFT JOIN auth.users u ON u.id=g.created_by_user_id WHERE u.id IS NULL)
 THEN RAISE EXCEPTION 'Guild creator backfill has no Auth account' USING ERRCODE='23503'; END IF;
END $guard$;

CREATE TABLE guild_admin_private.guild_creation_claims (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 guild_id uuid NOT NULL UNIQUE REFERENCES public.guilds(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
 leader_traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
 request_id uuid,
 payload_hash text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK ((request_id IS NULL) = (payload_hash IS NULL))
);
CREATE INDEX guild_creation_claims_leader_idx
 ON guild_admin_private.guild_creation_claims(leader_traveler_id);
ALTER TABLE guild_admin_private.guild_creation_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON guild_admin_private.guild_creation_claims FROM PUBLIC,anon,authenticated,service_role;

-- Preserve historical ownership and consume the one-creation allowance for
-- every account that already created a Guild, without rewriting game data.
INSERT INTO guild_admin_private.guild_creation_claims(user_id,guild_id,leader_traveler_id)
SELECT DISTINCT ON (g.created_by_user_id) g.created_by_user_id,g.id,g.leader_traveler_id
FROM public.guilds g
ORDER BY g.created_by_user_id,g.created_at,g.id;

CREATE OR REPLACE FUNCTION guild_admin_private.require_creation(p_actor uuid) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=guild_admin_private.active_actor(p_actor); eligible boolean;
BEGIN
 SELECT (u.is_anonymous IS FALSE AND u.email_confirmed_at IS NOT NULL
   AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()))
 INTO eligible FROM auth.users u WHERE u.id=actor;
 IF eligible IS DISTINCT FROM true OR NOT guild_admin_private.leader_not_revoked(p_actor)
 THEN RAISE EXCEPTION 'Regular eligible account required for Guild creation' USING ERRCODE='42501'; END IF;
END $$;

CREATE FUNCTION guild_admin_private.require_public_creation(p_actor uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid;
BEGIN
 PERFORM guild_admin_private.require_creation(p_actor);
 actor:=guild_admin_private.account_uid();
 RETURN actor;
END $$;

CREATE FUNCTION guild_admin_private.claim_guild_creation(
 p_actor uuid,p_guild uuid,p_id uuid,p_request uuid,p_data jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; signature text; prior guild_admin_private.guild_creation_claims;
BEGIN
 actor:=guild_admin_private.require_public_creation(p_actor);
 signature:=encode(extensions.digest(jsonb_build_object(
   'kind','scoped-guild','actor',p_actor,'guild',p_guild,'action','create','id',p_id,'data',p_data
 )::text,'sha256'),'hex');
 INSERT INTO guild_admin_private.guild_creation_claims(user_id,guild_id,leader_traveler_id,request_id,payload_hash)
 VALUES(actor,p_guild,p_actor,p_request,signature) ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO prior FROM guild_admin_private.guild_creation_claims WHERE user_id=actor FOR UPDATE;
 IF prior.guild_id=p_guild AND prior.leader_traveler_id=p_actor
   AND prior.request_id=p_request AND prior.payload_hash=signature THEN RETURN; END IF;
 IF prior.request_id=p_request AND prior.request_id IS NOT NULL
 THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
 RAISE EXCEPTION 'Account has already created a Guild' USING ERRCODE='23505';
END $$;

CREATE FUNCTION guild_admin_private.scoped_command(
 p_actor uuid,p_guild uuid,p_action text,p_id uuid,p_request uuid,p_data jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_action='create' THEN
  PERFORM guild_admin_private.claim_guild_creation(p_actor,p_guild,p_id,p_request,p_data);
 END IF;
 RETURN guild_admin_private.guild_command(p_actor,p_guild,p_action,p_id,p_request,p_data);
END $$;

CREATE OR REPLACE FUNCTION public.guild_scoped_command(
 p_actor uuid,p_guild uuid,p_action text,p_id uuid,p_request uuid,p_data jsonb
) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT guild_admin_private.scoped_command(p_actor,p_guild,p_action,p_id,p_request,p_data)
$$;

CREATE OR REPLACE FUNCTION public.create_guild(
 p_leader_traveler_id uuid,p_name text,p_description text DEFAULT NULL::text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE id uuid:=gen_random_uuid(); BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 PERFORM guild_admin_private.require_writes();
 PERFORM guild_admin_private.scoped_command(p_leader_traveler_id,id,'create',id,gen_random_uuid(),
   jsonb_build_object('name',p_name,'description',COALESCE(p_description,'')));
 RETURN id;
END
$$;

CREATE FUNCTION guild_admin_private.creation_status(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; eligible boolean; has_created boolean; enabled boolean;
BEGIN
 actor:=guild_admin_private.active_actor(p_actor);
 SELECT (u.is_anonymous IS FALSE AND u.email_confirmed_at IS NOT NULL
   AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()))
   AND guild_admin_private.leader_not_revoked(p_actor)
 INTO eligible FROM auth.users u WHERE u.id=actor;
 SELECT EXISTS(SELECT 1 FROM guild_admin_private.guild_creation_claims c WHERE c.user_id=actor) INTO has_created;
 SELECT writes_enabled INTO enabled FROM guild_admin_private.multiguild_control WHERE singleton;
 RETURN jsonb_build_object('eligible',COALESCE(eligible,false),
   'canCreate',COALESCE(eligible,false) AND NOT has_created AND COALESCE(enabled,false),
   'hasCreated',has_created);
END $$;

CREATE FUNCTION public.guild_creation_status(p_actor uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT guild_admin_private.creation_status(p_actor)
$$;

REVOKE ALL ON FUNCTION guild_admin_private.require_public_creation(uuid),
 guild_admin_private.claim_guild_creation(uuid,uuid,uuid,uuid,jsonb),
 guild_admin_private.scoped_command(uuid,uuid,text,uuid,uuid,jsonb),
 guild_admin_private.creation_status(uuid),
 public.guild_scoped_command(uuid,uuid,text,uuid,uuid,jsonb),
 public.guild_creation_status(uuid)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_private.scoped_command(uuid,uuid,text,uuid,uuid,jsonb),
 guild_admin_private.creation_status(uuid),
 public.guild_scoped_command(uuid,uuid,text,uuid,uuid,jsonb),
 public.guild_creation_status(uuid)
 TO authenticated;
