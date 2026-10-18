-- TASK-0076A. Phase 2 CONTRACT. Requires compatible client/server already prepared.
-- Run as ONE transaction after backup and draining old economic writes.
LOCK TABLE public.travelers,public.wallets,public.inventory,public.traveler_stats,public.traveler_chests,public.chest_operations IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO economy_private.journeys(traveler_id,state)
 SELECT id,jsonb_build_object('progress',economy_private.initial_journey()->'progress'||coalesce((
   SELECT jsonb_object_agg(e.key,e.value) FROM jsonb_each(coalesce(journey_progress,'{}')) e
   WHERE economy_private.initial_journey()->'progress' ? e.key),'{}'),
   'snakeWon',coalesce(journey_progress->>'gardenStep','') IN ('quiz','reward','diary','done') OR coalesce((journey_progress->>'gardenCompleted')::boolean,false),
   'quizAnswers','{}'::jsonb,'legacyQuizCompleted',coalesce(journey_progress->>'gardenStep','') IN ('reward','diary','done') OR coalesce((journey_progress->>'gardenCompleted')::boolean,false))
 FROM public.travelers;
INSERT INTO economy_private.journey_rewards(traveler_id,reward_key)
 SELECT j.traveler_id,k FROM economy_private.journeys j CROSS JOIN LATERAL (
  SELECT jsonb_array_elements_text(j.state->'progress'->'gardenCollectedLoot') k
  UNION SELECT jsonb_array_elements_text(j.state->'progress'->'gardenOpenedChests')
  UNION SELECT jsonb_array_elements_text(j.state->'progress'->'gardenSecrets')
  UNION SELECT jsonb_array_elements_text(j.state->'progress'->'gardenEvents')
  UNION SELECT 'phase:garden-choice' WHERE coalesce((j.state->'progress'->>'gardenRewardGranted')::boolean,false)
 ) keys ON CONFLICT DO NOTHING;
-- A historical chest receipt also consumes this entitlement; do not duplicate it.
INSERT INTO economy_private.journey_rewards(traveler_id,reward_key)
 SELECT traveler_id,'phase:garden-choice' FROM public.chest_operations WHERE operation_key='phase:garden-choice' ON CONFLICT DO NOTHING;

-- Ownership RLS alone did not constrain the origin of economic values.
REVOKE INSERT, UPDATE, DELETE ON public.wallets, public.inventory, public.traveler_stats FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE ON public.travelers FROM PUBLIC, anon, authenticated;
-- Also remove independent column ACLs, including any drift discovered at preflight.
DO $acl$
DECLARE t text; columns text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wallets','inventory','traveler_stats','travelers'] LOOP
    SELECT string_agg(quote_ident(attname), ',') INTO columns FROM pg_attribute
      WHERE attrelid = ('public.' || t)::regclass AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE INSERT (%s), UPDATE (%s) ON public.%I FROM PUBLIC, anon, authenticated', columns, columns, t);
  END LOOP;
END $acl$;
GRANT UPDATE (name, body_type, skin_tone, hair_style, hair_color, avatar_variant, is_active, journey_progress)
  ON public.travelers TO authenticated;
DROP POLICY wallets_insert_own ON public.wallets;
DROP POLICY wallets_update_own ON public.wallets;
DROP POLICY inventory_insert_own ON public.inventory;
DROP POLICY inventory_update_own ON public.inventory;
DROP POLICY inventory_delete_own ON public.inventory;
DROP POLICY traveler_stats_insert_own ON public.traveler_stats;
DROP POLICY traveler_stats_update_own ON public.traveler_stats;
DROP POLICY travelers_insert_own ON public.travelers;
REVOKE EXECUTE ON FUNCTION public.add_coins(uuid,integer), public.spend_coins(uuid,integer),
  public.claim_chest_reward(uuid,text) FROM PUBLIC, anon, authenticated;


CREATE TRIGGER travelers_initialize_journey AFTER INSERT ON public.travelers FOR EACH ROW EXECUTE FUNCTION economy_private.initialize_journey();
CREATE TRIGGER travelers_authoritative_journey BEFORE UPDATE OF journey_progress ON public.travelers FOR EACH ROW EXECUTE FUNCTION economy_private.protect_journey_checkpoint();

CREATE OR REPLACE FUNCTION public.claim_chest_reward(p_traveler_id uuid,p_reward_key text) RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT economy_private.claim_phase_chest(p_traveler_id,p_reward_key) $$;
GRANT EXECUTE ON FUNCTION public.claim_chest_reward(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.economy_protocol_version() RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT 2 $$;
