-- Restore the original TEST-only QA barrier without changing or deleting the sale receipt.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$
BEGIN
  IF current_setting('economy041.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
    OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
    OR position('ECONOMY041-TEST-OWNER-APPROVED-2026-11-11' in
      pg_get_functiondef('shop_qa_private.isolate_credit()'::regprocedure))=0 THEN
    RAISE EXCEPTION 'Reviewed TEST sale guard required' USING ERRCODE='42501';
  END IF;
END $$;
CREATE OR REPLACE FUNCTION shop_qa_private.isolate_credit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ BEGIN
  IF EXISTS(SELECT 1 FROM shop_qa_private.profiles WHERE traveler_id=NEW.traveler_id)
    AND NEW.operation_type NOT IN('purchase','open','equipment-purchase','card-starter','card-revocation')
  THEN RAISE EXCEPTION 'QA source is isolated from official rewards' USING ERRCODE='42501';END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION shop_qa_private.isolate_credit() FROM PUBLIC,anon,authenticated,service_role;
