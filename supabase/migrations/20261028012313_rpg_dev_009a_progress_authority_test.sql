-- 009A: TEST-only authority consumer. No content approval or evidence issuer.
-- All five policies start CLOSED. Never apply this payload to PROD.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN
 IF public.release_scope()<>'hero-equipment-006' THEN RAISE EXCEPTION '009A requires the reviewed TEST target'; END IF;
 IF has_schema_privilege('authenticated','story_private','USAGE') OR
    has_table_privilege('authenticated','story_private.step_receipts','SELECT,INSERT,UPDATE,DELETE') OR
    has_function_privilege('authenticated','story_private.refresh_progress()','EXECUTE') THEN
  RAISE EXCEPTION 'Unexpected existing private-story capabilities';
 END IF;
 IF to_regclass('story_private.progression_policies') IS NOT NULL OR
    NOT(SELECT relrowsecurity FROM pg_class WHERE oid='public.story_progress'::regclass) OR
    has_function_privilege('authenticated','public.complete_story(uuid,text)','EXECUTE') OR
    EXISTS(SELECT 1 FROM public.story_definitions WHERE content_ready OR video_ready OR reward_ready) OR
    (SELECT count(*) FROM public.story_definitions)<>5 THEN
  RAISE EXCEPTION '009A baseline changed; review before applying';
 END IF;
END $$;

CREATE TABLE story_private.progression_policies (
 story_id text PRIMARY KEY REFERENCES public.story_definitions(id),
 revision integer NOT NULL CHECK(revision>0),
 approved boolean NOT NULL DEFAULT false,
 editorial_reference text,
 CHECK(NOT approved OR(editorial_reference IS NOT NULL AND length(editorial_reference) BETWEEN 1 AND 200))
);
INSERT INTO story_private.progression_policies(story_id,revision)
 SELECT id,revision FROM public.story_definitions;

-- Backend-only attestations, not a browser ingestion API. Future validators must
-- verify objective/quiz/provider evidence before issuing anything here.
-- Participation is deliberately distinct from proof of human reading or prayer.
CREATE TABLE story_private.progression_evidence (
 id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 story_id text NOT NULL REFERENCES public.story_definitions(id),
 revision integer NOT NULL CHECK(revision>0),
 step text NOT NULL,
 kind text NOT NULL,
 policy_hash text NOT NULL CHECK(policy_hash ~ '^[0-9a-f]{32}$'),
 proof_reference text NOT NULL CHECK(length(proof_reference) BETWEEN 1 AND 200),
 created_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
 UNIQUE(traveler_id,story_id,revision,step),
 CHECK((step IN('reading','reflection') AND kind='participation-v1') OR
       (step='explore' AND kind='server-objective-v1') OR
       (step='activity' AND kind='server-activity-v1') OR
       (step='quiz' AND kind='server-quiz-v1') OR
       (step='video' AND kind='provider-api-v1'))
);
CREATE TABLE story_private.progression_completions (
 id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 story_id text NOT NULL REFERENCES public.story_definitions(id),
 revision integer NOT NULL CHECK(revision>0),
 request_id uuid NOT NULL,
 policy_hash text NOT NULL CHECK(policy_hash ~ '^[0-9a-f]{32}$'),
 evidence_ids uuid[] NOT NULL CHECK(cardinality(evidence_ids)=6 AND array_position(evidence_ids,NULL) IS NULL),
 completed_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
 UNIQUE(traveler_id,request_id),
 UNIQUE(traveler_id,story_id,revision)
);
ALTER TABLE story_private.progression_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.progression_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.progression_completions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON story_private.progression_policies,story_private.progression_evidence,
 story_private.progression_completions FROM PUBLIC,anon,authenticated,service_role;

ALTER TABLE public.story_progress
 ADD COLUMN completion_protocol smallint NOT NULL DEFAULT 1 CHECK(completion_protocol IN(1,2)),
 ADD COLUMN completion_revision integer CHECK(completion_revision>0),
 ADD COLUMN completion_reference uuid REFERENCES story_private.progression_completions(id);
ALTER TABLE public.story_progress DROP CONSTRAINT story_progress_check;
ALTER TABLE public.story_progress ADD CONSTRAINT story_progress_check CHECK(
 (completion_protocol=1 AND completion_revision IS NULL AND completion_reference IS NULL AND
  (completed_at IS NULL OR(video_completed AND reward_receipt IS NOT NULL AND completed_steps @>
    ARRAY['explore','reading','activity','quiz','reflection','video','reward']))) OR
 (completion_protocol=2 AND completion_revision IS NOT NULL AND completion_reference IS NOT NULL AND
  completed_at IS NOT NULL AND video_completed AND reward_receipt IS NULL AND
  completed_steps @> ARRAY['explore','reading','activity','quiz','reflection','video'] AND
  NOT completed_steps @> ARRAY['reward'])
);

CREATE FUNCTION story_private.guard_progression_completion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.completion_protocol=2 AND NEW IS DISTINCT FROM OLD THEN
  RAISE EXCEPTION 'Official completion is immutable';
 END IF;
 IF NEW.completion_protocol=2 AND NOT EXISTS(
  SELECT 1 FROM story_private.progression_completions c WHERE c.id=NEW.completion_reference
   AND c.traveler_id=NEW.traveler_id AND c.story_id=NEW.story_id
   AND c.revision=NEW.completion_revision AND c.completed_at=NEW.completed_at
 ) THEN RAISE EXCEPTION 'Completion attestation missing'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION story_private.guard_progression_completion() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER story_progress_protocol_guard BEFORE INSERT OR UPDATE ON public.story_progress
 FOR EACH ROW EXECUTE FUNCTION story_private.guard_progression_completion();

CREATE FUNCTION story_private.complete_story_without_rewards(p_traveler_id uuid,p_story_id text,p_revision integer,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d public.story_definitions; policy story_private.progression_policies;
 c story_private.progression_completions; ids uuid[]; steps text[]; policy_digest text;
BEGIN
 -- Same actor lock as the existing authority: concurrent completions serialize.
 PERFORM 1 FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
  WHERE t.id=p_traveler_id AND t.user_id=auth.uid() AND t.is_active AND u.is_anonymous IS FALSE
  AND NOT COALESCE((auth.jwt()->>'is_anonymous')::boolean,true) FOR UPDATE OF t;
 IF NOT FOUND THEN RAISE EXCEPTION 'Progress access denied' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_revision IS NULL OR p_revision<1 OR p_story_id IS NULL OR length(p_story_id) NOT BETWEEN 1 AND 80 THEN
  RAISE EXCEPTION 'Invalid completion command' USING ERRCODE='22023';
 END IF;
 SELECT * INTO c FROM story_private.progression_completions
  WHERE traveler_id=p_traveler_id AND request_id=p_request_id;
 IF FOUND THEN
  IF c.story_id<>p_story_id OR c.revision<>p_revision THEN
   RAISE EXCEPTION 'Idempotency key payload conflict' USING ERRCODE='22023';
  END IF;
 ELSE
  SELECT * INTO d FROM public.story_definitions WHERE id=p_story_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown story' USING ERRCODE='22023'; END IF;
  SELECT * INTO policy FROM story_private.progression_policies WHERE story_id=p_story_id FOR SHARE;
  IF NOT FOUND OR NOT policy.approved OR NOT d.content_ready OR NOT d.video_ready OR
     policy.editorial_reference IS NULL THEN RAISE EXCEPTION 'Approved requirements unavailable' USING ERRCODE='55000'; END IF;
  IF p_revision<>d.revision OR p_revision<>policy.revision THEN RAISE EXCEPTION 'Stale story revision' USING ERRCODE='22023'; END IF;
  policy_digest:=md5(to_jsonb(policy)::text);
  -- Prior legacy snapshots/receipts are never silently promoted to v2 completion.
  IF EXISTS(SELECT 1 FROM public.story_definitions previous WHERE previous.narrative_order<d.narrative_order
   AND NOT EXISTS(SELECT 1 FROM public.story_progress p JOIN story_private.progression_completions prior
    ON prior.id=p.completion_reference WHERE p.traveler_id=p_traveler_id AND p.story_id=previous.id
    AND p.completion_protocol=2 AND p.completion_revision=previous.revision
    AND prior.revision=previous.revision AND prior.completed_at=p.completed_at
    AND previous.content_ready AND previous.video_ready
    AND EXISTS(SELECT 1 FROM story_private.progression_policies pp WHERE pp.story_id=previous.id
     AND pp.revision=previous.revision AND pp.approved AND prior.policy_hash=md5(to_jsonb(pp)::text)))) THEN
   RAISE EXCEPTION 'Previous official story incomplete' USING ERRCODE='55000';
  END IF;
  SELECT * INTO c FROM story_private.progression_completions
   WHERE traveler_id=p_traveler_id AND story_id=p_story_id AND revision=p_revision;
  IF FOUND AND c.policy_hash<>policy_digest THEN RAISE EXCEPTION 'Policy changed; review existing proof' USING ERRCODE='55000'; END IF;
  IF NOT FOUND THEN
   IF EXISTS(SELECT 1 FROM public.story_progress WHERE traveler_id=p_traveler_id AND story_id=p_story_id) THEN
    RAISE EXCEPTION 'Existing progress requires an explicit reconciliation contract' USING ERRCODE='55000';
   END IF;
   SELECT array_agg(e.id ORDER BY e.step),array_agg(e.step ORDER BY e.step) INTO ids,steps
    FROM story_private.progression_evidence e WHERE e.traveler_id=p_traveler_id
     AND e.story_id=p_story_id AND e.revision=p_revision AND e.policy_hash=policy_digest;
   IF cardinality(ids) IS DISTINCT FROM 6 OR NOT steps @> ARRAY['explore','reading','activity','quiz','reflection','video'] THEN
    RAISE EXCEPTION 'Server evidence incomplete' USING ERRCODE='55000';
   END IF;
   INSERT INTO story_private.progression_completions(traveler_id,story_id,revision,request_id,policy_hash,evidence_ids)
    VALUES(p_traveler_id,p_story_id,p_revision,p_request_id,policy_digest,ids) RETURNING * INTO c;
   INSERT INTO public.story_progress(traveler_id,story_id,completed_steps,video_completed,completed_at,
     completion_protocol,completion_revision,completion_reference)
    VALUES(p_traveler_id,p_story_id,steps,true,c.completed_at,2,p_revision,c.id);
  END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.story_progress p WHERE p.traveler_id=c.traveler_id AND p.story_id=c.story_id
  AND p.completion_reference=c.id AND p.completion_protocol=2 AND p.completion_revision=c.revision
  AND p.completed_at=c.completed_at) THEN RAISE EXCEPTION 'Official projection inconsistent' USING ERRCODE='55000'; END IF;
 RETURN jsonb_build_object('protocol',2,'traveler_id',c.traveler_id,'story_id',c.story_id,
  'revision',c.revision,'completion_reference',c.id,'completed_at',c.completed_at,'rewards_granted',false);
END $$;
REVOKE ALL ON FUNCTION story_private.complete_story_without_rewards(uuid,text,integer,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA story_private TO authenticated;
GRANT EXECUTE ON FUNCTION story_private.complete_story_without_rewards(uuid,text,integer,uuid) TO authenticated;
CREATE FUNCTION public.complete_story_without_rewards(p_traveler_id uuid,p_story_id text,p_revision integer,p_request_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT story_private.complete_story_without_rewards(p_traveler_id,p_story_id,p_revision,p_request_id);
$$;
REVOKE ALL ON FUNCTION public.complete_story_without_rewards(uuid,text,integer,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.complete_story_without_rewards(uuid,text,integer,uuid) TO authenticated;
COMMENT ON FUNCTION public.complete_story_without_rewards(uuid,text,integer,uuid) IS
 '009A TEST only; all policies closed. Consumes backend attestations, never browser flags/scores or legacy receipts. No evidence issuer supplied or economic writes.';

CREATE FUNCTION story_private.get_story_progression(p_traveler_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE d record; v jsonb:='[]'::jsonb; prior_complete boolean:=true; official boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
  WHERE t.id=p_traveler_id AND t.user_id=auth.uid() AND t.is_active AND u.is_anonymous IS FALSE
   AND NOT COALESCE((auth.jwt()->>'is_anonymous')::boolean,true)) THEN
  RAISE EXCEPTION 'Progress access denied' USING ERRCODE='42501';
 END IF;
 FOR d IN SELECT s.*,p.approved,p.editorial_reference,p.revision policy_revision,md5(to_jsonb(p)::text) policy_hash
   FROM public.story_definitions s JOIN story_private.progression_policies p ON p.story_id=s.id
   ORDER BY s.narrative_order LOOP
  official:=EXISTS(SELECT 1 FROM public.story_progress sp JOIN story_private.progression_completions c
    ON c.id=sp.completion_reference WHERE sp.traveler_id=p_traveler_id AND sp.story_id=d.id
    AND sp.completion_protocol=2 AND sp.completion_revision=d.revision AND c.revision=d.revision
    AND c.policy_hash=d.policy_hash AND c.completed_at=sp.completed_at AND d.approved
    AND d.content_ready AND d.video_ready AND d.policy_revision=d.revision);
  v:=v||jsonb_build_array(jsonb_build_object('story_id',d.id,'revision',d.revision,'order',d.narrative_order,
   'sequence_available',prior_complete,'official_completed',official,
   'requirements_approved',d.approved AND d.content_ready AND d.video_ready AND d.policy_revision=d.revision,
   'evidence_steps',COALESCE((SELECT jsonb_agg(e.step ORDER BY e.step) FROM story_private.progression_evidence e
      WHERE e.traveler_id=p_traveler_id AND e.story_id=d.id AND e.revision=d.revision AND e.policy_hash=d.policy_hash),'[]'::jsonb),
   'legacy_projection_present',EXISTS(SELECT 1 FROM public.story_progress sp WHERE sp.traveler_id=p_traveler_id
      AND sp.story_id=d.id AND sp.completion_protocol=1)));
  prior_complete:=prior_complete AND official;
 END LOOP;
 RETURN jsonb_build_object('protocol',2,'traveler_id',p_traveler_id,'stories',v,
  'legacy_snapshot_present',EXISTS(SELECT 1 FROM public.travelers t WHERE t.id=p_traveler_id AND t.journey_progress IS NOT NULL),
  'economic_rewards_enabled',false,'evidence_issuers_available',false);
END $$;
REVOKE ALL ON FUNCTION story_private.get_story_progression(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION story_private.get_story_progression(uuid) TO authenticated;
CREATE FUNCTION public.get_story_progression(p_traveler_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT story_private.get_story_progression(p_traveler_id);
$$;
REVOKE ALL ON FUNCTION public.get_story_progression(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_story_progression(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
