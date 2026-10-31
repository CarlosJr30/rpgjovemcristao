-- TEST only: additive paginated administration read. No grants, mutations or secret material.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
 OR to_regclass('guild_admin_private.leadership_revocations') IS NULL
 OR to_regprocedure('public.guild_governance_leaders(integer)') IS NOT NULL
 OR md5(pg_get_functiondef('guild_admin_private.require_admin(text)'::regprocedure))<>'8f4bf562e9893b2093b73c9225196a4c'
 OR (SELECT proacl FROM pg_proc WHERE oid='guild_admin_private.require_admin(text)'::regprocedure) IS DISTINCT FROM ARRAY['postgres=X/postgres']::aclitem[]
 THEN RAISE EXCEPTION 'Reviewed UI-ADMIN TEST baseline required'; END IF;
END $$;
CREATE FUNCTION guild_admin_private.leaders(p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM guild_admin_private.require_admin('leadership.manage');
 IF p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('version',1,'leaders',COALESCE((
 WITH legacy AS (
  SELECT t.user_id,min(g.created_at) first_at,count(*) FILTER(WHERE g.status='active') active_count
  FROM public.travelers t JOIN public.guild_members m ON m.traveler_id=t.id
  JOIN public.guilds g ON g.id=m.guild_id AND g.leader_traveler_id=t.id
  WHERE m.role='leader' AND m.status='active' GROUP BY t.user_id
 ), candidates AS (SELECT user_id FROM guild_admin_private.leader_authorizations UNION SELECT user_id FROM legacy)
 SELECT jsonb_agg(to_jsonb(x)) FROM (
  SELECT c.user_id id,COALESCE((SELECT t.name FROM public.travelers t WHERE t.user_id=c.user_id ORDER BY t.is_active DESC,t.created_at DESC,t.id LIMIT 1),'Conta sem avatar') name,
   CASE WHEN u.email IS NULL THEN 'Endereço indisponível' ELSE left(split_part(u.email,'@',1),1)||'***@'||split_part(u.email,'@',2) END "emailHint",
   (a.user_id IS NULL OR a.revoked_at IS NULL) AND (r.user_id IS NULL OR r.cleared_at IS NOT NULL)
     AND (a.user_id IS NOT NULL OR COALESCE(l.active_count,0)>0) active,
   COALESCE(a.granted_at,l.first_at) "grantedAt",COALESCE(a.revision,r.revision,1) revision,
   CASE WHEN a.user_id IS NULL THEN 'legacy' ELSE 'authorization' END kind
  FROM candidates c JOIN auth.users u ON u.id=c.user_id
  LEFT JOIN guild_admin_private.leader_authorizations a ON a.user_id=c.user_id
  LEFT JOIN guild_admin_private.leadership_revocations r ON r.user_id=c.user_id
  LEFT JOIN legacy l ON l.user_id=c.user_id
  ORDER BY COALESCE(a.granted_at,l.first_at) DESC,c.user_id LIMIT 25 OFFSET p_offset
 ) x),'[]'::jsonb));
END $$;
CREATE FUNCTION public.guild_governance_leaders(p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT guild_admin_private.leaders(p_offset) $$;
REVOKE ALL ON FUNCTION guild_admin_private.leaders(integer),public.guild_governance_leaders(integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_private.leaders(integer),public.guild_governance_leaders(integer) TO authenticated;
NOTIFY pgrst,'reload schema';
