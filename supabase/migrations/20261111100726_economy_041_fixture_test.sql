-- Explicitly approved funded fixture. TEST only; installation never funds it.
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('economy041.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR public.release_scope()<>'hero-equipment-006' OR public.economy_protocol_version()<>3
 OR to_regclass('shop_private.policy_041') IS NULL
 OR to_regprocedure('shop_qa_private.fixture_credit_041(uuid)') IS NOT NULL
 OR md5(replace(pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure),E'\r\n',E'\n'))<>'36457aa385a1fb599f0cca5b4ac86cb4'
 THEN RAISE EXCEPTION 'Reviewed TEST installation required' USING ERRCODE='42501';END IF;
 IF md5(replace(pg_get_functiondef('shop_qa_private.fund_fixture_014(uuid,uuid,uuid,text)'::regprocedure),E'\r\n',E'\n'))<>'664872efb841a4d097f1b9ed6eed58fe' OR(SELECT proacl::text FROM pg_proc WHERE oid='shop_qa_private.fund_fixture_014(uuid,uuid,uuid,text)'::regprocedure) IS DISTINCT FROM '{postgres=X/postgres}' THEN RAISE EXCEPTION 'Prior TEST fixture authority changed' USING ERRCODE='42501';END IF;
IF md5(replace(pg_get_functiondef('shop_qa_private.grant_budget(uuid,uuid,text,uuid)'::regprocedure),E'\r\n',E'\n'))<>'73833621693a445d0a1231f60d13f107' OR(SELECT proacl::text FROM pg_proc WHERE oid='shop_qa_private.grant_budget(uuid,uuid,text,uuid)'::regprocedure) IS DISTINCT FROM '{postgres=X/postgres}' THEN RAISE EXCEPTION 'Prior TEST fixture authority changed' USING ERRCODE='42501';END IF;
IF md5(replace(pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure),E'\r\n',E'\n'))<>'36457aa385a1fb599f0cca5b4ac86cb4' OR(SELECT proacl::text FROM pg_proc WHERE oid='shop_private.coin_balance(uuid)'::regprocedure) IS DISTINCT FROM '{postgres=X/postgres}' THEN RAISE EXCEPTION 'Prior TEST fixture authority changed' USING ERRCODE='42501';END IF;
IF(SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='shop_qa_private.budget_receipts'::regclass AND conname='budget_receipts_account_id_key') IS DISTINCT FROM 'UNIQUE (account_id)' THEN RAISE EXCEPTION 'Prior TEST budget changed' USING ERRCODE='42501';END IF;
IF(SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='shop_qa_private.budget_receipts'::regclass AND conname='budget_receipts_amount_check') IS DISTINCT FROM 'CHECK (((amount = 255) OR ((amount = 35) AND (traveler_id = ''5558c6a7-2faf-4b6f-901f-bfc980c5c687''::uuid) AND (account_id = ''575d92d9-2e5b-4fdc-8e02-3a4a096285a9''::uuid) AND (reason = ''FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10''::text))))' THEN RAISE EXCEPTION 'Prior TEST budget changed' USING ERRCODE='42501';END IF;
IF(SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='shop_qa_private.budget_receipts'::regclass AND conname='budget_receipts_traveler_id_key') IS DISTINCT FROM 'UNIQUE (traveler_id)' THEN RAISE EXCEPTION 'Prior TEST budget changed' USING ERRCODE='42501';END IF;
END $$;
-- Keep one original budget and at most one specifically approved 041 budget.
ALTER TABLE shop_qa_private.budget_receipts DROP CONSTRAINT budget_receipts_account_id_key;
ALTER TABLE shop_qa_private.budget_receipts DROP CONSTRAINT budget_receipts_traveler_id_key;
CREATE UNIQUE INDEX budget041_prior_account ON shop_qa_private.budget_receipts(account_id) WHERE reason<>'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
CREATE UNIQUE INDEX budget041_prior_traveler ON shop_qa_private.budget_receipts(traveler_id) WHERE reason<>'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
CREATE UNIQUE INDEX budget041_account ON shop_qa_private.budget_receipts(account_id) WHERE reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
CREATE UNIQUE INDEX budget041_traveler ON shop_qa_private.budget_receipts(traveler_id) WHERE reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
ALTER TABLE shop_qa_private.budget_receipts DROP CONSTRAINT budget_receipts_amount_check;
ALTER TABLE shop_qa_private.budget_receipts ADD CONSTRAINT budget_receipts_amount_check CHECK(
 (reason<>'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11' AND (((amount = 255) OR ((amount = 35) AND (traveler_id = '5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid) AND (account_id = '575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid) AND (reason = 'FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10'::text))))) OR
 (reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11' AND amount=2000
 AND account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid AND traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid));
CREATE TRIGGER budget041_immutable BEFORE UPDATE OR DELETE ON shop_qa_private.budget_receipts FOR EACH ROW
 WHEN(OLD.reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11') EXECUTE FUNCTION shop_private.immutable_041();

CREATE FUNCTION shop_qa_private.fixture_credit_041(p_actor uuid) RETURNS bigint LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN public.release_scope()='hero-equipment-006' AND p_actor='5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid THEN
 coalesce((SELECT sum(b.amount)::bigint FROM shop_qa_private.budget_receipts b
 JOIN shop_qa_private.profiles p ON p.account_id=b.account_id AND p.traveler_id=b.traveler_id AND NOT p.enabled
 JOIN public.travelers t ON t.id=b.traveler_id AND t.user_id=b.account_id
 WHERE b.account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid AND b.traveler_id=p_actor AND b.amount=2000
 AND b.reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11'),0) ELSE 0 END
$$;
CREATE OR REPLACE FUNCTION shop_private.coin_balance(p_actor uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT shop_qa_private.fixture_credit_041(p_actor) + (SELECT coalesce(sum(CASE WHEN operation_type='purchase' THEN -price_paid::bigint WHEN operation_type IN('open','duplicate-sale-041','grant') THEN (rewards->>'coins')::bigint ELSE 0 END),0) FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor) AND source LIKE 'economy041:%' AND rewards->>'catalogVersion'='economy041-chest-v1') + coalesce(sum(CASE WHEN operation_type='open' THEN (rewards->>'coins')::bigint
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
 SELECT * INTO prior FROM shop_qa_private.budget_receipts WHERE account_id=p_owner AND reason<>'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
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
 SELECT * INTO prior FROM shop_qa_private.budget_receipts WHERE account_id=p_owner AND reason<>'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
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

CREATE FUNCTION shop_qa_private.fund_fixture_041(p_owner uuid,p_actor uuid,p_operation uuid,p_snapshot text) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t public.travelers; prior shop_qa_private.budget_receipts; receipt uuid;BEGIN
 IF current_user<>'postgres' OR public.release_scope()<>'hero-equipment-006'
 OR current_setting('economy041.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR current_setting('economy041.fixture_approval',true) IS DISTINCT FROM 'OWNER-APPROVED-TEST-FIXTURE-2000'
 OR p_owner IS DISTINCT FROM '575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid OR p_actor IS DISTINCT FROM '5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid OR p_operation IS NULL
 THEN RAISE EXCEPTION 'Specific TEST fixture approval required' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
 PERFORM 1 FROM auth.users WHERE id=p_owner AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false)
 AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=p_owner AND(not_after IS NULL OR not_after>clock_timestamp()))
 THEN RAISE EXCEPTION 'Normal confirmed TEST session required' USING ERRCODE='42501';END IF;
 SELECT * INTO t FROM public.travelers WHERE id=p_actor AND user_id=p_owner AND is_active FOR UPDATE;
 IF t.id IS NULL THEN RAISE EXCEPTION 'Exact active TEST avatar required' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 SELECT * INTO prior FROM shop_qa_private.budget_receipts WHERE account_id=p_owner
 AND reason='ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
 IF FOUND THEN
  IF prior.traveler_id<>p_actor OR prior.nonce<>p_operation OR prior.amount<>2000 THEN RAISE EXCEPTION 'Fixture already funded' USING ERRCODE='42501';END IF;
  RETURN prior.id;
 END IF;
 IF p_snapshot IS NULL OR p_snapshot IS DISTINCT FROM shop_qa_private.fixture_snapshot_014(p_actor)
 OR t.level<>1 OR t.xp<>0 OR t.economic_verified_at IS NULL
 OR NOT EXISTS(SELECT 1 FROM public.wallets WHERE traveler_id=p_actor AND coins=0)
 OR NOT shop_private.balance_valid(p_actor) OR shop_qa_private.fixture_credit_014(p_actor)<>35
 OR NOT EXISTS(SELECT 1 FROM shop_qa_private.profiles WHERE account_id=p_owner AND traveler_id=p_actor AND NOT enabled)
 OR EXISTS(SELECT 1 FROM shop_private.holds WHERE traveler_id=p_actor)
 OR NOT EXISTS(SELECT 1 FROM shop_private.policy_041 WHERE singleton AND enabled)
 THEN RAISE EXCEPTION 'Unchanged approved fixture baseline required' USING ERRCODE='42501';END IF;
 INSERT INTO shop_qa_private.budget_receipts(account_id,traveler_id,amount,nonce,reason)
 VALUES(p_owner,p_actor,2000,p_operation,'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11') RETURNING id INTO receipt;
 PERFORM public.add_coins(p_actor,2000);
 IF NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Fixture accounting inconsistent';END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION shop_qa_private.fixture_credit_041(uuid),shop_qa_private.fund_fixture_041(uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
