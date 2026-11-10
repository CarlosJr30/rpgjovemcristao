-- PROD ONLY. Revert only the equip wrapper body; no player data or grants change.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('equipment013.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
    OR public.release_scope()<>'guild-ebd-001'
    OR md5(replace(pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure),E'\r\n',E'\n'))<>'7d3105f47498a58b20d12e2f591453c7'
    OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.equip(uuid,text,text,text)'::regprocedure)<>'{postgres=X/postgres,authenticated=X/postgres}'
 THEN RAISE EXCEPTION 'Reviewed PROD recovery target required' USING ERRCODE='42501'; END IF;
END $$;

CREATE OR REPLACE FUNCTION shop_private.equip(p_actor uuid,p_slot text,p_item text,p_expected text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) OR p_slot IS NULL OR p_slot NOT IN('weapon','armor','shield','helmet','boots','amulet') OR (p_item IS NOT NULL AND p_item NOT IN ('traveler-boots','traveler-helmet-rare','wisdom-amulet','traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare','equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade','equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor','equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield','equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet','equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots','equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion')) THEN RAISE EXCEPTION 'Reviewed equipment required' USING ERRCODE='42501'; END IF;
 IF p_item IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE account_id=who AND traveler_id=p_actor AND rewards->>'itemId'=p_item AND ((operation_type='open' AND source LIKE 'community001c:%') OR (operation_type IN('open','equipment-purchase') AND source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))) THEN RAISE EXCEPTION 'Verified acquisition receipt required' USING ERRCODE='42501'; END IF;
 RETURN shop_private.owned_equipment(p_actor,p_slot,p_item,p_expected);
END $$;

DO $$ BEGIN
 IF md5(replace(pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure),E'\r\n',E'\n'))<>'c7512be2cccaf6d4d9438c76bd8bbff2'
    OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.equip(uuid,text,text,text)'::regprocedure)<>'{postgres=X/postgres,authenticated=X/postgres}'
 THEN RAISE EXCEPTION 'PROD wrapper recovery verification failed' USING ERRCODE='42501'; END IF;
END $$;
NOTIFY pgrst,'reload schema';
