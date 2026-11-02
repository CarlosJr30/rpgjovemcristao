-- Preserve every issued card, receipt and readable catalog.
DO $$ BEGIN IF current_setting('economy001a.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Production target denied' USING ERRCODE='42501'; END IF; END $$;
REVOKE EXECUTE ON FUNCTION public.claim_arena_starter(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION economy_private.claim_arena_starter_001a(uuid) FROM authenticated;
NOTIFY pgrst,'reload schema';
