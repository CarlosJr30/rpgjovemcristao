DO $prod_owner$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001'
 THEN RAISE EXCEPTION '010B requires reviewed production owner context'; END IF;
END $prod_owner$;
-- Production empty rollback. Never erase issued legacy consumption or audit.
DO $guard$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Production recovery owner context required'; END IF;
 IF EXISTS(SELECT 1 FROM ebd_class_private.legacy_uses) OR EXISTS(SELECT 1 FROM ebd_class_private.legacy_events) THEN RAISE EXCEPTION 'Issued legacy invitations require preserving containment'; END IF;
END $guard$;
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
CREATE OR REPLACE FUNCTION ebd_class_private.invite_list(p_actor uuid, p_guild uuid, p_class uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ BEGIN
 PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'createdAt',created_at,'expiresAt',expires_at,'maxUses',max_uses,'uses',use_count,'revokedAt',revoked_at) ORDER BY created_at DESC,id)
 FROM ebd_class_private.invites WHERE guild_id=p_guild AND class_id IS NOT DISTINCT FROM p_class),'[]'::jsonb);
END $function$
;
CREATE OR REPLACE FUNCTION ebd_class_private.invite_preview(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE i ebd_class_private.invites; BEGIN
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 SELECT * INTO i FROM ebd_class_private.invites WHERE token_hash=extensions.digest(p_token,'sha256');
 IF NOT ebd_class_private.invite_valid(i) OR i.use_count>=i.max_uses THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 RETURN jsonb_build_object('guildName',(SELECT name FROM public.guilds WHERE id=i.guild_id),'className',(SELECT name FROM ebd_class_private.classes WHERE id=i.class_id),'expiresAt',i.expires_at);
END $function$
;
CREATE OR REPLACE FUNCTION ebd_class_private.invite_revoke(p_actor uuid, p_guild uuid, p_class uuid, p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
 IF NOT EXISTS(SELECT 1 FROM ebd_class_private.invites WHERE id=p_id AND guild_id=p_guild AND class_id IS NOT DISTINCT FROM p_class) THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
 UPDATE ebd_class_private.invites SET revoked_at=clock_timestamp() WHERE id=p_id AND revoked_at IS NULL;
 IF FOUND THEN INSERT INTO ebd_class_private.invite_history(invite_id,guild_id,actor_id,action) VALUES(p_id,p_guild,p_actor,'revoked'); END IF;
 RETURN jsonb_build_object('id',p_id,'revoked',true);
END $function$
;
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
END $function$
;
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
END $function$
;
DROP FUNCTION ebd_class_private.legacy_snapshot(text),ebd_class_private.legacy_accept(text,uuid,uuid),ebd_class_private.legacy_revoke(uuid,uuid,uuid);
DROP TABLE ebd_class_private.legacy_events,ebd_class_private.legacy_uses;


-- Production only; refusal preserves every issued class/member/teacher/audit/receipt.
DO $guard$ DECLARE t record; occupied boolean; BEGIN
 IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Production recovery owner context required'; END IF;
 IF to_regclass('ebd_class_private.legacy_uses') IS NOT NULL THEN RAISE EXCEPTION 'Recover legacy invitation compatibility first'; END IF;
 FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ebd_class_private' AND c.relkind='r' LOOP
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ebd_class_private.%I)',t.relname) INTO occupied;
 IF occupied THEN RAISE EXCEPTION 'Issued classes require preserving containment'; END IF;
 END LOOP;
END $guard$;
DROP TRIGGER ebd_class_membership_changed ON public.guild_members;
DO $wrappers$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN('ebd_member_invite_create','ebd_member_invite_preview','ebd_member_invite_list','ebd_member_invite_accept','ebd_member_invite_revoke') LOOP
 EXECUTE format('DROP FUNCTION %s',f.signature);
 END LOOP;
END $wrappers$;
DROP FUNCTION public.ebd_classes_workspace(uuid,uuid,uuid),public.ebd_classes_command(uuid,uuid,uuid,text,uuid,integer,jsonb);
DROP SCHEMA ebd_class_private CASCADE;
