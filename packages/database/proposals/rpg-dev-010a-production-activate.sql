-- PROD activation template: transaction + exact approved release SHA and evidence are required.
-- Supply rpg010a.approved_sha and rpg010a.ready_sha from verified release metadata, not browser input.
SET LOCAL lock_timeout='5s';
DO $owner$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Protected production owner operation required';END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
END $owner$;
DO $activation$ DECLARE expected text:=current_setting('rpg010a.approved_sha',true);BEGIN
 IF expected IS NULL OR expected !~ '^[0-9a-f]{40}$' OR current_setting('rpg010a.ready_sha',true) IS DISTINCT FROM expected
 OR current_setting('rpg010a.security_gates_passed',true) IS DISTINCT FROM 'true'
 OR NOT EXISTS(SELECT 1 FROM guild_admin_private.admin_grants WHERE active AND 'admins.manage'=ANY(permissions))
 OR (SELECT md5(pg_get_functiondef('public.guild_scoped_ebd_workspace(uuid,uuid,integer)'::regprocedure)))<>'370c9e71e6e3b864ffc9ab76998b7c1d'
 OR (SELECT md5(pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure)))<>'03780d57b32a22733dd0967807f51503'
 THEN RAISE EXCEPTION 'Production activation requires approved CI READY and security/admin gates';END IF;
 UPDATE guild_admin_private.multiguild_control SET writes_enabled=true,revision=revision+1 WHERE singleton AND NOT writes_enabled;
END $activation$;
