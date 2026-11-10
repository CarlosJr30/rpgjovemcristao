-- TEST ONLY. Restore the six canonical slot/id pairs at the released wrapper.
-- Possession, account-bound receipt, active avatar, session and battle guards remain.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('equipment013.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
    OR public.release_scope()<>'hero-equipment-006'
    OR public.economy_protocol_version()<>3
    OR NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled)
 THEN RAISE EXCEPTION 'Reviewed TEST equipment fix scope required' USING ERRCODE='42501'; END IF;
END $$;
DO $$ DECLARE p regprocedure; BEGIN
 p:=to_regprocedure('shop_private.equip(uuid,text,text,text)');
 IF p IS NULL
    OR md5(replace(pg_get_functiondef(p),E'\r\n',E'\n'))<>'c7512be2cccaf6d4d9438c76bd8bbff2'
    OR (SELECT proacl::text FROM pg_proc WHERE oid=p)<>'{postgres=X/postgres,authenticated=X/postgres}'
    OR md5(replace(pg_get_functiondef('shop_private.owned_equipment(uuid,text,text,text)'::regprocedure),E'\r\n',E'\n')) NOT IN ('e96f80c4050bf43f1634c2456523d1bd','3a43a9559d5ec4e82a1fad41f6b3ed89')
    OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.owned_equipment(uuid,text,text,text)'::regprocedure)<>'{postgres=X/postgres}'
    OR (SELECT proacl::text FROM pg_proc WHERE oid='public.equip_shop_item(uuid,text,text,text)'::regprocedure)<>'{postgres=X/postgres,authenticated=X/postgres}'
 THEN RAISE EXCEPTION 'Reviewed equipment function definitions and ACLs required' USING ERRCODE='42501'; END IF;
 IF has_function_privilege('anon','public.equip_shop_item(uuid,text,text,text)','EXECUTE')
    OR has_function_privilege('service_role','public.equip_shop_item(uuid,text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'Equipment wrapper must remain authenticated-only' USING ERRCODE='42501'; END IF;
END $$;

CREATE OR REPLACE FUNCTION shop_private.equip(p_actor uuid,p_slot text,p_item text,p_expected text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);
 who:=shop_private.actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled)
    OR p_slot IS NULL OR p_slot NOT IN('helmet','armor','weapon','shield','boots','amulet')
 THEN RAISE EXCEPTION 'Reviewed equipment required' USING ERRCODE='42501'; END IF;
 IF p_item IS NOT NULL THEN
  IF p_item NOT IN(
   'traveler-boots','traveler-helmet-rare','wisdom-amulet','traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare',
   'equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade',
   'equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor',
   'equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield',
   'equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet',
   'equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots',
   'equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion'
  ) THEN
   RAISE EXCEPTION 'Reviewed equipment required' USING ERRCODE='42501';
  END IF;
  -- Starter boots are installed by create_traveler. Two older journey rewards
  -- are recorded by journey_rewards plus inventory.metadata, not chest_operations.
  -- All other acquired items require the existing account/traveler-bound receipt.
  IF p_item<>'traveler-boots' AND NOT EXISTS(
   SELECT 1 FROM public.chest_operations
   WHERE account_id=who AND traveler_id=p_actor AND rewards->>'itemId'=p_item
    AND((operation_type='open' AND source LIKE 'community001c:%')
     OR(operation_type IN('open','equipment-purchase') AND source LIKE 'shop001c:%'
       AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
  ) AND NOT (
   p_item IN('wisdom-amulet','traveler-helmet-rare') AND EXISTS(
    SELECT 1 FROM economy_private.journey_rewards j
    JOIN public.inventory i ON i.traveler_id=j.traveler_id
    WHERE j.traveler_id=p_actor
     AND j.reward_key=CASE p_item WHEN 'wisdom-amulet' THEN 'phase:garden-choice' ELSE 'garden-equipment' END
     AND i.item_id=p_item AND i.quantity>0 AND i.card_receipt_id IS NULL
     AND i.metadata->>'source'=j.reward_key
   )
  ) THEN RAISE EXCEPTION 'Verified acquisition receipt required' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN shop_private.owned_equipment(p_actor,p_slot,p_item,p_expected);
END $$;
