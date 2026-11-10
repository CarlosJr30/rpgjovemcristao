SET LOCAL equipment014.target_project='wspafhlbtlpabypzymjo';
-- Equipment eligibility read only. No provenance recognition or player writes.
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('equipment014.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
 OR public.release_scope()<>'guild-ebd-001' OR public.economy_protocol_version()<>3
 OR md5(replace(pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure),E'\r\n',E'\n'))<>'7d3105f47498a58b20d12e2f591453c7'
 OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.equip(uuid,text,text,text)'::regprocedure)<>'{postgres=X/postgres,authenticated=X/postgres}'
 OR md5(replace(pg_get_functiondef('shop_private.owned_equipment(uuid,text,text,text)'::regprocedure),E'\r\n',E'\n')) NOT IN('e96f80c4050bf43f1634c2456523d1bd','3a43a9559d5ec4e82a1fad41f6b3ed89')
 OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.owned_equipment(uuid,text,text,text)'::regprocedure)<>'{postgres=X/postgres}'
 OR to_regprocedure('public.get_equipment_access(uuid)') IS NOT NULL
 THEN RAISE EXCEPTION 'Reviewed equipment014 environment required' USING ERRCODE='42501'; END IF;
END $$;
CREATE FUNCTION shop_private.equipment_origin_014(p_owner uuid,p_actor uuid,p_item text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF p_item IS NULL OR p_item NOT IN(
   'traveler-boots','traveler-helmet-rare','wisdom-amulet','traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare',
   'equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade',
   'equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor',
   'equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield',
   'equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet',
   'equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots',
   'equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion'
 ) THEN RETURN 'catalog-unavailable'; END IF;
 IF p_item<>'traveler-boots' AND NOT EXISTS(
   SELECT 1 FROM public.chest_operations
   WHERE account_id=p_owner AND traveler_id=p_actor AND rewards->>'itemId'=p_item
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
  ) THEN RETURN 'acquisition-unconfirmed'; END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION shop_private.equipment_origin_014(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION shop_private.equip(p_actor uuid,p_slot text,p_item text,p_expected text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid; reason text;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);
 who:=shop_private.actor(p_actor);
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN RAISE EXCEPTION 'Equipment policy disabled' USING ERRCODE='42501'; END IF;
 IF p_slot IS NULL OR p_slot NOT IN('helmet','armor','weapon','shield','boots','amulet') THEN RAISE EXCEPTION 'Equipment slot denied' USING ERRCODE='42501'; END IF;
 IF p_item IS NOT NULL THEN
  reason:=shop_private.equipment_origin_014(who,p_actor,p_item);
  IF reason='catalog-unavailable' THEN RAISE EXCEPTION 'Reviewed equipment required' USING ERRCODE='42501'; END IF;
  IF reason IS NOT NULL THEN RAISE EXCEPTION 'Verified acquisition receipt required' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN shop_private.owned_equipment(p_actor,p_slot,p_item,p_expected);
END $$;

CREATE FUNCTION shop_private.equipment_access_014(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid; blocked text; BEGIN
 who:=economy_private.community_xp_actor(p_actor);
 IF public.release_scope()<>'guild-ebd-001' THEN RAISE EXCEPTION 'Release scope denied' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL)
 OR EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN blocked:='economy-unverified';
 ELSIF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN blocked:='equipment-disabled';
 ELSIF EXISTS(SELECT 1 FROM economy_private.battles WHERE traveler_id=p_actor AND mode IN('arena-v3','tower-v3') AND settled_at IS NULL) THEN blocked:='battle-in-progress'; END IF;
 RETURN jsonb_build_object('version',1,'actor',p_actor,'items',(
 SELECT coalesce(jsonb_agg(jsonb_build_object('itemId',i.item_id,'sourceConfirmed',s.reason IS NULL,'reason',coalesce(blocked,s.reason)) ORDER BY i.item_id),'[]'::jsonb)
 FROM public.inventory i CROSS JOIN LATERAL(SELECT shop_private.equipment_origin_014(who,p_actor,i.item_id) reason) s
 WHERE i.traveler_id=p_actor AND i.quantity>0 AND i.card_receipt_id IS NULL
  AND i.item_id NOT LIKE 'arena-card-%'));
END $$;
REVOKE ALL ON FUNCTION shop_private.equipment_access_014(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION shop_private.equipment_access_014(uuid) TO authenticated;
CREATE FUNCTION public.get_equipment_access(p_actor uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT shop_private.equipment_access_014(p_actor)
$$;
REVOKE ALL ON FUNCTION public.get_equipment_access(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_equipment_access(uuid) TO authenticated;
