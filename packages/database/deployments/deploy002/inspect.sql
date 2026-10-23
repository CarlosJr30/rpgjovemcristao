-- Metadata/counts only. Do not select role passwords, JWT settings or user rows.
SELECT jsonb_build_object(
 'database',current_database(),'role',current_user,'version',version(),
 'authUserCount',(SELECT count(*) FROM auth.users),
 'storageObjectCount',(SELECT count(*) FROM storage.objects),
 'foreignServers',(SELECT count(*) FROM pg_foreign_server),
 'subscriptions',(SELECT count(*) FROM pg_subscription),
 'drizzleJournalExists',to_regclass('drizzle.__drizzle_migrations') IS NOT NULL,
 'supabaseJournalExists',to_regclass('supabase_migrations.schema_migrations') IS NOT NULL,
 'anonPublicUsage',has_schema_privilege('anon','public','USAGE'),
 'authenticatedPublicUsage',has_schema_privilege('authenticated','public','USAGE'),
 'schemas',(SELECT jsonb_agg(jsonb_build_object('name',nspname,'owner',pg_get_userbyid(nspowner),'acl',nspacl::text) ORDER BY nspname)
   FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema'),
 'roles',(SELECT jsonb_agg(jsonb_build_object('name',rolname,'superuser',rolsuper,'bypassrls',rolbypassrls,'canlogin',rolcanlogin) ORDER BY rolname)
   FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','authenticator','postgres','supabase_admin')),
 'defaults',(SELECT jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(defaclrole),'schema',coalesce(n.nspname,'*'),'type',defaclobjtype,'acl',defaclacl::text))
   FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE n.nspname='public' OR d.defaclnamespace=0),
 'tables',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'acl',c.relacl::text,'owner',pg_get_userbyid(c.relowner)) ORDER BY n.nspname,c.relname)
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p')
    AND n.nspname IN ('public','guild_chat_private','guild_invite_private','story_private','guild_ops','ebd_ops','economy_private')),
 'columns',(SELECT jsonb_agg(jsonb_build_object('table',c.relname,'name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'acl',a.attacl::text) ORDER BY c.relname,a.attnum)
   FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped),
 'functions',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text,'owner',pg_get_userbyid(p.proowner),'definitionSha256',encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')) ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.prokind='f'
    AND n.nspname IN ('public','guild_chat_private','guild_invite_private','story_private','guild_ops','ebd_ops','economy_private')),
 'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.schemaname,p.tablename,p.policyname) FROM pg_policies p
   WHERE p.schemaname IN ('public','guild_chat_private','guild_invite_private','story_private','guild_ops','ebd_ops','economy_private')),
 'exposedSchemasSetting',(SELECT jsonb_agg(v) FROM pg_db_role_setting s CROSS JOIN LATERAL unnest(s.setconfig) v WHERE v LIKE 'pgrst.db_schemas=%'),
 'extensions',(SELECT jsonb_agg(jsonb_build_object('name',extname,'version',extversion,'schema',n.nspname) ORDER BY extname) FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace),
 'publications',(SELECT jsonb_agg(jsonb_build_object('name',pubname,'allTables',puballtables)) FROM pg_publication)
) AS snapshot;
