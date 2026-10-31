-- 010C.2 TEST only. Private educational results; no economic receipts or legacy conversion.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' OR to_regnamespace('guild_challenge_private') IS NOT NULL
 OR to_regclass('guild_activity_private.validation_history') IS NULL OR to_regclass('ebd_class_private.quiz_results') IS NULL
 THEN RAISE EXCEPTION 'Reviewed 010C2 TEST baseline required';END IF;
END $$;
CREATE SCHEMA guild_challenge_private;
-- The hosted C1 command has a preexisting encoding difference only in three fixed participation labels. Both exact reviewed definitions are accepted; neither is replaced.
DO $baseline$ DECLARE f jsonb; p regprocedure;BEGIN
 FOR f IN SELECT value FROM jsonb_array_elements($expected$[{"signature":"guild_activity_private.actor_role(uuid,uuid)","hash":"c796be1d99cb8e0fd0f579709fc6a4fc","acl":["postgres=X/postgres"]},{"signature":"guild_activity_private.can_validate(uuid,uuid)","hash":"54ceed70f2931ef2350f0d3367b744aa","acl":["postgres=X/postgres"]},{"signature":"guild_activity_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb)","hash":"89cafab8e005c6c7922dd48afdb1d65e","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_admin_private.active_actor(uuid)","hash":"05ae51c71fa24e9bcd40a14eaa8451b9","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.exact_keys(jsonb,text[])","hash":"88baa8537542e67e7e11fb788c40cdc8","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.guild_role(uuid,uuid,boolean)","hash":"69f1231558149c36917b3f6937472acb","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.require_writes()","hash":"7b0491ee6ef8b6c22e69624c4dab3920","acl":["postgres=X/postgres"]}]$expected$::jsonb) LOOP
 p:=to_regprocedure(f->>'signature');
 IF p IS NULL OR NOT(md5(pg_get_functiondef(p))=f->>'hash' OR f->>'signature'='guild_activity_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb)' AND md5(pg_get_functiondef(p))='8108e871748f1383e5bc9c42c024f717') OR (SELECT to_jsonb(proacl) FROM pg_proc WHERE oid=p) IS DISTINCT FROM f->'acl' THEN RAISE EXCEPTION '010C2 baseline function or ACL mismatch: %',f->>'signature';END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='guild_activity_private' AND c.relkind='r' AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'Protected activity baseline required';END IF;
END $baseline$;
REVOKE ALL ON SCHEMA guild_challenge_private FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA guild_challenge_private TO authenticated;
CREATE TABLE guild_challenge_private.events(
 id uuid PRIMARY KEY,guild_id uuid NOT NULL REFERENCES public.guilds(id),meeting_id uuid REFERENCES public.guild_missions(id),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 2 AND 100),description text NOT NULL CHECK(length(description)<=1000),
 theme text NOT NULL CHECK(length(theme)<=100),reference text NOT NULL CHECK(length(reference)<=100),
 criteria text NOT NULL CHECK(length(btrim(criteria)) BETWEEN 1 AND 1000),
 mode text NOT NULL CHECK(mode IN('individual','cooperative','competitive')),
 status text NOT NULL CHECK(status IN('draft','published','running','closed','cancelled')),
 revision integer NOT NULL CHECK(revision>0),rule_version integer NOT NULL DEFAULT 1 CHECK(rule_version=1),
 starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 questions jsonb NOT NULL CHECK(jsonb_typeof(questions)='array' AND jsonb_array_length(questions)=7),
 manual_ids uuid[] NOT NULL DEFAULT '{}',config_hash text,roster_hash text,
 began_at timestamptz,closed_at timestamptz,final_result jsonb,
 created_by uuid NOT NULL REFERENCES public.travelers(id),created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX challenge_guild_page ON guild_challenge_private.events(guild_id,created_at DESC,id);
CREATE INDEX challenge_meeting ON guild_challenge_private.events(meeting_id) WHERE meeting_id IS NOT NULL;
CREATE TABLE guild_challenge_private.teams(
 id uuid PRIMARY KEY,event_id uuid NOT NULL REFERENCES guild_challenge_private.events(id),name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 80),
 position integer NOT NULL CHECK(position>0),active boolean NOT NULL DEFAULT true,UNIQUE(event_id,position),UNIQUE(event_id,id)
);
CREATE TABLE guild_challenge_private.roster(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES guild_challenge_private.events(id),
 owner_id uuid NOT NULL REFERENCES auth.users(id),avatar_id uuid NOT NULL REFERENCES public.travelers(id),
 team_id uuid,status text NOT NULL CHECK(status IN('invited','accepted','declined','withdrawn')),
 revision integer NOT NULL CHECK(revision>0),consented_at timestamptz,frozen boolean NOT NULL DEFAULT false,frozen_alias text,
 UNIQUE(event_id,owner_id),FOREIGN KEY(event_id,team_id) REFERENCES guild_challenge_private.teams(event_id,id)
);
CREATE INDEX challenge_roster_owner ON guild_challenge_private.roster(owner_id,event_id);
CREATE INDEX challenge_roster_team ON guild_challenge_private.roster(team_id) WHERE team_id IS NOT NULL;
CREATE TABLE guild_challenge_private.results(
 event_id uuid NOT NULL,owner_id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES public.travelers(id),
 request_id uuid NOT NULL UNIQUE,choices jsonb NOT NULL CHECK(jsonb_typeof(choices)='array' AND jsonb_array_length(choices)=7),
 score integer NOT NULL CHECK(score BETWEEN 0 AND 7),rule_version integer NOT NULL CHECK(rule_version=1),
 submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(event_id,owner_id),
 FOREIGN KEY(event_id,owner_id) REFERENCES guild_challenge_private.roster(event_id,owner_id)
);
CREATE TABLE guild_challenge_private.practice(
 request_id uuid PRIMARY KEY,event_id uuid NOT NULL,owner_id uuid NOT NULL,choices jsonb NOT NULL,
 score integer NOT NULL CHECK(score BETWEEN 0 AND 7),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(event_id,owner_id) REFERENCES guild_challenge_private.results(event_id,owner_id)
);
CREATE INDEX challenge_practice_owner ON guild_challenge_private.practice(event_id,owner_id,created_at DESC);
CREATE TABLE guild_challenge_private.commands(
 request_id uuid PRIMARY KEY,owner_id uuid NOT NULL,actor_id uuid NOT NULL,guild_id uuid NOT NULL,event_id uuid NOT NULL,
 fingerprint text NOT NULL,receipt jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE guild_challenge_private.audit(
 request_id uuid PRIMARY KEY,event_id uuid NOT NULL REFERENCES guild_challenge_private.events(id),actor_id uuid NOT NULL REFERENCES public.travelers(id),
 owner_id uuid NOT NULL,action text NOT NULL,revision integer NOT NULL,before_value jsonb,after_value jsonb,
 reason text NOT NULL CHECK(length(reason)<=300),created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX challenge_audit_event ON guild_challenge_private.audit(event_id,created_at DESC);
CREATE FUNCTION guild_challenge_private.immutable() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Official results and history are append-only' USING ERRCODE='42501';END $$;
CREATE TRIGGER challenge_audit_immutable BEFORE UPDATE OR DELETE ON guild_challenge_private.audit FOR EACH ROW EXECUTE FUNCTION guild_challenge_private.immutable();
CREATE TRIGGER challenge_result_immutable BEFORE UPDATE OR DELETE ON guild_challenge_private.results FOR EACH ROW EXECUTE FUNCTION guild_challenge_private.immutable();
CREATE FUNCTION guild_challenge_private.confirmed_event() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.status='closed' AND (NEW.final_result,NEW.questions,NEW.config_hash,NEW.roster_hash,NEW.closed_at,NEW.rule_version) IS DISTINCT FROM (OLD.final_result,OLD.questions,OLD.config_hash,OLD.roster_hash,OLD.closed_at,OLD.rule_version) THEN RAISE EXCEPTION 'Confirmed competitive result is immutable' USING ERRCODE='42501';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER challenge_confirmed_event BEFORE UPDATE ON guild_challenge_private.events FOR EACH ROW EXECUTE FUNCTION guild_challenge_private.confirmed_event();
CREATE FUNCTION guild_challenge_private.frozen_roster() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.frozen AND(TG_OP='DELETE' OR (NEW.event_id,NEW.owner_id,NEW.avatar_id,NEW.team_id,NEW.frozen,NEW.frozen_alias,NEW.consented_at) IS DISTINCT FROM (OLD.event_id,OLD.owner_id,OLD.avatar_id,OLD.team_id,OLD.frozen,OLD.frozen_alias,OLD.consented_at)
 OR NEW.status<>OLD.status AND NOT(OLD.status='accepted' AND NEW.status='withdrawn')) THEN RAISE EXCEPTION 'Roster is frozen' USING ERRCODE='42501';END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE TRIGGER challenge_roster_frozen BEFORE UPDATE OR DELETE ON guild_challenge_private.roster FOR EACH ROW EXECUTE FUNCTION guild_challenge_private.frozen_roster();
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['events','teams','roster','results','practice','commands','audit'] LOOP
 EXECUTE format('ALTER TABLE guild_challenge_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON TABLE guild_challenge_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;
CREATE FUNCTION guild_challenge_private.validate_questions(p_questions jsonb) RETURNS void
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE q jsonb;BEGIN
 IF jsonb_typeof(p_questions) IS DISTINCT FROM 'array' OR jsonb_array_length(p_questions)<>7 THEN RAISE EXCEPTION 'Exactly seven questions required' USING ERRCODE='22023';END IF;
 FOR q IN SELECT value FROM jsonb_array_elements(p_questions) LOOP
 PERFORM guild_admin_private.exact_keys(q,ARRAY['prompt','options','answerKey','reference','feedback','difficulty']);
 IF jsonb_typeof(q->'prompt') IS DISTINCT FROM 'string' OR length(btrim(q->>'prompt'))=0 OR length(q->>'prompt')>2000
 OR jsonb_typeof(q->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(q->'options')<>4
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(q->'options') v WHERE jsonb_typeof(v) IS DISTINCT FROM 'string' OR length(btrim(v#>>'{}'))=0 OR length(v#>>'{}')>300)
 OR(SELECT count(DISTINCT btrim(value#>>'{}')) FROM jsonb_array_elements(q->'options'))<>4
 OR coalesce(q->>'answerKey','') !~ '^[0-3]$' OR coalesce(q->>'difficulty','') NOT IN('easy','medium','hard')
 OR jsonb_typeof(q->'reference') IS DISTINCT FROM 'string' OR length(q->>'reference')>100
 OR jsonb_typeof(q->'feedback') IS DISTINCT FROM 'string' OR length(btrim(q->>'feedback'))=0 OR length(q->>'feedback')>1000
 THEN RAISE EXCEPTION 'Invalid question contract' USING ERRCODE='22023';END IF;
 END LOOP;
END $$;
CREATE FUNCTION guild_challenge_private.grade(p_questions jsonb,p_choices jsonb) RETURNS integer
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE score integer:=0;i integer;BEGIN
 IF jsonb_typeof(p_choices) IS DISTINCT FROM 'array' OR jsonb_array_length(p_choices)<>7 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_choices) c WHERE jsonb_typeof(c) IS DISTINCT FROM 'number' OR c::text !~ '^[0-3]$') THEN RAISE EXCEPTION 'Exactly seven valid choices required' USING ERRCODE='22023';END IF;
 FOR i IN 0..6 LOOP IF p_choices->>i=p_questions->i->>'answerKey' THEN score:=score+1;END IF;END LOOP;RETURN score;
END $$;
CREATE FUNCTION guild_challenge_private.configuration(p_event guild_challenge_private.events) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT md5(jsonb_build_array(p_event.guild_id,p_event.meeting_id,p_event.mode,p_event.starts_at,p_event.ends_at,p_event.questions,p_event.manual_ids,p_event.criteria,
 (SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name) ORDER BY position) FROM guild_challenge_private.teams t WHERE t.event_id=p_event.id AND t.active))::text)
$$;
CREATE FUNCTION guild_challenge_private.scores(p_event uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE e guild_challenge_private.events;output jsonb;cutoff timestamptz;BEGIN
 SELECT * INTO e FROM guild_challenge_private.events WHERE id=p_event;cutoff:=least(e.ends_at,coalesce(e.closed_at,clock_timestamp()));
 WITH persons AS(
 SELECT r.id,r.avatar_id,r.team_id,r.frozen_alias,q.score quiz_score,q.submitted_at,
 (SELECT count(*)::integer FROM unnest(e.manual_ids) activity WHERE EXISTS(SELECT 1 FROM public.guild_mission_progress gp JOIN public.guild_missions m ON m.id=gp.mission_id
 JOIN guild_activity_private.future_eligibility proof ON proof.mission_id=gp.mission_id AND proof.owner_id=r.owner_id AND proof.participation_revision=gp.community_revision AND proof.validated
 WHERE gp.mission_id=activity AND gp.participant_uid=r.owner_id AND m.guild_id=e.guild_id AND m.status<>'cancelled' AND gp.status='approved'
 AND gp.submitted_at>=e.began_at AND gp.submitted_at<=cutoff)) manual_points
 FROM guild_challenge_private.roster r LEFT JOIN guild_challenge_private.results q ON q.event_id=r.event_id AND q.owner_id=r.owner_id
 WHERE r.event_id=e.id AND r.frozen
 ), scored AS(SELECT *,CASE WHEN submitted_at IS NULL THEN 0 ELSE quiz_score+manual_points END points,
 submitted_at IS NOT NULL AND manual_points=cardinality(e.manual_ids) completed FROM persons),
 groups AS(SELECT CASE WHEN e.mode='individual' THEN id ELSE team_id END id,count(*)::integer eligible,sum(points)::integer total_points,bool_and(completed) completed FROM scored GROUP BY 1),
 ranked AS(SELECT *,rank() OVER(ORDER BY total_points::numeric/eligible DESC)::integer place FROM groups)
 SELECT jsonb_build_object('maxPerPlayer',7+cardinality(e.manual_ids),'persons',coalesce((SELECT jsonb_agg(jsonb_build_object('rosterId',id,'avatarId',avatar_id,'teamId',team_id,'quizScore',quiz_score,'manualPoints',manual_points,'points',points,'completed',completed) ORDER BY id) FROM scored),'[]'::jsonb),
 'teams',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'eligible',eligible,'totalPoints',total_points,'average',total_points::numeric/eligible,'percent',round(100.0*total_points/(eligible*(7+cardinality(e.manual_ids))),2),'place',place,'completed',completed) ORDER BY place,id) FROM ranked),'[]'::jsonb)) INTO output;
 RETURN output;
END $$;
CREATE FUNCTION guild_challenge_private.command(p_actor uuid,p_guild uuid,p_action text,p_event uuid,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e guild_challenge_private.events;old_event guild_challenge_private.events;r guild_challenge_private.roster;old_r guild_challenge_private.roster;
 prior guild_challenge_private.commands;official guild_challenge_private.results;role_value text;owner_key uuid;target_avatar uuid;target_owner uuid;
 team_key uuid;manual_ids uuid[];team_names jsonb;item jsonb;counter integer;team_count integer;accepted_count integer;max_team integer;min_team integer;
 new_state text;reason text;frame text;receipt jsonb;before_value jsonb;after_value jsonb;grade integer;revision integer;written boolean:=true;now_at timestamptz;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();role_value:=guild_activity_private.actor_role(p_actor,p_guild);owner_key:=auth.uid();now_at:=clock_timestamp();
 IF p_event IS NULL OR p_request IS NULL OR p_revision IS NULL OR p_revision<0 OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>262144
 OR p_action IS NULL OR p_action NOT IN('save','state','invite','enrol','team','answer','practice') THEN RAISE EXCEPTION 'Invalid command' USING ERRCODE='22023';END IF;
 SELECT * INTO e FROM guild_challenge_private.events WHERE id=p_event FOR UPDATE;old_event:=e;
 IF e.id IS NOT NULL AND e.guild_id<>p_guild THEN RAISE EXCEPTION 'Challenge unavailable' USING ERRCODE='42501';END IF;
 IF p_action IN('save','state','invite','team') AND role_value<>'leader' THEN RAISE EXCEPTION 'Current leader required' USING ERRCODE='42501';END IF;
 IF e.id IS NULL AND p_action<>'save' THEN RAISE EXCEPTION 'Challenge unavailable' USING ERRCODE='P0002';END IF;
 frame:=md5(jsonb_build_array(p_actor,p_guild,p_action,p_event,p_revision,p_data)::text);
 SELECT * INTO prior FROM guild_challenge_private.commands WHERE request_id=p_request;
 IF prior.request_id IS NOT NULL THEN
 IF(prior.owner_id,prior.actor_id,prior.guild_id,prior.event_id,prior.fingerprint) IS DISTINCT FROM(owner_key,p_actor,p_guild,p_event,frame) THEN RAISE EXCEPTION 'Command conflict' USING ERRCODE='PT409';END IF;
 RETURN prior.receipt||jsonb_build_object('replayed',true);END IF;
 IF p_action IN('save','state','invite','team') AND coalesce(e.revision,0)<>p_revision THEN RAISE EXCEPTION 'Challenge conflict' USING ERRCODE='PT409';END IF;
 reason:=coalesce(p_data->>'reason','');
 IF length(reason)>300 OR reason ~* '(bearer[[:space:]]+[a-z0-9._-]+|eyJ[a-z0-9_-]{15,}\.[a-z0-9_-]+|sb_secret_|sbp_|-----BEGIN[[:space:]].*PRIVATE KEY|password[[:space:]]*[:=]|senha[[:space:]]*[:=]|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})' THEN RAISE EXCEPTION 'Objective reason without credentials or contacts required' USING ERRCODE='22023';END IF;
 before_value:=CASE WHEN p_action IN('save','state') THEN to_jsonb(e) ELSE NULL END;
 IF p_action='save' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['title','description','theme','reference','criteria','mode','startsAt','endsAt','meetingId','manualIds','teams','questions']);
 IF e.id IS NOT NULL AND e.status<>'draft' THEN RAISE EXCEPTION 'Published rules are immutable; create a new draft version' USING ERRCODE='PT409';END IF;
 PERFORM guild_challenge_private.validate_questions(p_data->'questions');
 IF coalesce(p_data->>'mode','') NOT IN('individual','cooperative','competitive') OR jsonb_typeof(p_data->'teams') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_data->'teams')>100 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_data->'teams') t WHERE jsonb_typeof(t) IS DISTINCT FROM 'string' OR length(btrim(t#>>'{}')) NOT BETWEEN 1 AND 80)
 OR(SELECT count(DISTINCT btrim(t#>>'{}')) FROM jsonb_array_elements(p_data->'teams') t)<>jsonb_array_length(p_data->'teams')
 OR(p_data->>'mode'='individual' AND jsonb_array_length(p_data->'teams')<>0)
 OR(p_data->>'mode'='cooperative' AND jsonb_array_length(p_data->'teams')<1)
 OR(p_data->>'mode'='competitive' AND jsonb_array_length(p_data->'teams')<2)
 OR jsonb_typeof(p_data->'manualIds') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'manualIds')>20 THEN RAISE EXCEPTION 'Invalid team or objective contract' USING ERRCODE='22023';END IF;
 SELECT coalesce(array_agg(value::uuid),'{}') INTO manual_ids FROM jsonb_array_elements_text(p_data->'manualIds');
 IF cardinality(manual_ids)<>(SELECT count(DISTINCT x) FROM unnest(manual_ids)x) OR EXISTS(SELECT 1 FROM unnest(manual_ids)x WHERE NOT EXISTS(SELECT 1 FROM public.guild_missions m JOIN guild_activity_private.details d ON d.mission_id=m.id WHERE m.id=x AND m.guild_id=p_guild AND m.community_protocol=1 AND d.kind='activity' AND m.status='published')) THEN RAISE EXCEPTION 'Current own manual activities required' USING ERRCODE='22023';END IF;
 team_key:=nullif(p_data->>'meetingId','')::uuid;
 IF team_key IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.guild_missions m JOIN guild_activity_private.details d ON d.mission_id=m.id WHERE m.id=team_key AND m.guild_id=p_guild AND m.community_protocol=1 AND d.kind='meeting' AND m.status IN('draft','published')) THEN RAISE EXCEPTION 'Own meeting required' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM unnest(ARRAY['title','description','theme','reference','criteria','startsAt','endsAt','meetingId']) k WHERE jsonb_typeof(p_data->k) IS DISTINCT FROM 'string') THEN RAISE EXCEPTION 'Text fields required' USING ERRCODE='22023';END IF;
 IF e.id IS NULL THEN
 INSERT INTO guild_challenge_private.events(id,guild_id,meeting_id,title,description,theme,reference,criteria,mode,status,revision,starts_at,ends_at,questions,manual_ids,created_by)
 VALUES(p_event,p_guild,team_key,btrim(p_data->>'title'),p_data->>'description',p_data->>'theme',p_data->>'reference',p_data->>'criteria',p_data->>'mode','draft',1,(p_data->>'startsAt')::timestamptz,(p_data->>'endsAt')::timestamptz,p_data->'questions',manual_ids,p_actor);
 ELSE UPDATE guild_challenge_private.events SET meeting_id=team_key,title=btrim(p_data->>'title'),description=p_data->>'description',theme=p_data->>'theme',reference=p_data->>'reference',criteria=p_data->>'criteria',mode=p_data->>'mode',revision=events.revision+1,starts_at=(p_data->>'startsAt')::timestamptz,ends_at=(p_data->>'endsAt')::timestamptz,questions=p_data->'questions',manual_ids=command.manual_ids WHERE id=p_event;END IF;
 UPDATE guild_challenge_private.teams SET active=false WHERE event_id=p_event;counter:=0;
 FOR item IN SELECT value FROM jsonb_array_elements(p_data->'teams') LOOP counter:=counter+1;
 INSERT INTO guild_challenge_private.teams(id,event_id,name,position) VALUES(gen_random_uuid(),p_event,item#>>'{}',counter)
 ON CONFLICT(event_id,position) DO UPDATE SET name=excluded.name,active=true;
 END LOOP;
 ELSIF p_action='invite' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['avatarId']);
 IF e.status<>'published' THEN RAISE EXCEPTION 'Published enrolment required' USING ERRCODE='42501';END IF;
 target_avatar:=(p_data->>'avatarId')::uuid;
 SELECT t.user_id INTO target_owner FROM public.travelers t JOIN public.guild_members gm ON gm.traveler_id=t.id AND gm.guild_id=p_guild AND gm.status='active' JOIN auth.users u ON u.id=t.user_id WHERE t.id=target_avatar AND NOT coalesce(u.is_anonymous,false) AND u.email_confirmed_at IS NOT NULL;
 IF target_owner IS NULL THEN RAISE EXCEPTION 'Eligible member required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM guild_challenge_private.roster WHERE event_id=e.id AND owner_id=target_owner FOR UPDATE;before_value:=to_jsonb(r);
 IF r.status='accepted' THEN RAISE EXCEPTION 'Account already enrolled' USING ERRCODE='PT409';END IF;
 INSERT INTO guild_challenge_private.roster(event_id,owner_id,avatar_id,status,revision) VALUES(e.id,target_owner,target_avatar,'invited',1)
 ON CONFLICT(event_id,owner_id) DO UPDATE SET avatar_id=excluded.avatar_id,status='invited',revision=roster.revision+1,consented_at=NULL,team_id=NULL;
 ELSIF p_action='enrol' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['accept']);IF jsonb_typeof(p_data->'accept') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Explicit consent required' USING ERRCODE='22023';END IF;
 SELECT * INTO r FROM guild_challenge_private.roster WHERE event_id=e.id AND owner_id=owner_key FOR UPDATE;before_value:=to_jsonb(r);
 IF r.id IS NULL OR r.revision<>p_revision THEN RAISE EXCEPTION 'Enrolment conflict' USING ERRCODE='PT409';END IF;
 IF(p_data->>'accept')::boolean THEN
 IF e.status<>'published' OR r.status NOT IN('invited','declined','withdrawn') OR r.frozen THEN RAISE EXCEPTION 'Enrolment is closed' USING ERRCODE='42501';END IF;
 UPDATE guild_challenge_private.roster SET status='accepted',avatar_id=p_actor,consented_at=now_at,revision=roster.revision+1 WHERE id=r.id;
 ELSE
 IF r.frozen AND r.status<>'accepted' THEN RAISE EXCEPTION 'Enrolment is closed' USING ERRCODE='42501';END IF;
 UPDATE guild_challenge_private.roster SET status=CASE WHEN frozen OR status='accepted' THEN 'withdrawn' ELSE 'declined' END,revision=roster.revision+1 WHERE id=r.id;
 END IF;
 ELSIF p_action='team' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['rosterId','teamId']);
 IF e.status<>'published' OR e.mode='individual' THEN RAISE EXCEPTION 'Team assignment unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM guild_challenge_private.roster WHERE id=(p_data->>'rosterId')::uuid AND event_id=e.id AND status='accepted' FOR UPDATE;
 team_key:=(p_data->>'teamId')::uuid;
 IF r.id IS NULL OR NOT EXISTS(SELECT 1 FROM guild_challenge_private.teams WHERE id=team_key AND event_id=e.id AND active) THEN RAISE EXCEPTION 'Own accepted roster and team required' USING ERRCODE='42501';END IF;
 before_value:=to_jsonb(r);UPDATE guild_challenge_private.roster SET team_id=team_key,revision=roster.revision+1 WHERE id=r.id;
 ELSIF p_action='state' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['state','reason']);new_state:=p_data->>'state';
 IF NOT((e.status='draft' AND new_state IN('published','cancelled')) OR(e.status='published' AND new_state IN('running','cancelled')) OR(e.status='running' AND new_state IN('closed','cancelled'))) THEN RAISE EXCEPTION 'Invalid transition' USING ERRCODE='PT409';END IF;
 IF new_state='cancelled' AND length(btrim(reason))=0 THEN RAISE EXCEPTION 'Cancellation reason required' USING ERRCODE='22023';END IF;
 IF new_state IN('published','running') THEN
 PERFORM guild_challenge_private.validate_questions(e.questions);
 IF now_at>=e.ends_at OR e.meeting_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.guild_missions WHERE id=e.meeting_id AND guild_id=p_guild AND status='published')
 OR EXISTS(SELECT 1 FROM unnest(e.manual_ids) activity WHERE NOT EXISTS(SELECT 1 FROM public.guild_missions WHERE id=activity AND guild_id=p_guild AND status='published')) THEN RAISE EXCEPTION 'Own active sources and future end required' USING ERRCODE='42501';END IF;
 END IF;
 IF new_state='published' THEN UPDATE guild_challenge_private.events SET config_hash=guild_challenge_private.configuration(e) WHERE id=e.id;END IF;
 IF new_state='running' THEN
 IF now_at<e.starts_at OR e.config_hash IS DISTINCT FROM guild_challenge_private.configuration(e) THEN RAISE EXCEPTION 'Start or reviewed configuration unavailable' USING ERRCODE='55000';END IF;
 SELECT count(*) INTO accepted_count FROM guild_challenge_private.roster WHERE event_id=e.id AND status='accepted';
 IF accepted_count=0 OR EXISTS(SELECT 1 FROM guild_challenge_private.roster roster_row JOIN public.travelers t ON t.id=roster_row.avatar_id WHERE roster_row.event_id=e.id AND roster_row.status='accepted' AND(t.user_id<>roster_row.owner_id OR NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=roster_row.avatar_id AND status='active'))) THEN RAISE EXCEPTION 'Consented eligible roster required' USING ERRCODE='42501';END IF;
 IF e.mode<>'individual' THEN
 IF EXISTS(SELECT 1 FROM guild_challenge_private.roster WHERE event_id=e.id AND status='accepted' AND team_id IS NULL) THEN RAISE EXCEPTION 'Assign all accepted players to teams' USING ERRCODE='22023';END IF;
 SELECT min(n),max(n) INTO min_team,max_team FROM(SELECT count(roster_row.id)::integer n FROM guild_challenge_private.teams t LEFT JOIN guild_challenge_private.roster roster_row ON roster_row.team_id=t.id AND roster_row.event_id=e.id AND roster_row.status='accepted' WHERE t.event_id=e.id AND t.active GROUP BY t.id)s;
 IF min_team IS NULL OR min_team=0 OR max_team-min_team>1 THEN RAISE EXCEPTION 'Balanced nonempty teams required' USING ERRCODE='22023';END IF;
 END IF;
 UPDATE guild_challenge_private.roster roster_row SET frozen=true,frozen_alias=t.name FROM public.travelers t WHERE roster_row.event_id=e.id AND roster_row.status='accepted' AND t.id=roster_row.avatar_id;
 UPDATE guild_challenge_private.events SET began_at=now_at,roster_hash=(SELECT md5(jsonb_agg(jsonb_build_array(roster_row.id,roster_row.owner_id,roster_row.avatar_id,roster_row.team_id,roster_row.consented_at) ORDER BY roster_row.id)::text) FROM guild_challenge_private.roster roster_row WHERE roster_row.event_id=e.id AND roster_row.frozen) WHERE id=e.id;
 END IF;
 IF new_state='closed' THEN
 after_value:=guild_challenge_private.scores(e.id);
 IF now_at<e.ends_at AND EXISTS(SELECT 1 FROM jsonb_array_elements(after_value->'persons') person WHERE NOT(person->>'completed')::boolean) THEN RAISE EXCEPTION 'Wait for deadline or all required verifications' USING ERRCODE='42501';END IF;
 UPDATE guild_challenge_private.events SET closed_at=now_at WHERE id=e.id;
 UPDATE guild_challenge_private.events SET final_result=guild_challenge_private.scores(e.id) WHERE id=e.id;
 END IF;
 UPDATE guild_challenge_private.events SET status=new_state WHERE id=e.id;
 ELSIF p_action IN('answer','practice') THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['choices']);
 IF p_revision<>e.rule_version THEN RAISE EXCEPTION 'Quiz rule version conflict' USING ERRCODE='PT409';END IF;
 SELECT * INTO r FROM guild_challenge_private.roster WHERE event_id=e.id AND owner_id=owner_key FOR UPDATE;
 SELECT * INTO official FROM guild_challenge_private.results WHERE event_id=e.id AND owner_id=owner_key;
 IF r.id IS NULL OR NOT r.frozen OR e.config_hash IS DISTINCT FROM guild_challenge_private.configuration(e) THEN RAISE EXCEPTION 'Frozen eligible roster required' USING ERRCODE='42501';END IF;
 IF p_action='answer' AND official.event_id IS NOT NULL THEN
 IF official.choices IS DISTINCT FROM p_data->'choices' THEN RAISE EXCEPTION 'Official result already recorded' USING ERRCODE='PT409';END IF;written:=false;
 ELSE
 grade:=guild_challenge_private.grade(e.questions,p_data->'choices');
 IF p_action='answer' THEN
 IF e.status<>'running' OR r.status<>'accepted' OR now_at<e.starts_at OR now_at>e.ends_at THEN RAISE EXCEPTION 'Official submissions are closed' USING ERRCODE='42501';END IF;
 INSERT INTO guild_challenge_private.results(event_id,owner_id,actor_id,request_id,choices,score,rule_version) VALUES(e.id,owner_key,p_actor,p_request,p_data->'choices',grade,e.rule_version);
 ELSE
 IF e.status<>'closed' OR official.event_id IS NULL THEN RAISE EXCEPTION 'Learning attempts available after closing only' USING ERRCODE='42501';END IF;
 INSERT INTO guild_challenge_private.practice VALUES(p_request,e.id,owner_key,p_data->'choices',grade,now_at);
 END IF;
 END IF;
 after_value:=jsonb_build_object('recorded',true,'ruleVersion',e.rule_version,'learning',p_action='practice');

 END IF;
 IF written THEN
 IF p_action NOT IN('answer','practice') THEN UPDATE guild_challenge_private.events SET revision=CASE WHEN p_action='save' THEN events.revision ELSE events.revision+1 END WHERE id=p_event;END IF;
 SELECT * INTO e FROM guild_challenge_private.events WHERE id=p_event;revision:=e.revision;
 IF p_action IN('save','state') THEN after_value:=to_jsonb(e);END IF;
 IF p_action IN('invite','enrol','team') THEN after_value:=(SELECT to_jsonb(x) FROM guild_challenge_private.roster x WHERE x.event_id=e.id AND x.owner_id=CASE WHEN p_action='enrol' THEN owner_key ELSE coalesce(target_owner,r.owner_id) END);END IF;
 INSERT INTO guild_challenge_private.audit VALUES(p_request,e.id,p_actor,owner_key,p_action,revision,before_value,after_value,reason,now_at);
 INSERT INTO public.guild_activity_log(guild_id,actor_traveler_id,event_type,entity_type,entity_id,metadata) VALUES(p_guild,p_actor,'challenge_'||p_action,'guild_challenge',e.id,jsonb_build_object('revision',revision,'ruleVersion',e.rule_version,'before',old_event.status,'after',e.status,'reasonDigest',CASE WHEN reason<>'' THEN md5(reason) END));
 ELSE revision:=e.revision;END IF;
 receipt:=jsonb_build_object('id',p_event,'guildId',p_guild,'action',p_action,'revision',revision,'replayed',false,'recorded',p_action IN('answer','practice'),'economicIssued',false);
 INSERT INTO guild_challenge_private.commands VALUES(p_request,owner_key,p_actor,p_guild,p_event,frame,receipt,now_at);RETURN receipt;
END $$;
CREATE FUNCTION guild_challenge_private.workspace(p_actor uuid,p_guild uuid,p_event uuid,p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE role_value text;e guild_challenge_private.events;mine guild_challenge_private.roster;result guild_challenge_private.results;staff boolean;BEGIN
 role_value:=guild_activity_private.actor_role(p_actor,p_guild);staff:=role_value='leader';
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 IF p_event IS NOT NULL THEN
 SELECT * INTO e FROM guild_challenge_private.events WHERE id=p_event;
 IF e.id IS NULL OR e.guild_id<>p_guild OR NOT(staff OR e.status IN('published','running','closed') OR EXISTS(SELECT 1 FROM guild_challenge_private.roster WHERE event_id=e.id AND owner_id=auth.uid())) THEN RAISE EXCEPTION 'Challenge unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO mine FROM guild_challenge_private.roster WHERE event_id=e.id AND owner_id=auth.uid();
 SELECT * INTO result FROM guild_challenge_private.results WHERE event_id=e.id AND owner_id=auth.uid();
 END IF;
 RETURN jsonb_build_object('version',1,'guildId',p_guild,'leader',staff,'offset',p_offset,
 'events',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY created_at DESC,id) FROM(SELECT id,title,mode,status,revision,starts_at,ends_at,created_at FROM guild_challenge_private.events g WHERE g.guild_id=p_guild AND(staff OR g.status IN('published','running','closed') OR EXISTS(SELECT 1 FROM guild_challenge_private.roster r WHERE r.event_id=g.id AND r.owner_id=auth.uid())) ORDER BY created_at DESC,id LIMIT 20 OFFSET p_offset)x),'[]'::jsonb),
 'event',CASE WHEN e.id IS NULL THEN NULL ELSE jsonb_build_object('id',e.id,'title',e.title,'description',e.description,'theme',e.theme,'reference',e.reference,'criteria',e.criteria,'mode',e.mode,'status',e.status,'revision',e.revision,'ruleVersion',e.rule_version,'meetingId',e.meeting_id,'startsAt',e.starts_at,'endsAt',e.ends_at,'beganAt',e.began_at,'manualIds',e.manual_ids,
 'canAnswer',e.status='running' AND mine.frozen AND mine.status='accepted' AND result.event_id IS NULL AND clock_timestamp()>=e.starts_at AND clock_timestamp()<=e.ends_at,
 'canPractice',e.status='closed' AND result.event_id IS NOT NULL,'enrolment',mine.status,
 'progressReceived',(SELECT count(*) FROM guild_challenge_private.results q WHERE q.event_id=e.id),'eligibleCount',(SELECT count(*) FROM guild_challenge_private.roster r WHERE r.event_id=e.id AND r.frozen)) END,
 'questions',CASE WHEN staff AND e.status='draft' OR e.status IN('running','closed') THEN coalesce((SELECT jsonb_agg(CASE WHEN staff AND e.status='draft' OR e.status='closed' AND (staff OR result.event_id IS NOT NULL) THEN q ELSE q-'answerKey'-'feedback' END ORDER BY n) FROM jsonb_array_elements(e.questions) WITH ORDINALITY a(q,n)),'[]'::jsonb) ELSE '[]'::jsonb END,
 'teams',coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'position',t.position) ORDER BY t.position) FROM guild_challenge_private.teams t WHERE t.event_id=e.id AND t.active),'[]'::jsonb),
 'roster',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'avatarId',r.avatar_id,'alias',CASE WHEN EXISTS(SELECT 1 FROM public.guild_members gm WHERE gm.guild_id=e.guild_id AND gm.traveler_id=r.avatar_id AND gm.status='active') THEN coalesce(r.frozen_alias,t.name) ELSE 'Participante anterior' END,'teamId',r.team_id,'status',r.status,'revision',r.revision,'frozen',r.frozen,'own',r.owner_id=auth.uid()) ORDER BY r.id) FROM guild_challenge_private.roster r JOIN public.travelers t ON t.id=r.avatar_id WHERE r.event_id=e.id AND(staff OR r.owner_id=auth.uid() OR r.status='accepted' OR r.frozen)),'[]'::jsonb),
 'myResult',CASE WHEN result.event_id IS NULL THEN NULL ELSE jsonb_build_object('choices',result.choices,'score',CASE WHEN e.status='closed' THEN result.score ELSE NULL END,'submittedAt',result.submitted_at,'ruleVersion',result.rule_version,'practiceCount',(SELECT count(*) FROM guild_challenge_private.practice x WHERE x.event_id=e.id AND x.owner_id=auth.uid())) END,
 'latestPractice',CASE WHEN e.status='closed' THEN(SELECT jsonb_build_object('score',p.score,'choices',p.choices) FROM guild_challenge_private.practice p WHERE p.event_id=e.id AND p.owner_id=auth.uid() ORDER BY p.created_at DESC,p.request_id DESC LIMIT 1) ELSE NULL END,
 'board',CASE WHEN e.id IS NULL THEN NULL WHEN e.status='closed' THEN e.final_result ELSE NULL END,
 'members',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name)) FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id WHERE gm.guild_id=p_guild AND gm.status='active'),'[]'::jsonb) ELSE '[]'::jsonb END,
 'meetings',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'title',m.title)) FROM public.guild_missions m JOIN guild_activity_private.details d ON d.mission_id=m.id WHERE m.guild_id=p_guild AND m.community_protocol=1 AND d.kind='meeting' AND m.status IN('draft','published')),'[]'::jsonb) ELSE '[]'::jsonb END,
 'manualActivities',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'title',m.title)) FROM public.guild_missions m JOIN guild_activity_private.details d ON d.mission_id=m.id WHERE m.guild_id=p_guild AND m.community_protocol=1 AND d.kind='activity' AND m.status='published'),'[]'::jsonb) ELSE '[]'::jsonb END,
 'history',coalesce((SELECT jsonb_agg(jsonb_build_object('action',h.action,'revision',h.revision,'createdAt',h.created_at,'reason',CASE WHEN staff THEN h.reason ELSE '' END) ORDER BY h.created_at DESC) FROM(SELECT * FROM guild_challenge_private.audit a WHERE a.event_id=e.id ORDER BY a.created_at DESC LIMIT 40)h),'[]'::jsonb),'economicRewardsEnabled',false);
END $$;
CREATE FUNCTION guild_challenge_private.parent_state() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e guild_challenge_private.events;actor uuid;BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.community_protocol IS DISTINCT FROM 1 OR NOT EXISTS(SELECT 1 FROM guild_challenge_private.events WHERE meeting_id=NEW.id) THEN RETURN NEW;END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
 IF NEW.status='closed' AND EXISTS(SELECT 1 FROM guild_challenge_private.events WHERE meeting_id=NEW.id AND status NOT IN('closed','cancelled')) THEN RAISE EXCEPTION 'Close or cancel associated challenges first' USING ERRCODE='42501';END IF;
 IF NEW.status='cancelled' THEN
 SELECT id INTO actor FROM public.travelers WHERE user_id=auth.uid() AND is_active;
 IF guild_activity_private.actor_role(actor,NEW.guild_id)<>'leader' THEN RAISE EXCEPTION 'Current leader required' USING ERRCODE='42501';END IF;
 FOR e IN SELECT * FROM guild_challenge_private.events WHERE meeting_id=NEW.id AND guild_id=NEW.guild_id AND status<>'cancelled' FOR UPDATE LOOP
 UPDATE guild_challenge_private.events SET status='cancelled',revision=events.revision+1 WHERE id=e.id;
 INSERT INTO guild_challenge_private.audit(request_id,event_id,actor_id,owner_id,action,revision,before_value,after_value,reason)
 VALUES(gen_random_uuid(),e.id,actor,auth.uid(),'parent_cancel',e.revision+1,to_jsonb(e),jsonb_build_object('status','cancelled','meetingId',NEW.id),'Encontro associado cancelado');
 INSERT INTO public.guild_activity_log(guild_id,actor_traveler_id,event_type,entity_type,entity_id,metadata)
 VALUES(NEW.guild_id,actor,'challenge_parent_cancel','guild_challenge',e.id,jsonb_build_object('revision',e.revision+1,'meetingId',NEW.id));
 END LOOP;
 END IF;RETURN NEW;
END $$;
CREATE TRIGGER guild_challenges_parent_state BEFORE UPDATE OF status ON public.guild_missions FOR EACH ROW EXECUTE FUNCTION guild_challenge_private.parent_state();
CREATE FUNCTION public.guild_challenges_workspace(p_actor uuid,p_guild uuid,p_event uuid DEFAULT NULL,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$SELECT guild_challenge_private.workspace(p_actor,p_guild,p_event,p_offset)$$;
CREATE FUNCTION public.guild_challenges_command(p_actor uuid,p_guild uuid,p_action text,p_event uuid,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT guild_challenge_private.command(p_actor,p_guild,p_action,p_event,p_request,p_revision,p_data)$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA guild_challenge_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.guild_challenges_workspace(uuid,uuid,uuid,integer),public.guild_challenges_command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.guild_challenges_workspace(uuid,uuid,uuid,integer),public.guild_challenges_command(uuid,uuid,text,uuid,uuid,integer,jsonb),guild_challenge_private.workspace(uuid,uuid,uuid,integer),guild_challenge_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb) TO authenticated;

