CREATE OR REPLACE FUNCTION shop_private.state(p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$DECLARE who uuid;reason text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF public.release_scope()<>'guild-ebd-001' OR NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN reason:='disabled';
 ELSIF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL) THEN reason:='legacy-reconciliation-required';
 ELSIF EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN reason:='qa-source';
 ELSIF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) THEN reason:='suspended';
 ELSIF NOT shop_private.balance_valid(p_actor) THEN reason:='balance-inconsistent';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'enabled',reason IS NULL,'reason',reason,'coins',(SELECT coins FROM public.wallets WHERE traveler_id=p_actor),'balanceVerified',reason IS NULL,'catalogVersion','ECONOMY-001C:shop:v1','offers',jsonb_build_array(
 jsonb_build_object('kind','chest','id','common','price',40),jsonb_build_object('kind','equipment','id','traveler-sword-common','price',35),jsonb_build_object('kind','equipment','id','traveler-armor-uncommon','price',65),jsonb_build_object('kind','equipment','id','traveler-shield-rare','price',115)));
END $function$
