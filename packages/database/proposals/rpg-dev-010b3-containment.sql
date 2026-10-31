-- Preserve issued lessons, attempts, membership, attendance and audit. No deletion/XP.
SELECT pg_catalog.pg_advisory_xact_lock(1010,1);
UPDATE guild_admin_private.multiguild_control SET writes_enabled=false,revision=revision+1 WHERE writes_enabled;
REVOKE EXECUTE ON FUNCTION public.ebd_class_lessons_command(uuid,uuid,uuid,text,uuid,uuid,integer,jsonb),ebd_class_private.lessons_command(uuid,uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
