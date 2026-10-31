-- TEST containment: stop new challenge writes and preserve results, history and all prior systems.
DO $$ BEGIN IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN RAISE EXCEPTION 'TEST containment only';END IF;END $$;
REVOKE ALL ON FUNCTION public.guild_challenges_command(uuid,uuid,text,uuid,uuid,integer,jsonb),guild_challenge_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
