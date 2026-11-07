DO $$BEGIN IF EXISTS(SELECT 1 FROM public.chest_operations WHERE operation_type='administrative-reconciliation') THEN RAISE EXCEPTION 'Issued baseline requires preserving containment' USING ERRCODE='42501';END IF;END $$;
DROP TRIGGER protect_reconciliation_010 ON public.chest_operations;
DROP FUNCTION shop_private.reconcile_legacy_010(uuid,uuid,text),shop_private.reconciliation_snapshot_010(uuid),shop_private.protect_reconciliation_010();
CREATE OR REPLACE FUNCTION shop_private.coin_balance(p_actor uuid) RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(sum(CASE WHEN operation_type='open' THEN (rewards->>'coins')::bigint WHEN operation_type IN('purchase','equipment-purchase') THEN -price_paid::bigint ELSE 0 END),0)
 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND((operation_type='open' AND source LIKE 'community001c:%') OR(source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
$$;

ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK(
 (operation_type IN('grant','purchase','open') AND chest_type IS NOT NULL)
 OR(operation_type IN('card-starter','card-revocation','arena-result','tower-result','community-xp') AND chest_type IS NULL)
 OR(operation_type='equipment-purchase' AND chest_type IS NULL AND source='shop001c:equipment' AND account_id IS NOT NULL AND price_paid IS NOT NULL AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1' AND rewards ? 'itemId') );
