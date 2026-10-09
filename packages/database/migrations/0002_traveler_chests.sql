CREATE TABLE public.traveler_chests (
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  chest_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (traveler_id, chest_type),
  CONSTRAINT traveler_chests_type_check CHECK (chest_type IN ('common','uncommon','rare','epic','extraordinary')),
  CONSTRAINT traveler_chests_quantity_check CHECK (quantity > 0 AND quantity <= 9999),
  CONSTRAINT traveler_chests_sources_check CHECK (jsonb_typeof(sources) = 'array' AND jsonb_array_length(sources) = quantity)
);--> statement-breakpoint

CREATE TABLE public.chest_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  operation_key text NOT NULL,
  operation_type text NOT NULL,
  chest_type text NOT NULL,
  source text NOT NULL,
  price_paid integer,
  rewards jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chest_operations_traveler_key_unique UNIQUE (traveler_id, operation_key),
  CONSTRAINT chest_operations_key_length_check CHECK (char_length(operation_key) BETWEEN 1 AND 160),
  CONSTRAINT chest_operations_type_check CHECK (operation_type IN ('grant','purchase','open')),
  CONSTRAINT chest_operations_chest_type_check CHECK (chest_type IN ('common','uncommon','rare','epic','extraordinary')),
  CONSTRAINT chest_operations_source_length_check CHECK (char_length(source) BETWEEN 1 AND 120),
  CONSTRAINT chest_operations_price_check CHECK (price_paid IS NULL OR price_paid >= 0)
);--> statement-breakpoint

CREATE INDEX chest_operations_traveler_created_idx ON public.chest_operations(traveler_id, created_at);--> statement-breakpoint
ALTER TABLE public.traveler_chests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.chest_operations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY traveler_chests_select_own ON public.traveler_chests FOR SELECT TO authenticated USING (public.owns_traveler(traveler_id));--> statement-breakpoint
CREATE POLICY chest_operations_select_own ON public.chest_operations FOR SELECT TO authenticated USING (public.owns_traveler(traveler_id));--> statement-breakpoint
CREATE TRIGGER traveler_chests_set_updated_at BEFORE UPDATE ON public.traveler_chests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

CREATE FUNCTION public.grant_traveler_chest(
  p_traveler_id uuid,
  p_chest_type text,
  p_source text,
  p_operation_key text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_chest_type NOT IN ('common','uncommon','rare','epic','extraordinary') OR char_length(p_source) NOT BETWEEN 1 AND 120 OR char_length(p_operation_key) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'Invalid chest grant' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.travelers WHERE id = p_traveler_id) THEN
    RAISE EXCEPTION 'Traveler not found' USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO public.chest_operations(traveler_id, operation_key, operation_type, chest_type, source)
  VALUES (p_traveler_id, p_operation_key, 'grant', p_chest_type, p_source)
  ON CONFLICT (traveler_id, operation_key) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.traveler_chests(traveler_id, chest_type, quantity, sources)
  VALUES (p_traveler_id, p_chest_type, 1, jsonb_build_array(p_source))
  ON CONFLICT (traveler_id, chest_type) DO UPDATE
  SET quantity = public.traveler_chests.quantity + 1,
      sources = public.traveler_chests.sources || jsonb_build_array(p_source),
      updated_at = now();
  RETURN true;
END $$;--> statement-breakpoint

CREATE FUNCTION public.claim_chest_reward(p_traveler_id uuid, p_reward_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  IF p_reward_key = 'phase:garden-choice' THEN
    RETURN public.grant_traveler_chest(p_traveler_id, 'common', 'phase_completion', p_reward_key);
  END IF;
  RAISE EXCEPTION 'Unknown chest reward' USING ERRCODE = '22023';
END $$;--> statement-breakpoint

CREATE FUNCTION public.purchase_chest(p_traveler_id uuid, p_chest_type text, p_operation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  operation_key_value text := 'purchase:' || p_operation_id::text;
  price_value integer;
  required_level integer;
  resulting_coins integer;
  prior_result jsonb;
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  SELECT rewards INTO prior_result FROM public.chest_operations WHERE traveler_id = p_traveler_id AND operation_key = operation_key_value;
  IF FOUND THEN RETURN prior_result || jsonb_build_object('duplicate', true); END IF;
  price_value := CASE p_chest_type WHEN 'common' THEN 40 WHEN 'uncommon' THEN 90 WHEN 'rare' THEN 180 ELSE NULL END;
  required_level := CASE p_chest_type WHEN 'common' THEN 1 WHEN 'uncommon' THEN 1 WHEN 'rare' THEN 3 ELSE NULL END;
  IF price_value IS NULL THEN RAISE EXCEPTION 'Chest unavailable for purchase' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.travelers WHERE id = p_traveler_id AND level >= required_level) THEN RAISE EXCEPTION 'Traveler level too low' USING ERRCODE = 'P0001'; END IF;
  INSERT INTO public.chest_operations(traveler_id, operation_key, operation_type, chest_type, source, price_paid, rewards)
  VALUES (p_traveler_id, operation_key_value, 'purchase', p_chest_type, 'shop', price_value, '{}'::jsonb)
  ON CONFLICT (traveler_id, operation_key) DO NOTHING;
  IF NOT FOUND THEN
    SELECT rewards INTO prior_result FROM public.chest_operations WHERE traveler_id = p_traveler_id AND operation_key = operation_key_value;
    RETURN prior_result || jsonb_build_object('duplicate', true);
  END IF;
  resulting_coins := public.spend_coins(p_traveler_id, price_value);
  INSERT INTO public.traveler_chests(traveler_id, chest_type, quantity, sources)
  VALUES (p_traveler_id, p_chest_type, 1, jsonb_build_array('shop'))
  ON CONFLICT (traveler_id, chest_type) DO UPDATE
  SET quantity = public.traveler_chests.quantity + 1,
      sources = public.traveler_chests.sources || jsonb_build_array('shop'),
      updated_at = now();
  prior_result := jsonb_build_object('chestType', p_chest_type, 'quantityAdded', 1, 'coins', resulting_coins, 'pricePaid', price_value, 'duplicate', false);
  UPDATE public.chest_operations SET rewards = prior_result WHERE traveler_id = p_traveler_id AND operation_key = operation_key_value;
  RETURN prior_result;
END $$;--> statement-breakpoint

CREATE FUNCTION public.open_chest(p_traveler_id uuid, p_chest_type text, p_operation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  operation_key_value text := 'open:' || p_operation_id::text;
  chest_row public.traveler_chests%ROWTYPE;
  reward_coins integer;
  reward_item_id text;
  reward_item_name text;
  roll_value double precision;
  origin_value text;
  remaining integer;
  result_value jsonb;
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  SELECT rewards INTO result_value FROM public.chest_operations WHERE traveler_id = p_traveler_id AND operation_key = operation_key_value;
  IF FOUND THEN RETURN result_value || jsonb_build_object('duplicate', true); END IF;
  SELECT * INTO chest_row FROM public.traveler_chests WHERE traveler_id = p_traveler_id AND chest_type = p_chest_type AND quantity > 0 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chest unavailable' USING ERRCODE = 'P0002'; END IF;
  origin_value := coalesce(chest_row.sources->>0, 'unknown');
  roll_value := random();
  IF p_chest_type = 'common' THEN
    IF roll_value < .80 THEN reward_coins := 25; ELSE reward_coins := 10; reward_item_id := 'traveler-sword-common'; reward_item_name := 'Espada do Caminho'; END IF;
  ELSIF p_chest_type = 'uncommon' THEN
    IF roll_value < .70 THEN reward_coins := 55; ELSE reward_coins := 20; reward_item_id := 'traveler-armor-uncommon'; reward_item_name := 'Couraça do Viajante'; END IF;
  ELSIF p_chest_type = 'rare' THEN
    IF roll_value < .65 THEN reward_coins := 105; ELSE reward_coins := 35; reward_item_id := 'traveler-shield-rare'; reward_item_name := 'Escudo da Perseverança'; END IF;
  ELSIF p_chest_type = 'epic' THEN
    IF roll_value < .55 THEN reward_coins := 190; ELSE reward_coins := 70; reward_item_id := 'traveler-helmet-rare'; reward_item_name := 'Elmo do Viajante'; END IF;
  ELSIF p_chest_type = 'extraordinary' THEN
    IF roll_value < .50 THEN reward_coins := 360; ELSE reward_coins := 120; reward_item_id := 'wisdom-amulet'; reward_item_name := 'Medalhão do Caminho'; END IF;
  ELSE RAISE EXCEPTION 'Invalid chest type' USING ERRCODE = '22023';
  END IF;
  remaining := chest_row.quantity - 1;
  IF remaining = 0 THEN
    DELETE FROM public.traveler_chests WHERE traveler_id = p_traveler_id AND chest_type = p_chest_type;
  ELSE
    UPDATE public.traveler_chests SET quantity = remaining, sources = sources - 0 WHERE traveler_id = p_traveler_id AND chest_type = p_chest_type;
  END IF;
  PERFORM public.add_coins(p_traveler_id, reward_coins);
  IF reward_item_id IS NOT NULL THEN
    INSERT INTO public.inventory(traveler_id, item_id, quantity, metadata)
    VALUES (p_traveler_id, reward_item_id, 1, jsonb_build_object('source', 'chest', 'chestType', p_chest_type))
    ON CONFLICT (traveler_id, item_id) DO UPDATE SET quantity = public.inventory.quantity + 1;
  END IF;
  result_value := jsonb_build_object('chestType', p_chest_type, 'coins', reward_coins, 'itemId', reward_item_id, 'itemName', reward_item_name, 'source', origin_value, 'remainingQuantity', remaining, 'duplicate', false);
  INSERT INTO public.chest_operations(traveler_id, operation_key, operation_type, chest_type, source, rewards)
  VALUES (p_traveler_id, operation_key_value, 'open', p_chest_type, origin_value, result_value);
  RETURN result_value;
END $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.apply_guild_mission_reward(p_mission_id uuid, p_traveler_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE tier text; xp_value integer; coin_value integer; previous_xp integer; next_xp integer; level_bonus integer := 0; chest_type_value text;
BEGIN
  SELECT reward_tier INTO tier FROM public.guild_missions WHERE id = p_mission_id;
  xp_value := CASE tier WHEN 'normal' THEN 80 WHEN 'great' THEN 240 WHEN 'epic' THEN 480 WHEN 'extraordinary' THEN 720 ELSE NULL END;
  coin_value := CASE tier WHEN 'normal' THEN 25 WHEN 'great' THEN 100 WHEN 'epic' THEN 220 WHEN 'extraordinary' THEN 360 ELSE NULL END;
  chest_type_value := CASE tier WHEN 'normal' THEN 'common' WHEN 'great' THEN 'uncommon' WHEN 'epic' THEN 'rare' WHEN 'extraordinary' THEN 'extraordinary' ELSE NULL END;
  IF xp_value IS NULL THEN RAISE EXCEPTION 'Invalid reward tier' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.guild_reward_claims(mission_id, traveler_id, reward_tier, xp_awarded, coins_awarded) VALUES (p_mission_id, p_traveler_id, tier, xp_value, coin_value) ON CONFLICT (mission_id, traveler_id) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT xp INTO previous_xp FROM public.travelers WHERE id = p_traveler_id FOR UPDATE;
  next_xp := previous_xp + xp_value;
  IF previous_xp < 200 AND next_xp >= 200 THEN level_bonus := 10; END IF;
  UPDATE public.travelers SET xp = next_xp, level = LEAST(50, GREATEST(1, floor((1 + sqrt(1 + next_xp::numeric / 25)) / 2)::integer)) WHERE id = p_traveler_id;
  UPDATE public.wallets SET coins = coins + coin_value + level_bonus WHERE traveler_id = p_traveler_id;
  PERFORM public.grant_traveler_chest(p_traveler_id, chest_type_value, 'guild_mission', 'guild_mission:' || p_mission_id::text || ':' || p_traveler_id::text);
  RETURN true;
END $$;--> statement-breakpoint

REVOKE ALL ON TABLE public.traveler_chests, public.chest_operations FROM PUBLIC, anon;--> statement-breakpoint
GRANT SELECT ON TABLE public.traveler_chests, public.chest_operations TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.grant_traveler_chest(uuid,text,text,text) FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.claim_chest_reward(uuid,text), public.purchase_chest(uuid,text,uuid), public.open_chest(uuid,text,uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.claim_chest_reward(uuid,text), public.purchase_chest(uuid,text,uuid), public.open_chest(uuid,text,uuid) TO authenticated;
