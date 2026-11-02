-- Empty recovery only; any issued reference prevents removing this catalog.
DO $$ BEGIN IF current_setting('economy001a.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Production target denied' USING ERRCODE='42501'; END IF; END $$;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.chest_operations WHERE rewards->>'catalogVersion'='arena-cards-2026-11-02.1-economy-001a') OR EXISTS(SELECT 1 FROM public.inventory WHERE card_version='arena-cards-2026-11-02.1-economy-001a') OR EXISTS(SELECT 1 FROM economy_private.battles WHERE catalog_version='arena-cards-2026-11-02.1-economy-001a') THEN RAISE EXCEPTION 'Issued history must be preserved; use containment' USING ERRCODE='42501'; END IF;
END $$;
DROP FUNCTION public.claim_arena_starter(uuid);
DROP FUNCTION economy_private.claim_arena_starter_001a(uuid);
DELETE FROM economy_private.card_catalog WHERE version='arena-cards-2026-11-02.1-economy-001a' AND approval_ref='ECONOMY-001A:OWNER:2026-11-02';
NOTIFY pgrst,'reload schema';
