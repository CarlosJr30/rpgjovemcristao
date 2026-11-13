-- One authenticated resale smoke for the explicitly funded ECONOMY-041 TEST fixture.
-- TEST-only: never copy this migration to production. It preserves the QA barrier for all other writes.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';

DO $$
BEGIN
  IF current_setting('economy041.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
    OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
    OR public.economy_protocol_version() IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'TEST project scope required' USING ERRCODE='42501';
  END IF;
  IF md5(replace(pg_get_functiondef('shop_qa_private.isolate_credit()'::regprocedure),E'\r\n',E'\n')) IS DISTINCT FROM 'ab1fa3541f4cd8bdccf287cb649ee4f7'
    OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_qa_private.isolate_credit()'::regprocedure) IS DISTINCT FROM '{postgres=X/postgres}' THEN
    RAISE EXCEPTION 'Original QA isolation function and ACL required' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (
      SELECT 1 FROM shop_qa_private.profiles p
      WHERE p.account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'
        AND p.traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'
        AND p.approval_ref='FIX014:TEST-FIXTURE35:OWNER-APPROVED-2026-11-10'
        AND NOT p.enabled
    ) THEN
    RAISE EXCEPTION 'Reviewed disabled QA profile required' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (
      SELECT 1 FROM shop_qa_private.budget_receipts b
      WHERE b.account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'
        AND b.traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'
        AND b.amount=2000
        AND b.reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11'
    ) THEN
    RAISE EXCEPTION 'Reviewed 041 TEST budget required' USING ERRCODE='42501';
  END IF;
  IF (SELECT count(*) FROM shop_qa_private.budget_receipts b
      WHERE b.account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'
        AND b.traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'
        AND b.amount=2000
        AND b.reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11')<>1
    OR (SELECT coins FROM public.wallets WHERE traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687') IS DISTINCT FROM 1875
    OR (SELECT count(*) FROM public.chest_operations WHERE traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687' AND account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9' AND operation_type='purchase' AND source LIKE 'economy041:%')<>3
    OR (SELECT count(*) FROM public.chest_operations WHERE traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687' AND account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9' AND operation_type='open' AND source LIKE 'economy041:%')<>3
    OR (SELECT quantity FROM public.inventory WHERE traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687' AND item_id='equipment-leather-helmet') IS DISTINCT FROM 2
    OR (SELECT count(*) FROM public.chest_operations WHERE traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687' AND operation_type='duplicate-sale-041')<>0 THEN
    RAISE EXCEPTION 'Exact unspent duplicate baseline required' USING ERRCODE='42501';
  END IF;
  IF (SELECT count(*) FROM public.chest_operations o
        WHERE o.traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'
          AND o.account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'
          AND o.operation_type='open'
          AND o.rewards->>'itemId'='equipment-leather-helmet'
          AND o.source LIKE 'economy041:%'
          AND o.rewards->>'catalogVersion'='economy041-chest-v1'
          AND EXISTS (SELECT 1 FROM public.chest_operations p
                      WHERE p.traveler_id=o.traveler_id AND p.account_id=o.account_id
                        AND p.source=o.source AND p.operation_type='purchase'
                        AND p.chest_type='common'
                        AND p.rewards->>'catalogVersion'='economy041-chest-v1'))<>2 THEN
    RAISE EXCEPTION 'Two purchased 041 helmet openings required' USING ERRCODE='42501';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION shop_qa_private.isolate_credit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE expected_value integer; open_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM shop_qa_private.profiles WHERE traveler_id=NEW.traveler_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.operation_type NOT IN('purchase','open','equipment-purchase','card-starter','card-revocation')
    AND NEW.operation_type='duplicate-sale-041'
    AND auth.uid() IS NOT DISTINCT FROM '575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid
    AND NEW.account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid
    AND NEW.traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid
    AND NEW.chest_type IS NULL AND NEW.price_paid=0
    AND NEW.source='economy041:sale'
    AND NEW.operation_key ~ '^sale:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND NEW.identity_key='economy041:sale:575d92d9-2e5b-4fdc-8e02-3a4a096285a9:'||substring(NEW.operation_key FROM 6)
    AND NEW.rewards->>'catalogVersion'='economy041-chest-v1'
    AND NEW.rewards->>'itemId'='equipment-leather-helmet'
    AND NEW.rewards->>'coins'='10' AND NEW.rewards->>'quantity'='1'
    AND NEW.rewards->>'replayed'='false'
    AND EXISTS (SELECT 1 FROM public.travelers t
                WHERE t.id=NEW.traveler_id AND t.user_id=NEW.account_id AND t.is_active)
    AND EXISTS (SELECT 1 FROM shop_qa_private.profiles q
                WHERE q.account_id=NEW.account_id AND q.traveler_id=NEW.traveler_id
                  AND q.approval_ref='FIX014:TEST-FIXTURE35:OWNER-APPROVED-2026-11-10' AND NOT q.enabled)
    AND EXISTS (SELECT 1 FROM shop_qa_private.budget_receipts b
                WHERE b.account_id=NEW.account_id AND b.traveler_id=NEW.traveler_id
                  AND b.amount=2000
                  AND b.reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11')
    AND EXISTS (SELECT 1 FROM public.inventory i
                WHERE i.traveler_id=NEW.traveler_id AND i.item_id='equipment-leather-helmet'
                  AND i.quantity=1 AND i.card_revoked_at IS NULL)
  THEN
    SELECT count(*)::integer INTO open_count
    FROM public.chest_operations o
    WHERE o.traveler_id=NEW.traveler_id AND o.account_id=NEW.account_id
      AND o.operation_type='open' AND o.rewards->>'itemId'='equipment-leather-helmet'
      AND o.source LIKE 'economy041:%'
      AND o.rewards->>'catalogVersion'='economy041-chest-v1'
      AND EXISTS (SELECT 1 FROM public.chest_operations p
                  WHERE p.traveler_id=o.traveler_id AND p.account_id=o.account_id
                    AND p.source=o.source AND p.operation_type='purchase'
                    AND p.chest_type='common'
                    AND p.rewards->>'catalogVersion'='economy041-chest-v1');

    SELECT CASE c.rarity WHEN 'comum' THEN 10 WHEN 'incomum' THEN 20
                         WHEN 'raro' THEN 35 WHEN 'épico' THEN 70
                         WHEN 'lendário' THEN 120 END
      INTO expected_value
    FROM shop_private.content_041 c
    WHERE c.item_id='equipment-leather-helmet' AND c.kind='equipment';

    IF open_count=2 AND expected_value=10
      AND NOT EXISTS (SELECT 1 FROM public.chest_operations s
                      WHERE s.traveler_id=NEW.traveler_id AND s.account_id=NEW.account_id
                        AND s.operation_type='duplicate-sale-041'
                        AND s.rewards->>'itemId'='equipment-leather-helmet')
      AND EXISTS (SELECT 1 FROM public.wallets w
                  WHERE w.traveler_id=NEW.traveler_id
                    AND w.coins=shop_private.coin_balance(NEW.traveler_id)+expected_value)
    THEN
      NEW.rewards:=NEW.rewards||jsonb_build_object(
        'qaFixtureProvenance','ECONOMY041-TEST-OWNER-APPROVED-2026-11-11');
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.operation_type NOT IN('purchase','open','equipment-purchase','card-starter','card-revocation') THEN
    RAISE EXCEPTION 'QA source is isolated from official rewards' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION shop_qa_private.isolate_credit() FROM PUBLIC,anon,authenticated,service_role;
