-- NOT AUTHORIZED FOR EXECUTION: protected proposal template only.
-- Owner must explicitly approve the normal-session UID and the four permissions first.
SET LOCAL lock_timeout='5s';
DO $owner$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Protected production owner operation required';END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
END $owner$;
DO $designation$ DECLARE target uuid:=nullif(current_setting('rpg010a.approved_admin_uid',true),'')::uuid;
 expected_avatar uuid:=nullif(current_setting('rpg010a.confirmed_avatar_id',true),'')::uuid;
 request uuid:=nullif(current_setting('rpg010a.approved_request_id',true),'')::uuid;
 reason text:=current_setting('rpg010a.approval_reference',true);BEGIN
 IF current_setting('rpg010a.owner_approved',true) IS DISTINCT FROM 'true' OR target IS NULL OR expected_avatar IS NULL
 OR request IS NULL OR length(btrim(COALESCE(reason,''))) NOT BETWEEN 8 AND 500
 OR NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=expected_avatar AND user_id=target AND is_active)
 THEN RAISE EXCEPTION 'Explicit owner designation and freshly verified normal identity required';END IF;
 PERFORM guild_admin_private.bootstrap_admin(target,ARRAY['admins.manage','leadership.manage','guilds.read','audit.read'],reason,request);
END $designation$;
