-- Release only a complete, hardened protocol3 schema with no approved cards.
DO $release$
DECLARE tab text; col text;
BEGIN
 IF public.economy_protocol_version() <> 3 THEN RAISE EXCEPTION 'Protocol3 required'; END IF;
 IF EXISTS (SELECT 1 FROM economy_private.card_catalog) THEN RAISE EXCEPTION 'Unexpected card approvals'; END IF;
 IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity)
 THEN RAISE EXCEPTION 'Public table without RLS'; END IF;
 FOREACH tab IN ARRAY ARRAY['travelers','wallets','inventory','traveler_stats','equipped_items','traveler_chests','chest_operations','guild_reward_claims'] LOOP
  IF has_table_privilege('authenticated','public.'||tab,'INSERT,UPDATE,DELETE')
    OR has_table_privilege('anon','public.'||tab,'INSERT,UPDATE,DELETE')
  THEN RAISE EXCEPTION 'Unexpected economic table privilege: %',tab; END IF;
 END LOOP;
 FOR tab,col IN SELECT c.relname,a.attname FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped
   AND (c.relname IN ('wallets','inventory','traveler_stats','equipped_items','traveler_chests','chest_operations','guild_reward_claims')
    OR (c.relname='travelers' AND a.attname IN ('user_id','xp','level','economic_verified_at','journey_progress')))
 LOOP
  IF has_column_privilege('authenticated','public.'||tab,col,'INSERT,UPDATE,REFERENCES')
    OR has_column_privilege('anon','public.'||tab,col,'INSERT,UPDATE,REFERENCES')
  THEN RAISE EXCEPTION 'Unexpected economic column privilege: %.%',tab,col; END IF;
 END LOOP;
 IF has_function_privilege('anon','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
   OR has_function_privilege('authenticated','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
   OR NOT has_function_privilege('service_role','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'Invalid authority privilege'; END IF;
 IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('add_coins','spend_coins','grant_traveler_chest','claim_chest_reward','economy_authority','apply_guild_mission_reward')
   AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('service_role',p.oid,'EXECUTE')))
 THEN RAISE EXCEPTION 'Legacy economic entry point reachable'; END IF;
 IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname IN ('public','guild_invite_private','story_private','guild_ops','ebd_ops','economy_private') AND p.prosecdef
   AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig,'{}')) cfg WHERE cfg LIKE 'search_path=%'))
 THEN RAISE EXCEPTION 'Definer without fixed search_path'; END IF;
END $release$;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
