-- TEST ONLY. Existing prices approved for QA, not a production economy package.
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='45s';
DO $$ BEGIN
 IF current_setting('shop001c.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' OR public.economy_protocol_version()<>3
 OR to_regclass('economy_private.community_chest_policy') IS NULL OR to_regnamespace('shop_qa_private') IS NOT NULL THEN RAISE EXCEPTION 'Reviewed TEST scope required' USING ERRCODE='42501';END IF;
END $$;
DO $$ DECLARE r record;p regprocedure;BEGIN FOR r IN SELECT * FROM(VALUES
 ('economy_private.purchase_chest(uuid,text,uuid)','0096e39e9a9e0a4056687d90b2baf575','{postgres=X/postgres}'),
 ('economy_private.open_chest(uuid,text,uuid)','63af7f1b3138b9056c91bf9242fda193','{postgres=X/postgres}'),
 ('economy_private.base_authority(uuid,uuid,text,jsonb)','dfbdda1b79abdae9cb5e7ffba8bca421','{postgres=X/postgres}'),
 ('economy_private.set_owned_equipment(uuid,text,text,text)','349b85769009d2ec64d246956b56992d','{postgres=X/postgres,authenticated=X/postgres}')
 )v(signature,hash,acl) LOOP p:=to_regprocedure(r.signature);IF p IS NULL OR md5(replace(pg_get_functiondef(p),E'\r\n',E'\n'))<>r.hash OR(SELECT proacl::text FROM pg_proc WHERE oid=p) IS DISTINCT FROM r.acl THEN RAISE EXCEPTION 'Reviewed prior authority required: %',r.signature USING ERRCODE='42501';END IF;END LOOP;END $$;
CREATE SCHEMA shop_qa_private;
REVOKE ALL ON SCHEMA shop_qa_private FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA shop_qa_private TO authenticated;
CREATE TABLE shop_qa_private.profiles(
 account_id uuid PRIMARY KEY REFERENCES auth.users(id),traveler_id uuid NOT NULL UNIQUE REFERENCES public.travelers(id),
 enabled boolean NOT NULL DEFAULT true,approval_ref text NOT NULL CHECK(approval_ref='ECONOMY-001C:OWNER:QA-TEST:2026-11-03'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE shop_qa_private.budget_receipts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL UNIQUE REFERENCES shop_qa_private.profiles(account_id),
 traveler_id uuid NOT NULL UNIQUE REFERENCES public.travelers(id),amount integer NOT NULL CHECK(amount=255),
 nonce uuid NOT NULL UNIQUE,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 12 AND 300),created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE shop_qa_private.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_qa_private.budget_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA shop_qa_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER qa_shop_budget_immutable BEFORE UPDATE OR DELETE ON shop_qa_private.budget_receipts FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK(
 (operation_type IN('grant','purchase','open') AND chest_type IS NOT NULL)
 OR(operation_type IN('card-starter','card-revocation','arena-result','tower-result','community-xp') AND chest_type IS NULL)
 OR(operation_type='equipment-purchase' AND chest_type IS NULL AND source='qa-shop001c' AND account_id IS NOT NULL AND price_paid IS NOT NULL AND rewards->>'catalogVersion'='QA-SHOP-001C:v1' AND rewards ? 'itemId'));

-- Owner SQL only, after normal login verified the designated TEST identity.
CREATE FUNCTION shop_qa_private.grant_budget(p_owner uuid,p_actor uuid,p_reason text,p_nonce uuid) RETURNS uuid
 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
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
END $$;
CREATE FUNCTION shop_qa_private.actor(p_actor uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;BEGIN
 IF public.release_scope()<>'hero-equipment-006' THEN RAISE EXCEPTION 'TEST only' USING ERRCODE='42501';END IF;
 who:=economy_private.community_xp_actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM shop_qa_private.profiles WHERE account_id=who AND traveler_id=p_actor AND enabled)
 OR NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL) THEN RAISE EXCEPTION 'Approved QA shop profile required' USING ERRCODE='42501';END IF;
 RETURN who;END $$;
CREATE FUNCTION shop_qa_private.balance_valid(p_actor uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.wallets w WHERE w.traveler_id=p_actor AND w.coins=
 (SELECT coalesce(sum(amount),0) FROM shop_qa_private.budget_receipts WHERE traveler_id=p_actor)
 +(SELECT coalesce(sum((rewards->>'coins')::bigint),0) FROM public.chest_operations WHERE traveler_id=p_actor AND operation_type='open' AND source LIKE 'qa-shop001c:%')
 -(SELECT coalesce(sum(price_paid),0) FROM public.chest_operations WHERE traveler_id=p_actor AND((operation_type='purchase' AND source LIKE 'qa-shop001c:%') OR(operation_type='equipment-purchase' AND source='qa-shop001c'))))
$$;
CREATE FUNCTION shop_qa_private.state(p_actor uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF public.release_scope()<>'hero-equipment-006' OR NOT EXISTS(SELECT 1 FROM shop_qa_private.profiles WHERE account_id=who AND traveler_id=p_actor AND enabled) THEN RETURN jsonb_build_object('version',1,'qaOnly',true,'enabled',false);END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',true,'enabled',true,'catalogVersion','QA-SHOP-001C:v1','coins',(SELECT coins FROM public.wallets WHERE traveler_id=p_actor),'balanceVerified',shop_qa_private.balance_valid(p_actor),'offers',jsonb_build_array(
 jsonb_build_object('kind','chest','id','common','price',40),jsonb_build_object('kind','equipment','id','traveler-sword-common','price',35),jsonb_build_object('kind','equipment','id','traveler-armor-uncommon','price',65),jsonb_build_object('kind','equipment','id','traveler-shield-rare','price',115)));
END $$;
CREATE FUNCTION shop_qa_private.purchase(p_actor uuid,p_kind text,p_offer text,p_operation uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;prior public.chest_operations;answer jsonb;price integer;receipt uuid;k text;source_value text;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_qa_private.actor(p_actor);
 IF p_operation IS NULL OR p_kind IS NULL OR p_offer IS NULL OR NOT((p_kind='chest' AND p_offer='common') OR(p_kind='equipment' AND p_offer IN('traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare'))) THEN RAISE EXCEPTION 'Reviewed offer required' USING ERRCODE='22023';END IF;
 k:='qa-shop-purchase:v1:'||who||':'||p_operation;
 SELECT * INTO prior FROM public.chest_operations WHERE identity_key=k;
 IF FOUND THEN IF prior.traveler_id<>p_actor OR(p_kind='chest' AND(prior.operation_type<>'purchase' OR prior.chest_type<>p_offer)) OR(p_kind='equipment' AND(prior.operation_type<>'equipment-purchase' OR prior.rewards->>'itemId' IS DISTINCT FROM p_offer)) THEN RAISE EXCEPTION 'Purchase identity conflict' USING ERRCODE='22023';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',true,'receiptId',prior.id,'kind',p_kind,'offer',p_offer,'pricePaid',prior.price_paid,'replayed',true);END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 IF NOT shop_qa_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'QA balance review required' USING ERRCODE='42501';END IF;
 IF p_kind='chest' THEN
  answer:=economy_private.purchase_chest(p_actor,'common',p_operation);price:=40;source_value:='qa-shop001c:'||p_operation;
  UPDATE public.traveler_chests SET sources=jsonb_set(sources,ARRAY[(quantity-1)::text],to_jsonb(source_value),false) WHERE traveler_id=p_actor AND chest_type='common';
  UPDATE public.chest_operations SET account_id=who,identity_key=k,source=source_value,rewards=rewards||jsonb_build_object('catalogVersion','QA-SHOP-001C:v1') WHERE traveler_id=p_actor AND operation_key='purchase:'||p_operation RETURNING id INTO receipt;
 ELSE
  answer:=economy_private.base_authority(who,p_actor,'purchase',jsonb_build_object('itemId',p_offer));
  price:=CASE WHEN answer->>'status'='owned' THEN 0 ELSE CASE p_offer WHEN 'traveler-sword-common' THEN 35 WHEN 'traveler-armor-uncommon' THEN 65 WHEN 'traveler-shield-rare' THEN 115 END END;
  INSERT INTO public.chest_operations(traveler_id,account_id,identity_key,operation_key,operation_type,chest_type,source,price_paid,rewards)
  VALUES(p_actor,who,k,'equipment-purchase:'||p_operation,'equipment-purchase',NULL,'qa-shop001c',price,jsonb_build_object('itemId',p_offer,'catalogVersion','QA-SHOP-001C:v1','qaOnly',true,'status',answer->>'status')) RETURNING id INTO receipt;
 END IF;
 IF receipt IS NULL OR NOT shop_qa_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Purchase reconciliation failed' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',true,'receiptId',receipt,'kind',p_kind,'offer',p_offer,'pricePaid',price,'replayed',false);
END $$;
CREATE FUNCTION shop_qa_private.open(p_actor uuid,p_operation uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;prior public.chest_operations;c public.traveler_chests;answer jsonb;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_qa_private.actor(p_actor);
 IF p_operation IS NULL THEN RAISE EXCEPTION 'Opening identity required' USING ERRCODE='22023';END IF;
 SELECT * INTO prior FROM public.chest_operations WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF FOUND THEN IF prior.account_id IS DISTINCT FROM who OR prior.operation_type<>'open' OR prior.source NOT LIKE 'qa-shop001c:%' THEN RAISE EXCEPTION 'Opening identity conflict' USING ERRCODE='22023';END IF;RETURN prior.rewards||jsonb_build_object('duplicate',true);END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 IF NOT shop_qa_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'QA balance review required' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM public.traveler_chests WHERE traveler_id=p_actor AND chest_type='common' AND quantity>0 FOR UPDATE;
 IF c.traveler_id IS NULL OR jsonb_array_length(c.sources)<>c.quantity OR(c.sources->>0) NOT LIKE 'qa-shop001c:%'
 OR NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND source=c.sources->>0 AND operation_type='purchase' AND chest_type='common' AND price_paid=40 AND rewards->>'catalogVersion'='QA-SHOP-001C:v1') THEN RAISE EXCEPTION 'Owned reviewed purchase required' USING ERRCODE='42501';END IF;
 answer:=economy_private.open_chest(p_actor,'common',p_operation);
 IF((answer->>'coins'='25' AND answer->>'itemId' IS NULL) OR(answer->>'coins'='10' AND answer->>'itemId'='traveler-sword-common')) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Reviewed common loot required' USING ERRCODE='42501';END IF;
 UPDATE public.chest_operations SET account_id=who,identity_key='qa-shop-open:v1:'||who||':'||p_operation WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF NOT shop_qa_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Opening reconciliation failed' USING ERRCODE='42501';END IF;
 RETURN answer;END $$;
CREATE FUNCTION shop_qa_private.equip(p_actor uuid,p_slot text,p_item text,p_expected text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);PERFORM shop_qa_private.actor(p_actor);
 IF p_slot IS NULL OR p_slot NOT IN('weapon','armor','shield') OR(p_item IS NOT NULL AND p_item NOT IN('traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare')) THEN RAISE EXCEPTION 'Reviewed QA equipment required' USING ERRCODE='42501';END IF;
 RETURN economy_private.set_owned_equipment(p_actor,p_slot,p_item,p_expected);END $$;
CREATE FUNCTION shop_qa_private.isolate_credit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM shop_qa_private.profiles WHERE traveler_id=NEW.traveler_id) AND NEW.operation_type NOT IN('purchase','open','equipment-purchase','card-starter','card-revocation') THEN RAISE EXCEPTION 'QA source is isolated from official rewards' USING ERRCODE='42501';END IF;RETURN NEW;END $$;
CREATE TRIGGER qa_shop_credit_isolation BEFORE INSERT ON public.chest_operations FOR EACH ROW EXECUTE FUNCTION shop_qa_private.isolate_credit();
CREATE FUNCTION public.get_qa_shop(p_actor uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_qa_private.state(p_actor)$$;
CREATE FUNCTION public.purchase_qa_shop(p_actor uuid,p_kind text,p_offer text,p_operation_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_qa_private.purchase(p_actor,p_kind,p_offer,p_operation_id)$$;
CREATE FUNCTION public.open_qa_shop_chest(p_actor uuid,p_operation_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_qa_private.open(p_actor,p_operation_id)$$;
CREATE FUNCTION public.equip_qa_shop(p_actor uuid,p_slot text,p_item_id text,p_expected_item_id text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT shop_qa_private.equip(p_actor,p_slot,p_item_id,p_expected_item_id)$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA shop_qa_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_qa_shop(uuid),public.purchase_qa_shop(uuid,text,text,uuid),public.open_qa_shop_chest(uuid,uuid),public.equip_qa_shop(uuid,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION shop_qa_private.state(uuid),shop_qa_private.purchase(uuid,text,text,uuid),shop_qa_private.open(uuid,uuid),shop_qa_private.equip(uuid,text,text,text),public.get_qa_shop(uuid),public.purchase_qa_shop(uuid,text,text,uuid),public.open_qa_shop_chest(uuid,uuid),public.equip_qa_shop(uuid,text,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
