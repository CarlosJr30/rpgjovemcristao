-- TEST/local candidate only. No remote application in this task; PR53 is still a dependency.
-- Adds approved capacity and new-link use quotas while preserving every legacy invite row.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $guard$
BEGIN
  IF current_setting('rpg.community043b.quotas_install', true) IS DISTINCT FROM 'local-test'
     OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
     OR to_regclass('public.guild_members') IS NULL
     OR to_regclass('guild_invite_private.link_invites') IS NULL
     OR to_regclass('ebd_class_private.legacy_uses') IS NULL
     OR to_regprocedure('guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb)') IS NULL
     OR to_regprocedure('guild_invite_private.create_invite(uuid,uuid)') IS NULL
     OR to_regprocedure('ebd_class_private.legacy_accept(text,uuid,uuid)') IS NULL
     OR EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='guild_invite_private' AND table_name='link_invites'
                  AND column_name='community_quota_version') THEN
    RAISE EXCEPTION 'Reviewed COMMUNITY-043B quota baseline required';
  END IF;
END
$guard$;

-- NULL denotes a historical link: its hash, expiration, revocation and use ledger
-- remain byte-for-byte untouched and retain the legacy 100-use contract.
ALTER TABLE guild_invite_private.link_invites
  ADD COLUMN community_quota_version smallint,
  ADD CONSTRAINT link_invites_community_quota_version_check
    CHECK (community_quota_version IS NULL OR community_quota_version = 1);
REVOKE ALL ON TABLE guild_invite_private.link_invites FROM PUBLIC, anon, authenticated, service_role;

-- All current membership writers take this same transaction advisory lock before
-- touching membership rows. The trigger is a final shared guard for every path.
CREATE FUNCTION guild_admin_private.enforce_membership_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE excluding_id uuid; member_count integer; avatar_count integer;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND OLD.guild_id = NEW.guild_id AND OLD.traveler_id = NEW.traveler_id THEN
      RETURN NEW;
    END IF;
    excluding_id := OLD.id;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(1010, 1);
  SELECT count(*) INTO avatar_count
  FROM public.guild_members m
  WHERE m.traveler_id = NEW.traveler_id AND m.status = 'active'
    AND m.id IS DISTINCT FROM excluding_id;
  IF avatar_count >= 5 THEN
    RAISE EXCEPTION 'Avatar active Guild limit reached' USING ERRCODE = '54000';
  END IF;

  SELECT count(*) INTO member_count
  FROM public.guild_members m
  WHERE m.guild_id = NEW.guild_id AND m.status = 'active'
    AND m.id IS DISTINCT FROM excluding_id;
  IF member_count >= 50 THEN
    RAISE EXCEPTION 'Guild active member limit reached' USING ERRCODE = '54000';
  END IF;
  RETURN NEW;
END
$function$;
REVOKE ALL ON FUNCTION guild_admin_private.enforce_membership_quotas() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER guild_members_enforce_community_quotas
  BEFORE INSERT OR UPDATE ON public.guild_members
  FOR EACH ROW EXECUTE FUNCTION guild_admin_private.enforce_membership_quotas();

CREATE OR REPLACE FUNCTION guild_invite_private.create_invite(p_leader uuid, p_guild uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE guild_key uuid; raw_token text; new_row guild_invite_private.link_invites;
  issued_at timestamptz := clock_timestamp();
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(1010, 1);
  PERFORM guild_admin_private.require_writes();
  guild_key := guild_invite_private.leader_guild(p_leader, p_guild);
  IF (SELECT count(*) FROM guild_invite_private.link_invites
      WHERE guild_id = guild_key AND revoked_at IS NULL AND expires_at > clock_timestamp()) >= 10 THEN
    RAISE EXCEPTION 'Active invite limit reached' USING ERRCODE = '54000';
  END IF;
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO guild_invite_private.link_invites
    (guild_id, leader_traveler_id, token_hash, created_at, expires_at, community_quota_version)
  VALUES
    (guild_key, p_leader, extensions.digest(raw_token, 'sha256'), issued_at,
     issued_at + interval '7 days', 1)
  RETURNING * INTO new_row;
  RETURN jsonb_build_object('id', new_row.id, 'token', raw_token, 'expires_at', new_row.expires_at);
END
$function$;

CREATE OR REPLACE FUNCTION ebd_class_private.legacy_accept(p_token text, p_actor uuid, p_request uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE owner_id uuid; i guild_invite_private.link_invites; m public.guild_members;
  prior ebd_class_private.legacy_uses; use_limit integer;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(1010, 1);
  PERFORM guild_admin_private.require_writes();
  owner_id := guild_admin_private.active_actor(p_actor);
  i := guild_invite_private.valid_invite(p_token);
  IF p_request IS NOT NULL AND EXISTS (
    SELECT 1 FROM ebd_class_private.invite_uses
    WHERE user_id=owner_id AND request_id=p_request
  ) THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
  IF p_request IS NOT NULL AND EXISTS (
    SELECT 1 FROM ebd_class_private.legacy_uses
    WHERE user_id=owner_id AND request_id=p_request AND (invite_id<>i.id OR traveler_id<>p_actor)
  ) THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
  SELECT * INTO prior FROM ebd_class_private.legacy_uses WHERE invite_id=i.id AND traveler_id=p_actor;
  SELECT * INTO m FROM public.guild_members WHERE guild_id=i.guild_id AND traveler_id=p_actor FOR UPDATE;
  IF prior.invite_id IS NOT NULL THEN
    IF m.status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Enrollment no longer active' USING ERRCODE='42501'; END IF;
    RETURN jsonb_build_object('guildId',i.guild_id,'classId',NULL,'enrolled',true,'replayed',true,'membershipId',m.id);
  END IF;
  use_limit := CASE WHEN i.community_quota_version = 1 THEN 50 ELSE 100 END;
  IF (SELECT count(*) FROM ebd_class_private.legacy_uses WHERE invite_id=i.id) >= use_limit THEN
    RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002';
  END IF;
  IF m.id IS NOT NULL AND m.status<>'active' AND m.role<>'member' THEN
    RAISE EXCEPTION 'Membership unavailable' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.guild_members(guild_id,traveler_id,role,status)
  VALUES(i.guild_id,p_actor,'member','active')
  ON CONFLICT(guild_id,traveler_id) DO UPDATE
    SET status='active',updated_at=clock_timestamp(),joined_at=clock_timestamp()
    WHERE guild_members.status<>'active'
  RETURNING * INTO m;
  IF m.id IS NULL THEN SELECT * INTO m FROM public.guild_members WHERE guild_id=i.guild_id AND traveler_id=p_actor; END IF;
  INSERT INTO ebd_class_private.legacy_uses(invite_id,traveler_id,user_id,membership_id,request_id)
  VALUES(i.id,p_actor,owner_id,m.id,p_request);
  INSERT INTO ebd_class_private.legacy_events(invite_id,actor_id,action) VALUES(i.id,p_actor,'accepted');
  RETURN jsonb_build_object('guildId',i.guild_id,'classId',NULL,'enrolled',true,'replayed',false,'membershipId',m.id);
END
$function$;

CREATE OR REPLACE FUNCTION ebd_class_private.invite_preview(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE i ebd_class_private.invites; old_invite guild_invite_private.link_invites;
  use_limit integer; use_count integer;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002';
  END IF;
  SELECT * INTO i FROM ebd_class_private.invites WHERE token_hash=extensions.digest(p_token,'sha256');
  IF NOT FOUND THEN
    old_invite := ebd_class_private.legacy_snapshot(p_token);
    use_limit := CASE WHEN old_invite.community_quota_version=1 THEN 50 ELSE 100 END;
    SELECT count(*) INTO use_count FROM ebd_class_private.legacy_uses WHERE invite_id=old_invite.id;
    IF use_count >= use_limit THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
    RETURN jsonb_build_object('guildName',(SELECT name FROM public.guilds WHERE id=old_invite.guild_id),
      'className',NULL,'expiresAt',old_invite.expires_at);
  END IF;
  IF NOT ebd_class_private.invite_valid(i) OR i.use_count>=i.max_uses THEN
    RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002';
  END IF;
  RETURN jsonb_build_object('guildName',(SELECT name FROM public.guilds WHERE id=i.guild_id),
    'className',(SELECT name FROM ebd_class_private.classes WHERE id=i.class_id),'expiresAt',i.expires_at);
END
$function$;

CREATE OR REPLACE FUNCTION ebd_class_private.invite_list(p_actor uuid,p_guild uuid,p_class uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE result jsonb;
BEGIN
  PERFORM ebd_class_private.inviter(p_actor,p_guild,p_class);
  result := coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'createdAt',created_at,'expiresAt',expires_at,
    'maxUses',max_uses,'uses',use_count,'revokedAt',revoked_at) ORDER BY created_at DESC,id)
    FROM ebd_class_private.invites WHERE guild_id=p_guild AND class_id IS NOT DISTINCT FROM p_class),'[]'::jsonb);
  IF p_class IS NULL THEN
    result := result || coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id,'createdAt',i.created_at,
      'expiresAt',i.expires_at,'maxUses',CASE WHEN i.community_quota_version=1 THEN 50 ELSE 100 END,
      'uses',(SELECT count(*) FROM ebd_class_private.legacy_uses u WHERE u.invite_id=i.id),
      'revokedAt',i.revoked_at,'legacy',i.community_quota_version IS NULL)
      ORDER BY i.created_at DESC,i.id) FROM guild_invite_private.link_invites i WHERE i.guild_id=p_guild),'[]'::jsonb);
  END IF;
  RETURN result;
END
$function$;

REVOKE ALL ON FUNCTION guild_invite_private.create_invite(uuid,uuid),
  ebd_class_private.legacy_accept(text,uuid,uuid),
  ebd_class_private.invite_preview(text),
  ebd_class_private.invite_list(uuid,uuid,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
-- Preserve the reviewed grants: issuance and acceptance are reached only through
-- their scoped public wrappers; authenticated callers retain preview/list only.
GRANT EXECUTE ON FUNCTION ebd_class_private.invite_preview(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ebd_class_private.invite_list(uuid,uuid,uuid) TO authenticated;
