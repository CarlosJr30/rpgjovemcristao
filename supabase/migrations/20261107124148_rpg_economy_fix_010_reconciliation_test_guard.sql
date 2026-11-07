-- TEST ONLY. Preserve applied history; restrict audit insertion to its existing operator.
DO $$BEGIN IF current_setting('economyfix010.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR md5(replace(pg_get_functiondef('shop_private.protect_reconciliation_010()'::regprocedure),E'\r\n',E'\n'))<>'5b881b21003ac746da00484c6a1e0817' THEN RAISE EXCEPTION 'Reviewed TEST audit guard required' USING ERRCODE='42501';END IF;END $$;
CREATE OR REPLACE FUNCTION shop_private.protect_reconciliation_010() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF TG_OP<>'INSERT' AND OLD.operation_type='administrative-reconciliation' THEN
  RAISE EXCEPTION 'Administrative audit is append only' USING ERRCODE='42501';
 END IF;
 IF TG_OP<>'DELETE' AND NEW.operation_type='administrative-reconciliation' THEN
  IF current_user<>'postgres' OR TG_OP<>'INSERT' OR NEW.traveler_id<>'31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid OR NEW.account_id IS DISTINCT FROM '78729453-8e04-478c-96ae-d37cead1bc8c'::uuid
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
