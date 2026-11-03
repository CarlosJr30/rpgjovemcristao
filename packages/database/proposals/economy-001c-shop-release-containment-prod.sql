DO $$BEGIN IF current_setting('shop001c.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001' THEN RAISE EXCEPTION 'Reviewed scope required' USING ERRCODE='42501';END IF;END $$;
REVOKE EXECUTE ON FUNCTION public.purchase_shop(uuid,text,text,uuid),public.open_shop_chest(uuid,text,uuid),public.equip_shop_item(uuid,text,text,text),shop_private.purchase(uuid,text,text,uuid),shop_private.open(uuid,text,uuid),shop_private.equip(uuid,text,text,text) FROM authenticated;
NOTIFY pgrst,'reload schema';
