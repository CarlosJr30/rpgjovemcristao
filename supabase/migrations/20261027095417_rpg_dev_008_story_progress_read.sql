-- RPG-DEV-008A: expose only the existing owner-filtered progress projection.
-- Recovery: REVOKE SELECT ON public.story_progress FROM authenticated;
-- No DML, new policy, progression authority or economic permission.
DO $migration$
DECLARE before_acl text;
BEGIN
  IF public.release_scope() NOT IN ('guild-ebd-001','hero-equipment-006') OR
     NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.story_progress'::regclass) OR
     (SELECT count(*) FROM pg_policy WHERE polrelid='public.story_progress'::regclass) <> 1 OR
     NOT EXISTS (
       SELECT 1 FROM pg_policy
       WHERE polrelid='public.story_progress'::regclass
       AND polname='story_progress_owner' AND polcmd='r' AND polpermissive
       AND polroles=ARRAY['authenticated'::regrole::oid]
       AND pg_get_expr(polqual,polrelid) = '(owns_traveler(traveler_id) AND (NOT COALESCE(((auth.jwt() ->> ''is_anonymous''::text))::boolean, true)))'
     ) OR
     NOT has_function_privilege('authenticated','public.owns_traveler(uuid)','EXECUTE') OR
     EXISTS (SELECT 1 FROM unnest(ARRAY['anon','authenticated','service_role']) r
       WHERE has_table_privilege(r,'public.story_progress','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) OR
     has_function_privilege('authenticated','public.complete_story(uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION '008A requires the reviewed read-closed baseline and owner policy';
  END IF;
  IF (SELECT pg_get_functiondef('public.owns_traveler(uuid)'::regprocedure)) NOT LIKE
     '%t.id = p_traveler_id AND t.user_id = auth.uid()%' THEN
    RAISE EXCEPTION '008A ownership implementation differs';
  END IF;
  GRANT SELECT ON public.story_progress TO authenticated;
  SELECT relacl::text INTO before_acl FROM pg_class WHERE oid='public.story_progress'::regclass;
  -- Rollback-only exercise of the exact compensating operation.
  BEGIN
    REVOKE SELECT ON public.story_progress FROM authenticated;
    IF has_table_privilege('authenticated','public.story_progress','SELECT') THEN
      RAISE EXCEPTION '008A recovery probe failed';
    END IF;
    RAISE EXCEPTION USING ERRCODE='P8008', MESSAGE='rollback recovery probe';
  EXCEPTION WHEN SQLSTATE 'P8008' THEN NULL;
  END;
  IF (SELECT relacl::text FROM pg_class WHERE oid='public.story_progress'::regclass) IS DISTINCT FROM before_acl THEN
    RAISE EXCEPTION '008A recovery did not restore ACL';
  END IF;
END
$migration$;
