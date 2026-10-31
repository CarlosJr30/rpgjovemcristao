-- PROD containment preserves all issued meetings, participation and immutable history.
DO $$ BEGIN IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'PROD containment only';END IF;END $$;
-- Only new community commands: legacy mission writes remain denied. Preserve EBD/Guild writes.
SELECT pg_catalog.pg_advisory_xact_lock(1010,1);
REVOKE EXECUTE ON FUNCTION public.guild_activity_command(uuid,uuid,text,uuid,uuid,integer,jsonb),guild_activity_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
