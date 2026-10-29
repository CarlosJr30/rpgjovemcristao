-- TEST-only tracked containment. No memberships, grants or audit records removed.
DO $$ BEGIN IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' OR session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'Protected TEST containment required';END IF;END $$;
SELECT pg_catalog.pg_advisory_xact_lock(1010,1);
UPDATE guild_admin_private.multiguild_control SET writes_enabled=false,revision=revision+1 WHERE singleton;
-- Mutation functions recheck this flag after the same lock. Reads and selection stay usable.
NOTIFY pgrst,'reload schema';
