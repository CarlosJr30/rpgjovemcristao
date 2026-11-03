-- PRODUCTION package. Owner 0fa04b94 approves restricted installation after gates; activation is separate.
-- Empty private persistence; one previously approved PROD designation, no activation or TEST data.
-- Isolated training persistence. No writes to canonical player tables.
DO $$BEGIN
 IF current_setting('economyqa002.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
 OR public.release_scope()<>'guild-ebd-001'
 OR to_regprocedure('economy_private.community_xp_actor(uuid)') IS NULL
 OR to_regprocedure('public.get_shop(uuid)') IS NULL
 OR md5(replace(pg_get_functiondef('economy_private.open_chest(uuid,text,uuid)'::regprocedure),E'\r\n',E'\n'))<>'63af7f1b3138b9056c91bf9242fda193'
 THEN RAISE EXCEPTION 'Reviewed training environment required' USING ERRCODE='42501'; END IF;
END $$;
CREATE SCHEMA economy_qa_private;
REVOKE ALL ON SCHEMA economy_qa_private FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA economy_qa_private TO authenticated;
CREATE TABLE economy_qa_private.policy (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 account_id uuid NOT NULL,traveler_id uuid NOT NULL,approval_ref text NOT NULL
);
INSERT INTO economy_qa_private.policy VALUES(true,'78729453-8e04-478c-96ae-d37cead1bc8c','31b70059-deca-44c8-a6df-f21ea68b6e42','ECONOMY-QA-002:PROD-OWNER-5149c13b-PRIVATE-TRAINING:OWNER-APPROVED');
CREATE TABLE economy_qa_private.profiles (
 account_id uuid PRIMARY KEY REFERENCES auth.users(id),
 traveler_id uuid UNIQUE NOT NULL REFERENCES public.travelers(id),
 activation_id uuid UNIQUE NOT NULL,reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 coins integer NOT NULL CHECK(coins>=0 AND coins<=10000),
 chests integer NOT NULL DEFAULT 0 CHECK(chests>=0),
 items jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(items)='object'),
 equipped jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(equipped)='object'),
 revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 CHECK(expires_at=created_at+interval '168 hours')
);
CREATE TABLE economy_qa_private.receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES economy_qa_private.profiles(account_id),
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 operation_id uuid NOT NULL,command text NOT NULL CHECK(command IN('budget','purchase','open','equip')),
 payload jsonb NOT NULL,result jsonb NOT NULL,delta integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(account_id,operation_id)
);
ALTER TABLE economy_qa_private.policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_qa_private.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_qa_private.receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA economy_qa_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER training_policy_immutable BEFORE UPDATE OR DELETE ON economy_qa_private.policy FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();
CREATE TRIGGER training_receipt_immutable BEFORE UPDATE OR DELETE ON economy_qa_private.receipts FOR EACH ROW EXECUTE FUNCTION economy_private.community_xp_append_only();
CREATE FUNCTION economy_qa_private.protect_profile() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$BEGIN
 IF TG_OP='DELETE' OR ROW(NEW.account_id,NEW.traveler_id,NEW.activation_id,NEW.reason,NEW.created_at,NEW.expires_at)
 IS DISTINCT FROM ROW(OLD.account_id,OLD.traveler_id,OLD.activation_id,OLD.reason,OLD.created_at,OLD.expires_at)
 THEN RAISE EXCEPTION 'Training designation immutable' USING ERRCODE='42501'; END IF;
 RETURN NEW;END $$;
CREATE TRIGGER training_profile_immutable BEFORE UPDATE OR DELETE ON economy_qa_private.profiles FOR EACH ROW EXECUTE FUNCTION economy_qa_private.protect_profile();
-- Owner SQL only. No public wrapper and no EXECUTE for application or service_role.
CREATE FUNCTION economy_qa_private.activate(p_owner uuid,p_actor uuid,p_nonce uuid,p_reason text) RETURNS uuid
 LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE prior economy_qa_private.profiles;stamp timestamptz:=clock_timestamp();BEGIN
 IF p_nonce IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 12 AND 200
 OR p_reason ~* '(bearer[[:space:]]|eyJ[a-z0-9_-]{15,}\.|sb_secret_|sbp_|password[[:space:]]*[:=]|senha[[:space:]]*[:=]|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})'
 OR NOT EXISTS(SELECT 1 FROM economy_qa_private.policy WHERE singleton AND account_id=p_owner AND traveler_id=p_actor)
 THEN RAISE EXCEPTION 'Explicit training designation required' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(10002,1);
 PERFORM 1 FROM auth.users WHERE id=p_owner AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false)
 AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=stamp) FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=p_owner AND(not_after IS NULL OR not_after>stamp))
 OR NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND user_id=p_owner AND is_active)
 THEN RAISE EXCEPTION 'Normal confirmed active identity required' USING ERRCODE='42501'; END IF;
 SELECT * INTO prior FROM economy_qa_private.profiles WHERE account_id=p_owner;
 IF FOUND THEN
  IF prior.traveler_id<>p_actor OR prior.activation_id<>p_nonce OR prior.reason<>p_reason THEN RAISE EXCEPTION 'Budget already activated' USING ERRCODE='42501';END IF;
  RETURN prior.activation_id;
 END IF;
 INSERT INTO economy_qa_private.profiles(account_id,traveler_id,activation_id,reason,created_at,expires_at,coins)
 VALUES(p_owner,p_actor,p_nonce,p_reason,stamp,stamp+interval '168 hours',10000);
 INSERT INTO economy_qa_private.receipts(account_id,traveler_id,operation_id,command,payload,result,delta)
 VALUES(p_owner,p_actor,p_nonce,'budget','{}',jsonb_build_object('amount',10000,'qaOnly',true),10000);
 RETURN p_nonce;END $$;
CREATE FUNCTION economy_qa_private.state(p_actor uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;p economy_qa_private.profiles;history jsonb;BEGIN
 who:=economy_private.community_xp_actor(p_actor);
 SELECT * INTO p FROM economy_qa_private.profiles WHERE account_id=who AND traveler_id=p_actor;
 IF NOT FOUND OR NOT p.enabled OR p.expires_at<=clock_timestamp() THEN RETURN jsonb_build_object('version',1,'qaOnly',true,'enabled',false);END IF;
 IF p.coins IS DISTINCT FROM(SELECT coalesce(sum(delta),0) FROM economy_qa_private.receipts WHERE account_id=who AND traveler_id=p_actor) THEN RAISE EXCEPTION 'Training balance unavailable' USING ERRCODE='42501';END IF;
 SELECT coalesce(jsonb_agg(v ORDER BY created_at DESC,id DESC),'[]') INTO history FROM (
 SELECT id,created_at,jsonb_build_object('id',id,'createdAt',created_at,'operationId',operation_id,'command',command,'payload',payload,'result',result) v
 FROM economy_qa_private.receipts WHERE account_id=who AND traveler_id=p_actor AND command<>'budget' ORDER BY created_at DESC,id DESC LIMIT 50) r;
 RETURN jsonb_build_object('version',1,'qaOnly',true,'enabled',true,'actor',p_actor,'activation',p.activation_id,'expiresAt',p.expires_at,'coins',p.coins,'chests',p.chests,'items',p.items,'equipped',p.equipped,'revision',p.revision,'history',history);
END $$;
-- The common branch is copied verbatim from the frozen approved open_chest
-- algorithm, with private persistence below. Canonical authority is untouched.
CREATE FUNCTION economy_qa_private.common_reward() RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE reward_coins integer;reward_item_id text;reward_item_name text;roll_value double precision;BEGIN
 roll_value:=random();
 IF roll_value < .80 THEN reward_coins := 25; ELSE reward_coins := 10; reward_item_id := 'traveler-sword-common'; reward_item_name := 'Espada do Caminho'; END IF;
 RETURN jsonb_build_object('coins',reward_coins,'itemId',reward_item_id,'itemName',reward_item_name);
END $$;
CREATE FUNCTION economy_qa_private.command(p_actor uuid,p_command text,p_payload jsonb,p_operation uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;p economy_qa_private.profiles;prior economy_qa_private.receipts;rid uuid:=gen_random_uuid();answer jsonb;price integer:=0;kind text;offer text;slot_name text;current_item text;item text;slot_for_item text;BEGIN
 who:=economy_private.community_xp_actor(p_actor);
 SELECT * INTO p FROM economy_qa_private.profiles WHERE account_id=who AND traveler_id=p_actor FOR UPDATE;
 IF NOT FOUND OR NOT p.enabled OR p.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Training unavailable' USING ERRCODE='42501';END IF;
 IF p_operation IS NULL OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>1024 OR p_command IS NULL OR p_command NOT IN('purchase','open','equip') THEN RAISE EXCEPTION 'Invalid training operation' USING ERRCODE='22023';END IF;
 SELECT * INTO prior FROM economy_qa_private.receipts WHERE account_id=who AND operation_id=p_operation;
 IF FOUND THEN
  IF prior.traveler_id<>p_actor OR prior.command<>p_command OR prior.payload<>p_payload THEN RAISE EXCEPTION 'Training operation conflict' USING ERRCODE='22023';END IF;
  RETURN prior.result||jsonb_build_object('replayed',true);
 END IF;
 IF p.coins IS DISTINCT FROM(SELECT coalesce(sum(delta),0) FROM economy_qa_private.receipts WHERE account_id=who AND traveler_id=p_actor) THEN RAISE EXCEPTION 'Training balance unavailable' USING ERRCODE='42501';END IF;
 IF p_command='purchase' THEN
  kind:=p_payload->>'kind';offer:=p_payload->>'offer';
  IF p_payload<>jsonb_build_object('kind',kind,'offer',offer) OR kind IS NULL OR offer IS NULL THEN RAISE EXCEPTION 'Reviewed training offer required' USING ERRCODE='22023';END IF;
  IF kind='chest' AND offer='common' THEN price:=40;p.chests:=p.chests+1;
  ELSIF kind='equipment' AND offer IN('traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare') THEN
   price:=CASE offer WHEN 'traveler-sword-common' THEN 35 WHEN 'traveler-armor-uncommon' THEN 65 ELSE 115 END;
   IF p.items ? offer THEN price:=0;ELSE p.items:=p.items||jsonb_build_object(offer,1);END IF;
  ELSE RAISE EXCEPTION 'Reviewed training offer required' USING ERRCODE='22023';END IF;
  IF p.coins<price THEN RAISE EXCEPTION 'Insufficient training coins' USING ERRCODE='P0001';END IF;
  p.coins:=p.coins-price;
  answer:=jsonb_build_object('version',1,'qaOnly',true,'receiptId',rid,'kind',kind,'offer',offer,'pricePaid',price,'replayed',false);
 ELSIF p_command='open' THEN
  IF p_payload<>'{"type":"common"}'::jsonb THEN RAISE EXCEPTION 'Reviewed training chest required' USING ERRCODE='22023';END IF;
  IF p.chests<1 THEN RAISE EXCEPTION 'Training chest unavailable' USING ERRCODE='P0002';END IF;
  p.chests:=p.chests-1;answer:=economy_qa_private.common_reward();price:=-(answer->>'coins')::integer;p.coins:=p.coins-price;
  item:=answer->>'itemId';IF item IS NOT NULL THEN p.items:=p.items||jsonb_build_object(item,coalesce((p.items->>item)::integer,0)+1);END IF;
  answer:=answer||jsonb_build_object('chestType','common','source','training002:'||p.activation_id,'remainingQuantity',p.chests,'duplicate',false);
 ELSE
  slot_name:=p_payload->>'slot';item:=p_payload->>'itemId';
  IF slot_name IS NULL OR slot_name NOT IN('weapon','armor','shield') OR p_payload<>jsonb_build_object('slot',slot_name,'itemId',item,'expectedItemId',p_payload->>'expectedItemId') THEN RAISE EXCEPTION 'Reviewed training slot required' USING ERRCODE='22023';END IF;
  current_item:=p.equipped->>slot_name;
  IF current_item IS DISTINCT FROM(p_payload->>'expectedItemId') THEN RAISE EXCEPTION 'Training equipment conflict' USING ERRCODE='PT409';END IF;
  slot_for_item:=CASE item WHEN 'traveler-sword-common' THEN 'weapon' WHEN 'traveler-armor-uncommon' THEN 'armor' WHEN 'traveler-shield-rare' THEN 'shield' END;
  IF item IS NOT NULL AND(slot_for_item IS DISTINCT FROM slot_name OR NOT(p.items ? item)) THEN RAISE EXCEPTION 'Training item not owned' USING ERRCODE='42501';END IF;
  p.equipped:=p.equipped||jsonb_build_object(slot_name,item);
  answer:=jsonb_build_object('version',1,'qaOnly',true,'receiptId',rid,'status','equipped');
 END IF;
 UPDATE economy_qa_private.profiles SET coins=p.coins,chests=p.chests,items=p.items,equipped=p.equipped,revision=revision+1 WHERE account_id=who;
 INSERT INTO economy_qa_private.receipts(id,account_id,traveler_id,operation_id,command,payload,result,delta)
 VALUES(rid,who,p_actor,p_operation,p_command,p_payload,answer,-price);
 RETURN answer;
END $$;
CREATE FUNCTION economy_qa_private.receipt(p_actor uuid,p_operation uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE who uuid;answer jsonb;BEGIN
 who:=economy_private.community_xp_actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM economy_qa_private.profiles WHERE account_id=who AND traveler_id=p_actor) THEN RAISE EXCEPTION 'Training unavailable' USING ERRCODE='42501';END IF;
 SELECT jsonb_build_object('id',id,'createdAt',created_at,'operationId',operation_id,'command',command,'payload',payload,'result',result) INTO answer FROM economy_qa_private.receipts WHERE account_id=who AND traveler_id=p_actor AND operation_id=p_operation AND command<>'budget';
 RETURN answer;END $$;
CREATE FUNCTION public.get_training_qa(p_actor uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT economy_qa_private.state(p_actor)$$;
CREATE FUNCTION public.get_training_qa_receipt(p_actor uuid,p_operation_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT economy_qa_private.receipt(p_actor,p_operation_id)$$;
CREATE FUNCTION public.command_training_qa(p_actor uuid,p_command text,p_payload jsonb,p_operation_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT economy_qa_private.command(p_actor,p_command,p_payload,p_operation_id)$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA economy_qa_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_training_qa(uuid),public.get_training_qa_receipt(uuid,uuid),public.command_training_qa(uuid,text,jsonb,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_qa_private.state(uuid),economy_qa_private.receipt(uuid,uuid),economy_qa_private.command(uuid,text,jsonb,uuid),public.get_training_qa(uuid),public.get_training_qa_receipt(uuid,uuid),public.command_training_qa(uuid,text,jsonb,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
