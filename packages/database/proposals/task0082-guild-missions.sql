-- TASK-0082 LOCAL CUTOVER PROPOSAL. Requires 0000..0008 + account/QR baseline.
-- Not an applied/registered migration. No wallet/XP/chest mutations or Story changes.
BEGIN;
CREATE SCHEMA guild_ops;
REVOKE ALL ON SCHEMA guild_ops FROM PUBLIC,anon,authenticated;
ALTER TABLE public.guild_missions
 ADD COLUMN objective text CHECK (length(objective) BETWEEN 1 AND 500),
 ADD COLUMN instructions text CHECK (length(instructions) BETWEEN 1 AND 1000),
 ADD COLUMN evidence_criterion text CHECK (length(evidence_criterion) BETWEEN 1 AND 300),
 ADD COLUMN audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','selected')),
 ADD COLUMN target_traveler_ids uuid[] NOT NULL DEFAULT '{}',
 ADD COLUMN workspace_revision integer NOT NULL DEFAULT 1 CHECK (workspace_revision>0),
 ADD COLUMN creation_fingerprint text,
 ADD CONSTRAINT guild_mission_audience_check CHECK (cardinality(target_traveler_ids)<=100 AND (audience='all' OR cardinality(target_traveler_ids)>0));
ALTER TABLE public.guild_mission_progress DROP CONSTRAINT guild_mission_progress_status_check;
ALTER TABLE public.guild_mission_progress
 ADD CONSTRAINT guild_mission_progress_status_check CHECK (status IN ('available','started','pending_approval','approved','completed','rejected','changes_requested')),
 ADD COLUMN submission_revision integer NOT NULL DEFAULT 0 CHECK (submission_revision>=0);
CREATE TABLE public.guild_mission_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 mission_id uuid NOT NULL REFERENCES public.guild_missions(id) ON DELETE RESTRICT,
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK (revision>0),
 request_id uuid NOT NULL,
 note text NOT NULL CHECK (length(btrim(note)) BETWEEN 1 AND 500),
 imported_legacy boolean NOT NULL DEFAULT false,
 submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 decision text CHECK (decision IN ('approved','rejected','changes_requested')),
 reason text CHECK (length(reason)<=500),
 reviewer_traveler_id uuid REFERENCES public.travelers(id) ON DELETE RESTRICT,
 decided_at timestamptz,
 decision_request_id uuid UNIQUE,
 UNIQUE(mission_id,traveler_id,revision),
 UNIQUE(mission_id,traveler_id,request_id),
 CHECK ((decision IS NULL AND reviewer_traveler_id IS NULL AND decided_at IS NULL AND decision_request_id IS NULL)
   OR (decision IS NOT NULL AND reviewer_traveler_id IS NOT NULL AND decided_at IS NOT NULL AND decision_request_id IS NOT NULL)),
 CHECK (decision NOT IN ('rejected','changes_requested') OR length(btrim(coalesce(reason,'')))>0)
);
CREATE INDEX guild_attempts_queue_idx ON public.guild_mission_attempts(mission_id,submitted_at) WHERE decision IS NULL;
CREATE INDEX guild_attempts_owner_idx ON public.guild_mission_attempts(traveler_id,mission_id);
ALTER TABLE public.guild_mission_attempts ENABLE ROW LEVEL SECURITY;
-- Import only actual pending evidence, never fabricate a player's statement.
ALTER TABLE public.guild_mission_attempts DROP CONSTRAINT guild_mission_attempts_note_check;
ALTER TABLE public.guild_mission_attempts ADD CONSTRAINT guild_attempt_note_check CHECK (length(note)<=500 AND (imported_legacy OR length(btrim(note))>0));
INSERT INTO public.guild_mission_attempts(mission_id,traveler_id,revision,request_id,note,submitted_at,imported_legacy)
 SELECT mission_id,traveler_id,1,gen_random_uuid(),coalesce(completion_note,''),coalesce(submitted_at,created_at),true FROM public.guild_mission_progress WHERE status='pending_approval';
UPDATE public.guild_mission_progress SET submission_revision=1 WHERE status='pending_approval';

CREATE FUNCTION guild_ops.actor(p_actor uuid,p_guild uuid,p_leader boolean DEFAULT false) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
END $$;
CREATE FUNCTION guild_ops.visible(p_mission uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.guild_missions m JOIN public.guild_members gm ON gm.guild_id=m.guild_id
 JOIN public.travelers t ON t.id=gm.traveler_id JOIN auth.users u ON u.id=t.user_id JOIN public.guilds g ON g.id=gm.guild_id
 WHERE m.id=p_mission AND gm.status='active' AND g.status='active' AND t.user_id=auth.uid() AND u.is_anonymous IS FALSE
 AND ((gm.role='leader' AND g.leader_traveler_id=gm.traveler_id) OR
   (m.status<>'draft' AND ((m.status='published' AND (m.audience='all' OR gm.traveler_id=ANY(m.target_traveler_ids))) OR
     EXISTS(SELECT 1 FROM public.guild_mission_progress p WHERE p.mission_id=m.id AND p.traveler_id=gm.traveler_id)))))
$$;
REVOKE ALL ON FUNCTION guild_ops.actor(uuid,uuid,boolean),guild_ops.visible(uuid) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA guild_ops TO authenticated;
GRANT EXECUTE ON FUNCTION guild_ops.visible(uuid) TO authenticated;
DROP POLICY guild_missions_select_member ON public.guild_missions;
CREATE POLICY guild_missions_select_member ON public.guild_missions FOR SELECT TO authenticated USING (guild_ops.visible(id));
DROP POLICY guild_mission_progress_select_participant ON public.guild_mission_progress;
CREATE POLICY guild_mission_progress_select_participant ON public.guild_mission_progress FOR SELECT TO authenticated
 USING (guild_ops.visible(mission_id) AND (public.owns_traveler(traveler_id) OR public.can_lead_mission(mission_id)));
CREATE POLICY guild_attempts_participant ON public.guild_mission_attempts FOR SELECT TO authenticated
 USING (guild_ops.visible(mission_id) AND (public.owns_traveler(traveler_id) OR public.can_lead_mission(mission_id)));
REVOKE ALL ON public.guild_missions,public.guild_mission_progress,public.guild_mission_attempts,public.guild_activity_log FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.guild_missions,public.guild_mission_progress,public.guild_mission_attempts,public.guild_activity_log TO authenticated;

CREATE FUNCTION public.save_guild_mission_v2(p_actor uuid,p_mission uuid,p_expected_revision integer,p_data jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_guild uuid; v_old public.guild_missions; v_targets uuid[]; v_start timestamptz; v_due timestamptz; v_key text;
BEGIN
 IF p_actor IS NULL OR p_mission IS NULL OR p_expected_revision IS NULL OR p_expected_revision<0 THEN RAISE EXCEPTION 'Invalid mission request'; END IF;
 IF jsonb_typeof(p_data)<>'object' OR p_data IS NULL THEN RAISE EXCEPTION 'Invalid mission'; END IF;
 FOR v_key IN SELECT jsonb_object_keys(p_data) LOOP
   IF v_key NOT IN ('title','description','objective','instructions','evidenceCriterion','bibleReference','startsAt','dueAt','kind','rewardTier','audience','targetIds') THEN RAISE EXCEPTION 'Unexpected mission field'; END IF;
 END LOOP;
 FOREACH v_key IN ARRAY ARRAY['title','description','objective','instructions','evidenceCriterion','bibleReference','startsAt','dueAt','kind','rewardTier','audience'] LOOP
   IF jsonb_typeof(p_data->v_key) IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Invalid mission field'; END IF;
 END LOOP;
 IF jsonb_typeof(p_data->'targetIds') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'targetIds')>100 THEN RAISE EXCEPTION 'Invalid audience'; END IF;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO v_targets FROM jsonb_array_elements_text(p_data->'targetIds');
 v_start:=nullif(p_data->>'startsAt','')::timestamptz;v_due:=nullif(p_data->>'dueAt','')::timestamptz;
 IF length(btrim(p_data->>'title')) NOT BETWEEN 2 AND 100 OR length(btrim(p_data->>'description')) NOT BETWEEN 1 AND 1000
 OR length(btrim(p_data->>'objective')) NOT BETWEEN 1 AND 500 OR length(btrim(p_data->>'instructions')) NOT BETWEEN 1 AND 1000
 OR length(btrim(p_data->>'evidenceCriterion')) NOT BETWEEN 1 AND 300 OR length(p_data->>'bibleReference')>100
 OR p_data->>'rewardTier' NOT IN ('normal','great','epic','extraordinary') OR p_data->>'kind' NOT IN ('mission','special')
 OR p_data->>'audience' NOT IN ('all','selected') OR (p_data->>'audience'='selected' AND cardinality(v_targets)=0)
 OR (p_data->>'audience'='all' AND cardinality(v_targets)>0) OR (v_start IS NOT NULL AND v_due IS NOT NULL AND v_due<=v_start)
 THEN RAISE EXCEPTION 'Invalid mission data' USING ERRCODE='22023'; END IF;
 IF p_expected_revision=0 THEN
   SELECT gm.guild_id INTO v_guild FROM public.guild_members gm WHERE gm.traveler_id=p_actor AND gm.status='active';
 ELSE SELECT * INTO v_old FROM public.guild_missions WHERE id=p_mission FOR UPDATE;v_guild:=v_old.guild_id; END IF;
 PERFORM guild_ops.actor(p_actor,v_guild,true);
 IF EXISTS(SELECT 1 FROM unnest(v_targets) target WHERE NOT EXISTS(SELECT 1 FROM public.guild_members gm WHERE gm.traveler_id=target AND gm.guild_id=v_guild AND gm.status='active')) THEN RAISE EXCEPTION 'Audience outside guild'; END IF;
 IF p_expected_revision=0 THEN
   -- Client UUID makes repeated create requests idempotent; fingerprint rejects changed payloads.
   INSERT INTO public.guild_missions(id,guild_id,created_by_traveler_id,title,description,mission_type,completion_mode,requires_leader_approval,reward_tier,objective,instructions,evidence_criterion,bible_reference,starts_at,due_at,audience,target_traveler_ids,creation_fingerprint)
   VALUES(p_mission,v_guild,p_actor,btrim(p_data->>'title'),btrim(p_data->>'description'),CASE WHEN p_data->>'kind'='special' THEN 'special_mission' ELSE 'practical_activity' END,'leader_approval',true,p_data->>'rewardTier',btrim(p_data->>'objective'),btrim(p_data->>'instructions'),btrim(p_data->>'evidenceCriterion'),nullif(btrim(p_data->>'bibleReference'),''),v_start,v_due,p_data->>'audience',v_targets,md5(p_data::text)) ON CONFLICT(id) DO NOTHING;
   IF NOT FOUND AND NOT EXISTS(SELECT 1 FROM public.guild_missions WHERE id=p_mission AND created_by_traveler_id=p_actor AND guild_id=v_guild AND creation_fingerprint=md5(p_data::text)) THEN RAISE EXCEPTION 'Mission request conflict'; END IF;
 ELSE
   IF v_old.status<>'draft' OR v_old.workspace_revision<>p_expected_revision THEN RAISE EXCEPTION 'Stale draft'; END IF;
   UPDATE public.guild_missions SET title=btrim(p_data->>'title'),description=btrim(p_data->>'description'),objective=btrim(p_data->>'objective'),instructions=btrim(p_data->>'instructions'),evidence_criterion=btrim(p_data->>'evidenceCriterion'),bible_reference=nullif(btrim(p_data->>'bibleReference'),''),starts_at=v_start,due_at=v_due,reward_tier=p_data->>'rewardTier',mission_type=CASE WHEN p_data->>'kind'='special' THEN 'special_mission' ELSE 'practical_activity' END,audience=p_data->>'audience',target_traveler_ids=v_targets,completion_mode='leader_approval',requires_leader_approval=true,workspace_revision=workspace_revision+1 WHERE id=p_mission;
   INSERT INTO public.guild_activity_log(guild_id,actor_traveler_id,event_type,entity_type,entity_id) VALUES(v_guild,p_actor,'mission_draft_updated','mission',p_mission);
 END IF;
 RETURN p_mission;
END $$;

CREATE FUNCTION public.transition_guild_mission_v2(p_actor uuid,p_mission uuid,p_expected_revision integer,p_action text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.guild_missions; v_status text;
BEGIN
 IF p_expected_revision IS NULL OR p_expected_revision<1 THEN RAISE EXCEPTION 'Invalid mission revision'; END IF;
 SELECT * INTO m FROM public.guild_missions WHERE id=p_mission FOR UPDATE;
 PERFORM guild_ops.actor(p_actor,m.guild_id,true);
 v_status:=CASE p_action WHEN 'publish' THEN 'published' WHEN 'close' THEN 'closed' WHEN 'cancel' THEN 'cancelled' END;
 IF v_status IS NULL THEN RAISE EXCEPTION 'Invalid transition'; END IF;
 IF m.status=v_status THEN RETURN; END IF;
 IF m.workspace_revision<>p_expected_revision OR NOT ((m.status='draft' AND p_action IN ('publish','cancel')) OR (m.status='published' AND p_action IN ('close','cancel'))) THEN RAISE EXCEPTION 'Stale mission or invalid transition'; END IF;
 IF p_action='publish' AND (m.objective IS NULL OR m.instructions IS NULL OR m.evidence_criterion IS NULL OR (m.due_at IS NOT NULL AND m.due_at<=clock_timestamp())) THEN RAISE EXCEPTION 'Complete the draft before publication'; END IF;
 UPDATE public.guild_missions SET status=v_status,published_at=CASE WHEN p_action='publish' THEN clock_timestamp() ELSE published_at END,closed_at=CASE WHEN p_action IN ('close','cancel') THEN clock_timestamp() ELSE closed_at END,workspace_revision=workspace_revision+1 WHERE id=p_mission;
 INSERT INTO public.guild_activity_log(guild_id,actor_traveler_id,event_type,entity_type,entity_id,metadata) VALUES(m.guild_id,p_actor,'mission_state_changed','mission',p_mission,jsonb_build_object('action',p_action));
END $$;

CREATE FUNCTION public.act_guild_mission_v2(p_actor uuid,p_mission uuid,p_action text,p_note text,p_request uuid,p_expected_attempt integer) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.guild_missions; p public.guild_mission_progress; a public.guild_mission_attempts; v_attempt integer;
BEGIN
 SELECT * INTO m FROM public.guild_missions WHERE id=p_mission FOR UPDATE;
 PERFORM guild_ops.actor(p_actor,m.guild_id);
 IF p_request IS NULL OR p_action IS NULL OR p_action NOT IN ('start','submit') OR p_expected_attempt IS NULL OR p_expected_attempt<0 THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF m.audience='selected' AND NOT p_actor=ANY(m.target_traveler_ids) THEN RAISE EXCEPTION 'Not eligible' USING ERRCODE='42501'; END IF;
 SELECT * INTO p FROM public.guild_mission_progress WHERE mission_id=p_mission AND traveler_id=p_actor FOR UPDATE;
 IF p_action='submit' THEN
   SELECT * INTO a FROM public.guild_mission_attempts WHERE mission_id=p_mission AND traveler_id=p_actor AND request_id=p_request;
   IF FOUND THEN IF a.note IS DISTINCT FROM btrim(p_note) THEN RAISE EXCEPTION 'Submission key reused'; END IF; RETURN coalesce(a.decision,'pending_approval'); END IF;
 END IF;
 IF m.status<>'published' OR (m.starts_at IS NOT NULL AND m.starts_at>clock_timestamp()) OR (m.due_at IS NOT NULL AND m.due_at<=clock_timestamp()) THEN RAISE EXCEPTION 'Mission not available'; END IF;
 IF p_action='start' THEN
   IF p.status='started' THEN RETURN 'started'; END IF;
   IF p.status IS NOT NULL AND p.status NOT IN ('available','rejected','changes_requested') THEN RAISE EXCEPTION 'Mission already submitted'; END IF;
   INSERT INTO public.guild_mission_progress(mission_id,traveler_id,status,started_at) VALUES(p_mission,p_actor,'started',clock_timestamp()) ON CONFLICT(mission_id,traveler_id) DO UPDATE SET status='started',started_at=coalesce(public.guild_mission_progress.started_at,clock_timestamp());
   RETURN 'started';
 END IF;
 IF p.status IS DISTINCT FROM 'started' OR p.submission_revision<>p_expected_attempt OR length(btrim(coalesce(p_note,''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Submission unavailable or evidence missing'; END IF;
 v_attempt:=p.submission_revision+1;
 INSERT INTO public.guild_mission_attempts(mission_id,traveler_id,revision,request_id,note) VALUES(p_mission,p_actor,v_attempt,p_request,btrim(p_note));
 UPDATE public.guild_mission_progress SET status='pending_approval',completion_note=btrim(p_note),submitted_at=clock_timestamp(),submission_revision=v_attempt,review_note=NULL,approved_at=NULL,approved_by_traveler_id=NULL WHERE id=p.id;
 RETURN 'pending_approval';
END $$;

CREATE FUNCTION public.review_guild_mission_v2(p_actor uuid,p_attempt uuid,p_revision integer,p_decision text,p_reason text,p_request uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.guild_mission_attempts; m public.guild_missions; p public.guild_mission_progress;
BEGIN
 SELECT * INTO a FROM public.guild_mission_attempts WHERE id=p_attempt;
 SELECT * INTO m FROM public.guild_missions WHERE id=a.mission_id FOR UPDATE;
 PERFORM guild_ops.actor(p_actor,m.guild_id,true);
 PERFORM 1 FROM public.guild_members gm WHERE gm.guild_id=m.guild_id AND gm.traveler_id=a.traveler_id AND gm.status='active' FOR SHARE;
 IF NOT FOUND OR EXISTS(SELECT 1 FROM public.travelers WHERE id=a.traveler_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Self review or inactive member' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.guild_mission_attempts WHERE id=p_attempt FOR UPDATE;
 IF p_request IS NULL OR p_revision IS NULL OR p_revision<1 OR p_decision NOT IN ('approved','rejected','changes_requested') OR p_decision IS NULL OR length(coalesce(p_reason,''))>500 OR (p_decision<>'approved' AND length(btrim(coalesce(p_reason,'')))=0) THEN RAISE EXCEPTION 'Decision needs a valid reason'; END IF;
 IF a.decision IS NOT NULL THEN
   IF a.decision_request_id=p_request AND a.decision=p_decision AND coalesce(a.reason,'')=btrim(coalesce(p_reason,'')) THEN RETURN a.decision; END IF;
   RAISE EXCEPTION 'Submission already reviewed';
 END IF;
 SELECT * INTO p FROM public.guild_mission_progress WHERE mission_id=a.mission_id AND traveler_id=a.traveler_id FOR UPDATE;
 IF m.status='cancelled' OR a.revision<>p_revision OR p.submission_revision<>a.revision OR p.status<>'pending_approval' THEN RAISE EXCEPTION 'Stale submission'; END IF;
 IF p_decision='approved' AND length(btrim(a.note))=0 THEN RAISE EXCEPTION 'Evidence missing; request correction'; END IF;
 UPDATE public.guild_mission_attempts SET decision=p_decision,reason=nullif(btrim(coalesce(p_reason,'')),''),reviewer_traveler_id=p_actor,decided_at=clock_timestamp(),decision_request_id=p_request WHERE id=p_attempt;
 UPDATE public.guild_mission_progress SET status=p_decision,review_note=nullif(btrim(coalesce(p_reason,'')),''),approved_by_traveler_id=p_actor,approved_at=CASE WHEN p_decision='approved' THEN clock_timestamp() ELSE NULL END WHERE id=p.id;
 INSERT INTO public.guild_activity_log(guild_id,actor_traveler_id,event_type,entity_type,entity_id,metadata) VALUES(m.guild_id,p_actor,'mission_decision','mission',m.id,jsonb_build_object('decision',p_decision,'revision',a.revision));
 RETURN p_decision;
END $$;

CREATE FUNCTION public.guild_mission_workspace(p_actor uuid,p_history_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_guild uuid; v_role text; v_result jsonb;
BEGIN
 SELECT guild_id INTO v_guild FROM public.guild_members WHERE traveler_id=p_actor AND status='active';
 v_role:=guild_ops.actor(p_actor,v_guild);
 IF p_history_offset IS NULL OR p_history_offset<0 OR p_history_offset>10000 THEN RAISE EXCEPTION 'Invalid history page'; END IF;
 SELECT jsonb_build_object('version',1,'guildId',v_guild,'missions',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.created_at DESC) FROM public.guild_missions m WHERE m.guild_id=v_guild AND guild_ops.visible(m.id) AND (v_role='leader' OR (m.status<>'draft' AND ((m.status='published' AND (m.audience='all' OR p_actor=ANY(m.target_traveler_ids))) OR EXISTS(SELECT 1 FROM public.guild_mission_progress own WHERE own.mission_id=m.id AND own.traveler_id=p_actor))))),'[]'::jsonb),
 'progress',coalesce((SELECT jsonb_agg(to_jsonb(p)) FROM public.guild_mission_progress p JOIN public.guild_missions m ON m.id=p.mission_id WHERE m.guild_id=v_guild AND (v_role='leader' OR p.traveler_id=p_actor) AND guild_ops.visible(m.id)),'[]'::jsonb),
 'attempts',coalesce((SELECT jsonb_agg(to_jsonb(a)||jsonb_build_object('traveler_name',t.name) ORDER BY a.submitted_at) FROM public.guild_mission_attempts a JOIN public.guild_missions m ON m.id=a.mission_id JOIN public.travelers t ON t.id=a.traveler_id WHERE m.guild_id=v_guild AND (v_role='leader' OR a.traveler_id=p_actor) AND guild_ops.visible(m.id)),'[]'::jsonb),
 'history',CASE WHEN v_role='leader' THEN coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM (SELECT * FROM public.guild_activity_log WHERE guild_id=v_guild ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET p_history_offset) h),'[]'::jsonb) ELSE '[]'::jsonb END) INTO v_result;
 RETURN v_result;
END $$;

-- Close the former mutation paths at cutover: they could otherwise pay out or
-- bypass the new evidence/audience/decision controls. Read APIs, invites and members stay.
REVOKE EXECUTE ON FUNCTION public.create_guild_mission(uuid,text,text,text,text,text,text,text,timestamptz,timestamptz,boolean,jsonb),public.publish_guild_mission(uuid,uuid),public.start_guild_mission(uuid,uuid),public.submit_guild_mission(uuid,uuid,text),public.review_guild_mission(uuid,uuid,uuid,boolean),public.review_guild_mission_with_guidance(uuid,uuid,uuid,boolean,text),public.update_guild_mission_draft(uuid,uuid,text,text,text,text,text,text,text,timestamptz,timestamptz),public.delete_guild_mission_draft(uuid,uuid),public.close_guild_mission(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_guild_mission_v2(uuid,uuid,integer,jsonb),public.transition_guild_mission_v2(uuid,uuid,integer,text),public.act_guild_mission_v2(uuid,uuid,text,text,uuid,integer),public.review_guild_mission_v2(uuid,uuid,integer,text,text,uuid),public.guild_mission_workspace(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_guild_mission_v2(uuid,uuid,integer,jsonb),public.transition_guild_mission_v2(uuid,uuid,integer,text),public.act_guild_mission_v2(uuid,uuid,text,text,uuid,integer),public.review_guild_mission_v2(uuid,uuid,integer,text,text,uuid),public.guild_mission_workspace(uuid,integer) TO authenticated;
COMMIT;
