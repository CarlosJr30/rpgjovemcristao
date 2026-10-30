-- 010B PRODUCTION: own guarded package. No bootstrap, data conversion, rewards or Auth/RLS weakening.
DO $prod_owner$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001'
 THEN RAISE EXCEPTION '010B requires reviewed production owner context'; END IF;
END $prod_owner$;
DO $prod_baseline$ DECLARE f jsonb; BEGIN
 FOR f IN SELECT value FROM jsonb_array_elements($manifest$[{"signature":"ebd_ops.command(uuid,text,uuid,integer,jsonb)","hash":"0f8f9a149fb216628855ffe0b3d396fe","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)","hash":"03780d57b32a22733dd0967807f51503","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.eligible(uuid,uuid)","hash":"c806a1810a3a3ea01cc859fdb7e89073","acl":["postgres=X/postgres"]},{"signature":"ebd_ops.manager(uuid,uuid,text)","hash":"f187285193d8dd606fad7167e88bb82f","acl":["postgres=X/postgres"]},{"signature":"ebd_ops.visible(uuid)","hash":"c1b7afd2fc8d4ceedb61e498a1edfcc3","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.workspace(uuid,integer)","hash":"caa883b030ba7047f8fae43beaff9c80","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.workspace(uuid,uuid,integer)","hash":"b4c8464bc7260145f8e0e36516dd7205","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_admin_private.active_actor(uuid)","hash":"05ae51c71fa24e9bcd40a14eaa8451b9","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb)","hash":"6a08e2bf098136540ee14de433ab3d8c","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_admin_private.guild_role(uuid,uuid,boolean)","hash":"69f1231558149c36917b3f6937472acb","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.leader_not_revoked(uuid)","hash":"9884a68d250d3cc744fd1b8fd2ef0891","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.require_writes()","hash":"7b0491ee6ef8b6c22e69624c4dab3920","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.create_invite(uuid,uuid)","hash":"d7988482b4ba947adf76defa90244781","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.create_invite(uuid)","hash":"75b4f6920e3eb1633877f7e18dfdfc08","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.leader_guild(uuid,uuid)","hash":"2b92affaf9330030152d7d72edcbb4d8","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.leader_guild(uuid)","hash":"664c2817e17d7f81a150666729aa8fd0","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.list_invites(uuid,uuid)","hash":"4c9a2f5b76392583d8394bf9dae0058f","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.list_invites(uuid)","hash":"a412f0c912093d68943393220c774c62","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.preview_invite(text)","hash":"ffdbc4b94ea8b16f17831143cdd76d0d","acl":["postgres=X/postgres","anon=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.request_invite(text,uuid)","hash":"9d05a55e759c336b0e6c66f9727cd8dd","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.require_account()","hash":"cfde5459971dd81d962919b22c42f546","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.resolve_invite(text)","hash":"7760d6621bb65994cc973416da70d523","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.revoke_invite(uuid,uuid,uuid)","hash":"9a48cdf57bb0d03171b445baf0d7652a","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.revoke_invite(uuid,uuid)","hash":"506b418be831941b3b7847d7a662940e","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.valid_invite(text)","hash":"5df49c92576e0c30c5dfc08ee4c10466","acl":["postgres=X/postgres"]}]$manifest$::jsonb) LOOP
 IF to_regprocedure(f->>'signature') IS NULL OR EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure(f->>'signature') AND
 (md5(pg_get_functiondef(p.oid))<>f->>'hash' OR to_jsonb(p.proacl) IS DISTINCT FROM f->'acl' OR pg_get_userbyid(p.proowner)<>'postgres'))
 THEN RAISE EXCEPTION '010B production function or ACL drift: %',f->>'signature'; END IF;
 END LOOP;
END $prod_baseline$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' OR to_regclass('ebd_class_private.classes') IS NULL
 OR to_regclass('ebd_class_private.invites') IS NOT NULL THEN RAISE EXCEPTION '010B common invitation baseline required'; END IF;
END $$;
CREATE TABLE ebd_class_private.invites(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),guild_id uuid NOT NULL REFERENCES public.guilds(id),
 class_id uuid,issuer_id uuid NOT NULL REFERENCES public.travelers(id),issuer_uid uuid NOT NULL REFERENCES auth.users(id),
 request_id uuid NOT NULL,signature text NOT NULL,token_hash bytea NOT NULL UNIQUE CHECK(octet_length(token_hash)=32),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),expires_at timestamptz NOT NULL,
 max_uses integer NOT NULL CHECK(max_uses BETWEEN 1 AND 100),use_count integer NOT NULL DEFAULT 0 CHECK(use_count BETWEEN 0 AND max_uses),
 revoked_at timestamptz,UNIQUE(issuer_uid,request_id),
 FOREIGN KEY(class_id,guild_id) REFERENCES ebd_class_private.classes(id,guild_id),
 CHECK(expires_at>created_at AND expires_at<=created_at+interval '30 days')
);
CREATE INDEX common_invites_guild_idx ON ebd_class_private.invites(guild_id,class_id,created_at DESC);
CREATE TABLE ebd_class_private.invite_history(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 invite_id uuid NOT NULL REFERENCES ebd_class_private.invites(id),guild_id uuid NOT NULL REFERENCES public.guilds(id),
 actor_id uuid NOT NULL REFERENCES public.travelers(id),action text NOT NULL CHECK(action IN('issued','revoked','accepted')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE ebd_class_private.invite_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ebd_class_private.invite_history FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ebd_class_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE ebd_class_private.invite_uses(
 invite_id uuid NOT NULL REFERENCES ebd_class_private.invites(id),traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 user_id uuid NOT NULL REFERENCES auth.users(id),request_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(invite_id,traveler_id),UNIQUE(user_id,request_id)
);
ALTER TABLE ebd_class_private.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebd_class_private.invite_uses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ebd_class_private.invites,ebd_class_private.invite_uses FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION ebd_class_private.inviter(p_actor uuid,p_guild uuid,p_class uuid) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r text; BEGIN
 r:=guild_admin_private.guild_role(p_actor,p_guild);
 IF p_class IS NULL THEN
 IF r<>'leader' THEN RAISE EXCEPTION 'Guild leadership required' USING ERRCODE='42501'; END IF;
 ELSE
 r:=ebd_class_private.role(p_actor,p_guild,p_class);
 IF r NOT IN('leader','teacher') THEN RAISE EXCEPTION 'Class invitation permission required' USING ERRCODE='42501'; END IF;
 END IF;
END $$;
CREATE FUNCTION ebd_class_private.invite_valid(p_invite ebd_class_private.invites) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_invite.id IS NOT NULL AND p_invite.revoked_at IS NULL AND p_invite.expires_at>clock_timestamp()
 AND EXISTS(SELECT 1 FROM public.guilds g JOIN public.guild_members gm ON gm.guild_id=g.id AND gm.traveler_id=p_invite.issuer_id AND gm.status='active'
 JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id
 WHERE g.id=p_invite.guild_id AND g.status='active' AND u.is_anonymous IS FALSE AND u.deleted_at IS NULL
 AND ((gm.role='leader' AND g.leader_traveler_id=p_invite.issuer_id AND guild_admin_private.leader_not_revoked(p_invite.issuer_id))
 OR (p_invite.class_id IS NOT NULL AND EXISTS(SELECT 1 FROM ebd_class_private.teachers et WHERE et.class_id=p_invite.class_id AND et.traveler_id=p_invite.issuer_id AND et.active))))
 AND(p_invite.class_id IS NULL OR EXISTS(SELECT 1 FROM ebd_class_private.classes WHERE id=p_invite.class_id AND guild_id=p_invite.guild_id AND status='active'))
$$;
CREATE FUNCTION ebd_class_private.invite_create(p_actor uuid,p_guild uuid,p_class uuid,p_request uuid,p_days integer,p_uses integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE owner_id uuid; signature_value text; i ebd_class_private.invites; token text; BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();
 owner_id:=guild_admin_private.active_actor(p_actor);PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
 IF p_class IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ebd_class_private.classes WHERE id=p_class AND guild_id=p_guild AND status='active')
 THEN RAISE EXCEPTION 'Active class required' USING ERRCODE='P0002'; END IF;
 IF p_request IS NULL OR p_days IS NULL OR p_days NOT BETWEEN 1 AND 30 OR p_uses IS NULL OR p_uses NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid invitation bounds' USING ERRCODE='22023'; END IF;
 signature_value:=encode(extensions.digest(jsonb_build_array(p_actor,p_guild,p_class,p_days,p_uses)::text,'sha256'),'hex');
 SELECT * INTO i FROM ebd_class_private.invites WHERE issuer_uid=owner_id AND request_id=p_request;
 IF FOUND THEN IF i.signature<>signature_value THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('id',i.id,'token',NULL,'expiresAt',i.expires_at,'replayed',true); END IF;
 IF (SELECT count(*) FROM ebd_class_private.invites WHERE guild_id=p_guild AND revoked_at IS NULL AND expires_at>clock_timestamp())>=100
 THEN RAISE EXCEPTION 'Active invitation limit reached' USING ERRCODE='54000'; END IF;
 token:=encode(extensions.gen_random_bytes(32),'hex');
 INSERT INTO ebd_class_private.invites(guild_id,class_id,issuer_id,issuer_uid,request_id,signature,token_hash,created_at,expires_at,max_uses)
 VALUES(p_guild,p_class,p_actor,owner_id,p_request,signature_value,extensions.digest(token,'sha256'),transaction_timestamp(),transaction_timestamp()+make_interval(days=>p_days),p_uses) RETURNING * INTO i;
 INSERT INTO ebd_class_private.invite_history(invite_id,guild_id,actor_id,action) VALUES(i.id,p_guild,p_actor,'issued');
 RETURN jsonb_build_object('id',i.id,'token',token,'expiresAt',i.expires_at,'replayed',false);
END $$;
CREATE FUNCTION ebd_class_private.invite_preview(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE i ebd_class_private.invites; BEGIN
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 SELECT * INTO i FROM ebd_class_private.invites WHERE token_hash=extensions.digest(p_token,'sha256');
 IF NOT ebd_class_private.invite_valid(i) OR i.use_count>=i.max_uses THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 RETURN jsonb_build_object('guildName',(SELECT name FROM public.guilds WHERE id=i.guild_id),'className',(SELECT name FROM ebd_class_private.classes WHERE id=i.class_id),'expiresAt',i.expires_at);
END $$;
CREATE FUNCTION ebd_class_private.invite_list(p_actor uuid,p_guild uuid,p_class uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'createdAt',created_at,'expiresAt',expires_at,'maxUses',max_uses,'uses',use_count,'revokedAt',revoked_at) ORDER BY created_at DESC,id)
 FROM ebd_class_private.invites WHERE guild_id=p_guild AND class_id IS NOT DISTINCT FROM p_class),'[]'::jsonb);
END $$;
CREATE FUNCTION ebd_class_private.invite_revoke(p_actor uuid,p_guild uuid,p_class uuid,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
 IF NOT EXISTS(SELECT 1 FROM ebd_class_private.invites WHERE id=p_id AND guild_id=p_guild AND class_id IS NOT DISTINCT FROM p_class) THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 UPDATE ebd_class_private.invites SET revoked_at=clock_timestamp() WHERE id=p_id AND revoked_at IS NULL;
 IF FOUND THEN INSERT INTO ebd_class_private.invite_history(invite_id,guild_id,actor_id,action) VALUES(p_id,p_guild,p_actor,'revoked'); END IF;
 RETURN jsonb_build_object('id',p_id,'revoked',true);
END $$;
CREATE FUNCTION ebd_class_private.invite_accept(p_token text,p_actor uuid,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE owner_id uuid; i ebd_class_private.invites; prior ebd_class_private.invite_uses; m public.guild_members; response jsonb; BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();owner_id:=guild_admin_private.active_actor(p_actor);
 IF p_request IS NULL OR p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 SELECT * INTO i FROM ebd_class_private.invites WHERE token_hash=extensions.digest(p_token,'sha256') FOR UPDATE;
 IF NOT ebd_class_private.invite_valid(i) THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 IF EXISTS(SELECT 1 FROM ebd_class_private.invite_uses WHERE user_id=owner_id AND request_id=p_request AND (invite_id<>i.id OR traveler_id<>p_actor))
 THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
 SELECT * INTO prior FROM ebd_class_private.invite_uses WHERE invite_id=i.id AND traveler_id=p_actor;
 SELECT * INTO m FROM public.guild_members WHERE guild_id=i.guild_id AND traveler_id=p_actor FOR UPDATE;
 response:=jsonb_build_object('guildId',i.guild_id,'classId',i.class_id,'enrolled',true);
 IF prior.invite_id IS NOT NULL THEN
 IF m.status IS DISTINCT FROM 'active' OR (i.class_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ebd_class_private.members WHERE class_id=i.class_id AND traveler_id=p_actor AND status='active'))
 THEN RAISE EXCEPTION 'Enrollment no longer active' USING ERRCODE='42501'; END IF;
 RETURN response||jsonb_build_object('replayed',true);
 END IF;
 IF i.use_count>=i.max_uses THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 -- Never overwrite an existing privileged role. Reentry restores only ordinary membership.
 IF m.id IS NOT NULL AND m.status<>'active' AND m.role<>'member' THEN RAISE EXCEPTION 'Membership unavailable' USING ERRCODE='42501'; END IF;
 INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES(i.guild_id,p_actor,'member','active')
 ON CONFLICT(guild_id,traveler_id) DO UPDATE SET status='active',updated_at=clock_timestamp(),joined_at=clock_timestamp() WHERE guild_members.status<>'active';
 IF i.class_id IS NOT NULL THEN
 INSERT INTO ebd_class_private.members VALUES(i.class_id,p_actor,'active',1,clock_timestamp())
 ON CONFLICT(class_id,traveler_id) DO UPDATE SET status='active',revision=members.revision+1,updated_at=clock_timestamp() WHERE members.status<>'active';
 INSERT INTO ebd_class_private.history(guild_id,class_id,actor_id,action,target_id,after_value) VALUES(i.guild_id,i.class_id,p_actor,'invite_enrolled',p_actor,jsonb_build_object('inviteId',i.id,'status','active'));
 END IF;
 UPDATE ebd_class_private.invites SET use_count=use_count+1 WHERE id=i.id;
 INSERT INTO ebd_class_private.invite_uses VALUES(i.id,p_actor,owner_id,p_request,clock_timestamp());
 INSERT INTO ebd_class_private.invite_history(invite_id,guild_id,actor_id,action) VALUES(i.id,i.guild_id,p_actor,'accepted');
 RETURN response||jsonb_build_object('replayed',false);
END $$;
CREATE FUNCTION public.ebd_member_invite_create(p_actor uuid,p_guild uuid,p_class uuid,p_request uuid,p_days integer,p_uses integer) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_class_private.invite_create(p_actor,p_guild,p_class,p_request,p_days,p_uses) $$;
CREATE FUNCTION public.ebd_member_invite_preview(p_token text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_class_private.invite_preview(p_token) $$;
CREATE FUNCTION public.ebd_member_invite_list(p_actor uuid,p_guild uuid,p_class uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_class_private.invite_list(p_actor,p_guild,p_class) $$;
CREATE FUNCTION public.ebd_member_invite_revoke(p_actor uuid,p_guild uuid,p_class uuid,p_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_class_private.invite_revoke(p_actor,p_guild,p_class,p_id) $$;
CREATE FUNCTION public.ebd_member_invite_accept(p_token text,p_actor uuid,p_request uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_class_private.invite_accept(p_token,p_actor,p_request) $$;
DO $acl$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE
 (n.nspname='ebd_class_private' AND p.proname LIKE 'invite_%') OR (n.nspname='public' AND p.proname LIKE 'ebd_member_invite_%') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.signature::text NOT LIKE '%invite_valid(%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END IF;
 END LOOP;
END $acl$;
REVOKE ALL ON FUNCTION ebd_class_private.inviter(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA ebd_class_private TO anon;
GRANT EXECUTE ON FUNCTION public.ebd_member_invite_preview(text),ebd_class_private.invite_preview(text) TO anon;
