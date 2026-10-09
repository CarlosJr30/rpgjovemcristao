DROP POLICY IF EXISTS chest_operations_select_own ON public.chest_operations;
DROP POLICY IF EXISTS traveler_chests_select_own ON public.traveler_chests;
DROP FUNCTION IF EXISTS public.open_chest(uuid,text,uuid);
DROP FUNCTION IF EXISTS public.purchase_chest(uuid,text,uuid);
DROP FUNCTION IF EXISTS public.claim_chest_reward(uuid,text);
CREATE OR REPLACE FUNCTION public.apply_guild_mission_reward(p_mission_id uuid, p_traveler_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE tier text; xp_value integer; coin_value integer; previous_xp integer; next_xp integer; level_bonus integer := 0;
BEGIN
  SELECT reward_tier INTO tier FROM public.guild_missions WHERE id = p_mission_id;
  xp_value := CASE tier WHEN 'normal' THEN 80 WHEN 'great' THEN 240 WHEN 'epic' THEN 480 WHEN 'extraordinary' THEN 720 ELSE NULL END;
  coin_value := CASE tier WHEN 'normal' THEN 25 WHEN 'great' THEN 100 WHEN 'epic' THEN 220 WHEN 'extraordinary' THEN 360 ELSE NULL END;
  IF xp_value IS NULL THEN RAISE EXCEPTION 'Invalid reward tier' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.guild_reward_claims(mission_id, traveler_id, reward_tier, xp_awarded, coins_awarded) VALUES (p_mission_id, p_traveler_id, tier, xp_value, coin_value) ON CONFLICT (mission_id, traveler_id) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT xp INTO previous_xp FROM public.travelers WHERE id = p_traveler_id FOR UPDATE;
  next_xp := previous_xp + xp_value;
  IF previous_xp < 200 AND next_xp >= 200 THEN level_bonus := 10; END IF;
  UPDATE public.travelers SET xp = next_xp, level = LEAST(50, GREATEST(1, floor((1 + sqrt(1 + next_xp::numeric / 25)) / 2)::integer)) WHERE id = p_traveler_id;
  UPDATE public.wallets SET coins = coins + coin_value + level_bonus WHERE traveler_id = p_traveler_id;
  RETURN true;
END $$;
DROP FUNCTION IF EXISTS public.grant_traveler_chest(uuid,text,text,text);
DROP TABLE IF EXISTS public.chest_operations;
DROP TABLE IF EXISTS public.traveler_chests;
