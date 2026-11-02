-- PRODUCTION PACKAGE. Owner-approved 50XP,1500/week, Monday Sao Paulo, lesson-date. Fixed approved attendance XP; no coins/chests/inventory mutation.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';
DO $$ BEGIN
 IF current_setting('economy001b.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' OR public.economy_protocol_version() IS DISTINCT FROM 3
 OR to_regclass('ebd_class_private.attendance_eligibility') IS NULL
 OR to_regclass('economy_private.community_xp_policy') IS NOT NULL
 OR has_function_privilege('authenticated','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 OR has_function_privilege('service_role','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE') THEN
 RAISE EXCEPTION 'Reviewed ECONOMY-001B production baseline required' USING ERRCODE='42501'; END IF;
END $$;

CREATE TABLE economy_private.community_xp_policy(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT true,
 activated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 timezone text NOT NULL DEFAULT 'America/Sao_Paulo' CHECK(timezone='America/Sao_Paulo'),
 weekly_limit integer NOT NULL DEFAULT 1500 CHECK(weekly_limit=1500),
 attendance_xp integer NOT NULL DEFAULT 50 CHECK(attendance_xp=50),
 temporal_reference text NOT NULL DEFAULT 'lesson-date' CHECK(temporal_reference='lesson-date')
);
INSERT INTO economy_private.community_xp_policy(singleton) VALUES(true);
-- Event identity and economic date are frozen on first eligible request. No balance here.
CREATE TABLE economy_private.community_xp_events(
 lesson_id uuid PRIMARY KEY REFERENCES public.guild_lessons(id),
 scheduled_at timestamptz NOT NULL,week_start timestamptz NOT NULL,week_end timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),CHECK(week_end>week_start)
);
CREATE TABLE economy_private.community_xp_holds(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL,
 lesson_id uuid NOT NULL REFERENCES public.guild_lessons(id),traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 reason text NOT NULL CHECK(reason IN('validator-unavailable','self-validation','event-date-changed','balance-inconsistent','source-inconsistent','attendance-corrected')),
 attendance_revision integer NOT NULL CHECK(attendance_revision>0),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(account_id,lesson_id,reason)
);
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['community_xp_policy','community_xp_events','community_xp_holds'] LOOP
 EXECUTE format('ALTER TABLE economy_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON economy_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;END $$;
CREATE FUNCTION economy_private.community_xp_append_only() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'Immutable economic evidence' USING ERRCODE='42501';END $$;
CREATE TRIGGER community_xp_events_immutable BEFORE UPDATE OR DELETE ON economy_private.community_xp_events FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();
CREATE TRIGGER community_xp_holds_immutable BEFORE UPDATE OR DELETE ON economy_private.community_xp_holds FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();

ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK(
 (operation_type IN('grant','purchase','open') AND chest_type IS NOT NULL)
 OR(operation_type IN('card-starter','card-revocation','arena-result','tower-result','community-xp') AND chest_type IS NULL));
ALTER TABLE public.chest_operations ADD CONSTRAINT community_xp_receipt_shape CHECK(operation_type<>'community-xp' OR(
 source='ebd-attendance-001b' AND price_paid IS NULL
 AND jsonb_typeof(rewards)='object' AND rewards->>'contract'='ECONOMY-001B:v1'
 AND rewards->>'coins'='0' AND rewards->>'xp' IN('0','50')
 AND rewards ?& ARRAY['eventId','weekStart','weekEnd','totalXp','level','attendanceRevision','validatorId']));
CREATE INDEX community_xp_account_week_idx ON public.chest_operations(account_id,(rewards->>'weekStart')) WHERE operation_type='community-xp';
ALTER TABLE ebd_class_private.attendance_eligibility DROP CONSTRAINT attendance_eligibility_xp_issued_check;
ALTER TABLE ebd_class_private.attendance_eligibility ADD CONSTRAINT attendance_eligibility_xp_issued_check CHECK(xp_issued IN(0,50));

CREATE FUNCTION economy_private.community_xp_actor(p_actor uuid) RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();sid text:=auth.jwt()->>'session_id';BEGIN
 IF who IS NULL OR sid IS NULL OR sid !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM auth.users WHERE id=who AND NOT coalesce(is_anonymous,false) AND email_confirmed_at IS NOT NULL
 AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM auth.sessions WHERE id=sid::uuid AND user_id=who AND(not_after IS NULL OR not_after>clock_timestamp()) FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND user_id=who AND is_active) THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501';END IF;
 RETURN who;
END $$;
CREATE FUNCTION economy_private.attendance_validator_current(p_validator uuid,p_lesson uuid) RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.guild_lessons l JOIN ebd_class_private.classes c ON c.id=l.ebd_class_id AND c.guild_id=l.guild_id AND c.status='active'
 JOIN public.guilds g ON g.id=l.guild_id AND g.status='active'
 JOIN public.guild_members gm ON gm.guild_id=g.id AND gm.traveler_id=p_validator AND gm.status='active'
 JOIN public.travelers v ON v.id=gm.traveler_id JOIN auth.users u ON u.id=v.user_id
 WHERE l.id=p_lesson AND u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false) AND u.deleted_at IS NULL AND(u.banned_until IS NULL OR u.banned_until<=statement_timestamp())
 AND((gm.role='leader' AND g.leader_traveler_id=v.id AND guild_admin_private.leader_not_revoked(v.id))
 OR EXISTS(SELECT 1 FROM ebd_class_private.teachers t WHERE t.class_id=c.id AND t.traveler_id=v.id AND t.active AND t.can_attend)))
$$;
CREATE FUNCTION economy_private.community_xp_receipt(p_receipt public.chest_operations,p_replayed boolean) RETURNS jsonb
 LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT jsonb_build_object('version',1,'status',CASE WHEN p_receipt.rewards->>'xp'='50' THEN 'credited' ELSE 'weekly-limit' END,
 'receiptId',p_receipt.id,'travelerId',p_receipt.traveler_id,'eventId',p_receipt.rewards->>'eventId',
 'xp',(p_receipt.rewards->>'xp')::integer,'totalXp',(p_receipt.rewards->>'totalXp')::integer,'level',(p_receipt.rewards->>'level')::integer,
 'weekStart',p_receipt.rewards->>'weekStart','replayed',p_replayed,
 'reviewPending',EXISTS(SELECT 1 FROM economy_private.community_xp_holds h WHERE h.account_id=p_receipt.account_id AND h.lesson_id=(p_receipt.rewards->>'eventId')::uuid))
$$;

CREATE FUNCTION economy_private.claim_attendance_xp_001b(p_actor uuid,p_lesson uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;policy economy_private.community_xp_policy;l public.guild_lessons;t public.travelers;
 a public.guild_ebd_attendance;e ebd_class_private.attendance_eligibility;ev economy_private.community_xp_events;
 receipt public.chest_operations;k text;week_begin timestamptz;week_finish timestamptz;used integer;amount integer;next_xp integer;next_level integer;hold_reason text;
BEGIN
 -- Same lock order as published community commands/revocations, then economic identity.
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF p_lesson IS NULL THEN RAISE EXCEPTION 'Lesson required' USING ERRCODE='22023';END IF;
 k:='community-xp:v1:'||who||':ebd:'||p_lesson;
 SELECT * INTO receipt FROM public.chest_operations WHERE identity_key=k;
 IF FOUND THEN RETURN economy_private.community_xp_receipt(receipt,true);END IF;
 SELECT * INTO policy FROM economy_private.community_xp_policy WHERE singleton FOR SHARE;
 IF policy.singleton IS NULL OR NOT policy.enabled THEN RETURN jsonb_build_object('version',1,'status','disabled');END IF;
 PERFORM guild_admin_private.require_writes();
 SELECT * INTO t FROM public.travelers WHERE id=p_actor AND user_id=who AND is_active FOR UPDATE;
 IF t.economic_verified_at IS NULL THEN RETURN jsonb_build_object('version',1,'status','legacy-reconciliation-required');END IF;
 SELECT * INTO l FROM public.guild_lessons WHERE id=p_lesson FOR UPDATE;
 IF l.id IS NULL OR l.ebd_class_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.guild_members gm JOIN public.guilds g ON g.id=gm.guild_id WHERE gm.guild_id=l.guild_id AND gm.traveler_id=p_actor AND gm.status='active' AND g.status='active')
 OR NOT EXISTS(SELECT 1 FROM ebd_class_private.classes c JOIN ebd_class_private.members m ON m.class_id=c.id WHERE c.id=l.ebd_class_id AND c.status='active' AND m.traveler_id=p_actor AND m.status='active') THEN RAISE EXCEPTION 'Lesson unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.guild_ebd_attendance WHERE lesson_id=l.id AND traveler_id=p_actor FOR UPDATE;
 SELECT * INTO e FROM ebd_class_private.attendance_eligibility WHERE lesson_id=l.id AND traveler_id=p_actor FOR UPDATE;
 IF l.status NOT IN('published','closed') OR l.scheduled_at IS NULL OR l.scheduled_at>clock_timestamp()
 OR l.scheduled_at<policy.activated_at OR a.updated_at<policy.activated_at OR a.lesson_id IS NULL OR e.lesson_id IS NULL
 OR a.status<>'present' OR NOT e.eligible OR(l.audience='selected' AND NOT p_actor=ANY(l.target_ids)) THEN RETURN jsonb_build_object('version',1,'status','not-eligible');END IF;
 IF EXISTS(SELECT 1 FROM economy_private.community_xp_holds WHERE account_id=who AND lesson_id=l.id) THEN RETURN jsonb_build_object('version',1,'status','suspended');END IF;
 IF e.attendance_revision<>a.revision OR e.xp_contract<>50 OR e.xp_issued<>0 THEN hold_reason:='source-inconsistent';
 ELSIF EXISTS(SELECT 1 FROM public.travelers WHERE id=a.marked_by AND user_id=who) THEN hold_reason:='self-validation';
 ELSIF NOT economy_private.attendance_validator_current(a.marked_by,l.id) THEN hold_reason:='validator-unavailable';
 ELSIF t.xp<0 OR t.xp>2147483597 OR t.level<>least(50,greatest(1,floor((1+sqrt(1+t.xp::numeric/25))/2)::integer)) THEN hold_reason:='balance-inconsistent';END IF;
 week_begin:=date_trunc('week',l.scheduled_at AT TIME ZONE policy.timezone) AT TIME ZONE policy.timezone;
 week_finish:=(date_trunc('week',l.scheduled_at AT TIME ZONE policy.timezone)+interval '7 days') AT TIME ZONE policy.timezone;
 SELECT * INTO ev FROM economy_private.community_xp_events WHERE lesson_id=l.id;
 IF FOUND AND ev.scheduled_at<>l.scheduled_at THEN hold_reason:='event-date-changed';END IF;
 IF hold_reason IS NOT NULL THEN
 INSERT INTO economy_private.community_xp_holds(account_id,lesson_id,traveler_id,reason,attendance_revision) VALUES(who,l.id,p_actor,hold_reason,a.revision) ON CONFLICT DO NOTHING;
 RETURN jsonb_build_object('version',1,'status','suspended');END IF;
 INSERT INTO economy_private.community_xp_events(lesson_id,scheduled_at,week_start,week_end) VALUES(l.id,l.scheduled_at,week_begin,week_finish) ON CONFLICT DO NOTHING;
 SELECT coalesce(sum((rewards->>'xp')::integer),0) INTO used FROM public.chest_operations
 WHERE account_id=who AND operation_type='community-xp' AND rewards->>'weekStart'=to_char(week_begin AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"');
 -- Every currently approved credit is exactly50. No invented partial payout.
 amount:=CASE WHEN used+50<=policy.weekly_limit THEN 50 ELSE 0 END;next_xp:=t.xp+amount;
 next_level:=least(50,greatest(1,floor((1+sqrt(1+next_xp::numeric/25))/2)::integer));
 INSERT INTO public.chest_operations(traveler_id,operation_key,operation_type,chest_type,source,price_paid,identity_key,account_id,rewards)
 VALUES(p_actor,k,'community-xp',NULL,'ebd-attendance-001b',NULL,k,who,
 jsonb_build_object('contract','ECONOMY-001B:v1','eventId',l.id,'xp',amount,'coins',0,'totalXp',next_xp,'level',next_level,
 'weekStart',to_char(week_begin AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'weekEnd',to_char(week_finish AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'attendanceRevision',a.revision,'validatorId',a.marked_by)) RETURNING * INTO receipt;
 IF amount>0 THEN UPDATE public.travelers SET xp=next_xp,level=next_level WHERE id=p_actor;
 UPDATE ebd_class_private.attendance_eligibility SET xp_issued=amount WHERE lesson_id=l.id AND traveler_id=p_actor;END IF;
 RETURN economy_private.community_xp_receipt(receipt,false);
END $$;

CREATE FUNCTION economy_private.community_xp_history_001b(p_actor uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE who uuid;BEGIN
 who:=economy_private.community_xp_actor(p_actor);
 RETURN jsonb_build_object('version',1,'receipts',coalesce((SELECT jsonb_agg(economy_private.community_xp_receipt(r,true) ORDER BY r.created_at DESC,r.id) FROM(SELECT * FROM public.chest_operations WHERE account_id=who AND operation_type='community-xp' ORDER BY created_at DESC,id LIMIT 100)r),'[]'::jsonb),
 'suspendedEvents',coalesce((SELECT jsonb_agg(DISTINCT lesson_id) FROM economy_private.community_xp_holds WHERE account_id=who),'[]'::jsonb));
END $$;
CREATE FUNCTION economy_private.community_xp_attendance_correction() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.status<>'present' AND EXISTS(SELECT 1 FROM public.chest_operations r WHERE r.operation_type='community-xp' AND r.traveler_id=NEW.traveler_id AND r.rewards->>'eventId'=NEW.lesson_id::text AND r.rewards->>'xp'='50') THEN
 INSERT INTO economy_private.community_xp_holds(account_id,lesson_id,traveler_id,reason,attendance_revision)
 SELECT t.user_id,NEW.lesson_id,NEW.traveler_id,'attendance-corrected',NEW.revision FROM public.travelers t WHERE t.id=NEW.traveler_id ON CONFLICT DO NOTHING;
 END IF;RETURN NEW;END $$;
CREATE TRIGGER community_xp_attendance_correction AFTER UPDATE ON public.guild_ebd_attendance FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_attendance_correction();
CREATE FUNCTION economy_private.community_xp_freeze_event() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF(NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at OR NEW.guild_id<>OLD.guild_id OR NEW.ebd_class_id IS DISTINCT FROM OLD.ebd_class_id)
 AND EXISTS(SELECT 1 FROM economy_private.community_xp_events WHERE lesson_id=OLD.id) THEN RAISE EXCEPTION 'Economic event date and identity are frozen' USING ERRCODE='PT409';END IF;
 RETURN NEW;END $$;
CREATE TRIGGER community_xp_freeze_event BEFORE UPDATE ON public.guild_lessons FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_freeze_event();
REVOKE ALL ON FUNCTION economy_private.community_xp_freeze_event() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.claim_ebd_attendance_xp(p_actor uuid,p_lesson uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT economy_private.claim_attendance_xp_001b(p_actor,p_lesson) $$;
CREATE FUNCTION public.get_community_xp_history(p_actor uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT economy_private.community_xp_history_001b(p_actor) $$;
REVOKE ALL ON FUNCTION economy_private.community_xp_append_only(),economy_private.community_xp_actor(uuid),economy_private.attendance_validator_current(uuid,uuid),economy_private.community_xp_receipt(public.chest_operations,boolean),economy_private.claim_attendance_xp_001b(uuid,uuid),economy_private.community_xp_history_001b(uuid),economy_private.community_xp_attendance_correction(),public.claim_ebd_attendance_xp(uuid,uuid),public.get_community_xp_history(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_private.claim_attendance_xp_001b(uuid,uuid),economy_private.community_xp_history_001b(uuid),public.claim_ebd_attendance_xp(uuid,uuid),public.get_community_xp_history(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
