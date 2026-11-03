DO $$BEGIN IF current_setting('shop001c.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' OR EXISTS(SELECT 1 FROM shop_qa_private.profiles) OR EXISTS(SELECT 1 FROM shop_qa_private.budget_receipts) OR EXISTS(SELECT 1 FROM public.chest_operations WHERE source LIKE 'qa-shop001c%') THEN RAISE EXCEPTION 'Issued QA data must be preserved; use containment' USING ERRCODE='42501';END IF;END $$;
DROP FUNCTION public.get_qa_shop(uuid),public.purchase_qa_shop(uuid,text,text,uuid),public.open_qa_shop_chest(uuid,uuid),public.equip_qa_shop(uuid,text,text,text);
DROP TRIGGER qa_shop_credit_isolation ON public.chest_operations;
DROP FUNCTION shop_qa_private.isolate_credit(),shop_qa_private.purchase(uuid,text,text,uuid),shop_qa_private.open(uuid,uuid),shop_qa_private.equip(uuid,text,text,text),shop_qa_private.state(uuid),shop_qa_private.balance_valid(uuid),shop_qa_private.actor(uuid),shop_qa_private.grant_budget(uuid,uuid,text,uuid);
DROP TABLE shop_qa_private.budget_receipts,shop_qa_private.profiles;
DROP SCHEMA shop_qa_private;
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK((operation_type IN('grant','purchase','open') AND chest_type IS NOT NULL) OR(operation_type IN('card-starter','card-revocation','arena-result','tower-result','community-xp') AND chest_type IS NULL));
NOTIFY pgrst,'reload schema';
