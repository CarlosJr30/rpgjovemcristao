-- 010B.3 PRODUCTION: own reviewed envelope, no bootstrap or economic credits.
DO $prod_owner$ BEGIN IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION '010B3 production owner context required';END IF;END $prod_owner$;
DO $prod_deps$ DECLARE f jsonb;t jsonb;actual jsonb;BEGIN
FOR f IN SELECT value FROM jsonb_array_elements($deps$[{"signature":"ebd_class_private.role(uuid,uuid,uuid)","hash":"0ac11dc53dcdb04c462ff65b4311533e","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.active_actor(uuid)","hash":"05ae51c71fa24e9bcd40a14eaa8451b9","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.exact_keys(jsonb,text[])","hash":"88baa8537542e67e7e11fb788c40cdc8","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.guild_role(uuid,uuid,boolean)","hash":"69f1231558149c36917b3f6937472acb","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.leader_not_revoked(uuid)","hash":"9884a68d250d3cc744fd1b8fd2ef0891","acl":["postgres=X/postgres"],"owner":"postgres"},{"signature":"guild_admin_private.require_writes()","hash":"7b0491ee6ef8b6c22e69624c4dab3920","acl":["postgres=X/postgres"],"owner":"postgres"}]$deps$::jsonb) LOOP
IF to_regprocedure(f->>'signature') IS NULL OR EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure(f->>'signature') AND(md5(pg_get_functiondef(oid))<>f->>'hash' OR to_jsonb(proacl) IS DISTINCT FROM f->'acl' OR pg_get_userbyid(proowner)<>f->>'owner')) THEN RAISE EXCEPTION '010B3 production dependency drift: %',f->>'signature';END IF;END LOOP;
FOR t IN SELECT value FROM jsonb_array_elements($tables$[{"name":"guild_ebd_activities","acl":["postgres=arwdDxtm/postgres"],"rls":true,"constraints":[{"name":"guild_ebd_activities_attempt_limit_check","definition":"CHECK (((attempt_limit >= 1) AND (attempt_limit <= 5)))"},{"name":"guild_ebd_activities_check","definition":"CHECK ((((kind = 'choice'::text) AND ((jsonb_array_length(options) >= 2) AND (jsonb_array_length(options) <= 6)) AND (answer_key IS NOT NULL) AND (answer_key >= 0) AND (answer_key < jsonb_array_length(options))) OR ((kind <> 'choice'::text) AND (options = '[]'::jsonb) AND (answer_key IS NULL) AND (criterion = 'manual'::text))))"},{"name":"guild_ebd_activities_criterion_check","definition":"CHECK ((criterion = ANY (ARRAY['participation'::text, 'correct'::text, 'manual'::text])))"},{"name":"guild_ebd_activities_kind_check","definition":"CHECK ((kind = ANY (ARRAY['choice'::text, 'open'::text, 'reflective'::text, 'in_person'::text, 'homework'::text])))"},{"name":"guild_ebd_activities_lesson_id_fkey","definition":"FOREIGN KEY (lesson_id) REFERENCES guild_lessons(id) ON DELETE CASCADE"},{"name":"guild_ebd_activities_pkey","definition":"PRIMARY KEY (id)"},{"name":"guild_ebd_activities_prompt_check","definition":"CHECK (((length(btrim(prompt)) >= 1) AND (length(btrim(prompt)) <= 2000)))"},{"name":"guild_ebd_activities_revision_check","definition":"CHECK ((revision > 0))"},{"name":"guild_ebd_activities_title_check","definition":"CHECK (((length(btrim(title)) >= 2) AND (length(btrim(title)) <= 100)))"}]},{"name":"guild_ebd_answers","acl":["postgres=arwdDxtm/postgres"],"rls":true,"constraints":[{"name":"guild_ebd_answers_activity_id_fkey","definition":"FOREIGN KEY (activity_id) REFERENCES guild_ebd_activities(id) ON DELETE CASCADE"},{"name":"guild_ebd_answers_activity_id_traveler_id_attempt_key","definition":"UNIQUE (activity_id, traveler_id, attempt)"},{"name":"guild_ebd_answers_feedback_check","definition":"CHECK ((length(feedback) <= 1000))"},{"name":"guild_ebd_answers_pkey","definition":"PRIMARY KEY (id)"},{"name":"guild_ebd_answers_response_check","definition":"CHECK (((length(btrim(response)) >= 1) AND (length(btrim(response)) <= 2000)))"},{"name":"guild_ebd_answers_reviewer_id_fkey","definition":"FOREIGN KEY (reviewer_id) REFERENCES travelers(id)"},{"name":"guild_ebd_answers_status_check","definition":"CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'revise'::text])))"},{"name":"guild_ebd_answers_traveler_id_fkey","definition":"FOREIGN KEY (traveler_id) REFERENCES travelers(id) ON DELETE RESTRICT"}]},{"name":"guild_ebd_attendance","acl":["postgres=arwdDxtm/postgres"],"rls":true,"constraints":[{"name":"guild_ebd_attendance_lesson_id_fkey","definition":"FOREIGN KEY (lesson_id) REFERENCES guild_lessons(id) ON DELETE CASCADE"},{"name":"guild_ebd_attendance_marked_by_fkey","definition":"FOREIGN KEY (marked_by) REFERENCES travelers(id)"},{"name":"guild_ebd_attendance_pkey","definition":"PRIMARY KEY (lesson_id, traveler_id)"},{"name":"guild_ebd_attendance_reason_check","definition":"CHECK ((length(reason) <= 500))"},{"name":"guild_ebd_attendance_status_check","definition":"CHECK ((status = ANY (ARRAY['present'::text, 'absent'::text])))"},{"name":"guild_ebd_attendance_traveler_id_fkey","definition":"FOREIGN KEY (traveler_id) REFERENCES travelers(id) ON DELETE RESTRICT"}]},{"name":"guild_ebd_history","acl":["postgres=arwdDxtm/postgres"],"rls":true,"constraints":[{"name":"guild_ebd_history_actor_id_fkey","definition":"FOREIGN KEY (actor_id) REFERENCES travelers(id)"},{"name":"guild_ebd_history_guild_id_fkey","definition":"FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE"},{"name":"guild_ebd_history_lesson_id_fkey","definition":"FOREIGN KEY (lesson_id) REFERENCES guild_lessons(id) ON DELETE CASCADE"},{"name":"guild_ebd_history_pkey","definition":"PRIMARY KEY (id)"}]},{"name":"guild_ebd_reward_pending","acl":["postgres=arwdDxtm/postgres"],"rls":true,"constraints":[{"name":"guild_ebd_reward_pending_activity_id_fkey","definition":"FOREIGN KEY (activity_id) REFERENCES guild_ebd_activities(id)"},{"name":"guild_ebd_reward_pending_answer_id_fkey","definition":"FOREIGN KEY (answer_id) REFERENCES guild_ebd_answers(id)"},{"name":"guild_ebd_reward_pending_lesson_id_fkey","definition":"FOREIGN KEY (lesson_id) REFERENCES guild_lessons(id) ON DELETE CASCADE"},{"name":"guild_ebd_reward_pending_pkey","definition":"PRIMARY KEY (lesson_id, traveler_id)"},{"name":"guild_ebd_reward_pending_tier_check","definition":"CHECK ((tier = ANY (ARRAY['normal'::text, 'great'::text, 'epic'::text, 'extraordinary'::text])))"},{"name":"guild_ebd_reward_pending_traveler_id_fkey","definition":"FOREIGN KEY (traveler_id) REFERENCES travelers(id)"}]},{"name":"guild_ebd_teachers","acl":["postgres=arwdDxtm/postgres"],"rls":true,"constraints":[{"name":"guild_ebd_teachers_guild_id_fkey","definition":"FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE"},{"name":"guild_ebd_teachers_pkey","definition":"PRIMARY KEY (guild_id, traveler_id)"},{"name":"guild_ebd_teachers_revision_check","definition":"CHECK ((revision > 0))"},{"name":"guild_ebd_teachers_traveler_id_fkey","definition":"FOREIGN KEY (traveler_id) REFERENCES travelers(id) ON DELETE CASCADE"}]},{"name":"guild_lessons","acl":["postgres=arwdDxtm/postgres"],"rls":true,"constraints":[{"name":"guild_lessons_activity_check","definition":"CHECK (((activity_text IS NULL) OR (char_length(activity_text) <= 2000)))"},{"name":"guild_lessons_audience_check","definition":"CHECK ((audience = ANY (ARRAY['all'::text, 'selected'::text])))"},{"name":"guild_lessons_content_check","definition":"CHECK ((char_length(content) <= 10000))"},{"name":"guild_lessons_created_by_traveler_id_fkey","definition":"FOREIGN KEY (created_by_traveler_id) REFERENCES travelers(id) ON DELETE RESTRICT"},{"name":"guild_lessons_ebd_revision_check","definition":"CHECK ((ebd_revision > 0))"},{"name":"guild_lessons_guild_id_fkey","definition":"FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE"},{"name":"guild_lessons_introduction_check","definition":"CHECK ((char_length(introduction) <= 2000))"},{"name":"guild_lessons_objectives_check","definition":"CHECK ((length(objectives) <= 2000))"},{"name":"guild_lessons_pkey","definition":"PRIMARY KEY (id)"},{"name":"guild_lessons_points_check","definition":"CHECK (((jsonb_typeof(main_points) = 'array'::text) AND (jsonb_array_length(main_points) <= 12)))"},{"name":"guild_lessons_published_content_check","definition":"CHECK (((status <> ALL (ARRAY['published'::text, 'completed'::text])) OR ((char_length(btrim(content)) > 0) AND (scheduled_at IS NOT NULL))))"},{"name":"guild_lessons_questions_check","definition":"CHECK (((jsonb_typeof(discussion_questions) = 'array'::text) AND (jsonb_array_length(discussion_questions) <= 12)))"},{"name":"guild_lessons_reference_check","definition":"CHECK ((length(bible_reference) <= 100))"},{"name":"guild_lessons_related_mission_id_fkey","definition":"FOREIGN KEY (related_mission_id) REFERENCES guild_missions(id) ON DELETE SET NULL"},{"name":"guild_lessons_reward_tier_check","definition":"CHECK ((reward_tier = ANY (ARRAY['normal'::text, 'great'::text, 'epic'::text, 'extraordinary'::text])))"},{"name":"guild_lessons_status_check","definition":"CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'closed'::text, 'archived'::text, 'completed'::text, 'cancelled'::text])))"},{"name":"guild_lessons_teacher_id_fkey","definition":"FOREIGN KEY (teacher_id) REFERENCES travelers(id) ON DELETE RESTRICT"},{"name":"guild_lessons_theme_check","definition":"CHECK (((char_length(btrim(theme)) >= 2) AND (char_length(btrim(theme)) <= 100)))"},{"name":"guild_lessons_title_check","definition":"CHECK (((char_length(btrim(title)) >= 2) AND (char_length(btrim(title)) <= 100)))"},{"name":"guild_lessons_url_check","definition":"CHECK (((bible_url IS NULL) OR (bible_url ~ '^https://www\\.bible\\.com/[A-Za-z0-9/._?=&%-]{1,240}$'::text)))"}]}]$tables$::jsonb) LOOP
IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.'||(t->>'name')) AND relrowsecurity AND to_jsonb(relacl) IS NOT DISTINCT FROM t->'acl' AND pg_get_userbyid(relowner)='postgres') THEN RAISE EXCEPTION '010B3 production table protection drift';END IF;
SELECT jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid)) ORDER BY conname) INTO actual FROM pg_constraint WHERE conrelid=to_regclass('public.'||(t->>'name'));
IF actual IS DISTINCT FROM t->'constraints' THEN RAISE EXCEPTION '010B3 production constraint drift: %',t->>'name';END IF;END LOOP;
END $prod_deps$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $guard$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' OR to_regclass('ebd_class_private.quizzes') IS NOT NULL
 OR to_regclass('ebd_class_private.classes') IS NULL THEN RAISE EXCEPTION 'Reviewed 010B.3 production baseline required';END IF;
END $guard$;
DO $baseline$ DECLARE f jsonb;BEGIN FOR f IN SELECT value FROM jsonb_array_elements($manifest$[{"signature":"ebd_ops.command(uuid,text,uuid,integer,jsonb)","hash":"0f8f9a149fb216628855ffe0b3d396fe","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)","hash":"03780d57b32a22733dd0967807f51503","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.eligible(uuid,uuid)","hash":"c806a1810a3a3ea01cc859fdb7e89073","acl":["postgres=X/postgres"]},{"signature":"ebd_ops.manager(uuid,uuid,text)","hash":"f187285193d8dd606fad7167e88bb82f","acl":["postgres=X/postgres"]},{"signature":"ebd_ops.visible(uuid)","hash":"c1b7afd2fc8d4ceedb61e498a1edfcc3","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.workspace(uuid,integer)","hash":"caa883b030ba7047f8fae43beaff9c80","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.workspace(uuid,uuid,integer)","hash":"b4c8464bc7260145f8e0e36516dd7205","acl":["postgres=X/postgres","authenticated=X/postgres"]}]$manifest$::jsonb) LOOP
 IF to_regprocedure(f->>'signature') IS NULL OR EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure(f->>'signature') AND(md5(pg_get_functiondef(oid))<>f->>'hash' OR to_jsonb(proacl) IS DISTINCT FROM f->'acl')) THEN RAISE EXCEPTION '010B.3 legacy definition or ACL drift: %',f->>'signature';END IF;
 END LOOP;END $baseline$;
ALTER TABLE public.guild_lessons ADD COLUMN ebd_class_id uuid;
ALTER TABLE public.guild_lessons ADD CONSTRAINT guild_lessons_class_scope_fk FOREIGN KEY(ebd_class_id,guild_id) REFERENCES ebd_class_private.classes(id,guild_id);
CREATE INDEX guild_lessons_class_idx ON public.guild_lessons(ebd_class_id,created_at DESC,id) WHERE ebd_class_id IS NOT NULL;
ALTER TABLE public.guild_lessons DROP CONSTRAINT guild_lessons_theme_check;
ALTER TABLE public.guild_lessons ADD CONSTRAINT guild_lessons_theme_check CHECK(length(theme)<=100 AND(ebd_class_id IS NOT NULL OR length(btrim(theme))>=2));
ALTER TABLE public.guild_lessons DROP CONSTRAINT guild_lessons_published_content_check;
ALTER TABLE public.guild_lessons ADD CONSTRAINT guild_lessons_published_content_check CHECK(ebd_class_id IS NOT NULL OR status NOT IN('published','completed') OR(length(btrim(content))>0 AND scheduled_at IS NOT NULL));
ALTER TABLE public.guild_ebd_attendance DROP CONSTRAINT guild_ebd_attendance_status_check;
ALTER TABLE public.guild_ebd_attendance ADD CONSTRAINT guild_ebd_attendance_status_check CHECK(status IN('pending','present','absent','justified'));
CREATE TABLE ebd_class_private.quizzes(
 id uuid PRIMARY KEY,lesson_id uuid NOT NULL REFERENCES public.guild_lessons(id),revision integer NOT NULL CHECK(revision>0),
 current boolean NOT NULL DEFAULT true,difficulty text NOT NULL CHECK(difficulty IN('easy','medium','hard')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(lesson_id,revision)
);
CREATE UNIQUE INDEX one_current_quiz ON ebd_class_private.quizzes(lesson_id) WHERE current;
CREATE TABLE ebd_class_private.quiz_questions(
 quiz_id uuid NOT NULL REFERENCES ebd_class_private.quizzes(id),position integer NOT NULL CHECK(position BETWEEN 1 AND 7),
 activity_id uuid NOT NULL UNIQUE REFERENCES public.guild_ebd_activities(id),reference text NOT NULL CHECK(length(reference)<=100),
 feedback text NOT NULL CHECK(length(feedback)<=1000),PRIMARY KEY(quiz_id,position)
);
CREATE TABLE ebd_class_private.quiz_results(
 quiz_id uuid NOT NULL REFERENCES ebd_class_private.quizzes(id),traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 request_id uuid NOT NULL,score integer NOT NULL CHECK(score BETWEEN 0 AND 7),attempt integer NOT NULL CHECK(attempt>0),
 submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(quiz_id,traveler_id)
);
CREATE TABLE ebd_class_private.attendance_eligibility(
 lesson_id uuid NOT NULL,traveler_id uuid NOT NULL,attendance_revision integer NOT NULL CHECK(attendance_revision>0),
 eligible boolean NOT NULL,xp_contract integer NOT NULL DEFAULT 50 CHECK(xp_contract=50),
 xp_issued integer NOT NULL DEFAULT 0 CHECK(xp_issued=0),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(lesson_id,traveler_id),FOREIGN KEY(lesson_id,traveler_id) REFERENCES public.guild_ebd_attendance(lesson_id,traveler_id)
);
DO $rls$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['quizzes','quiz_questions','quiz_results','attendance_eligibility'] LOOP
 EXECUTE format('ALTER TABLE ebd_class_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON ebd_class_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $rls$;
CREATE FUNCTION ebd_class_private.lesson_manager(p_actor uuid,p_lesson uuid,p_permission text DEFAULT 'edit') RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $body$
DECLARE l public.guild_lessons;r text;t ebd_class_private.teachers;BEGIN
 SELECT * INTO l FROM public.guild_lessons WHERE id=p_lesson;IF l.ebd_class_id IS NULL THEN RETURN false;END IF;
 r:=ebd_class_private.role(p_actor,l.guild_id,l.ebd_class_id);
 IF r='leader' THEN RETURN true;END IF;IF r<>'teacher' THEN RETURN false;END IF;
 SELECT * INTO t FROM ebd_class_private.teachers WHERE class_id=l.ebd_class_id AND traveler_id=p_actor AND active;
 RETURN CASE p_permission WHEN 'attend' THEN t.can_attend WHEN 'publish' THEN t.can_publish AND l.teacher_id=p_actor WHEN 'edit' THEN l.teacher_id=p_actor ELSE false END;
END $body$;
CREATE FUNCTION ebd_class_private.lesson_visible(p_actor uuid,p_lesson uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $visible$
DECLARE l public.guild_lessons;BEGIN
 SELECT * INTO l FROM public.guild_lessons WHERE id=p_lesson;IF l.ebd_class_id IS NULL THEN RETURN false;END IF;
 PERFORM ebd_class_private.role(p_actor,l.guild_id,l.ebd_class_id);
 RETURN ebd_class_private.lesson_manager(p_actor,l.id)
 OR(l.status IN('scheduled','published','closed') AND(l.audience='all' OR p_actor=ANY(l.target_ids)))
 OR EXISTS(SELECT 1 FROM public.guild_ebd_attendance WHERE lesson_id=l.id AND traveler_id=p_actor)
 OR EXISTS(SELECT 1 FROM public.guild_ebd_answers b JOIN public.guild_ebd_activities a ON a.id=b.activity_id WHERE a.lesson_id=l.id AND b.traveler_id=p_actor);
END $visible$;
CREATE FUNCTION ebd_class_private.lessons_workspace(p_actor uuid,p_guild uuid,p_class uuid,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $workspace$
DECLARE r text;ids uuid[];total integer;staff boolean;BEGIN
 r:=ebd_class_private.role(p_actor,p_guild,p_class);staff:=r IN('leader','teacher');
 IF p_offset IS NULL OR p_offset<0 OR p_offset>10000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO total FROM public.guild_lessons l WHERE l.guild_id=p_guild AND l.ebd_class_id=p_class
 AND ebd_class_private.lesson_visible(p_actor,l.id);
 SELECT coalesce(array_agg(id),'{}') INTO ids FROM(SELECT l.id FROM public.guild_lessons l WHERE l.guild_id=p_guild AND l.ebd_class_id=p_class
 AND ebd_class_private.lesson_visible(p_actor,l.id) ORDER BY l.created_at DESC,l.id LIMIT 20 OFFSET p_offset) s;
 RETURN jsonb_build_object('version',2,'guildId',p_guild,'classId',p_class,'leader',r='leader','teacher',staff,'total',total,
 'lessons',coalesce((SELECT jsonb_agg((to_jsonb(l)-'creation_hash')||CASE WHEN l.status NOT IN('published','closed') AND NOT ebd_class_private.lesson_manager(p_actor,l.id) THEN jsonb_build_object('content','','materials','[]'::jsonb,'objectives','','activity_text',NULL,'main_points','[]'::jsonb,'discussion_questions','[]'::jsonb,'introduction','')||CASE WHEN l.status<>'scheduled' THEN jsonb_build_object('title','Aula em revisão (histórico)','theme','','bible_reference','') ELSE '{}'::jsonb END ELSE '{}'::jsonb END
 ||jsonb_build_object('canEdit',ebd_class_private.lesson_manager(p_actor,l.id),'canPublish',ebd_class_private.lesson_manager(p_actor,l.id,'publish'),'canAttend',ebd_class_private.lesson_manager(p_actor,l.id,'attend'),'canParticipate',l.status='published' AND(l.audience='all' OR p_actor=ANY(l.target_ids)) AND EXISTS(SELECT 1 FROM ebd_class_private.members cm WHERE cm.class_id=p_class AND cm.traveler_id=p_actor AND cm.status='active')) ORDER BY l.created_at DESC,l.id) FROM public.guild_lessons l WHERE l.id=ANY(ids)),'[]'::jsonb),
 'activities',coalesce((SELECT jsonb_agg(to_jsonb(a)-'answer_key'-'creation_hash') FROM public.guild_ebd_activities a JOIN public.guild_lessons l ON l.id=a.lesson_id WHERE a.lesson_id=ANY(ids) AND NOT EXISTS(SELECT 1 FROM ebd_class_private.quiz_questions q WHERE q.activity_id=a.id) AND(l.status IN('published','closed') OR ebd_class_private.lesson_manager(p_actor,l.id))),'[]'::jsonb),
 'answers',coalesce((SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('traveler_name',t.name) ORDER BY b.submitted_at DESC) FROM public.guild_ebd_answers b JOIN public.guild_ebd_activities a ON a.id=b.activity_id JOIN public.travelers t ON t.id=b.traveler_id WHERE a.lesson_id=ANY(ids) AND NOT EXISTS(SELECT 1 FROM ebd_class_private.quiz_questions q WHERE q.activity_id=a.id) AND(b.traveler_id=p_actor OR ebd_class_private.lesson_manager(p_actor,a.lesson_id))),'[]'::jsonb),
 'attendance',coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM public.guild_ebd_attendance b WHERE b.lesson_id=ANY(ids) AND(b.traveler_id=p_actor OR ebd_class_private.lesson_manager(p_actor,b.lesson_id,'attend'))),'[]'::jsonb),
 'eligibility',coalesce((SELECT jsonb_agg(to_jsonb(e)) FROM ebd_class_private.attendance_eligibility e WHERE e.lesson_id=ANY(ids) AND(e.traveler_id=p_actor OR ebd_class_private.lesson_manager(p_actor,e.lesson_id,'attend'))),'[]'::jsonb),
 'members',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'leader',false)) FROM ebd_class_private.members m JOIN public.travelers t ON t.id=m.traveler_id WHERE m.class_id=p_class AND m.status='active'),'[]'::jsonb) ELSE '[]'::jsonb END,
 'teachers',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('traveler_id',t.traveler_id,'active',t.active,'can_publish',t.can_publish,'can_attend',t.can_attend,'revision',t.revision)) FROM ebd_class_private.teachers t WHERE class_id=p_class AND active),'[]'::jsonb) ELSE '[]'::jsonb END,
 'teacherCandidates',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name)) FROM public.travelers t JOIN public.guild_members gm ON gm.traveler_id=t.id WHERE gm.guild_id=p_guild AND gm.status='active' AND((gm.role='leader' AND guild_admin_private.leader_not_revoked(t.id)) OR EXISTS(SELECT 1 FROM ebd_class_private.teachers ct WHERE ct.class_id=p_class AND ct.traveler_id=t.id AND ct.active))),'[]'::jsonb) ELSE '[]'::jsonb END,
 'rewards','[]'::jsonb,
 'quizzes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'lessonId',q.lesson_id,'revision',q.revision,'difficulty',q.difficulty,
 'questions',(SELECT jsonb_agg(jsonb_build_object('id',a.id,'position',x.position,'prompt',a.prompt,'options',a.options,'reference',x.reference)
 ||CASE WHEN ebd_class_private.lesson_manager(p_actor,q.lesson_id) THEN jsonb_build_object('answerKey',a.answer_key,'feedback',x.feedback) ELSE '{}'::jsonb END ORDER BY x.position) FROM ebd_class_private.quiz_questions x JOIN public.guild_ebd_activities a ON a.id=x.activity_id WHERE x.quiz_id=q.id))) FROM ebd_class_private.quizzes q JOIN public.guild_lessons l ON l.id=q.lesson_id WHERE q.lesson_id=ANY(ids) AND q.current AND(l.status IN('published','closed') OR ebd_class_private.lesson_manager(p_actor,l.id))),'[]'::jsonb),
 'quizResults',coalesce((SELECT jsonb_agg((to_jsonb(x)-'request_id')||jsonb_build_object('lessonId',q.lesson_id,'quizRevision',q.revision,'traveler_name',t.name,
 'attempts',(SELECT count(*)/7 FROM public.guild_ebd_answers b JOIN ebd_class_private.quiz_questions z ON z.activity_id=b.activity_id WHERE z.quiz_id=q.id AND b.traveler_id=x.traveler_id),
 'latest',(SELECT jsonb_agg(jsonb_build_object('position',z.position,'choice',b.choice,'correct',b.choice=a.answer_key,'feedback',b.feedback) ORDER BY z.position) FROM public.guild_ebd_answers b JOIN ebd_class_private.quiz_questions z ON z.activity_id=b.activity_id JOIN public.guild_ebd_activities a ON a.id=b.activity_id WHERE z.quiz_id=q.id AND b.traveler_id=x.traveler_id AND b.attempt=(SELECT max(b2.attempt) FROM public.guild_ebd_answers b2 JOIN ebd_class_private.quiz_questions z2 ON z2.activity_id=b2.activity_id WHERE z2.quiz_id=q.id AND b2.traveler_id=x.traveler_id))))
 FROM ebd_class_private.quiz_results x JOIN ebd_class_private.quizzes q ON q.id=x.quiz_id JOIN public.travelers t ON t.id=x.traveler_id WHERE q.lesson_id=ANY(ids) AND(x.traveler_id=p_actor OR ebd_class_private.lesson_manager(p_actor,q.lesson_id))),'[]'::jsonb),
 'history',coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM(SELECT h.id,h.lesson_id,h.actor_id,h.action,h.entity_id,h.revision,h.created_at FROM public.guild_ebd_history h WHERE h.lesson_id=ANY(ids) AND(ebd_class_private.lesson_manager(p_actor,h.lesson_id) OR h.actor_id=p_actor OR h.snapshot->>'target'=p_actor::text) ORDER BY h.id DESC LIMIT 100) h),'[]'::jsonb));
END $workspace$;
CREATE FUNCTION ebd_class_private.lessons_command(p_actor uuid,p_guild uuid,p_class uuid,p_action text,p_id uuid,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
DECLARE owner_id uuid;r text;signature_value text;prior ebd_class_private.commands;l public.guild_lessons;a public.guild_ebd_activities;
 ans public.guild_ebd_answers;att public.guild_ebd_attendance;qz ebd_class_private.quizzes;item jsonb;question_row record;
 teacher_key uuid;target uuid;lesson_key uuid;quiz_key uuid;activity_key uuid;next_rev integer;v_attempt integer;v_score integer:=0;v_choice integer;
 old_value jsonb;after_value jsonb;response jsonb;v_state text;v_targets uuid[];v_now timestamptz:=clock_timestamp();
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();
 v_now:=clock_timestamp();
 owner_id:=guild_admin_private.active_actor(p_actor);r:=ebd_class_private.role(p_actor,p_guild,p_class);
 IF NOT EXISTS(SELECT 1 FROM ebd_class_private.classes WHERE id=p_class AND status='active') THEN RAISE EXCEPTION 'Class unavailable' USING ERRCODE='42501';END IF;
 IF p_id IS NULL OR p_request IS NULL OR p_revision IS NULL OR p_revision<0 OR p_action IS NULL OR p_action NOT IN('lesson','state','activity','submit','grade','attendance','quiz','quiz_remove','quiz_submit')
 OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>60000 THEN RAISE EXCEPTION 'Invalid class EBD command' USING ERRCODE='22023';END IF;
 lesson_key:=CASE WHEN p_action IN('activity','quiz','quiz_remove') THEN (p_data->>'lessonId')::uuid WHEN p_action='submit' THEN(SELECT linked.lesson_id FROM public.guild_ebd_activities linked WHERE linked.id=(p_data->>'activityId')::uuid)
 WHEN p_action='grade' THEN(SELECT x.lesson_id FROM public.guild_ebd_answers b JOIN public.guild_ebd_activities x ON x.id=b.activity_id WHERE b.id=p_id) ELSE p_id END;
 SELECT * INTO l FROM public.guild_lessons WHERE id=lesson_key FOR UPDATE;
 IF l.id IS NOT NULL AND(l.guild_id<>p_guild OR l.ebd_class_id IS DISTINCT FROM p_class) THEN RAISE EXCEPTION 'Lesson outside class' USING ERRCODE='42501';END IF;
 IF l.id IS NULL AND p_action<>'lesson' THEN RAISE EXCEPTION 'Lesson unavailable' USING ERRCODE='P0002';END IF;
 IF p_action IN('quiz','quiz_remove') AND l.id IS DISTINCT FROM p_id THEN RAISE EXCEPTION 'Quiz lesson mismatch' USING ERRCODE='22023';END IF;
 IF p_action='lesson' THEN
 IF r NOT IN('leader','teacher') OR(l.id IS NOT NULL AND NOT ebd_class_private.lesson_manager(p_actor,l.id)) THEN RAISE EXCEPTION 'Teacher permission required' USING ERRCODE='42501';END IF;
 ELSIF p_action IN('state','activity','grade','quiz','quiz_remove') THEN
 IF NOT ebd_class_private.lesson_manager(p_actor,l.id,CASE WHEN p_action='state' THEN 'publish' ELSE 'edit' END) THEN RAISE EXCEPTION 'Teacher permission required' USING ERRCODE='42501';END IF;
 ELSIF p_action='attendance' THEN
 IF NOT ebd_class_private.lesson_manager(p_actor,l.id,'attend') THEN RAISE EXCEPTION 'Attendance permission required' USING ERRCODE='42501';END IF;
 ELSE
 IF l.status<>'published' OR(l.audience='selected' AND NOT p_actor=ANY(l.target_ids)) OR NOT EXISTS(SELECT 1 FROM ebd_class_private.members WHERE class_id=p_class AND traveler_id=p_actor AND status='active') THEN RAISE EXCEPTION 'Student participation unavailable' USING ERRCODE='42501';END IF;
 END IF;
 signature_value:=encode(extensions.digest(jsonb_build_object('actor',p_actor,'guild',p_guild,'class',p_class,'action',p_action,'id',p_id,'revision',p_revision,'data',p_data)::text,'sha256'),'hex');
 SELECT * INTO prior FROM ebd_class_private.commands WHERE user_id=owner_id AND request_id=p_request;
 IF FOUND THEN IF prior.signature<>signature_value THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023';END IF;RETURN prior.result||jsonb_build_object('replayed',true);END IF;
 old_value:=to_jsonb(l);
 IF p_action='lesson' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['title','theme','description','content','reference','scheduledAt','teacherId','audience','targetIds','materials','objectives','rewardTier']);
 teacher_key:=(p_data->>'teacherId')::uuid;
 IF coalesce(p_data->>'rewardTier','')<>'' OR (r<>'leader' AND teacher_key<>p_actor) THEN RAISE EXCEPTION 'Permission unavailable' USING ERRCODE='42501';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.guild_members gm WHERE gm.guild_id=p_guild AND gm.traveler_id=teacher_key AND gm.status='active'
 AND((gm.role='leader' AND guild_admin_private.leader_not_revoked(teacher_key)) OR EXISTS(SELECT 1 FROM ebd_class_private.teachers t WHERE t.class_id=p_class AND t.traveler_id=teacher_key AND t.active))) THEN RAISE EXCEPTION 'Teacher unavailable' USING ERRCODE='42501';END IF;
 IF length(btrim(coalesce(p_data->>'title',''))) NOT BETWEEN 2 AND 100 OR length(coalesce(p_data->>'theme',''))>100 OR length(coalesce(p_data->>'description',''))>2000 OR length(coalesce(p_data->>'content',''))>10000
 OR length(coalesce(p_data->>'reference',''))>100 OR length(coalesce(p_data->>'objectives',''))>2000
 OR coalesce(p_data->>'audience','') NOT IN('all','selected') OR jsonb_typeof(p_data->'targetIds') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'targetIds')>100
 OR jsonb_typeof(p_data->'materials') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'materials')>20 THEN RAISE EXCEPTION 'Invalid lesson' USING ERRCODE='22023';END IF;
 SELECT coalesce(array_agg(value::uuid),'{}') INTO v_targets FROM jsonb_array_elements_text(p_data->'targetIds');
 IF(p_data->>'audience'='all' AND cardinality(v_targets)>0) OR(p_data->>'audience'='selected' AND cardinality(v_targets)=0) OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE NOT EXISTS(SELECT 1 FROM ebd_class_private.members WHERE class_id=p_class AND traveler_id=t AND status='active')) THEN RAISE EXCEPTION 'Class audience unavailable' USING ERRCODE='42501';END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_data->'materials') LOOP
 IF jsonb_typeof(item)<>'object' OR coalesce(item->>'kind','') NOT IN('link','image','pdf','text','reference') OR length(btrim(coalesce(item->>'title',''))) NOT BETWEEN 1 AND 100 OR length(btrim(coalesce(item->>'value',''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid material' USING ERRCODE='22023';END IF;
 IF item->>'kind' IN('link','image','pdf') AND(length(item->>'value')>500 OR item->>'value' !~ '^https://[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(/[A-Za-z0-9/._~!$&()*+,;=:@%?#-]*)?$' OR item->>'value' ~* '^https://([^/]*\.)?(localhost|local|internal|invalid|test|example)(/|$)' OR item->>'value' ~* '^https://[^/]*\.(local|internal|invalid|test|example)(/|$)') THEN RAISE EXCEPTION 'Unsafe material' USING ERRCODE='22023';END IF;
 END LOOP;
 IF coalesce(l.ebd_revision,0)<>p_revision OR(l.id IS NOT NULL AND l.status<>'draft') THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409';END IF;
 INSERT INTO public.guild_lessons(id,guild_id,ebd_class_id,created_by_traveler_id,teacher_id,title,theme,introduction,content,bible_reference,scheduled_at,audience,target_ids,materials,objectives,reward_tier,creation_hash)
 VALUES(p_id,p_guild,p_class,p_actor,teacher_key,btrim(p_data->>'title'),btrim(coalesce(p_data->>'theme','')),coalesce(p_data->>'description',''),coalesce(p_data->>'content',''),coalesce(p_data->>'reference',''),nullif(p_data->>'scheduledAt','')::timestamptz,p_data->>'audience',v_targets,p_data->'materials',coalesce(p_data->>'objectives',''),NULL,md5(p_data::text))
 ON CONFLICT(id) DO UPDATE SET teacher_id=excluded.teacher_id,title=excluded.title,theme=excluded.theme,introduction=excluded.introduction,content=excluded.content,bible_reference=excluded.bible_reference,scheduled_at=excluded.scheduled_at,audience=excluded.audience,target_ids=excluded.target_ids,materials=excluded.materials,objectives=excluded.objectives,ebd_revision=guild_lessons.ebd_revision+1;
 next_rev:=p_revision+1;
 ELSIF p_action='state' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['state']);v_state:=p_data->>'state';
 IF l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409';END IF;
 IF NOT((l.status='draft' AND v_state IN('scheduled','published','archived')) OR(l.status='scheduled' AND v_state IN('draft','published','archived')) OR(l.status='published' AND v_state IN('draft','closed','archived')) OR(l.status='closed' AND v_state IN('draft','archived'))) THEN RAISE EXCEPTION 'Invalid lesson transition' USING ERRCODE='22023';END IF;
 IF v_state='scheduled' AND l.scheduled_at IS NULL THEN RAISE EXCEPTION 'Lesson date required' USING ERRCODE='22023';END IF;
 IF v_state IN('scheduled','published') AND length(btrim(l.content))=0
 AND NOT EXISTS(SELECT 1 FROM ebd_class_private.quizzes q WHERE q.lesson_id=l.id AND q.current)
 AND NOT EXISTS(SELECT 1 FROM public.guild_ebd_activities practice_item WHERE practice_item.lesson_id=l.id AND practice_item.kind IN('open','reflective','in_person','homework'))
 THEN RAISE EXCEPTION 'Lesson content or learning activity required' USING ERRCODE='22023';END IF;
 IF v_state='published' AND EXISTS(SELECT 1 FROM ebd_class_private.quizzes q WHERE q.lesson_id=l.id AND q.current AND(SELECT count(*) FROM ebd_class_private.quiz_questions x WHERE x.quiz_id=q.id)<>7) THEN RAISE EXCEPTION 'Exactly seven questions required' USING ERRCODE='22023';END IF;
 UPDATE public.guild_lessons SET status=v_state,ebd_revision=ebd_revision+1,published_at=CASE WHEN v_state='published' THEN coalesce(published_at,v_now) ELSE published_at END WHERE id=l.id;next_rev:=p_revision+1;
 ELSIF p_action='quiz' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['lessonId','difficulty','questions']);
 IF l.status<>'draft' OR l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409';END IF;
 IF coalesce(p_data->>'difficulty','') NOT IN('easy','medium','hard') OR jsonb_typeof(p_data->'questions') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'questions')<>7 THEN RAISE EXCEPTION 'Exactly seven questions required' USING ERRCODE='22023';END IF;
 quiz_key:=gen_random_uuid();SELECT coalesce(max(revision),0)+1 INTO next_rev FROM ebd_class_private.quizzes WHERE lesson_id=l.id;
 UPDATE ebd_class_private.quizzes SET current=false WHERE lesson_id=l.id AND current;
 INSERT INTO ebd_class_private.quizzes VALUES(quiz_key,l.id,next_rev,true,p_data->>'difficulty',v_now);v_score:=0;
 FOR item IN SELECT value FROM jsonb_array_elements(p_data->'questions') LOOP
 PERFORM guild_admin_private.exact_keys(item,ARRAY['prompt','options','answerKey','reference','feedback']);
 IF length(btrim(coalesce(item->>'prompt',''))) NOT BETWEEN 1 AND 2000 OR jsonb_typeof(item->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(item->'options')<>4 OR jsonb_typeof(item->'answerKey') IS DISTINCT FROM 'number' OR item->>'answerKey' !~ '^[0-3]$'
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(item->'options') x WHERE jsonb_typeof(x)<>'string' OR length(btrim(x#>>'{}')) NOT BETWEEN 1 AND 300)
 OR(SELECT count(DISTINCT btrim(x)) FROM jsonb_array_elements_text(item->'options') x)<>4
 OR length(coalesce(item->>'reference',''))>100 OR length(coalesce(item->>'feedback',''))>1000 THEN RAISE EXCEPTION 'Invalid question' USING ERRCODE='22023';END IF;
 v_score:=v_score+1;activity_key:=gen_random_uuid();
 INSERT INTO public.guild_ebd_activities(id,lesson_id,title,kind,prompt,options,answer_key,attempt_limit,criterion,creation_hash)
 VALUES(activity_key,l.id,'Questao '||v_score,'choice',item->>'prompt',item->'options',(item->>'answerKey')::integer,5,'correct',md5(item::text));
 INSERT INTO ebd_class_private.quiz_questions VALUES(quiz_key,v_score,activity_key,coalesce(item->>'reference',''),coalesce(item->>'feedback',''));
 END LOOP;
 UPDATE public.guild_lessons SET ebd_revision=ebd_revision+1 WHERE id=l.id;next_rev:=l.ebd_revision+1;
 ELSIF p_action='quiz_remove' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['lessonId']);
 IF l.status<>'draft' OR l.ebd_revision<>p_revision OR l.id<>p_id THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409';END IF;
 UPDATE ebd_class_private.quizzes SET current=false WHERE lesson_id=l.id AND current;
 UPDATE public.guild_lessons SET ebd_revision=ebd_revision+1 WHERE id=l.id;next_rev:=p_revision+1;
 ELSIF p_action='quiz_submit' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['quizId','choices']);SELECT * INTO qz FROM ebd_class_private.quizzes WHERE id=(p_data->>'quizId')::uuid AND lesson_id=l.id AND current;
 IF qz.id IS NULL OR qz.revision<>p_revision THEN RAISE EXCEPTION 'Quiz revision conflict' USING ERRCODE='PT409';END IF;
 IF(SELECT count(*) FROM ebd_class_private.quiz_questions WHERE quiz_id=qz.id)<>7 THEN RAISE EXCEPTION 'Quiz integrity failure' USING ERRCODE='55000';END IF;
 IF jsonb_typeof(p_data->'choices') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'choices')<>7 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_data->'choices') x WHERE jsonb_typeof(x)<>'number' OR x::text !~ '^[0-3]$') THEN RAISE EXCEPTION 'Seven choices required' USING ERRCODE='22023';END IF;
 SELECT coalesce(max(b.attempt),0)+1 INTO v_attempt FROM public.guild_ebd_answers b JOIN ebd_class_private.quiz_questions x ON x.activity_id=b.activity_id WHERE x.quiz_id=qz.id AND b.traveler_id=p_actor;
 FOR question_row IN SELECT x.*,qa.answer_key,qa.options FROM ebd_class_private.quiz_questions x JOIN public.guild_ebd_activities qa ON qa.id=x.activity_id WHERE x.quiz_id=qz.id ORDER BY position LOOP
 v_choice:=(p_data->'choices'->>(question_row.position-1))::integer;IF v_choice=question_row.answer_key THEN v_score:=v_score+1;END IF;
 INSERT INTO public.guild_ebd_answers(id,activity_id,traveler_id,attempt,response,choice,status,feedback,evaluated_at)
 VALUES(gen_random_uuid(),question_row.activity_id,p_actor,v_attempt,question_row.options->>v_choice,v_choice,CASE WHEN v_choice=question_row.answer_key THEN 'completed' ELSE 'revise' END,question_row.feedback,v_now);
 END LOOP;
 INSERT INTO ebd_class_private.quiz_results(quiz_id,traveler_id,request_id,score,attempt) VALUES(qz.id,p_actor,p_request,v_score,v_attempt) ON CONFLICT(quiz_id,traveler_id) DO NOTHING;
 next_rev:=v_attempt;
 ELSIF p_action='attendance' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['travelerId','status','reason']);target:=(p_data->>'travelerId')::uuid;
 IF EXISTS(SELECT 1 FROM public.travelers WHERE id=target AND user_id=owner_id) OR l.status NOT IN('published','closed') OR(l.scheduled_at IS NOT NULL AND l.scheduled_at>v_now) OR NOT EXISTS(SELECT 1 FROM ebd_class_private.members WHERE class_id=p_class AND traveler_id=target AND status='active') OR l.audience='selected' AND NOT target=ANY(l.target_ids) THEN RAISE EXCEPTION 'Attendance student unavailable' USING ERRCODE='42501';END IF;
 IF coalesce(p_data->>'status','') NOT IN('pending','present','absent','justified') OR length(coalesce(p_data->>'reason',''))>500 THEN RAISE EXCEPTION 'Invalid attendance' USING ERRCODE='22023';END IF;
 SELECT * INTO att FROM public.guild_ebd_attendance WHERE lesson_id=l.id AND traveler_id=target FOR UPDATE;
 IF coalesce(att.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409';END IF;
 next_rev:=p_revision+1;
 INSERT INTO public.guild_ebd_attendance VALUES(l.id,target,p_data->>'status',coalesce(p_data->>'reason',''),next_rev,p_actor,v_now)
 ON CONFLICT(lesson_id,traveler_id) DO UPDATE SET status=excluded.status,reason=excluded.reason,revision=excluded.revision,marked_by=excluded.marked_by,updated_at=excluded.updated_at;
 INSERT INTO ebd_class_private.attendance_eligibility(lesson_id,traveler_id,attendance_revision,eligible) VALUES(l.id,target,next_rev,p_data->>'status'='present')
 ON CONFLICT(lesson_id,traveler_id) DO UPDATE SET attendance_revision=excluded.attendance_revision,eligible=excluded.eligible,updated_at=v_now;
 ELSIF p_action='activity' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['lessonId','title','kind','prompt','options','answerKey','deadline','attemptLimit','criterion']);
 IF l.status<>'draft' THEN RAISE EXCEPTION 'Draft required' USING ERRCODE='PT409';END IF;
 IF length(btrim(coalesce(p_data->>'title',''))) NOT BETWEEN 2 AND 100 OR length(btrim(coalesce(p_data->>'prompt',''))) NOT BETWEEN 1 AND 2000
 OR coalesce(p_data->>'kind','') NOT IN('open','reflective','in_person','homework') OR p_data->>'criterion' IS DISTINCT FROM 'manual' OR p_data->'options' IS DISTINCT FROM '[]'::jsonb
 OR p_data->'answerKey' IS DISTINCT FROM 'null'::jsonb OR coalesce(p_data->>'attemptLimit','') !~ '^[1-5]$' THEN RAISE EXCEPTION 'Invalid practical activity' USING ERRCODE='22023';END IF;
 SELECT * INTO a FROM public.guild_ebd_activities WHERE id=p_id FOR UPDATE;
 IF(a.id IS NOT NULL AND(a.lesson_id<>l.id OR EXISTS(SELECT 1 FROM ebd_class_private.quiz_questions WHERE activity_id=a.id))) THEN RAISE EXCEPTION 'Activity unavailable' USING ERRCODE='42501';END IF;
 IF coalesce(a.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409';END IF;
 IF a.id IS NULL AND(SELECT count(*) FROM public.guild_ebd_activities x WHERE x.lesson_id=l.id AND NOT EXISTS(SELECT 1 FROM ebd_class_private.quiz_questions q WHERE q.activity_id=x.id))>=20 THEN RAISE EXCEPTION 'Activity limit' USING ERRCODE='54000';END IF;
 INSERT INTO public.guild_ebd_activities(id,lesson_id,title,kind,prompt,options,answer_key,deadline,attempt_limit,criterion,creation_hash)
 VALUES(p_id,l.id,btrim(p_data->>'title'),p_data->>'kind',p_data->>'prompt','[]',NULL,nullif(p_data->>'deadline','')::timestamptz,(p_data->>'attemptLimit')::integer,'manual',md5(p_data::text))
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,kind=excluded.kind,prompt=excluded.prompt,deadline=excluded.deadline,attempt_limit=excluded.attempt_limit,revision=guild_ebd_activities.revision+1;
 next_rev:=p_revision+1;old_value:=to_jsonb(a);
 ELSIF p_action='submit' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['activityId','response','choice']);
 SELECT * INTO a FROM public.guild_ebd_activities WHERE id=(p_data->>'activityId')::uuid;
 IF EXISTS(SELECT 1 FROM ebd_class_private.quiz_questions WHERE activity_id=a.id) OR p_data->>'response' IS DISTINCT FROM 'Participação declarada' OR p_data->'choice' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'Participation only; no private text' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO v_attempt FROM public.guild_ebd_answers WHERE activity_id=a.id AND traveler_id=p_actor;
 IF v_attempt<>p_revision OR v_attempt>=a.attempt_limit OR(a.deadline IS NOT NULL AND a.deadline<=v_now) OR EXISTS(SELECT 1 FROM public.guild_ebd_answers WHERE activity_id=a.id AND traveler_id=p_actor AND status IN('pending','completed')) THEN RAISE EXCEPTION 'Attempt unavailable' USING ERRCODE='PT409';END IF;
 INSERT INTO public.guild_ebd_answers(id,activity_id,traveler_id,attempt,response,choice,status) VALUES(p_id,a.id,p_actor,v_attempt+1,'Participação declarada',NULL,'pending');next_rev:=1;
 ELSIF p_action='grade' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['status','feedback']);SELECT * INTO ans FROM public.guild_ebd_answers WHERE id=p_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.travelers WHERE id=ans.traveler_id AND user_id=owner_id) OR EXISTS(SELECT 1 FROM ebd_class_private.quiz_questions WHERE activity_id=ans.activity_id) THEN RAISE EXCEPTION 'Responsible review required; quiz is server graded only' USING ERRCODE='42501';END IF;
 IF ans.revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409';END IF;
 IF coalesce(p_data->>'status','') NOT IN('completed','revise') OR length(coalesce(p_data->>'feedback',''))>1000 THEN RAISE EXCEPTION 'Invalid review' USING ERRCODE='22023';END IF;
 old_value:=to_jsonb(ans);
 UPDATE public.guild_ebd_answers SET status=p_data->>'status',feedback=coalesce(p_data->>'feedback',''),reviewer_id=p_actor,evaluated_at=v_now,revision=revision+1 WHERE id=ans.id;next_rev:=p_revision+1;
 ELSE RAISE EXCEPTION 'Unknown action' USING ERRCODE='22023';
 END IF;
 response:=jsonb_build_object('id',p_id,'revision',next_rev,'replayed',false);
 IF p_action='quiz_submit' THEN response:=response||jsonb_build_object('score',v_score,'total',7,'attempt',v_attempt,'official',v_attempt=1);END IF;
 after_value:=CASE WHEN p_action IN('lesson','state') THEN(SELECT to_jsonb(x) FROM public.guild_lessons x WHERE id=p_id)
 WHEN p_action='activity' THEN(SELECT to_jsonb(x) FROM public.guild_ebd_activities x WHERE id=p_id)
 WHEN p_action IN('submit','grade') THEN(SELECT to_jsonb(x) FROM public.guild_ebd_answers x WHERE id=p_id)
 WHEN p_action='attendance' THEN(SELECT to_jsonb(x) FROM public.guild_ebd_attendance x WHERE lesson_id=l.id AND traveler_id=target) ELSE response END;
 INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(p_guild,coalesce(l.id,p_id),p_actor,p_action,p_id,next_rev,jsonb_build_object('classId',p_class,'target',target,'before',CASE WHEN p_action='attendance' THEN to_jsonb(att) ELSE old_value END,'after',after_value,'quizId',quiz_key,'participationOnly',p_action='submit','xpIssued',0));
 INSERT INTO ebd_class_private.commands(user_id,request_id,actor_id,guild_id,signature,result) VALUES(owner_id,p_request,p_actor,p_guild,signature_value,response);
 RETURN response;
END $body$;

-- Reviewed legacy compatibility boundary.
CREATE OR REPLACE FUNCTION ebd_ops.command(p_actor uuid, p_guild uuid, p_action text, p_id uuid, p_revision integer, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_guild uuid; v_role text; l public.guild_lessons; a public.guild_ebd_activities;
 ans public.guild_ebd_answers; att public.guild_ebd_attendance; et public.guild_ebd_teachers;
 v_teacher uuid; v_target uuid; v_targets uuid[]; v_state text; v_revision integer; v_count integer;
 v_item jsonb; v_options jsonb; v_key integer; v_choice integer; v_snapshot jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM public.guild_lessons x WHERE x.ebd_class_id IS NOT NULL AND
 (x.id=p_id OR x.id=CASE WHEN p_action='activity' THEN(p_data->>'lessonId')::uuid ELSE NULL END
 OR x.id=(SELECT scoped_activity.lesson_id FROM public.guild_ebd_activities scoped_activity WHERE scoped_activity.id=CASE WHEN p_action='submit' THEN(p_data->>'activityId')::uuid ELSE p_id END)
 OR x.id=(SELECT scoped_activity.lesson_id FROM public.guild_ebd_answers b JOIN public.guild_ebd_activities scoped_activity ON scoped_activity.id=b.activity_id WHERE b.id=p_id)))
 THEN RAISE EXCEPTION 'Use class-scoped EBD authority' USING ERRCODE='42501';END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1); PERFORM guild_admin_private.require_writes();
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND user_id=auth.uid() AND is_active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501';END IF;
 IF p_actor IS NULL OR p_id IS NULL OR p_action IS NULL OR p_revision IS NULL OR p_revision<0
 OR p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR length(p_data::text)>60000 THEN RAISE EXCEPTION 'Invalid EBD request'; END IF;
v_guild:=p_guild;
 PERFORM guild_admin_private.active_actor(p_actor);PERFORM guild_admin_private.guild_role(p_actor,p_guild);
 IF p_action='lesson' AND coalesce(p_data->>'rewardTier','')<>'' THEN RAISE EXCEPTION 'Rewards are unavailable in this release' USING ERRCODE='42501';END IF;
 IF p_action IN('state','attendance') AND NOT EXISTS(SELECT 1 FROM public.guild_lessons WHERE id=p_id AND guild_id=p_guild)
 OR p_action='lesson' AND EXISTS(SELECT 1 FROM public.guild_lessons WHERE id=p_id AND guild_id<>p_guild)
 OR p_action='activity' AND(NOT EXISTS(SELECT 1 FROM public.guild_lessons WHERE id=(p_data->>'lessonId')::uuid AND guild_id=p_guild)
  OR EXISTS(SELECT 1 FROM public.guild_ebd_activities scoped_a JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE scoped_a.id=p_id AND scoped_l.guild_id<>p_guild))
 OR p_action='submit' AND(NOT EXISTS(SELECT 1 FROM public.guild_ebd_activities scoped_a JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE scoped_a.id=(p_data->>'activityId')::uuid AND scoped_l.guild_id=p_guild)
  OR EXISTS(SELECT 1 FROM public.guild_ebd_answers x JOIN public.guild_ebd_activities scoped_a ON scoped_a.id=x.activity_id JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE x.id=p_id AND scoped_l.guild_id<>p_guild))
 OR p_action='grade' AND NOT EXISTS(SELECT 1 FROM public.guild_ebd_answers x JOIN public.guild_ebd_activities scoped_a ON scoped_a.id=x.activity_id JOIN public.guild_lessons scoped_l ON scoped_l.id=scoped_a.lesson_id WHERE x.id=p_id AND scoped_l.guild_id=p_guild)
 THEN RAISE EXCEPTION 'Resource is unavailable in selected Guild' USING ERRCODE='42501';END IF;

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
  IF coalesce(et.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
  INSERT INTO public.guild_ebd_teachers VALUES(v_guild,p_id,(p_data->>'active')::boolean,(p_data->>'publish')::boolean,(p_data->>'attend')::boolean,p_revision+1,clock_timestamp())
   ON CONFLICT(guild_id,traveler_id) DO UPDATE SET active=excluded.active,can_publish=excluded.can_publish,can_attend=excluded.can_attend,revision=excluded.revision,updated_at=excluded.updated_at;
  INSERT INTO public.guild_ebd_history(guild_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_actor,'teacher',p_id,p_revision+1,p_data);
  RETURN jsonb_build_object('id',p_id,'revision',p_revision+1);
 ELSIF p_action='lesson' THEN
  v_teacher:=(p_data->>'teacherId')::uuid;
  IF v_role<>'leader' AND (v_teacher IS DISTINCT FROM p_actor OR NOT EXISTS(SELECT 1 FROM public.guild_ebd_teachers WHERE guild_id=v_guild AND traveler_id=p_actor AND active)) THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.guild_members gm JOIN public.guilds g ON g.id=gm.guild_id
   LEFT JOIN public.guild_ebd_teachers t ON t.guild_id=gm.guild_id AND t.traveler_id=gm.traveler_id
   WHERE gm.guild_id=v_guild AND gm.traveler_id=v_teacher AND gm.status='active' AND ((gm.role='leader' AND g.leader_traveler_id=v_teacher AND guild_admin_private.leader_not_revoked(v_teacher)) OR t.active)) THEN RAISE EXCEPTION 'Teacher unavailable'; END IF;
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
   IF l.status<>'draft' OR l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
   UPDATE public.guild_lessons SET title=btrim(p_data->>'title'),theme=btrim(p_data->>'theme'),introduction=coalesce(p_data->>'description',''),content=coalesce(p_data->>'content',''),bible_reference=coalesce(p_data->>'reference',''),scheduled_at=nullif(p_data->>'scheduledAt','')::timestamptz,teacher_id=v_teacher,audience=p_data->>'audience',target_ids=v_targets,materials=p_data->'materials',objectives=coalesce(p_data->>'objectives',''),reward_tier=nullif(p_data->>'rewardTier',''),ebd_revision=ebd_revision+1 WHERE id=p_id;
  ELSE
   IF p_revision<>0 THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
   INSERT INTO public.guild_lessons(id,guild_id,created_by_traveler_id,teacher_id,title,theme,introduction,content,bible_reference,scheduled_at,audience,target_ids,materials,objectives,reward_tier,creation_hash)
    VALUES(p_id,v_guild,p_actor,v_teacher,btrim(p_data->>'title'),btrim(p_data->>'theme'),coalesce(p_data->>'description',''),coalesce(p_data->>'content',''),coalesce(p_data->>'reference',''),nullif(p_data->>'scheduledAt','')::timestamptz,p_data->>'audience',v_targets,p_data->'materials',coalesce(p_data->>'objectives',''),nullif(p_data->>'rewardTier',''),md5(p_data::text));
  END IF;
  SELECT to_jsonb(x),x.ebd_revision INTO v_snapshot,v_revision FROM public.guild_lessons x WHERE id=p_id;
  INSERT INTO public.guild_ebd_history(guild_id,lesson_id,actor_id,action,entity_id,revision,snapshot) VALUES(v_guild,p_id,p_actor,'lesson_saved',p_id,v_revision,v_snapshot);
 ELSIF p_action='state' THEN
  SELECT * INTO l FROM public.guild_lessons WHERE id=p_id FOR UPDATE;
  IF l.guild_id IS DISTINCT FROM v_guild OR NOT ebd_ops.manager(p_actor,p_id,'publish') THEN RAISE EXCEPTION 'EBD access denied' USING ERRCODE='42501'; END IF;
  v_state:=p_data->>'state';
  IF l.ebd_revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
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
   IF a.revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
   UPDATE public.guild_ebd_activities SET title=btrim(p_data->>'title'),kind=p_data->>'kind',prompt=p_data->>'prompt',options=v_options,answer_key=v_key,deadline=nullif(p_data->>'deadline','')::timestamptz,attempt_limit=(p_data->>'attemptLimit')::integer,criterion=p_data->>'criterion',revision=revision+1 WHERE id=p_id;
  ELSE
   IF p_revision<>0 THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
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
  IF ans.revision<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
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
  IF coalesce(att.revision,0)<>p_revision THEN RAISE EXCEPTION 'EBD conflict' USING ERRCODE='PT409'; END IF;
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
END $function$
;
CREATE OR REPLACE FUNCTION ebd_ops.workspace(p_actor uuid, p_guild uuid, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE g uuid; r text; ids uuid[]; total integer; teacher boolean;
BEGIN
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid EBD page'; END IF;
 g:=p_guild; PERFORM guild_admin_private.guild_role(p_actor,p_guild);
 r:=guild_ops.actor(p_actor,g);
 teacher:=r='leader' OR EXISTS(SELECT 1 FROM public.guild_ebd_teachers WHERE guild_id=g AND traveler_id=p_actor AND active);
 SELECT count(*) INTO total FROM public.guild_lessons l WHERE guild_id=g AND l.ebd_class_id IS NULL AND (ebd_ops.manager(p_actor,l.id) OR ebd_ops.eligible(p_actor,l.id));
 SELECT coalesce(array_agg(id),'{}') INTO ids FROM (SELECT id FROM public.guild_lessons l WHERE guild_id=g AND l.ebd_class_id IS NULL AND (ebd_ops.manager(p_actor,l.id) OR ebd_ops.eligible(p_actor,l.id)) ORDER BY created_at DESC,id LIMIT 20 OFFSET p_offset) page;
 RETURN jsonb_build_object('version',1,'guildId',g,'leader',r='leader','teacher',teacher,'total',total,
  'lessons',coalesce((SELECT jsonb_agg(to_jsonb(l)||jsonb_build_object('canEdit',ebd_ops.manager(p_actor,l.id),'canPublish',ebd_ops.manager(p_actor,l.id,'publish'),'canAttend',ebd_ops.manager(p_actor,l.id,'attend')) ORDER BY created_at DESC,id) FROM public.guild_lessons l WHERE id=ANY(ids)),'[]'::jsonb),
  'activities',coalesce((SELECT jsonb_agg((to_jsonb(a)-'answer_key'-'creation_hash')||CASE WHEN ebd_ops.manager(p_actor,a.lesson_id) OR EXISTS(SELECT 1 FROM public.guild_ebd_answers x WHERE x.activity_id=a.id AND x.traveler_id=p_actor AND (x.status='completed' OR (x.status='revise' AND x.attempt>=a.attempt_limit))) THEN jsonb_build_object('answer_key',a.answer_key) ELSE '{}'::jsonb END) FROM public.guild_ebd_activities a WHERE lesson_id=ANY(ids)),'[]'::jsonb),
  'answers',coalesce((SELECT jsonb_agg(to_jsonb(x)||CASE WHEN a.kind='reflective' AND x.traveler_id<>p_actor THEN jsonb_build_object('response','Reflexão privada preservada; somente participação.','choice',NULL) ELSE '{}'::jsonb END||jsonb_build_object('traveler_name',t.name) ORDER BY submitted_at DESC) FROM public.guild_ebd_answers x JOIN public.guild_ebd_activities a ON a.id=x.activity_id JOIN public.travelers t ON t.id=x.traveler_id WHERE a.lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,a.lesson_id))),'[]'::jsonb),
  'attendance',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.guild_ebd_attendance x WHERE lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,x.lesson_id))),'[]'::jsonb),
  'rewards',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.guild_ebd_reward_pending x WHERE lesson_id=ANY(ids) AND (x.traveler_id=p_actor OR ebd_ops.manager(p_actor,x.lesson_id))),'[]'::jsonb),
  'members',CASE WHEN teacher THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'leader',gm.role='leader')) FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id WHERE gm.guild_id=g AND gm.status='active'),'[]'::jsonb) ELSE '[]'::jsonb END,
  'teachers',CASE WHEN teacher THEN coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM public.guild_ebd_teachers t WHERE guild_id=g AND (r='leader' OR traveler_id=p_actor OR active)),'[]'::jsonb) ELSE '[]'::jsonb END,
  'history',coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM (SELECT id,lesson_id,actor_id,action,entity_id,revision,created_at FROM public.guild_ebd_history h WHERE guild_id=g AND (r='leader' OR (lesson_id=ANY(ids) AND ebd_ops.manager(p_actor,lesson_id))) ORDER BY id DESC LIMIT 100) h),'[]'::jsonb));
END $function$
;

CREATE FUNCTION public.ebd_class_lessons_workspace(p_actor uuid,p_guild uuid,p_class uuid,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$SELECT ebd_class_private.lessons_workspace(p_actor,p_guild,p_class,p_offset)$$;
CREATE FUNCTION public.ebd_class_lessons_command(p_actor uuid,p_guild uuid,p_class uuid,p_action text,p_id uuid,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT ebd_class_private.lessons_command(p_actor,p_guild,p_class,p_action,p_id,p_request,p_revision,p_data)$$;
REVOKE ALL ON FUNCTION ebd_class_private.lesson_manager(uuid,uuid,text),ebd_class_private.lesson_visible(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.ebd_class_lessons_workspace(uuid,uuid,uuid,integer),public.ebd_class_lessons_command(uuid,uuid,uuid,text,uuid,uuid,integer,jsonb),ebd_class_private.lessons_workspace(uuid,uuid,uuid,integer),ebd_class_private.lessons_command(uuid,uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.ebd_class_lessons_workspace(uuid,uuid,uuid,integer),public.ebd_class_lessons_command(uuid,uuid,uuid,text,uuid,uuid,integer,jsonb),ebd_class_private.lessons_workspace(uuid,uuid,uuid,integer),ebd_class_private.lessons_command(uuid,uuid,uuid,text,uuid,uuid,integer,jsonb) TO authenticated;
