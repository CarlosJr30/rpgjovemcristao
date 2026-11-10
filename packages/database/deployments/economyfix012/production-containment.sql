DO $$ BEGIN IF current_setting('economyfix012.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001' THEN RAISE EXCEPTION 'Correct recovery target required' USING ERRCODE='42501';END IF;END $$;
REVOKE ALL ON FUNCTION public.initialize_shop_economy(uuid),shop_private.initialize_012(uuid) FROM PUBLIC,anon,authenticated,service_role;
-- Existing verified avatars, audits, marker and balances remain intact.
