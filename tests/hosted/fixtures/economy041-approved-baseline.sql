-- Frozen approved pre-041 definitions for the disposable PostgreSQL bootstrap only.
-- No player rows, login sessions, credentials or runtime override are imported.
CREATE OR REPLACE FUNCTION shop_private.actor(p_actor uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$DECLARE who uuid;BEGIN
 IF public.release_scope()<>'__SCOPE__' THEN RAISE EXCEPTION 'Release scope denied' USING ERRCODE='42501';END IF;
 who:=economy_private.community_xp_actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL)
 OR EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN RAISE EXCEPTION 'Verified economic provenance required' USING ERRCODE='42501';END IF;
 RETURN who;END $function$;
CREATE OR REPLACE FUNCTION shop_private.balance_valid(p_actor uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.wallets WHERE traveler_id=p_actor AND coins=shop_private.coin_balance(p_actor))
$function$;
CREATE OR REPLACE FUNCTION shop_private.coin_balance(p_actor uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT coalesce(sum(CASE WHEN operation_type='open' THEN (rewards->>'coins')::bigint
 WHEN operation_type IN('purchase','equipment-purchase') THEN -price_paid::bigint ELSE 0 END),0)
 +coalesce((SELECT (r.rewards->>'baselineCoins')::bigint FROM public.chest_operations r
 WHERE p_actor='31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid AND r.traveler_id=p_actor AND r.account_id='78729453-8e04-478c-96ae-d37cead1bc8c'::uuid
 AND r.account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND r.operation_type='administrative-reconciliation' AND r.source='legacy-admin-010'
 AND r.identity_key='legacy-admin-010:31b70059-deca-44c8-a6df-f21ea68b6e42'
 AND r.rewards->>'contract'='RPG-ECONOMY-FIX-010:v1'
 AND r.rewards->>'approvalRef'='OWNER-APPROVED-2026-11-07'
 AND r.rewards->>'baselineCoins'='1006265'),0)
 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND((operation_type='open' AND source LIKE 'community001c:%') OR(source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
$function$;
CREATE OR REPLACE FUNCTION shop_private.state(p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$DECLARE who uuid;reason text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF public.release_scope()<>'__SCOPE__' OR NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN reason:='disabled';
 ELSIF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL) THEN reason:='legacy-reconciliation-required';
 ELSIF EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN reason:='qa-source';
 ELSIF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) THEN reason:='suspended';
 ELSIF NOT shop_private.balance_valid(p_actor) THEN reason:='balance-inconsistent';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'enabled',reason IS NULL,'reason',reason,'coins',(SELECT coins FROM public.wallets WHERE traveler_id=p_actor),'balanceVerified',reason IS NULL,'catalogVersion','ECONOMY-001C:shop:v1','offers',jsonb_build_array(
 jsonb_build_object('kind','chest','id','common','price',40),jsonb_build_object('kind','equipment','id','traveler-sword-common','price',35),jsonb_build_object('kind','equipment','id','traveler-armor-uncommon','price',65),jsonb_build_object('kind','equipment','id','traveler-shield-rare','price',115)));
END $function$;
CREATE OR REPLACE FUNCTION shop_private.open(p_actor uuid, p_type text, p_operation uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE who uuid;prior public.chest_operations;c public.traveler_chests;answer jsonb;chosen text;position_index integer;remaining jsonb;wanted text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF p_operation IS NULL OR p_type IS NULL OR p_type NOT IN('common','epic') THEN RAISE EXCEPTION 'Reviewed opening required' USING ERRCODE='22023';END IF;
 SELECT * INTO prior FROM public.chest_operations WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF FOUND THEN IF prior.account_id IS DISTINCT FROM who OR prior.chest_type<>p_type OR prior.operation_type<>'open' OR NOT(prior.source LIKE 'community001c:%' OR prior.source LIKE 'shop001c:%') THEN RAISE EXCEPTION 'Opening identity conflict' USING ERRCODE='22023';END IF;RETURN prior.rewards||jsonb_build_object('duplicate',true);END IF;
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN RAISE EXCEPTION 'Shop disabled' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM public.traveler_chests WHERE traveler_id=p_actor AND chest_type=p_type AND quantity>0 FOR UPDATE;
 IF c.traveler_id IS NOT NULL AND c.sources->>0 LIKE 'community001c:%' AND NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND operation_key='purchase:'||p_operation AND operation_type='purchase' AND source='shop001c:'||p_operation) THEN RETURN economy_private.open_community_chest_001c(p_actor,p_type,p_operation);END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 IF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) OR NOT shop_private.balance_valid(p_actor) THEN RETURN shop_private.hold(who,p_actor,p_operation,'balance-inconsistent');END IF;
 -- Select only an outstanding, unique source backed by this account's purchase.
 -- The existing opener consumes index zero; move the selected source inside the
 -- same transaction, retaining the relative order of every unconsumed source.
 IF p_type='common' AND c.traveler_id IS NOT NULL AND jsonb_array_length(c.sources)=c.quantity THEN
   SELECT source INTO wanted FROM public.chest_operations
    WHERE traveler_id=p_actor AND account_id=who AND operation_type='purchase'
     AND chest_type='common' AND operation_key='purchase:'||p_operation
     AND source='shop001c:'||p_operation AND price_paid=40
     AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1';
   SELECT e.value,e.ordinality::integer-1 INTO chosen,position_index
    FROM jsonb_array_elements_text(c.sources) WITH ORDINALITY e(value,ordinality)
    WHERE e.value LIKE 'shop001c:%' AND (wanted IS NULL OR e.value=wanted)
     AND (SELECT count(*) FROM jsonb_array_elements_text(c.sources) z(value) WHERE z.value=e.value)=1
     AND EXISTS(SELECT 1 FROM public.chest_operations r WHERE r.traveler_id=p_actor AND r.account_id=who
       AND r.operation_type='purchase' AND r.chest_type='common' AND r.source=e.value
       AND r.operation_key='purchase:'||substring(e.value from 10) AND r.price_paid=40
       AND r.rewards->>'catalogVersion'='ECONOMY-001C:shop:v1')
     AND NOT EXISTS(SELECT 1 FROM public.chest_operations r WHERE r.traveler_id=p_actor
       AND r.operation_type='open' AND r.source=e.value)
    ORDER BY e.ordinality LIMIT 1;
   IF wanted IS NOT NULL AND chosen IS NULL THEN RAISE EXCEPTION 'Purchase already consumed or source unavailable' USING ERRCODE='22023';END IF;
   IF position_index>0 THEN
     remaining:=c.sources-position_index;
     c.sources:=jsonb_build_array(chosen)||remaining;
     UPDATE public.traveler_chests SET sources=c.sources WHERE traveler_id=p_actor AND chest_type=p_type;
   END IF;
 END IF;
 IF chosen IS NULL OR p_type<>'common' OR c.traveler_id IS NULL OR jsonb_array_length(c.sources)<>c.quantity OR(c.sources->>0) NOT LIKE 'shop001c:%' OR NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND source=c.sources->>0 AND operation_type='purchase' AND chest_type='common' AND price_paid=40 AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1') THEN RAISE EXCEPTION 'Verified unopened purchase required' USING ERRCODE='42501';END IF;
 answer:=economy_private.open_chest(p_actor,'common',p_operation);
 IF((answer->>'coins'='25' AND answer->>'itemId' IS NULL) OR(answer->>'coins'='10' AND answer->>'itemId'='traveler-sword-common')) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Reviewed common loot required' USING ERRCODE='42501';END IF;
 UPDATE public.chest_operations SET account_id=who,identity_key='shop-open:v1:'||who||':'||p_operation,rewards=rewards||jsonb_build_object('catalogVersion','ECONOMY-001C:shop:v1') WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Opening reconciliation failed' USING ERRCODE='42501';END IF;RETURN answer;END $function$;
CREATE OR REPLACE FUNCTION shop_private.purchase(p_actor uuid, p_kind text, p_offer text, p_operation uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 RETURN jsonb_build_object('version',1,'qaOnly',false,'receiptId',receipt,'kind',p_kind,'offer',p_offer,'pricePaid',price,'replayed',false);END $function$;
CREATE OR REPLACE FUNCTION shop_private.equip(p_actor uuid, p_slot text, p_item text, p_expected text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE who uuid; reason text;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);
 who:=shop_private.actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN RAISE EXCEPTION 'Equipment policy disabled' USING ERRCODE='42501'; END IF;
 IF p_slot IS NULL OR p_slot NOT IN('helmet','armor','weapon','shield','boots','amulet') THEN RAISE EXCEPTION 'Equipment slot denied' USING ERRCODE='42501'; END IF;
 IF p_item IS NOT NULL THEN
  reason:=shop_private.equipment_origin_014(who,p_actor,p_item);
  IF reason='catalog-unavailable' THEN RAISE EXCEPTION 'Reviewed equipment required' USING ERRCODE='42501'; END IF;
  IF reason IS NOT NULL THEN RAISE EXCEPTION 'Verified acquisition receipt required' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN shop_private.owned_equipment(p_actor,p_slot,p_item,p_expected);
END $function$;
CREATE OR REPLACE FUNCTION shop_private.equipment_origin_014(p_owner uuid, p_actor uuid, p_item text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
BEGIN
 IF p_item IS NULL OR p_item NOT IN(
   'traveler-boots','traveler-helmet-rare','wisdom-amulet','traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare',
   'equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade',
   'equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor',
   'equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield',
   'equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet',
   'equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots',
   'equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion'
 ) THEN RETURN 'catalog-unavailable'; END IF;
 IF p_item<>'traveler-boots' AND NOT EXISTS(
   SELECT 1 FROM public.chest_operations
   WHERE account_id=p_owner AND traveler_id=p_actor AND rewards->>'itemId'=p_item
    AND((operation_type='open' AND source LIKE 'community001c:%')
     OR(operation_type IN('open','equipment-purchase') AND source LIKE 'shop001c:%'
       AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
  ) AND NOT (
   p_item IN('wisdom-amulet','traveler-helmet-rare') AND EXISTS(
    SELECT 1 FROM economy_private.journey_rewards j
    JOIN public.inventory i ON i.traveler_id=j.traveler_id
    WHERE j.traveler_id=p_actor
     AND j.reward_key=CASE p_item WHEN 'wisdom-amulet' THEN 'phase:garden-choice' ELSE 'garden-equipment' END
     AND i.item_id=p_item AND i.quantity>0 AND i.card_receipt_id IS NULL
     AND i.metadata->>'source'=j.reward_key
   )
  ) THEN
  IF shop_private.recognition_valid_014(p_owner,p_actor,p_item) THEN RETURN NULL; END IF;
  RETURN 'acquisition-unconfirmed';
 END IF;
 RETURN NULL;
END $function$;
CREATE OR REPLACE FUNCTION economy_private.collection(p_user uuid, p_traveler uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT coalesce(jsonb_agg(jsonb_build_object('card',c.definition,'version',c.version,'receiptId',r.id) ORDER BY c.id),'[]')
 FROM public.inventory i JOIN public.travelers t ON t.id=i.traveler_id
 JOIN public.chest_operations r ON r.id=i.card_receipt_id AND r.traveler_id=t.id AND r.account_id=t.user_id AND r.operation_type='card-starter'
 JOIN economy_private.card_catalog c ON c.id=i.item_id AND c.version=i.card_version
 WHERE t.id=p_traveler AND t.user_id=p_user AND i.quantity=1 AND i.card_revoked_at IS NULL AND c.revoked_at IS NULL
 AND r.rewards->'cardIds' ? i.item_id;
$function$;
CREATE OR REPLACE FUNCTION shop_private.owned_equipment(p_traveler_id uuid, p_slot text, p_item_id text, p_expected_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor uuid:=auth.uid();previous_item text;expected_slot text;required_level integer;traveler_level integer;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM auth.users WHERE id=actor AND NOT coalesce(is_anonymous,false) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 SELECT level INTO traveler_level FROM public.travelers WHERE id=p_traveler_id AND user_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ownership denied' USING ERRCODE='42501'; END IF;
 IF p_slot IS NULL OR p_slot NOT IN ('helmet','armor','weapon','shield','boots','amulet') THEN RAISE EXCEPTION 'Invalid slot' USING ERRCODE='22023'; END IF;
 IF p_item_id IS NOT NULL THEN
  expected_slot:=CASE p_item_id
   WHEN 'traveler-boots' THEN 'boots'
   WHEN 'traveler-helmet-rare' THEN 'helmet'
   WHEN 'wisdom-amulet' THEN 'amulet'
   WHEN 'traveler-sword-common' THEN 'weapon'
   WHEN 'traveler-armor-uncommon' THEN 'armor'
   WHEN 'traveler-shield-rare' THEN 'shield'
   WHEN 'equipment-apprentice-sword' THEN 'weapon'
   WHEN 'equipment-pilgrim-blade' THEN 'weapon'
   WHEN 'equipment-guardian-sword' THEN 'weapon'
   WHEN 'equipment-courage-blade' THEN 'weapon'
   WHEN 'equipment-perseverance-sword' THEN 'weapon'
   WHEN 'equipment-victory-blade' THEN 'weapon'
   WHEN 'equipment-reinforced-tunic' THEN 'armor'
   WHEN 'equipment-traveler-vest' THEN 'armor'
   WHEN 'equipment-vigilance-cuirass' THEN 'armor'
   WHEN 'equipment-guardian-armor' THEN 'armor'
   WHEN 'equipment-perseverance-armor' THEN 'armor'
   WHEN 'equipment-fortress-armor' THEN 'armor'
   WHEN 'equipment-wooden-shield' THEN 'shield'
   WHEN 'equipment-apprentice-shield' THEN 'shield'
   WHEN 'equipment-vigilance-shield' THEN 'shield'
   WHEN 'equipment-pilgrim-shield' THEN 'shield'
   WHEN 'equipment-courage-shield' THEN 'shield'
   WHEN 'equipment-fortress-shield' THEN 'shield'
   WHEN 'equipment-leather-helmet' THEN 'helmet'
   WHEN 'equipment-journey-helmet' THEN 'helmet'
   WHEN 'equipment-vigilance-helmet' THEN 'helmet'
   WHEN 'equipment-guardian-helmet' THEN 'helmet'
   WHEN 'equipment-perseverance-helmet' THEN 'helmet'
   WHEN 'equipment-reinforced-sandals' THEN 'boots'
   WHEN 'equipment-explorer-boots' THEN 'boots'
   WHEN 'equipment-journey-boots' THEN 'boots'
   WHEN 'equipment-pilgrim-boots' THEN 'boots'
   WHEN 'equipment-perseverance-boots' THEN 'boots'
   WHEN 'equipment-simple-pendant' THEN 'amulet'
   WHEN 'equipment-journey-medal' THEN 'amulet'
   WHEN 'equipment-prudence-amulet' THEN 'amulet'
   WHEN 'equipment-vigilance-medallion' THEN 'amulet'
   WHEN 'equipment-guardian-medallion' THEN 'amulet'
   WHEN 'equipment-perseverance-medallion' THEN 'amulet'
  END;
  required_level:=CASE p_item_id
   WHEN 'traveler-boots' THEN 1
   WHEN 'traveler-helmet-rare' THEN 1
   WHEN 'wisdom-amulet' THEN 1
   WHEN 'traveler-sword-common' THEN 1
   WHEN 'traveler-armor-uncommon' THEN 1
   WHEN 'traveler-shield-rare' THEN 1
   WHEN 'equipment-apprentice-sword' THEN 1
   WHEN 'equipment-pilgrim-blade' THEN 4
   WHEN 'equipment-guardian-sword' THEN 6
   WHEN 'equipment-courage-blade' THEN 10
   WHEN 'equipment-perseverance-sword' THEN 18
   WHEN 'equipment-victory-blade' THEN 28
   WHEN 'equipment-reinforced-tunic' THEN 1
   WHEN 'equipment-traveler-vest' THEN 2
   WHEN 'equipment-vigilance-cuirass' THEN 5
   WHEN 'equipment-guardian-armor' THEN 11
   WHEN 'equipment-perseverance-armor' THEN 19
   WHEN 'equipment-fortress-armor' THEN 30
   WHEN 'equipment-wooden-shield' THEN 1
   WHEN 'equipment-apprentice-shield' THEN 2
   WHEN 'equipment-vigilance-shield' THEN 4
   WHEN 'equipment-pilgrim-shield' THEN 6
   WHEN 'equipment-courage-shield' THEN 12
   WHEN 'equipment-fortress-shield' THEN 20
   WHEN 'equipment-leather-helmet' THEN 1
   WHEN 'equipment-journey-helmet' THEN 5
   WHEN 'equipment-vigilance-helmet' THEN 10
   WHEN 'equipment-guardian-helmet' THEN 13
   WHEN 'equipment-perseverance-helmet' THEN 21
   WHEN 'equipment-reinforced-sandals' THEN 1
   WHEN 'equipment-explorer-boots' THEN 4
   WHEN 'equipment-journey-boots' THEN 7
   WHEN 'equipment-pilgrim-boots' THEN 12
   WHEN 'equipment-perseverance-boots' THEN 22
   WHEN 'equipment-simple-pendant' THEN 1
   WHEN 'equipment-journey-medal' THEN 6
   WHEN 'equipment-prudence-amulet' THEN 14
   WHEN 'equipment-vigilance-medallion' THEN 20
   WHEN 'equipment-guardian-medallion' THEN 23
   WHEN 'equipment-perseverance-medallion' THEN 30
  END;
  IF expected_slot IS DISTINCT FROM p_slot THEN RAISE EXCEPTION 'Equipment denied' USING ERRCODE='42501'; END IF;
  IF traveler_level<required_level THEN RAISE EXCEPTION 'Equipment level required' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.inventory WHERE traveler_id=p_traveler_id AND item_id=p_item_id AND quantity>0 AND card_receipt_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item ownership denied' USING ERRCODE='42501'; END IF;
 END IF;
 SELECT item_id INTO previous_item FROM public.equipped_items WHERE traveler_id=p_traveler_id AND slot=p_slot;
 IF previous_item IS NOT DISTINCT FROM p_item_id THEN RETURN coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.equipped_items WHERE traveler_id=p_traveler_id),'{}'::jsonb); END IF;
 IF previous_item IS DISTINCT FROM p_expected_item_id THEN RAISE EXCEPTION 'Equipment changed; reload' USING ERRCODE='PT409'; END IF;
 IF EXISTS(SELECT 1 FROM economy_private.battles WHERE traveler_id=p_traveler_id AND mode IN ('arena-v3','tower-v3') AND settled_at IS NULL) THEN RAISE EXCEPTION 'Battle in progress' USING ERRCODE='PT409'; END IF;
 IF p_item_id IS NULL THEN DELETE FROM public.equipped_items WHERE traveler_id=p_traveler_id AND slot=p_slot;
 ELSE INSERT INTO public.equipped_items(traveler_id,slot,item_id) VALUES(p_traveler_id,p_slot,p_item_id) ON CONFLICT(traveler_id,slot) DO UPDATE SET item_id=excluded.item_id,equipped_at=now(); END IF;
 RETURN coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.equipped_items WHERE traveler_id=p_traveler_id),'{}'::jsonb);
END $function$;
ALTER TABLE public.inventory DROP CONSTRAINT inventory_card_provenance;ALTER TABLE public.inventory ADD CONSTRAINT inventory_card_provenance CHECK ((((card_receipt_id IS NULL) AND (card_version IS NULL)) OR ((card_receipt_id IS NOT NULL) AND (card_version IS NOT NULL) AND (quantity = 1))));
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK ((((operation_type = ANY (ARRAY['grant'::text, 'purchase'::text, 'open'::text])) AND (chest_type IS NOT NULL)) OR ((operation_type = ANY (ARRAY['card-starter'::text, 'card-revocation'::text, 'arena-result'::text, 'tower-result'::text, 'community-xp'::text])) AND (chest_type IS NULL)) OR ((operation_type = 'equipment-purchase'::text) AND (chest_type IS NULL) AND (source = 'shop001c:equipment'::text) AND (account_id IS NOT NULL) AND (price_paid IS NOT NULL) AND ((rewards ->> 'catalogVersion'::text) = 'ECONOMY-001C:shop:v1'::text) AND (rewards ? 'itemId'::text)) OR ((operation_type = 'administrative-reconciliation'::text) AND (chest_type IS NULL) AND (account_id IS NOT NULL) AND (price_paid IS NULL) AND (source = 'legacy-admin-010'::text) AND ((rewards ->> 'contract'::text) = 'RPG-ECONOMY-FIX-010:v1'::text)) OR ((operation_type = 'equipment-recognition'::text) AND (chest_type IS NULL) AND (account_id IS NOT NULL) AND (price_paid IS NULL) AND (source = 'legacy-equipment-014'::text) AND ((rewards ->> 'contract'::text) = 'RPG-EQUIPMENT-FIX-014:v1'::text))));


REVOKE ALL ON FUNCTION shop_private.actor(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION shop_private.balance_valid(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION shop_private.coin_balance(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION shop_private.state(uuid) FROM PUBLIC,anon,authenticated,service_role;GRANT EXECUTE ON FUNCTION shop_private.state(uuid) TO authenticated;
REVOKE ALL ON FUNCTION shop_private.open(uuid,text,uuid) FROM PUBLIC,anon,authenticated,service_role;GRANT EXECUTE ON FUNCTION shop_private.open(uuid,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION shop_private.purchase(uuid,text,text,uuid) FROM PUBLIC,anon,authenticated,service_role;GRANT EXECUTE ON FUNCTION shop_private.purchase(uuid,text,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION shop_private.equip(uuid,text,text,text) FROM PUBLIC,anon,authenticated,service_role;GRANT EXECUTE ON FUNCTION shop_private.equip(uuid,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION shop_private.equipment_origin_014(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION economy_private.collection(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
