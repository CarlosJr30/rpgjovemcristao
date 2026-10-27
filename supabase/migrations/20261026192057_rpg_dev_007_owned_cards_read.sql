-- RPG-DEV-007: expose only a stable ownership-bound read. No authority, catalog,
-- inventory, reward, wallet, progress, RLS or release_scope mutation.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN
 IF public.economy_protocol_version() IS DISTINCT FROM 3 OR
    coalesce(public.release_scope(),'') NOT IN ('guild-ebd-001','hero-equipment-006') OR
    to_regprocedure('economy_private.collection(uuid,uuid)') IS NULL OR
    NOT has_schema_privilege('authenticated','economy_private','USAGE') THEN
  RAISE EXCEPTION 'Expected reviewed read baseline';
 END IF;
 IF to_regprocedure('public.get_owned_cards(uuid)') IS NOT NULL OR
    to_regprocedure('economy_private.get_owned_cards(uuid)') IS NOT NULL THEN
  RAISE EXCEPTION 'Read endpoint already exists; inspect migration history';
 END IF;
END $$;
CREATE FUNCTION economy_private.get_owned_cards(p_traveler_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid := auth.uid();
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users
   WHERE id=actor AND NOT coalesce(is_anonymous,false)) THEN
  RAISE EXCEPTION 'Account denied' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.travelers
   WHERE id=p_traveler_id AND user_id=actor) THEN
  RAISE EXCEPTION 'Ownership denied' USING ERRCODE='42501';
 END IF;
 RETURN economy_private.collection(actor,p_traveler_id);
END $$;
REVOKE ALL ON FUNCTION economy_private.get_owned_cards(uuid)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_private.get_owned_cards(uuid) TO authenticated;
CREATE FUNCTION public.get_owned_cards(p_traveler_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT economy_private.get_owned_cards(p_traveler_id);
$$;
REVOKE ALL ON FUNCTION public.get_owned_cards(uuid)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_owned_cards(uuid) TO authenticated;

-- Verify the recovery order inside a rolled-back subtransaction. This touches
-- only these newly created endpoints; no player row or migration history is reset.
DO $$ DECLARE before_private text; before_public text; before_private_acl text; before_public_acl text;
BEGIN
 SELECT pg_get_functiondef(oid),proacl::text INTO before_private,before_private_acl
  FROM pg_proc WHERE oid='economy_private.get_owned_cards(uuid)'::regprocedure;
 SELECT pg_get_functiondef(oid),proacl::text INTO before_public,before_public_acl
  FROM pg_proc WHERE oid='public.get_owned_cards(uuid)'::regprocedure;
 BEGIN
  DROP FUNCTION public.get_owned_cards(uuid);
  DROP FUNCTION economy_private.get_owned_cards(uuid);
  IF to_regprocedure('public.get_owned_cards(uuid)') IS NOT NULL OR
     to_regprocedure('economy_private.get_owned_cards(uuid)') IS NOT NULL THEN
   RAISE EXCEPTION 'Read recovery removal failed';
  END IF;
  RAISE EXCEPTION USING ERRCODE='Z0007', MESSAGE='Rollback read recovery probe';
 EXCEPTION WHEN SQLSTATE 'Z0007' THEN NULL;
 END;
 IF pg_get_functiondef('economy_private.get_owned_cards(uuid)'::regprocedure) IS DISTINCT FROM before_private OR
    pg_get_functiondef('public.get_owned_cards(uuid)'::regprocedure) IS DISTINCT FROM before_public OR
    (SELECT proacl::text FROM pg_proc WHERE oid='economy_private.get_owned_cards(uuid)'::regprocedure) IS DISTINCT FROM before_private_acl OR
    (SELECT proacl::text FROM pg_proc WHERE oid='public.get_owned_cards(uuid)'::regprocedure) IS DISTINCT FROM before_public_acl THEN
  RAISE EXCEPTION 'Read recovery definition/ACL restore failed';
 END IF;
END $$;
NOTIFY pgrst,'reload schema';
