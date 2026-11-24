SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';

DO $guard$ BEGIN
 IF (current_setting('guild_public_001.target_project',true) IS NOT NULL
     AND current_setting('guild_public_001.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg')
 OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR public.economy_protocol_version() IS DISTINCT FROM 3
 OR to_regclass('guild_admin_private.guild_creation_claims') IS NULL
 OR to_regclass('guild_admin_private.guild_creation_qa_permissions') IS NOT NULL
 THEN RAISE EXCEPTION 'Reviewed GUILD-QA-001 TEST scope required' USING ERRCODE='42501'; END IF;
END $guard$;

CREATE TABLE guild_admin_private.guild_creation_qa_permissions (
 account_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 permission_key text NOT NULL CHECK (permission_key='multiple_guild_creation'),
 granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 revoked_at timestamptz,
 grant_source text NOT NULL CHECK (grant_source='GUILD-QA-001')
);
ALTER TABLE guild_admin_private.guild_creation_qa_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON guild_admin_private.guild_creation_qa_permissions FROM PUBLIC,anon,authenticated,service_role;

-- In TEST this only seeds the approved account if that exact Auth identity exists.
INSERT INTO guild_admin_private.guild_creation_qa_permissions(account_id,permission_key,grant_source)
SELECT '78729453-8e04-478c-96ae-d37cead1bc8c'::uuid,'multiple_guild_creation','GUILD-QA-001'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id='78729453-8e04-478c-96ae-d37cead1bc8c'::uuid)
ON CONFLICT(account_id) DO NOTHING;

CREATE OR REPLACE FUNCTION guild_admin_private.claim_guild_creation(
 p_actor uuid,p_guild uuid,p_id uuid,p_request uuid,p_data jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; signature text; prior guild_admin_private.guild_creation_claims; qa_enabled boolean:=false;
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
 SELECT true INTO qa_enabled
 FROM guild_admin_private.guild_creation_qa_permissions q
 WHERE q.account_id=actor AND q.permission_key='multiple_guild_creation' AND q.revoked_at IS NULL
 FOR SHARE;
 IF COALESCE(qa_enabled,false) THEN RETURN; END IF;
 RAISE EXCEPTION 'Account has already created a Guild' USING ERRCODE='23505';
END $$;

CREATE OR REPLACE FUNCTION guild_admin_private.creation_status(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; eligible boolean; has_created boolean; enabled boolean; qa_enabled boolean;
BEGIN
 actor:=guild_admin_private.active_actor(p_actor);
 SELECT (u.is_anonymous IS FALSE AND u.email_confirmed_at IS NOT NULL
   AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()))
   AND guild_admin_private.leader_not_revoked(p_actor)
 INTO eligible FROM auth.users u WHERE u.id=actor;
 SELECT EXISTS(SELECT 1 FROM guild_admin_private.guild_creation_claims c WHERE c.user_id=actor) INTO has_created;
 SELECT EXISTS(SELECT 1 FROM guild_admin_private.guild_creation_qa_permissions q
   WHERE q.account_id=actor AND q.permission_key='multiple_guild_creation' AND q.revoked_at IS NULL)
 INTO qa_enabled;
 SELECT writes_enabled INTO enabled FROM guild_admin_private.multiguild_control WHERE singleton;
 RETURN jsonb_build_object('eligible',COALESCE(eligible,false),
   'canCreate',COALESCE(eligible,false) AND (COALESCE(qa_enabled,false) OR NOT has_created) AND COALESCE(enabled,false),
   'hasCreated',has_created);
END $$;
