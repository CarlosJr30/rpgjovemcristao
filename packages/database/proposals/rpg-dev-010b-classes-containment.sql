-- Preserve all classes, members, grants and history. Reads remain available.
REVOKE EXECUTE ON FUNCTION public.ebd_classes_command(uuid,uuid,uuid,text,uuid,integer,jsonb),ebd_class_private.command(uuid,uuid,uuid,text,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
DO $contain$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE(n.nspname='public' AND p.proname IN('ebd_member_invite_create','ebd_member_invite_accept','ebd_member_invite_revoke'))
 OR(n.nspname='ebd_class_private' AND p.proname IN('invite_create','invite_accept','invite_revoke')) LOOP
 EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 END LOOP;
END $contain$;
