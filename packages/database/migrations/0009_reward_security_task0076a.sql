-- TASK-0076A. Phase 1 EXPAND ONLY: preserves old published writes and signatures.
-- Does NOT close SEC-ECONOMY-001 until phase 2 (0010). No remote execution authorized.
-- Requires 0000..0008. No player balances, XP, inventories or saves are rewritten.
CREATE SCHEMA economy_private;
GRANT USAGE ON SCHEMA public TO service_role;
REVOKE ALL ON SCHEMA economy_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA economy_private TO authenticated, service_role;

CREATE TABLE economy_private.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  seed bigint NOT NULL CHECK(seed BETWEEN 0 AND 4294967295),
  player jsonb NOT NULL,
  opponent jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  reward jsonb
);
CREATE INDEX battles_traveler_created ON economy_private.battles(traveler_id, created_at);
ALTER TABLE economy_private.battles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON economy_private.battles FROM PUBLIC, anon, authenticated, service_role;

-- Creation still uses the existing, authenticated, fixed starter allocation.
ALTER FUNCTION public.create_traveler(uuid,text,text,text,text,text,text) SET SCHEMA economy_private;
ALTER FUNCTION economy_private.create_traveler(uuid,text,text,text,text,text,text) SECURITY DEFINER;
REVOKE ALL ON FUNCTION economy_private.create_traveler(uuid,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION economy_private.create_traveler(uuid,text,text,text,text,text,text) TO authenticated;
CREATE FUNCTION public.create_traveler(p_id uuid,p_name text,p_body_type text,p_skin_tone text,p_hair_style text,p_hair_color text,p_avatar_variant text)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT economy_private.create_traveler(p_id,p_name,p_body_type,p_skin_tone,p_hair_style,p_hair_color,p_avatar_variant)
$$;
REVOKE ALL ON FUNCTION public.create_traveler(uuid,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_traveler(uuid,text,text,text,text,text,text) TO authenticated;

CREATE FUNCTION economy_private.authority(p_user_id uuid, p_traveler_id uuid, p_operation text, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  t public.travelers%ROWTYPE;
  b economy_private.battles%ROWTYPE;
  result_value jsonb;
  price_value integer;
  prior_xp integer;
  next_xp integer;
  new_level integer;
  quota integer;
  balance integer;
  won boolean;
BEGIN
  IF p_user_id IS NULL OR p_traveler_id IS NULL OR p_operation IS NULL OR p_payload IS NULL
     OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid operation' USING ERRCODE = '22023';
  END IF;
  -- Serializes every Arena reward and purchase for this owner; unrelated owners do not block each other.
  SELECT * INTO t FROM public.travelers WHERE id=p_traveler_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id=p_user_id AND NOT coalesce(is_anonymous,false)) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  IF p_operation = 'context' THEN
    RETURN jsonb_build_object('name',t.name,'xp',t.xp,
      'coins',(SELECT coins FROM public.wallets WHERE traveler_id=t.id),
      'attributes',(SELECT jsonb_build_object('life',base_life,'strength',base_strength,'defense',base_defense,'wisdom',base_wisdom)
         FROM public.traveler_stats WHERE traveler_id=t.id),
      'inventory',coalesce((SELECT jsonb_agg(jsonb_build_object('item_id',item_id,'quantity',quantity)) FROM public.inventory WHERE traveler_id=t.id),'[]'::jsonb),
      'equipped',coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.equipped_items WHERE traveler_id=t.id),'{}'::jsonb));
  ELSIF p_operation = 'start' THEN
    IF p_payload->'player'->>'id' IS DISTINCT FROM t.id::text
       OR (p_payload->'opponent'->>'id' NOT IN ('training-apprentice','training-balanced','training-guardian','training-tactician') AND NOT EXISTS(SELECT 1 FROM public.travelers WHERE user_id=p_user_id AND id::text=p_payload->'opponent'->>'id'))
       OR p_payload->'opponent'->>'id' IS NULL THEN
      RAISE EXCEPTION 'Invalid battle' USING ERRCODE='22023';
    END IF;
    IF (SELECT count(*) FROM economy_private.battles WHERE traveler_id=t.id AND created_at > now()-interval '1 minute') >= 10 THEN
      RAISE EXCEPTION 'Too many battles' USING ERRCODE='54000';
    END IF;
    INSERT INTO economy_private.battles(traveler_id,seed,player,opponent)
      VALUES(t.id, floor(random()*4294967296)::bigint,p_payload->'player',p_payload->'opponent') RETURNING * INTO b;
  ELSIF p_operation IN ('battle','settle') THEN
    SELECT * INTO b FROM economy_private.battles WHERE id=(p_payload->>'battleId')::uuid AND traveler_id=t.id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
    IF p_operation = 'settle' THEN
      IF b.settled_at IS NOT NULL THEN RETURN b.reward; END IF;
      -- won is supplied ONLY by the server replay; authenticated cannot call this function.
      IF jsonb_typeof(p_payload->'won') IS DISTINCT FROM 'boolean' THEN
        RAISE EXCEPTION 'Invalid result' USING ERRCODE='22023';
      END IF;
      won := (p_payload->>'won')::boolean;
      IF b.created_at < now()-interval '24 hours' THEN
        RAISE EXCEPTION 'Battle expired' USING ERRCODE='22023';
      END IF;
      SELECT count(*) INTO quota FROM economy_private.battles
        WHERE traveler_id=t.id AND opponent->>'id'=b.opponent->>'id'
          AND settled_at >= date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
          AND reward->>'rewarded'='true';
      result_value := jsonb_build_object('xp',CASE WHEN won AND quota<3 THEN 8 ELSE 0 END,
        'coins',CASE WHEN won AND quota<3 THEN 3 ELSE 0 END,'rewarded',won AND quota<3,
        'reason',CASE WHEN NOT won THEN 'defeat' WHEN quota>=3 THEN 'daily-limit' ELSE 'victory' END);
      IF won AND quota<3 THEN
        prior_xp := t.xp; next_xp := prior_xp+8;
        new_level := least(50,greatest(1,floor((1+sqrt(1+next_xp::numeric/25))/2)::integer));
        UPDATE public.travelers SET xp=next_xp,level=new_level WHERE id=t.id;
        UPDATE public.wallets SET coins=coins+3+CASE WHEN prior_xp<200 AND next_xp>=200 THEN 10 ELSE 0 END WHERE traveler_id=t.id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Wallet missing'; END IF;
      END IF;
      UPDATE economy_private.battles SET settled_at=now(),reward=result_value WHERE id=b.id;
      RETURN result_value;
    END IF;
  ELSIF p_operation = 'purchase' THEN
    price_value := CASE p_payload->>'itemId' WHEN 'traveler-sword-common' THEN 35 WHEN 'traveler-armor-uncommon' THEN 65 WHEN 'traveler-shield-rare' THEN 115 ELSE NULL END;
    IF price_value IS NULL THEN RAISE EXCEPTION 'Invalid offer' USING ERRCODE='22023'; END IF;
    IF EXISTS(SELECT 1 FROM public.inventory WHERE traveler_id=t.id AND item_id=p_payload->>'itemId') THEN
      RETURN jsonb_build_object('status','owned');
    END IF;
    UPDATE public.wallets SET coins=coins-price_value WHERE traveler_id=t.id AND coins>=price_value RETURNING coins INTO balance;
    IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient balance' USING ERRCODE='P0001'; END IF;
    INSERT INTO public.inventory(traveler_id,item_id,quantity,metadata)
      VALUES(t.id,p_payload->>'itemId',1,jsonb_build_object('source','shop','pricePaid',price_value));
    RETURN jsonb_build_object('status','purchased','coins',balance,'pricePaid',price_value);
  ELSE
    RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('id',b.id,'travelerId',b.traveler_id,'seed',b.seed,'player',b.player,'opponent',b.opponent);
END $$;
REVOKE ALL ON FUNCTION economy_private.authority(uuid,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION economy_private.authority(uuid,uuid,text,jsonb) TO service_role;
CREATE FUNCTION public.economy_authority(p_user_id uuid,p_traveler_id uuid,p_operation text,p_payload jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT economy_private.authority(p_user_id,p_traveler_id,p_operation,p_payload)
$$;
REVOKE ALL ON FUNCTION public.economy_authority(uuid,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.economy_authority(uuid,uuid,text,jsonb) TO service_role;

-- Keep existing server-selected chest loot/prices and mission approval/tier rules.
-- Serialize chest retries before the legacy duplicate lookup. No new client credit RPC.
ALTER FUNCTION public.open_chest(uuid,text,uuid) SET SCHEMA economy_private;
ALTER FUNCTION public.purchase_chest(uuid,text,uuid) SET SCHEMA economy_private;
REVOKE ALL ON FUNCTION economy_private.open_chest(uuid,text,uuid),economy_private.purchase_chest(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION economy_private.chest(p_traveler_id uuid,p_chest_type text,p_operation_id uuid,p_open boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE previous_type text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.owns_traveler(p_traveler_id) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  IF p_operation_id IS NULL OR p_chest_type IS NULL OR p_open IS NULL THEN
    RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';
  END IF;
  PERFORM 1 FROM public.travelers WHERE id=p_traveler_id FOR UPDATE;
  SELECT chest_type INTO previous_type FROM public.chest_operations WHERE traveler_id=p_traveler_id
    AND operation_key=(CASE WHEN p_open THEN 'open:' ELSE 'purchase:' END)||p_operation_id::text;
  IF FOUND AND previous_type IS DISTINCT FROM p_chest_type THEN
    RAISE EXCEPTION 'Operation already bound to another chest' USING ERRCODE='22023';
  END IF;
  IF p_open THEN RETURN economy_private.open_chest(p_traveler_id,p_chest_type,p_operation_id); END IF;
  RETURN economy_private.purchase_chest(p_traveler_id,p_chest_type,p_operation_id);
END $$;
REVOKE ALL ON FUNCTION economy_private.chest(uuid,text,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION economy_private.chest(uuid,text,uuid,boolean) TO authenticated;
CREATE FUNCTION public.open_chest(p_traveler_id uuid,p_chest_type text,p_operation_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT economy_private.chest(p_traveler_id,p_chest_type,p_operation_id,true)
$$;
CREATE FUNCTION public.purchase_chest(p_traveler_id uuid,p_chest_type text,p_operation_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT economy_private.chest(p_traveler_id,p_chest_type,p_operation_id,false)
$$;
REVOKE ALL ON FUNCTION public.open_chest(uuid,text,uuid),public.purchase_chest(uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.open_chest(uuid,text,uuid),public.purchase_chest(uuid,text,uuid) TO authenticated;

-- Continuation: private authoritative journey state and receipts. Legacy checkpoints
-- are frozen ONCE at cutover; no balances are imported or credited.
CREATE FUNCTION economy_private.initial_journey() RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT jsonb_build_object('progress','{"gardenStep":"opening","gardenExploredPoints":[],"gardenFragments":0,"explorationObjectives":[],"gardenCollectedLoot":[],"gardenOpenedChests":[],"gardenSecrets":[],"gardenEvents":[],"bibleReading":{"genesis2Opened":null,"genesis2Confirmed":false,"genesis3Opened":null,"genesis3Confirmed":false,"comprehensionCompleted":false},"devotionalCompleted":false,"devotionalReflection":"","quizAttemptId":0,"gardenRewardGranted":false,"gardenCompleted":false,"gardenDiscoveryFound":false}'::jsonb,'snakeWon',false,'quizAnswers','{}'::jsonb,'legacyQuizCompleted',false) $$;
REVOKE ALL ON FUNCTION economy_private.initial_journey() FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE economy_private.journeys (
 traveler_id uuid PRIMARY KEY REFERENCES public.travelers(id) ON DELETE CASCADE,
 revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 state jsonb NOT NULL CHECK(jsonb_typeof(state)='object')
);
CREATE TABLE economy_private.journey_rewards (
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
 reward_key text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(traveler_id,reward_key)
);
CREATE TABLE economy_private.journey_operations (
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
 operation_id uuid NOT NULL,digest text NOT NULL CHECK(length(digest)=64),
 PRIMARY KEY(traveler_id,operation_id)
);
ALTER TABLE economy_private.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_private.journey_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_private.journey_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON economy_private.journeys,economy_private.journey_rewards,economy_private.journey_operations FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION economy_private.initialize_journey() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN INSERT INTO economy_private.journeys(traveler_id,state) VALUES(NEW.id,economy_private.initial_journey()); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION economy_private.initialize_journey() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION economy_private.protect_journey_checkpoint() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p jsonb;
BEGIN
 SELECT state->'progress' INTO p FROM economy_private.journeys WHERE traveler_id=NEW.id;
 IF p IS NOT NULL THEN NEW.journey_progress:=coalesce(NEW.journey_progress,'{}'::jsonb)||p; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION economy_private.protect_journey_checkpoint() FROM PUBLIC,anon,authenticated,service_role;

ALTER TABLE economy_private.battles ADD COLUMN mode text NOT NULL DEFAULT 'card' CHECK(mode IN ('card','classic'));
ALTER FUNCTION economy_private.authority(uuid,uuid,text,jsonb) RENAME TO base_authority;
REVOKE ALL ON FUNCTION economy_private.base_authority(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION economy_private.authority(p_user_id uuid,p_traveler_id uuid,p_operation text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE t public.travelers%ROWTYPE; j economy_private.journeys%ROWTYPE; prior_digest text;
 result_value jsonb; reward_key_value text; coin_value integer:=0; xp_value integer:=0; item_value text; old_xp integer; new_xp integer; fresh boolean:=false;
BEGIN
 SELECT * INTO t FROM public.travelers WHERE id=p_traveler_id AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id AND NOT coalesce(is_anonymous,false)) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_operation IN ('journey-context','journey-commit') THEN
   SELECT * INTO j FROM economy_private.journeys WHERE traveler_id=t.id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Journey not initialized' USING ERRCODE='P0002'; END IF;
   IF p_operation='journey-context' THEN RETURN jsonb_build_object('state',j.state,'revision',j.revision); END IF;
   IF p_payload->>'operationId' IS NULL OR p_payload->>'digest' IS NULL OR length(p_payload->>'digest')<>64 THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023'; END IF;
   SELECT digest INTO prior_digest FROM economy_private.journey_operations WHERE traveler_id=t.id AND operation_id=(p_payload->>'operationId')::uuid;
   IF FOUND THEN
     IF prior_digest IS DISTINCT FROM p_payload->>'digest' THEN RAISE EXCEPTION 'Operation payload conflict' USING ERRCODE='22023'; END IF;
     RETURN jsonb_build_object('progress',j.state->'progress','revision',j.revision,'duplicate',true);
   END IF;
   IF (p_payload->>'revision')::integer IS DISTINCT FROM j.revision THEN RAISE EXCEPTION 'Stale journey' USING ERRCODE='40001'; END IF;
   IF jsonb_typeof(p_payload->'state') IS DISTINCT FROM 'object' OR octet_length((p_payload->'state')::text)>131072 THEN RAISE EXCEPTION 'Invalid state' USING ERRCODE='22023'; END IF;
   reward_key_value:=p_payload->>'rewardKey';
   IF reward_key_value IS NOT NULL THEN
     coin_value:=CASE reward_key_value WHEN 'coins-grove' THEN 8 WHEN 'coins-river' THEN 12 WHEN 'chest-path' THEN 10 WHEN 'chest-hidden' THEN 18 WHEN 'hidden-corner' THEN 7 WHEN 'wind-pattern' THEN 5 WHEN 'garden-equipment' THEN 0 WHEN 'phase:garden-choice' THEN 30 ELSE NULL END;
     IF coin_value IS NULL THEN RAISE EXCEPTION 'Invalid reward source' USING ERRCODE='22023'; END IF;
     INSERT INTO economy_private.journey_rewards(traveler_id,reward_key) VALUES(t.id,reward_key_value) ON CONFLICT DO NOTHING;
     fresh:=FOUND;
     IF fresh THEN
       IF reward_key_value='phase:garden-choice' THEN xp_value:=120;item_value:='wisdom-amulet'; END IF;
       IF reward_key_value='garden-equipment' THEN item_value:='traveler-helmet-rare'; END IF;
       old_xp:=t.xp;new_xp:=old_xp+xp_value;
       UPDATE public.travelers SET xp=new_xp,level=least(50,greatest(1,floor((1+sqrt(1+new_xp::numeric/25))/2)::integer)) WHERE id=t.id;
       UPDATE public.wallets SET coins=coins+coin_value+CASE WHEN old_xp<200 AND new_xp>=200 THEN 10 ELSE 0 END WHERE traveler_id=t.id;
       IF NOT FOUND THEN RAISE EXCEPTION 'Wallet missing'; END IF;
       IF item_value IS NOT NULL THEN INSERT INTO public.inventory(traveler_id,item_id,quantity,metadata) VALUES(t.id,item_value,1,jsonb_build_object('source',reward_key_value)) ON CONFLICT(traveler_id,item_id) DO NOTHING; END IF;
       IF reward_key_value='phase:garden-choice' THEN PERFORM public.grant_traveler_chest(t.id,'common','phase_completion','phase:garden-choice'); END IF;
     END IF;
   END IF;
   UPDATE economy_private.journeys SET revision=revision+1,state=p_payload->'state' WHERE traveler_id=t.id RETURNING * INTO j;
   UPDATE public.travelers SET journey_progress=coalesce(journey_progress,'{}')||(j.state->'progress')||CASE WHEN j.state->'progress'->>'gardenCompleted'='true' AND coalesce(t.journey_progress->>'guildId','')<>'' AND t.journey_progress->>'guildChallengeStatus'='locked' THEN jsonb_build_object('guildChallengeStatus','available') ELSE '{}'::jsonb END WHERE id=t.id;
   INSERT INTO economy_private.journey_operations(traveler_id,operation_id,digest) VALUES(t.id,(p_payload->>'operationId')::uuid,p_payload->>'digest');
   RETURN jsonb_build_object('progress',j.state->'progress','revision',j.revision,'duplicate',false,'rewardGranted',fresh);
 END IF;
 result_value:=economy_private.base_authority(p_user_id,p_traveler_id,p_operation,p_payload);
 IF p_operation='start' THEN
   IF coalesce(p_payload->>'mode','card') NOT IN ('card','classic') THEN RAISE EXCEPTION 'Invalid mode' USING ERRCODE='22023'; END IF;
   UPDATE economy_private.battles SET mode=coalesce(p_payload->>'mode','card') WHERE id=(result_value->>'id')::uuid;
 END IF;
 IF p_operation IN ('start','battle') THEN SELECT result_value||jsonb_build_object('mode',mode) INTO result_value FROM economy_private.battles WHERE id=(result_value->>'id')::uuid; END IF;
 RETURN result_value;
END $$;
REVOKE ALL ON FUNCTION economy_private.authority(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION economy_private.authority(uuid,uuid,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.economy_authority(p_user_id uuid,p_traveler_id uuid,p_operation text,p_payload jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT economy_private.authority(p_user_id,p_traveler_id,p_operation,p_payload) $$;
-- The old chest claim signature remains callable, but can only observe a phase
-- entitlement already validated and atomically issued by the new protocol.
CREATE FUNCTION economy_private.claim_phase_chest(p_traveler_id uuid,p_reward_key text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.travelers WHERE id=p_traveler_id FOR UPDATE;
 IF p_reward_key IS DISTINCT FROM 'phase:garden-choice' OR NOT EXISTS(SELECT 1 FROM economy_private.journey_rewards WHERE traveler_id=p_traveler_id AND reward_key=p_reward_key) THEN RAISE EXCEPTION 'Phase not verified' USING ERRCODE='42501'; END IF;
 RETURN public.grant_traveler_chest(p_traveler_id,'common','phase_completion',p_reward_key);
END $$;
REVOKE ALL ON FUNCTION economy_private.claim_phase_chest(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION economy_private.claim_phase_chest(uuid,text) TO authenticated;

CREATE FUNCTION public.economy_protocol_version() RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT 1 $$;
REVOKE ALL ON FUNCTION public.economy_protocol_version() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.economy_protocol_version() TO authenticated,service_role;
