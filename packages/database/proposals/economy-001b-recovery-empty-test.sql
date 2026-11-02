DO $$ BEGIN
 IF current_setting('economy001b.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' THEN RAISE EXCEPTION 'TEST target required' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM public.chest_operations WHERE operation_type='community-xp') OR EXISTS(SELECT 1 FROM economy_private.community_xp_events) OR EXISTS(SELECT 1 FROM economy_private.community_xp_holds) OR EXISTS(SELECT 1 FROM ebd_class_private.attendance_eligibility WHERE xp_issued<>0) THEN RAISE EXCEPTION 'Issued history requires preserving containment' USING ERRCODE='42501';END IF;
END $$;
DROP TRIGGER community_xp_attendance_correction ON public.guild_ebd_attendance;
DROP TRIGGER community_xp_freeze_event ON public.guild_lessons;
DROP FUNCTION economy_private.community_xp_freeze_event();
DROP FUNCTION public.claim_ebd_attendance_xp(uuid,uuid),public.get_community_xp_history(uuid);
DROP FUNCTION economy_private.claim_attendance_xp_001b(uuid,uuid),economy_private.community_xp_history_001b(uuid),economy_private.community_xp_attendance_correction();
DROP FUNCTION economy_private.community_xp_receipt(public.chest_operations,boolean),economy_private.community_xp_actor(uuid),economy_private.attendance_validator_current(uuid,uuid);
DROP TABLE economy_private.community_xp_holds,economy_private.community_xp_events,economy_private.community_xp_policy;
DROP FUNCTION economy_private.community_xp_append_only();
DROP INDEX public.community_xp_account_week_idx;
ALTER TABLE public.chest_operations DROP CONSTRAINT community_xp_receipt_shape;
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK((operation_type IN('grant','purchase','open') AND chest_type IS NOT NULL) OR(operation_type IN('card-starter','card-revocation','arena-result','tower-result') AND chest_type IS NULL));
ALTER TABLE ebd_class_private.attendance_eligibility DROP CONSTRAINT attendance_eligibility_xp_issued_check;
ALTER TABLE ebd_class_private.attendance_eligibility ADD CONSTRAINT attendance_eligibility_xp_issued_check CHECK(xp_issued=0);
NOTIFY pgrst,'reload schema';
