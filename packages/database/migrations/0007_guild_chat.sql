-- TASK-0071: generated with installed Drizzle; custom RPC/grants/publication appended.
-- Supabase CLI unavailable. Requires 0000/0001; no existing data is changed.
CREATE SCHEMA guild_chat_private;
REVOKE ALL ON SCHEMA guild_chat_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA guild_chat_private TO authenticated;
CREATE FUNCTION guild_chat_private.can_access(p_guild_id uuid, p_moderate boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id
    JOIN public.guilds g ON g.id=gm.guild_id JOIN auth.users u ON u.id=t.user_id
    WHERE gm.guild_id=p_guild_id AND gm.status='active' AND g.status='active'
      AND u.id=auth.uid() AND NOT coalesce(u.is_anonymous,false)
      AND (NOT p_moderate OR gm.role IN ('leader','co_leader','moderator'))
  )
$$;
CREATE TABLE "guild_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence" bigint GENERATED ALWAYS AS IDENTITY (sequence name "guild_chat_messages_sequence_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"guild_id" uuid NOT NULL,
	"author_traveler_id" uuid,
	"client_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"author_body_type" text NOT NULL,
	"author_skin_tone" text NOT NULL,
	"author_hair_style" text NOT NULL,
	"author_outfit" text NOT NULL,
	"body" text,
	"is_announcement" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"removed_at" timestamp with time zone,
	CONSTRAINT "guild_chat_messages_sequence_unique" UNIQUE("sequence"),
	CONSTRAINT "guild_chat_messages_author_traveler_id_client_id_key" UNIQUE("author_traveler_id","client_id"),
	CONSTRAINT "guild_chat_messages_sequence_check" CHECK ("guild_chat_messages"."sequence" <= 9007199254740991),
	CONSTRAINT "guild_chat_messages_author_name_check" CHECK (char_length("guild_chat_messages"."author_name") between 2 and 24),
	CONSTRAINT "guild_chat_messages_author_body_type_check" CHECK ("guild_chat_messages"."author_body_type" in ('male','female')),
	CONSTRAINT "guild_chat_messages_author_skin_tone_check" CHECK ("guild_chat_messages"."author_skin_tone" in ('claro','medio','escuro')),
	CONSTRAINT "guild_chat_messages_author_hair_style_check" CHECK ("guild_chat_messages"."author_hair_style" in ('curto','longo','cacheado')),
	CONSTRAINT "guild_chat_messages_author_outfit_check" CHECK ("guild_chat_messages"."author_outfit" in ('musgo','ocre','azul')),
	CONSTRAINT "guild_chat_messages_body_check" CHECK (("guild_chat_messages"."removed_at" is null and "guild_chat_messages"."body" is not null and char_length(btrim("guild_chat_messages"."body")) between 1 and 1000 and octet_length("guild_chat_messages"."body") <= 4000) or ("guild_chat_messages"."removed_at" is not null and "guild_chat_messages"."body" is null))
);
--> statement-breakpoint
ALTER TABLE "guild_chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_chat_moderation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"actor_traveler_id" uuid,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT "guild_chat_moderation_log_action_check" CHECK ("guild_chat_moderation_log"."action" in ('remove','dismiss_reports')),
	CONSTRAINT "guild_chat_moderation_log_reason_check" CHECK (char_length(btrim("guild_chat_moderation_log"."reason")) between 3 and 200)
);
--> statement-breakpoint
ALTER TABLE "guild_chat_moderation_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_chat_private"."rate_limits" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"last_at" timestamp with time zone,
	"window_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_user_id_kind_pk" PRIMARY KEY("user_id","kind"),
	CONSTRAINT "rate_limits_kind_check" CHECK ("guild_chat_private"."rate_limits"."kind" in ('send','report'))
);
--> statement-breakpoint
ALTER TABLE "guild_chat_private"."rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_chat_reads" (
	"guild_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_sequence" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "guild_chat_reads_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id"),
	CONSTRAINT "guild_chat_reads_last_read_sequence_check" CHECK ("guild_chat_reads"."last_read_sequence" >= 0)
);
--> statement-breakpoint
ALTER TABLE "guild_chat_reads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_chat_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"reporter_traveler_id" uuid,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT "guild_chat_reports_message_id_reporter_traveler_id_key" UNIQUE("message_id","reporter_traveler_id"),
	CONSTRAINT "guild_chat_reports_reason_check" CHECK ("guild_chat_reports"."reason" in ('bullying','personal_data','sexual_content','violence','other')),
	CONSTRAINT "guild_chat_reports_status_check" CHECK ("guild_chat_reports"."status" in ('pending','removed','dismissed'))
);
--> statement-breakpoint
ALTER TABLE "guild_chat_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "guild_chat_messages" ADD CONSTRAINT "guild_chat_messages_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_messages" ADD CONSTRAINT "guild_chat_messages_author_traveler_id_travelers_id_fk" FOREIGN KEY ("author_traveler_id") REFERENCES "public"."travelers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_moderation_log" ADD CONSTRAINT "guild_chat_moderation_log_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_moderation_log" ADD CONSTRAINT "guild_chat_moderation_log_message_id_guild_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."guild_chat_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_moderation_log" ADD CONSTRAINT "guild_chat_moderation_log_actor_traveler_id_travelers_id_fk" FOREIGN KEY ("actor_traveler_id") REFERENCES "public"."travelers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_private"."rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_reads" ADD CONSTRAINT "guild_chat_reads_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_reads" ADD CONSTRAINT "guild_chat_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_reports" ADD CONSTRAINT "guild_chat_reports_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_reports" ADD CONSTRAINT "guild_chat_reports_message_id_guild_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."guild_chat_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_chat_reports" ADD CONSTRAINT "guild_chat_reports_reporter_traveler_id_travelers_id_fk" FOREIGN KEY ("reporter_traveler_id") REFERENCES "public"."travelers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guild_chat_messages_page_idx" ON "guild_chat_messages" USING btree ("guild_id","sequence" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "guild_chat_messages_author_idx" ON "guild_chat_messages" USING btree ("author_traveler_id");--> statement-breakpoint
CREATE INDEX "guild_chat_moderation_log_guild_idx" ON "guild_chat_moderation_log" USING btree ("guild_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "guild_chat_moderation_log_message_idx" ON "guild_chat_moderation_log" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "guild_chat_moderation_log_actor_idx" ON "guild_chat_moderation_log" USING btree ("actor_traveler_id");--> statement-breakpoint
CREATE INDEX "guild_chat_reports_queue_idx" ON "guild_chat_reports" USING btree ("guild_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "guild_chat_reports_reporter_idx" ON "guild_chat_reports" USING btree ("reporter_traveler_id");--> statement-breakpoint
CREATE POLICY "guild_chat_messages_read" ON "guild_chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (guild_chat_private.can_access("guild_chat_messages"."guild_id"));--> statement-breakpoint
CREATE POLICY "guild_chat_log_moderators" ON "guild_chat_moderation_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING (guild_chat_private.can_access("guild_chat_moderation_log"."guild_id",true));--> statement-breakpoint
CREATE POLICY "guild_chat_reads_own" ON "guild_chat_reads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("guild_chat_reads"."user_id"=(select (select auth.uid())) and guild_chat_private.can_access("guild_chat_reads"."guild_id"));--> statement-breakpoint
CREATE POLICY "guild_chat_reports_moderators" ON "guild_chat_reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING (guild_chat_private.can_access("guild_chat_reports"."guild_id",true));

-- Shared locks prevent removal/archive racing writes; caller identity is always checked.
CREATE FUNCTION guild_chat_private.actor(p_guild_id uuid,p_traveler_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
END $$;
CREATE FUNCTION guild_chat_private.take_rate(p_kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE bucket guild_chat_private.rate_limits%ROWTYPE; stamp timestamptz; cap integer;
BEGIN
  IF auth.uid() IS NULL OR p_kind NOT IN ('send','report') THEN RAISE EXCEPTION 'Chat access denied' USING ERRCODE='42501'; END IF;
  cap:=CASE WHEN p_kind='send' THEN 10 ELSE 5 END;
  INSERT INTO guild_chat_private.rate_limits(user_id,kind) VALUES(auth.uid(),p_kind) ON CONFLICT DO NOTHING;
  SELECT * INTO bucket FROM guild_chat_private.rate_limits WHERE user_id=auth.uid() AND kind=p_kind FOR UPDATE;
  stamp:=clock_timestamp();
  IF bucket.last_at > stamp-interval '3 seconds' THEN RAISE EXCEPTION 'Chat rate limit' USING ERRCODE='P0001'; END IF;
  IF bucket.window_at <= stamp-interval '1 minute' THEN bucket.hits:=0; bucket.window_at:=stamp; END IF;
  IF bucket.hits>=cap THEN RAISE EXCEPTION 'Chat rate limit' USING ERRCODE='P0001'; END IF;
  UPDATE guild_chat_private.rate_limits SET last_at=stamp,window_at=bucket.window_at,hits=bucket.hits+1 WHERE user_id=auth.uid() AND kind=p_kind;
END $$;
CREATE FUNCTION guild_chat_private.send(p_guild_id uuid,p_traveler_id uuid,p_client_id uuid,p_body text,p_announcement boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor_role text; author public.travelers%ROWTYPE; previous public.guild_chat_messages%ROWTYPE; result_id uuid;
BEGIN
  actor_role:=guild_chat_private.actor(p_guild_id,p_traveler_id);
  IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 1000 OR octet_length(p_body)>4000 OR p_client_id IS NULL OR p_announcement IS NULL THEN RAISE EXCEPTION 'Invalid chat message' USING ERRCODE='22023'; END IF;
  IF p_announcement AND actor_role<>'leader' THEN RAISE EXCEPTION 'Leader required' USING ERRCODE='42501'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,62));
  SELECT * INTO previous FROM public.guild_chat_messages WHERE author_traveler_id=p_traveler_id AND client_id=p_client_id;
  IF FOUND THEN
    IF previous.guild_id<>p_guild_id OR previous.body IS DISTINCT FROM btrim(p_body) OR previous.is_announcement<>p_announcement THEN RAISE EXCEPTION 'Chat retry conflict' USING ERRCODE='22023'; END IF;
    RETURN previous.id;
  END IF;
  PERFORM guild_chat_private.take_rate('send');
  SELECT * INTO author FROM public.travelers WHERE id=p_traveler_id;
  INSERT INTO public.guild_chat_messages(guild_id,author_traveler_id,client_id,author_name,author_body_type,author_skin_tone,author_hair_style,author_outfit,body,is_announcement)
    VALUES(p_guild_id,p_traveler_id,p_client_id,author.name,author.body_type,author.skin_tone,author.hair_style,coalesce(author.avatar_variant,'musgo'),btrim(p_body),p_announcement) RETURNING id INTO result_id;
  RETURN result_id;
END $$;
CREATE FUNCTION guild_chat_private.summary(p_guild_id uuid,p_traveler_id uuid)
RETURNS TABLE(unread_count bigint,last_read_sequence bigint,can_announce boolean,can_moderate boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor_role text; checkpoint bigint;
BEGIN
  actor_role:=guild_chat_private.actor(p_guild_id,p_traveler_id);
  SELECT r.last_read_sequence INTO checkpoint FROM public.guild_chat_reads r WHERE r.guild_id=p_guild_id AND r.user_id=auth.uid();
  checkpoint:=coalesce(checkpoint,0);
  RETURN QUERY SELECT count(*),checkpoint,actor_role='leader',actor_role IN ('leader','co_leader','moderator') FROM public.guild_chat_messages m
    WHERE m.guild_id=p_guild_id AND m.sequence>checkpoint AND m.removed_at IS NULL
      AND NOT EXISTS(SELECT 1 FROM public.travelers t WHERE t.id=m.author_traveler_id AND t.user_id=auth.uid());
END $$;
CREATE FUNCTION guild_chat_private.mark_read(p_guild_id uuid,p_traveler_id uuid,p_sequence bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  PERFORM guild_chat_private.actor(p_guild_id,p_traveler_id);
  IF p_sequence IS NULL OR NOT EXISTS(SELECT 1 FROM public.guild_chat_messages WHERE guild_id=p_guild_id AND sequence=p_sequence) THEN RAISE EXCEPTION 'Invalid read cursor' USING ERRCODE='22023'; END IF;
  INSERT INTO public.guild_chat_reads(guild_id,user_id,last_read_sequence) VALUES(p_guild_id,auth.uid(),p_sequence)
    ON CONFLICT(guild_id,user_id) DO UPDATE SET last_read_sequence=greatest(public.guild_chat_reads.last_read_sequence,excluded.last_read_sequence);
END $$;
CREATE FUNCTION guild_chat_private.report(p_guild_id uuid,p_traveler_id uuid,p_message_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  PERFORM guild_chat_private.actor(p_guild_id,p_traveler_id);
  IF p_reason IS NULL OR p_reason NOT IN ('bullying','personal_data','sexual_content','violence','other') THEN RAISE EXCEPTION 'Invalid report reason' USING ERRCODE='22023'; END IF;
  PERFORM 1 FROM public.guild_chat_messages WHERE id=p_message_id AND guild_id=p_guild_id AND removed_at IS NULL FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message unavailable' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM public.guild_chat_reports WHERE message_id=p_message_id AND reporter_traveler_id=p_traveler_id) THEN RETURN; END IF;
  PERFORM guild_chat_private.take_rate('report');
  INSERT INTO public.guild_chat_reports(guild_id,message_id,reporter_traveler_id,reason) VALUES(p_guild_id,p_message_id,p_traveler_id,p_reason) ON CONFLICT DO NOTHING;
END $$;
CREATE FUNCTION guild_chat_private.moderate(p_guild_id uuid,p_traveler_id uuid,p_message_id uuid,p_action text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor_role text; message public.guild_chat_messages%ROWTYPE;
BEGIN
  actor_role:=guild_chat_private.actor(p_guild_id,p_traveler_id);
  IF actor_role NOT IN ('leader','co_leader','moderator') THEN RAISE EXCEPTION 'Moderator required' USING ERRCODE='42501'; END IF;
  IF p_action IS NULL OR p_action NOT IN ('remove','dismiss_reports') OR p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 3 AND 200 THEN RAISE EXCEPTION 'Invalid moderation' USING ERRCODE='22023'; END IF;
  SELECT * INTO message FROM public.guild_chat_messages WHERE id=p_message_id AND guild_id=p_guild_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message unavailable' USING ERRCODE='42501'; END IF;
  IF p_action='remove' THEN
    IF message.removed_at IS NOT NULL THEN RETURN; END IF;
    UPDATE public.guild_chat_messages SET body=NULL,removed_at=clock_timestamp() WHERE id=p_message_id;
    UPDATE public.guild_chat_reports SET status='removed' WHERE message_id=p_message_id AND status='pending';
  ELSE
    UPDATE public.guild_chat_reports SET status='dismissed' WHERE message_id=p_message_id AND status='pending';
    IF NOT FOUND THEN RETURN; END IF;
  END IF;
  INSERT INTO public.guild_chat_moderation_log(guild_id,message_id,actor_traveler_id,action,reason) VALUES(p_guild_id,p_message_id,p_traveler_id,p_action,btrim(p_reason));
END $$;

-- Invoker public API; privileged implementations are in an unexposed schema.
CREATE FUNCTION public.send_guild_chat_message(p_guild_id uuid,p_traveler_id uuid,p_client_id uuid,p_body text,p_announcement boolean DEFAULT false)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_chat_private.send(p_guild_id,p_traveler_id,p_client_id,p_body,p_announcement) $$;
CREATE FUNCTION public.guild_chat_summary(p_guild_id uuid,p_traveler_id uuid)
RETURNS TABLE(unread_count bigint,last_read_sequence bigint,can_announce boolean,can_moderate boolean)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT * FROM guild_chat_private.summary(p_guild_id,p_traveler_id) $$;
CREATE FUNCTION public.mark_guild_chat_read(p_guild_id uuid,p_traveler_id uuid,p_sequence bigint)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_chat_private.mark_read(p_guild_id,p_traveler_id,p_sequence) $$;
CREATE FUNCTION public.report_guild_chat_message(p_guild_id uuid,p_traveler_id uuid,p_message_id uuid,p_reason text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_chat_private.report(p_guild_id,p_traveler_id,p_message_id,p_reason) $$;
CREATE FUNCTION public.moderate_guild_chat_message(p_guild_id uuid,p_traveler_id uuid,p_message_id uuid,p_action text,p_reason text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT guild_chat_private.moderate(p_guild_id,p_traveler_id,p_message_id,p_action,p_reason) $$;

REVOKE ALL ON public.guild_chat_messages,public.guild_chat_reads,public.guild_chat_reports,public.guild_chat_moderation_log FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.guild_chat_messages,public.guild_chat_reads,public.guild_chat_reports,public.guild_chat_moderation_log TO authenticated;
REVOKE ALL ON guild_chat_private.rate_limits FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.guild_chat_messages_sequence_seq FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA guild_chat_private FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION guild_chat_private.can_access(uuid,boolean),guild_chat_private.send(uuid,uuid,uuid,text,boolean),guild_chat_private.summary(uuid,uuid),guild_chat_private.mark_read(uuid,uuid,bigint),guild_chat_private.report(uuid,uuid,uuid,text),guild_chat_private.moderate(uuid,uuid,uuid,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.send_guild_chat_message(uuid,uuid,uuid,text,boolean),public.guild_chat_summary(uuid,uuid),public.mark_guild_chat_read(uuid,uuid,bigint),public.report_guild_chat_message(uuid,uuid,uuid,text),public.moderate_guild_chat_message(uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.send_guild_chat_message(uuid,uuid,uuid,text,boolean),public.guild_chat_summary(uuid,uuid),public.mark_guild_chat_read(uuid,uuid,bigint),public.report_guild_chat_message(uuid,uuid,uuid,text),public.moderate_guild_chat_message(uuid,uuid,uuid,text,text) TO authenticated;

-- Client listens only INSERT/UPDATE; no DELETE API/events, which cannot use RLS.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN RAISE EXCEPTION 'Supabase Realtime publication missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='guild_chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_chat_messages;
  END IF;
END $$;
