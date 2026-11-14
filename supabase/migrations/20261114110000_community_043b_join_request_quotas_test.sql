-- Local/TEST candidate only. Never apply remotely in this task.
-- Enforces approved request quotas on the existing request table and RPC paths.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $guard$
BEGIN
  IF current_setting('rpg.community043b.request_quotas_install', true) IS DISTINCT FROM 'local-test'
     OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006'
     OR to_regclass('public.guild_join_requests') IS NULL
     OR to_regclass('public.travelers') IS NULL
     OR to_regclass('public.guild_join_requests_created_at_traveler_idx') IS NOT NULL
     OR (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'guild_join_requests'
           AND column_name IN ('guild_id', 'traveler_id', 'status', 'created_at', 'reviewed_at')) <> 5
     OR (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = 'auth' AND table_name = 'users'
           AND column_name IN ('is_anonymous', 'email_confirmed_at', 'deleted_at', 'banned_until')) <> 4
     OR to_regprocedure('guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb)') IS NULL
     OR to_regprocedure('public.request_join_guild(uuid,uuid)') IS NULL
     OR EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.guild_join_requests'::regclass
                AND tgname = 'guild_join_requests_enforce_community_quotas') THEN
    RAISE EXCEPTION 'Reviewed COMMUNITY-043B request-quota baseline required';
  END IF;
END
$guard$;

CREATE INDEX guild_join_requests_created_at_traveler_idx
  ON public.guild_join_requests (created_at, traveler_id);

CREATE FUNCTION guild_admin_private.enforce_join_request_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  account_id uuid;
  server_now timestamptz;
  request_count bigint;
BEGIN
  -- Match the lock used by the existing Guild command so requests from all
  -- avatars of one account are serialized with other shared Guild writers.
  PERFORM pg_catalog.pg_advisory_xact_lock(1010, 1);
  server_now := clock_timestamp();

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'New join requests must be pending' USING ERRCODE = '22023';
    END IF;

    SELECT t.user_id INTO account_id
    FROM public.travelers t
    WHERE t.id = NEW.traveler_id AND t.is_active
    FOR SHARE;
    IF account_id IS NULL THEN
      RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE = '42501';
    END IF;

    PERFORM 1 FROM auth.users u
    WHERE u.id = account_id
      AND u.is_anonymous IS FALSE
      AND u.email_confirmed_at IS NOT NULL
      AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until <= server_now)
    FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Eligible confirmed account required' USING ERRCODE = '42501';
    END IF;

    -- Stabilize account-to-avatar ownership while aggregating every avatar's
    -- persisted requests for this account.
    PERFORM 1 FROM public.travelers t
    WHERE t.user_id = account_id
    ORDER BY t.id
    FOR SHARE;

    -- The existing RPC is an upsert for a pending (avatar, Guild) pair. Allow
    -- that authenticated replay before counting so it does not consume another
    -- account slot.
    IF EXISTS (
      SELECT 1 FROM public.guild_join_requests r
      WHERE r.guild_id = NEW.guild_id AND r.traveler_id = NEW.traveler_id
        AND r.status = 'pending'
    ) THEN
      RETURN NEW;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.guild_join_requests r
      WHERE r.guild_id = NEW.guild_id AND r.traveler_id = NEW.traveler_id
        AND r.status = 'rejected'
        AND r.reviewed_at > server_now - interval '24 hours'
    ) THEN
      RAISE EXCEPTION 'Join request cooldown active' USING ERRCODE = '55000';
    END IF;

    SELECT count(*) INTO request_count
    FROM public.guild_join_requests r
    JOIN public.travelers t ON t.id = r.traveler_id
    WHERE t.user_id = account_id
      AND r.created_at > server_now - interval '24 hours'
      AND r.created_at <= server_now;
    IF request_count >= 5 THEN
      RAISE EXCEPTION 'Account join-request quota reached' USING ERRCODE = '54000';
    END IF;

    -- Do not trust client timestamps for the rolling quota.
    NEW.created_at := server_now;
    NEW.updated_at := server_now;
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    IF NEW.status = 'accepted' THEN
      SELECT t.user_id INTO account_id
      FROM public.travelers t
      WHERE t.id = NEW.traveler_id AND t.is_active
      FOR SHARE;
      IF account_id IS NULL THEN
        RAISE EXCEPTION 'Request target avatar is no longer eligible' USING ERRCODE = '42501';
      END IF;

      PERFORM 1 FROM auth.users u
      WHERE u.id = account_id
        AND u.is_anonymous IS FALSE
        AND u.email_confirmed_at IS NOT NULL
        AND u.deleted_at IS NULL
        AND (u.banned_until IS NULL OR u.banned_until <= server_now)
      FOR SHARE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Request target account is no longer eligible' USING ERRCODE = '42501';
      END IF;
    END IF;

    -- Cooldown timestamps are server-owned even if another trusted writer
    -- reaches this table in the future.
    NEW.reviewed_at := server_now;
    NEW.updated_at := server_now;
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION guild_admin_private.enforce_join_request_quotas()
  FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER guild_join_requests_enforce_community_quotas
  BEFORE INSERT OR UPDATE OF status ON public.guild_join_requests
  FOR EACH ROW EXECUTE FUNCTION guild_admin_private.enforce_join_request_quotas();
