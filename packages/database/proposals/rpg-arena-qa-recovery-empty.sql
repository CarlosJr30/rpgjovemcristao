-- Only before any QA allocation. Never delete an issued avatar/card/history.
DO $$ DECLARE source text; BEGIN
 IF public.release_scope()<>'hero-equipment-006' OR current_setting('arena_qa.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR EXISTS(SELECT 1 FROM arena_qa_private.allocations) OR EXISTS(SELECT 1 FROM arena_qa_private.revocations)
 OR EXISTS(SELECT 1 FROM public.inventory WHERE arena_qa_receipt_id IS NOT NULL) THEN
  RAISE EXCEPTION 'Empty TEST recovery unavailable; use containment' USING ERRCODE='42501'; END IF;
 SELECT pg_get_functiondef('economy_private.get_owned_cards(uuid)'::regprocedure) INTO source;
 EXECUTE replace(source,'RETURN economy_private.collection(actor,p_traveler_id) || arena_qa_private.owned_cards(p_traveler_id);',
 'RETURN economy_private.collection(actor,p_traveler_id);');
END $$;
DROP FUNCTION public.get_arena_qa_profile(uuid);
DROP TRIGGER arena_qa_inventory_guard ON public.inventory;
ALTER TABLE public.inventory DROP CONSTRAINT inventory_qa_provenance;
ALTER TABLE public.inventory DROP COLUMN arena_qa_receipt_id;
DROP SCHEMA arena_qa_private CASCADE;
