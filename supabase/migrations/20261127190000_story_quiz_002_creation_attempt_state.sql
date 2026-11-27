-- Extend the existing reader. CREATE OR REPLACE preserves its owner and grants.
DO $$
BEGIN
  IF to_regprocedure('public.read_creation_checkpoints(uuid)') IS NULL THEN
    RAISE EXCEPTION 'The existing Creation checkpoint reader is required';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.read_creation_checkpoints(p_traveler_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_result jsonb; v_public_manifest text;
BEGIN
  PERFORM story_private.require_creation_actor(p_traveler_id);
  SELECT revision INTO STRICT v_revision FROM public.story_definitions WHERE id='creation';
  SELECT story_private.creation_public_manifest(r.manifest::jsonb) INTO v_public_manifest
    FROM public.story_definitions d JOIN story_private.creation_checkpoint_revisions r ON r.revision=d.revision
    WHERE d.id='creation' AND d.revision=v_revision AND d.content_ready AND r.status='published';
  SELECT jsonb_build_object('version',1,'storyId','creation','revision',v_revision,
    'completedDays',coalesce((SELECT jsonb_agg(split_part(activity_key,':',2)::int ORDER BY split_part(activity_key,':',2)::int)
      FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id AND story_id='creation'
        AND revision=v_revision AND activity='day'),'[]'::jsonb),
    'consumedDays',coalesce((SELECT jsonb_agg(a.day ORDER BY a.day)
      FROM story_private.creation_day_attempts a WHERE a.account_id=auth.uid()
        AND a.revision=v_revision AND v_public_manifest IS NOT NULL),'[]'::jsonb),
    'harmonyCompleted',EXISTS(SELECT 1 FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision AND activity='harmony'),
    'quizAttempts',coalesce((SELECT count(*) FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision),0),
    'bestQuizScore',(SELECT max(score) FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision AND perfect),
    'available',v_public_manifest IS NOT NULL,
    'manifestText',v_public_manifest,
    'manifestHash',encode(sha256(convert_to(v_public_manifest,'UTF8')),'hex'),
    'videoCompleted',false) INTO v_result;
  RETURN v_result;
END $$;
