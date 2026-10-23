-- LOCAL REVIEW PROPOSAL ONLY. Apply baseline002, then unchanged expand0078,
-- then this file in one transaction during a coordinated, drained cutover.
-- This replaces (does not apply) 0078 CONTRACT0010. No legacy data is promoted.
LOCK TABLE public.travelers,public.wallets,public.inventory,public.traveler_stats,
 public.equipped_items,public.traveler_chests,public.chest_operations IN SHARE ROW EXCLUSIVE MODE;

REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.travelers,
 public.wallets,public.inventory,public.traveler_stats,public.equipped_items,
 public.traveler_chests,public.chest_operations,public.guild_reward_claims FROM PUBLIC,anon,authenticated;
DO $acl$
DECLARE t text; cols text;
BEGIN
 FOREACH t IN ARRAY ARRAY['travelers','wallets','inventory','traveler_stats','equipped_items','traveler_chests','chest_operations','guild_reward_claims'] LOOP
  SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid=('public.'||t)::regclass AND attnum>0 AND NOT attisdropped;
  EXECUTE format('REVOKE INSERT (%s),UPDATE (%s),REFERENCES (%s) ON public.%I FROM PUBLIC,anon,authenticated',cols,cols,cols,t);
 END LOOP;
END $acl$;
GRANT UPDATE(name,body_type,skin_tone,hair_style,hair_color,avatar_variant,is_active) ON public.travelers TO authenticated;
REVOKE EXECUTE ON FUNCTION public.add_coins(uuid,integer),public.spend_coins(uuid,integer),
 public.claim_chest_reward(uuid,text),public.grant_traveler_chest(uuid,text,text,text),
 public.apply_guild_mission_reward(uuid,uuid),public.economy_authority(uuid,uuid,text,jsonb)
 FROM PUBLIC,anon,authenticated,service_role;
-- The expanded journey/classic APIs are preserved but inaccessible. New services
-- cannot accidentally activate the old transcript or generic grant path.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA economy_private FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_private.create_traveler(uuid,text,text,text,text,text,text),
 economy_private.chest(uuid,text,uuid,boolean) TO authenticated;
GRANT SELECT ON public.traveler_chests,public.chest_operations TO authenticated;
-- Legacy values remain readable, but require reviewed reconciliation before
-- becoming inputs to official combat. New fixed-allocation creation is trusted.
ALTER TABLE public.travelers ADD COLUMN economic_verified_at timestamptz;
CREATE FUNCTION economy_private.mark_new_traveler() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 BEGIN NEW.economic_verified_at:=now(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION economy_private.mark_new_traveler() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER authority_new_traveler BEFORE INSERT ON public.travelers FOR EACH ROW EXECUTE FUNCTION economy_private.mark_new_traveler();
CREATE OR REPLACE FUNCTION economy_private.chest(p_traveler_id uuid,p_chest_type text,p_operation_id uuid,p_open boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous_type text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.owns_traveler(p_traveler_id) OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND NOT coalesce(is_anonymous,false)) THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_chest_type IS NULL OR p_open IS NULL THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.travelers WHERE id=p_traveler_id AND economic_verified_at IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Legacy reconciliation required' USING ERRCODE='42501'; END IF;
 SELECT chest_type INTO previous_type FROM public.chest_operations WHERE traveler_id=p_traveler_id AND operation_key=(CASE WHEN p_open THEN 'open:' ELSE 'purchase:' END)||p_operation_id;
 IF FOUND AND previous_type IS DISTINCT FROM p_chest_type THEN RAISE EXCEPTION 'Operation conflict' USING ERRCODE='22023'; END IF;
 IF p_open THEN RETURN economy_private.open_chest(p_traveler_id,p_chest_type,p_operation_id); END IF;
 RETURN economy_private.purchase_chest(p_traveler_id,p_chest_type,p_operation_id);
END $$;

-- Versioned approval records: intentionally EMPTY. Proposals are never seeded.
CREATE TABLE economy_private.card_catalog (
 version text NOT NULL, id text NOT NULL CHECK(length(id) BETWEEN 1 AND 100),
 definition jsonb NOT NULL CHECK(jsonb_typeof(definition)='object' AND definition->>'id'=id),
 approval_ref text NOT NULL CHECK(length(approval_ref)>0),
 starter boolean NOT NULL DEFAULT false, revoked_at timestamptz,
 PRIMARY KEY(version,id), CHECK(length(version) BETWEEN 1 AND 100),
 CHECK(definition->>'action' IN ('attack','defend','special:path-strike','special:steadfast-guard','special:discernment','special:pilgrim-step','special:measured-strike'))
);
ALTER TABLE economy_private.card_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON economy_private.card_catalog FROM PUBLIC,anon,authenticated,service_role;

-- Extend the existing receipt ledger and inventory. No second balance/inventory.
ALTER TABLE public.chest_operations ALTER COLUMN chest_type DROP NOT NULL;
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK(
 (operation_type IN ('grant','purchase','open') AND chest_type IS NOT NULL)
 OR (operation_type IN ('card-starter','card-revocation','arena-result','tower-result') AND chest_type IS NULL));
ALTER TABLE public.chest_operations ADD COLUMN identity_key text UNIQUE,
 ADD COLUMN account_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory ADD COLUMN card_receipt_id uuid REFERENCES public.chest_operations(id),
 ADD COLUMN card_version text,ADD COLUMN card_revoked_at timestamptz,
 ADD COLUMN card_revocation_receipt_id uuid REFERENCES public.chest_operations(id),
 ADD CONSTRAINT inventory_card_provenance CHECK((card_receipt_id IS NULL AND card_version IS NULL)
 OR (card_receipt_id IS NOT NULL AND card_version IS NOT NULL AND quantity=1));

ALTER TABLE economy_private.battles DROP CONSTRAINT battles_mode_check;
ALTER TABLE economy_private.battles ADD CONSTRAINT battles_mode_check CHECK(mode IN ('card','classic','arena-v3','tower-v3'));
ALTER TABLE economy_private.battles ADD COLUMN revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 ADD COLUMN state jsonb, ADD COLUMN context jsonb, ADD COLUMN catalog_version text,
 ADD COLUMN rules_version text,ADD COLUMN cards jsonb, ADD COLUMN floor integer CHECK(floor BETWEEN 1 AND 7),
 ADD COLUMN tower_version text,ADD COLUMN command_ids uuid[] NOT NULL DEFAULT '{}',
 ADD COLUMN commands jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN request_id uuid,ADD COLUMN request_digest text,
 ADD COLUMN receipt_id uuid REFERENCES public.chest_operations(id);
CREATE UNIQUE INDEX authority_one_active_battle ON economy_private.battles(traveler_id)
 WHERE mode IN ('arena-v3','tower-v3') AND settled_at IS NULL;
CREATE UNIQUE INDEX authority_start_request ON economy_private.battles(traveler_id,request_id) WHERE request_id IS NOT NULL;

CREATE FUNCTION economy_private.collection(p_user uuid,p_traveler uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('card',c.definition,'version',c.version,'receiptId',r.id) ORDER BY c.id),'[]')
 FROM public.inventory i JOIN public.travelers t ON t.id=i.traveler_id
 JOIN public.chest_operations r ON r.id=i.card_receipt_id AND r.traveler_id=t.id AND r.account_id=t.user_id AND r.operation_type='card-starter'
 JOIN economy_private.card_catalog c ON c.id=i.item_id AND c.version=i.card_version
 WHERE t.id=p_traveler AND t.user_id=p_user AND i.quantity=1 AND i.card_revoked_at IS NULL AND c.revoked_at IS NULL
 AND r.rewards->'cardIds' ? i.item_id;
$$;
REVOKE ALL ON FUNCTION economy_private.collection(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

-- Server-only domain boundary. All economic values remain server/SQL derived.
CREATE FUNCTION public.arena_authority_v3(p_user uuid,p_traveler uuid,p_operation text,p_payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE t public.travelers%ROWTYPE; b economy_private.battles%ROWTYPE;
 r public.chest_operations%ROWTYPE; c jsonb; version_value text; ids jsonb;
 context_value jsonb; quota integer; won boolean; result_value jsonb; old_xp integer;
BEGIN
 IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid payload' USING ERRCODE='22023'; END IF;
 -- One lock order for cross-Traveler starter claims, starts, commands and payout.
 PERFORM 1 FROM auth.users WHERE id=p_user AND NOT coalesce(is_anonymous,false) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 SELECT * INTO t FROM public.travelers WHERE id=p_traveler AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ownership denied' USING ERRCODE='42501'; END IF;
 IF p_operation='collection' THEN RETURN economy_private.collection(p_user,t.id); END IF;
 IF p_operation='starter' THEN
  -- Program identity is stable across catalog revisions and Traveler creation.
  SELECT * INTO r FROM public.chest_operations WHERE identity_key='arena-starter-v1:'||p_user;
  IF FOUND THEN RETURN to_jsonb(r); END IF;
  IF (SELECT count(DISTINCT version) FROM economy_private.card_catalog WHERE starter AND revoked_at IS NULL)<>1 THEN RAISE EXCEPTION 'Approved starter unavailable' USING ERRCODE='42501'; END IF;
  SELECT min(version) INTO version_value FROM economy_private.card_catalog WHERE starter AND revoked_at IS NULL;
  SELECT jsonb_agg(id ORDER BY id) INTO ids FROM economy_private.card_catalog WHERE version=version_value AND starter AND revoked_at IS NULL;
  IF jsonb_array_length(ids) IS DISTINCT FROM 7 OR (SELECT count(DISTINCT definition->>'action') FROM economy_private.card_catalog WHERE version=version_value AND starter AND revoked_at IS NULL)<>7
  THEN RAISE EXCEPTION 'Approved starter unavailable' USING ERRCODE='42501'; END IF;
  INSERT INTO public.chest_operations(traveler_id,operation_key,operation_type,source,identity_key,account_id,rewards)
   VALUES(t.id,'arena-starter-v1','card-starter','approved-starter','arena-starter-v1:'||p_user,p_user,
   jsonb_build_object('schemaVersion',2,'catalogVersion',version_value,'cardIds',ids)) RETURNING * INTO r;
  INSERT INTO public.inventory(traveler_id,item_id,quantity,metadata,card_receipt_id,card_version)
   SELECT t.id,c.id,1,jsonb_build_object('source','approved-starter'),r.id,c.version
   FROM economy_private.card_catalog c WHERE c.version=version_value AND c.starter AND c.revoked_at IS NULL;
  RETURN to_jsonb(r);
 END IF;
 IF p_operation='revoke-card' THEN
  IF length(coalesce(p_payload->>'reason','')) NOT BETWEEN 1 AND 500 OR length(coalesce(p_payload->>'reviewRef','')) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Reviewed reason required'; END IF;
  SELECT * INTO r FROM public.chest_operations WHERE traveler_id=t.id AND operation_key='card-revoke:'||(p_payload->>'cardId');
  IF FOUND THEN
   IF r.rewards->>'reviewRef' IS DISTINCT FROM p_payload->>'reviewRef' OR r.rewards->>'reason' IS DISTINCT FROM p_payload->>'reason' THEN RAISE EXCEPTION 'Revocation conflict' USING ERRCODE='40001'; END IF;
   RETURN to_jsonb(r);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.inventory WHERE traveler_id=t.id AND item_id=p_payload->>'cardId' AND card_receipt_id IS NOT NULL) THEN RAISE EXCEPTION 'Card missing'; END IF;
  INSERT INTO public.chest_operations(traveler_id,operation_key,operation_type,source,account_id,rewards)
   VALUES(t.id,'card-revoke:'||(p_payload->>'cardId'),'card-revocation','reviewed-revocation',p_user,jsonb_build_object('cardId',p_payload->>'cardId','reason',p_payload->>'reason','reviewRef',p_payload->>'reviewRef')) RETURNING * INTO r;
  UPDATE public.inventory SET card_revoked_at=now(),card_revocation_receipt_id=r.id WHERE traveler_id=t.id AND item_id=p_payload->>'cardId';
  RETURN to_jsonb(r);
 END IF;
 IF p_operation='context' THEN
  RETURN economy_private.base_authority(p_user,t.id,'context','{}');
 ELSIF p_operation='purchase' THEN
  IF t.economic_verified_at IS NULL THEN RAISE EXCEPTION 'Legacy reconciliation required' USING ERRCODE='42501'; END IF;
  RETURN economy_private.base_authority(p_user,t.id,'purchase',p_payload);
 ELSIF p_operation='start' THEN
  IF t.economic_verified_at IS NULL THEN RAISE EXCEPTION 'Legacy reconciliation required' USING ERRCODE='42501'; END IF;
  SELECT * INTO b FROM economy_private.battles WHERE traveler_id=t.id AND request_id=(p_payload->>'requestId')::uuid;
  IF FOUND THEN
   IF b.request_digest IS DISTINCT FROM p_payload->>'digest' THEN RAISE EXCEPTION 'Request conflict' USING ERRCODE='40001'; END IF;
   RETURN to_jsonb(b);
  END IF;
  IF p_payload->>'mode' NOT IN ('arena-v3','tower-v3') OR p_payload->>'requestId' IS NULL THEN RAISE EXCEPTION 'Invalid mode'; END IF;
  c:=economy_private.collection(p_user,t.id); ids:=p_payload->'ids';
  IF jsonb_typeof(ids) IS DISTINCT FROM 'array' OR jsonb_array_length(ids)<>7 OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(ids))<>7 THEN RAISE EXCEPTION 'Invalid deck' USING ERRCODE='22023'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(c) e WHERE ids ? (e->'card'->>'id'))<>7 THEN RAISE EXCEPTION 'Card ownership denied' USING ERRCODE='42501'; END IF;
  SELECT min(e->>'version') INTO version_value FROM jsonb_array_elements(c) e WHERE ids ? (e->'card'->>'id');
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(c) e WHERE ids ? (e->'card'->>'id') AND e->>'version'<>version_value) THEN RAISE EXCEPTION 'Mixed catalog'; END IF;
  context_value:=economy_private.base_authority(p_user,t.id,'context','{}');
  IF p_payload->'context' IS DISTINCT FROM context_value THEN RAISE EXCEPTION 'Context changed' USING ERRCODE='40001'; END IF;
  IF p_payload->>'mode'='tower-v3' THEN
   SELECT coalesce(max(floor),0)+1 INTO quota FROM economy_private.battles WHERE traveler_id=t.id AND mode='tower-v3'
    AND tower_version='permanent-v1' AND settled_at IS NOT NULL AND reward->>'outcome'='victory';
   IF (p_payload->>'floor')::integer IS DISTINCT FROM quota OR quota>7 OR p_payload->>'towerVersion' IS DISTINCT FROM 'permanent-v1' THEN RAISE EXCEPTION 'Tower order denied' USING ERRCODE='42501'; END IF;
  END IF;
  INSERT INTO economy_private.battles(traveler_id,seed,player,opponent,mode,context,catalog_version,rules_version,cards,floor,tower_version,request_id,request_digest)
  VALUES(t.id,('x'||encode(extensions.gen_random_bytes(4),'hex'))::bit(32)::bigint,p_payload->'player',p_payload->'opponent',p_payload->>'mode',context_value,version_value,
   p_payload->>'rulesVersion',(SELECT jsonb_agg(e->'card' ORDER BY e->'card'->>'id') FROM jsonb_array_elements(c) e WHERE ids ? (e->'card'->>'id')),
   (p_payload->>'floor')::integer,p_payload->>'towerVersion',(p_payload->>'requestId')::uuid,p_payload->>'digest') RETURNING * INTO b;
  RETURN to_jsonb(b);
 ELSIF p_operation='latest' THEN
  SELECT * INTO b FROM economy_private.battles WHERE traveler_id=t.id AND mode=p_payload->>'mode' ORDER BY created_at DESC,id DESC LIMIT 1;
  RETURN CASE WHEN b.id IS NULL THEN 'null'::jsonb ELSE to_jsonb(b) END;
 ELSIF p_operation IN ('battle','commit') THEN
  SELECT * INTO b FROM economy_private.battles WHERE traveler_id=t.id AND id=(p_payload->>'battleId')::uuid AND mode IN ('arena-v3','tower-v3') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Battle ownership denied' USING ERRCODE='42501'; END IF;
  IF p_operation='battle' THEN RETURN to_jsonb(b); END IF;
  IF b.settled_at IS NOT NULL OR b.revision IS DISTINCT FROM (p_payload->>'revision')::integer OR (p_payload->>'commandId')::uuid=ANY(b.command_ids)
   THEN RAISE EXCEPTION 'Stale or finished battle' USING ERRCODE='40001'; END IF;
  IF p_payload->>'commandId' IS NULL OR jsonb_typeof(p_payload->'state') IS DISTINCT FROM 'object' OR p_payload->'state'->>'id' IS DISTINCT FROM b.id::text
   THEN RAISE EXCEPTION 'Invalid server state'; END IF;
  IF p_payload->>'rulesVersion' IS DISTINCT FROM b.rules_version THEN RAISE EXCEPTION 'Rules unavailable' USING ERRCODE='40001'; END IF;
  c:=economy_private.collection(p_user,t.id);
  IF (SELECT count(*) FROM jsonb_array_elements(c) e WHERE e->>'version'=b.catalog_version AND EXISTS(SELECT 1 FROM jsonb_array_elements(b.cards) selected WHERE selected->>'id'=e->'card'->>'id'))<>7 THEN RAISE EXCEPTION 'Card ownership revoked' USING ERRCODE='42501'; END IF;
  -- The trusted TypeScript server alone supplies the derived state. CAS commits
  -- the accepted round, card consumption, result, receipt and credits together.
  UPDATE economy_private.battles SET state=p_payload->'state',revision=revision+1,
   command_ids=array_append(command_ids,(p_payload->>'commandId')::uuid),commands=commands||jsonb_build_array(p_payload->'command') WHERE id=b.id RETURNING * INTO b;
  IF b.state->>'status'='finished' THEN
   won:=coalesce(b.state->>'winnerId'=t.id::text,false);
   IF b.mode='arena-v3' THEN
    SELECT count(*) INTO quota FROM economy_private.battles WHERE traveler_id=t.id AND mode IN ('arena-v3','card','classic')
      AND opponent->>'id'=b.opponent->>'id' AND settled_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AND reward->>'rewarded'='true';
    result_value:=jsonb_build_object('xp',CASE WHEN won AND quota<3 THEN 8 ELSE 0 END,'coins',CASE WHEN won AND quota<3 THEN 3 ELSE 0 END,
     'rewarded',won AND quota<3,'reason',CASE WHEN NOT won THEN 'defeat' WHEN quota>=3 THEN 'daily-limit' ELSE 'victory' END,
     'outcome',CASE WHEN won THEN 'victory' ELSE 'defeat' END,'status','confirmed',
     'levelBonusCoins',CASE WHEN won AND quota<3 AND t.xp<200 AND t.xp+8>=200 THEN 10 ELSE 0 END);
    IF won AND quota<3 THEN
     old_xp:=t.xp;
     UPDATE public.travelers SET xp=xp+8,level=least(50,greatest(1,floor((1+sqrt(1+(xp+8)::numeric/25))/2)::integer)) WHERE id=t.id;
     UPDATE public.wallets SET coins=coins+3+CASE WHEN old_xp<200 AND old_xp+8>=200 THEN 10 ELSE 0 END WHERE traveler_id=t.id;
     IF NOT FOUND THEN RAISE EXCEPTION 'Wallet missing'; END IF;
    END IF;
   ELSE
    result_value:=jsonb_build_object('xp',0,'coins',0,'rewarded',false,'reason','tower-economy-unapproved','status','blocked',
     'outcome',CASE WHEN won THEN 'victory' ELSE 'defeat' END,'towerVersion',b.tower_version,'floor',b.floor);
   END IF;
   INSERT INTO public.chest_operations(traveler_id,operation_key,operation_type,source,account_id,rewards)
    VALUES(t.id,'battle:'||b.id,CASE WHEN b.mode='arena-v3' THEN 'arena-result' ELSE 'tower-result' END,'server-battle-v3',p_user,result_value) RETURNING * INTO r;
   UPDATE economy_private.battles SET settled_at=now(),reward=result_value,receipt_id=r.id WHERE id=b.id RETURNING * INTO b;
  END IF;
  RETURN to_jsonb(b);
 ELSIF p_operation='tower' THEN
  SELECT coalesce(max(floor),0)+1 INTO quota FROM economy_private.battles WHERE traveler_id=t.id AND mode='tower-v3' AND tower_version='permanent-v1' AND reward->>'outcome'='victory' AND settled_at IS NOT NULL;
  RETURN jsonb_build_object('nextFloor',quota,'version','permanent-v1','rewardStatus','blocked');
 ELSE RAISE EXCEPTION 'Operation denied' USING ERRCODE='42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.arena_authority_v3(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.arena_authority_v3(uuid,uuid,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.economy_protocol_version() RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT 3 $$;
