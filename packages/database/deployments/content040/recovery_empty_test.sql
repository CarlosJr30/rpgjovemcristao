-- Empty-state recovery only. Aborts if any player has a new card/equipment or receipt.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('content040.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006' OR public.economy_protocol_version()<>3 THEN RAISE EXCEPTION 'CONTENT-040 TEST recovery target mismatch' USING ERRCODE='42501'; END IF;
 IF (SELECT count(*) FROM economy_private.card_catalog WHERE version='arena-cards-2026-11-09.1-content-040a' AND approval_ref='CONTENT-040A:OWNER:2026-11-09' AND NOT starter AND revoked_at IS NULL)<>33 THEN RAISE EXCEPTION 'CONTENT-040 catalog differs from empty-state recovery package' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.inventory WHERE item_id IN ('equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade','equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor','equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield','equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet','equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots','equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion','arena-card-traveler-charge','arena-card-precise-cut','arena-card-brave-advance','arena-card-perseverance-blow','arena-card-double-charge','arena-card-guard-break','arena-card-decisive-blow','arena-card-guardian-cut','arena-card-last-resistance','arena-card-firm-block','arena-card-prudent-posture','arena-card-traveler-wall','arena-card-reinforced-guard','arena-card-strategic-defense','arena-card-safe-shelter','arena-card-courage-bastion','arena-card-persevering-fortress','arena-card-breathe-observe','arena-card-side-step','arena-card-opponent-reading','arena-card-careful-preparation','arena-card-reposition','arena-card-tactical-planning','arena-card-constant-watch','arena-card-master-strategy','arena-card-regather-strength','arena-card-renewed-courage','arena-card-prudent-recovery','arena-card-persevering-spirit','arena-card-second-wind','arena-card-heroic-endurance','arena-card-unwavering-resolve','arena-card-firm-until-end')) OR EXISTS(SELECT 1 FROM public.equipped_items WHERE item_id IN ('equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade','equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor','equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield','equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet','equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots','equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion')) OR EXISTS(SELECT 1 FROM public.chest_operations WHERE rewards->>'itemId' IN ('equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade','equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor','equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield','equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet','equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots','equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion','arena-card-traveler-charge','arena-card-precise-cut','arena-card-brave-advance','arena-card-perseverance-blow','arena-card-double-charge','arena-card-guard-break','arena-card-decisive-blow','arena-card-guardian-cut','arena-card-last-resistance','arena-card-firm-block','arena-card-prudent-posture','arena-card-traveler-wall','arena-card-reinforced-guard','arena-card-strategic-defense','arena-card-safe-shelter','arena-card-courage-bastion','arena-card-persevering-fortress','arena-card-breathe-observe','arena-card-side-step','arena-card-opponent-reading','arena-card-careful-preparation','arena-card-reposition','arena-card-tactical-planning','arena-card-constant-watch','arena-card-master-strategy','arena-card-regather-strength','arena-card-renewed-courage','arena-card-prudent-recovery','arena-card-persevering-spirit','arena-card-second-wind','arena-card-heroic-endurance','arena-card-unwavering-resolve','arena-card-firm-until-end')) THEN RAISE EXCEPTION 'CONTENT-040 recovery requires empty ownership and receipts' USING ERRCODE='42501'; END IF;
END $$;
DELETE FROM economy_private.card_catalog WHERE version='arena-cards-2026-11-09.1-content-040a' AND approval_ref='CONTENT-040A:OWNER:2026-11-09' AND NOT starter AND revoked_at IS NULL;
CREATE OR REPLACE FUNCTION shop_private.owned_equipment(p_traveler_id uuid, p_slot text, p_item_id text, p_expected_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  RAISE EXCEPTION 'Equipment changed; reload' USING ERRCODE='PT409';
 END IF;
 IF EXISTS(SELECT 1 FROM economy_private.battles WHERE traveler_id=p_traveler_id
  AND mode IN ('arena-v3','tower-v3') AND settled_at IS NULL) THEN
  RAISE EXCEPTION 'Battle in progress' USING ERRCODE='PT409';
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
END $function$;
CREATE FUNCTION shop_private.equip(p_actor uuid,p_slot text,p_item text,p_expected text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE who uuid;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) OR p_slot IS NULL OR p_slot NOT IN('weapon','armor','shield','helmet') OR(p_item IS NOT NULL AND p_item NOT IN('traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare','traveler-helmet-rare')) THEN RAISE EXCEPTION 'Reviewed equipment required' USING ERRCODE='42501';END IF;
 IF p_item IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE account_id=who AND traveler_id=p_actor AND rewards->>'itemId'=p_item AND((operation_type='open' AND source LIKE 'community001c:%') OR(operation_type IN('open','equipment-purchase') AND source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))) THEN RAISE EXCEPTION 'Verified acquisition receipt required' USING ERRCODE='42501';END IF;
 RETURN shop_private.owned_equipment(p_actor,p_slot,p_item,p_expected);END $$;
NOTIFY pgrst,'reload schema';
