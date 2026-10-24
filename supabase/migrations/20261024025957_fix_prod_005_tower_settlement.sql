-- FIX-PROD-005: transactional Tower settlement, disabled pending homologation.
-- No existing balances, receipts, catalog approvals or progress are backfilled.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE economy_private.tower_reward_policies (
 version text PRIMARY KEY,
 tower_version text NOT NULL,
 catalog_version text,
 enabled boolean NOT NULL DEFAULT false,
 approved_at timestamptz,
 approval_ref text,
 CHECK (NOT enabled OR (catalog_version IS NOT NULL AND approved_at IS NOT NULL AND approval_ref IS NOT NULL
   AND length(approval_ref) BETWEEN 1 AND 160))
);
ALTER TABLE economy_private.tower_reward_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON economy_private.tower_reward_policies FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO economy_private.tower_reward_policies(version,tower_version)
 VALUES ('fix-prod-005-proposed-v1','permanent-v1');

-- Stable first-win identity deliberately excludes policy and battle versions.
CREATE TABLE economy_private.tower_reward_claims (
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 tower_version text NOT NULL,
 floor integer NOT NULL CHECK (floor BETWEEN 1 AND 7),
 account_id uuid NOT NULL REFERENCES auth.users(id),
 battle_id uuid NOT NULL UNIQUE REFERENCES economy_private.battles(id),
 receipt_id uuid NOT NULL UNIQUE REFERENCES public.chest_operations(id),
 policy_version text NOT NULL REFERENCES economy_private.tower_reward_policies(version),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (traveler_id,tower_version,floor)
);
ALTER TABLE economy_private.tower_reward_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON economy_private.tower_reward_claims FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX tower_reward_claims_account ON economy_private.tower_reward_claims(account_id);
CREATE INDEX tower_reward_claims_policy ON economy_private.tower_reward_claims(policy_version);

CREATE FUNCTION economy_private.settle_tower_battle(p_user uuid,p_traveler uuid,p_battle uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE
 t public.travelers%ROWTYPE;
 b economy_private.battles%ROWTYPE;
 policy economy_private.tower_reward_policies%ROWTYPE;
 receipt uuid;
 result_value jsonb;
 won boolean;
 eligible boolean := false;
 reason_value text;
 xp_value integer := 0;
 coin_value integer := 0;
 chest_value integer := 0;
BEGIN
 -- Same lock order as the calling authority. No browser-accessible entry point.
 PERFORM 1 FROM auth.users WHERE id=p_user AND NOT coalesce(is_anonymous,false) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 SELECT * INTO t FROM public.travelers WHERE id=p_traveler AND user_id=p_user FOR UPDATE;
 IF NOT FOUND OR t.economic_verified_at IS NULL THEN
  RAISE EXCEPTION 'Ownership or reconciliation denied' USING ERRCODE='42501';
 END IF;
 SELECT * INTO b FROM economy_private.battles
  WHERE id=p_battle AND traveler_id=t.id AND mode='tower-v3' FOR UPDATE;
 IF NOT FOUND OR b.state->>'status' IS DISTINCT FROM 'finished'
  OR b.floor IS NULL OR b.tower_version IS NULL THEN
  RAISE EXCEPTION 'Finished Tower battle required' USING ERRCODE='42501';
 END IF;
 IF b.settled_at IS NOT NULL THEN RETURN to_jsonb(b); END IF;
 won := coalesce(b.state->>'winnerId'=t.id::text,false);
 SELECT * INTO policy FROM economy_private.tower_reward_policies
  WHERE tower_version=b.tower_version ORDER BY approved_at DESC NULLS LAST,version DESC LIMIT 1 FOR SHARE;
 reason_value := 'tower-economy-unapproved';
 IF NOT won THEN
  reason_value := 'defeat';
 ELSIF EXISTS (SELECT 1 FROM economy_private.tower_reward_claims
   WHERE traveler_id=t.id AND tower_version=b.tower_version AND floor=b.floor) THEN
  reason_value := 'already-rewarded';
 ELSIF EXISTS (SELECT 1 FROM economy_private.battles
   WHERE traveler_id=t.id AND mode='tower-v3' AND tower_version=b.tower_version AND floor=b.floor
    AND id<>b.id AND settled_at IS NOT NULL AND reward->>'outcome'='victory') THEN
  -- A blocked historical victory needs an explicit reviewed backfill decision.
  reason_value := 'prior-victory-unreviewed';
 ELSIF policy.enabled AND policy.approved_at<=now() AND b.created_at>=policy.approved_at
   AND policy.catalog_version=b.catalog_version AND policy.approval_ref IS NOT NULL
   AND (SELECT count(*) FROM economy_private.card_catalog
     WHERE version=b.catalog_version AND revoked_at IS NULL AND approval_ref IS NOT NULL)>=7
   AND (SELECT count(DISTINCT floor) FROM economy_private.battles
     WHERE traveler_id=t.id AND mode='tower-v3' AND tower_version=b.tower_version
      AND floor<b.floor AND settled_at IS NOT NULL AND reward->>'outcome'='victory')=b.floor-1 THEN
  eligible := true;
  reason_value := 'first-victory';
  xp_value := (ARRAY[20,30,40,50,60,80,150])[b.floor];
  coin_value := (ARRAY[10,15,20,25,30,40,75])[b.floor];
  chest_value := CASE WHEN b.floor=7 THEN 1 ELSE 0 END;
 END IF;
 result_value := jsonb_build_object('xp',xp_value,'coins',coin_value,'epicChests',chest_value,
  'rewarded',eligible,'reason',reason_value,'status',CASE WHEN eligible THEN 'confirmed' ELSE 'blocked' END,
  'outcome',CASE WHEN won THEN 'victory' ELSE 'defeat' END,
  'towerVersion',b.tower_version,'floor',b.floor,'policyVersion',policy.version);
 INSERT INTO public.chest_operations(traveler_id,operation_key,operation_type,source,account_id,rewards)
  VALUES(t.id,'battle:'||b.id,'tower-result','server-tower-v3',p_user,result_value) RETURNING id INTO receipt;
 IF eligible THEN
  INSERT INTO economy_private.tower_reward_claims(traveler_id,tower_version,floor,account_id,battle_id,receipt_id,policy_version)
   VALUES(t.id,b.tower_version,b.floor,p_user,b.id,receipt,policy.version);
  UPDATE public.travelers SET xp=xp+xp_value,
   level=least(50,greatest(1,floor((1+sqrt(1+(xp+xp_value)::numeric/25))/2)::integer)) WHERE id=t.id;
  -- No implicit Arena level-up bonus: Tower budget is exactly 430 XP / 215 coins.
  UPDATE public.wallets SET coins=coins+coin_value WHERE traveler_id=t.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet missing'; END IF;
  IF chest_value=1 THEN
   INSERT INTO public.traveler_chests(traveler_id,chest_type,quantity,sources)
    VALUES(t.id,'epic',1,jsonb_build_array('tower-receipt:'||receipt))
    ON CONFLICT (traveler_id,chest_type) DO UPDATE SET
     quantity=public.traveler_chests.quantity+1,
     sources=public.traveler_chests.sources||EXCLUDED.sources;
  END IF;
 END IF;
 UPDATE economy_private.battles SET settled_at=now(),reward=result_value,receipt_id=receipt
  WHERE id=b.id RETURNING * INTO b;
 RETURN to_jsonb(b);
END $function$;
REVOKE ALL ON FUNCTION economy_private.settle_tower_battle(uuid,uuid,uuid)
 FROM PUBLIC,anon,authenticated,service_role;

-- Patch only the existing Tower branch; preserve Arena rules, conflicts and ACLs.
DO $migration$
DECLARE definition text; old_branch text := $old$   ELSE
    result_value:=jsonb_build_object('xp',0,'coins',0,'rewarded',false,'reason','tower-economy-unapproved','status','blocked',
     'outcome',CASE WHEN won THEN 'victory' ELSE 'defeat' END,'towerVersion',b.tower_version,'floor',b.floor);
   END IF;$old$;
BEGIN
 IF public.economy_protocol_version() IS DISTINCT FROM 3 THEN RAISE EXCEPTION 'Protocol 3 required'; END IF;
 old_branch := replace(old_branch,chr(13),'');
 definition := replace(pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure),chr(13),'');
 IF (length(definition)-length(replace(definition,old_branch,'')))/length(old_branch)<>1 THEN
  RAISE EXCEPTION 'Unexpected Tower settlement baseline';
 END IF;
 EXECUTE replace(definition,old_branch,$new$   ELSE
    RETURN economy_private.settle_tower_battle(p_user,t.id,b.id);
   END IF;$new$);
END $migration$;
