-- STORY-007: LOCAL PROPOSAL ONLY. Depends on TASK-0081 story_definitions.
-- Not journaled; do not apply remotely. Checkpoints never grant economic value.
BEGIN;

CREATE TABLE story_private.creation_checkpoint_revisions (
  revision integer PRIMARY KEY CHECK (revision > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Candidate keys mirror the unapproved demo. Draft rows cannot be consumed by RPCs.
INSERT INTO story_private.creation_checkpoint_revisions(revision,status) VALUES (1,'draft');
CREATE TABLE story_private.creation_day_content (
  revision integer NOT NULL REFERENCES story_private.creation_checkpoint_revisions(revision),
  day_number smallint NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  option_count smallint NOT NULL CHECK (option_count BETWEEN 2 AND 5),
  answer_index smallint NOT NULL CHECK (answer_index BETWEEN 1 AND option_count),
  reference text NOT NULL CHECK (length(reference) BETWEEN 1 AND 80),
  PRIMARY KEY (revision,day_number)
);
INSERT INTO story_private.creation_day_content(revision,day_number,option_count,answer_index,reference) VALUES
  (1,1,2,1,'Gênesis 1:3–5'), (1,2,2,2,'Gênesis 1:6–8'),
  (1,3,2,1,'Gênesis 1:9–13'), (1,4,2,2,'Gênesis 1:14–19'),
  (1,5,2,1,'Gênesis 1:20–23'), (1,6,2,2,'Gênesis 1:24–31'),
  (1,7,2,1,'Gênesis 2:1–3');

CREATE TABLE story_private.creation_quiz_content (
  revision integer PRIMARY KEY REFERENCES story_private.creation_checkpoint_revisions(revision),
  answer_indices smallint[] NOT NULL CHECK (cardinality(answer_indices)=5),
  reference text NOT NULL CHECK (length(reference) BETWEEN 1 AND 80),
  CHECK (array_position(answer_indices,NULL) IS NULL AND answer_indices <@ ARRAY[1,2,3]::smallint[])
);
-- Candidate key for the five-question demo only; editorial publication remains blocked.
INSERT INTO story_private.creation_quiz_content(revision,answer_indices,reference)
VALUES (1,ARRAY[2,1,3,2,3]::smallint[],'Gênesis 1:3–2:3');

CREATE FUNCTION story_private.guard_creation_published_content() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM story_private.creation_checkpoint_revisions r
    WHERE (TG_OP <> 'INSERT' AND r.revision=OLD.revision)
       OR (TG_OP <> 'DELETE' AND r.revision=NEW.revision)
    ORDER BY revision FOR SHARE;
  IF EXISTS(SELECT 1 FROM story_private.creation_checkpoint_revisions r
    WHERE r.status IN ('published','revoked') AND
      ((TG_OP <> 'INSERT' AND r.revision=OLD.revision)
       OR (TG_OP <> 'DELETE' AND r.revision=NEW.revision))) THEN
    RAISE EXCEPTION 'Published creation content is immutable; create a new revision';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER creation_day_content_immutable BEFORE INSERT OR UPDATE OR DELETE ON story_private.creation_day_content
  FOR EACH ROW EXECUTE FUNCTION story_private.guard_creation_published_content();
CREATE TRIGGER creation_quiz_content_immutable BEFORE INSERT OR UPDATE OR DELETE ON story_private.creation_quiz_content
  FOR EACH ROW EXECUTE FUNCTION story_private.guard_creation_published_content();

CREATE FUNCTION story_private.guard_creation_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF OLD.status='published' AND NEW.status NOT IN ('published','revoked') THEN
    RAISE EXCEPTION 'Published creation revision can only be revoked';
  END IF;
  IF OLD.status='revoked' AND NEW.status<>'revoked' THEN
    RAISE EXCEPTION 'Revoked creation revision cannot be reactivated';
  END IF;
  IF NEW.revision<>OLD.revision THEN RAISE EXCEPTION 'Creation revision number is immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER creation_revision_state_guard BEFORE UPDATE ON story_private.creation_checkpoint_revisions
  FOR EACH ROW EXECUTE FUNCTION story_private.guard_creation_revision();

CREATE TABLE story_private.creation_video_publications (
  revision integer PRIMARY KEY REFERENCES story_private.creation_checkpoint_revisions(revision),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','revoked')),
  provider text,
  immutable_video_id text,
  media_sha256 text,
  duration_seconds integer CHECK (duration_seconds>0),
  language text,
  captions_sha256 text,
  accessible_alternative text,
  editorial_reference text,
  license_reference text,
  verification_policy_version text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status<>'published' OR
    (provider IS NOT NULL AND immutable_video_id IS NOT NULL AND media_sha256 IS NOT NULL AND media_sha256 ~ '^[0-9a-f]{64}$'
      AND duration_seconds IS NOT NULL AND language IS NOT NULL AND captions_sha256 IS NOT NULL AND captions_sha256 ~ '^[0-9a-f]{64}$'
      AND accessible_alternative IS NOT NULL AND editorial_reference IS NOT NULL
      AND license_reference IS NOT NULL AND verification_policy_version IS NOT NULL))
);
INSERT INTO story_private.creation_video_publications(revision,status) VALUES (1,'draft');
CREATE FUNCTION story_private.guard_creation_video_publication() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF OLD.status='revoked' AND NEW.status<>'revoked' THEN
    RAISE EXCEPTION 'Revoked creation video publication cannot be reactivated';
  END IF;
  IF OLD.status='published' AND (NEW.status NOT IN ('published','revoked') OR
    ROW(NEW.revision,NEW.provider,NEW.immutable_video_id,NEW.media_sha256,NEW.duration_seconds,
      NEW.language,NEW.captions_sha256,NEW.accessible_alternative,NEW.editorial_reference,
      NEW.license_reference,NEW.verification_policy_version) IS DISTINCT FROM
    ROW(OLD.revision,OLD.provider,OLD.immutable_video_id,OLD.media_sha256,OLD.duration_seconds,
      OLD.language,OLD.captions_sha256,OLD.accessible_alternative,OLD.editorial_reference,
      OLD.license_reference,OLD.verification_policy_version)) THEN
    RAISE EXCEPTION 'Published video manifest is immutable; create a new revision';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER creation_video_publication_guard BEFORE UPDATE ON story_private.creation_video_publications
  FOR EACH ROW EXECUTE FUNCTION story_private.guard_creation_video_publication();

CREATE TABLE story_private.creation_activity_receipts (
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  story_id text NOT NULL DEFAULT 'creation' CHECK (story_id='creation'),
  revision integer NOT NULL REFERENCES story_private.creation_checkpoint_revisions(revision),
  activity text NOT NULL CHECK (activity IN ('day','harmony')),
  activity_key text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (traveler_id,story_id,revision,activity,activity_key),
  CHECK ((activity='day' AND activity_key ~ '^day:[1-7]$') OR
         (activity='harmony' AND activity_key='seven-symbols:v1'))
);
CREATE TABLE story_private.creation_quiz_attempts (
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  story_id text NOT NULL DEFAULT 'creation' CHECK (story_id='creation'),
  revision integer NOT NULL REFERENCES story_private.creation_checkpoint_revisions(revision),
  operation_id uuid NOT NULL,
  answers smallint[] NOT NULL CHECK (cardinality(answers)=5),
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 5),
  perfect boolean GENERATED ALWAYS AS (score=5) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (traveler_id,story_id,revision,operation_id),
  CHECK (array_position(answers,NULL) IS NULL AND answers <@ ARRAY[1,2,3]::smallint[])
);

ALTER TABLE story_private.creation_checkpoint_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_day_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_quiz_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_video_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_activity_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_quiz_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON story_private.creation_checkpoint_revisions,story_private.creation_day_content,
  story_private.creation_quiz_content,story_private.creation_activity_receipts,
  story_private.creation_quiz_attempts,story_private.creation_video_publications FROM PUBLIC,anon,authenticated,service_role;
-- Neither browser nor service_role writes evidence/config. Owner-run, reviewed publication
-- updates config; SECURITY DEFINER RPCs alone write validated activity and quiz receipts.

CREATE FUNCTION story_private.require_creation_revision(p_revision integer)
RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM public.story_definitions d
    JOIN story_private.creation_checkpoint_revisions r ON r.revision=d.revision
    WHERE d.id='creation' AND d.revision=p_revision AND d.content_ready AND r.status='published'
    FOR SHARE OF d,r;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Creation revision unavailable' USING ERRCODE='55000';
  END IF;
END $$;
REVOKE ALL ON FUNCTION story_private.require_creation_revision(integer),
  story_private.guard_creation_published_content(),story_private.guard_creation_revision(),
  story_private.guard_creation_video_publication() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.submit_creation_day(p_traveler_id uuid,p_revision integer,p_day smallint,p_answer_index smallint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_active boolean; v_answer smallint; v_options smallint;
  v_reference text; v_result jsonb; v_key text;
BEGIN
  SELECT d.revision,t.is_active INTO STRICT v_revision,v_active
    FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
    JOIN public.story_definitions d ON d.id='creation'
    WHERE t.id=p_traveler_id AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
    FOR UPDATE OF t;
  IF v_active IS DISTINCT FROM true THEN RAISE EXCEPTION 'Active traveler required' USING ERRCODE='42501'; END IF;
  IF p_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stale creation revision' USING ERRCODE='55000'; END IF;
  PERFORM story_private.require_creation_revision(v_revision);
  IF p_day IS NULL OR p_day NOT BETWEEN 1 AND 7 THEN RAISE EXCEPTION 'Invalid day' USING ERRCODE='22023'; END IF;
  SELECT answer_index,option_count,reference INTO STRICT v_answer,v_options,v_reference
    FROM story_private.creation_day_content WHERE revision=v_revision AND day_number=p_day;
  v_key:='day:'||p_day::text;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts
    WHERE traveler_id=p_traveler_id AND story_id='creation' AND revision=v_revision AND activity='day' AND activity_key=v_key;
  IF FOUND THEN RETURN v_result; END IF;
  IF p_answer_index IS NULL OR p_answer_index NOT BETWEEN 1 AND v_options THEN RAISE EXCEPTION 'Invalid answer' USING ERRCODE='22023'; END IF;
  IF p_day>1 AND (SELECT count(*) FROM story_private.creation_activity_receipts r
    WHERE r.traveler_id=p_traveler_id AND r.story_id='creation' AND r.revision=v_revision
      AND r.activity='day' AND r.activity_key=ANY(ARRAY(
        SELECT 'day:'||prior.day_no::text FROM generate_series(1,p_day-1) AS prior(day_no))))<>p_day-1 THEN
    RAISE EXCEPTION 'Previous creation day incomplete' USING ERRCODE='55000';
  END IF;
  IF p_answer_index<>v_answer THEN RETURN jsonb_build_object('version',1,'completed',false,'correct',false,'reference',v_reference); END IF;
  v_result:=jsonb_build_object('version',1,'completed',true,'correct',true,'day',p_day,
    'revision',v_revision,'reference',v_reference);
  INSERT INTO story_private.creation_activity_receipts(traveler_id,revision,activity,activity_key,result)
    VALUES(p_traveler_id,v_revision,'day',v_key,v_result) ON CONFLICT DO NOTHING;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts
    WHERE traveler_id=p_traveler_id AND story_id='creation' AND revision=v_revision AND activity='day' AND activity_key=v_key;
  RETURN v_result;
END $$;

CREATE FUNCTION public.submit_creation_harmony(p_traveler_id uuid,p_revision integer,p_order smallint[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_active boolean; v_result jsonb;
BEGIN
  SELECT d.revision,t.is_active INTO STRICT v_revision,v_active
    FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
    JOIN public.story_definitions d ON d.id='creation'
    WHERE t.id=p_traveler_id AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE FOR UPDATE OF t;
  IF v_active IS DISTINCT FROM true THEN RAISE EXCEPTION 'Active traveler required' USING ERRCODE='42501'; END IF;
  IF p_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stale creation revision' USING ERRCODE='55000'; END IF;
  PERFORM story_private.require_creation_revision(v_revision);
  IF (SELECT count(*) FROM story_private.creation_activity_receipts r WHERE r.traveler_id=p_traveler_id
    AND r.story_id='creation' AND r.revision=v_revision AND r.activity='day')<>7 THEN
    RAISE EXCEPTION 'Seven creation days incomplete' USING ERRCODE='55000';
  END IF;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id
    AND story_id='creation' AND revision=v_revision AND activity='harmony' AND activity_key='seven-symbols:v1';
  IF FOUND THEN RETURN v_result; END IF;
  IF p_order IS NULL OR cardinality(p_order)<>7 OR p_order<>ARRAY[1,2,3,4,5,6,7]::smallint[] THEN
    RETURN jsonb_build_object('version',1,'completed',false,'correct',false,'reference','Gênesis 1:1–2:3');
  END IF;
  v_result:=jsonb_build_object('version',1,'completed',true,'correct',true,'revision',v_revision,
    'reference','Gênesis 1:1–2:3');
  INSERT INTO story_private.creation_activity_receipts(traveler_id,revision,activity,activity_key,result)
    VALUES(p_traveler_id,v_revision,'harmony','seven-symbols:v1',v_result) ON CONFLICT DO NOTHING;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id
    AND story_id='creation' AND revision=v_revision AND activity='harmony' AND activity_key='seven-symbols:v1';
  RETURN v_result;
END $$;

CREATE FUNCTION public.submit_creation_quiz(p_traveler_id uuid,p_revision integer,p_operation_id uuid,p_answers smallint[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_active boolean; v_score smallint; v_result jsonb; v_saved story_private.creation_quiz_attempts;
BEGIN
  SELECT d.revision,t.is_active INTO STRICT v_revision,v_active
    FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
    JOIN public.story_definitions d ON d.id='creation'
    WHERE t.id=p_traveler_id AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE FOR UPDATE OF t;
  IF v_active IS DISTINCT FROM true THEN RAISE EXCEPTION 'Active traveler required' USING ERRCODE='42501'; END IF;
  IF p_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stale creation revision' USING ERRCODE='55000'; END IF;
  PERFORM story_private.require_creation_revision(v_revision);
  IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Invalid quiz attempt' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
    AND story_id='creation' AND revision=v_revision AND operation_id=p_operation_id) THEN
    SELECT * INTO STRICT v_saved FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision AND operation_id=p_operation_id;
    RETURN jsonb_build_object('version',1,'attemptId',v_saved.operation_id,'score',v_saved.score,
      'total',5,'perfect',v_saved.perfect,'revision',v_revision,'replayed',true);
  END IF;
  IF p_operation_id IS NULL OR p_answers IS NULL OR cardinality(p_answers)<>5
    OR array_lower(p_answers,1)<>1 OR array_upper(p_answers,1)<>5
    OR array_position(p_answers,NULL) IS NOT NULL OR NOT (p_answers <@ ARRAY[1,2,3]::smallint[]) THEN
    RAISE EXCEPTION 'Invalid quiz attempt' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM story_private.creation_activity_receipts r WHERE r.traveler_id=p_traveler_id
    AND r.story_id='creation' AND r.revision=v_revision AND r.activity='harmony' AND r.activity_key='seven-symbols:v1') THEN
    RAISE EXCEPTION 'Harmony incomplete' USING ERRCODE='55000';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM story_private.creation_quiz_content WHERE revision=v_revision) THEN
    RAISE EXCEPTION 'Quiz content unavailable' USING ERRCODE='55000';
  END IF;
  SELECT count(*)::smallint INTO v_score FROM story_private.creation_quiz_content c
    CROSS JOIN generate_series(1,5) AS question(position)
    WHERE c.revision=v_revision AND p_answers[question.position]=c.answer_indices[question.position];
  INSERT INTO story_private.creation_quiz_attempts(traveler_id,revision,operation_id,answers,score)
    VALUES(p_traveler_id,v_revision,p_operation_id,p_answers,v_score);
  RETURN jsonb_build_object('version',1,'attemptId',p_operation_id,'score',v_score,'total',5,
    'perfect',v_score=5,'revision',v_revision,'replayed',false);
END $$;

CREATE FUNCTION public.read_creation_checkpoints(p_traveler_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_active boolean; v_result jsonb;
BEGIN
  SELECT d.revision,t.is_active INTO STRICT v_revision,v_active FROM public.travelers t
    JOIN auth.users u ON u.id=t.user_id JOIN public.story_definitions d ON d.id='creation'
    WHERE t.id=p_traveler_id AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE;
  IF v_active IS DISTINCT FROM true THEN RAISE EXCEPTION 'Active traveler required' USING ERRCODE='42501'; END IF;
  SELECT jsonb_build_object('version',1,'storyId','creation','revision',v_revision,
    'completedDays',coalesce((SELECT jsonb_agg(split_part(activity_key,':',2)::int ORDER BY split_part(activity_key,':',2)::int)
      FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id AND story_id='creation'
        AND revision=v_revision AND activity='day'),'[]'::jsonb),
    'harmonyCompleted',EXISTS(SELECT 1 FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision AND activity='harmony'),
    'quizAttempts',coalesce((SELECT count(*) FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision),0),
    'bestQuizScore',(SELECT max(score) FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision),
    'available',EXISTS(SELECT 1 FROM public.story_definitions d JOIN story_private.creation_checkpoint_revisions r
      ON r.revision=d.revision WHERE d.id='creation' AND d.revision=v_revision AND d.content_ready AND r.status='published'),
    'videoCompleted',false) INTO v_result;
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.submit_creation_day(uuid,integer,smallint,smallint),
  public.submit_creation_harmony(uuid,integer,smallint[]),public.submit_creation_quiz(uuid,integer,uuid,smallint[]),
  public.read_creation_checkpoints(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.submit_creation_day(uuid,integer,smallint,smallint),
  public.submit_creation_harmony(uuid,integer,smallint[]),public.submit_creation_quiz(uuid,integer,uuid,smallint[]),
  public.read_creation_checkpoints(uuid) TO authenticated;
COMMENT ON FUNCTION public.submit_creation_day(uuid,integer,smallint,smallint) IS 'STORY-007 local proposal. Auth owner + active traveler; checks published server key and contiguous days; no economy write.';
COMMENT ON FUNCTION public.submit_creation_harmony(uuid,integer,smallint[]) IS 'STORY-007 local proposal. Requires seven current-revision day receipts; no economy write.';
COMMENT ON FUNCTION public.submit_creation_quiz(uuid,integer,uuid,smallint[]) IS 'STORY-007 local proposal. Idempotent by account/traveler/revision/operation; server scores attempts; no economy write.';
COMMENT ON FUNCTION public.read_creation_checkpoints(uuid) IS 'STORY-007 local proposal. Read-only resume snapshot; does not mark video or phase complete.';
COMMIT;
