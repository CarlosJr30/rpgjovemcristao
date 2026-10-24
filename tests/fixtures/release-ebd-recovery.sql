-- Read-only recovery material for the exact objects touched by RELEASE-EBD-001.
-- Run before the migration as the migration owner; contains no player row values.
WITH statements AS (
 SELECT 10 ord, pg_get_functiondef(p.oid)||';' sql
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE (n.nspname='economy_private' AND p.proname='create_traveler')
 OR (n.nspname='public' AND p.proname='guild_ebd_command')
 UNION ALL
 SELECT 20,format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role;',p.oid::regprocedure)
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','economy_private')
 UNION ALL
 SELECT 21,format('GRANT %s ON FUNCTION %s TO %s%s;',a.privilege_type,p.oid::regprocedure,
 CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(a.grantee)) END,
 CASE WHEN a.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END)
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
 WHERE n.nspname IN ('public','economy_private') AND (a.grantee=0 OR pg_get_userbyid(a.grantee) IN ('anon','authenticated','service_role'))
 UNION ALL
 SELECT 30,format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC,anon,authenticated,service_role;',n.nspname,c.relname)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','economy_private') AND c.relkind IN ('r','p','v','m','f')
 UNION ALL
 SELECT 31,format('REVOKE ALL (%s) ON TABLE %I.%I FROM PUBLIC,anon,authenticated,service_role;',string_agg(quote_ident(a.attname),',' ORDER BY a.attnum),n.nspname,c.relname)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
 WHERE n.nspname IN ('public','economy_private') AND c.relkind IN ('r','p','v','m','f') AND a.attnum>0 AND NOT a.attisdropped GROUP BY n.nspname,c.relname
 UNION ALL
 SELECT 32,format('GRANT %s ON TABLE %I.%I TO %s%s;',a.privilege_type,n.nspname,c.relname,
 CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(a.grantee)) END,CASE WHEN a.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
 WHERE n.nspname IN ('public','economy_private') AND c.relkind IN ('r','p','v','m','f') AND (a.grantee=0 OR pg_get_userbyid(a.grantee) IN ('anon','authenticated','service_role'))
 UNION ALL
 SELECT 33,format('GRANT %s (%I) ON TABLE %I.%I TO %s%s;',x.privilege_type,a.attname,n.nspname,c.relname,
 CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(x.grantee)) END,CASE WHEN x.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid CROSS JOIN LATERAL aclexplode(a.attacl) x
 WHERE n.nspname IN ('public','economy_private') AND c.relkind IN ('r','p','v','m','f') AND a.attnum>0 AND NOT a.attisdropped AND (x.grantee=0 OR pg_get_userbyid(x.grantee) IN ('anon','authenticated','service_role'))
 UNION ALL
 SELECT 40,'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;'
 UNION ALL
 SELECT 41,format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO %s%s;',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(a.grantee)) END,CASE WHEN a.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END)
 FROM pg_default_acl d JOIN pg_namespace n ON n.oid=d.defaclnamespace CROSS JOIN LATERAL aclexplode(d.defaclacl) a
 WHERE n.nspname='public' AND d.defaclobjtype='f' AND pg_get_userbyid(d.defaclrole)=current_user AND (a.grantee=0 OR pg_get_userbyid(a.grantee) IN ('anon','authenticated','service_role'))
)
SELECT 'BEGIN; SET LOCAL lock_timeout=''5s''; SET LOCAL statement_timeout=''60s'';'||chr(10)||
 'DROP TRIGGER release_ebd_no_reward ON public.guild_ebd_reward_pending;'||chr(10)||
 'DROP FUNCTION public.release_scope(); DROP FUNCTION release_ebd.no_new_rewards(); DROP SCHEMA release_ebd;'||chr(10)||
 string_agg(sql,chr(10) ORDER BY ord,sql)||chr(10)||'NOTIFY pgrst,''reload schema''; COMMIT;' AS recovery_sql FROM statements;
