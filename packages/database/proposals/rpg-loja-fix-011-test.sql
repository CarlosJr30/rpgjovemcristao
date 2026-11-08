-- TEST ONLY. No row changes at installation; only existing opener replaced.
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='45s';
DO $$BEGIN
 IF current_setting('lojafix011.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR md5(replace(pg_get_functiondef('shop_private.open(uuid,text,uuid)'::regprocedure),E'\r\n',E'\n'))<>'a20f81105755fd305b8a6fc44fbebaea'
 OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.open(uuid,text,uuid)'::regprocedure)<>'{postgres=X/postgres,authenticated=X/postgres}'
 THEN RAISE EXCEPTION 'Reviewed environment and opening authority required' USING ERRCODE='42501';END IF;
END $$;
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
 IF NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Opening reconciliation failed' USING ERRCODE='42501';END IF;RETURN answer;END $function$
