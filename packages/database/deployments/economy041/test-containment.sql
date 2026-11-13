DO $$BEGIN IF current_setting('economy041.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' THEN RAISE EXCEPTION 'Reviewed containment target required' USING ERRCODE='42501';END IF;END $$;
UPDATE shop_private.policy_041 SET enabled=false WHERE singleton; -- Preserve all receipts, possessions, balances and historical authorities.
