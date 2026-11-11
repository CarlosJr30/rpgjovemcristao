DO $$BEGIN IF current_setting('economy041.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' OR EXISTS(SELECT 1 FROM shop_qa_private.budget_receipts WHERE reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11') THEN RAISE EXCEPTION 'Funded fixture must preserve audit and balance; empty TEST recovery only' USING ERRCODE='42501';END IF;END $$;
CREATE OR REPLACE FUNCTION shop_private.coin_balance(p_actor uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT (SELECT coalesce(sum(CASE WHEN operation_type='purchase' THEN -price_paid::bigint WHEN operation_type IN('open','duplicate-sale-041','grant') THEN (rewards->>'coins')::bigint ELSE 0 END),0) FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor) AND source LIKE 'economy041:%' AND rewards->>'catalogVersion'='economy041-chest-v1') + coalesce(sum(CASE WHEN operation_type='open' THEN (rewards->>'coins')::bigint
 WHEN operation_type IN('purchase','equipment-purchase') THEN -price_paid::bigint ELSE 0 END),0)
 +coalesce((SELECT (r.rewards->>'baselineCoins')::bigint FROM public.chest_operations r
 WHERE p_actor='31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid AND r.traveler_id=p_actor AND r.account_id='78729453-8e04-478c-96ae-d37cead1bc8c'::uuid
 AND r.account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND r.operation_type='administrative-reconciliation' AND r.source='legacy-admin-010'
 AND r.identity_key='legacy-admin-010:31b70059-deca-44c8-a6df-f21ea68b6e42'
 AND r.rewards->>'contract'='RPG-ECONOMY-FIX-010:v1'
 AND r.rewards->>'approvalRef'='OWNER-APPROVED-2026-11-07'
 AND r.rewards->>'baselineCoins'='1006265'),0)
 +shop_qa_private.fixture_credit_014(p_actor)
 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND((operation_type='open' AND source LIKE 'community001c:%') OR(source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
$function$
;
CREATE OR REPLACE FUNCTION shop_qa_private.fund_fixture_014(p_owner uuid, p_actor uuid, p_operation uuid, p_snapshot text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE t public.travelers; prior shop_qa_private.budget_receipts; receipt uuid; BEGIN
 IF current_user<>'postgres' OR public.release_scope()<>'hero-equipment-006'
 OR current_setting('equipment014.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR current_setting('equipment014.fixture_approval',true) IS DISTINCT FROM 'OWNER-APPROVED-TEST-FIXTURE-35'
 OR p_owner IS DISTINCT FROM '575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid OR p_actor IS DISTINCT FROM '5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid OR p_operation IS NULL
 THEN RAISE EXCEPTION 'Specific owner approved TEST fixture required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
 PERFORM 1 FROM auth.users WHERE id=p_owner AND email_confirmed_at IS NOT NULL
 AND NOT coalesce(is_anonymous,false) AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=p_owner AND(not_after IS NULL OR not_after>clock_timestamp()))
 THEN RAISE EXCEPTION 'Normal confirmed TEST session required' USING ERRCODE='42501'; END IF;
 SELECT * INTO t FROM public.travelers WHERE id=p_actor AND user_id=p_owner AND is_active FOR UPDATE;
 IF t.id IS NULL THEN RAISE EXCEPTION 'Active exact TEST avatar required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 SELECT * INTO prior FROM shop_qa_private.budget_receipts WHERE account_id=p_owner;
 IF FOUND THEN
  IF prior.traveler_id<>p_actor OR prior.nonce<>p_operation OR prior.amount<>35
  OR prior.reason<>'FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10'
  OR shop_qa_private.fixture_credit_014(p_actor)<>35
  THEN RAISE EXCEPTION 'Fixture already designated' USING ERRCODE='42501'; END IF;
  RETURN prior.id;
 END IF;
 IF p_snapshot IS NULL OR p_snapshot IS DISTINCT FROM shop_qa_private.fixture_snapshot_014(p_actor)
 OR t.level<>1 OR t.xp<>0 OR t.economic_verified_at IS NULL
 OR NOT EXISTS(SELECT 1 FROM public.wallets WHERE traveler_id=p_actor AND coins=0)
 OR NOT shop_private.balance_valid(p_actor)
 OR EXISTS(SELECT 1 FROM public.inventory WHERE traveler_id=p_actor AND quantity>0 AND card_receipt_id IS NULL AND item_id NOT LIKE 'arena-card-%')
 OR EXISTS(SELECT 1 FROM public.equipped_items WHERE traveler_id=p_actor)
 OR EXISTS(SELECT 1 FROM shop_private.holds WHERE traveler_id=p_actor)
 THEN RAISE EXCEPTION 'Reviewed unchanged TEST fixture baseline required' USING ERRCODE='42501'; END IF;
 -- Funding bookkeeping does not enable the alternate QA purchase/equip authority.
 INSERT INTO shop_qa_private.profiles(account_id,traveler_id,approval_ref,enabled)
 VALUES(p_owner,p_actor,'FIX014:TEST-FIXTURE35:OWNER-APPROVED-2026-11-10',false);
 INSERT INTO shop_qa_private.budget_receipts(account_id,traveler_id,amount,nonce,reason)
 VALUES(p_owner,p_actor,35,p_operation,'FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10') RETURNING id INTO receipt;
 PERFORM public.add_coins(p_actor,35);
 IF NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Fixture accounting inconsistent'; END IF;
 RETURN receipt;
END $function$
;
CREATE OR REPLACE FUNCTION shop_qa_private.grant_budget(p_owner uuid, p_actor uuid, p_reason text, p_nonce uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE t public.travelers;prior shop_qa_private.budget_receipts;receipt uuid;BEGIN
 IF current_setting('shop001c.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' OR p_nonce IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 12 AND 300
 OR p_reason ~* '(bearer[[:space:]]|eyJ[a-z0-9_-]{15,}\.|sb_secret_|sbp_|password[[:space:]]*[:=]|senha[[:space:]]*[:=]|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})' THEN RAISE EXCEPTION 'Explicit TEST QA designation required' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
 PERFORM 1 FROM auth.users WHERE id=p_owner AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false) AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=p_owner AND(not_after IS NULL OR not_after>clock_timestamp())) THEN RAISE EXCEPTION 'Normal confirmed TEST identity required' USING ERRCODE='42501';END IF;
 SELECT * INTO prior FROM shop_qa_private.budget_receipts WHERE account_id=p_owner;
 IF FOUND THEN IF prior.traveler_id<>p_actor OR prior.nonce<>p_nonce THEN RAISE EXCEPTION 'QA budget already designated' USING ERRCODE='42501';END IF;RETURN prior.id;END IF;
 SELECT * INTO t FROM public.travelers WHERE id=p_actor AND user_id=p_owner AND is_active FOR UPDATE;
 IF t.id IS NULL OR t.name<>'QA Loja' OR t.level<>1 OR t.xp<>0 OR t.economic_verified_at IS NULL
 OR NOT EXISTS(SELECT 1 FROM public.wallets WHERE traveler_id=t.id AND coins=0)
 OR EXISTS(SELECT 1 FROM public.equipped_items WHERE traveler_id=t.id)
 OR EXISTS(SELECT 1 FROM public.guild_members WHERE traveler_id=t.id AND status='active')
 OR EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=t.id AND operation_type<>'card-starter')
 OR EXISTS(SELECT 1 FROM public.inventory WHERE traveler_id=t.id AND card_receipt_id IS NULL) THEN RAISE EXCEPTION 'Dedicated new QA avatar baseline required' USING ERRCODE='42501';END IF;
 INSERT INTO shop_qa_private.profiles(account_id,traveler_id,approval_ref) VALUES(p_owner,p_actor,'ECONOMY-001C:OWNER:QA-TEST:2026-11-03');
 INSERT INTO shop_qa_private.budget_receipts(account_id,traveler_id,amount,nonce,reason) VALUES(p_owner,p_actor,255,p_nonce,p_reason) RETURNING id INTO receipt;
 PERFORM public.add_coins(p_actor,255);RETURN receipt;
END $function$
;
DROP FUNCTION shop_qa_private.fund_fixture_041(uuid,uuid,uuid,text);DROP FUNCTION shop_qa_private.fixture_credit_041(uuid);DROP TRIGGER budget041_immutable ON shop_qa_private.budget_receipts;DROP INDEX shop_qa_private.budget041_prior_account,shop_qa_private.budget041_prior_traveler,shop_qa_private.budget041_account,shop_qa_private.budget041_traveler;ALTER TABLE shop_qa_private.budget_receipts DROP CONSTRAINT budget_receipts_amount_check;
ALTER TABLE shop_qa_private.budget_receipts ADD CONSTRAINT budget_receipts_account_id_key UNIQUE (account_id);
ALTER TABLE shop_qa_private.budget_receipts ADD CONSTRAINT budget_receipts_amount_check CHECK (((amount = 255) OR ((amount = 35) AND (traveler_id = '5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid) AND (account_id = '575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid) AND (reason = 'FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10'::text))));
ALTER TABLE shop_qa_private.budget_receipts ADD CONSTRAINT budget_receipts_traveler_id_key UNIQUE (traveler_id);