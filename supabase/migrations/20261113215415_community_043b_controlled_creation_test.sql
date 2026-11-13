-- TEST ONLY. PR53 dependency unresolved: remote application is not authorized.
DO $$ BEGIN
 IF current_setting('rpg.community043b.install',true) IS DISTINCT FROM 'local-test'
 OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 THEN RAISE EXCEPTION 'Explicit local/TEST installation required'; END IF;
END $$;
-- LOCAL/TEST candidate. Not approved for remote application.
-- Existing governance functions, invitations and rows remain intact.
ALTER TABLE guild_admin_private.multiguild_control
 ADD COLUMN community_creation_enabled boolean NOT NULL DEFAULT false,
 ADD COLUMN community_environment text NOT NULL DEFAULT 'disabled'
 CHECK (community_environment IN ('disabled','local','test'));

CREATE FUNCTION guild_admin_private.community_quota_contract() RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT '{"createdPerAccount":1,"membershipsPerAvatar":5,"membersPerGuild":50,"activeLinks":10,"linkDays":30,"linkUses":50,"individualInvitesPerDay":20,"requestsPerAccountPerDay":5,"pendingPerAvatarGuild":1,"rejectionHours":24,"renameDays":7}'::jsonb
$$;

CREATE FUNCTION guild_admin_private.community_actor(p_actor uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; session_value uuid; BEGIN
 actor:=guild_admin_private.active_actor(p_actor);
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR NOT EXISTS(SELECT 1 FROM guild_admin_private.multiguild_control
  WHERE singleton AND writes_enabled AND community_creation_enabled AND community_environment IN ('local','test'))
 THEN RAISE EXCEPTION 'Controlled creation unavailable' USING ERRCODE='55000'; END IF;
 PERFORM 1 FROM auth.users WHERE id=actor AND is_anonymous IS FALSE
  AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL
  AND (banned_until IS NULL OR banned_until<=clock_timestamp()) FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Eligible confirmed account required' USING ERRCODE='42501'; END IF;
 session_value:=NULLIF(auth.jwt()->>'session_id','')::uuid;
 PERFORM 1 FROM auth.sessions WHERE id=session_value AND user_id=actor
  AND (not_after IS NULL OR not_after>clock_timestamp()) FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND user_id=actor AND is_active FOR SHARE;
 IF NOT FOUND OR NOT guild_admin_private.leader_not_revoked(p_actor)
 THEN RAISE EXCEPTION 'Eligible active avatar required' USING ERRCODE='42501'; END IF;
 RETURN actor;
END $$;

CREATE FUNCTION guild_admin_private.create_own_guild(p_actor uuid,p_request uuid,p_name text,p_description text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; signature text; prior guild_admin_private.audit; new_id uuid; response jsonb;
BEGIN
 -- Same lock order as current administrative writers and revocations.
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 actor:=guild_admin_private.community_actor(p_actor);
 IF p_request IS NULL OR p_name IS NULL OR p_description IS NULL
  OR length(btrim(p_name)) NOT BETWEEN 2 AND 60 OR length(p_description)>500
  OR p_name ~ '[[:cntrl:]]' OR p_description ~ '[[:cntrl:]]'
 THEN RAISE EXCEPTION 'Invalid Guild data' USING ERRCODE='22023'; END IF;
 signature:=encode(extensions.digest(jsonb_build_object('kind','community-own-create-v1','actor',p_actor,
  'name',p_name,'description',p_description)::text,'sha256'),'hex');
 SELECT * INTO prior FROM guild_admin_private.audit WHERE actor_uid=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.payload_hash<>signature THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
  RETURN prior.result||jsonb_build_object('replayed',true);
 END IF;
 -- Existing ledger is the marker; no new deletion or retention policy is imposed.
 IF EXISTS(SELECT 1 FROM public.guilds WHERE created_by_user_id=actor)
  OR EXISTS(SELECT 1 FROM guild_admin_private.audit WHERE actor_uid=actor AND action='guild_create')
 THEN RAISE EXCEPTION 'Account already created a Guild' USING ERRCODE='23505'; END IF;
 IF (SELECT count(*) FROM public.guild_members WHERE traveler_id=p_actor AND status='active')>=5
 THEN RAISE EXCEPTION 'Avatar membership limit reached' USING ERRCODE='54000'; END IF;
 new_id:=gen_random_uuid();
 INSERT INTO public.guilds(id,name,description,created_by_user_id,leader_traveler_id)
 VALUES(new_id,btrim(p_name),NULLIF(btrim(p_description),''),actor,p_actor);
 INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES(new_id,p_actor,'leader','active');
 response:=jsonb_build_object('id',new_id,'status','created','version',1);
 INSERT INTO guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result)
 VALUES(actor,p_request,'guild_create',new_id,'Controlled creation of own private Guild',signature,response);
 RETURN response||jsonb_build_object('replayed',false);
END $$;

CREATE FUNCTION public.community_create_own_guild(p_actor uuid,p_request uuid,p_name text,p_description text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT guild_admin_private.create_own_guild(p_actor,p_request,p_name,p_description)
$$;
REVOKE ALL ON FUNCTION guild_admin_private.community_quota_contract(),guild_admin_private.community_actor(uuid),
 guild_admin_private.create_own_guild(uuid,uuid,text,text),public.community_create_own_guild(uuid,uuid,text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_private.create_own_guild(uuid,uuid,text,text),
 public.community_create_own_guild(uuid,uuid,text,text) TO authenticated;
