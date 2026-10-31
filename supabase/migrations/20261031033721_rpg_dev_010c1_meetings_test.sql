-- 010C.1 TEST-only. Existing missions/progress/attempts, no legacy conversion or economics.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $guard$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' OR to_regnamespace('guild_activity_private') IS NOT NULL
 OR to_regclass('ebd_class_private.quizzes') IS NULL THEN RAISE EXCEPTION 'Reviewed 010C1 TEST baseline required';END IF;
 IF EXISTS(SELECT 1 FROM pg_proc WHERE oid IN(to_regprocedure('public.save_guild_mission_v2(uuid,uuid,integer,jsonb)'),to_regprocedure('public.act_guild_mission_v2(uuid,uuid,text,text,uuid,integer)'),to_regprocedure('public.review_guild_mission_v2(uuid,uuid,integer,text,text,uuid)'),to_regprocedure('public.transition_guild_mission_v2(uuid,uuid,integer,text)')) AND (has_function_privilege('authenticated',oid,'execute') OR has_function_privilege('anon',oid,'execute') OR has_function_privilege('service_role',oid,'execute'))) THEN RAISE EXCEPTION 'Legacy mission writes must remain closed';END IF;
END $guard$;
DO $canonical$ DECLARE item record;routine oid;BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('public.act_guild_mission_v2(uuid,uuid,text,text,uuid,integer)','9f2f28acc941f5ee2f189fa867518c64'),
 ('public.guild_activity_capture()','6d591aaf69a09b5c20ee6cd633ddd2b5'),
 ('guild_admin_private.active_actor(uuid)','05ae51c71fa24e9bcd40a14eaa8451b9'),
 ('guild_admin_private.guild_role(uuid,uuid,boolean)','69f1231558149c36917b3f6937472acb'),
 ('guild_admin_private.require_writes()','7b0491ee6ef8b6c22e69624c4dab3920'),
 ('public.review_guild_mission_v2(uuid,uuid,integer,text,text,uuid)','91c961fc3849571fa09a162e1811140b'),
 ('public.save_guild_mission_v2(uuid,uuid,integer,jsonb)','3291d9c4dfc19f84310ddf11fe52841d'),
 ('public.transition_guild_mission_v2(uuid,uuid,integer,text)','0f093249179d2444adc39410148fa616')
 ) AS expected(signature,hash) LOOP
 routine:=to_regprocedure(item.signature);
 IF routine IS NULL OR md5(pg_get_functiondef(routine))<>item.hash
 OR (SELECT proacl::text FROM pg_proc WHERE oid=routine) IS DISTINCT FROM '{postgres=X/postgres}'
 THEN RAISE EXCEPTION 'Reviewed legacy definition and owner-only ACL required: %',item.signature;END IF;
 END LOOP;
END $canonical$;
CREATE SCHEMA guild_activity_private;
REVOKE ALL ON SCHEMA guild_activity_private FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA guild_activity_private TO authenticated;
ALTER TABLE public.guild_missions ADD COLUMN community_protocol smallint CHECK(community_protocol=1);
ALTER TABLE public.guild_mission_progress ADD COLUMN participant_uid uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 ADD COLUMN community_revision integer CHECK(community_revision>0);
CREATE UNIQUE INDEX guild_mission_account_participation ON public.guild_mission_progress(mission_id,participant_uid) WHERE participant_uid IS NOT NULL;
CREATE TABLE guild_activity_private.details(
 mission_id uuid PRIMARY KEY REFERENCES public.guild_missions(id),
 kind text NOT NULL CHECK(kind IN('meeting','activity')),
 meeting_id uuid REFERENCES public.guild_missions(id),
 category text NOT NULL CHECK(category IN('biblical_challenge','guided_reading','practical','gincana','solidarity','group','cooperative','competitive','special')),
 theme text NOT NULL CHECK(length(theme)<=100),
 meeting_type text NOT NULL CHECK(meeting_type IN('in_person','digital')),
 responsible_id uuid NOT NULL REFERENCES public.travelers(id),
 access_details text NOT NULL DEFAULT '' CHECK(length(access_details)<=600),
 future_category text NOT NULL CHECK(future_category IN('none','common','rare','epic')),
 CHECK(kind='meeting' OR access_details=''),CHECK(kind='activity' OR meeting_id IS NULL)
);
CREATE INDEX guild_activity_meeting ON guild_activity_private.details(meeting_id) WHERE meeting_id IS NOT NULL;
CREATE TABLE guild_activity_private.delegations(
 mission_id uuid NOT NULL REFERENCES public.guild_missions(id),traveler_id uuid NOT NULL REFERENCES public.travelers(id),
 expires_at timestamptz NOT NULL,active boolean NOT NULL,revision integer NOT NULL CHECK(revision>0),
 granted_by uuid NOT NULL REFERENCES public.travelers(id),PRIMARY KEY(mission_id,traveler_id)
);
CREATE TABLE guild_activity_private.commands(
 request_id uuid PRIMARY KEY,owner_id uuid NOT NULL,actor_id uuid NOT NULL,guild_id uuid NOT NULL,
 fingerprint text NOT NULL,receipt jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE guild_activity_private.future_eligibility(
 mission_id uuid NOT NULL REFERENCES public.guild_missions(id),owner_id uuid NOT NULL REFERENCES auth.users(id),
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),category text NOT NULL CHECK(category IN('none','common','rare','epic')),
 participation_revision integer NOT NULL CHECK(participation_revision>0),validated boolean NOT NULL,
 state text NOT NULL DEFAULT 'pending_010d' CHECK(state='pending_010d'),
 xp_issued integer NOT NULL DEFAULT 0 CHECK(xp_issued=0),chests_issued integer NOT NULL DEFAULT 0 CHECK(chests_issued=0),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(mission_id,owner_id)
);
CREATE TABLE guild_activity_private.validation_history(
 request_id uuid PRIMARY KEY,mission_id uuid NOT NULL REFERENCES public.guild_missions(id),
 traveler_id uuid NOT NULL REFERENCES public.travelers(id),reviewer_id uuid NOT NULL REFERENCES public.travelers(id),
 before_status text NOT NULL,after_status text NOT NULL,reason text NOT NULL CHECK(length(reason)<=300),
 revision integer NOT NULL CHECK(revision>0),created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX guild_activity_validation_history ON guild_activity_private.validation_history(mission_id,traveler_id,created_at);
CREATE FUNCTION guild_activity_private.immutable_validation_history() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Validation history is append-only' USING ERRCODE='42501';END $$;
CREATE TRIGGER validation_history_append_only BEFORE UPDATE OR DELETE ON guild_activity_private.validation_history
FOR EACH ROW EXECUTE FUNCTION guild_activity_private.immutable_validation_history();
DO $rls$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['details','delegations','commands','future_eligibility','validation_history'] LOOP
 EXECUTE format('ALTER TABLE guild_activity_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON TABLE guild_activity_private.%I FROM PUBLIC,anon,authenticated,service_role',t);END LOOP;
END $rls$;
CREATE FUNCTION guild_activity_private.actor_role(p_actor uuid,p_guild uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM guild_admin_private.active_actor(p_actor);RETURN guild_admin_private.guild_role(p_actor,p_guild,false);END $$;
CREATE FUNCTION guild_activity_private.can_validate(p_actor uuid,p_mission uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.guild_missions m WHERE m.id=p_mission AND m.community_protocol=1 AND
 (guild_activity_private.actor_role(p_actor,m.guild_id)='leader' OR EXISTS(SELECT 1 FROM guild_activity_private.delegations d WHERE d.mission_id=m.id AND d.traveler_id=p_actor AND d.active AND d.expires_at>clock_timestamp())))
$$;
CREATE FUNCTION guild_activity_private.workspace(p_actor uuid,p_guild uuid,p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE own_role text;ids uuid[];staff boolean;
BEGIN
 own_role:=guild_activity_private.actor_role(p_actor,p_guild);staff:=own_role='leader';
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(array_agg(x.id),'{}') INTO ids FROM(SELECT m.id FROM public.guild_missions m WHERE m.guild_id=p_guild AND m.community_protocol=1 AND
 (staff OR guild_activity_private.can_validate(p_actor,m.id) OR(m.status<>'draft' AND (m.audience='all' OR p_actor=ANY(m.target_traveler_ids) OR EXISTS(SELECT 1 FROM public.guild_mission_progress gp WHERE gp.mission_id=m.id AND gp.participant_uid=auth.uid()))))
 ORDER BY m.starts_at NULLS LAST,m.created_at DESC,m.id LIMIT 25 OFFSET p_offset)x;
 RETURN jsonb_build_object('version',1,'guildId',p_guild,'leader',staff,'hasMore',(cardinality(ids)=25),'offset',p_offset,
 'missions',coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'description',m.description,'objective',m.objective,'instructions',m.instructions,'evidenceCriterion',m.evidence_criterion,'reference',m.bible_reference,'startsAt',m.starts_at,'dueAt',m.due_at,'status',m.status,'revision',m.workspace_revision,'audience',m.audience,'targetIds',CASE WHEN staff THEN to_jsonb(m.target_traveler_ids) ELSE '[]'::jsonb END,
 'kind',d.kind,'meetingId',d.meeting_id,'category',d.category,'theme',d.theme,'meetingType',d.meeting_type,'responsibleId',d.responsible_id,'accessDetails',CASE WHEN staff OR(m.status='published' AND(m.audience='all' OR p_actor=ANY(m.target_traveler_ids))) THEN d.access_details ELSE '' END,'futureCategory',d.future_category,'canEdit',staff,'canValidate',guild_activity_private.can_validate(p_actor,m.id),
 'canParticipate',m.status='published' AND (m.audience='all' OR p_actor=ANY(m.target_traveler_ids)) AND(m.starts_at IS NULL OR m.starts_at<=clock_timestamp()) AND(m.due_at IS NULL OR m.due_at>=clock_timestamp()) AND(d.meeting_id IS NULL OR EXISTS(SELECT 1 FROM public.guild_missions parent WHERE parent.id=d.meeting_id AND parent.status='published')))
 ORDER BY m.starts_at NULLS LAST,m.created_at DESC,m.id) FROM public.guild_missions m JOIN guild_activity_private.details d ON d.mission_id=m.id WHERE m.id=ANY(ids)),'[]'::jsonb),
 'progress',coalesce((SELECT jsonb_agg(jsonb_build_object('id',gp.id,'missionId',gp.mission_id,'travelerId',gp.traveler_id,'travelerName',t.name,'own',gp.participant_uid=auth.uid(),'status',gp.status,'revision',gp.community_revision,'submittedAt',gp.submitted_at,'approvedAt',gp.approved_at,'reviewNote',gp.review_note)) FROM public.guild_mission_progress gp JOIN public.travelers t ON t.id=gp.traveler_id WHERE gp.mission_id=ANY(ids) AND gp.participant_uid IS NOT NULL AND(gp.participant_uid=auth.uid() OR guild_activity_private.can_validate(p_actor,gp.mission_id))),'[]'::jsonb),
 'members',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name)) FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id WHERE gm.guild_id=p_guild AND gm.status='active'),'[]'::jsonb) ELSE '[]'::jsonb END,
 'delegations',coalesce((SELECT jsonb_agg(jsonb_build_object('missionId',d.mission_id,'travelerId',d.traveler_id,'expiresAt',d.expires_at,'active',d.active,'revision',d.revision)) FROM guild_activity_private.delegations d WHERE d.mission_id=ANY(ids) AND(staff OR d.traveler_id=p_actor)),'[]'::jsonb),
 'validations',coalesce((SELECT jsonb_agg(jsonb_build_object('missionId',h.mission_id,'travelerId',h.traveler_id,'reviewerId',h.reviewer_id,'beforeStatus',h.before_status,'afterStatus',h.after_status,'reason',h.reason,'revision',h.revision,'createdAt',h.created_at) ORDER BY h.created_at DESC) FROM guild_activity_private.validation_history h WHERE h.mission_id=ANY(ids) AND guild_activity_private.can_validate(p_actor,h.mission_id)),'[]'::jsonb),
 'history',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC,x.id) FROM(SELECT a.id,a.entity_id,a.event_type,a.actor_traveler_id,a.metadata,a.created_at FROM public.guild_activity_log a WHERE a.guild_id=p_guild AND a.entity_id=ANY(ids) AND a.event_type LIKE 'community_%' AND(staff OR a.actor_traveler_id=p_actor OR a.metadata->>'subject'=p_actor::text OR guild_activity_private.can_validate(p_actor,a.entity_id)) ORDER BY a.created_at DESC,a.id LIMIT 40)x),'[]'::jsonb));
END $$;
CREATE FUNCTION guild_activity_private.command(p_actor uuid,p_guild uuid,p_action text,p_id uuid,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE owner_id uuid;own_role text;m public.guild_missions%ROWTYPE;d guild_activity_private.details%ROWTYPE;
 gp public.guild_mission_progress%ROWTYPE;old_cmd guild_activity_private.commands%ROWTYPE;
 old_delegate guild_activity_private.delegations%ROWTYPE;sig text;receipt jsonb;next_rev integer;target uuid;target_owner uuid;actor_name text;
 parent uuid;v_kind text;v_status text;v_category text;v_future text;v_expires timestamptz;v_start timestamptz;v_due timestamptz;v_targets uuid[];v_now timestamptz;previous_status text;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();own_role:=guild_activity_private.actor_role(p_actor,p_guild);owner_id:=auth.uid();v_now:=clock_timestamp();
 IF p_id IS NULL OR p_request IS NULL OR p_revision IS NULL OR p_revision<0 OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR p_action IS NULL OR p_action NOT IN('save','state','delegate','participate','review') THEN RAISE EXCEPTION 'Invalid command' USING ERRCODE='22023';END IF;
 SELECT * INTO m FROM public.guild_missions WHERE id=p_id FOR UPDATE;
 IF m.id IS NOT NULL AND(m.guild_id<>p_guild OR m.community_protocol IS DISTINCT FROM 1) THEN RAISE EXCEPTION 'Activity unavailable' USING ERRCODE='42501';END IF;
 IF p_action IN('save','state','delegate') AND own_role<>'leader' OR p_action='review' AND(m.id IS NULL OR NOT guild_activity_private.can_validate(p_actor,p_id)) THEN RAISE EXCEPTION 'Current activity authorization required' USING ERRCODE='42501';END IF;
 IF p_action<>'save' AND m.id IS NULL THEN RAISE EXCEPTION 'Activity unavailable' USING ERRCODE='P0002';END IF;
 sig:=md5(jsonb_build_array(p_actor,p_guild,p_action,p_id,p_revision,p_data)::text);SELECT * INTO old_cmd FROM guild_activity_private.commands WHERE request_id=p_request;
 IF old_cmd.request_id IS NOT NULL THEN IF old_cmd.owner_id<>owner_id OR old_cmd.actor_id<>p_actor OR old_cmd.guild_id<>p_guild OR old_cmd.fingerprint<>sig THEN RAISE EXCEPTION 'Command conflict' USING ERRCODE='PT409';END IF;RETURN old_cmd.receipt||jsonb_build_object('replayed',true);END IF;
 SELECT * INTO d FROM guild_activity_private.details WHERE mission_id=p_id;
 IF p_action='save' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['title','description','objective','instructions','evidenceCriterion','bibleReference','startsAt','dueAt','audience','targetIds','kind','meetingId','category','theme','meetingType','responsibleId','accessDetails','futureCategory']);
 IF m.id IS NOT NULL AND(m.status<>'draft' OR m.workspace_revision<>p_revision) OR m.id IS NULL AND p_revision<>0 THEN RAISE EXCEPTION 'Activity conflict' USING ERRCODE='PT409';END IF;
 v_kind:=p_data->>'kind';v_category:=p_data->>'category';v_future:=p_data->>'futureCategory';
 IF v_kind IS NULL OR v_kind NOT IN('meeting','activity') OR v_category IS NULL OR v_category NOT IN('biblical_challenge','guided_reading','practical','gincana','solidarity','group','cooperative','competitive','special') OR v_future IS NULL OR v_future NOT IN('none','common','rare','epic')
 OR length(btrim(coalesce(p_data->>'title',''))) NOT BETWEEN 2 AND 100 OR length(btrim(coalesce(p_data->>'description',''))) NOT BETWEEN 1 AND 1000 OR length(btrim(coalesce(p_data->>'objective',''))) NOT BETWEEN 1 AND 500
 OR length(btrim(coalesce(p_data->>'instructions',''))) NOT BETWEEN 1 AND 1000 OR length(btrim(coalesce(p_data->>'evidenceCriterion',''))) NOT BETWEEN 1 AND 300 OR length(coalesce(p_data->>'bibleReference',''))>100 OR length(coalesce(p_data->>'theme',''))>100 OR length(coalesce(p_data->>'accessDetails',''))>600
 OR p_data->>'meetingType' IS NULL OR p_data->>'meetingType' NOT IN('in_person','digital') OR p_data->>'audience' IS NULL OR p_data->>'audience' NOT IN('all','selected') OR jsonb_typeof(p_data->'targetIds') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'targetIds')>100 THEN RAISE EXCEPTION 'Invalid activity fields' USING ERRCODE='22023';END IF;
 v_start:=nullif(p_data->>'startsAt','')::timestamptz;v_due:=nullif(p_data->>'dueAt','')::timestamptz;
 IF v_kind='meeting' AND v_start IS NULL OR v_due<=v_start OR v_kind='activity' AND coalesce(p_data->>'accessDetails','')<>'' THEN RAISE EXCEPTION 'Invalid meeting date or access' USING ERRCODE='22023';END IF;
 IF v_kind='meeting' AND p_data->>'meetingType'='digital' AND coalesce(p_data->>'accessDetails','')<>'' AND(p_data->>'accessDetails' !~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$' OR p_data->>'accessDetails'~'[[:cntrl:]]') THEN RAISE EXCEPTION 'HTTPS access link required' USING ERRCODE='22023';END IF;
 SELECT coalesce(array_agg(DISTINCT value::uuid),'{}') INTO v_targets FROM jsonb_array_elements_text(p_data->'targetIds');
 IF p_data->>'audience'='all' AND cardinality(v_targets)>0 OR p_data->>'audience'='selected' AND cardinality(v_targets)=0 OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE NOT EXISTS(SELECT 1 FROM public.guild_members gm WHERE gm.guild_id=p_guild AND gm.traveler_id=t AND gm.status='active')) THEN RAISE EXCEPTION 'Invalid audience' USING ERRCODE='42501';END IF;
 target:=(p_data->>'responsibleId')::uuid;IF target IS NULL OR NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active') THEN RAISE EXCEPTION 'Responsible must be an active member; validation requires explicit delegation' USING ERRCODE='42501';END IF;
 parent:=nullif(p_data->>'meetingId','')::uuid;IF parent IS NOT NULL AND(v_kind<>'activity' OR NOT EXISTS(SELECT 1 FROM public.guild_missions pm JOIN guild_activity_private.details pd ON pd.mission_id=pm.id WHERE pm.id=parent AND pm.guild_id=p_guild AND pm.community_protocol=1 AND pd.kind='meeting' AND pm.status IN('draft','published'))) THEN RAISE EXCEPTION 'Meeting unavailable' USING ERRCODE='42501';END IF;
 IF m.id IS NOT NULL AND d.kind<>v_kind THEN RAISE EXCEPTION 'Activity kind is fixed' USING ERRCODE='22023';END IF;
 next_rev:=coalesce(m.workspace_revision,0)+1;
 INSERT INTO public.guild_missions(id,guild_id,created_by_traveler_id,title,description,mission_type,completion_mode,requires_leader_approval,reward_tier,status,starts_at,due_at,objective,instructions,evidence_criterion,bible_reference,audience,target_traveler_ids,workspace_revision,community_protocol)
 VALUES(p_id,p_guild,p_actor,btrim(p_data->>'title'),p_data->>'description','practical_activity','leader_approval',true,'normal','draft',v_start,v_due,p_data->>'objective',p_data->>'instructions',p_data->>'evidenceCriterion',p_data->>'bibleReference',p_data->>'audience',v_targets,next_rev,1)
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,starts_at=excluded.starts_at,due_at=excluded.due_at,objective=excluded.objective,instructions=excluded.instructions,evidence_criterion=excluded.evidence_criterion,bible_reference=excluded.bible_reference,audience=excluded.audience,target_traveler_ids=excluded.target_traveler_ids,workspace_revision=excluded.workspace_revision;
 INSERT INTO guild_activity_private.details VALUES(p_id,v_kind,parent,v_category,coalesce(p_data->>'theme',''),p_data->>'meetingType',target,coalesce(p_data->>'accessDetails',''),v_future)
 ON CONFLICT(mission_id) DO UPDATE SET meeting_id=excluded.meeting_id,category=excluded.category,theme=excluded.theme,meeting_type=excluded.meeting_type,responsible_id=excluded.responsible_id,access_details=excluded.access_details,future_category=excluded.future_category;
 ELSIF p_action='state' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['state']);v_status:=p_data->>'state';
 IF m.workspace_revision<>p_revision THEN RAISE EXCEPTION 'Activity conflict' USING ERRCODE='PT409';END IF;
 IF NOT(m.status='draft' AND v_status IN('published','cancelled') OR m.status='published' AND v_status IN('closed','cancelled')) THEN RAISE EXCEPTION 'Invalid activity transition' USING ERRCODE='22023';END IF;
 IF v_status='published' AND d.meeting_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.guild_missions WHERE id=d.meeting_id AND status='published') THEN RAISE EXCEPTION 'Publish parent meeting first' USING ERRCODE='22023';END IF;
 IF v_status='closed' AND d.kind='meeting' AND EXISTS(SELECT 1 FROM guild_activity_private.details child JOIN public.guild_missions cm ON cm.id=child.mission_id WHERE child.meeting_id=p_id AND cm.status NOT IN('closed','cancelled')) THEN RAISE EXCEPTION 'Close or cancel meeting activities first' USING ERRCODE='22023';END IF;
 previous_status:=m.status;
 UPDATE public.guild_missions SET status=v_status,workspace_revision=workspace_revision+1,published_at=CASE WHEN v_status='published' THEN v_now ELSE published_at END,closed_at=CASE WHEN v_status IN('closed','cancelled') THEN v_now ELSE closed_at END WHERE id=p_id;next_rev:=p_revision+1;
 IF v_status='cancelled' THEN UPDATE guild_activity_private.future_eligibility SET validated=false,updated_at=v_now WHERE mission_id=p_id OR mission_id IN(SELECT mission_id FROM guild_activity_private.details WHERE meeting_id=p_id);END IF;
 ELSIF p_action='delegate' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['travelerId','active','expiresAt']);target:=(p_data->>'travelerId')::uuid;v_expires:=(p_data->>'expiresAt')::timestamptz;
 IF jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean' OR target IS NULL OR NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active') OR (p_data->>'active')::boolean AND m.status NOT IN('draft','published') THEN RAISE EXCEPTION 'Invalid temporary validator' USING ERRCODE='42501';END IF;
 IF v_expires IS NULL OR (p_data->>'active')::boolean AND(v_expires<=v_now OR v_expires>v_now+interval '30 days') THEN RAISE EXCEPTION 'Temporary delegation requires a future expiry within30days' USING ERRCODE='22023';END IF;
 SELECT * INTO old_delegate FROM guild_activity_private.delegations WHERE mission_id=p_id AND traveler_id=target;
 IF coalesce(old_delegate.revision,0)<>p_revision THEN RAISE EXCEPTION 'Delegation conflict' USING ERRCODE='PT409';END IF;next_rev:=p_revision+1;
 INSERT INTO guild_activity_private.delegations VALUES(p_id,target,v_expires,(p_data->>'active')::boolean,next_rev,p_actor) ON CONFLICT(mission_id,traveler_id) DO UPDATE SET expires_at=excluded.expires_at,active=excluded.active,revision=excluded.revision,granted_by=excluded.granted_by;
 ELSIF p_action='participate' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['declared']);IF p_data->'declared' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Participation declaration required; no personal text' USING ERRCODE='22023';END IF;
 IF m.status<>'published' OR m.audience='selected' AND NOT p_actor=ANY(m.target_traveler_ids) OR m.starts_at>v_now OR m.due_at<v_now OR d.meeting_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.guild_missions WHERE id=d.meeting_id AND status='published') THEN RAISE EXCEPTION 'Participation unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO gp FROM public.guild_mission_progress WHERE mission_id=p_id AND participant_uid=owner_id FOR UPDATE;
 IF gp.id IS NOT NULL AND gp.traveler_id<>p_actor THEN RAISE EXCEPTION 'Account already participating through another avatar' USING ERRCODE='PT409';END IF;
 IF coalesce(gp.community_revision,0)<>p_revision OR gp.status IN('pending_approval','approved','completed') THEN RAISE EXCEPTION 'Participation conflict' USING ERRCODE='PT409';END IF;next_rev:=p_revision+1;
 INSERT INTO public.guild_mission_progress(mission_id,traveler_id,participant_uid,community_revision,status,submitted_at,completion_note,submission_revision)
 VALUES(p_id,p_actor,owner_id,next_rev,'pending_approval',v_now,'Participação declarada',1)
 ON CONFLICT(mission_id,traveler_id) DO UPDATE SET community_revision=excluded.community_revision,status='pending_approval',submitted_at=v_now,completion_note='Participação declarada',submission_revision=guild_mission_progress.submission_revision+1 RETURNING * INTO gp;
 INSERT INTO public.guild_mission_attempts(mission_id,traveler_id,revision,request_id,note) VALUES(p_id,p_actor,gp.submission_revision,p_request,'Participação declarada');
 ELSIF p_action='review' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['travelerId','decision','reason']);target:=(p_data->>'travelerId')::uuid;v_status:=p_data->>'decision';
 SELECT user_id INTO target_owner FROM public.travelers WHERE id=target;
 IF target_owner IS NULL OR target_owner=owner_id OR m.status NOT IN('published','closed') OR m.starts_at>v_now OR NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active') THEN RAISE EXCEPTION 'Cannot validate own account or unavailable participation' USING ERRCODE='42501';END IF;
 IF d.meeting_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.guild_missions WHERE id=d.meeting_id AND status='cancelled') THEN RAISE EXCEPTION 'Parent meeting cancelled' USING ERRCODE='42501';END IF;
 SELECT * INTO gp FROM public.guild_mission_progress WHERE mission_id=p_id AND traveler_id=target AND participant_uid=target_owner FOR UPDATE;
 IF gp.id IS NULL OR gp.community_revision<>p_revision THEN RAISE EXCEPTION 'Participation conflict' USING ERRCODE='PT409';END IF;
 IF v_status IS NULL OR v_status NOT IN('approved','rejected','changes_requested') OR length(coalesce(p_data->>'reason',''))>300 OR (v_status<>'approved' OR gp.status<>'pending_approval' OR m.status='closed') AND length(btrim(coalesce(p_data->>'reason','')))=0 THEN RAISE EXCEPTION 'Objective correction reason required' USING ERRCODE='22023';END IF;
 IF coalesce(p_data->>'reason','') ~* '(bearer[[:space:]]+[a-z0-9._-]+|eyJ[a-z0-9_-]{15,}\.[a-z0-9_-]+|sb_secret_|sbp_|-----BEGIN[[:space:]].*PRIVATE KEY|password[[:space:]]*[:=]|senha[[:space:]]*[:=]|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})' THEN RAISE EXCEPTION 'Do not include credentials or personal contacts in correction reason' USING ERRCODE='22023';END IF;
 previous_status:=gp.status;next_rev:=p_revision+1;
 UPDATE public.guild_mission_progress SET status=v_status,community_revision=next_rev,review_note=coalesce(p_data->>'reason',''),approved_at=CASE WHEN v_status='approved' THEN v_now ELSE NULL END,approved_by_traveler_id=CASE WHEN v_status='approved' THEN p_actor ELSE NULL END WHERE id=gp.id;
 UPDATE public.guild_mission_attempts SET decision=v_status,reason=coalesce(p_data->>'reason',''),reviewer_traveler_id=p_actor,decided_at=v_now,decision_request_id=p_request WHERE mission_id=p_id AND traveler_id=target AND revision=gp.submission_revision;
 INSERT INTO guild_activity_private.validation_history(request_id,mission_id,traveler_id,reviewer_id,before_status,after_status,reason,revision) VALUES(p_request,p_id,target,p_actor,previous_status,v_status,coalesce(p_data->>'reason',''),next_rev);
 INSERT INTO guild_activity_private.future_eligibility(mission_id,owner_id,traveler_id,category,participation_revision,validated) VALUES(p_id,target_owner,target,d.future_category,next_rev,v_status='approved')
 ON CONFLICT ON CONSTRAINT future_eligibility_pkey DO UPDATE SET participation_revision=excluded.participation_revision,validated=excluded.validated,category=excluded.category,updated_at=v_now;
 END IF;
 receipt:=jsonb_build_object('id',p_id,'guildId',p_guild,'action',p_action,'revision',next_rev,'replayed',false,'economicIssued',false);
 INSERT INTO guild_activity_private.commands VALUES(p_request,owner_id,p_actor,p_guild,sig,receipt,v_now);
 INSERT INTO public.guild_activity_log(guild_id,actor_traveler_id,event_type,entity_type,entity_id,metadata) VALUES(p_guild,p_actor,'community_'||p_action,'community_activity',p_id,jsonb_build_object('revision',next_rev,'beforeStatus',previous_status,'afterStatus',CASE WHEN p_action IN('state','review') THEN v_status END,'subject',CASE WHEN p_action IN('delegate','review') THEN target END,'reasonDigest',CASE WHEN p_action='review' THEN md5(coalesce(p_data->>'reason','')) END));
 RETURN receipt;
END $$;
CREATE FUNCTION public.guild_activity_workspace(p_actor uuid,p_guild uuid,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$SELECT guild_activity_private.workspace(p_actor,p_guild,p_offset)$$;
CREATE FUNCTION public.guild_activity_command(p_actor uuid,p_guild uuid,p_action text,p_id uuid,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT guild_activity_private.command(p_actor,p_guild,p_action,p_id,p_request,p_revision,p_data)$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA guild_activity_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.guild_activity_workspace(uuid,uuid,integer),public.guild_activity_command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION guild_activity_private.workspace(uuid,uuid,integer),guild_activity_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb),public.guild_activity_workspace(uuid,uuid,integer),public.guild_activity_command(uuid,uuid,text,uuid,uuid,integer,jsonb) TO authenticated;
