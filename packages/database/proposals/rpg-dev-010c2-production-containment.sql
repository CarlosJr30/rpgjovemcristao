-- PROD containment: stop new challenge writes and preserve results, history and all prior systems.
DO $$ BEGIN IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'PROD containment only';END IF;END $$;
REVOKE ALL ON FUNCTION public.guild_challenges_command(uuid,uuid,text,uuid,uuid,integer,jsonb),guild_challenge_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
