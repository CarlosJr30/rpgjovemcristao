DO $$ BEGIN IF current_setting('economy001c.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' THEN RAISE EXCEPTION 'TEST target required' USING ERRCODE='42501';END IF;END $$;
UPDATE economy_private.community_chest_policy SET enabled=false WHERE singleton;
REVOKE EXECUTE ON FUNCTION public.claim_community_chest(uuid,uuid),public.open_community_chest(uuid,text,uuid),economy_private.claim_community_chest_001c(uuid,uuid),economy_private.open_community_chest_001c(uuid,text,uuid) FROM authenticated;
-- Preserve all stacks, receipts, balances, inventory, frozen dates and review evidence.
NOTIFY pgrst,'reload schema';
