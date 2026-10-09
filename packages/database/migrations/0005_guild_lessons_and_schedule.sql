-- Aplicar manualmente depois da 0004. Nenhuma agenda duplicada: eventos derivam de aulas e missões.
CREATE TABLE public.guild_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  created_by_traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
  related_mission_id uuid REFERENCES public.guild_missions(id) ON DELETE SET NULL,
  title text NOT NULL,
  theme text NOT NULL,
  bible_reference text NOT NULL,
  bible_url text,
  introduction text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  main_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  discussion_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  activity_text text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_lessons_status_check CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  CONSTRAINT guild_lessons_title_check CHECK (char_length(btrim(title)) BETWEEN 2 AND 100),
  CONSTRAINT guild_lessons_theme_check CHECK (char_length(btrim(theme)) BETWEEN 2 AND 100),
  CONSTRAINT guild_lessons_reference_check CHECK (char_length(btrim(bible_reference)) BETWEEN 2 AND 100),
  CONSTRAINT guild_lessons_url_check CHECK (bible_url IS NULL OR bible_url ~ '^https://www\.bible\.com/[A-Za-z0-9/._?=&%-]{1,240}$'),
  CONSTRAINT guild_lessons_introduction_check CHECK (char_length(introduction) <= 2000),
  CONSTRAINT guild_lessons_content_check CHECK (char_length(content) <= 10000),
  CONSTRAINT guild_lessons_published_content_check CHECK (status NOT IN ('published', 'completed') OR (char_length(btrim(content)) > 0 AND scheduled_at IS NOT NULL)),
  CONSTRAINT guild_lessons_activity_check CHECK (activity_text IS NULL OR char_length(activity_text) <= 2000),
  CONSTRAINT guild_lessons_points_check CHECK (jsonb_typeof(main_points) = 'array' AND jsonb_array_length(main_points) <= 12),
  CONSTRAINT guild_lessons_questions_check CHECK (jsonb_typeof(discussion_questions) = 'array' AND jsonb_array_length(discussion_questions) <= 12)
);--> statement-breakpoint
CREATE INDEX guild_lessons_guild_schedule_idx ON public.guild_lessons(guild_id, scheduled_at);--> statement-breakpoint
ALTER TABLE public.guild_lessons ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY guild_lessons_select_member ON public.guild_lessons FOR SELECT TO authenticated USING (
  public.is_active_guild_member(guild_id) AND (status IN ('published', 'completed') OR public.is_guild_leader(guild_id))
);--> statement-breakpoint
REVOKE ALL ON public.guild_lessons FROM PUBLIC, anon, authenticated;--> statement-breakpoint
GRANT SELECT ON public.guild_lessons TO authenticated;--> statement-breakpoint
CREATE TRIGGER guild_lessons_set_updated_at BEFORE UPDATE ON public.guild_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

CREATE FUNCTION public.save_guild_lesson(
  p_lesson_id uuid, p_leader_traveler_id uuid, p_title text, p_theme text,
  p_bible_reference text, p_bible_url text, p_introduction text, p_content text,
  p_main_points jsonb, p_discussion_questions jsonb, p_activity_text text,
  p_scheduled_at timestamptz, p_related_mission_id uuid, p_publish boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE guild_key uuid; lesson_key uuid; current_status text; point text;
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Leader unavailable' USING ERRCODE = '42501'; END IF;
  SELECT guild_id INTO guild_key FROM public.guild_members
    WHERE traveler_id = p_leader_traveler_id AND role = 'leader' AND status = 'active';
  IF guild_key IS NULL THEN RAISE EXCEPTION 'Leader unavailable' USING ERRCODE = '42501'; END IF;
  IF p_related_mission_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.guild_missions WHERE id = p_related_mission_id AND guild_id = guild_key AND status <> 'cancelled'
  ) THEN RAISE EXCEPTION 'Mission unavailable' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(p_main_points) IS DISTINCT FROM 'array' OR jsonb_typeof(p_discussion_questions) IS DISTINCT FROM 'array'
  THEN RAISE EXCEPTION 'Invalid lesson list' USING ERRCODE = '22023'; END IF;
  IF jsonb_array_length(p_main_points) > 12 OR jsonb_array_length(p_discussion_questions) > 12
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_main_points) AS entry(value) WHERE jsonb_typeof(value) <> 'string')
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_discussion_questions) AS entry(value) WHERE jsonb_typeof(value) <> 'string')
  THEN RAISE EXCEPTION 'Invalid lesson list' USING ERRCODE = '22023'; END IF;
  FOR point IN SELECT value FROM jsonb_array_elements_text(p_main_points) AS entry(value)
    UNION ALL SELECT value FROM jsonb_array_elements_text(p_discussion_questions) AS entry(value)
  LOOP
    IF char_length(btrim(point)) < 2 OR char_length(point) > 300 THEN
      RAISE EXCEPTION 'Invalid lesson entry' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF p_lesson_id IS NULL THEN
    INSERT INTO public.guild_lessons(guild_id, created_by_traveler_id, related_mission_id, title, theme,
      bible_reference, bible_url, introduction, content, main_points, discussion_questions, activity_text,
      scheduled_at, status, published_at)
    VALUES (guild_key, p_leader_traveler_id, p_related_mission_id, btrim(p_title), btrim(p_theme),
      btrim(p_bible_reference), nullif(btrim(coalesce(p_bible_url, '')), ''), coalesce(p_introduction, ''),
      coalesce(p_content, ''), p_main_points, p_discussion_questions, nullif(btrim(coalesce(p_activity_text, '')), ''),
      p_scheduled_at, CASE WHEN p_publish THEN 'published' ELSE 'draft' END, CASE WHEN p_publish THEN now() END)
    RETURNING id INTO lesson_key;
  ELSE
    SELECT status INTO current_status FROM public.guild_lessons
      WHERE id = p_lesson_id AND guild_id = guild_key FOR UPDATE;
    IF current_status IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'Draft unavailable' USING ERRCODE = '42501'; END IF;
    UPDATE public.guild_lessons SET related_mission_id = p_related_mission_id, title = btrim(p_title), theme = btrim(p_theme),
      bible_reference = btrim(p_bible_reference), bible_url = nullif(btrim(coalesce(p_bible_url, '')), ''),
      introduction = coalesce(p_introduction, ''), content = coalesce(p_content, ''),
      main_points = p_main_points, discussion_questions = p_discussion_questions,
      activity_text = nullif(btrim(coalesce(p_activity_text, '')), ''), scheduled_at = p_scheduled_at,
      status = CASE WHEN p_publish THEN 'published' ELSE 'draft' END,
      published_at = CASE WHEN p_publish THEN now() ELSE NULL END
    WHERE id = p_lesson_id RETURNING id INTO lesson_key;
  END IF;
  RETURN lesson_key;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.save_guild_lesson(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,text,timestamptz,uuid,boolean) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.save_guild_lesson(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,text,timestamptz,uuid,boolean) TO authenticated;--> statement-breakpoint

CREATE FUNCTION public.set_guild_lesson_status(p_lesson_id uuid, p_leader_traveler_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) OR p_status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Action unavailable' USING ERRCODE = '42501';
  END IF;
  UPDATE public.guild_lessons lesson
    SET status = p_status, completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE NULL END
    WHERE lesson.id = p_lesson_id AND lesson.status = 'published'
      AND EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = lesson.guild_id
        AND gm.traveler_id = p_leader_traveler_id AND gm.role = 'leader' AND gm.status = 'active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Lesson unavailable' USING ERRCODE = '42501'; END IF;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.set_guild_lesson_status(uuid,uuid,text) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.set_guild_lesson_status(uuid,uuid,text) TO authenticated;--> statement-breakpoint

CREATE FUNCTION public.guild_lesson_activity_capture() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.guild_activity_log(guild_id, actor_traveler_id, event_type, entity_type, entity_id)
    VALUES (NEW.guild_id, NEW.created_by_traveler_id,
      CASE WHEN NEW.status = 'published' THEN 'lesson_published' ELSE 'lesson_created' END, 'lesson', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.guild_activity_log(guild_id, actor_traveler_id, event_type, entity_type, entity_id)
    VALUES (NEW.guild_id, NEW.created_by_traveler_id,
      CASE WHEN NEW.status = 'published' THEN 'lesson_published'
           WHEN NEW.status = 'completed' THEN 'lesson_completed'
           WHEN NEW.status = 'cancelled' THEN 'lesson_cancelled' ELSE 'lesson_created' END,
      'lesson', NEW.id);
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.guild_lesson_activity_capture() FROM PUBLIC, anon, authenticated;--> statement-breakpoint
CREATE TRIGGER guild_lesson_activity AFTER INSERT OR UPDATE ON public.guild_lessons
  FOR EACH ROW EXECUTE FUNCTION public.guild_lesson_activity_capture();

-- Perfil público mínimo; nunca retorna e-mail, Auth, Diário, notas ou reflexão.
CREATE FUNCTION public.guild_public_member_profile(p_requester_traveler_id uuid, p_member_traveler_id uuid)
RETURNS TABLE(level integer, completed_missions bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE guild_key uuid;
BEGIN
  IF NOT public.owns_traveler(p_requester_traveler_id) THEN
    RAISE EXCEPTION 'Member unavailable' USING ERRCODE = '42501';
  END IF;
  SELECT guild_id INTO guild_key FROM public.guild_members
    WHERE traveler_id = p_requester_traveler_id AND status = 'active';
  IF guild_key IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.guild_members WHERE guild_id = guild_key
      AND traveler_id = p_member_traveler_id AND status = 'active'
  ) THEN RAISE EXCEPTION 'Member unavailable' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT t.level,
    (SELECT count(*) FROM public.guild_mission_progress p JOIN public.guild_missions m ON m.id = p.mission_id
      WHERE m.guild_id = guild_key AND p.traveler_id = p_member_traveler_id AND p.status = 'completed')
    FROM public.travelers t WHERE t.id = p_member_traveler_id;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.guild_public_member_profile(uuid,uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.guild_public_member_profile(uuid,uuid) TO authenticated;
