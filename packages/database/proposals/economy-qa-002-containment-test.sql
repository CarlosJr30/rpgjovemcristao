DO $$BEGIN
 IF current_setting('economyqa002.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006'
 THEN RAISE EXCEPTION 'TEST containment required' USING ERRCODE='42501'; END IF;
END $$;
UPDATE economy_qa_private.profiles SET enabled=false;
REVOKE EXECUTE ON FUNCTION public.command_training_qa(uuid,text,jsonb,uuid),economy_qa_private.command(uuid,text,jsonb,uuid) FROM authenticated;
NOTIFY pgrst,'reload schema';
