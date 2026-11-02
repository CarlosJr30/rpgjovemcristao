-- Owner-approved TEST-only temporary attributes. Canonical rows are untouched.
-- Existing TOWER_FLOORS[6].snapshot.attributes: life8 strength11 defense6 wisdom7.
-- Approval: RPG-ARENA-TORRE-001:QA-PRESET-2026-11-01.
DO $$ DECLARE source text; before_expr text :=
 'jsonb_build_object(''kind'',''qa-training'',''trainingLevel'',a.training_level,''canonicalLevel'',t.level,''canonicalXp'',t.xp)';
BEGIN
 IF public.release_scope()<>'hero-equipment-006' OR current_setting('arena_qa.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' THEN
  RAISE EXCEPTION 'QA preset is TEST-only' USING ERRCODE='42501'; END IF;
 SELECT pg_get_functiondef('arena_qa_private.profile(uuid)'::regprocedure) INTO source;
 IF position(before_expr IN source)=0 OR position('trainingPreset' IN source)>0 THEN
  RAISE EXCEPTION 'Expected original QA profile; inspect migration history'; END IF;
 EXECUTE replace(source,before_expr,
 'jsonb_build_object(''kind'',''qa-training'',''trainingLevel'',a.training_level,''canonicalLevel'',t.level,''canonicalXp'',t.xp,''trainingPreset'',''tower-champion-attributes-v1'',''trainingAttributes'',jsonb_build_object(''life'',8,''strength'',11,''defense'',6,''wisdom'',7))');
END $$;
COMMENT ON FUNCTION arena_qa_private.profile(uuid) IS 'Owner approved QA-PRESET-2026-11-01. TEST only. Existing Tower champion attributes; no equipment, canonical writes or economy.';
NOTIFY pgrst,'reload schema';
