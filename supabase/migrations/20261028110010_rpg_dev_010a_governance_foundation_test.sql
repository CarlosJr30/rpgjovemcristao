-- 010A.1 TEST foundation only. No initial grants, guild mutations or economics.
-- This does not yet replace single-guild legacy authorization paths.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN
  RAISE EXCEPTION '010A foundation requires reviewed TEST target';
 END IF;
 IF to_regnamespace('guild_admin_private') IS NOT NULL OR
    to_regprocedure('extensions.digest(text,text)') IS NULL OR
    to_regprocedure('extensions.gen_random_bytes(integer)') IS NULL OR
    to_regclass('public.guilds') IS NULL THEN RAISE EXCEPTION 'Unexpected governance baseline'; END IF;
END $$;

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
