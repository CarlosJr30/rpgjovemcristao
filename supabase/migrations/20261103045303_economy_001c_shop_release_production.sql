-- PROD ONLY. PROD prices require the explicit owner decision recorded before remote application.
-- Reviewed release authority. Generate separate environment migrations; never apply this template.
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='45s';
DO $$BEGIN
 IF current_setting('shop001c.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001' OR public.economy_protocol_version()<>3
 OR to_regclass('economy_private.community_chest_policy') IS NULL OR to_regnamespace('shop_private') IS NOT NULL
 OR current_setting('shop001c.price_approval',true) IS DISTINCT FROM 'common40-sword35-armor65-shield115' OR to_regnamespace('shop_qa_private') IS NOT NULL OR to_regnamespace('arena_qa_private') IS NOT NULL THEN RAISE EXCEPTION 'Reviewed shop release scope and approval required' USING ERRCODE='42501';END IF;
END $$;
DO $$DECLARE r record;p regprocedure;BEGIN FOR r IN SELECT * FROM(VALUES
 ('economy_private.purchase_chest(uuid,text,uuid)','0096e39e9a9e0a4056687d90b2baf575'),
 ('economy_private.open_chest(uuid,text,uuid)','63af7f1b3138b9056c91bf9242fda193'),
 ('economy_private.base_authority(uuid,uuid,text,jsonb)','dfbdda1b79abdae9cb5e7ffba8bca421')
 )v(signature,hash) LOOP p:=to_regprocedure(r.signature);IF p IS NULL OR md5(replace(pg_get_functiondef(p),E'\r\n',E'\n'))<>r.hash OR(SELECT proacl::text FROM pg_proc WHERE oid=p)<>'{postgres=X/postgres}' THEN RAISE EXCEPTION 'Reviewed prior authority required' USING ERRCODE='42501';END IF;END LOOP;
 IF has_function_privilege('authenticated','public.purchase_chest(uuid,text,uuid)','execute') OR has_function_privilege('authenticated','public.arena_authority_v3(uuid,uuid,text,jsonb)','execute') THEN RAISE EXCEPTION 'Generic economic execution must remain denied' USING ERRCODE='42501';END IF;
 IF (SELECT md5(pg_get_constraintdef(oid)) FROM pg_constraint WHERE conrelid='public.chest_operations'::regclass AND conname='chest_operations_type_check') IS DISTINCT FROM 'b19dab2088f99068d45d81f0d3743374'
 OR md5(replace(pg_get_functiondef('economy_private.open_community_chest_001c(uuid,text,uuid)'::regprocedure),E'\r\n',E'\n'))<>'6554959901c07929b5c90e49e3717638'
 OR (SELECT proacl::text FROM pg_proc WHERE oid='economy_private.open_community_chest_001c(uuid,text,uuid)'::regprocedure)<>'{postgres=X/postgres,authenticated=X/postgres}' THEN RAISE EXCEPTION 'Reviewed community and ledger contract required' USING ERRCODE='42501';END IF;
END $$;
CREATE SCHEMA shop_private;
REVOKE ALL ON SCHEMA shop_private FROM PUBLIC,anon,authenticated,service_role;GRANT USAGE ON SCHEMA shop_private TO authenticated;
CREATE TABLE shop_private.policy(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT true,activated_at timestamptz NOT NULL DEFAULT clock_timestamp(),catalog_version text NOT NULL CHECK(catalog_version='ECONOMY-001C:shop:v1'));
INSERT INTO shop_private.policy(singleton,catalog_version) VALUES(true,'ECONOMY-001C:shop:v1');
CREATE TABLE shop_private.holds(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES auth.users(id),traveler_id uuid NOT NULL REFERENCES public.travelers(id),operation_id uuid NOT NULL,reason text NOT NULL CHECK(reason IN('balance-inconsistent','source-unavailable')),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(account_id,traveler_id,reason));
ALTER TABLE shop_private.policy ENABLE ROW LEVEL SECURITY;ALTER TABLE shop_private.holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA shop_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER shop_holds_immutable BEFORE UPDATE OR DELETE ON shop_private.holds FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK(
 (operation_type IN('grant','purchase','open') AND chest_type IS NOT NULL)
 OR(operation_type IN('card-starter','card-revocation','arena-result','tower-result','community-xp') AND chest_type IS NULL)
 OR(operation_type='equipment-purchase' AND chest_type IS NULL AND source='shop001c:equipment' AND account_id IS NOT NULL AND price_paid IS NOT NULL AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1' AND rewards ? 'itemId') );
CREATE FUNCTION shop_private.coin_balance(p_actor uuid) RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(sum(CASE WHEN operation_type='open' THEN (rewards->>'coins')::bigint WHEN operation_type IN('purchase','equipment-purchase') THEN -price_paid::bigint ELSE 0 END),0)
 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND((operation_type='open' AND source LIKE 'community001c:%') OR(source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
$$;
CREATE FUNCTION shop_private.balance_valid(p_actor uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.wallets WHERE traveler_id=p_actor AND coins=shop_private.coin_balance(p_actor))
$$;
CREATE FUNCTION shop_private.actor(p_actor uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE who uuid;BEGIN
 IF public.release_scope()<>'guild-ebd-001' THEN RAISE EXCEPTION 'Release scope denied' USING ERRCODE='42501';END IF;
 who:=economy_private.community_xp_actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL)
 OR EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN RAISE EXCEPTION 'Verified economic provenance required' USING ERRCODE='42501';END IF;
 RETURN who;END $$;
CREATE FUNCTION shop_private.hold(p_owner uuid,p_actor uuid,p_operation uuid,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN
 INSERT INTO shop_private.holds(account_id,traveler_id,operation_id,reason) VALUES(p_owner,p_actor,p_operation,p_reason) ON CONFLICT DO NOTHING;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'status','suspended');END $$;
CREATE FUNCTION shop_private.state(p_actor uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE who uuid;reason text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF public.release_scope()<>'guild-ebd-001' OR NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN reason:='disabled';
 ELSIF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL) THEN reason:='legacy-reconciliation-required';
 ELSIF EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN reason:='qa-source';
 ELSIF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) THEN reason:='suspended';
 ELSIF NOT shop_private.balance_valid(p_actor) THEN reason:='balance-inconsistent';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'enabled',reason IS NULL,'reason',reason,'coins',(SELECT coins FROM public.wallets WHERE traveler_id=p_actor),'balanceVerified',reason IS NULL,'catalogVersion','ECONOMY-001C:shop:v1','offers',jsonb_build_array(
 jsonb_build_object('kind','chest','id','common','price',40),jsonb_build_object('kind','equipment','id','traveler-sword-common','price',35),jsonb_build_object('kind','equipment','id','traveler-armor-uncommon','price',65),jsonb_build_object('kind','equipment','id','traveler-shield-rare','price',115)));
END $$;
CREATE FUNCTION shop_private.purchase(p_actor uuid,p_kind text,p_offer text,p_operation uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;prior public.chest_operations;answer jsonb;price integer;receipt uuid;k text;source_value text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF p_operation IS NULL OR p_kind IS NULL OR p_offer IS NULL OR NOT((p_kind='chest' AND p_offer='common') OR(p_kind='equipment' AND p_offer IN('traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare'))) THEN RAISE EXCEPTION 'Reviewed offer required' USING ERRCODE='22023';END IF;
 k:='shop-purchase:v1:'||who||':'||p_operation;SELECT * INTO prior FROM public.chest_operations WHERE identity_key=k;
 IF FOUND THEN IF prior.traveler_id<>p_actor OR(p_kind='chest' AND(prior.operation_type<>'purchase' OR prior.chest_type<>p_offer)) OR(p_kind='equipment' AND(prior.operation_type<>'equipment-purchase' OR prior.rewards->>'itemId' IS DISTINCT FROM p_offer)) THEN RAISE EXCEPTION 'Purchase identity conflict' USING ERRCODE='22023';END IF;RETURN jsonb_build_object('version',1,'qaOnly',false,'receiptId',prior.id,'kind',p_kind,'offer',p_offer,'pricePaid',prior.price_paid,'replayed',true);END IF;
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN RAISE EXCEPTION 'Shop disabled' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 IF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) OR NOT shop_private.balance_valid(p_actor) THEN RETURN shop_private.hold(who,p_actor,p_operation,'balance-inconsistent');END IF;
 IF p_kind='chest' THEN answer:=economy_private.purchase_chest(p_actor,'common',p_operation);price:=40;source_value:='shop001c:'||p_operation;
 UPDATE public.traveler_chests SET sources=jsonb_set(sources,ARRAY[(quantity-1)::text],to_jsonb(source_value),false) WHERE traveler_id=p_actor AND chest_type='common';
 UPDATE public.chest_operations SET account_id=who,identity_key=k,source=source_value,rewards=rewards||jsonb_build_object('catalogVersion','ECONOMY-001C:shop:v1') WHERE traveler_id=p_actor AND operation_key='purchase:'||p_operation RETURNING id INTO receipt;
 ELSE answer:=economy_private.base_authority(who,p_actor,'purchase',jsonb_build_object('itemId',p_offer));price:=CASE WHEN answer->>'status'='owned' THEN 0 ELSE CASE p_offer WHEN 'traveler-sword-common' THEN 35 WHEN 'traveler-armor-uncommon' THEN 65 WHEN 'traveler-shield-rare' THEN 115 END END;
 INSERT INTO public.chest_operations(traveler_id,account_id,identity_key,operation_key,operation_type,chest_type,source,price_paid,rewards) VALUES(p_actor,who,k,'equipment-purchase:'||p_operation,'equipment-purchase',NULL,'shop001c:equipment',price,jsonb_build_object('itemId',p_offer,'catalogVersion','ECONOMY-001C:shop:v1','status',answer->>'status')) RETURNING id INTO receipt;END IF;
 IF receipt IS NULL OR NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Purchase reconciliation failed' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'receiptId',receipt,'kind',p_kind,'offer',p_offer,'pricePaid',price,'replayed',false);END $$;
CREATE FUNCTION shop_private.open(p_actor uuid,p_type text,p_operation uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;prior public.chest_operations;c public.traveler_chests;answer jsonb;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF p_operation IS NULL OR p_type IS NULL OR p_type NOT IN('common','epic') THEN RAISE EXCEPTION 'Reviewed opening required' USING ERRCODE='22023';END IF;
 SELECT * INTO prior FROM public.chest_operations WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF FOUND THEN IF prior.account_id IS DISTINCT FROM who OR prior.chest_type<>p_type OR prior.operation_type<>'open' OR NOT(prior.source LIKE 'community001c:%' OR prior.source LIKE 'shop001c:%') THEN RAISE EXCEPTION 'Opening identity conflict' USING ERRCODE='22023';END IF;RETURN prior.rewards||jsonb_build_object('duplicate',true);END IF;
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN RAISE EXCEPTION 'Shop disabled' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM public.traveler_chests WHERE traveler_id=p_actor AND chest_type=p_type AND quantity>0 FOR UPDATE;
 IF c.traveler_id IS NOT NULL AND c.sources->>0 LIKE 'community001c:%' THEN RETURN economy_private.open_community_chest_001c(p_actor,p_type,p_operation);END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 IF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) OR NOT shop_private.balance_valid(p_actor) THEN RETURN shop_private.hold(who,p_actor,p_operation,'balance-inconsistent');END IF;
 IF p_type<>'common' OR c.traveler_id IS NULL OR jsonb_array_length(c.sources)<>c.quantity OR(c.sources->>0) NOT LIKE 'shop001c:%' OR NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND source=c.sources->>0 AND operation_type='purchase' AND chest_type='common' AND price_paid=40 AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1') THEN RETURN shop_private.hold(who,p_actor,p_operation,'source-unavailable');END IF;
 answer:=economy_private.open_chest(p_actor,'common',p_operation);
 IF((answer->>'coins'='25' AND answer->>'itemId' IS NULL) OR(answer->>'coins'='10' AND answer->>'itemId'='traveler-sword-common')) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Reviewed common loot required' USING ERRCODE='42501';END IF;
 UPDATE public.chest_operations SET account_id=who,identity_key='shop-open:v1:'||who||':'||p_operation,rewards=rewards||jsonb_build_object('catalogVersion','ECONOMY-001C:shop:v1') WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Opening reconciliation failed' USING ERRCODE='42501';END IF;RETURN answer;END $$;
CREATE OR REPLACE FUNCTION shop_private.owned_equipment(p_traveler_id uuid, p_slot text, p_item_id text, p_expected_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor uuid := auth.uid(); previous_item text; expected_slot text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 -- Same lock order as combat: account -> Traveler -> inventory/equipment.
 PERFORM 1 FROM auth.users WHERE id=actor AND NOT coalesce(is_anonymous,false) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.travelers WHERE id=p_traveler_id AND user_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ownership denied' USING ERRCODE='42501'; END IF;
 IF p_slot IS NULL OR p_slot NOT IN ('helmet','armor','weapon','shield','boots','amulet') THEN
  RAISE EXCEPTION 'Invalid slot' USING ERRCODE='22023';
 END IF;
 -- Frozen mapping of the six existing EQUIPMENT_CATALOG entries. Client item
 -- metadata, bonuses, role, level and quantity are never accepted as authority.
 IF p_item_id IS NOT NULL THEN
  expected_slot := CASE p_item_id
   WHEN 'traveler-boots' THEN 'boots'
   WHEN 'traveler-helmet-rare' THEN 'helmet'
   WHEN 'wisdom-amulet' THEN 'amulet'
   WHEN 'traveler-sword-common' THEN 'weapon'
   WHEN 'traveler-armor-uncommon' THEN 'armor'
   WHEN 'traveler-shield-rare' THEN 'shield' END;
  IF expected_slot IS DISTINCT FROM p_slot THEN
   RAISE EXCEPTION 'Equipment denied' USING ERRCODE='42501';
  END IF;
  PERFORM 1 FROM public.inventory WHERE traveler_id=p_traveler_id
   AND item_id=p_item_id AND quantity>0 AND card_receipt_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item ownership denied' USING ERRCODE='42501'; END IF;
 END IF;
 SELECT item_id INTO previous_item FROM public.equipped_items
  WHERE traveler_id=p_traveler_id AND slot=p_slot;
 -- Safe replay after a lost response. It cannot create or consume an item.
 IF previous_item IS NOT DISTINCT FROM p_item_id THEN
  RETURN coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.equipped_items
   WHERE traveler_id=p_traveler_id),'{}'::jsonb);
 END IF;
 IF previous_item IS DISTINCT FROM p_expected_item_id THEN
  RAISE EXCEPTION 'Equipment changed; reload' USING ERRCODE='PT409';
 END IF;
 IF EXISTS(SELECT 1 FROM economy_private.battles WHERE traveler_id=p_traveler_id
  AND mode IN ('arena-v3','tower-v3') AND settled_at IS NULL) THEN
  RAISE EXCEPTION 'Battle in progress' USING ERRCODE='PT409';
 END IF;
 IF p_item_id IS NULL THEN
  DELETE FROM public.equipped_items WHERE traveler_id=p_traveler_id AND slot=p_slot;
 ELSE
  INSERT INTO public.equipped_items(traveler_id,slot,item_id)
   VALUES(p_traveler_id,p_slot,p_item_id)
   ON CONFLICT(traveler_id,slot) DO UPDATE
    SET item_id=excluded.item_id,equipped_at=now();
 END IF;
 RETURN coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.equipped_items
  WHERE traveler_id=p_traveler_id),'{}'::jsonb);
END $function$;
CREATE FUNCTION shop_private.equip(p_actor uuid,p_slot text,p_item text,p_expected text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE who uuid;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) OR p_slot IS NULL OR p_slot NOT IN('weapon','armor','shield','helmet') OR(p_item IS NOT NULL AND p_item NOT IN('traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare','traveler-helmet-rare')) THEN RAISE EXCEPTION 'Reviewed equipment required' USING ERRCODE='42501';END IF;
 IF p_item IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE account_id=who AND traveler_id=p_actor AND rewards->>'itemId'=p_item AND((operation_type='open' AND source LIKE 'community001c:%') OR(operation_type IN('open','equipment-purchase') AND source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))) THEN RAISE EXCEPTION 'Verified acquisition receipt required' USING ERRCODE='42501';END IF;
 RETURN shop_private.owned_equipment(p_actor,p_slot,p_item,p_expected);END $$;
CREATE OR REPLACE FUNCTION economy_private.open_community_chest_001c(p_actor uuid,p_type text,p_operation uuid) RETURNS jsonb
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
 SELECT shop_private.coin_balance(p_actor) INTO expected_balance;
 IF actual_balance IS DISTINCT FROM expected_balance THEN RETURN economy_private.community_chest_hold(who,event_uid,m,p_actor,'balance-inconsistent');END IF;
 result_value:=economy_private.open_chest(p_actor,p_type,p_operation);
 IF ((p_type='common' AND((result_value->>'coins'='25' AND result_value->>'itemId' IS NULL) OR(result_value->>'coins'='10' AND result_value->>'itemId'='traveler-sword-common')))
 OR(p_type='epic' AND((result_value->>'coins'='190' AND result_value->>'itemId' IS NULL) OR(result_value->>'coins'='70' AND result_value->>'itemId'='traveler-helmet-rare')))) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Loot differs from approved catalog' USING ERRCODE='42501';END IF;
 UPDATE public.chest_operations SET account_id=who,identity_key='community-open:v1:'||who||':'||p_operation WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 RETURN result_value;
END $$;
CREATE FUNCTION public.get_shop(p_actor uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_private.state(p_actor)$$;
CREATE FUNCTION public.purchase_shop(p_actor uuid,p_kind text,p_offer text,p_operation_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_private.purchase(p_actor,p_kind,p_offer,p_operation_id)$$;
CREATE FUNCTION public.open_shop_chest(p_actor uuid,p_chest_type text,p_operation_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_private.open(p_actor,p_chest_type,p_operation_id)$$;
CREATE FUNCTION public.equip_shop_item(p_actor uuid,p_slot text,p_item_id text,p_expected_item_id text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_private.equip(p_actor,p_slot,p_item_id,p_expected_item_id)$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA shop_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_shop(uuid),public.purchase_shop(uuid,text,text,uuid),public.open_shop_chest(uuid,text,uuid),public.equip_shop_item(uuid,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION shop_private.state(uuid),shop_private.purchase(uuid,text,text,uuid),shop_private.open(uuid,text,uuid),shop_private.equip(uuid,text,text,text),public.get_shop(uuid),public.purchase_shop(uuid,text,text,uuid),public.open_shop_chest(uuid,text,uuid),public.equip_shop_item(uuid,text,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
