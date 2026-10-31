-- TEST only. Never delete issued meetings, participation, delegations or audit.
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN RAISE EXCEPTION 'TEST recovery only';END IF;
 IF EXISTS(SELECT 1 FROM public.guild_missions WHERE community_protocol IS NOT NULL)
 OR EXISTS(SELECT 1 FROM public.guild_mission_progress WHERE participant_uid IS NOT NULL OR community_revision IS NOT NULL)
 OR EXISTS(SELECT 1 FROM guild_activity_private.details) OR EXISTS(SELECT 1 FROM guild_activity_private.delegations)
 OR EXISTS(SELECT 1 FROM guild_activity_private.commands) OR EXISTS(SELECT 1 FROM guild_activity_private.future_eligibility) OR EXISTS(SELECT 1 FROM guild_activity_private.validation_history)
 THEN RAISE EXCEPTION 'Issued community data requires preserving containment';END IF;
END $$;
DROP FUNCTION public.guild_activity_workspace(uuid,uuid,integer),public.guild_activity_command(uuid,uuid,text,uuid,uuid,integer,jsonb);
DROP FUNCTION guild_activity_private.workspace(uuid,uuid,integer),guild_activity_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb);
DROP FUNCTION guild_activity_private.can_validate(uuid,uuid),guild_activity_private.actor_role(uuid,uuid);
DROP TABLE guild_activity_private.validation_history,guild_activity_private.future_eligibility,guild_activity_private.commands,guild_activity_private.delegations,guild_activity_private.details;
DROP FUNCTION guild_activity_private.immutable_validation_history();
DROP SCHEMA guild_activity_private;
DROP INDEX public.guild_mission_account_participation;
ALTER TABLE public.guild_mission_progress DROP COLUMN participant_uid,DROP COLUMN community_revision;
ALTER TABLE public.guild_missions DROP COLUMN community_protocol;
