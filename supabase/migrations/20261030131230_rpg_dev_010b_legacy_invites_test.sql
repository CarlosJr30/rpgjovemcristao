-- TEST only. Make existing valid member links automatic without rewriting history or authentication.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $guard$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' OR to_regclass('ebd_class_private.legacy_uses') IS NOT NULL THEN RAISE EXCEPTION 'Reviewed 010B TEST legacy baseline required'; END IF;
 IF md5(pg_get_functiondef('ebd_class_private.invite_accept(text,uuid,uuid)'::regprocedure)) IS DISTINCT FROM '62020d0db56b6caf1727dfc7e961862c' THEN RAISE EXCEPTION '010B legacy function baseline mismatch'; END IF;
 IF md5(pg_get_functiondef('ebd_class_private.invite_list(uuid,uuid,uuid)'::regprocedure)) IS DISTINCT FROM '59974223c2330073f8d27e80d6dd30cb' THEN RAISE EXCEPTION '010B legacy function baseline mismatch'; END IF;
 IF md5(pg_get_functiondef('ebd_class_private.invite_preview(text)'::regprocedure)) IS DISTINCT FROM 'ead77c35b8edb221e4a2347b7afdac78' THEN RAISE EXCEPTION '010B legacy function baseline mismatch'; END IF;
 IF md5(pg_get_functiondef('ebd_class_private.invite_revoke(uuid,uuid,uuid,uuid)'::regprocedure)) IS DISTINCT FROM '97696abe22a8f34e9b9db54fb6728846' THEN RAISE EXCEPTION '010B legacy function baseline mismatch'; END IF;
 IF md5(pg_get_functiondef('guild_invite_private.request_invite(text,uuid)'::regprocedure)) IS DISTINCT FROM '9d05a55e759c336b0e6c66f9727cd8dd' THEN RAISE EXCEPTION '010B legacy function baseline mismatch'; END IF;
 IF md5(pg_get_functiondef('guild_invite_private.revoke_invite(uuid,uuid,uuid)'::regprocedure)) IS DISTINCT FROM '9a48cdf57bb0d03171b445baf0d7652a' THEN RAISE EXCEPTION '010B legacy function baseline mismatch'; END IF;
END $guard$;
CREATE TABLE ebd_class_private.legacy_uses(
 invite_id uuid NOT NULL REFERENCES guild_invite_private.link_invites(id),
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),user_id uuid NOT NULL REFERENCES auth.users(id),
 membership_id uuid NOT NULL REFERENCES public.guild_members(id),request_id uuid,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(invite_id,traveler_id),UNIQUE(user_id,request_id)
);
CREATE TABLE ebd_class_private.legacy_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,invite_id uuid NOT NULL REFERENCES guild_invite_private.link_invites(id),
 actor_id uuid NOT NULL REFERENCES public.travelers(id),action text NOT NULL CHECK(action IN('accepted','revoked')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE ebd_class_private.legacy_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebd_class_private.legacy_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ebd_class_private.legacy_uses,ebd_class_private.legacy_events FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ebd_class_private FROM PUBLIC,anon,authenticated,service_role;

-- Safe read helper: the old validity helper takes FOR SHARE and is not usable in a STABLE preview.
CREATE FUNCTION ebd_class_private.legacy_snapshot(p_token text) RETURNS guild_invite_private.link_invites
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $body$
DECLARE i guild_invite_private.link_invites; BEGIN
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 SELECT x.* INTO i FROM guild_invite_private.link_invites x JOIN public.guilds g ON g.id=x.guild_id
 JOIN public.guild_members gm ON gm.guild_id=g.id AND gm.traveler_id=x.leader_traveler_id
 WHERE x.token_hash=extensions.digest(p_token,'sha256') AND x.revoked_at IS NULL AND x.expires_at>clock_timestamp()
 AND g.status='active' AND gm.status='active' AND gm.role='leader'
 AND guild_admin_private.leader_not_revoked(gm.traveler_id);
 IF NOT FOUND OR i.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 RETURN i;
END $body$;
CREATE FUNCTION ebd_class_private.legacy_accept(p_token text,p_actor uuid,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
DECLARE owner_id uuid; i guild_invite_private.link_invites; m public.guild_members; prior ebd_class_private.legacy_uses; BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();
 owner_id:=guild_admin_private.active_actor(p_actor);i:=guild_invite_private.valid_invite(p_token);
 IF p_request IS NOT NULL AND EXISTS(SELECT 1 FROM ebd_class_private.invite_uses WHERE user_id=owner_id AND request_id=p_request)
 THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
 IF p_request IS NOT NULL AND EXISTS(SELECT 1 FROM ebd_class_private.legacy_uses WHERE user_id=owner_id AND request_id=p_request AND(invite_id<>i.id OR traveler_id<>p_actor))
 THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
 SELECT * INTO prior FROM ebd_class_private.legacy_uses WHERE invite_id=i.id AND traveler_id=p_actor;
 SELECT * INTO m FROM public.guild_members WHERE guild_id=i.guild_id AND traveler_id=p_actor FOR UPDATE;
 IF prior.invite_id IS NOT NULL THEN
 IF m.status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Enrollment no longer active' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('guildId',i.guild_id,'classId',NULL,'enrolled',true,'replayed',true,'membershipId',m.id);
 END IF;
 IF (SELECT count(*) FROM ebd_class_private.legacy_uses WHERE invite_id=i.id)>=100 THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 IF m.id IS NOT NULL AND m.status<>'active' AND m.role<>'member' THEN RAISE EXCEPTION 'Membership unavailable' USING ERRCODE='42501'; END IF;
 INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES(i.guild_id,p_actor,'member','active')
 ON CONFLICT(guild_id,traveler_id) DO UPDATE SET status='active',updated_at=clock_timestamp(),joined_at=clock_timestamp() WHERE guild_members.status<>'active' RETURNING * INTO m;
 IF m.id IS NULL THEN SELECT * INTO m FROM public.guild_members WHERE guild_id=i.guild_id AND traveler_id=p_actor; END IF;
 -- Historical requests are independent records. Invite use never reviews, cancels or converts them.
 INSERT INTO ebd_class_private.legacy_uses(invite_id,traveler_id,user_id,membership_id,request_id) VALUES(i.id,p_actor,owner_id,m.id,p_request);
 INSERT INTO ebd_class_private.legacy_events(invite_id,actor_id,action) VALUES(i.id,p_actor,'accepted');
 RETURN jsonb_build_object('guildId',i.guild_id,'classId',NULL,'enrolled',true,'replayed',false,'membershipId',m.id);
END $body$;
CREATE FUNCTION ebd_class_private.legacy_revoke(p_actor uuid,p_guild uuid,p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();PERFORM guild_admin_private.guild_role(p_actor,p_guild,true);
 IF NOT EXISTS(SELECT 1 FROM guild_invite_private.link_invites WHERE id=p_id AND guild_id=p_guild) THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 UPDATE guild_invite_private.link_invites SET revoked_at=clock_timestamp() WHERE id=p_id AND revoked_at IS NULL;
 IF FOUND THEN INSERT INTO ebd_class_private.legacy_events(invite_id,actor_id,action) VALUES(p_id,p_actor,'revoked'); END IF;
END $body$;
REVOKE ALL ON FUNCTION ebd_class_private.legacy_snapshot(text),ebd_class_private.legacy_accept(text,uuid,uuid),ebd_class_private.legacy_revoke(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION guild_invite_private.request_invite(p_token text, p_traveler uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN RETURN (ebd_class_private.legacy_accept(p_token,p_traveler,NULL)->>'membershipId')::uuid; END
$function$
;
CREATE OR REPLACE FUNCTION guild_invite_private.revoke_invite(p_id uuid, p_leader uuid, p_guild uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN PERFORM ebd_class_private.legacy_revoke(p_leader,p_guild,p_id); END
$function$
;
CREATE OR REPLACE FUNCTION ebd_class_private.invite_preview(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE i ebd_class_private.invites; old_invite guild_invite_private.link_invites; BEGIN
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 SELECT * INTO i FROM ebd_class_private.invites WHERE token_hash=extensions.digest(p_token,'sha256');
 IF NOT FOUND THEN
 old_invite:=ebd_class_private.legacy_snapshot(p_token);
 IF (SELECT count(*) FROM ebd_class_private.legacy_uses WHERE invite_id=old_invite.id)>=100 THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 RETURN jsonb_build_object('guildName',(SELECT name FROM public.guilds WHERE id=old_invite.guild_id),'className',NULL,'expiresAt',old_invite.expires_at);
 END IF;
 IF NOT ebd_class_private.invite_valid(i) OR i.use_count>=i.max_uses THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 RETURN jsonb_build_object('guildName',(SELECT name FROM public.guilds WHERE id=i.guild_id),'className',(SELECT name FROM ebd_class_private.classes WHERE id=i.class_id),'expiresAt',i.expires_at);
END $function$
;
CREATE OR REPLACE FUNCTION ebd_class_private.invite_accept(p_token text, p_actor uuid, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE owner_id uuid; i ebd_class_private.invites; prior ebd_class_private.invite_uses; m public.guild_members; response jsonb; BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();owner_id:=guild_admin_private.active_actor(p_actor);
 IF p_request IS NULL OR p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 SELECT * INTO i FROM ebd_class_private.invites WHERE token_hash=extensions.digest(p_token,'sha256') FOR UPDATE;
 IF NOT FOUND THEN RETURN ebd_class_private.legacy_accept(p_token,p_actor,p_request)-'membershipId'; END IF;
 IF EXISTS(SELECT 1 FROM ebd_class_private.legacy_uses WHERE user_id=owner_id AND request_id=p_request)
 THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
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
END $function$
;
CREATE OR REPLACE FUNCTION ebd_class_private.invite_list(p_actor uuid,p_guild uuid,p_class uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $body$
DECLARE result jsonb; BEGIN
 PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
 result:=coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'createdAt',created_at,'expiresAt',expires_at,'maxUses',max_uses,'uses',use_count,'revokedAt',revoked_at) ORDER BY created_at DESC,id)
 FROM ebd_class_private.invites WHERE guild_id=p_guild AND class_id IS NOT DISTINCT FROM p_class),'[]'::jsonb);
 IF p_class IS NULL THEN result:=result||coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id,'createdAt',i.created_at,'expiresAt',i.expires_at,'maxUses',100,'uses',(SELECT count(*) FROM ebd_class_private.legacy_uses u WHERE u.invite_id=i.id),'revokedAt',i.revoked_at,'legacy',true) ORDER BY i.created_at DESC,i.id) FROM guild_invite_private.link_invites i WHERE i.guild_id=p_guild),'[]'::jsonb); END IF;
 RETURN result;
END $body$;
CREATE OR REPLACE FUNCTION ebd_class_private.invite_revoke(p_actor uuid,p_guild uuid,p_class uuid,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
 IF EXISTS(SELECT 1 FROM ebd_class_private.invites WHERE id=p_id AND guild_id=p_guild AND class_id IS NOT DISTINCT FROM p_class) THEN
 UPDATE ebd_class_private.invites SET revoked_at=clock_timestamp() WHERE id=p_id AND revoked_at IS NULL;
 IF FOUND THEN INSERT INTO ebd_class_private.invite_history(invite_id,guild_id,actor_id,action) VALUES(p_id,p_guild,p_actor,'revoked'); END IF;
 ELSIF p_class IS NULL THEN PERFORM ebd_class_private.legacy_revoke(p_actor,p_guild,p_id);
 ELSE RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 RETURN jsonb_build_object('id',p_id,'revoked',true);
END $body$;
