-- TEST-only empty rollback. Keeps the complete 010A.1 foundation and issued records.
DO $$ BEGIN IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN RAISE EXCEPTION 'Reviewed TEST target required';END IF;IF EXISTS(SELECT 1 FROM public.guild_members WHERE status='active' GROUP BY traveler_id HAVING count(*)>1) OR EXISTS(SELECT 1 FROM guild_admin_private.leadership_revocations) OR EXISTS(SELECT 1 FROM guild_admin_private.audit WHERE action LIKE 'guild_%') THEN RAISE EXCEPTION 'Recovery refuses to discard multi-Guild state or audit; use containment';END IF;END $$;
CREATE OR REPLACE FUNCTION public.is_guild_leader(p_guild_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ SELECT EXISTS (
  SELECT 1 FROM public.guild_members gm
  JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE gm.guild_id = p_guild_id AND gm.status = 'active' AND gm.role = 'leader' AND t.user_id = auth.uid()
) $function$;
REVOKE ALL ON FUNCTION is_guild_leader(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION is_guild_leader(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.can_lead_mission(p_mission_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ SELECT EXISTS (
  SELECT 1 FROM public.guild_missions m
  JOIN public.guild_members gm ON gm.guild_id = m.guild_id
  JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE m.id = p_mission_id AND gm.status = 'active' AND gm.role = 'leader' AND t.user_id = auth.uid()
) $function$;
REVOKE ALL ON FUNCTION can_lead_mission(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION guild_ops.actor(p_actor uuid, p_guild uuid, p_leader boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_role text;
BEGIN
 SELECT gm.role INTO v_role FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id
 JOIN auth.users u ON u.id=t.user_id JOIN public.guilds g ON g.id=gm.guild_id
 WHERE gm.traveler_id=p_actor AND gm.guild_id=p_guild AND gm.status='active' AND g.status='active'
   AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
   AND (gm.role<>'leader' OR g.leader_traveler_id=p_actor)
   AND (NOT p_leader OR (gm.role='leader' AND g.leader_traveler_id=p_actor)) FOR SHARE OF gm,g;
 IF v_role IS NULL THEN RAISE EXCEPTION 'Guild access denied' USING ERRCODE='42501'; END IF;
 RETURN v_role;
END $function$;
REVOKE ALL ON FUNCTION guild_ops.actor(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION guild_ops.visible(p_mission uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.guild_missions m JOIN public.guild_members gm ON gm.guild_id=m.guild_id
 JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id JOIN public.guilds g ON g.id=gm.guild_id
 WHERE m.id=p_mission AND gm.status='active' AND g.status='active' AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
 AND ((gm.role='leader' AND g.leader_traveler_id=gm.traveler_id) OR
   (m.status<>'draft' AND ((m.status='published' AND (m.audience='all' OR gm.traveler_id=ANY(m.target_traveler_ids))) OR
     EXISTS(SELECT 1 FROM public.guild_mission_progress p WHERE p.mission_id=m.id AND p.traveler_id=gm.traveler_id)))))
$function$;
REVOKE ALL ON FUNCTION guild_ops.visible(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_ops.visible(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION ebd_ops.manager(p_actor uuid, p_lesson uuid, p_permission text DEFAULT 'edit'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.guild_lessons l JOIN public.guild_members gm ON gm.guild_id=l.guild_id AND gm.traveler_id=p_actor
 JOIN public.guilds g ON g.id=gm.guild_id JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id
 LEFT JOIN public.guild_ebd_teachers et ON et.guild_id=l.guild_id AND et.traveler_id=p_actor
 WHERE l.id=p_lesson AND gm.status='active' AND g.status='active' AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
 AND ((gm.role='leader' AND g.leader_traveler_id=p_actor) OR
 (l.teacher_id=p_actor AND et.active AND CASE p_permission WHEN 'publish' THEN et.can_publish WHEN 'attend' THEN et.can_attend ELSE true END)))
$function$;
REVOKE ALL ON FUNCTION ebd_ops.manager(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION guild_chat_private.actor(p_guild_id uuid, p_traveler_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Chat access denied' USING ERRCODE='42501'; END IF;
  SELECT gm.role INTO actor_role FROM public.guild_members gm
    JOIN public.travelers t ON t.id=gm.traveler_id JOIN public.guilds g ON g.id=gm.guild_id JOIN auth.users u ON u.id=t.user_id
    WHERE gm.guild_id=p_guild_id AND t.id=p_traveler_id AND t.user_id=auth.uid()
      AND gm.status='active' AND g.status='active' AND NOT coalesce(u.is_anonymous,false)
    FOR SHARE OF gm,t,g;
  IF actor_role IS NULL THEN RAISE EXCEPTION 'Chat access denied' USING ERRCODE='42501'; END IF;
  RETURN actor_role;
END $function$;
REVOKE ALL ON FUNCTION guild_chat_private.actor(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION guild_chat_private.can_access(p_guild_id uuid, p_moderate boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id
    JOIN public.guilds g ON g.id=gm.guild_id JOIN auth.users u ON u.id=t.user_id
    WHERE gm.guild_id=p_guild_id AND gm.status='active' AND g.status='active'
      AND u.id=auth.uid() AND NOT coalesce(u.is_anonymous,false)
      AND (NOT p_moderate OR gm.role IN ('leader','co_leader','moderator'))
  )
$function$;
REVOKE ALL ON FUNCTION guild_chat_private.can_access(uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_chat_private.can_access(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION ebd_ops.command(p_actor uuid, p_action text, p_id uuid, p_revision integer, p_data jsonb)
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
END $function$;
REVOKE ALL ON FUNCTION ebd_ops.command(uuid,text,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ebd_ops.command(uuid,text,uuid,integer,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION ebd_ops.workspace(p_actor uuid, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
END $function$;
REVOKE ALL ON FUNCTION ebd_ops.workspace(uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ebd_ops.workspace(uuid,integer) TO authenticated;
CREATE OR REPLACE FUNCTION guild_invite_private.leader_guild(p_leader uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE guild_key uuid;
BEGIN
  PERFORM guild_invite_private.require_account();
  SELECT g.id INTO guild_key FROM public.guilds g
    JOIN public.guild_members gm ON gm.guild_id = g.id
    JOIN public.travelers t ON t.id = gm.traveler_id
    WHERE t.id = p_leader AND t.user_id = auth.uid()
      AND gm.role = 'leader' AND gm.status = 'active' AND g.status = 'active'
    FOR UPDATE OF g;
  IF guild_key IS NULL THEN RAISE EXCEPTION 'Leader required' USING ERRCODE = '42501'; END IF;
  RETURN guild_key;
END $function$;
REVOKE ALL ON FUNCTION guild_invite_private.leader_guild(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION guild_invite_private.create_invite(p_leader uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE guild_key uuid; raw_token text; new_row guild_invite_private.link_invites;
  issued_at timestamptz := clock_timestamp();
BEGIN
  guild_key := guild_invite_private.leader_guild(p_leader);
  IF (SELECT count(*) FROM guild_invite_private.link_invites
      WHERE guild_id = guild_key AND revoked_at IS NULL AND expires_at > clock_timestamp()) >= 10 THEN
    RAISE EXCEPTION 'Active invite limit reached' USING ERRCODE = '54000';
  END IF;
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO guild_invite_private.link_invites(guild_id, leader_traveler_id, token_hash, created_at, expires_at)
    VALUES (guild_key, p_leader, extensions.digest(raw_token, 'sha256'), issued_at, issued_at + interval '7 days')
    RETURNING * INTO new_row;
  RETURN jsonb_build_object('id', new_row.id, 'token', raw_token, 'expires_at', new_row.expires_at);
END $function$;
REVOKE ALL ON FUNCTION guild_invite_private.create_invite(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_invite_private.create_invite(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION guild_invite_private.list_invites(p_leader uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE guild_key uuid;
BEGIN
  guild_key := guild_invite_private.leader_guild(p_leader);
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(v)) FROM (
    SELECT id, created_at, expires_at, revoked_at FROM guild_invite_private.link_invites
    WHERE guild_id = guild_key ORDER BY created_at DESC LIMIT 50
  ) v), '[]'::jsonb);
END $function$;
REVOKE ALL ON FUNCTION guild_invite_private.list_invites(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_invite_private.list_invites(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION guild_invite_private.revoke_invite(p_id uuid, p_leader uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE guild_key uuid;
BEGIN
  guild_key := guild_invite_private.leader_guild(p_leader);
  UPDATE guild_invite_private.link_invites SET revoked_at = coalesce(revoked_at, clock_timestamp())
    WHERE id = p_id AND guild_id = guild_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE = 'P0002'; END IF;
END $function$;
REVOKE ALL ON FUNCTION guild_invite_private.revoke_invite(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_invite_private.revoke_invite(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION guild_invite_private.valid_invite(p_token text)
 RETURNS guild_invite_private.link_invites
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE invite_row guild_invite_private.link_invites;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invite unavailable' USING ERRCODE = 'P0002';
  END IF;
  SELECT i.* INTO invite_row FROM guild_invite_private.link_invites i
    JOIN public.guilds g ON g.id = i.guild_id
    JOIN public.guild_members gm ON gm.guild_id = g.id AND gm.traveler_id = i.leader_traveler_id
    WHERE i.token_hash = extensions.digest(p_token, 'sha256')
      AND i.revoked_at IS NULL AND i.expires_at > clock_timestamp()
      AND g.status = 'active' AND gm.role = 'leader' AND gm.status = 'active'
    FOR SHARE OF i, g, gm;
  -- A row lock can wait beyond expiry even when the WHERE matched before waiting.
  IF NOT FOUND OR invite_row.expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Invite unavailable' USING ERRCODE = 'P0002';
  END IF;
  RETURN invite_row;
END $function$;
REVOKE ALL ON FUNCTION guild_invite_private.valid_invite(text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION guild_invite_private.request_invite(p_token text, p_traveler uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE invite_row guild_invite_private.link_invites;
BEGIN
  PERFORM guild_invite_private.require_account();
  invite_row := guild_invite_private.valid_invite(p_token);
  IF NOT public.owns_traveler(p_traveler) THEN
    RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501';
  END IF;
  -- Existing RPC creates/reuses a PENDING request; only its normal review may add membership.
  RETURN public.request_join_guild(invite_row.guild_id, p_traveler);
END $function$;
REVOKE ALL ON FUNCTION guild_invite_private.request_invite(text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_invite_private.request_invite(text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.create_guild(p_leader_traveler_id uuid, p_name text, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE new_guild_id uuid;
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  IF char_length(btrim(p_name)) NOT BETWEEN 2 AND 60 OR char_length(coalesce(p_description, '')) > 500 THEN RAISE EXCEPTION 'Invalid guild data' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.guild_members WHERE traveler_id = p_leader_traveler_id AND status = 'active') THEN RAISE EXCEPTION 'Traveler already belongs to a guild' USING ERRCODE = '23505'; END IF;
  INSERT INTO public.guilds(name, description, created_by_user_id, leader_traveler_id)
  VALUES (btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), auth.uid(), p_leader_traveler_id) RETURNING id INTO new_guild_id;
  INSERT INTO public.guild_members(guild_id, traveler_id, role, status) VALUES (new_guild_id, p_leader_traveler_id, 'leader', 'active');
  RETURN new_guild_id;
END $function$;
REVOKE ALL ON FUNCTION create_guild(uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION create_guild(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.request_join_guild(p_guild_id uuid, p_traveler_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE request_id uuid;
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.guilds WHERE id = p_guild_id AND status = 'active') THEN RAISE EXCEPTION 'Guild unavailable' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (SELECT 1 FROM public.guild_members WHERE traveler_id = p_traveler_id AND status = 'active') THEN RAISE EXCEPTION 'Traveler already belongs to a guild' USING ERRCODE = '23505'; END IF;
  INSERT INTO public.guild_join_requests(guild_id, traveler_id) VALUES (p_guild_id, p_traveler_id)
  ON CONFLICT (guild_id, traveler_id) WHERE status = 'pending' DO UPDATE SET updated_at = now()
  RETURNING id INTO request_id;
  RETURN request_id;
END $function$;
REVOKE ALL ON FUNCTION request_join_guild(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION request_join_guild(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.review_guild_join_request(p_request_id uuid, p_reviewer_traveler_id uuid, p_approve boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
END $function$;
REVOKE ALL ON FUNCTION review_guild_join_request(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION review_guild_join_request(uuid,uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.leave_guild(p_traveler_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.owns_traveler(p_traveler_id) THEN RAISE EXCEPTION 'Traveler not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_members SET status = 'left' WHERE traveler_id = p_traveler_id AND status = 'active' AND role <> 'leader';
  IF NOT FOUND THEN RAISE EXCEPTION 'Membership unavailable or leader must transfer leadership' USING ERRCODE = 'P0001'; END IF;
END $function$;
REVOKE ALL ON FUNCTION leave_guild(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION leave_guild(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.remove_guild_member(p_member_traveler_id uuid, p_leader_traveler_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.owns_traveler(p_leader_traveler_id) THEN RAISE EXCEPTION 'Leader not owned' USING ERRCODE = '42501'; END IF;
  UPDATE public.guild_members target SET status = 'removed', updated_at = now()
  WHERE target.traveler_id = p_member_traveler_id AND target.role = 'member' AND target.status = 'active'
    AND EXISTS (SELECT 1 FROM public.guild_members own WHERE own.guild_id = target.guild_id
      AND own.traveler_id = p_leader_traveler_id AND own.role = 'leader' AND own.status = 'active');
  IF NOT FOUND THEN RAISE EXCEPTION 'Member unavailable' USING ERRCODE = '42501'; END IF;
END $function$;
REVOKE ALL ON FUNCTION remove_guild_member(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION remove_guild_member(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.list_guild_members(p_requester_traveler_id uuid)
 RETURNS TABLE(traveler_id uuid, traveler_name text, role text, member_status text, joined_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT t.id, t.name, gm.role, gm.status, gm.joined_at FROM public.guild_members own
  JOIN public.guild_members gm ON gm.guild_id = own.guild_id JOIN public.travelers t ON t.id = gm.traveler_id
  WHERE own.traveler_id = p_requester_traveler_id AND own.status = 'active' AND public.owns_traveler(p_requester_traveler_id) ORDER BY gm.joined_at
$function$;
REVOKE ALL ON FUNCTION list_guild_members(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION list_guild_members(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.list_guild_join_requests(p_leader_traveler_id uuid)
 RETURNS TABLE(request_id uuid, traveler_id uuid, traveler_name text, request_status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT r.id, t.id, t.name, r.status, r.created_at FROM public.guild_members own
  JOIN public.guild_join_requests r ON r.guild_id = own.guild_id JOIN public.travelers t ON t.id = r.traveler_id
  WHERE own.traveler_id = p_leader_traveler_id AND own.role = 'leader' AND own.status = 'active' AND public.owns_traveler(p_leader_traveler_id) ORDER BY r.created_at
$function$;
REVOKE ALL ON FUNCTION list_guild_join_requests(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION list_guild_join_requests(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.guild_admin_stats(p_leader_traveler_id uuid)
 RETURNS TABLE(mission_id uuid, participants bigint, completed bigint, pending bigint, completed_recent bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
END $function$;
REVOKE ALL ON FUNCTION guild_admin_stats(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_stats(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.guild_governance_command(p_action text, p_id uuid, p_request uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$ SELECT guild_admin_private.command(p_action,p_id,p_request,p_data) $function$;
REVOKE ALL ON FUNCTION guild_governance_command(text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_governance_command(text,uuid,uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.guild_governance_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ SELECT guild_admin_private.status() $function$;
REVOKE ALL ON FUNCTION guild_governance_status() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_governance_status() TO authenticated;
CREATE OR REPLACE FUNCTION guild_admin_private.command(p_action text, p_id uuid, p_request uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor uuid:=guild_admin_private.account_uid(); permission text; signature text; prior guild_admin_private.audit;
 inv guild_admin_private.leadership_invites; previous_grant guild_admin_private.admin_grants; response jsonb; secret text; email_value text;
 recipient uuid; permission_list text[]; my_permissions text[]; reason text; revision_value integer;
 active_value boolean; issued_at timestamptz; days_value integer;
BEGIN
 IF p_action IS NULL OR p_action NOT IN('set_admin','issue_leadership','accept_leadership','revoke_invite','revoke_leadership')
  OR p_id IS NULL OR p_request IS NULL OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>4096 THEN
  RAISE EXCEPTION 'Invalid governance command' USING ERRCODE='22023'; END IF;
 permission:=CASE WHEN p_action='set_admin' THEN 'admins.manage' ELSE 'leadership.manage' END;
 IF p_action<>'accept_leadership' THEN PERFORM guild_admin_private.require_admin(permission); END IF;
 -- All grant changes and invitation consumption share one lock; revocation is fresh, not a JWT claim.
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 IF p_action<>'accept_leadership' THEN PERFORM guild_admin_private.require_admin(permission); END IF;
 signature:=encode(extensions.digest(jsonb_build_object('action',p_action,'id',p_id,'data',p_data)::text,'sha256'),'hex');
 SELECT * INTO prior FROM guild_admin_private.audit WHERE actor_uid=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.payload_hash<>signature THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
  RETURN prior.result||jsonb_build_object('replayed',true,'token',NULL);
 END IF;
 IF p_action='accept_leadership' THEN
  PERFORM guild_admin_private.exact_keys(p_data,ARRAY['token','travelerId']);
  IF jsonb_typeof(p_data->'token') IS DISTINCT FROM 'string' OR (p_data->>'token') !~ '^[a-f0-9]{64}$'
   OR jsonb_typeof(p_data->'travelerId') IS DISTINCT FROM 'string'
   OR (p_data->>'travelerId') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
  PERFORM 1 FROM public.travelers WHERE id=(p_data->>'travelerId')::uuid AND user_id=actor AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active owned avatar required' USING ERRCODE='42501'; END IF;
  SELECT * INTO inv FROM guild_admin_private.leadership_invites WHERE id=p_id
   AND token_hash=extensions.digest(p_data->>'token','sha256') FOR UPDATE;
  IF NOT FOUND OR inv.revoked_at IS NOT NULL OR inv.consumed_at IS NOT NULL OR inv.expires_at<=clock_timestamp()
   OR NOT EXISTS(SELECT 1 FROM guild_admin_private.admin_grants WHERE user_id=inv.issuer_uid
    AND active AND 'leadership.manage'=ANY(permissions)) THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
  SELECT lower(u.email) INTO email_value FROM auth.users u WHERE u.id=actor AND u.email_confirmed_at IS NOT NULL FOR SHARE;
  IF email_value IS NULL OR extensions.digest('email:'||email_value,'sha256')<>inv.recipient_hash
   OR(inv.target_uid IS NOT NULL AND inv.target_uid<>actor)
   OR (SELECT count(*) FROM auth.users WHERE lower(email)=email_value)<>1 THEN
   RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
  UPDATE guild_admin_private.leadership_invites SET target_uid=actor,consumed_at=clock_timestamp() WHERE id=p_id;
  INSERT INTO guild_admin_private.leader_authorizations(user_id,invite_id,granted_by,granted_at,revision)
   VALUES(actor,p_id,inv.issuer_uid,clock_timestamp(),1)
   ON CONFLICT(user_id) DO UPDATE SET invite_id=excluded.invite_id,granted_by=excluded.granted_by,
    granted_at=excluded.granted_at,revoked_at=NULL,revision=leader_authorizations.revision+1
   RETURNING revision INTO revision_value;
  reason:='Authenticated recipient accepted leadership invitation';
  response:=jsonb_build_object('id',p_id,'revision',revision_value,'status','accepted','legacyGuildsChanged',false);
 ELSE
  reason:=p_data->>'reason';
  IF jsonb_typeof(p_data->'reason') IS DISTINCT FROM 'string' OR length(btrim(reason)) NOT BETWEEN 8 AND 500
   OR reason ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Administrative reason required' USING ERRCODE='22023'; END IF;
  IF p_action='issue_leadership' THEN
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['recipientEmail','expiresInDays','reason']);
   email_value:=lower(btrim(p_data->>'recipientEmail'));
   IF jsonb_typeof(p_data->'recipientEmail') IS DISTINCT FROM 'string' OR length(email_value)>254
    OR email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR jsonb_typeof(p_data->'expiresInDays') IS DISTINCT FROM 'number' OR (p_data->>'expiresInDays') !~ '^[1-7]$' THEN
    RAISE EXCEPTION 'Invalid recipient or expiry' USING ERRCODE='22023'; END IF;
   IF (SELECT count(*) FROM auth.users WHERE lower(email)=email_value)>1 THEN RAISE EXCEPTION 'Recipient unavailable' USING ERRCODE='22023'; END IF;
   SELECT id INTO recipient FROM auth.users WHERE lower(email)=email_value;
   days_value:=(p_data->>'expiresInDays')::integer;issued_at:=clock_timestamp();secret:=encode(extensions.gen_random_bytes(32),'hex');
   INSERT INTO guild_admin_private.leadership_invites(id,issuer_uid,target_uid,recipient_hash,token_hash,created_at,expires_at)
    VALUES(p_id,actor,recipient,extensions.digest('email:'||email_value,'sha256'),extensions.digest(secret,'sha256'),issued_at,issued_at+days_value*interval '1 day');
   response:=jsonb_build_object('id',p_id,'kind','leadership','expiresAt',issued_at+days_value*interval '1 day');
  ELSIF p_action='revoke_invite' THEN
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['reason']);
   UPDATE guild_admin_private.leadership_invites SET revoked_at=COALESCE(revoked_at,clock_timestamp())
    WHERE id=p_id AND consumed_at IS NULL RETURNING * INTO inv;
   IF NOT FOUND THEN RAISE EXCEPTION 'Invite unavailable' USING ERRCODE='P0002'; END IF;
   response:=jsonb_build_object('id',p_id,'status','revoked');
  ELSIF p_action='revoke_leadership' THEN
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['reason']);
   UPDATE guild_admin_private.leader_authorizations SET revoked_at=COALESCE(revoked_at,clock_timestamp()),revision=revision+1
    WHERE user_id=p_id RETURNING revision INTO revision_value;
   IF NOT FOUND THEN RAISE EXCEPTION 'Authorization unavailable' USING ERRCODE='P0002'; END IF;
   response:=jsonb_build_object('id',p_id,'revision',revision_value,'status','revoked','legacyGuildsChanged',false);
  ELSE
   PERFORM guild_admin_private.exact_keys(p_data,ARRAY['permissions','active','reason']);
   IF jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'permissions') IS DISTINCT FROM 'array'
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_data->'permissions') x WHERE jsonb_typeof(x)<>'string') THEN
    RAISE EXCEPTION 'Invalid administrative grant' USING ERRCODE='22023'; END IF;
   SELECT array_agg(value ORDER BY value) INTO permission_list FROM jsonb_array_elements_text(p_data->'permissions');
   SELECT permissions INTO my_permissions FROM guild_admin_private.admin_grants WHERE user_id=actor AND active;
   active_value:=(p_data->>'active')::boolean;
   SELECT * INTO previous_grant FROM guild_admin_private.admin_grants WHERE user_id=p_id;
   IF active_value THEN
    IF guild_admin_private.allowed_permissions(permission_list) IS DISTINCT FROM true OR NOT permission_list <@ my_permissions
     OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_id AND is_anonymous IS FALSE AND email_confirmed_at IS NOT NULL) THEN
     RAISE EXCEPTION 'Invalid administrative grant' USING ERRCODE='22023'; END IF;
   ELSE
    IF previous_grant.user_id IS NULL THEN RAISE EXCEPTION 'Administrative grant unavailable' USING ERRCODE='P0002'; END IF;
    IF permission_list IS NOT NULL AND guild_admin_private.allowed_permissions(permission_list) IS DISTINCT FROM true THEN
     RAISE EXCEPTION 'Invalid administrative permissions' USING ERRCODE='22023'; END IF;
    -- Revocation preserves the previous permission set, rather than granting or rewriting it.
    permission_list:=previous_grant.permissions;
   END IF;
   IF p_id=actor AND(NOT active_value OR NOT 'admins.manage'=ANY(permission_list)) AND NOT EXISTS(
    SELECT 1 FROM guild_admin_private.admin_grants WHERE user_id<>actor AND active AND 'admins.manage'=ANY(permissions)
   ) THEN RAISE EXCEPTION 'Last administrative manager cannot be removed' USING ERRCODE='55000'; END IF;
   INSERT INTO guild_admin_private.admin_grants(user_id,permissions,active,revision,changed_by)
    VALUES(p_id,permission_list,active_value,1,actor)
    ON CONFLICT(user_id) DO UPDATE SET permissions=excluded.permissions,active=excluded.active,
     revision=admin_grants.revision+1,changed_by=actor,changed_at=clock_timestamp()
    RETURNING revision INTO revision_value;
   response:=jsonb_build_object('id',p_id,'revision',revision_value,'active',active_value,
    'before',jsonb_build_object('permissions',COALESCE(previous_grant.permissions,'{}'::text[]),
     'active',COALESCE(previous_grant.active,false),'revision',COALESCE(previous_grant.revision,0)),
    'after',jsonb_build_object('permissions',permission_list,'active',active_value,'revision',revision_value));
  END IF;
 END IF;
 INSERT INTO guild_admin_private.audit(actor_uid,request_id,action,resource_id,reason,payload_hash,result)
  VALUES(actor,p_request,p_action,p_id,btrim(reason),signature,response);
 RETURN response||CASE WHEN secret IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('token',secret) END||jsonb_build_object('replayed',false);
END $function$;
REVOKE ALL ON FUNCTION guild_admin_private.command(text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_private.command(text,uuid,uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION guild_admin_private.status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor uuid:=guild_admin_private.account_uid(); permissions text[]; leader_status text; BEGIN
 SELECT g.permissions INTO permissions FROM guild_admin_private.admin_grants g WHERE g.user_id=actor AND g.active;
 SELECT CASE WHEN revoked_at IS NULL THEN 'active' ELSE 'revoked' END INTO leader_status
  FROM guild_admin_private.leader_authorizations WHERE user_id=actor;
 RETURN jsonb_build_object('version',1,'administrator',permissions IS NOT NULL,
  'permissions',COALESCE(permissions,'{}'::text[]),'leadership',COALESCE(leader_status,'none'),
  'multiGuildReady',false,'canCreateAdditionalGuilds',false,'economicRewardsEnabled',false);
END $function$;
REVOKE ALL ON FUNCTION guild_admin_private.status() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_admin_private.status() TO authenticated;
DROP FUNCTION public.guild_scoped_contexts(uuid),public.guild_scoped_command(uuid,uuid,text,uuid,uuid,jsonb),public.guild_scoped_members(uuid,uuid),public.guild_scoped_requests(uuid,uuid),public.guild_scoped_ebd_workspace(uuid,uuid,integer),public.guild_scoped_ebd_command(uuid,uuid,text,uuid,integer,jsonb),public.guild_scoped_create_invite(uuid,uuid,uuid),public.guild_scoped_list_invites(uuid,uuid),public.guild_scoped_revoke_invite(uuid,uuid,uuid);
DROP FUNCTION guild_invite_private.revoke_invite(uuid,uuid,uuid),guild_invite_private.list_invites(uuid,uuid),guild_invite_private.create_invite(uuid,uuid),guild_invite_private.leader_guild(uuid,uuid),ebd_ops.workspace(uuid,uuid,integer),ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb),guild_admin_private.requests(uuid,uuid),guild_admin_private.members(uuid,uuid),guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb),guild_admin_private.contexts(uuid),guild_admin_private.current_status(),guild_admin_private.governance_command(text,uuid,uuid,jsonb),guild_admin_private.require_creation(uuid),guild_admin_private.only_guild(uuid,boolean),guild_admin_private.guild_role(uuid,uuid,boolean),guild_admin_private.active_actor(uuid),guild_admin_private.leader_not_revoked(uuid),guild_admin_private.require_writes();
DROP FUNCTION public.guild_scoped_status(),guild_admin_private.create_scoped_invite(uuid,uuid,uuid);
DROP TABLE guild_admin_private.leadership_revocations,guild_admin_private.multiguild_control;
ALTER TABLE guild_admin_private.audit DROP CONSTRAINT audit_action_check;
ALTER TABLE guild_admin_private.audit ADD CONSTRAINT audit_action_check CHECK ((action = ANY (ARRAY['bootstrap_admin'::text, 'set_admin'::text, 'issue_leadership'::text, 'accept_leadership'::text, 'revoke_invite'::text, 'revoke_leadership'::text])));
DROP INDEX public.guild_members_active_traveler_idx;
CREATE UNIQUE INDEX guild_members_one_active_guild_per_traveler_idx ON public.guild_members(traveler_id) WHERE status='active';
NOTIFY pgrst,'reload schema';
