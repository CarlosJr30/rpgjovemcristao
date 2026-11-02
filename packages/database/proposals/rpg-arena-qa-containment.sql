-- Owner only, TEST only. Revoke QA use without deleting any avatar/inventory/audit.
DO $$ BEGIN
 IF public.release_scope()<>'hero-equipment-006' OR current_setting('arena_qa.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' THEN
  RAISE EXCEPTION 'TEST containment only' USING ERRCODE='42501'; END IF;
 INSERT INTO arena_qa_private.revocations(allocation_id,reason)
 SELECT id,'QA containment; all records preserved' FROM arena_qa_private.allocations ON CONFLICT DO NOTHING;
END $$;
