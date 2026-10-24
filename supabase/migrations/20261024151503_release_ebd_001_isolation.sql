-- RELEASE-EBD-001: partial launch. No balance/data backfill, deletion or RLS bypass.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE SCHEMA release_ebd;
REVOKE ALL ON SCHEMA release_ebd FROM PUBLIC,anon,authenticated,service_role;

-- All public RPCs fail closed; grant only the reviewed release surface below.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA economy_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA economy_private FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon,authenticated,service_role;
-- Table-level REVOKE does not remove previous column-level grants.
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT c.oid,n.nspname,c.relname,string_agg(quote_ident(a.attname),',' ORDER BY a.attnum) cols
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
 WHERE n.nspname='public' AND c.relkind IN('r','p','v','m','f') AND a.attnum>0 AND NOT a.attisdropped
 GROUP BY c.oid,n.nspname,c.relname
 LOOP EXECUTE format('REVOKE ALL (%s) ON TABLE %I.%I FROM PUBLIC,anon,authenticated,service_role',t.cols,t.nspname,t.relname); END LOOP;
END $$;
-- Read-only hydration remains owner-scoped by existing RLS; no economic operations.
GRANT SELECT ON public.travelers,public.traveler_stats,public.wallets,public.inventory,
 public.equipped_items,public.traveler_chests,public.chest_operations,
 public.guilds,public.guild_members,public.guild_join_requests TO authenticated;
GRANT UPDATE(name,body_type,skin_tone,hair_style,hair_color,avatar_variant) ON public.travelers TO authenticated;
GRANT SELECT,INSERT ON public.profiles TO authenticated;
GRANT UPDATE(display_name) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION economy_private.create_traveler(p_id uuid,p_name text,p_body_type text,p_skin_tone text,p_hair_style text,p_hair_color text,p_avatar_variant text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE current_user_id uuid:=auth.uid();
BEGIN
 IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 UPDATE public.travelers SET is_active=false WHERE user_id=current_user_id AND is_active=true;
 INSERT INTO public.travelers(id,user_id,name,body_type,skin_tone,hair_style,hair_color,avatar_variant,level,xp,is_active)
 VALUES(p_id,current_user_id,p_name,p_body_type,p_skin_tone,p_hair_style,p_hair_color,p_avatar_variant,1,0,true);
 INSERT INTO public.traveler_stats(traveler_id) VALUES(p_id);
 INSERT INTO public.wallets(traveler_id) VALUES(p_id);
 RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION economy_private.create_traveler(uuid,text,text,text,text,text,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION economy_private.create_traveler(uuid,text,text,text,text,text,text) TO authenticated;

-- Do not change existing lessons/receipts. Future grading records learning only.
CREATE FUNCTION release_ebd.no_new_rewards() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RETURN NULL; END $$;
REVOKE ALL ON FUNCTION release_ebd.no_new_rewards() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER release_ebd_no_reward BEFORE INSERT ON public.guild_ebd_reward_pending
FOR EACH ROW EXECUTE FUNCTION release_ebd.no_new_rewards();

CREATE OR REPLACE FUNCTION public.guild_ebd_command(p_actor uuid,p_action text,p_id uuid,p_revision integer,p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF p_action='lesson' AND coalesce(p_data->>'rewardTier','')<>'' THEN
  RAISE EXCEPTION 'Rewards are unavailable in this release' USING ERRCODE='42501';
 END IF;
 RETURN ebd_ops.command(p_actor,p_action,p_id,p_revision,p_data);
END $$;

DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname=ANY(ARRAY[
  'owns_traveler','is_active_guild_member','is_guild_leader','create_traveler','set_active_traveler',
  'create_guild','request_join_guild','review_guild_join_request','leave_guild','remove_guild_member',
  'list_guild_members','list_guild_join_requests','guild_admin_stats','guild_public_member_profile',
  'create_guild_link_invite','list_guild_link_invites','revoke_guild_link_invite',
  'resolve_guild_link_invite','request_guild_link_invite','preview_guild_link_invite',
  'guild_ebd_workspace','guild_ebd_command'])
 LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.oid::regprocedure); END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.preview_guild_link_invite(text) TO anon;
CREATE FUNCTION public.release_scope() RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT 'guild-ebd-001'::text $$;
REVOKE ALL ON FUNCTION public.release_scope() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_scope() TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
