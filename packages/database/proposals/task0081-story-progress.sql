-- TASK-0081: LOCAL PROPOSAL ONLY. Not registered as an applied migration.
-- Requires reviewed travelers/auth baseline. No wallet, guild or legacy schema changes.
BEGIN;
CREATE SCHEMA IF NOT EXISTS story_private;
REVOKE ALL ON SCHEMA story_private FROM PUBLIC, anon, authenticated;

CREATE TABLE public.story_definitions (
  id text PRIMARY KEY,
  world_id text NOT NULL,
  narrative_order integer NOT NULL UNIQUE CHECK (narrative_order > 0),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  content_ready boolean NOT NULL DEFAULT false,
  video_ready boolean NOT NULL DEFAULT false,
  reward_ready boolean NOT NULL DEFAULT false,
  required_steps text[] NOT NULL DEFAULT ARRAY['explore','reading','activity','quiz','reflection','video','reward'],
  CHECK (required_steps = ARRAY['explore','reading','activity','quiz','reflection','video','reward'])
);
INSERT INTO public.story_definitions(id,world_id,narrative_order) VALUES
 ('creation','origins',1), ('garden-choice','origins',2), ('cain-abel','origins',3),
 ('noah-ark','origins',4), ('babel','origins',5);

CREATE TABLE public.story_progress (
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  story_id text NOT NULL REFERENCES public.story_definitions(id),
  completed_steps text[] NOT NULL DEFAULT '{}',
  video_completed boolean NOT NULL DEFAULT false,
  reward_receipt text UNIQUE,
  completed_at timestamptz,
  PRIMARY KEY (traveler_id,story_id),
  CHECK (completed_at IS NULL OR (video_completed AND reward_receipt IS NOT NULL AND completed_steps @> ARRAY['explore','reading','activity','quiz','reflection','video','reward']))
);
CREATE TABLE story_private.step_receipts (
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  story_id text NOT NULL REFERENCES public.story_definitions(id),
  revision integer NOT NULL CHECK (revision > 0),
  step text NOT NULL CHECK (step IN ('explore','reading','activity','quiz','reflection','video','reward')),
  source text NOT NULL CHECK (source IN ('server-activity','self-report','provider-api','browser-events','economic-ledger')),
  proof_reference text NOT NULL CHECK (length(proof_reference) BETWEEN 1 AND 200),
  observed_seconds numeric CHECK (observed_seconds >= 0),
  duration_seconds numeric CHECK (duration_seconds > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (traveler_id,story_id,revision,step),
  CHECK (step <> 'video' OR (source IN ('provider-api','browser-events') AND observed_seconds IS NOT NULL AND duration_seconds IS NOT NULL AND observed_seconds >= duration_seconds)),
  CHECK (step <> 'reward' OR source = 'economic-ledger')
);
-- Receipt ingestion has no browser endpoint. A future reviewed validator must check
-- activity/session/media revision before writing. Browser events alone are not anti-fraud.
ALTER TABLE public.story_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.step_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.story_definitions, public.story_progress, story_private.step_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.story_definitions, public.story_progress TO authenticated;
GRANT USAGE ON SCHEMA story_private TO service_role;
GRANT SELECT, INSERT, UPDATE ON story_private.step_receipts TO service_role;
GRANT SELECT ON public.story_definitions, public.story_progress TO service_role;
CREATE POLICY story_definitions_read ON public.story_definitions FOR SELECT TO authenticated
 USING (auth.uid() IS NOT NULL AND NOT COALESCE((auth.jwt()->>'is_anonymous')::boolean,true));
CREATE POLICY story_progress_owner ON public.story_progress FOR SELECT TO authenticated
 USING (public.owns_traveler(traveler_id) AND NOT COALESCE((auth.jwt()->>'is_anonymous')::boolean,true));

CREATE FUNCTION story_private.refresh_progress() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_revision integer; v_steps text[]; v_video boolean; v_reward text;
BEGIN
  -- Same traveler lock as complete_story: concurrent steps/completions serialize.
  PERFORM 1 FROM public.travelers WHERE id = NEW.traveler_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.story_progress WHERE traveler_id=NEW.traveler_id AND story_id=NEW.story_id AND completed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Story already completed';
  END IF;
  SELECT revision INTO STRICT v_revision FROM public.story_definitions WHERE id=NEW.story_id;
  IF NEW.revision <> v_revision THEN RAISE EXCEPTION 'Stale story revision'; END IF;
  SELECT array_agg(step ORDER BY step), bool_or(step='video'), max(proof_reference) FILTER (WHERE step='reward')
    INTO v_steps,v_video,v_reward FROM story_private.step_receipts
    WHERE traveler_id=NEW.traveler_id AND story_id=NEW.story_id AND revision=v_revision;
  INSERT INTO public.story_progress(traveler_id,story_id,completed_steps,video_completed,reward_receipt)
    VALUES(NEW.traveler_id,NEW.story_id,v_steps,COALESCE(v_video,false),v_reward)
    ON CONFLICT(traveler_id,story_id) DO UPDATE SET completed_steps=EXCLUDED.completed_steps,
      video_completed=EXCLUDED.video_completed,reward_receipt=EXCLUDED.reward_receipt;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION story_private.refresh_progress() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER story_receipt_refresh AFTER INSERT OR UPDATE ON story_private.step_receipts
 FOR EACH ROW EXECUTE FUNCTION story_private.refresh_progress();

CREATE FUNCTION public.complete_story(p_traveler_id uuid,p_story_id text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_definition public.story_definitions; v_progress public.story_progress; v_steps text[];
BEGIN
  -- Identity is the existing Auth account; no leader role or guild membership.
  PERFORM 1 FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
    WHERE t.id=p_traveler_id AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE FOR UPDATE OF t;
  IF NOT FOUND THEN RAISE EXCEPTION 'Story access denied' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_definition FROM public.story_definitions WHERE id=p_story_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown story'; END IF;
  SELECT * INTO v_progress FROM public.story_progress WHERE traveler_id=p_traveler_id AND story_id=p_story_id;
  IF v_progress.completed_at IS NOT NULL THEN RETURN false; END IF;
  IF NOT (v_definition.content_ready AND v_definition.video_ready AND v_definition.reward_ready) THEN
    RAISE EXCEPTION 'Story dependencies pending';
  END IF;
  IF EXISTS (SELECT 1 FROM public.story_definitions d WHERE d.narrative_order < v_definition.narrative_order
    AND NOT EXISTS (SELECT 1 FROM public.story_progress p WHERE p.traveler_id=p_traveler_id AND p.story_id=d.id AND p.completed_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'Previous story incomplete';
  END IF;
  SELECT array_agg(step) INTO v_steps FROM story_private.step_receipts
    WHERE traveler_id=p_traveler_id AND story_id=p_story_id AND revision=v_definition.revision;
  IF v_steps IS NULL OR NOT (v_steps @> v_definition.required_steps)
    OR NOT COALESCE(v_progress.video_completed,false) OR v_progress.reward_receipt IS NULL THEN
    RAISE EXCEPTION 'Story requirements incomplete';
  END IF;
  UPDATE public.story_progress SET completed_at=clock_timestamp() WHERE traveler_id=p_traveler_id AND story_id=p_story_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.complete_story(uuid,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.complete_story(uuid,text) TO authenticated;
COMMENT ON FUNCTION public.complete_story(uuid,text) IS 'TASK-0081 local proposal: validates receipts, never grants economic rewards. All content/video/reward flags start false.';
COMMIT;
