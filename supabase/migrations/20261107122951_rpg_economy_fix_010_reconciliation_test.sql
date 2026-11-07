-- TEST ONLY. Installs support, never activates or grants.
-- RPG-ECONOMY-FIX-010. Explicit individual administrative ratification, no grant.
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='45s';
DO $$ BEGIN
 IF current_setting('economyfix010.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR public.release_scope()<>'hero-equipment-006' OR public.economy_protocol_version()<>3
 OR md5(replace(pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure),E'\r\n',E'\n'))<>'57f04f51e12ee0b4850c5fe07aad1a44'
 OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.coin_balance(uuid)'::regprocedure)<>'{postgres=X/postgres}'
 OR (SELECT md5(pg_get_constraintdef(oid)) FROM pg_constraint WHERE conrelid='public.chest_operations'::regclass AND conname='chest_operations_type_check')<>'d0c77874e5e7609044b1591bfec6acf4'
 OR to_regprocedure('shop_private.reconcile_legacy_010(uuid,uuid,text)') IS NOT NULL
 THEN RAISE EXCEPTION 'Reviewed reconciliation environment required' USING ERRCODE='42501'; END IF;
END $$;
-- Extend the existing ledger, without replacing previous accepted shapes.
DO $$ DECLARE prior text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO prior FROM pg_constraint WHERE conrelid='public.chest_operations'::regclass AND conname='chest_operations_type_check';
 ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
 EXECUTE 'ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK (('||
 substring(prior FROM 8 FOR char_length(prior)-8)||') OR (operation_type=''administrative-reconciliation'' AND chest_type IS NULL AND account_id IS NOT NULL AND price_paid IS NULL AND source=''legacy-admin-010'' AND rewards->>''contract''=''RPG-ECONOMY-FIX-010:v1''))';
END $$;
CREATE FUNCTION shop_private.reconciliation_snapshot_010(p_actor uuid) RETURNS text
 LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT md5(jsonb_build_object(
 'travelers',(SELECT jsonb_agg(to_jsonb(v) ORDER BY v.id) FROM public.travelers v WHERE v.user_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)),
 'wallet',(SELECT to_jsonb(v) FROM public.wallets v WHERE traveler_id=p_actor),
 'stats',(SELECT to_jsonb(v) FROM public.traveler_stats v WHERE traveler_id=p_actor),
 'inventory',(SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.id),'[]') FROM public.inventory v WHERE traveler_id=p_actor),
 'equipped',(SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.slot),'[]') FROM public.equipped_items v WHERE traveler_id=p_actor),
 'chests',(SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.chest_type),'[]') FROM public.traveler_chests v WHERE traveler_id=p_actor),
 'receipts',(SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.id),'[]') FROM public.chest_operations v WHERE traveler_id=p_actor),
 'qa',(SELECT to_jsonb(v) FROM economy_qa_private.profiles v WHERE traveler_id=p_actor),
 'qaReceipts',(SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.id),'[]') FROM economy_qa_private.receipts v WHERE traveler_id=p_actor)
 )::text)
$$;
REVOKE ALL ON FUNCTION shop_private.reconciliation_snapshot_010(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION shop_private.protect_reconciliation_010() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF TG_OP<>'INSERT' AND OLD.operation_type='administrative-reconciliation' THEN
  RAISE EXCEPTION 'Administrative audit is append only' USING ERRCODE='42501';
 END IF;
 IF TG_OP<>'DELETE' AND NEW.operation_type='administrative-reconciliation' THEN
  IF TG_OP<>'INSERT' OR NEW.traveler_id<>'31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid OR NEW.account_id IS DISTINCT FROM '78729453-8e04-478c-96ae-d37cead1bc8c'::uuid
  OR NEW.source<>'legacy-admin-010' OR NEW.identity_key IS DISTINCT FROM 'legacy-admin-010:31b70059-deca-44c8-a6df-f21ea68b6e42'
  OR NEW.rewards->>'contract' IS DISTINCT FROM 'RPG-ECONOMY-FIX-010:v1'
  OR NEW.rewards->>'approvalRef' IS DISTINCT FROM 'OWNER-APPROVED-2026-11-07'
  OR NEW.rewards->>'baselineCoins' IS DISTINCT FROM '1006265'
  OR NEW.rewards->>'preservedXP' IS DISTINCT FROM '245016'
  OR NEW.rewards->>'unprovenCoins' IS DISTINCT FROM '6'
  OR NEW.rewards->>'unprovenXP' IS DISTINCT FROM '16'
  OR NEW.rewards->>'basis' IS DISTINCT FROM 'administrative-test-baseline'
  OR NEW.rewards->>'legacyReceiptsAuthoritative' IS DISTINCT FROM 'false'
  OR NEW.rewards->>'newCurrencyGranted' IS DISTINCT FROM '0'
  OR coalesce(NEW.rewards->>'snapshot','')!~'^[0-9a-f]{32}$'
  THEN RAISE EXCEPTION 'Individual approved audit required' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION shop_private.protect_reconciliation_010() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER protect_reconciliation_010 BEFORE INSERT OR UPDATE OR DELETE ON public.chest_operations
 FOR EACH ROW EXECUTE FUNCTION shop_private.protect_reconciliation_010();

CREATE OR REPLACE FUNCTION shop_private.coin_balance(p_actor uuid) RETURNS bigint
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
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
$$;
REVOKE ALL ON FUNCTION shop_private.coin_balance(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION shop_private.reconcile_legacy_010(p_actor uuid,p_operation uuid,p_snapshot text) RETURNS uuid
 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE who uuid:='78729453-8e04-478c-96ae-d37cead1bc8c'; t public.travelers; r public.chest_operations; receipt uuid; BEGIN
 IF current_user<>'postgres' OR p_actor IS DISTINCT FROM '31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid OR p_operation IS NULL
 OR public.release_scope()<>'hero-equipment-006'
 OR current_setting('economyfix010.approval',true) IS DISTINCT FROM 'OWNER-APPROVED-2026-11-07'
 OR coalesce(p_snapshot,'')!~'^[0-9a-f]{32}$'
 THEN RAISE EXCEPTION 'Approved individual reconciliation required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
 -- Match the existing shop/account -> traveler -> wallet lock order.
 PERFORM 1 FROM auth.users WHERE id=who AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false)
 AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=who AND(not_after IS NULL OR not_after>clock_timestamp()))
 THEN RAISE EXCEPTION 'Existing normal confirmed session required' USING ERRCODE='42501'; END IF;
 SELECT * INTO t FROM public.travelers WHERE id=p_actor AND user_id=who AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Approved active owner/avatar required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.chest_operations WHERE identity_key='legacy-admin-010:31b70059-deca-44c8-a6df-f21ea68b6e42';
 IF FOUND THEN
  IF r.operation_key IS DISTINCT FROM 'reconcile:'||p_operation OR r.rewards->>'snapshot' IS DISTINCT FROM p_snapshot
  THEN RAISE EXCEPTION 'Reconciliation identity conflict' USING ERRCODE='PT409'; END IF;
  RETURN r.id;
 END IF;
 IF t.economic_verified_at IS NOT NULL OR t.level<>50 OR t.xp<>245016 OR t.name<>'Teste Chat A'
 THEN RAISE EXCEPTION 'Approved unmodified legacy avatar required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 PERFORM 1 FROM public.traveler_stats WHERE traveler_id=p_actor FOR UPDATE;
 PERFORM 1 FROM public.inventory WHERE traveler_id=p_actor ORDER BY id FOR UPDATE;
 PERFORM 1 FROM public.equipped_items WHERE traveler_id=p_actor ORDER BY slot FOR UPDATE;
 PERFORM 1 FROM public.traveler_chests WHERE traveler_id=p_actor ORDER BY chest_type FOR UPDATE;
 PERFORM 1 FROM public.chest_operations WHERE traveler_id=p_actor ORDER BY id FOR UPDATE;
 PERFORM 1 FROM economy_qa_private.profiles WHERE traveler_id=p_actor FOR UPDATE;
 PERFORM 1 FROM economy_qa_private.receipts WHERE traveler_id=p_actor ORDER BY id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.wallets WHERE traveler_id=p_actor AND coins=1006265)
 OR shop_private.coin_balance(p_actor)<>0
 OR EXISTS(SELECT 1 FROM shop_private.holds WHERE traveler_id=p_actor)
 OR shop_private.reconciliation_snapshot_010(p_actor) IS DISTINCT FROM p_snapshot
 THEN RAISE EXCEPTION 'Approved snapshot changed; no reconciliation applied' USING ERRCODE='PT409'; END IF;
 INSERT INTO public.chest_operations(traveler_id,operation_key,operation_type,chest_type,source,account_id,identity_key,rewards)
 VALUES(p_actor,'reconcile:'||p_operation,'administrative-reconciliation',NULL,'legacy-admin-010',who,'legacy-admin-010:31b70059-deca-44c8-a6df-f21ea68b6e42',
 jsonb_build_object('contract','RPG-ECONOMY-FIX-010:v1','approvalRef','OWNER-APPROVED-2026-11-07',
 'basis','administrative-test-baseline','baselineCoins',1006265,'preservedXP',245016,'preservedLevel',50,
 'unprovenXP',16,'unprovenCoins',6,'legacyReceiptsAuthoritative',false,'newCurrencyGranted',0,'snapshot',p_snapshot))
 RETURNING id INTO receipt;
 -- The verification marker is set only after its real approval receipt exists.
 UPDATE public.travelers SET economic_verified_at=clock_timestamp() WHERE id=p_actor AND user_id=who AND economic_verified_at IS NULL;
 IF NOT FOUND OR NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Reconciliation failed' USING ERRCODE='42501'; END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION shop_private.reconcile_legacy_010(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
