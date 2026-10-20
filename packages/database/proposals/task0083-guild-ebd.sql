-- TASK-0083 LOCAL PROPOSAL, not a registered/applied migration.
-- Prerequisite: actual 0000..0008 + QR0080 + TASK0082 proposal, in this order.
BEGIN;
CREATE SCHEMA ebd_ops;
REVOKE ALL ON SCHEMA ebd_ops FROM PUBLIC,anon,authenticated;
ALTER TABLE public.guild_lessons DROP CONSTRAINT guild_lessons_status_check,
 DROP CONSTRAINT guild_lessons_reference_check;
ALTER TABLE public.guild_lessons ADD CONSTRAINT guild_lessons_status_check
 CHECK(status IN ('draft','scheduled','published','closed','archived','completed','cancelled')),
 ADD CONSTRAINT guild_lessons_reference_check CHECK(length(bible_reference)<=100),
 ADD COLUMN teacher_id uuid REFERENCES public.travelers(id) ON DELETE RESTRICT,
 ADD COLUMN ebd_revision integer NOT NULL DEFAULT 1 CHECK(ebd_revision>0),
 ADD COLUMN audience text NOT NULL DEFAULT 'all' CHECK(audience IN ('all','selected')),
 ADD COLUMN target_ids uuid[] NOT NULL DEFAULT '{}',
 ADD COLUMN materials jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN objectives text NOT NULL DEFAULT '' CHECK(length(objectives)<=2000),
 ADD COLUMN reward_tier text CHECK(reward_tier IN ('normal','great','epic','extraordinary')),
 ADD COLUMN creation_hash text;
UPDATE public.guild_lessons SET teacher_id=created_by_traveler_id;
ALTER TABLE public.guild_lessons ALTER COLUMN teacher_id SET NOT NULL;
CREATE INDEX guild_lessons_teacher_idx ON public.guild_lessons(teacher_id,guild_id);

CREATE TABLE public.guild_ebd_teachers(
 guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
 active boolean NOT NULL, can_publish boolean NOT NULL, can_attend boolean NOT NULL,
 revision integer NOT NULL CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(guild_id,traveler_id)
);
CREATE TABLE public.guild_ebd_activities(
 id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES public.guild_lessons(id) ON DELETE CASCADE,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 2 AND 100),
 kind text NOT NULL CHECK(kind IN ('choice','open','reflective','in_person','homework')),
 prompt text NOT NULL CHECK(length(btrim(prompt)) BETWEEN 1 AND 2000),
 options jsonb NOT NULL DEFAULT '[]', answer_key integer,
 deadline timestamptz, attempt_limit integer NOT NULL CHECK(attempt_limit BETWEEN 1 AND 5),
 criterion text NOT NULL CHECK(criterion IN ('participation','correct','manual')),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), creation_hash text,
 CHECK((kind='choice' AND jsonb_array_length(options) BETWEEN 2 AND 6 AND answer_key IS NOT NULL AND answer_key>=0 AND answer_key<jsonb_array_length(options))
  OR (kind<>'choice' AND options='[]'::jsonb AND answer_key IS NULL AND criterion='manual'))
);
CREATE INDEX guild_ebd_activities_lesson_idx ON public.guild_ebd_activities(lesson_id);
CREATE TABLE public.guild_ebd_answers(
 id uuid PRIMARY KEY, activity_id uuid NOT NULL REFERENCES public.guild_ebd_activities(id) ON DELETE CASCADE,
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
 attempt integer NOT NULL, response text NOT NULL CHECK(length(btrim(response)) BETWEEN 1 AND 2000),
 choice integer, status text NOT NULL CHECK(status IN ('pending','completed','revise')),
 feedback text NOT NULL DEFAULT '' CHECK(length(feedback)<=1000),
 revision integer NOT NULL DEFAULT 1, reviewer_id uuid REFERENCES public.travelers(id),
 submitted_at timestamptz NOT NULL DEFAULT now(), evaluated_at timestamptz,
 UNIQUE(activity_id,traveler_id,attempt)
);
CREATE INDEX guild_ebd_answers_traveler_idx ON public.guild_ebd_answers(traveler_id,activity_id);
CREATE TABLE public.guild_ebd_attendance(
 lesson_id uuid NOT NULL REFERENCES public.guild_lessons(id) ON DELETE CASCADE,
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
 status text NOT NULL CHECK(status IN ('present','absent')),
 reason text NOT NULL CHECK(length(reason)<=500), revision integer NOT NULL,
 marked_by uuid NOT NULL REFERENCES public.travelers(id), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(lesson_id,traveler_id)
);
CREATE INDEX guild_ebd_attendance_traveler_idx ON public.guild_ebd_attendance(traveler_id,lesson_id);
CREATE TABLE public.guild_ebd_history(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
 lesson_id uuid REFERENCES public.guild_lessons(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES public.travelers(id), action text NOT NULL,
 entity_id uuid NOT NULL, revision integer NOT NULL,
 snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guild_ebd_history_guild_idx ON public.guild_ebd_history(guild_id,id DESC);
CREATE INDEX guild_ebd_history_lesson_idx ON public.guild_ebd_history(lesson_id,id DESC);
CREATE TABLE public.guild_ebd_reward_pending(
 lesson_id uuid NOT NULL REFERENCES public.guild_lessons(id) ON DELETE CASCADE,
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 activity_id uuid NOT NULL REFERENCES public.guild_ebd_activities(id),
 answer_id uuid NOT NULL REFERENCES public.guild_ebd_answers(id),
 tier text NOT NULL CHECK(tier IN ('normal','great','epic','extraordinary')),
 criterion text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(lesson_id,traveler_id)
);
-- No raw access to keys, answers, teacher grants, snapshots, attendance or pending receipts.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['guild_ebd_teachers','guild_ebd_activities','guild_ebd_answers','guild_ebd_attendance','guild_ebd_history','guild_ebd_reward_pending'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 END LOOP;
END $$;
REVOKE ALL ON SEQUENCE public.guild_ebd_history_id_seq FROM PUBLIC,anon,authenticated;

CREATE FUNCTION ebd_ops.manager(p_actor uuid,p_lesson uuid,p_permission text DEFAULT 'edit') RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.guild_lessons l JOIN public.guild_members gm ON gm.guild_id=l.guild_id AND gm.traveler_id=p_actor
 JOIN public.guilds g ON g.id=gm.guild_id JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id
 LEFT JOIN public.guild_ebd_teachers et ON et.guild_id=l.guild_id AND et.traveler_id=p_actor
 WHERE l.id=p_lesson AND gm.status='active' AND g.status='active' AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
 AND ((gm.role='leader' AND g.leader_traveler_id=p_actor) OR
 (l.teacher_id=p_actor AND et.active AND CASE p_permission WHEN 'publish' THEN et.can_publish WHEN 'attend' THEN et.can_attend ELSE true END)))
$$;
CREATE FUNCTION ebd_ops.eligible(p_actor uuid,p_lesson uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.guild_lessons l JOIN public.guild_members gm ON gm.guild_id=l.guild_id
 JOIN public.guilds g ON g.id=gm.guild_id JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id
 WHERE l.id=p_lesson AND gm.traveler_id=p_actor AND gm.status='active' AND g.status='active'
 AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE AND l.status IN ('published','closed','completed')
 AND (l.audience='all' OR p_actor=ANY(l.target_ids)))
$$;
CREATE FUNCTION ebd_ops.visible(p_lesson uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.travelers t WHERE t.user_id=auth.uid()
 AND (ebd_ops.manager(t.id,p_lesson) OR ebd_ops.eligible(t.id,p_lesson)))
$$;
DROP POLICY guild_lessons_select_member ON public.guild_lessons;
CREATE POLICY guild_lessons_select_member ON public.guild_lessons FOR SELECT TO authenticated USING(ebd_ops.visible(id));

CREATE FUNCTION ebd_ops.command(p_actor uuid,p_action text,p_id uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_guild uuid; v_role text; l public.guild_lessons; a public.guild_ebd_activities;
 ans public.guild_ebd_answers; att public.guild_ebd_attendance; et public.guild_ebd_teachers;
 v_teacher uuid; v_target uuid; v_targets uuid[]; v_state text; v_revision integer; v_count integer;
 v_item jsonb; v_options jsonb; v_key integer; v_choice integer; v_snapshot jsonb;
BEGIN
 IF p_actor IS NULL OR p_id IS NULL OR p_action IS NULL OR p_revision IS NULL OR p_revision<0
 OR p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR length(p_data::text)>60000 THEN RAISE EXCEPTION 'Invalid EBD request'; END IF;
 SELECT guild_id INTO v_guild FROM public.guild_members WHERE traveler_id=p_actor AND status='active';
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_guild::text,83));
 v_role:=guild_ops.actor(p_actor,v_guild);
 -- Serialize EBD commands per Guilda, including grant revocations/member eligibility.
 PERFORM 1 FROM public.guilds WHERE id=v_guild FOR UPDATE;
 IF p_action='teacher' THEN
  PERFORM guild_ops.actor(p_actor,v_guild,true);
  PERFORM 1 FROM public.guild_members WHERE guild_id=v_guild AND traveler_id=p_id AND status='active' AND role<>'leader' FOR SHARE;
  IF NOT FOUND OR jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean'
   OR jsonb_typeof(p_data->'publish') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'attend') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Teacher unavailable'; END IF;
  SELECT * INTO et FROM public.guild_ebd_teachers WHERE guild_id=v_guild AND traveler_id=p_id FOR UPDATE;
  IF coalesce(et.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
  INSERT INTO public.guild_ebd_teachers VALUES(v_guild,p_id,(p_data->>'active')::boolean,(p_data->>'publish')::boolean,(p_data->>'attend')::boolean,p_revision+1,clock_timestamp())
   ON CONFLICT(guild_id,traveler_id) DO UPDATE SET active=excluded.active,can_publish=excluded.can_publish,can_attend=excluded.can_attend,revision=excluded.revision,updated_at=excluded.updated_at;
  INSERT INTO public.guild_ebd_history(guild_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_actor,'teacher',p_id,p_revision+1,p_data);
  RETURN jsonb_build_object('id',p_id,'revision',p_revision+1);
 ELSIF p_action='lesson' THEN
  v_teacher:=(p_data->>'teacherId')::uuid;
  IF v_role<>'leader' AND (v_teacher IS DISTINCT FROM p_actor OR NOT EXISTS(SELECT 1 FROM public.guild_ebd_teachers WHERE guild_id=v_guild AND traveler_id=p_actor AND active)) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.guild_members gm JOIN public.guilds g ON g.id=gm.guild_id
   LEFT JOIN public.guild_ebd_teachers t ON t.guild_id=gm.guild_id AND t.traveler_id=gm.traveler_id
   WHERE gm.guild_id=v_guild AND gm.traveler_id=v_teacher AND gm.status='active' AND ((gm.role='leader' AND g.leader_traveler_id=v_teacher) OR t.active)) THEN RAISE EXCEPTION 'Teacher unavailable'; END IF;
  IF jsonb_typeof(p_data->'targetIds') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'targetIds')>100
   OR jsonb_typeof(p_data->'materials') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'materials')>20
   OR coalesce(p_data->>'audience','') NOT IN ('all','selected')
   OR length(btrim(coalesce(p_data->>'title',''))) NOT BETWEEN 2 AND 100
   OR length(btrim(coalesce(p_data->>'theme',''))) NOT BETWEEN 2 AND 100
   OR length(coalesce(p_data->>'description',''))>2000 OR length(coalesce(p_data->>'content',''))>10000
   OR length(coalesce(p_data->>'reference',''))>100 OR length(coalesce(p_data->>'objectives',''))>2000
   OR coalesce(p_data->>'rewardTier','') NOT IN ('','normal','great','epic','extraordinary') THEN RAISE EXCEPTION 'Invalid lesson'; END IF;
  SELECT coalesce(array_agg(value::uuid),'{}') INTO v_targets FROM jsonb_array_elements_text(p_data->'targetIds');
  IF (p_data->>'audience'='selected' AND cardinality(v_targets)=0) OR (p_data->>'audience'='all' AND cardinality(v_targets)>0)
   OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=v_guild AND traveler_id=t AND status='active')) THEN RAISE EXCEPTION 'Audience unavailable'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_data->'materials') LOOP
   IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' OR coalesce(v_item->>'kind','') NOT IN ('link','image','pdf','text','reference')
    OR length(btrim(coalesce(v_item->>'title',''))) NOT BETWEEN 1 AND 100 OR length(btrim(coalesce(v_item->>'value',''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid material'; END IF;
   -- References only: never fetch/embed remote files or render HTML; no credentials/ports/local hosts.
   IF v_item->>'kind' IN ('link','image','pdf') AND
    (length(v_item->>'value')>500 OR (v_item->>'value') !~ '^https://[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(/[A-Za-z0-9/._~!$&()*+,;=:@%?#-]*)?$'
     OR (v_item->>'value') ~* '^https://([^/]*\.)?(localhost|local|internal|invalid|test|example)(/|$)' OR (v_item->>'value') ~* '^https://[^/]*\.(local|internal|invalid|test|example)(/|$)') THEN RAISE EXCEPTION 'Unsafe material URL'; END IF;
  END LOOP;
  SELECT * INTO l FROM public.guild_lessons WHERE id=p_id FOR UPDATE;
  IF FOUND THEN
   IF l.guild_id<>v_guild OR NOT ebd_ops.manager(p_actor,p_id) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
   IF p_revision=0 AND l.creation_hash=md5(p_data::text) THEN RETURN jsonb_build_object('id',p_id,'revision',l.ebd_revision); END IF;
   IF l.status<>'draft' OR l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
   UPDATE public.guild_lessons SET title=btrim(p_data->>'title'),theme=btrim(p_data->>'theme'),introduction=coalesce(p_data->>'description',''),content=coalesce(p_data->>'content',''),bible_reference=coalesce(p_data->>'reference',''),scheduled_at=nullif(p_data->>'scheduledAt','')::timestamptz,teacher_id=v_teacher,audience=p_data->>'audience',target_ids=v_targets,materials=p_data->'materials',objectives=coalesce(p_data->>'objectives',''),reward_tier=nullif(p_data->>'rewardTier',''),ebd_revision=ebd_revision+1 WHERE id=p_id;
  ELSE
   IF p_revision<>0 THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
   INSERT INTO public.guild_lessons(id,guild_id,created_by_traveler_id,teacher_id,title,theme,introduction,content,bible_reference,scheduled_at,audience,target_ids,materials,objectives,reward_tier,creation_hash)
    VALUES(p_id,v_guild,p_actor,v_teacher,btrim(p_data->>'title'),btrim(p_data->>'theme'),coalesce(p_data->>'description',''),coalesce(p_data->>'content',''),coalesce(p_data->>'reference',''),nullif(p_data->>'scheduledAt','')::timestamptz,p_data->>'audience',v_targets,p_data->'materials',coalesce(p_data->>'objectives',''),nullif(p_data->>'rewardTier',''),md5(p_data::text));
  END IF;
  SELECT to_jsonb(x),x.ebd_revision INTO v_snapshot,v_revision FROM public.guild_lessons x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_id,p_actor,'lesson_saved',p_id,v_revision,v_snapshot);
 ELSIF p_action='state' THEN
  SELECT * INTO l FROM public.guild_lessons WHERE id=p_id FOR UPDATE;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,p_id,'publish') THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  v_state:=p_data->>'state';
  IF l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
  IF v_state IS NULL OR NOT ((l.status='draft' AND v_state IN ('scheduled','published','archived')) OR (l.status='scheduled' AND v_state IN ('draft','published','archived')) OR (l.status='published' AND v_state='closed') OR (l.status IN ('closed','completed','cancelled') AND v_state='archived')) THEN RAISE EXCEPTION 'Invalid EBD state'; END IF;
  IF v_state IN ('scheduled','published') AND (length(btrim(l.content))=0 OR l.scheduled_at IS NULL) THEN RAISE EXCEPTION 'Lesson needs content and date'; END IF;
  UPDATE public.guild_lessons SET status=v_state,ebd_revision=ebd_revision+1,published_at=CASE WHEN v_state='published' THEN clock_timestamp() ELSE published_at END,completed_at=CASE WHEN v_state='closed' THEN clock_timestamp() ELSE completed_at END WHERE id=p_id;
  SELECT to_jsonb(x),x.ebd_revision INTO v_snapshot,v_revision FROM public.guild_lessons x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_id,p_actor,'state',p_id,v_revision,v_snapshot);
 ELSIF p_action='activity' THEN
  SELECT * INTO l FROM public.guild_lessons WHERE id=(p_data->>'lessonId')::uuid FOR UPDATE;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,l.id) OR l.status<>'draft' THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_data->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'options')>6
   OR coalesce(p_data->>'kind','') NOT IN ('choice','open','reflective','in_person','homework')
   OR coalesce(p_data->>'criterion','') NOT IN ('participation','correct','manual') THEN RAISE EXCEPTION 'Invalid activity'; END IF;
  v_options:=p_data->'options'; v_key:=nullif(p_data->>'answerKey','')::integer;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_options) x WHERE jsonb_typeof(x)<>'string' OR length(btrim(x#>>'{}')) NOT BETWEEN 1 AND 300)
   OR (p_data->>'kind'='choice' AND p_data->>'criterion'='manual') THEN RAISE EXCEPTION 'Invalid choices'; END IF;
  SELECT * INTO a FROM public.guild_ebd_activities WHERE id=p_id FOR UPDATE;
  IF FOUND THEN
   IF a.lesson_id<>l.id THEN RAISE EXCEPTION 'EBD access denied'; END IF;
   IF p_revision=0 AND a.creation_hash=md5(p_data::text) THEN RETURN jsonb_build_object('id',p_id,'revision',a.revision); END IF;
   IF a.revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
   UPDATE public.guild_ebd_activities SET title=btrim(p_data->>'title'),kind=p_data->>'kind',prompt=p_data->>'prompt',options=v_options,answer_key=v_key,deadline=nullif(p_data->>'deadline','')::timestamptz,attempt_limit=(p_data->>'attemptLimit')::integer,criterion=p_data->>'criterion',revision=revision+1 WHERE id=p_id;
  ELSE
   IF p_revision<>0 THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
   IF (SELECT count(*) FROM public.guild_ebd_activities WHERE lesson_id=l.id)>=20 THEN RAISE EXCEPTION 'Activity limit reached'; END IF;
   INSERT INTO public.guild_ebd_activities(id,lesson_id,title,kind,prompt,options,answer_key,deadline,attempt_limit,criterion,creation_hash)
    VALUES(p_id,l.id,btrim(p_data->>'title'),p_data->>'kind',p_data->>'prompt',v_options,v_key,nullif(p_data->>'deadline','')::timestamptz,(p_data->>'attemptLimit')::integer,p_data->>'criterion',md5(p_data::text));
  END IF;
  SELECT to_jsonb(x),x.revision INTO v_snapshot,v_revision FROM public.guild_ebd_activities x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,l.id,p_actor,'activity_saved',p_id,v_revision,v_snapshot);
 ELSIF p_action='submit' THEN
  SELECT * INTO a FROM public.guild_ebd_activities WHERE id=(p_data->>'activityId')::uuid FOR UPDATE;
  SELECT * INTO l FROM public.guild_lessons WHERE id=a.lesson_id;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.eligible(p_actor,l.id) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  v_choice:=nullif(p_data->>'choice','')::integer;
  SELECT * INTO ans FROM public.guild_ebd_answers WHERE id=p_id;
  IF FOUND THEN
   IF ans.traveler_id=p_actor AND ans.activity_id=a.id AND ans.response=btrim(p_data->>'response') AND ans.choice IS NOT DISTINCT FROM v_choice THEN RETURN jsonb_build_object('id',p_id,'revision',ans.revision); END IF;
   RAISE EXCEPTION 'Submission key conflict';
  END IF;
  IF l.status<>'published' OR (a.deadline IS NOT NULL AND a.deadline<=clock_timestamp()) THEN RAISE EXCEPTION 'Activity closed'; END IF;
  SELECT count(*) INTO v_count FROM public.guild_ebd_answers WHERE activity_id=a.id AND traveler_id=p_actor;
  IF v_count<>p_revision OR v_count>=a.attempt_limit OR EXISTS(SELECT 1 FROM public.guild_ebd_answers WHERE activity_id=a.id AND traveler_id=p_actor AND status IN ('completed','pending')) THEN RAISE EXCEPTION 'Attempt unavailable'; END IF;
  IF (a.kind='choice' AND (v_choice IS NULL OR v_choice<0 OR v_choice>=jsonb_array_length(a.options))) OR (a.kind<>'choice' AND v_choice IS NOT NULL) THEN RAISE EXCEPTION 'Invalid answer'; END IF;
  v_state:=CASE WHEN a.kind<>'choice' THEN 'pending' WHEN a.criterion='participation' OR v_choice=a.answer_key THEN 'completed' ELSE 'revise' END;
  INSERT INTO public.guild_ebd_answers(id,activity_id,traveler_id,attempt,response,choice,status,evaluated_at)
   VALUES(p_id,a.id,p_actor,v_count+1,btrim(p_data->>'response'),v_choice,v_state,CASE WHEN a.kind='choice' THEN clock_timestamp() END);
  v_revision:=1;
 ELSIF p_action='grade' THEN
  SELECT * INTO ans FROM public.guild_ebd_answers WHERE id=p_id FOR UPDATE;
  SELECT * INTO a FROM public.guild_ebd_activities WHERE id=ans.activity_id;
  SELECT * INTO l FROM public.guild_lessons WHERE id=a.lesson_id;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,l.id) OR EXISTS(SELECT 1 FROM public.travelers WHERE id=ans.traveler_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  IF ans.revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
  IF ans.status<>'pending' OR coalesce(p_data->>'status','') NOT IN ('completed','revise') THEN RAISE EXCEPTION 'Answer already evaluated'; END IF;
  UPDATE public.guild_ebd_answers SET status=p_data->>'status',feedback=coalesce(p_data->>'feedback',''),reviewer_id=p_actor,evaluated_at=clock_timestamp(),revision=revision+1 WHERE id=p_id;
  SELECT to_jsonb(x),x.revision INTO v_snapshot,v_revision FROM public.guild_ebd_answers x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,l.id,p_actor,'grade',p_id,v_revision,v_snapshot);
 ELSIF p_action='attendance' THEN
  SELECT * INTO l FROM public.guild_lessons WHERE id=p_id FOR UPDATE;
  v_target:=(p_data->>'travelerId')::uuid;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,p_id,'attend') OR l.status NOT IN ('published','closed','completed') THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.guild_members WHERE guild_id=v_guild AND traveler_id=v_target AND status='active' FOR SHARE;
  IF NOT FOUND OR (l.audience='selected' AND NOT v_target=ANY(l.target_ids)) THEN RAISE EXCEPTION 'Student unavailable'; END IF;
  SELECT * INTO att FROM public.guild_ebd_attendance WHERE lesson_id=p_id AND traveler_id=v_target FOR UPDATE;
  IF coalesce(att.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='40001'; END IF;
  INSERT INTO public.guild_ebd_attendance VALUES(p_id,v_target,p_data->>'status',coalesce(p_data->>'reason',''),p_revision+1,p_actor,clock_timestamp())
   ON CONFLICT(lesson_id,traveler_id) DO UPDATE SET status=excluded.status,reason=excluded.reason,revision=excluded.revision,marked_by=excluded.marked_by,updated_at=excluded.updated_at;
  SELECT to_jsonb(x) INTO v_snapshot FROM public.guild_ebd_attendance x WHERE lesson_id=p_id AND traveler_id=v_target;
  v_revision:=p_revision+1;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_id,p_actor,'attendance',v_target,v_revision,jsonb_build_object('before',to_jsonb(att),'after',v_snapshot));
 ELSE RAISE EXCEPTION 'Unknown EBD action'; END IF;
 IF p_action IN ('submit','grade') THEN
  INSERT INTO public.guild_ebd_reward_pending(lesson_id,traveler_id,activity_id,answer_id,tier,criterion)
   SELECT l.id,x.traveler_id,a.id,x.id,l.reward_tier,a.criterion FROM public.guild_ebd_answers x
   WHERE x.id=p_id AND x.status='completed' AND l.reward_tier IS NOT NULL ON CONFLICT(lesson_id,traveler_id) DO NOTHING;
 END IF;
 RETURN jsonb_build_object('id',p_id,'revision',v_revision);
END $$;

CREATE FUNCTION ebd_ops.workspace(p_actor uuid,p_offset integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE g uuid; r text; ids uuid[]; total integer; teacher boolean;
BEGIN
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid EBD page'; END IF;
 SELECT guild_id INTO g FROM public.guild_members WHERE traveler_id=p_actor AND status='active';
 r:=guild_ops.actor(p_actor,g);
 teacher:=r='leader' OR EXISTS(SELECT 1 FROM public.guild_ebd_teachers WHERE guild_id=g AND traveler_id=p_actor AND active);
 SELECT count(*) INTO total FROM public.guild_lessons l WHERE guild_id=g AND (ebd_ops.manager(p_actor,l.id) OR ebd_ops.eligible(p_actor,l.id));
 SELECT coalesce(array_agg(id),'{}') INTO ids FROM (SELECT id FROM public.guild_lessons l WHERE guild_id=g AND (ebd_ops.manager(p_actor,l.id) OR ebd_ops.eligible(p_actor,l.id)) ORDER BY created_at DESC,id LIMIT 20 OFFSET p_offset) page;
 RETURN jsonb_build_object('version',1,'guildId',g,'leader',r='leader','teacher',teacher,'total',total,
  'lessons',coalesce((SELECT jsonb_agg(to_jsonb(l)||jsonb_build_object('canEdit',ebd_ops.manager(p_actor,l.id),'canPublish',ebd_ops.manager(p_actor,l.id,'publish'),'canAttend',ebd_ops.manager(p_actor,l.id,'attend')) ORDER BY created_at DESC,id) FROM public.guild_lessons l WHERE id=ANY(ids)),'[]'::jsonb),
  'activities',coalesce((SELECT jsonb_agg((to_jsonb(a)-'answer_key'-'creation_hash')||CASE WHEN ebd_ops.manager(p_actor,a.lesson_id) OR EXISTS(SELECT 1 FROM public.guild_ebd_answers x WHERE x.activity_id=a.id AND x.traveler_id=p_actor AND (x.status='completed' OR (x.status='revise' AND x.attempt>=a.attempt_limit))) THEN jsonb_build_object('answer_key',a.answer_key) ELSE '{}'::jsonb END) FROM public.guild_ebd_activities a WHERE lesson_id=ANY(ids)),'[]'::jsonb),
  'answers',coalesce((SELECT jsonb_agg(to_jsonb(x)||jsonb_build_object('traveler_name',t.name) ORDER BY submitted_at DESC) FROM public.guild_ebd_answers x JOIN public.guild_ebd_activities a ON a.id=x.activity_id JOIN public.travelers t ON t.id=x.traveler_id WHERE a.lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,a.lesson_id))),'[]'::jsonb),
  'attendance',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.guild_ebd_attendance x WHERE lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,x.lesson_id))),'[]'::jsonb),
  'rewards',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.guild_ebd_reward_pending x WHERE lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,x.lesson_id))),'[]'::jsonb),
  'members',CASE WHEN teacher THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'leader',gm.role='leader')) FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id WHERE gm.guild_id=g AND gm.status='active'),'[]'::jsonb) ELSE '[]'::jsonb END,
  'teachers',CASE WHEN teacher THEN coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM public.guild_ebd_teachers t WHERE guild_id=g AND (r='leader' OR traveler_id=p_actor OR active)),'[]'::jsonb) ELSE '[]'::jsonb END,
  'history',coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM (SELECT id,lesson_id,actor_id,action,entity_id,revision,created_at FROM public.guild_ebd_history h WHERE guild_id=g AND (r='leader' OR (lesson_id=ANY(ids) AND ebd_ops.manager(p_actor,lesson_id))) ORDER BY id DESC LIMIT 100) h),'[]'::jsonb));
END $$;

-- Invoker-only public boundary; authority checks live in the private implementation.
CREATE FUNCTION public.guild_ebd_workspace(p_actor uuid,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_ops.workspace(p_actor,p_offset) $$;
CREATE FUNCTION public.guild_ebd_command(p_actor uuid,p_action text,p_id uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_ops.command(p_actor,p_action,p_id,p_revision,p_data) $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ebd_ops FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA ebd_ops TO authenticated;
GRANT EXECUTE ON FUNCTION ebd_ops.visible(uuid),ebd_ops.workspace(uuid,integer),ebd_ops.command(uuid,text,uuid,integer,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.guild_ebd_workspace(uuid,integer),public.guild_ebd_command(uuid,text,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guild_ebd_workspace(uuid,integer),public.guild_ebd_command(uuid,text,uuid,integer,jsonb) TO authenticated;
-- Old editor cannot bypass versions, teacher permissions or publication controls.
REVOKE EXECUTE ON FUNCTION public.save_guild_lesson(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,text,timestamptz,uuid,boolean),public.set_guild_lesson_status(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
COMMIT;
