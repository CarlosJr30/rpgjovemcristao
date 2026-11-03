DO $$ BEGIN
 IF current_setting('economy001c.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006'
 OR EXISTS(SELECT 1 FROM economy_private.community_chest_events) OR EXISTS(SELECT 1 FROM economy_private.community_chest_holds)
 OR EXISTS(SELECT 1 FROM public.chest_operations WHERE source LIKE 'community001c:%') THEN RAISE EXCEPTION 'Issued history must be preserved; use containment' USING ERRCODE='42501';END IF;
END $$;
DROP FUNCTION public.claim_community_chest(uuid,uuid),public.open_community_chest(uuid,text,uuid);
DROP TRIGGER community_chest_date_freeze ON public.guild_missions;
DROP TRIGGER community_chest_scope_freeze ON guild_activity_private.details;
DROP FUNCTION economy_private.community_chest_freeze();
DROP FUNCTION economy_private.claim_community_chest_001c(uuid,uuid),economy_private.open_community_chest_001c(uuid,text,uuid),economy_private.community_chest_validator(uuid,uuid),economy_private.community_chest_hold(uuid,uuid,uuid,uuid,text);
DROP INDEX public.community_chest_account_period;
DROP TABLE economy_private.community_chest_holds,economy_private.community_chest_events,economy_private.community_chest_policy;
NOTIFY pgrst,'reload schema';
