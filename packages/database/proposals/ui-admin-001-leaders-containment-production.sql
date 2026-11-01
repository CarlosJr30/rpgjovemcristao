-- PROD containment: suspend only the new administrative read; retain all rows and existing operations.
DO $$ BEGIN IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'PROD only'; END IF; END $$;
REVOKE EXECUTE ON FUNCTION public.guild_governance_leaders(integer),guild_admin_private.leaders(integer) FROM authenticated;
NOTIFY pgrst,'reload schema';
