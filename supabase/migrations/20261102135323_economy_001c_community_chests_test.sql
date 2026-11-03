-- TEST ONLY. Owner-approved common/epic legacy loot; no purchases/cards/equipment selection.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';
DO $$ BEGIN
 IF current_setting('economy001c.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006' OR public.economy_protocol_version() IS DISTINCT FROM 3
 OR to_regclass('economy_private.community_xp_policy') IS NULL OR to_regclass('economy_private.community_chest_policy') IS NOT NULL
 OR has_function_privilege('authenticated','public.open_chest(uuid,text,uuid)','execute')
 OR has_function_privilege('authenticated','public.grant_traveler_chest(uuid,text,text,text)','execute') THEN
 RAISE EXCEPTION 'Reviewed ECONOMY-001C TEST baseline required' USING ERRCODE='42501';END IF;
END $$;
DO $$ DECLARE r record;p regprocedure;BEGIN
 FOR r IN SELECT * FROM (VALUES('economy_private.open_chest(uuid,text,uuid)','63af7f1b3138b9056c91bf9242fda193'),('public.grant_traveler_chest(uuid,text,text,text)','27e238ec202c4a9f6fd7559cd190b2e2'))v(signature,hash) LOOP
 p:=to_regprocedure(r.signature);
 IF p IS NULL OR md5(replace(pg_get_functiondef(p),E'\r\n',E'\n'))<>r.hash OR(SELECT proacl::text FROM pg_proc WHERE oid=p)<>'{postgres=X/postgres}' THEN RAISE EXCEPTION 'Reviewed legacy loot/grant definition required: %',r.signature USING ERRCODE='42501';END IF;
 END LOOP;END $$;
CREATE TABLE economy_private.community_chest_policy(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT true,
 activated_at timestamptz NOT NULL DEFAULT clock_timestamp(),catalog_version text NOT NULL DEFAULT 'ECONOMY-001C:legacy-common-epic:v1' CHECK(catalog_version='ECONOMY-001C:legacy-common-epic:v1'),
 timezone text NOT NULL DEFAULT 'America/Sao_Paulo' CHECK(timezone='America/Sao_Paulo'),
 weekly_common integer NOT NULL DEFAULT 7 CHECK(weekly_common=7),monthly_epic integer NOT NULL DEFAULT 4 CHECK(monthly_epic=4),leader_events integer NOT NULL DEFAULT 2 CHECK(leader_events=2)
);
INSERT INTO economy_private.community_chest_policy(singleton) VALUES(true);
CREATE TABLE economy_private.community_chest_events(
 mission_id uuid PRIMARY KEY REFERENCES public.guild_missions(id),event_id uuid NOT NULL REFERENCES public.guild_missions(id),
 scheduled_at timestamptz NOT NULL,week_start timestamptz NOT NULL,month_start timestamptz NOT NULL,
 leader_account uuid NOT NULL REFERENCES auth.users(id),chest_type text NOT NULL CHECK(chest_type IN('common','epic')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- Claims remain the existing ledger; this table holds only exceptional, immutable review evidence.
CREATE TABLE economy_private.community_chest_holds(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES auth.users(id),
 event_id uuid NOT NULL REFERENCES public.guild_missions(id),mission_id uuid NOT NULL REFERENCES public.guild_missions(id),
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),reason text NOT NULL CHECK(reason IN('source-unavailable','validator-unavailable','self-validation','source-changed','balance-inconsistent')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(account_id,event_id,reason)
);
CREATE INDEX community_chest_leader_month ON economy_private.community_chest_events(leader_account,month_start,event_id);
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['community_chest_policy','community_chest_events','community_chest_holds'] LOOP
 EXECUTE format('ALTER TABLE economy_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON economy_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;END $$;
CREATE TRIGGER community_chest_events_immutable BEFORE UPDATE OR DELETE ON economy_private.community_chest_events FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();
CREATE TRIGGER community_chest_holds_immutable BEFORE UPDATE OR DELETE ON economy_private.community_chest_holds FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();
CREATE INDEX community_chest_account_period ON public.chest_operations(account_id,(rewards->>'weekStart'),(rewards->>'monthStart')) WHERE operation_type='grant' AND source LIKE 'community001c:%';

CREATE FUNCTION economy_private.community_chest_validator(p_validator uuid,p_mission uuid) RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.guild_missions m JOIN public.guilds g ON g.id=m.guild_id AND g.status='active'
 JOIN public.guild_members gm ON gm.guild_id=g.id AND gm.traveler_id=p_validator AND gm.status='active'
 JOIN public.travelers v ON v.id=gm.traveler_id JOIN auth.users u ON u.id=v.user_id
 WHERE m.id=p_mission AND m.community_protocol=1 AND u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
 AND u.deleted_at IS NULL AND(u.banned_until IS NULL OR u.banned_until<=statement_timestamp())
 AND((gm.role='leader' AND g.leader_traveler_id=v.id AND guild_admin_private.leader_not_revoked(v.id))
 OR EXISTS(SELECT 1 FROM guild_activity_private.delegations d WHERE d.mission_id=m.id AND d.traveler_id=v.id AND d.active AND d.expires_at>clock_timestamp())))
$$;
CREATE FUNCTION economy_private.community_chest_hold(p_owner uuid,p_event uuid,p_mission uuid,p_actor uuid,p_reason text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 INSERT INTO economy_private.community_chest_holds(account_id,event_id,mission_id,traveler_id,reason) VALUES(p_owner,p_event,p_mission,p_actor,p_reason) ON CONFLICT DO NOTHING;
 RETURN jsonb_build_object('version',1,'status','suspended');END $$;

CREATE FUNCTION economy_private.claim_community_chest_001c(p_actor uuid,p_mission uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;policy economy_private.community_chest_policy;m public.guild_missions;root public.guild_missions;d guild_activity_private.details;
 e guild_activity_private.future_eligibility;gp public.guild_mission_progress;ev economy_private.community_chest_events;
receipt public.chest_operations;leader_uid uuid;reviewer_uid uuid;event_uid uuid;week_begin timestamptz;month_begin timestamptz;week_key text;month_key text;k text;used integer;source_value text;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF p_mission IS NULL THEN RAISE EXCEPTION 'Activity required' USING ERRCODE='22023';END IF;
 SELECT * INTO policy FROM economy_private.community_chest_policy WHERE singleton FOR SHARE;
 IF NOT coalesce(policy.enabled,false) THEN RETURN jsonb_build_object('version',1,'status','disabled');END IF;
 PERFORM guild_admin_private.require_writes();
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('version',1,'status','legacy-reconciliation-required');END IF;
 SELECT * INTO m FROM public.guild_missions WHERE id=p_mission FOR UPDATE;
 SELECT * INTO d FROM guild_activity_private.details WHERE mission_id=m.id FOR UPDATE;
 IF m.id IS NULL OR d.mission_id IS NULL OR d.kind<>'activity' OR m.community_protocol<>1
 OR NOT EXISTS(SELECT 1 FROM public.guild_members gm JOIN public.guilds g ON g.id=gm.guild_id WHERE gm.guild_id=m.guild_id AND gm.traveler_id=p_actor AND gm.status='active' AND g.status='active') THEN RAISE EXCEPTION 'Activity unavailable' USING ERRCODE='42501';END IF;
 event_uid:=coalesce(d.meeting_id,m.id);
 k:='community-chest:v1:'||who||':'||event_uid;
 SELECT * INTO receipt FROM public.chest_operations WHERE identity_key=k;
 IF FOUND THEN RETURN jsonb_build_object('version',1,'status','already-awarded','receiptId',receipt.id,'travelerId',receipt.traveler_id,'chestType',receipt.chest_type,'eventId',event_uid);END IF;
 SELECT * INTO root FROM public.guild_missions WHERE id=event_uid FOR UPDATE;
 SELECT * INTO e FROM guild_activity_private.future_eligibility WHERE mission_id=m.id AND owner_id=who AND traveler_id=p_actor FOR UPDATE;
 SELECT * INTO gp FROM public.guild_mission_progress WHERE mission_id=m.id AND participant_uid=who AND traveler_id=p_actor FOR UPDATE;
 IF m.status NOT IN('published','closed') OR root.status NOT IN('published','closed') OR root.community_protocol IS DISTINCT FROM 1 OR root.guild_id<>m.guild_id
 OR m.created_at<policy.activated_at OR root.starts_at IS NULL OR root.starts_at<policy.activated_at OR root.starts_at>clock_timestamp()
 OR e.mission_id IS NULL OR NOT e.validated OR gp.status IS DISTINCT FROM 'approved' OR gp.approved_at IS NULL OR gp.approved_at<policy.activated_at
 OR (m.audience='selected' AND NOT p_actor=ANY(m.target_traveler_ids)) THEN RETURN jsonb_build_object('version',1,'status','not-eligible');END IF;
 IF e.category NOT IN('common','epic') OR e.category IS DISTINCT FROM d.future_category THEN RETURN jsonb_build_object('version',1,'status','category-disabled');END IF;
 IF EXISTS(SELECT 1 FROM economy_private.community_chest_holds WHERE account_id=who AND event_id=event_uid) THEN RETURN jsonb_build_object('version',1,'status','suspended');END IF;
 IF e.participation_revision IS DISTINCT FROM gp.community_revision THEN RETURN economy_private.community_chest_hold(who,event_uid,m.id,p_actor,'source-changed');END IF;
 SELECT user_id INTO reviewer_uid FROM public.travelers WHERE id=gp.approved_by_traveler_id;
 IF reviewer_uid=who THEN RETURN economy_private.community_chest_hold(who,event_uid,m.id,p_actor,'self-validation');END IF;
 IF NOT economy_private.community_chest_validator(gp.approved_by_traveler_id,m.id) THEN RETURN economy_private.community_chest_hold(who,event_uid,m.id,p_actor,'validator-unavailable');END IF;
 SELECT t.user_id INTO leader_uid FROM public.guilds g JOIN public.travelers t ON t.id=g.leader_traveler_id JOIN auth.users u ON u.id=t.user_id
 WHERE g.id=m.guild_id AND g.status='active' AND guild_admin_private.leader_not_revoked(t.id) AND u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false) AND u.deleted_at IS NULL AND(u.banned_until IS NULL OR u.banned_until<=clock_timestamp());
 IF leader_uid IS NULL THEN RETURN economy_private.community_chest_hold(who,event_uid,m.id,p_actor,'validator-unavailable');END IF;
 IF e.category='epic' AND reviewer_uid IS DISTINCT FROM leader_uid THEN RETURN economy_private.community_chest_hold(who,event_uid,m.id,p_actor,'validator-unavailable');END IF;
 week_begin:=date_trunc('week',root.starts_at AT TIME ZONE policy.timezone) AT TIME ZONE policy.timezone;
 month_begin:=date_trunc('month',root.starts_at AT TIME ZONE policy.timezone) AT TIME ZONE policy.timezone;
 week_key:=to_char(week_begin AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"');month_key:=to_char(month_begin AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"');
 SELECT * INTO ev FROM economy_private.community_chest_events WHERE mission_id=m.id;
 IF FOUND AND(ev.event_id<>event_uid OR ev.scheduled_at<>root.starts_at OR ev.leader_account<>leader_uid OR ev.chest_type<>e.category) THEN RETURN economy_private.community_chest_hold(who,event_uid,m.id,p_actor,'source-changed');END IF;
 IF NOT FOUND THEN INSERT INTO economy_private.community_chest_events VALUES(m.id,event_uid,root.starts_at,week_begin,month_begin,leader_uid,e.category,clock_timestamp());END IF;
 -- Every child of a shared meeting uses its fixed event identity and authorization.
 IF EXISTS(SELECT 1 FROM economy_private.community_chest_events WHERE event_id=event_uid AND(scheduled_at<>root.starts_at OR leader_account<>leader_uid OR chest_type<>e.category)) THEN RETURN economy_private.community_chest_hold(who,event_uid,m.id,p_actor,'source-changed');END IF;
 IF e.category='common' THEN
 SELECT count(*) INTO used FROM public.chest_operations WHERE account_id=who AND operation_type='grant' AND source LIKE 'community001c:%' AND chest_type='common' AND rewards->>'weekStart'=week_key;
 IF used>=policy.weekly_common THEN RETURN jsonb_build_object('version',1,'status','weekly-limit');END IF;
 ELSE
 SELECT count(*) INTO used FROM public.chest_operations WHERE account_id=who AND operation_type='grant' AND source LIKE 'community001c:%' AND chest_type='epic' AND rewards->>'monthStart'=month_key;
 IF used>=policy.monthly_epic THEN RETURN jsonb_build_object('version',1,'status','monthly-limit');END IF;
 SELECT count(DISTINCT evs.event_id) INTO used FROM public.chest_operations receipts JOIN economy_private.community_chest_events evs ON evs.mission_id::text=receipts.rewards->>'missionId' WHERE receipts.operation_type='grant' AND receipts.source LIKE 'community001c:%' AND receipts.chest_type='epic' AND evs.leader_account=leader_uid AND evs.month_start=month_begin;
 IF used>=policy.leader_events AND NOT EXISTS(SELECT 1 FROM public.chest_operations receipts JOIN economy_private.community_chest_events evs ON evs.mission_id::text=receipts.rewards->>'missionId' WHERE receipts.operation_type='grant' AND receipts.source LIKE 'community001c:%' AND receipts.chest_type='epic' AND evs.event_id=event_uid AND evs.leader_account=leader_uid AND evs.month_start=month_begin) THEN RETURN jsonb_build_object('version',1,'status','leader-monthly-limit');END IF;
 END IF;
 source_value:='community001c:'||event_uid;
 PERFORM public.grant_traveler_chest(p_actor,e.category,source_value,k);
 UPDATE public.chest_operations SET account_id=who,identity_key=k,rewards=jsonb_build_object('contract','ECONOMY-001C:v1','catalogVersion',policy.catalog_version,'eventId',event_uid,'missionId',m.id,'weekStart',week_key,'monthStart',month_key,'validatorId',gp.approved_by_traveler_id,'participationRevision',gp.community_revision)
 WHERE traveler_id=p_actor AND operation_key=k RETURNING * INTO receipt;
 RETURN jsonb_build_object('version',1,'status','awarded','receiptId',receipt.id,'travelerId',p_actor,'chestType',receipt.chest_type,'eventId',event_uid);
END $$;

CREATE FUNCTION economy_private.open_community_chest_001c(p_actor uuid,p_type text,p_operation uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;policy economy_private.community_chest_policy;c public.traveler_chests;r public.chest_operations;prior public.chest_operations;
 result_value jsonb;event_uid uuid;m uuid;v uuid;revision integer;actual_balance bigint;expected_balance bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF p_operation IS NULL OR p_type IS NULL OR p_type NOT IN('common','epic') THEN RAISE EXCEPTION 'Approved chest required' USING ERRCODE='22023';END IF;
 -- Recheck after the shared/account lock: a racing retry cannot consume another chest.
 SELECT * INTO prior FROM public.chest_operations WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF FOUND THEN
 IF prior.operation_type<>'open' OR prior.account_id IS DISTINCT FROM who OR prior.chest_type<>p_type OR prior.source NOT LIKE 'community001c:%' THEN RAISE EXCEPTION 'Operation conflict' USING ERRCODE='22023';END IF;
 RETURN prior.rewards||jsonb_build_object('duplicate',true);END IF;
 SELECT * INTO policy FROM economy_private.community_chest_policy WHERE singleton FOR SHARE;
 IF NOT coalesce(policy.enabled,false) THEN RAISE EXCEPTION 'Chest opening disabled' USING ERRCODE='42501';END IF;
 PERFORM guild_admin_private.require_writes();
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Legacy reconciliation required' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM public.traveler_chests WHERE traveler_id=p_actor AND chest_type=p_type AND quantity>0 FOR UPDATE;
 IF c.traveler_id IS NULL OR jsonb_array_length(c.sources)<>c.quantity OR(c.sources->>0) NOT LIKE 'community001c:%' THEN RAISE EXCEPTION 'Reviewed chest origin required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND operation_type='grant' AND chest_type=p_type AND source=c.sources->>0 AND rewards->>'catalogVersion'=policy.catalog_version;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Grant receipt unavailable' USING ERRCODE='42501';END IF;
 event_uid:=(r.rewards->>'eventId')::uuid;m:=(r.rewards->>'missionId')::uuid;v:=(r.rewards->>'validatorId')::uuid;revision:=(r.rewards->>'participationRevision')::integer;
 IF EXISTS(SELECT 1 FROM economy_private.community_chest_holds WHERE account_id=who AND event_id=event_uid) THEN RETURN jsonb_build_object('version',1,'status','suspended');END IF;
 IF NOT EXISTS(SELECT 1 FROM guild_activity_private.future_eligibility e JOIN public.guild_mission_progress gp ON gp.mission_id=e.mission_id AND gp.traveler_id=e.traveler_id AND gp.participant_uid=e.owner_id
 JOIN public.guild_missions mission ON mission.id=e.mission_id JOIN public.guild_missions root ON root.id=event_uid
 JOIN public.guild_members gm ON gm.guild_id=mission.guild_id AND gm.traveler_id=p_actor AND gm.status='active'
 WHERE e.mission_id=m AND e.owner_id=who AND e.traveler_id=p_actor AND e.validated AND e.participation_revision=revision AND gp.community_revision=revision AND gp.status='approved' AND gp.approved_by_traveler_id=v AND mission.status IN('published','closed') AND root.status IN('published','closed')) THEN RETURN economy_private.community_chest_hold(who,event_uid,m,p_actor,'source-changed');END IF;
 IF NOT economy_private.community_chest_validator(v,m) THEN RETURN economy_private.community_chest_hold(who,event_uid,m,p_actor,'validator-unavailable');END IF;
 SELECT coins INTO actual_balance FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 SELECT coalesce(sum((rewards->>'coins')::bigint),0) INTO expected_balance FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND operation_type='open' AND source LIKE 'community001c:%';
 IF actual_balance IS DISTINCT FROM expected_balance THEN RETURN economy_private.community_chest_hold(who,event_uid,m,p_actor,'balance-inconsistent');END IF;
 result_value:=economy_private.open_chest(p_actor,p_type,p_operation);
 IF ((p_type='common' AND((result_value->>'coins'='25' AND result_value->>'itemId' IS NULL) OR(result_value->>'coins'='10' AND result_value->>'itemId'='traveler-sword-common')))
 OR(p_type='epic' AND((result_value->>'coins'='190' AND result_value->>'itemId' IS NULL) OR(result_value->>'coins'='70' AND result_value->>'itemId'='traveler-helmet-rare')))) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Loot differs from approved catalog' USING ERRCODE='42501';END IF;
 UPDATE public.chest_operations SET account_id=who,identity_key='community-open:v1:'||who||':'||p_operation WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 RETURN result_value;
END $$;
CREATE FUNCTION economy_private.community_chest_freeze() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF TG_TABLE_NAME='guild_missions' THEN
  IF NEW.starts_at IS DISTINCT FROM OLD.starts_at AND EXISTS(SELECT 1 FROM economy_private.community_chest_events WHERE event_id=OLD.id OR mission_id=OLD.id) THEN RAISE EXCEPTION 'Economic event date is frozen' USING ERRCODE='PT409';END IF;
 ELSE
  IF(NEW.meeting_id IS DISTINCT FROM OLD.meeting_id OR NEW.future_category IS DISTINCT FROM OLD.future_category OR NEW.kind IS DISTINCT FROM OLD.kind) AND EXISTS(SELECT 1 FROM economy_private.community_chest_events WHERE mission_id=OLD.mission_id) THEN RAISE EXCEPTION 'Economic event scope is frozen' USING ERRCODE='PT409';END IF;
 END IF;RETURN NEW;END $$;
CREATE TRIGGER community_chest_date_freeze BEFORE UPDATE OF starts_at ON public.guild_missions FOR EACH ROW EXECUTE FUNCTION economy_private.community_chest_freeze();
CREATE TRIGGER community_chest_scope_freeze BEFORE UPDATE ON guild_activity_private.details FOR EACH ROW EXECUTE FUNCTION economy_private.community_chest_freeze();
REVOKE ALL ON FUNCTION economy_private.community_chest_freeze() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.claim_community_chest(p_actor uuid,p_mission uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT economy_private.claim_community_chest_001c(p_actor,p_mission)$$;
CREATE FUNCTION public.open_community_chest(p_actor uuid,p_chest_type text,p_operation_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT economy_private.open_community_chest_001c(p_actor,p_chest_type,p_operation_id)$$;
REVOKE ALL ON FUNCTION economy_private.community_chest_validator(uuid,uuid),economy_private.community_chest_hold(uuid,uuid,uuid,uuid,text),economy_private.claim_community_chest_001c(uuid,uuid),economy_private.open_community_chest_001c(uuid,text,uuid),public.claim_community_chest(uuid,uuid),public.open_community_chest(uuid,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_private.claim_community_chest_001c(uuid,uuid),economy_private.open_community_chest_001c(uuid,text,uuid),public.claim_community_chest(uuid,uuid),public.open_community_chest(uuid,text,uuid) TO authenticated;
