-- TEST only; retain all grants, invitations and immutable audit records.
-- Use a new tracked compensation migration if required; never erase history.
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN RAISE EXCEPTION 'Reviewed TEST target required'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.guild_governance_status(),public.guild_governance_command(text,uuid,uuid,jsonb),
 public.guild_leadership_preview(text),public.guild_governance_workspace(integer),public.guild_governance_history(integer),
 guild_admin_private.status(),guild_admin_private.command(text,uuid,uuid,jsonb),guild_admin_private.preview(text),
 guild_admin_private.workspace(integer),guild_admin_private.history(integer) FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
