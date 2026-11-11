SET LOCAL equipment014.target_project='wkdvdzfkbwvhyjmamrsg';
-- TEST ONLY. Explicit owner exception for a funded hosted fixture, not earned economy.
-- Installation never issues credit. No public funding command and no equipment gate change.
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('equipment014.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR public.release_scope()<>'hero-equipment-006' OR public.economy_protocol_version()<>3
 OR md5(replace(pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure),E'\r\n',E'\n'))<>'6376add527a9d3152cee9bfe438d7573'
 OR to_regprocedure('shop_qa_private.fixture_credit_014(uuid)') IS NOT NULL
 THEN RAISE EXCEPTION 'Reviewed TEST fixture environment required' USING ERRCODE='42501'; END IF;
END $$;
ALTER TABLE shop_qa_private.profiles DROP CONSTRAINT profiles_approval_ref_check;
ALTER TABLE shop_qa_private.profiles ADD CONSTRAINT profiles_approval_ref_check CHECK(
 approval_ref='ECONOMY-001C:OWNER:QA-TEST:2026-11-03' OR
 (approval_ref='FIX014:TEST-FIXTURE35:OWNER-APPROVED-2026-11-10' AND traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid AND account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid));
ALTER TABLE shop_qa_private.budget_receipts DROP CONSTRAINT budget_receipts_amount_check;
ALTER TABLE shop_qa_private.budget_receipts ADD CONSTRAINT budget_receipts_amount_check CHECK(amount=255 OR
 (amount=35 AND traveler_id='5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid AND account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid
 AND reason='FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10'));

CREATE FUNCTION shop_qa_private.fixture_credit_014(p_actor uuid) RETURNS bigint
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN public.release_scope()='hero-equipment-006' AND p_actor='5558c6a7-2faf-4b6f-901f-bfc980c5c687'::uuid THEN
 coalesce((SELECT b.amount::bigint FROM shop_qa_private.budget_receipts b
 JOIN shop_qa_private.profiles p ON p.account_id=b.account_id AND p.traveler_id=b.traveler_id
 JOIN public.travelers t ON t.id=b.traveler_id AND t.user_id=b.account_id
 WHERE b.account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid AND b.traveler_id=p_actor AND b.amount=35
 AND b.reason='FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10'
 AND p.approval_ref='FIX014:TEST-FIXTURE35:OWNER-APPROVED-2026-11-10'),0) ELSE 0 END
$$;
REVOKE ALL ON FUNCTION shop_qa_private.fixture_credit_014(uuid) FROM PUBLIC,anon,authenticated,service_role;
-- Preserve the full existing balance formula/ACL; add only this exact TEST input.
DO $$ DECLARE prior text; marker text:=' FROM public.chest_operations WHERE traveler_id=p_actor'; BEGIN
 prior:=pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure);
 IF (length(prior)-length(replace(prior,marker,'')))/length(marker)<>1 THEN
 RAISE EXCEPTION 'Reviewed balance expression required'; END IF;
 EXECUTE replace(prior,marker,E' +shop_qa_private.fixture_credit_014(p_actor)\n'||marker);
END $$;

CREATE FUNCTION shop_qa_private.fixture_snapshot_014(p_actor uuid) RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT md5(jsonb_build_object(
 'traveler',(SELECT to_jsonb(t) FROM public.travelers t WHERE t.id=p_actor),
 'wallet',(SELECT to_jsonb(w) FROM public.wallets w WHERE w.traveler_id=p_actor),
 'inventory',(SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]') FROM public.inventory i WHERE i.traveler_id=p_actor),
 'equipment',(SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.slot),'[]') FROM public.equipped_items e WHERE e.traveler_id=p_actor),
 'chests',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.chest_type),'[]') FROM public.traveler_chests c WHERE c.traveler_id=p_actor),
 'receipts',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.id),'[]') FROM public.chest_operations r WHERE r.traveler_id=p_actor))::text)
$$;
REVOKE ALL ON FUNCTION shop_qa_private.fixture_snapshot_014(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION shop_qa_private.fund_fixture_014(p_owner uuid,p_actor uuid,p_operation uuid,p_snapshot text) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
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
END $$;
REVOKE ALL ON FUNCTION shop_qa_private.fund_fixture_014(uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
