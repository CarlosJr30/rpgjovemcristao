-- TEST only. Issued invitations, consent, history or results must never be deleted for recovery.
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN RAISE EXCEPTION 'TEST recovery only';END IF;
 IF EXISTS(SELECT 1 FROM guild_challenge_private.events) OR EXISTS(SELECT 1 FROM guild_challenge_private.teams)
 OR EXISTS(SELECT 1 FROM guild_challenge_private.roster) OR EXISTS(SELECT 1 FROM guild_challenge_private.results)
 OR EXISTS(SELECT 1 FROM guild_challenge_private.practice) OR EXISTS(SELECT 1 FROM guild_challenge_private.commands)
 OR EXISTS(SELECT 1 FROM guild_challenge_private.audit) THEN RAISE EXCEPTION 'Issued data requires preserving containment';END IF;
END $$;
DROP TRIGGER guild_challenges_parent_state ON public.guild_missions;
DROP FUNCTION public.guild_challenges_workspace(uuid,uuid,uuid,integer),public.guild_challenges_command(uuid,uuid,text,uuid,uuid,integer,jsonb);
DROP FUNCTION guild_challenge_private.parent_state(),guild_challenge_private.workspace(uuid,uuid,uuid,integer),guild_challenge_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb);
DROP FUNCTION guild_challenge_private.configuration(guild_challenge_private.events),guild_challenge_private.scores(uuid),guild_challenge_private.grade(jsonb,jsonb),guild_challenge_private.validate_questions(jsonb);
DROP TABLE guild_challenge_private.audit,guild_challenge_private.commands,guild_challenge_private.practice,guild_challenge_private.results,guild_challenge_private.roster,guild_challenge_private.teams,guild_challenge_private.events;
DROP FUNCTION guild_challenge_private.confirmed_event();
DROP FUNCTION guild_challenge_private.frozen_roster(),guild_challenge_private.immutable();
DROP SCHEMA guild_challenge_private;
