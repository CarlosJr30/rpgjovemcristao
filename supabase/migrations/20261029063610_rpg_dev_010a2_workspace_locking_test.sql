-- TEST only. Preserve body, ownership, ACLs and locking authorization helpers.
-- PostgREST runs POST to STABLE functions in READ ONLY transactions. This
-- wrapper delegates to the existing VOLATILE workspace that uses FOR SHARE.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $guard$
BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR to_regclass('guild_admin_private.multiguild_control') IS NULL
 OR md5(pg_get_functiondef('public.guild_scoped_ebd_workspace(uuid,uuid,integer)'::regprocedure))
    IS DISTINCT FROM 'fd60068b2c904e53cce65b3604e1ce20'
 OR md5(pg_get_functiondef('ebd_ops.workspace(uuid,uuid,integer)'::regprocedure))
    IS DISTINCT FROM 'b4c8464bc7260145f8e0e36516dd7205'
 THEN RAISE EXCEPTION 'Reviewed 010A.2 TEST workspace baseline required'; END IF;
END $guard$;
DO $change$
DECLARE old_acl aclitem[]; old_src text; old_config text[]; old_owner oid; old_definer boolean;
BEGIN
 SELECT proacl,prosrc,proconfig,proowner,prosecdef
 INTO old_acl,old_src,old_config,old_owner,old_definer
 FROM pg_proc WHERE oid='public.guild_scoped_ebd_workspace(uuid,uuid,integer)'::regprocedure;
 ALTER FUNCTION public.guild_scoped_ebd_workspace(uuid,uuid,integer) VOLATILE;
 IF EXISTS(SELECT 1 FROM pg_proc
   WHERE oid='public.guild_scoped_ebd_workspace(uuid,uuid,integer)'::regprocedure
   AND (proacl IS DISTINCT FROM old_acl OR prosrc IS DISTINCT FROM old_src
     OR proconfig IS DISTINCT FROM old_config OR proowner<>old_owner
     OR prosecdef IS DISTINCT FROM old_definer OR provolatile<>'v'))
 THEN RAISE EXCEPTION 'Workspace authorization metadata changed'; END IF;
 -- Structural recovery probe: restore exact prior definition in a subtransaction,
 -- then roll back the probe. No data or migration history is removed.
 BEGIN
  ALTER FUNCTION public.guild_scoped_ebd_workspace(uuid,uuid,integer) STABLE;
  IF md5(pg_get_functiondef('public.guild_scoped_ebd_workspace(uuid,uuid,integer)'::regprocedure))
     <> 'fd60068b2c904e53cce65b3604e1ce20'
  THEN RAISE EXCEPTION 'Workspace structural recovery mismatch'; END IF;
  RAISE EXCEPTION USING ERRCODE='P0098', MESSAGE='rollback workspace recovery probe';
 EXCEPTION WHEN SQLSTATE 'P0098' THEN NULL;
 END;
END $change$;
NOTIFY pgrst, 'reload schema';
