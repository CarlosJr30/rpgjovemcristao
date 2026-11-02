DO $$ BEGIN IF current_setting('economy001b.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001' THEN RAISE EXCEPTION 'Production target required' USING ERRCODE='42501';END IF;END $$;
UPDATE economy_private.community_xp_policy SET enabled=false WHERE singleton;
REVOKE EXECUTE ON FUNCTION public.claim_ebd_attendance_xp(uuid,uuid),economy_private.claim_attendance_xp_001b(uuid,uuid) FROM authenticated;
-- Own history, canonical balances, receipts, holds and event identity remain readable/preserved.
NOTIFY pgrst,'reload schema';
