-- TEST only, while writes are contained. Business revision conflicts must not
-- use serialization_failure: PostgREST 14 can retry 40001 indefinitely.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $change$
DECLARE old_definition text; next_definition text; old_acl aclitem[];
 old_owner oid; old_config text[]; old_definer boolean; old_volatility "char";
BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR NOT EXISTS(SELECT 1 FROM guild_admin_private.multiguild_control WHERE singleton AND NOT writes_enabled)
 THEN RAISE EXCEPTION 'Protected contained TEST baseline required'; END IF;
 old_definition:=pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure);
 IF md5(old_definition)<>'afd0278973e1c0a6235a83d1c8ebcf20'
 OR (length(old_definition)-length(replace(old_definition,'ERRCODE=''40001''','')))/length('ERRCODE=''40001''')<>8
 THEN RAISE EXCEPTION 'Reviewed EBD command definition required'; END IF;
 SELECT proacl,proowner,proconfig,prosecdef,provolatile INTO old_acl,old_owner,old_config,old_definer,old_volatility
 FROM pg_proc WHERE oid='ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure;
 next_definition:=replace(old_definition,'ERRCODE=''40001''','ERRCODE=''PT409''');
 EXECUTE next_definition;
 IF EXISTS(SELECT 1 FROM pg_proc WHERE oid='ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure
   AND (proacl IS DISTINCT FROM old_acl OR proowner<>old_owner OR proconfig IS DISTINCT FROM old_config
     OR prosecdef IS DISTINCT FROM old_definer OR provolatile IS DISTINCT FROM old_volatility))
 THEN RAISE EXCEPTION 'EBD authorization metadata changed'; END IF;
 IF pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure)<>next_definition
 THEN RAISE EXCEPTION 'Unexpected EBD definition change'; END IF;
 -- Recovery identity is exercised without re-enabling the known failing path.
 BEGIN
  EXECUTE old_definition;
  IF md5(pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure))<>'afd0278973e1c0a6235a83d1c8ebcf20'
  THEN RAISE EXCEPTION 'EBD structural recovery mismatch'; END IF;
  RAISE EXCEPTION USING ERRCODE='P0097',MESSAGE='rollback EBD structural recovery probe';
 EXCEPTION WHEN SQLSTATE 'P0097' THEN NULL;
 END;
 -- Keep writes contained. Reactivation requires a separate reviewed step.
END $change$;
NOTIFY pgrst,'reload schema';
