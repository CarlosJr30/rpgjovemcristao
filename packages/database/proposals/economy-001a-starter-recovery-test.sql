-- Remove only the new callable bridge; preserve every card/receipt/catalog row.
DO $$ BEGIN
 IF current_setting('economy001a.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN
  RAISE EXCEPTION 'TEST target denied' USING ERRCODE='42501';
 END IF;
END $$;
DROP FUNCTION public.claim_arena_starter(uuid);
DROP FUNCTION economy_private.claim_arena_starter_001a(uuid);
NOTIFY pgrst,'reload schema';
