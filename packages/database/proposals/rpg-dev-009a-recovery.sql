-- Compensating TEST-only recovery. Refuse to discard any issued proof/progress.
SET LOCAL lock_timeout='5s';
DO $$ BEGIN
 IF public.release_scope()<>'hero-equipment-006' OR
  EXISTS(SELECT 1 FROM story_private.progression_evidence) OR
  EXISTS(SELECT 1 FROM story_private.progression_completions) OR
  EXISTS(SELECT 1 FROM public.story_progress WHERE completion_protocol<>1) OR
  EXISTS(SELECT 1 FROM story_private.progression_policies WHERE approved) THEN
  RAISE EXCEPTION 'Recovery requires explicit preservation of issued progression';
 END IF;
END $$;
DROP FUNCTION public.complete_story_without_rewards(uuid,text,integer,uuid);
DROP FUNCTION public.get_story_progression(uuid);
DROP FUNCTION story_private.complete_story_without_rewards(uuid,text,integer,uuid);
DROP FUNCTION story_private.get_story_progression(uuid);
DROP TRIGGER story_progress_protocol_guard ON public.story_progress;
DROP FUNCTION story_private.guard_progression_completion();
ALTER TABLE public.story_progress DROP CONSTRAINT story_progress_check;
ALTER TABLE public.story_progress DROP COLUMN completion_reference,DROP COLUMN completion_revision,DROP COLUMN completion_protocol;
ALTER TABLE public.story_progress ADD CONSTRAINT story_progress_check CHECK(completed_at IS NULL OR
 (video_completed AND reward_receipt IS NOT NULL AND completed_steps @> ARRAY['explore','reading','activity','quiz','reflection','video','reward']));
DROP TABLE story_private.progression_completions;
DROP TABLE story_private.progression_evidence;
DROP TABLE story_private.progression_policies;
REVOKE USAGE ON SCHEMA story_private FROM authenticated;
NOTIFY pgrst,'reload schema';
