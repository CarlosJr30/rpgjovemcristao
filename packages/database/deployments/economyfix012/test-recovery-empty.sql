DO $$ BEGIN IF current_setting('economyfix012.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' THEN RAISE EXCEPTION 'Correct recovery target required' USING ERRCODE='42501';END IF;END $$;
DO $$BEGIN IF EXISTS(SELECT 1 FROM public.chest_operations WHERE operation_type='economic-initialization') THEN RAISE EXCEPTION 'Issued initialization requires preserving containment' USING ERRCODE='42501';END IF;END $$;
CREATE OR REPLACE FUNCTION shop_private.state(p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$DECLARE who uuid;reason text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF public.release_scope()<>'hero-equipment-006' OR NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN reason:='disabled';
 ELSIF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL) THEN reason:='legacy-reconciliation-required';
 ELSIF EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN reason:='qa-source';
 ELSIF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) THEN reason:='suspended';
 ELSIF NOT shop_private.balance_valid(p_actor) THEN reason:='balance-inconsistent';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'enabled',reason IS NULL,'reason',reason,'coins',(SELECT coins FROM public.wallets WHERE traveler_id=p_actor),'balanceVerified',reason IS NULL,'catalogVersion','ECONOMY-001C:shop:v1','offers',jsonb_build_array(
 jsonb_build_object('kind','chest','id','common','price',40),jsonb_build_object('kind','equipment','id','traveler-sword-common','price',35),jsonb_build_object('kind','equipment','id','traveler-armor-uncommon','price',65),jsonb_build_object('kind','equipment','id','traveler-shield-rare','price',115)));
END $function$
;
DROP TRIGGER protect_initialization_012 ON public.chest_operations;
DROP FUNCTION public.initialize_shop_economy(uuid),shop_private.initialize_012(uuid),shop_private.protect_initialization_012(),shop_private.pristine_012(uuid);
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK ((((operation_type = ANY (ARRAY['grant'::text, 'purchase'::text, 'open'::text])) AND (chest_type IS NOT NULL)) OR ((operation_type = ANY (ARRAY['card-starter'::text, 'card-revocation'::text, 'arena-result'::text, 'tower-result'::text, 'community-xp'::text])) AND (chest_type IS NULL)) OR ((operation_type = 'equipment-purchase'::text) AND (chest_type IS NULL) AND (source = 'shop001c:equipment'::text) AND (account_id IS NOT NULL) AND (price_paid IS NOT NULL) AND ((rewards ->> 'catalogVersion'::text) = 'ECONOMY-001C:shop:v1'::text) AND (rewards ? 'itemId'::text)) OR ((operation_type = 'equipment-purchase'::text) AND (chest_type IS NULL) AND (source = 'qa-shop001c'::text) AND (account_id IS NOT NULL) AND (price_paid IS NOT NULL) AND ((rewards ->> 'catalogVersion'::text) = 'QA-SHOP-001C:v1'::text) AND (rewards ? 'itemId'::text)) OR ((operation_type = 'administrative-reconciliation'::text) AND (chest_type IS NULL) AND (account_id IS NOT NULL) AND (price_paid IS NULL) AND (source = 'legacy-admin-010'::text) AND ((rewards ->> 'contract'::text) = 'RPG-ECONOMY-FIX-010:v1'::text))));
