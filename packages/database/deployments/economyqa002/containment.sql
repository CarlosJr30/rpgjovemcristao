DO $$BEGIN
 IF current_setting('economyqa002.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001'
 THEN RAISE EXCEPTION 'PROD containment required' USING ERRCODE='42501'; END IF;
END $$;
UPDATE economy_qa_private.profiles SET enabled=false;
REVOKE EXECUTE ON FUNCTION public.command_training_qa(uuid,text,jsonb,uuid),economy_qa_private.command(uuid,text,jsonb,uuid) FROM authenticated;
NOTIFY pgrst,'reload schema';
