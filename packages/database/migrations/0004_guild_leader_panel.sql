-- Apply manually after 0003. Activity is deliberately leader-only and contains no notes or auth data.
CREATE TABLE public.guild_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  actor_traveler_id uuid REFERENCES public.travelers(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_activity_log_metadata_size CHECK (octet_length(metadata::text) <= 512)
);--> statement-breakpoint
CREATE INDEX guild_activity_log_recent_idx ON public.guild_activity_log(guild_id, created_at DESC);--> statement-breakpoint
ALTER TABLE public.guild_activity_log ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY guild_activity_log_leader_read ON public.guild_activity_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.guild_members gm JOIN public.travelers t ON t.id = gm.traveler_id
    WHERE gm.guild_id = guild_activity_log.guild_id AND gm.role = 'leader' AND gm.status = 'active'
      AND t.user_id = (SELECT auth.uid()))
);--> statement-breakpoint
REVOKE ALL ON public.guild_activity_log FROM PUBLIC, anon;--> statement-breakpoint
GRANT SELECT ON public.guild_activity_log TO authenticated;--> statement-breakpoint

ALTER TABLE public.guild_mission_progress ADD COLUMN review_note text
  CONSTRAINT guild_mission_progress_review_note_length CHECK (review_note IS NULL OR char_length(review_note) <= 500);--> statement-breakpoint

CREATE FUNCTION public.guild_activity_capture() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE event_name text; guild_key uuid; actor_key uuid; entity_kind text; entity_key uuid;
BEGIN
  IF TG_TABLE_NAME = 'guilds' THEN
    IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
    event_name := 'guild_created'; guild_key := NEW.id; actor_key := NEW.leader_traveler_id; entity_kind := 'guild'; entity_key := NEW.id;
  ELSIF TG_TABLE_NAME = 'guild_members' THEN
    IF TG_OP = 'INSERT' AND NEW.role <> 'leader' AND NEW.status = 'active' THEN event_name := 'member_joined';
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      event_name := CASE NEW.status WHEN 'active' THEN 'member_joined' WHEN 'left' THEN 'member_left' WHEN 'removed' THEN 'member_removed' ELSE NULL END;
    END IF;
    guild_key := NEW.guild_id; actor_key := NEW.traveler_id; entity_kind := 'member'; entity_key := NEW.traveler_id;
    IF event_name = 'member_removed' THEN
      SELECT gm.traveler_id INTO actor_key FROM public.guild_members gm JOIN public.travelers t ON t.id = gm.traveler_id
      WHERE gm.guild_id = NEW.guild_id AND gm.role = 'leader' AND gm.status = 'active' AND t.user_id = auth.uid() LIMIT 1;
    END IF;
  ELSIF TG_TABLE_NAME = 'guild_missions' THEN
    IF TG_OP = 'INSERT' THEN event_name := 'mission_created';
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      event_name := CASE NEW.status WHEN 'published' THEN 'mission_published' WHEN 'closed' THEN 'mission_closed' WHEN 'cancelled' THEN 'draft_deleted' ELSE NULL END;
    END IF;
    guild_key := NEW.guild_id; actor_key := NEW.created_by_traveler_id; entity_kind := 'mission'; entity_key := NEW.id;
  ELSIF TG_TABLE_NAME = 'guild_mission_progress' THEN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      event_name := CASE NEW.status WHEN 'pending_approval' THEN 'mission_submitted' WHEN 'completed' THEN 'mission_completed' WHEN 'rejected' THEN 'mission_rejected' ELSE NULL END;
    END IF;
    SELECT guild_id INTO guild_key FROM public.guild_missions WHERE id = NEW.mission_id;
    actor_key := coalesce(NEW.approved_by_traveler_id, NEW.traveler_id); entity_kind := 'mission'; entity_key := NEW.mission_id;
  ELSIF TG_TABLE_NAME = 'guild_reward_claims' THEN
    IF TG_OP = 'INSERT' THEN event_name := 'reward_processed'; END IF;
    SELECT guild_id INTO guild_key FROM public.guild_missions WHERE id = NEW.mission_id;
    actor_key := NEW.traveler_id; entity_kind := 'mission'; entity_key := NEW.mission_id;
  END IF;
  IF event_name IS NOT NULL THEN
    INSERT INTO public.guild_activity_log(guild_id, actor_traveler_id, event_type, entity_type, entity_id)
    VALUES (guild_key, actor_key, event_name, entity_kind, entity_key);
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER guild_activity_guild AFTER INSERT ON public.guilds FOR EACH ROW EXECUTE FUNCTION public.guild_activity_capture();--> statement-breakpoint
CREATE TRIGGER guild_activity_member AFTER INSERT OR UPDATE ON public.guild_members FOR EACH ROW EXECUTE FUNCTION public.guild_activity_capture();--> statement-breakpoint
CREATE TRIGGER guild_activity_mission AFTER INSERT OR UPDATE ON public.guild_missions FOR EACH ROW EXECUTE FUNCTION public.guild_activity_capture();--> statement-breakpoint
CREATE TRIGGER guild_activity_progress AFTER UPDATE ON public.guild_mission_progress FOR EACH ROW EXECUTE FUNCTION public.guild_activity_capture();--> statement-breakpoint
CREATE TRIGGER guild_activity_reward AFTER INSERT ON public.guild_reward_claims FOR EACH ROW EXECUTE FUNCTION public.guild_activity_capture();--> statement-breakpoint
REVOKE ALL ON FUNCTION public.guild_activity_capture() FROM PUBLIC, anon, authenticated;--> statement-breakpoint

CREATE FUNCTION public.update_guild_mission_draft(
  p_mission_id uuid, p_leader_traveler_id uuid, p_title text, p_description text, p_mission_type text,
  p_bible_reference text, p_bible_url text, p_completion_mode text, p_reward_tier text,
  p_starts_at timestamptz, p_due_at timestamptz
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Leader not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_missions m SET title = btrim(p_title), description = nullif(btrim(coalesce(p_description,'')),''),
    mission_type = p_mission_type, bible_reference = nullif(btrim(coalesce(p_bible_reference,'')),''),
    bible_url = nullif(btrim(coalesce(p_bible_url,'')),''), completion_mode = p_completion_mode,
    requires_leader_approval = p_completion_mode = 'leader_approval', reward_tier = p_reward_tier,
    starts_at = p_starts_at, due_at = p_due_at, updated_at = now()
  WHERE m.id = p_mission_id AND m.status = 'draft'
    AND NOT EXISTS (SELECT 1 FROM public.guild_mission_progress p WHERE p.mission_id = m.id)
    AND EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = m.guild_id
      AND gm.traveler_id = p_leader_traveler_id AND gm.role = 'leader' AND gm.status = 'active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Draft unavailable' USING ERRCODE = '42501'; END IF;
END $$;--> statement-breakpoint

CREATE FUNCTION public.delete_guild_mission_draft(p_mission_id uuid, p_leader_traveler_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Leader not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_missions m SET status = 'cancelled', updated_at = now()
  WHERE m.id = p_mission_id AND m.status = 'draft'
    AND NOT EXISTS (SELECT 1 FROM public.guild_mission_progress p WHERE p.mission_id = m.id)
    AND EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = m.guild_id
      AND gm.traveler_id = p_leader_traveler_id AND gm.role = 'leader' AND gm.status = 'active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Draft unavailable' USING ERRCODE = '42501'; END IF;
END $$;--> statement-breakpoint

CREATE FUNCTION public.close_guild_mission(p_mission_id uuid, p_leader_traveler_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Leader not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_missions m SET status = 'closed', closed_at = now(), updated_at = now()
  WHERE m.id = p_mission_id AND m.status = 'published'
    AND EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = m.guild_id
      AND gm.traveler_id = p_leader_traveler_id AND gm.role = 'leader' AND gm.status = 'active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Mission unavailable' USING ERRCODE = '42501'; END IF;
END $$;--> statement-breakpoint

CREATE FUNCTION public.remove_guild_member(p_member_traveler_id uuid, p_leader_traveler_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Leader not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_members target SET status = 'removed', updated_at = now()
  WHERE target.traveler_id = p_member_traveler_id AND target.role = 'member' AND target.status = 'active'
    AND EXISTS (SELECT 1 FROM public.guild_members own WHERE own.guild_id = target.guild_id
      AND own.traveler_id = p_leader_traveler_id AND own.role = 'leader' AND own.status = 'active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Member unavailable' USING ERRCODE = '42501'; END IF;
END $$;--> statement-breakpoint

CREATE FUNCTION public.review_guild_mission_with_guidance(
  p_mission_id uuid, p_member_traveler_id uuid, p_reviewer_traveler_id uuid, p_approve boolean, p_guidance text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE next_status text;
BEGIN
  IF char_length(coalesce(p_guidance,'')) > 500 THEN RAISE EXCEPTION 'Guidance too long' USING ERRCODE = '22023'; END IF;
  next_status := public.review_guild_mission(p_mission_id, p_member_traveler_id, p_reviewer_traveler_id, p_approve);
  UPDATE public.guild_mission_progress SET review_note = CASE WHEN p_approve THEN NULL ELSE nullif(btrim(coalesce(p_guidance,'')),'') END
  WHERE mission_id = p_mission_id AND traveler_id = p_member_traveler_id;
  RETURN next_status;
END $$;--> statement-breakpoint

CREATE FUNCTION public.guild_admin_stats(p_leader_traveler_id uuid)
RETURNS TABLE(mission_id uuid, participants bigint, completed bigint, pending bigint, completed_recent bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) OR NOT EXISTS
    (SELECT 1 FROM public.guild_members WHERE traveler_id = p_leader_traveler_id AND role = 'leader' AND status = 'active')
  THEN RAISE EXCEPTION 'Leader role required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT m.id, count(p.id), count(p.id) FILTER (WHERE p.status = 'completed'),
    count(p.id) FILTER (WHERE p.status = 'pending_approval' AND EXISTS
      (SELECT 1 FROM public.guild_members participant WHERE participant.guild_id = m.guild_id
        AND participant.traveler_id = p.traveler_id AND participant.status = 'active')),
    count(p.id) FILTER (WHERE p.status = 'completed' AND p.completed_at >= now() - interval '30 days')
  FROM public.guild_missions m JOIN public.guild_members own ON own.guild_id = m.guild_id
  LEFT JOIN public.guild_mission_progress p ON p.mission_id = m.id
  WHERE own.traveler_id = p_leader_traveler_id AND own.role = 'leader' AND own.status = 'active'
    AND m.status <> 'cancelled' GROUP BY m.id;
END $$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.update_guild_mission_draft(uuid,uuid,text,text,text,text,text,text,text,timestamptz,timestamptz), public.delete_guild_mission_draft(uuid,uuid), public.close_guild_mission(uuid,uuid), public.remove_guild_member(uuid,uuid), public.review_guild_mission_with_guidance(uuid,uuid,uuid,boolean,text), public.guild_admin_stats(uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.update_guild_mission_draft(uuid,uuid,text,text,text,text,text,text,text,timestamptz,timestamptz), public.delete_guild_mission_draft(uuid,uuid), public.close_guild_mission(uuid,uuid), public.remove_guild_member(uuid,uuid), public.review_guild_mission_with_guidance(uuid,uuid,uuid,boolean,text), public.guild_admin_stats(uuid) TO authenticated;
