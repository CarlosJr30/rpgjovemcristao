DO $$BEGIN
 IF current_setting('economyqa002.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001'
 OR EXISTS(SELECT 1 FROM economy_qa_private.profiles) OR EXISTS(SELECT 1 FROM economy_qa_private.receipts)
 THEN RAISE EXCEPTION 'Empty PROD training recovery required' USING ERRCODE='42501'; END IF;
END $$;
DROP FUNCTION public.get_training_qa(uuid),public.get_training_qa_receipt(uuid,uuid),public.command_training_qa(uuid,text,jsonb,uuid);
DROP SCHEMA economy_qa_private CASCADE;
NOTIFY pgrst,'reload schema';
