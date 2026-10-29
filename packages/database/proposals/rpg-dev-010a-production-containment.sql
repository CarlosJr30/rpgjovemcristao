-- PROD preservation: retain grants, communities, memberships, lessons and immutable audit.
-- Record execution as a versioned compensating operation, never delete migration history.
SET LOCAL lock_timeout='5s';
DO $owner$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Protected production owner operation required';END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
END $owner$;
UPDATE guild_admin_private.multiguild_control SET writes_enabled=false,revision=revision+1 WHERE singleton AND writes_enabled;
NOTIFY pgrst,'reload schema';
