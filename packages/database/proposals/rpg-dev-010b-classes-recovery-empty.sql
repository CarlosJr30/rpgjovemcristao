-- TEST only; refusal preserves every issued class/member/teacher/audit/receipt.
DO $guard$ DECLARE t record; occupied boolean; BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN RAISE EXCEPTION 'TEST recovery only'; END IF;
 FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ebd_class_private' AND c.relkind='r' LOOP
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ebd_class_private.%I)',t.relname) INTO occupied;
 IF occupied THEN RAISE EXCEPTION 'Issued classes require preserving containment'; END IF;
 END LOOP;
END $guard$;
DROP TRIGGER ebd_class_membership_changed ON public.guild_members;
DO $wrappers$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN('ebd_member_invite_create','ebd_member_invite_preview','ebd_member_invite_list','ebd_member_invite_accept','ebd_member_invite_revoke') LOOP
 EXECUTE format('DROP FUNCTION %s',f.signature);
 END LOOP;
END $wrappers$;
DROP FUNCTION public.ebd_classes_workspace(uuid,uuid,uuid),public.ebd_classes_command(uuid,uuid,uuid,text,uuid,integer,jsonb);
DROP SCHEMA ebd_class_private CASCADE;
