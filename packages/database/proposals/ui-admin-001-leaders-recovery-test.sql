-- TEST only; remove only the additive read. Every existing row and authority remains untouched.
DO $$ BEGIN IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN RAISE EXCEPTION 'TEST only';END IF; END $$;
DROP FUNCTION public.guild_governance_leaders(integer);
DROP FUNCTION guild_admin_private.leaders(integer);
NOTIFY pgrst,'reload schema';
