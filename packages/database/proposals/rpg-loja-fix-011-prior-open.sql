CREATE OR REPLACE FUNCTION shop_private.open(p_actor uuid, p_type text, p_operation uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 IF NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Opening reconciliation failed' USING ERRCODE='42501';END IF;RETURN answer;END $function$
