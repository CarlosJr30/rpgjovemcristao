-- TEST ONLY. No catalog seed or player grant in this migration.
-- Apply in one transaction with audited target and preflight authority hash.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('economy001a.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR public.economy_protocol_version() IS DISTINCT FROM 3 THEN
  RAISE EXCEPTION 'TEST target denied' USING ERRCODE='42501';
 END IF;
 IF current_setting('economy001a.authority_md5',true) IS DISTINCT FROM
  md5(replace(pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure),chr(13),''))
 OR has_function_privilege('authenticated','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 OR has_function_privilege('anon','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 OR has_function_privilege('service_role','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 OR NOT has_schema_privilege('authenticated','economy_private','USAGE') THEN
  RAISE EXCEPTION 'Audited authority boundary required' USING ERRCODE='42501';
 END IF;
END $$;

CREATE FUNCTION economy_private.claim_arena_starter_001a(p_traveler_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); session_text text:=auth.jwt()->>'session_id';
 receipt jsonb; claimed_traveler uuid; catalog_hash text;
BEGIN
 -- Preserve existing lock order: Auth identity, then its traveler and receipts.
 PERFORM 1 FROM auth.users u WHERE u.id=actor AND NOT coalesce(u.is_anonymous,false)
  AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
  AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND OR session_text IS NULL OR session_text !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN
  RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=session_text::uuid AND s.user_id=actor
  AND (s.not_after IS NULL OR s.not_after>clock_timestamp())) THEN
  RAISE EXCEPTION 'Session unavailable' USING ERRCODE='42501';
 END IF;
 PERFORM 1 FROM public.travelers t WHERE t.id=p_traveler_id AND t.user_id=actor AND t.is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Traveler unavailable' USING ERRCODE='42501'; END IF;
 -- Freeze eligibility during the delegated transaction, including revocation.
 PERFORM 1 FROM economy_private.card_catalog c
  WHERE c.version='arena-cards-2026-10-20.2-fixprod003-test' ORDER BY c.id FOR SHARE;
 SELECT md5(jsonb_agg(c.definition ORDER BY c.id)::text) INTO catalog_hash
 FROM economy_private.card_catalog c WHERE c.version='arena-cards-2026-10-20.2-fixprod003-test'
  AND c.approval_ref='FIX-PROD-003:TEST-ONLY:2026-10-23' AND c.starter AND c.revoked_at IS NULL;
 IF catalog_hash IS DISTINCT FROM '76ac2f21f7acf87f43bb52b4660a3a6f' THEN
  RAISE EXCEPTION 'Approved starter unavailable' USING ERRCODE='42501';
 END IF;
 -- Delegate only the existing fixed operation; no actor/amount/card IDs from client.
 receipt:=public.arena_authority_v3(actor,p_traveler_id,'starter','{}'::jsonb);
 IF receipt->>'account_id' IS DISTINCT FROM actor::text
 OR receipt->>'operation_type' IS DISTINCT FROM 'card-starter'
 OR receipt->>'source' IS DISTINCT FROM 'approved-starter'
 OR receipt->'rewards'->>'catalogVersion' IS DISTINCT FROM 'arena-cards-2026-10-20.2-fixprod003-test'
 OR jsonb_typeof(receipt->'rewards'->'cardIds') IS DISTINCT FROM 'array'
 OR jsonb_array_length(receipt->'rewards'->'cardIds') IS DISTINCT FROM 7 THEN
  RAISE EXCEPTION 'Starter receipt unavailable' USING ERRCODE='42501';
 END IF;
 claimed_traveler:=(receipt->>'traveler_id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.travelers t WHERE t.id=claimed_traveler AND t.user_id=actor) THEN
  RAISE EXCEPTION 'Starter receipt unavailable' USING ERRCODE='42501';
 END IF;
 RETURN jsonb_build_object('receiptId',receipt->>'id','travelerId',claimed_traveler,
  'catalogVersion',receipt->'rewards'->>'catalogVersion',
  'status',CASE WHEN claimed_traveler=p_traveler_id THEN 'available' ELSE 'claimed-on-another-traveler' END);
END $$;
REVOKE ALL ON FUNCTION economy_private.claim_arena_starter_001a(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_private.claim_arena_starter_001a(uuid) TO authenticated;

CREATE FUNCTION public.claim_arena_starter(p_traveler_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT economy_private.claim_arena_starter_001a(p_traveler_id)
$$;
REVOKE ALL ON FUNCTION public.claim_arena_starter(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.claim_arena_starter(uuid) TO authenticated;
COMMENT ON FUNCTION economy_private.claim_arena_starter_001a(uuid) IS
 'ECONOMY-001A TEST: delegates existing explicit once-per-Auth-account starter; confirmed current session/own active traveler/frozen TEST catalog only. No balance or QA authority.';
NOTIFY pgrst,'reload schema';
