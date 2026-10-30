-- 010B PRODUCTION: own guarded package. No bootstrap, data conversion, rewards or Auth/RLS weakening.
DO $prod_owner$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001'
 THEN RAISE EXCEPTION '010B requires reviewed production owner context'; END IF;
END $prod_owner$;
DO $prod_baseline$ DECLARE f jsonb; BEGIN
 FOR f IN SELECT value FROM jsonb_array_elements($manifest$[{"signature":"ebd_ops.command(uuid,text,uuid,integer,jsonb)","hash":"0f8f9a149fb216628855ffe0b3d396fe","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.command(uuid,uuid,text,uuid,integer,jsonb)","hash":"03780d57b32a22733dd0967807f51503","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.eligible(uuid,uuid)","hash":"c806a1810a3a3ea01cc859fdb7e89073","acl":["postgres=X/postgres"]},{"signature":"ebd_ops.manager(uuid,uuid,text)","hash":"f187285193d8dd606fad7167e88bb82f","acl":["postgres=X/postgres"]},{"signature":"ebd_ops.visible(uuid)","hash":"c1b7afd2fc8d4ceedb61e498a1edfcc3","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.workspace(uuid,integer)","hash":"caa883b030ba7047f8fae43beaff9c80","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"ebd_ops.workspace(uuid,uuid,integer)","hash":"b4c8464bc7260145f8e0e36516dd7205","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_admin_private.active_actor(uuid)","hash":"05ae51c71fa24e9bcd40a14eaa8451b9","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb)","hash":"6a08e2bf098136540ee14de433ab3d8c","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_admin_private.guild_role(uuid,uuid,boolean)","hash":"69f1231558149c36917b3f6937472acb","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.leader_not_revoked(uuid)","hash":"9884a68d250d3cc744fd1b8fd2ef0891","acl":["postgres=X/postgres"]},{"signature":"guild_admin_private.require_writes()","hash":"7b0491ee6ef8b6c22e69624c4dab3920","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.create_invite(uuid,uuid)","hash":"d7988482b4ba947adf76defa90244781","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.create_invite(uuid)","hash":"75b4f6920e3eb1633877f7e18dfdfc08","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.leader_guild(uuid,uuid)","hash":"2b92affaf9330030152d7d72edcbb4d8","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.leader_guild(uuid)","hash":"664c2817e17d7f81a150666729aa8fd0","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.list_invites(uuid,uuid)","hash":"4c9a2f5b76392583d8394bf9dae0058f","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.list_invites(uuid)","hash":"a412f0c912093d68943393220c774c62","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.preview_invite(text)","hash":"ffdbc4b94ea8b16f17831143cdd76d0d","acl":["postgres=X/postgres","anon=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.request_invite(text,uuid)","hash":"9d05a55e759c336b0e6c66f9727cd8dd","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.require_account()","hash":"cfde5459971dd81d962919b22c42f546","acl":["postgres=X/postgres"]},{"signature":"guild_invite_private.resolve_invite(text)","hash":"7760d6621bb65994cc973416da70d523","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.revoke_invite(uuid,uuid,uuid)","hash":"9a48cdf57bb0d03171b445baf0d7652a","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.revoke_invite(uuid,uuid)","hash":"506b418be831941b3b7847d7a662940e","acl":["postgres=X/postgres","authenticated=X/postgres"]},{"signature":"guild_invite_private.valid_invite(text)","hash":"5df49c92576e0c30c5dfc08ee4c10466","acl":["postgres=X/postgres"]}]$manifest$::jsonb) LOOP
 IF to_regprocedure(f->>'signature') IS NULL OR EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure(f->>'signature') AND
 (md5(pg_get_functiondef(p.oid))<>f->>'hash' OR to_jsonb(p.proacl) IS DISTINCT FROM f->'acl' OR pg_get_userbyid(p.proowner)<>'postgres'))
 THEN RAISE EXCEPTION '010B production function or ACL drift: %',f->>'signature'; END IF;
 END LOOP;
END $prod_baseline$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $guard$ BEGIN
 IF md5(pg_get_functiondef('guild_admin_private.active_actor(uuid)'::regprocedure)) IS DISTINCT FROM '05ae51c71fa24e9bcd40a14eaa8451b9' THEN RAISE EXCEPTION '010B reviewed authority mismatch'; END IF;
 IF md5(pg_get_functiondef('guild_admin_private.guild_command(uuid,uuid,text,uuid,uuid,jsonb)'::regprocedure)) IS DISTINCT FROM '6a08e2bf098136540ee14de433ab3d8c' THEN RAISE EXCEPTION '010B reviewed authority mismatch'; END IF;
 IF md5(pg_get_functiondef('guild_admin_private.guild_role(uuid,uuid,boolean)'::regprocedure)) IS DISTINCT FROM '69f1231558149c36917b3f6937472acb' THEN RAISE EXCEPTION '010B reviewed authority mismatch'; END IF;
 IF md5(pg_get_functiondef('guild_admin_private.require_writes()'::regprocedure)) IS DISTINCT FROM '7b0491ee6ef8b6c22e69624c4dab3920' THEN RAISE EXCEPTION '010B reviewed authority mismatch'; END IF;
 IF public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION '010B production scope required'; END IF;
 IF to_regclass('guild_admin_private.multiguild_control') IS NULL OR to_regnamespace('ebd_class_private') IS NOT NULL
 THEN RAISE EXCEPTION '010B class baseline unavailable or already applied'; END IF;
END $guard$;

CREATE SCHEMA ebd_class_private;
REVOKE ALL ON SCHEMA ebd_class_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE ebd_class_private.classes(
 id uuid PRIMARY KEY, guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 2 AND 80), description text NOT NULL DEFAULT '' CHECK(length(description)<=1000),
 status text NOT NULL DEFAULT 'active' CHECK(status IN('active','paused','archived')),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), created_by uuid NOT NULL REFERENCES public.travelers(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(id,guild_id)
);
CREATE INDEX classes_guild_idx ON ebd_class_private.classes(guild_id,status,id);
CREATE TABLE ebd_class_private.members(
 class_id uuid NOT NULL REFERENCES ebd_class_private.classes(id) ON DELETE RESTRICT,
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
 status text NOT NULL CHECK(status IN('active','left','removed')),
 revision integer NOT NULL CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(class_id,traveler_id)
);
CREATE INDEX class_members_traveler_idx ON ebd_class_private.members(traveler_id,class_id) WHERE status='active';
CREATE TABLE ebd_class_private.teachers(
 class_id uuid NOT NULL REFERENCES ebd_class_private.classes(id) ON DELETE RESTRICT,
 traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
 active boolean NOT NULL, can_publish boolean NOT NULL, can_attend boolean NOT NULL,
 revision integer NOT NULL CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(class_id,traveler_id)
);
CREATE INDEX class_teachers_traveler_idx ON ebd_class_private.teachers(traveler_id,class_id) WHERE active;
CREATE TABLE ebd_class_private.history(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 guild_id uuid NOT NULL REFERENCES public.guilds(id), class_id uuid NOT NULL REFERENCES ebd_class_private.classes(id),
 actor_id uuid NOT NULL REFERENCES public.travelers(id), action text NOT NULL,
 target_id uuid NOT NULL, before_value jsonb, after_value jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX class_history_scope_idx ON ebd_class_private.history(guild_id,class_id,id DESC);
CREATE TABLE ebd_class_private.commands(
 user_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL,
 actor_id uuid NOT NULL REFERENCES public.travelers(id), guild_id uuid NOT NULL REFERENCES public.guilds(id),
 signature text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(user_id,request_id)
);
DO $rls$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['classes','members','teachers','history','commands'] LOOP
 EXECUTE format('ALTER TABLE ebd_class_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON ebd_class_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $rls$;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ebd_class_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION ebd_class_private.role(p_actor uuid,p_guild uuid,p_class uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r text; BEGIN
 r:=guild_admin_private.guild_role(p_actor,p_guild);
 IF NOT EXISTS(SELECT 1 FROM ebd_class_private.classes WHERE id=p_class AND guild_id=p_guild)
 THEN RAISE EXCEPTION 'Class unavailable' USING ERRCODE='P0002'; END IF;
 IF r='leader' THEN RETURN 'leader'; END IF;
 IF EXISTS(SELECT 1 FROM ebd_class_private.teachers WHERE class_id=p_class AND traveler_id=p_actor AND active) THEN RETURN 'teacher'; END IF;
 IF EXISTS(SELECT 1 FROM ebd_class_private.members WHERE class_id=p_class AND traveler_id=p_actor AND status='active') THEN RETURN 'student'; END IF;
 RAISE EXCEPTION 'Class permission required' USING ERRCODE='42501';
END $$;

CREATE FUNCTION ebd_class_private.command(p_actor uuid,p_guild uuid,p_class uuid,p_action text,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE owner_id uuid; role_value text; signature_value text; previous ebd_class_private.commands; c ebd_class_private.classes;
 target uuid; m ebd_class_private.members; t ebd_class_private.teachers; before_value jsonb; response jsonb; next_revision integer;
BEGIN
 -- Same serialization as 010A grant/revocation/member commands. Recheck permissions after waiting.
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);
 PERFORM guild_admin_private.require_writes();
 owner_id:=guild_admin_private.active_actor(p_actor);
 role_value:=guild_admin_private.guild_role(p_actor,p_guild);
 IF p_class IS NULL OR p_request IS NULL OR p_revision IS NULL OR p_revision<0 OR p_action IS NULL
 OR p_action NOT IN('save','state','teacher','member','leave') OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>4096
 THEN RAISE EXCEPTION 'Invalid class command' USING ERRCODE='22023'; END IF;
 IF p_action<>'leave' AND role_value<>'leader' THEN RAISE EXCEPTION 'Guild leadership required' USING ERRCODE='42501'; END IF;
 IF p_action='leave' THEN PERFORM ebd_class_private.role(p_actor,p_guild,p_class); END IF;
 signature_value:=encode(extensions.digest(jsonb_build_object('actor',p_actor,'guild',p_guild,'class',p_class,'action',p_action,'revision',p_revision,'data',p_data)::text,'sha256'),'hex');
 SELECT * INTO previous FROM ebd_class_private.commands WHERE user_id=owner_id AND request_id=p_request;
 IF FOUND THEN
 IF previous.signature<>signature_value THEN RAISE EXCEPTION 'Request payload conflict' USING ERRCODE='22023'; END IF;
 RETURN previous.result||jsonb_build_object('replayed',true);
 END IF;
 SELECT * INTO c FROM ebd_class_private.classes WHERE id=p_class FOR UPDATE;
 IF c.id IS NOT NULL AND c.guild_id<>p_guild THEN RAISE EXCEPTION 'Class permission required' USING ERRCODE='42501'; END IF;
 IF p_action='save' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['name','description']);
 IF jsonb_typeof(p_data->'name') IS DISTINCT FROM 'string' OR length(btrim(p_data->>'name')) NOT BETWEEN 2 AND 80
 OR jsonb_typeof(p_data->'description') IS DISTINCT FROM 'string' OR length(p_data->>'description')>1000
 THEN RAISE EXCEPTION 'Invalid class details' USING ERRCODE='22023'; END IF;
 IF coalesce(c.revision,0)<>p_revision THEN RAISE EXCEPTION 'Class conflict' USING ERRCODE='PT409'; END IF;
 before_value:=CASE WHEN c.id IS NULL THEN NULL ELSE to_jsonb(c) END;
 INSERT INTO ebd_class_private.classes(id,guild_id,name,description,created_by) VALUES(p_class,p_guild,btrim(p_data->>'name'),p_data->>'description',p_actor)
 ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,revision=classes.revision+1,updated_at=clock_timestamp()
 RETURNING revision INTO next_revision;
 target:=p_class;
 ELSIF c.id IS NULL THEN RAISE EXCEPTION 'Class unavailable' USING ERRCODE='P0002';
 ELSIF p_action='state' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['status']);
 IF p_data->>'status' IS NULL OR p_data->>'status' NOT IN('active','paused','archived') THEN RAISE EXCEPTION 'Invalid class state' USING ERRCODE='22023'; END IF;
 IF c.revision<>p_revision THEN RAISE EXCEPTION 'Class conflict' USING ERRCODE='PT409'; END IF;
 before_value:=to_jsonb(c);target:=p_class;
 UPDATE ebd_class_private.classes SET status=p_data->>'status',revision=revision+1,updated_at=clock_timestamp() WHERE id=p_class RETURNING revision INTO next_revision;
 ELSE
 IF p_action='leave' THEN
 PERFORM guild_admin_private.exact_keys(p_data,'{}'::text[]);target:=p_actor;
 ELSE
 target:=(p_data->>'travelerId')::uuid;
 END IF;
 IF p_action='teacher' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['travelerId','active','publish','attend']);
 IF jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'publish') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'attend') IS DISTINCT FROM 'boolean'
 THEN RAISE EXCEPTION 'Invalid teacher permission' USING ERRCODE='22023'; END IF;
 SELECT * INTO t FROM ebd_class_private.teachers WHERE class_id=p_class AND traveler_id=target;
 IF coalesce(t.revision,0)<>p_revision THEN RAISE EXCEPTION 'Teacher conflict' USING ERRCODE='PT409'; END IF;
 IF (p_data->>'active')::boolean AND NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active')
 THEN RAISE EXCEPTION 'Active Guild member required' USING ERRCODE='42501'; END IF;
 before_value:=CASE WHEN t.class_id IS NULL THEN NULL ELSE to_jsonb(t) END;next_revision:=p_revision+1;
 INSERT INTO ebd_class_private.teachers VALUES(p_class,target,(p_data->>'active')::boolean,(p_data->>'publish')::boolean,(p_data->>'attend')::boolean,next_revision,clock_timestamp())
 ON CONFLICT(class_id,traveler_id) DO UPDATE SET active=excluded.active,can_publish=excluded.can_publish,can_attend=excluded.can_attend,revision=excluded.revision,updated_at=excluded.updated_at;
 ELSE
 IF p_action='member' THEN PERFORM guild_admin_private.exact_keys(p_data,ARRAY['travelerId','active']);
 IF jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid membership' USING ERRCODE='22023'; END IF; END IF;
 SELECT * INTO m FROM ebd_class_private.members WHERE class_id=p_class AND traveler_id=target;
 IF coalesce(m.revision,0)<>p_revision THEN RAISE EXCEPTION 'Enrollment conflict' USING ERRCODE='PT409'; END IF;
 IF p_action='leave' AND (m.class_id IS NULL OR m.status<>'active') THEN RAISE EXCEPTION 'Active enrollment required' USING ERRCODE='42501'; END IF;
 IF p_action='member' AND (p_data->>'active')::boolean AND NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active')
 THEN RAISE EXCEPTION 'Active Guild member required' USING ERRCODE='42501'; END IF;
 before_value:=CASE WHEN m.class_id IS NULL THEN NULL ELSE to_jsonb(m) END;next_revision:=p_revision+1;
 INSERT INTO ebd_class_private.members VALUES(p_class,target,CASE WHEN p_action='leave' THEN 'left' WHEN (p_data->>'active')::boolean THEN 'active' ELSE 'removed' END,next_revision,clock_timestamp())
 ON CONFLICT(class_id,traveler_id) DO UPDATE SET status=excluded.status,revision=excluded.revision,updated_at=excluded.updated_at;
 END IF;
 END IF;
 response:=jsonb_build_object('id',p_class,'revision',next_revision);
 INSERT INTO ebd_class_private.history(guild_id,class_id,actor_id,action,target_id,before_value,after_value)
 VALUES(p_guild,p_class,p_actor,p_action,target,before_value,
 CASE WHEN p_action IN('save','state') THEN (SELECT to_jsonb(x) FROM ebd_class_private.classes x WHERE id=p_class)
 WHEN p_action='teacher' THEN (SELECT to_jsonb(x) FROM ebd_class_private.teachers x WHERE class_id=p_class AND traveler_id=target)
 ELSE (SELECT to_jsonb(x) FROM ebd_class_private.members x WHERE class_id=p_class AND traveler_id=target) END);
 INSERT INTO ebd_class_private.commands VALUES(owner_id,p_request,p_actor,p_guild,signature_value,response,clock_timestamp());
 RETURN response||jsonb_build_object('replayed',false);
END $$;

CREATE FUNCTION ebd_class_private.workspace(p_actor uuid,p_guild uuid,p_class uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r text; cr text; result jsonb; BEGIN
 r:=guild_admin_private.guild_role(p_actor,p_guild);
 IF p_class IS NOT NULL THEN cr:=ebd_class_private.role(p_actor,p_guild,p_class); END IF;
 result:=jsonb_build_object('version',1,'guildId',p_guild,'classId',p_class,'leader',r='leader',
 'classes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'description',c.description,'status',c.status,'revision',c.revision,
 'role',CASE WHEN r='leader' THEN 'leader' WHEN EXISTS(SELECT 1 FROM ebd_class_private.teachers t WHERE t.class_id=c.id AND t.traveler_id=p_actor AND t.active) THEN 'teacher' ELSE 'student' END) ORDER BY c.created_at,c.id)
 FROM ebd_class_private.classes c WHERE c.guild_id=p_guild AND (r='leader'
 OR EXISTS(SELECT 1 FROM ebd_class_private.teachers t WHERE t.class_id=c.id AND t.traveler_id=p_actor AND t.active)
 OR EXISTS(SELECT 1 FROM ebd_class_private.members m WHERE m.class_id=c.id AND m.traveler_id=p_actor AND m.status='active'))),'[]'::jsonb),
 'members',CASE WHEN cr='student' THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.traveler_id,'name',t.name,'status',m.status,'revision',m.revision)) FROM ebd_class_private.members m JOIN public.travelers t ON t.id=m.traveler_id WHERE m.class_id=p_class AND m.traveler_id=p_actor),'[]'::jsonb) ELSE '[]'::jsonb END,'teachers','[]'::jsonb,'history','[]'::jsonb);
 IF cr IN('leader','teacher') THEN
 result:=result||jsonb_build_object('members',coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.traveler_id,'name',t.name,'status',m.status,'revision',m.revision) ORDER BY t.name,m.traveler_id)
 FROM ebd_class_private.members m JOIN public.travelers t ON t.id=m.traveler_id JOIN public.guild_members gm ON gm.traveler_id=m.traveler_id AND gm.guild_id=p_guild AND gm.status='active'
 WHERE m.class_id=p_class),'[]'::jsonb),
 'teachers',coalesce((SELECT jsonb_agg(to_jsonb(t)-'class_id'-'updated_at') FROM ebd_class_private.teachers t WHERE class_id=p_class AND (r='leader' OR traveler_id=p_actor)),'[]'::jsonb),
 'history',coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM (SELECT id,action,created_at FROM ebd_class_private.history WHERE class_id=p_class ORDER BY id DESC LIMIT 100) h),'[]'::jsonb));
 END IF;
 RETURN result;
END $$;
CREATE FUNCTION public.ebd_classes_workspace(p_actor uuid,p_guild uuid,p_class uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_class_private.workspace(p_actor,p_guild,p_class) $$;
CREATE FUNCTION public.ebd_classes_command(p_actor uuid,p_guild uuid,p_class uuid,p_action text,p_request uuid,p_revision integer,p_data jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ebd_class_private.command(p_actor,p_guild,p_class,p_action,p_request,p_revision,p_data) $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ebd_class_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.ebd_classes_workspace(uuid,uuid,uuid),public.ebd_classes_command(uuid,uuid,uuid,text,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA ebd_class_private TO authenticated;
GRANT EXECUTE ON FUNCTION ebd_class_private.workspace(uuid,uuid,uuid),ebd_class_private.command(uuid,uuid,uuid,text,uuid,integer,jsonb),public.ebd_classes_workspace(uuid,uuid,uuid),public.ebd_classes_command(uuid,uuid,uuid,text,uuid,integer,jsonb) TO authenticated;

-- Leaving/removal from one Guild must not revive class privileges upon reentry.
CREATE FUNCTION ebd_class_private.membership_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; x record; BEGIN
 IF OLD.status='active' AND NEW.status<>'active' THEN
 SELECT id INTO actor FROM public.travelers WHERE user_id=auth.uid() AND is_active;
 IF actor IS NULL THEN
 IF EXISTS(SELECT 1 FROM ebd_class_private.teachers t JOIN ebd_class_private.classes c ON c.id=t.class_id WHERE c.guild_id=NEW.guild_id AND t.traveler_id=NEW.traveler_id AND t.active)
 OR EXISTS(SELECT 1 FROM ebd_class_private.members m JOIN ebd_class_private.classes c ON c.id=m.class_id WHERE c.guild_id=NEW.guild_id AND m.traveler_id=NEW.traveler_id AND m.status='active')
 THEN RAISE EXCEPTION 'Authenticated actor required for class membership audit' USING ERRCODE='42501'; ELSE RETURN NEW; END IF;
 END IF;
 FOR x IN SELECT t.*,c.guild_id FROM ebd_class_private.teachers t JOIN ebd_class_private.classes c ON c.id=t.class_id
 WHERE c.guild_id=NEW.guild_id AND t.traveler_id=NEW.traveler_id AND t.active LOOP
 UPDATE ebd_class_private.teachers SET active=false,revision=revision+1,updated_at=clock_timestamp() WHERE class_id=x.class_id AND traveler_id=x.traveler_id;
 INSERT INTO ebd_class_private.history(guild_id,class_id,actor_id,action,target_id,before_value,after_value)
 VALUES(NEW.guild_id,x.class_id,actor,'guild_teacher_removed',NEW.traveler_id,to_jsonb(x),jsonb_build_object('active',false,'revision',x.revision+1));
 END LOOP;
 FOR x IN SELECT m.*,c.guild_id FROM ebd_class_private.members m JOIN ebd_class_private.classes c ON c.id=m.class_id
 WHERE c.guild_id=NEW.guild_id AND m.traveler_id=NEW.traveler_id AND m.status='active' LOOP
 UPDATE ebd_class_private.members SET status=CASE WHEN NEW.status='left' THEN 'left' ELSE 'removed' END,revision=revision+1,updated_at=clock_timestamp() WHERE class_id=x.class_id AND traveler_id=x.traveler_id;
 INSERT INTO ebd_class_private.history(guild_id,class_id,actor_id,action,target_id,before_value,after_value)
 VALUES(NEW.guild_id,x.class_id,actor,'guild_member_removed',NEW.traveler_id,to_jsonb(x),jsonb_build_object('status',NEW.status,'revision',x.revision+1));
 END LOOP;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION ebd_class_private.membership_changed() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER ebd_class_membership_changed AFTER UPDATE OF status ON public.guild_members FOR EACH ROW EXECUTE FUNCTION ebd_class_private.membership_changed();
