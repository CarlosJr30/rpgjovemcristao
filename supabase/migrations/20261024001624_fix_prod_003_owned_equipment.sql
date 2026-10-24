-- FIX-PROD-002 candidate, NOT applied to any hosted database.
-- Requires the production protocol-3 baseline. No grants, XP, reconciliation or
-- inventory quantities are changed. Legacy combat remains denied by authority v3.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN
 IF public.economy_protocol_version() IS DISTINCT FROM 3 THEN
  RAISE EXCEPTION 'Protocol 3 required';
 END IF;
END $$;

CREATE FUNCTION economy_private.set_owned_equipment(
 p_traveler_id uuid, p_slot text, p_item_id text, p_expected_item_id text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor uuid := auth.uid(); previous_item text; expected_slot text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 -- Same lock order as combat: account -> Traveler -> inventory/equipment.
 PERFORM 1 FROM auth.users WHERE id=actor AND NOT coalesce(is_anonymous,false) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account denied' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.travelers WHERE id=p_traveler_id AND user_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ownership denied' USING ERRCODE='42501'; END IF;
 IF p_slot IS NULL OR p_slot NOT IN ('helmet','armor','weapon','shield','boots','amulet') THEN
  RAISE EXCEPTION 'Invalid slot' USING ERRCODE='22023';
 END IF;
 -- Frozen mapping of the six existing EQUIPMENT_CATALOG entries. Client item
 -- metadata, bonuses, role, level and quantity are never accepted as authority.
 IF p_item_id IS NOT NULL THEN
  expected_slot := CASE p_item_id
   WHEN 'traveler-boots' THEN 'boots'
   WHEN 'traveler-helmet-rare' THEN 'helmet'
   WHEN 'wisdom-amulet' THEN 'amulet'
   WHEN 'traveler-sword-common' THEN 'weapon'
   WHEN 'traveler-armor-uncommon' THEN 'armor'
   WHEN 'traveler-shield-rare' THEN 'shield' END;
  IF expected_slot IS DISTINCT FROM p_slot THEN
   RAISE EXCEPTION 'Equipment denied' USING ERRCODE='42501';
  END IF;
  PERFORM 1 FROM public.inventory WHERE traveler_id=p_traveler_id
   AND item_id=p_item_id AND quantity>0 AND card_receipt_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item ownership denied' USING ERRCODE='42501'; END IF;
 END IF;
 SELECT item_id INTO previous_item FROM public.equipped_items
  WHERE traveler_id=p_traveler_id AND slot=p_slot;
 -- Safe replay after a lost response. It cannot create or consume an item.
 IF previous_item IS NOT DISTINCT FROM p_item_id THEN
  RETURN coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.equipped_items
   WHERE traveler_id=p_traveler_id),'{}'::jsonb);
 END IF;
 IF previous_item IS DISTINCT FROM p_expected_item_id THEN
  RAISE EXCEPTION 'Equipment changed; reload' USING ERRCODE='40001';
 END IF;
 IF EXISTS(SELECT 1 FROM economy_private.battles WHERE traveler_id=p_traveler_id
  AND mode IN ('arena-v3','tower-v3') AND settled_at IS NULL) THEN
  RAISE EXCEPTION 'Battle in progress' USING ERRCODE='40001';
 END IF;
 IF p_item_id IS NULL THEN
  DELETE FROM public.equipped_items WHERE traveler_id=p_traveler_id AND slot=p_slot;
 ELSE
  INSERT INTO public.equipped_items(traveler_id,slot,item_id)
   VALUES(p_traveler_id,p_slot,p_item_id)
   ON CONFLICT(traveler_id,slot) DO UPDATE
    SET item_id=excluded.item_id,equipped_at=now();
 END IF;
 RETURN coalesce((SELECT jsonb_object_agg(slot,item_id) FROM public.equipped_items
  WHERE traveler_id=p_traveler_id),'{}'::jsonb);
END $$;
REVOKE ALL ON FUNCTION economy_private.set_owned_equipment(uuid,text,text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_private.set_owned_equipment(uuid,text,text,text) TO authenticated;

CREATE FUNCTION public.set_owned_equipment(
 p_traveler_id uuid, p_slot text, p_item_id text, p_expected_item_id text
) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
 SELECT economy_private.set_owned_equipment(p_traveler_id,p_slot,p_item_id,p_expected_item_id);
$$;
REVOKE ALL ON FUNCTION public.set_owned_equipment(uuid,text,text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.set_owned_equipment(uuid,text,text,text) TO authenticated;
