-- Only after exact CI, Preview and contained Auth/RLS/definition checks pass.
-- TEST only. No account grant, economic permission or player data change.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='15s';
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR NOT EXISTS(SELECT 1 FROM guild_admin_private.multiguild_control WHERE singleton AND NOT writes_enabled)
 OR position('ERRCODE=''40001''' in pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure))<>0
 OR (length(pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure))-
 length(replace(pg_get_functiondef('ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)'::regprocedure),'ERRCODE=''PT409''','')))/length('ERRCODE=''PT409''')<>8
 OR (SELECT provolatile FROM pg_proc WHERE oid='public.guild_scoped_ebd_workspace(uuid,uuid,integer)'::regprocedure)<>'v'
 THEN RAISE EXCEPTION 'Reviewed corrected contained TEST baseline required'; END IF;
END $$;
SELECT pg_catalog.pg_advisory_xact_lock(1010,1);
UPDATE guild_admin_private.multiguild_control SET writes_enabled=true,revision=revision+1 WHERE singleton AND NOT writes_enabled;
NOTIFY pgrst,'reload schema';
