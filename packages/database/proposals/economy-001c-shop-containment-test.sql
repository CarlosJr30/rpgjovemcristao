DO $$BEGIN IF current_setting('shop001c.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' THEN RAISE EXCEPTION 'TEST required' USING ERRCODE='42501';END IF;END $$;
REVOKE EXECUTE ON FUNCTION public.purchase_qa_shop(uuid,text,text,uuid),public.open_qa_shop_chest(uuid,uuid),public.equip_qa_shop(uuid,text,text,text),shop_qa_private.purchase(uuid,text,text,uuid),shop_qa_private.open(uuid,uuid),shop_qa_private.equip(uuid,text,text,text) FROM authenticated;
-- Keep state/read access and all budgets, receipts, inventory and equipped items.
NOTIFY pgrst,'reload schema';
