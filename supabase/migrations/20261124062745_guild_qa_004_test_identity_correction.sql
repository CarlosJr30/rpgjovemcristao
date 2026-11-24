SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';

-- Repair only the TEST allowlist identity. The PROD UUID is deliberately not used here.
DO $guard$ BEGIN
 IF (current_setting('guild_public_001.target_project',true) IS NOT NULL
     AND current_setting('guild_public_001.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg')
 OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR public.economy_protocol_version() IS DISTINCT FROM 3
 OR to_regclass('guild_admin_private.guild_creation_qa_permissions') IS NULL
 THEN RAISE EXCEPTION 'Reviewed GUILD-QA-004 TEST scope required' USING ERRCODE='42501'; END IF;

 IF NOT EXISTS (
   SELECT 1 FROM auth.users
   WHERE id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid
     AND lower(email)=lower('carlosrf1302@hotmail.com')
     AND email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Exact confirmed TEST Auth identity required' USING ERRCODE='42501'; END IF;

 IF EXISTS (SELECT 1 FROM auth.users WHERE id='78729453-8e04-478c-96ae-d37cead1bc8c'::uuid)
 THEN RAISE EXCEPTION 'PROD Auth UUID must not be used in TEST' USING ERRCODE='42501'; END IF;

 IF NOT EXISTS (
   SELECT 1 FROM pg_class
   WHERE oid='guild_admin_private.guild_creation_qa_permissions'::regclass
     AND relrowsecurity
 ) THEN RAISE EXCEPTION 'QA permission table must keep RLS enabled' USING ERRCODE='42501'; END IF;

 IF has_table_privilege('anon','guild_admin_private.guild_creation_qa_permissions','select')
 OR has_table_privilege('anon','guild_admin_private.guild_creation_qa_permissions','insert')
 OR has_table_privilege('authenticated','guild_admin_private.guild_creation_qa_permissions','select')
 OR has_table_privilege('authenticated','guild_admin_private.guild_creation_qa_permissions','insert')
 OR has_table_privilege('service_role','guild_admin_private.guild_creation_qa_permissions','select')
 OR has_table_privilege('service_role','guild_admin_private.guild_creation_qa_permissions','insert')
 THEN RAISE EXCEPTION 'QA permission table must not expose client or service grants' USING ERRCODE='42501'; END IF;
END $guard$;

INSERT INTO guild_admin_private.guild_creation_qa_permissions(account_id,permission_key,grant_source)
VALUES ('575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid,'multiple_guild_creation','GUILD-QA-001')
ON CONFLICT(account_id) DO NOTHING;

DO $verify$ BEGIN
 IF (SELECT count(*) FROM guild_admin_private.guild_creation_qa_permissions WHERE revoked_at IS NULL) <> 1
 OR NOT EXISTS (
   SELECT 1 FROM guild_admin_private.guild_creation_qa_permissions
   WHERE account_id='575d92d9-2e5b-4fdc-8e02-3a4a096285a9'::uuid
     AND permission_key='multiple_guild_creation'
     AND grant_source='GUILD-QA-001'
     AND revoked_at IS NULL
 ) THEN RAISE EXCEPTION 'TEST QA permission must target only the approved Auth UUID' USING ERRCODE='42501'; END IF;
END $verify$;

