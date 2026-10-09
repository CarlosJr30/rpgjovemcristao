CREATE TABLE public.guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  leader_traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guilds_name_length_check CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  CONSTRAINT guilds_description_length_check CHECK (description IS NULL OR char_length(description) <= 500),
  CONSTRAINT guilds_status_check CHECK (status IN ('active', 'archived'))
);--> statement-breakpoint

CREATE TABLE public.guild_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_members_guild_traveler_unique UNIQUE (guild_id, traveler_id),
  CONSTRAINT guild_members_role_check CHECK (role IN ('leader', 'co_leader', 'moderator', 'member')),
  CONSTRAINT guild_members_status_check CHECK (status IN ('active', 'pending', 'left', 'removed'))
);--> statement-breakpoint

CREATE TABLE public.guild_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  invited_traveler_id uuid REFERENCES public.travelers(id) ON DELETE CASCADE,
  invited_by_traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_invites_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled'))
);--> statement-breakpoint

CREATE TABLE public.guild_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by_traveler_id uuid REFERENCES public.travelers(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_join_requests_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'))
);--> statement-breakpoint

CREATE TABLE public.guild_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  created_by_traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  mission_type text NOT NULL,
  bible_reference text,
  bible_url text,
  completion_mode text NOT NULL,
  requires_leader_approval boolean NOT NULL DEFAULT false,
  reward_tier text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  starts_at timestamptz,
  due_at timestamptz,
  metadata jsonb,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_missions_title_length_check CHECK (char_length(btrim(title)) BETWEEN 2 AND 100),
  CONSTRAINT guild_missions_description_length_check CHECK (description IS NULL OR char_length(description) <= 1000),
  CONSTRAINT guild_missions_reference_length_check CHECK (bible_reference IS NULL OR char_length(bible_reference) <= 100),
  CONSTRAINT guild_missions_bible_url_check CHECK (bible_url IS NULL OR bible_url ~ '^https://www\.bible\.com/[A-Za-z0-9/._?=&%-]{1,240}$'),
  CONSTRAINT guild_missions_type_check CHECK (mission_type IN ('bible_reading', 'lesson', 'quiz', 'practical_activity', 'individual_challenge', 'collective_challenge', 'special_mission', 'journey_gate')),
  CONSTRAINT guild_missions_completion_mode_check CHECK (completion_mode IN ('self_complete', 'leader_approval')),
  CONSTRAINT guild_missions_reward_tier_check CHECK (reward_tier IN ('normal', 'great', 'epic', 'extraordinary')),
  CONSTRAINT guild_missions_status_check CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
  CONSTRAINT guild_missions_dates_check CHECK (due_at IS NULL OR starts_at IS NULL OR due_at > starts_at),
  CONSTRAINT guild_missions_metadata_size_check CHECK (metadata IS NULL OR octet_length(metadata::text) <= 2048)
);--> statement-breakpoint

CREATE TABLE public.guild_mission_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.guild_missions(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'available',
  started_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  approved_at timestamptz,
  approved_by_traveler_id uuid REFERENCES public.travelers(id) ON DELETE SET NULL,
  completion_note text,
  reward_claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_mission_progress_mission_traveler_unique UNIQUE (mission_id, traveler_id),
  CONSTRAINT guild_mission_progress_status_check CHECK (status IN ('available', 'started', 'pending_approval', 'completed', 'rejected')),
  CONSTRAINT guild_mission_progress_note_length_check CHECK (completion_note IS NULL OR char_length(completion_note) <= 500)
);--> statement-breakpoint

CREATE TABLE public.guild_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.guild_missions(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  reward_tier text NOT NULL,
  xp_awarded integer NOT NULL,
  coins_awarded integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_reward_claims_mission_traveler_unique UNIQUE (mission_id, traveler_id),
  CONSTRAINT guild_reward_claims_tier_check CHECK (reward_tier IN ('normal', 'great', 'epic', 'extraordinary')),
  CONSTRAINT guild_reward_claims_values_check CHECK (xp_awarded >= 0 AND coins_awarded >= 0)
);--> statement-breakpoint

CREATE INDEX guilds_leader_traveler_id_idx ON public.guilds(leader_traveler_id);--> statement-breakpoint
CREATE INDEX guild_members_guild_status_idx ON public.guild_members(guild_id, status);--> statement-breakpoint
CREATE UNIQUE INDEX guild_members_one_active_guild_per_traveler_idx ON public.guild_members(traveler_id) WHERE status = 'active';--> statement-breakpoint
CREATE INDEX guild_invites_guild_status_idx ON public.guild_invites(guild_id, status);--> statement-breakpoint
CREATE UNIQUE INDEX guild_join_requests_one_pending_idx ON public.guild_join_requests(guild_id, traveler_id) WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX guild_join_requests_guild_status_idx ON public.guild_join_requests(guild_id, status);--> statement-breakpoint
CREATE INDEX guild_missions_guild_status_idx ON public.guild_missions(guild_id, status);--> statement-breakpoint
CREATE INDEX guild_mission_progress_traveler_status_idx ON public.guild_mission_progress(traveler_id, status);--> statement-breakpoint

ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.guild_join_requests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.guild_missions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.guild_mission_progress ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.guild_reward_claims ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE FUNCTION public.owns_traveler(p_traveler_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.travelers t WHERE t.id = p_traveler_id AND t.user_id = auth.uid()) $$;--> statement-breakpoint

CREATE FUNCTION public.is_active_guild_member(p_guild_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.guild_members gm
  JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE gm.guild_id = p_guild_id AND gm.status = 'active' AND t.user_id = auth.uid()
) $$;--> statement-breakpoint

CREATE FUNCTION public.is_guild_leader(p_guild_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.guild_members gm
  JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE gm.guild_id = p_guild_id AND gm.status = 'active' AND gm.role = 'leader' AND t.user_id = auth.uid()
) $$;--> statement-breakpoint

CREATE FUNCTION public.can_lead_mission(p_mission_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.guild_missions m
  JOIN public.guild_members gm ON gm.guild_id = m.guild_id
  JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE m.id = p_mission_id AND gm.status = 'active' AND gm.role = 'leader' AND t.user_id = auth.uid()
) $$;--> statement-breakpoint

CREATE POLICY guilds_select_member ON public.guilds FOR SELECT TO authenticated USING (public.is_active_guild_member(id));--> statement-breakpoint
CREATE POLICY guild_members_select_same_guild ON public.guild_members FOR SELECT TO authenticated USING (public.is_active_guild_member(guild_id));--> statement-breakpoint
CREATE POLICY guild_invites_select_participant ON public.guild_invites FOR SELECT TO authenticated USING (public.is_active_guild_member(guild_id) OR public.owns_traveler(invited_traveler_id));--> statement-breakpoint
CREATE POLICY guild_join_requests_select_participant ON public.guild_join_requests FOR SELECT TO authenticated USING (public.owns_traveler(traveler_id) OR public.is_guild_leader(guild_id));--> statement-breakpoint
CREATE POLICY guild_missions_select_member ON public.guild_missions FOR SELECT TO authenticated USING (public.is_active_guild_member(guild_id) AND (status = 'published' OR public.is_guild_leader(guild_id)));--> statement-breakpoint
CREATE POLICY guild_mission_progress_select_participant ON public.guild_mission_progress FOR SELECT TO authenticated USING (public.owns_traveler(traveler_id) OR public.can_lead_mission(mission_id));--> statement-breakpoint
CREATE POLICY guild_reward_claims_select_participant ON public.guild_reward_claims FOR SELECT TO authenticated USING (public.owns_traveler(traveler_id) OR public.can_lead_mission(mission_id));--> statement-breakpoint

CREATE TRIGGER guilds_set_updated_at BEFORE UPDATE ON public.guilds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER guild_members_set_updated_at BEFORE UPDATE ON public.guild_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER guild_invites_set_updated_at BEFORE UPDATE ON public.guild_invites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER guild_join_requests_set_updated_at BEFORE UPDATE ON public.guild_join_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER guild_missions_set_updated_at BEFORE UPDATE ON public.guild_missions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER guild_mission_progress_set_updated_at BEFORE UPDATE ON public.guild_mission_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

CREATE FUNCTION public.create_guild(p_leader_traveler_id uuid, p_name text, p_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE new_guild_id uuid;
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  IF char_length(btrim(p_name)) NOT BETWEEN 2 AND 60 OR char_length(coalesce(p_description, '')) > 500 THEN RAISE EXCEPTION 'Invalid guild data' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.guild_members WHERE traveler_id = p_leader_traveler_id AND status = 'active') THEN RAISE EXCEPTION 'Traveler already belongs to a guild' USING ERRCODE = '23505'; END IF;
  INSERT INTO public.guilds(name, description, created_by_user_id, leader_traveler_id)
  VALUES (btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), auth.uid(), p_leader_traveler_id) RETURNING id INTO new_guild_id;
  INSERT INTO public.guild_members(guild_id, traveler_id, role, status) VALUES (new_guild_id, p_leader_traveler_id, 'leader', 'active');
  RETURN new_guild_id;
END $$;--> statement-breakpoint

CREATE FUNCTION public.request_join_guild(p_guild_id uuid, p_traveler_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE request_id uuid;
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.guilds WHERE id = p_guild_id AND status = 'active') THEN RAISE EXCEPTION 'Guild unavailable' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (SELECT 1 FROM public.guild_members WHERE traveler_id = p_traveler_id AND status = 'active') THEN RAISE EXCEPTION 'Traveler already belongs to a guild' USING ERRCODE = '23505'; END IF;
  INSERT INTO public.guild_join_requests(guild_id, traveler_id) VALUES (p_guild_id, p_traveler_id)
  ON CONFLICT (guild_id, traveler_id) WHERE status = 'pending' DO UPDATE SET updated_at = now()
  RETURNING id INTO request_id;
  RETURN request_id;
END $$;--> statement-breakpoint

CREATE FUNCTION public.review_guild_join_request(p_request_id uuid, p_reviewer_traveler_id uuid, p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE request_row public.guild_join_requests%ROWTYPE;
BEGIN
  IF NOT public.owns_traveler(p_reviewer_traveler_id) THEN RAISE EXCEPTION 'Reviewer not owned' USING ERRCODE = '42501'; END IF;
  SELECT * INTO request_row FROM public.guild_join_requests WHERE id = p_request_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.guild_members WHERE guild_id = request_row.guild_id AND traveler_id = p_reviewer_traveler_id AND role = 'leader' AND status = 'active') THEN RAISE EXCEPTION 'Request unavailable' USING ERRCODE = '42501'; END IF;
  IF p_approve AND EXISTS (SELECT 1 FROM public.guild_members WHERE traveler_id = request_row.traveler_id AND status = 'active') THEN RAISE EXCEPTION 'Traveler already belongs to a guild' USING ERRCODE = '23505'; END IF;
  UPDATE public.guild_join_requests SET status = CASE WHEN p_approve THEN 'accepted' ELSE 'rejected' END, reviewed_by_traveler_id = p_reviewer_traveler_id, reviewed_at = now() WHERE id = p_request_id;
  IF p_approve THEN
    INSERT INTO public.guild_members(guild_id, traveler_id, role, status) VALUES (request_row.guild_id, request_row.traveler_id, 'member', 'active')
    ON CONFLICT (guild_id, traveler_id) DO UPDATE SET role = 'member', status = 'active', joined_at = now(), updated_at = now();
  END IF;
END $$;--> statement-breakpoint

CREATE FUNCTION public.leave_guild(p_traveler_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_members SET status = 'left' WHERE traveler_id = p_traveler_id AND status = 'active' AND role <> 'leader';
  IF NOT FOUND THEN RAISE EXCEPTION 'Membership unavailable or leader must transfer leadership' USING ERRCODE = 'P0001'; END IF;
END $$;--> statement-breakpoint

CREATE FUNCTION public.create_guild_mission(
  p_creator_traveler_id uuid, p_title text, p_description text, p_mission_type text,
  p_bible_reference text, p_bible_url text, p_completion_mode text, p_reward_tier text,
  p_starts_at timestamptz, p_due_at timestamptz, p_publish boolean DEFAULT false,
  p_metadata jsonb DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE creator_guild_id uuid; new_mission_id uuid;
BEGIN
  IF NOT public.owns_traveler(p_creator_traveler_id) THEN RAISE EXCEPTION 'Creator not owned' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO creator_guild_id FROM public.guild_members WHERE traveler_id = p_creator_traveler_id AND role = 'leader' AND status = 'active';
  IF creator_guild_id IS NULL THEN RAISE EXCEPTION 'Leader role required' USING ERRCODE = '42501'; END IF;
  IF p_mission_type NOT IN ('bible_reading','lesson','quiz','practical_activity','individual_challenge','collective_challenge','special_mission','journey_gate') OR p_completion_mode NOT IN ('self_complete','leader_approval') OR p_reward_tier NOT IN ('normal','great','epic','extraordinary') THEN RAISE EXCEPTION 'Invalid mission domain value' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.guild_missions(guild_id, created_by_traveler_id, title, description, mission_type, bible_reference, bible_url, completion_mode, requires_leader_approval, reward_tier, status, starts_at, due_at, metadata, published_at)
  VALUES (creator_guild_id, p_creator_traveler_id, btrim(p_title), nullif(btrim(coalesce(p_description,'')),''), p_mission_type, nullif(btrim(coalesce(p_bible_reference,'')),''), nullif(btrim(coalesce(p_bible_url,'')),''), p_completion_mode, p_completion_mode = 'leader_approval', p_reward_tier, CASE WHEN p_publish THEN 'published' ELSE 'draft' END, p_starts_at, p_due_at, p_metadata, CASE WHEN p_publish THEN now() ELSE NULL END)
  RETURNING id INTO new_mission_id;
  RETURN new_mission_id;
END $$;--> statement-breakpoint

CREATE FUNCTION public.publish_guild_mission(p_mission_id uuid, p_leader_traveler_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Leader not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_missions m SET status = 'published', published_at = coalesce(published_at, now())
  WHERE m.id = p_mission_id AND m.status = 'draft' AND EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = m.guild_id AND gm.traveler_id = p_leader_traveler_id AND gm.role = 'leader' AND gm.status = 'active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Mission unavailable' USING ERRCODE = '42501'; END IF;
END $$;--> statement-breakpoint

CREATE FUNCTION public.start_guild_mission(p_mission_id uuid, p_traveler_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE progress_id uuid;
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.guild_missions m JOIN public.guild_members gm ON gm.guild_id = m.guild_id WHERE m.id = p_mission_id AND m.status = 'published' AND (m.starts_at IS NULL OR m.starts_at <= now()) AND (m.due_at IS NULL OR m.due_at > now()) AND gm.traveler_id = p_traveler_id AND gm.status = 'active') THEN RAISE EXCEPTION 'Mission unavailable' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.guild_mission_progress(mission_id, traveler_id, status, started_at) VALUES (p_mission_id, p_traveler_id, 'started', now())
  ON CONFLICT (mission_id, traveler_id) DO UPDATE SET status = 'started', started_at = coalesce(public.guild_mission_progress.started_at, now()), submitted_at = NULL WHERE public.guild_mission_progress.status IN ('available','rejected')
  RETURNING id INTO progress_id;
  IF progress_id IS NULL THEN RAISE EXCEPTION 'Mission already submitted or completed' USING ERRCODE = 'P0001'; END IF;
  RETURN progress_id;
END $$;--> statement-breakpoint

CREATE FUNCTION public.apply_guild_mission_reward(p_mission_id uuid, p_traveler_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE tier text; xp_value integer; coin_value integer; previous_xp integer; next_xp integer; level_bonus integer := 0;
BEGIN
  SELECT reward_tier INTO tier FROM public.guild_missions WHERE id = p_mission_id;
  xp_value := CASE tier WHEN 'normal' THEN 80 WHEN 'great' THEN 240 WHEN 'epic' THEN 480 WHEN 'extraordinary' THEN 720 ELSE NULL END;
  coin_value := CASE tier WHEN 'normal' THEN 25 WHEN 'great' THEN 100 WHEN 'epic' THEN 220 WHEN 'extraordinary' THEN 360 ELSE NULL END;
  IF xp_value IS NULL THEN RAISE EXCEPTION 'Invalid reward tier' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.guild_reward_claims(mission_id, traveler_id, reward_tier, xp_awarded, coins_awarded) VALUES (p_mission_id, p_traveler_id, tier, xp_value, coin_value) ON CONFLICT (mission_id, traveler_id) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT xp INTO previous_xp FROM public.travelers WHERE id = p_traveler_id FOR UPDATE;
  next_xp := previous_xp + xp_value;
  IF previous_xp < 200 AND next_xp >= 200 THEN level_bonus := 10; END IF;
  UPDATE public.travelers SET xp = next_xp, level = LEAST(50, GREATEST(1, floor((1 + sqrt(1 + next_xp::numeric / 25)) / 2)::integer)) WHERE id = p_traveler_id;
  UPDATE public.wallets SET coins = coins + coin_value + level_bonus WHERE traveler_id = p_traveler_id;
  RETURN true;
END $$;--> statement-breakpoint

CREATE FUNCTION public.submit_guild_mission(p_mission_id uuid, p_traveler_id uuid, p_completion_note text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE mission_mode text; next_status text;
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  IF char_length(coalesce(p_completion_note,'')) > 500 THEN RAISE EXCEPTION 'Completion note too long' USING ERRCODE = '22023'; END IF;
  SELECT m.completion_mode INTO mission_mode FROM public.guild_missions m JOIN public.guild_members gm ON gm.guild_id = m.guild_id WHERE m.id = p_mission_id AND m.status = 'published' AND (m.due_at IS NULL OR m.due_at > now()) AND gm.traveler_id = p_traveler_id AND gm.status = 'active';
  IF mission_mode IS NULL THEN RAISE EXCEPTION 'Mission unavailable' USING ERRCODE = '42501'; END IF;
  next_status := CASE WHEN mission_mode = 'self_complete' THEN 'completed' ELSE 'pending_approval' END;
  UPDATE public.guild_mission_progress SET status = next_status, submitted_at = now(), completion_note = nullif(btrim(coalesce(p_completion_note,'')),''), completed_at = CASE WHEN next_status = 'completed' THEN now() ELSE NULL END WHERE mission_id = p_mission_id AND traveler_id = p_traveler_id AND status = 'started';
  IF NOT FOUND THEN RAISE EXCEPTION 'Mission must be started first' USING ERRCODE = 'P0001'; END IF;
  IF next_status = 'completed' THEN
    PERFORM public.apply_guild_mission_reward(p_mission_id, p_traveler_id);
    UPDATE public.guild_mission_progress SET reward_claimed_at = now() WHERE mission_id = p_mission_id AND traveler_id = p_traveler_id;
  END IF;
  RETURN next_status;
END $$;--> statement-breakpoint

CREATE FUNCTION public.review_guild_mission(p_mission_id uuid, p_member_traveler_id uuid, p_reviewer_traveler_id uuid, p_approve boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE mission_guild_id uuid; next_status text;
BEGIN
  IF NOT public.owns_traveler(p_reviewer_traveler_id) THEN RAISE EXCEPTION 'Reviewer not owned' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO mission_guild_id FROM public.guild_missions WHERE id = p_mission_id AND completion_mode = 'leader_approval';
  IF mission_guild_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.guild_members WHERE guild_id = mission_guild_id AND traveler_id = p_reviewer_traveler_id AND role = 'leader' AND status = 'active') THEN RAISE EXCEPTION 'Leader role required' USING ERRCODE = '42501'; END IF;
  next_status := CASE WHEN p_approve THEN 'completed' ELSE 'rejected' END;
  UPDATE public.guild_mission_progress SET status = next_status, approved_at = CASE WHEN p_approve THEN now() ELSE NULL END, approved_by_traveler_id = p_reviewer_traveler_id, completed_at = CASE WHEN p_approve THEN now() ELSE NULL END WHERE mission_id = p_mission_id AND traveler_id = p_member_traveler_id AND status = 'pending_approval';
  IF NOT FOUND THEN RAISE EXCEPTION 'Pending submission unavailable' USING ERRCODE = 'P0001'; END IF;
  IF p_approve THEN
    PERFORM public.apply_guild_mission_reward(p_mission_id, p_member_traveler_id);
    UPDATE public.guild_mission_progress SET reward_claimed_at = now() WHERE mission_id = p_mission_id AND traveler_id = p_member_traveler_id;
  END IF;
  RETURN next_status;
END $$;--> statement-breakpoint

CREATE FUNCTION public.list_guild_members(p_requester_traveler_id uuid)
RETURNS TABLE(traveler_id uuid, traveler_name text, role text, member_status text, joined_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT t.id, t.name, gm.role, gm.status, gm.joined_at FROM public.guild_members own
  JOIN public.guild_members gm ON gm.guild_id = own.guild_id JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE own.traveler_id = p_requester_traveler_id AND own.status = 'active' AND public.owns_traveler(p_requester_traveler_id) ORDER BY gm.joined_at
$$;--> statement-breakpoint

CREATE FUNCTION public.list_guild_join_requests(p_leader_traveler_id uuid)
RETURNS TABLE(request_id uuid, traveler_id uuid, traveler_name text, request_status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT r.id, t.id, t.name, r.status, r.created_at FROM public.guild_members own
  JOIN public.guild_join_requests r ON r.guild_id = own.guild_id JOIN public.travelers t ON t.id = r.traveler_id
  WHERE own.traveler_id = p_leader_traveler_id AND own.role = 'leader' AND own.status = 'active' AND public.owns_traveler(p_leader_traveler_id) ORDER BY r.created_at
$$;--> statement-breakpoint

CREATE FUNCTION public.list_guild_mission_progress(p_mission_id uuid, p_leader_traveler_id uuid)
RETURNS TABLE(traveler_id uuid, traveler_name text, progress_status text, completion_note text, submitted_at timestamptz, completed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT t.id, t.name, coalesce(p.status, 'available'), p.completion_note, p.submitted_at, p.completed_at
  FROM public.guild_missions m JOIN public.guild_members gm ON gm.guild_id = m.guild_id AND gm.status = 'active'
  JOIN public.travelers t ON t.id = gm.traveler_id LEFT JOIN public.guild_mission_progress p ON p.mission_id = m.id AND p.traveler_id = gm.traveler_id
  WHERE m.id = p_mission_id AND EXISTS (SELECT 1 FROM public.guild_members own WHERE own.guild_id = m.guild_id AND own.traveler_id = p_leader_traveler_id AND own.role = 'leader' AND own.status = 'active') AND public.owns_traveler(p_leader_traveler_id) ORDER BY t.name
$$;--> statement-breakpoint

REVOKE ALL ON TABLE public.guilds, public.guild_members, public.guild_invites, public.guild_join_requests, public.guild_missions, public.guild_mission_progress, public.guild_reward_claims FROM PUBLIC, anon;--> statement-breakpoint
GRANT SELECT ON TABLE public.guilds, public.guild_members, public.guild_invites, public.guild_join_requests, public.guild_missions, public.guild_mission_progress, public.guild_reward_claims TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.owns_traveler(uuid), public.is_active_guild_member(uuid), public.is_guild_leader(uuid), public.can_lead_mission(uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.owns_traveler(uuid), public.is_active_guild_member(uuid), public.is_guild_leader(uuid), public.can_lead_mission(uuid) TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.apply_guild_mission_reward(uuid, uuid) FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_guild(uuid,text,text), public.request_join_guild(uuid,uuid), public.review_guild_join_request(uuid,uuid,boolean), public.leave_guild(uuid), public.create_guild_mission(uuid,text,text,text,text,text,text,text,timestamptz,timestamptz,boolean,jsonb), public.publish_guild_mission(uuid,uuid), public.start_guild_mission(uuid,uuid), public.submit_guild_mission(uuid,uuid,text), public.review_guild_mission(uuid,uuid,uuid,boolean), public.list_guild_members(uuid), public.list_guild_join_requests(uuid), public.list_guild_mission_progress(uuid,uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_guild(uuid,text,text), public.request_join_guild(uuid,uuid), public.review_guild_join_request(uuid,uuid,boolean), public.leave_guild(uuid), public.create_guild_mission(uuid,text,text,text,text,text,text,text,timestamptz,timestamptz,boolean,jsonb), public.publish_guild_mission(uuid,uuid), public.start_guild_mission(uuid,uuid), public.submit_guild_mission(uuid,uuid,text), public.review_guild_mission(uuid,uuid,uuid,boolean), public.list_guild_members(uuid), public.list_guild_join_requests(uuid), public.list_guild_mission_progress(uuid,uuid) TO authenticated;
