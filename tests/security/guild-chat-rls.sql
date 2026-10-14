-- Run on the authorized Supabase project. All test data is rolled back.
-- Uses two existing non-anonymous accounts with no active memberships.
-- Simulates JWT claims in SQL; this is NOT a browser/Auth/Realtime transport test.
BEGIN;
SELECT set_config('chat_test.user_a',t.user_id::text,true),set_config('chat_test.traveler_a',t.id::text,true)
FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
WHERE NOT coalesce(u.is_anonymous,false) AND NOT EXISTS(SELECT 1 FROM public.guild_members gm WHERE gm.traveler_id=t.id AND gm.status='active')
ORDER BY t.user_id,t.is_active DESC,t.created_at LIMIT 1;
SELECT set_config('chat_test.user_b',t.user_id::text,true),set_config('chat_test.traveler_b',t.id::text,true)
FROM public.travelers t JOIN auth.users u ON u.id=t.user_id
WHERE t.user_id<>current_setting('chat_test.user_a')::uuid AND NOT coalesce(u.is_anonymous,false)
AND NOT EXISTS(SELECT 1 FROM public.guild_members gm WHERE gm.traveler_id=t.id AND gm.status='active')
ORDER BY t.user_id,t.is_active DESC,t.created_at LIMIT 1;
SELECT set_config('request.jwt.claim.sub',current_setting('chat_test.user_a'),true),
set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.user_a'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
SELECT set_config('chat_test.guild_a',public.create_guild(current_setting('chat_test.traveler_a')::uuid,'TASK-0071 TEMP A','Rollback-only security fixture')::text,true);
SELECT set_config('chat_test.message_a',public.send_guild_chat_message(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_a')::uuid,'00620000-0000-4000-8000-000000000001','Aviso de teste',true)::text,true);
DO $$ DECLARE g uuid:=current_setting('chat_test.guild_a')::uuid; t uuid:=current_setting('chat_test.traveler_a')::uuid; retry_id uuid; BEGIN
  retry_id:=public.send_guild_chat_message(g,t,'00620000-0000-4000-8000-000000000001','Aviso de teste',true);
  IF retry_id<>current_setting('chat_test.message_a')::uuid THEN RAISE EXCEPTION 'FAIL idempotent retry'; END IF;
  BEGIN PERFORM public.send_guild_chat_message(g,t,gen_random_uuid(),'Second message',false); RAISE EXCEPTION 'FAIL frequency bypass'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'Chat rate limit' THEN RAISE; END IF; END;
  BEGIN PERFORM public.send_guild_chat_message(g,t,gen_random_uuid(),repeat('a',1001),false); RAISE EXCEPTION 'FAIL oversize'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  BEGIN PERFORM public.send_guild_chat_message(g,t,gen_random_uuid(),'   ',false); RAISE EXCEPTION 'FAIL blank'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  BEGIN PERFORM public.send_guild_chat_message(g,t,'00620000-0000-4000-8000-000000000001','Changed retry',true); RAISE EXCEPTION 'FAIL retry conflict'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  BEGIN PERFORM public.send_guild_chat_message(g,current_setting('chat_test.traveler_b')::uuid,gen_random_uuid(),'Impersonation',false); RAISE EXCEPTION 'FAIL spoofed author'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN UPDATE public.guild_chat_messages SET body='forged' WHERE guild_id=g; RAISE EXCEPTION 'FAIL direct update'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN DELETE FROM public.guild_chat_messages WHERE guild_id=g; RAISE EXCEPTION 'FAIL direct delete'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN INSERT INTO public.guild_chat_messages(id,guild_id) VALUES(gen_random_uuid(),g); RAISE EXCEPTION 'FAIL direct insert'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN INSERT INTO public.guild_chat_reads VALUES(g,auth.uid(),999999); RAISE EXCEPTION 'FAIL direct cursor'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN PERFORM public.mark_guild_chat_read(g,t,999999); RAISE EXCEPTION 'FAIL future cursor'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('chat_test.user_b'),true),set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.user_b'),'role','authenticated')::text,true);
SELECT set_config('chat_test.guild_b',public.create_guild(current_setting('chat_test.traveler_b')::uuid,'TASK-0071 TEMP B','Rollback-only security fixture')::text,true);
SELECT set_config('chat_test.message_b',public.send_guild_chat_message(current_setting('chat_test.guild_b')::uuid,current_setting('chat_test.traveler_b')::uuid,gen_random_uuid(),'Outra célula',false)::text,true);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.guild_chat_messages WHERE guild_id=current_setting('chat_test.guild_a')::uuid) THEN RAISE EXCEPTION 'FAIL cross-cell SELECT'; END IF;
  BEGIN PERFORM public.guild_chat_summary(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_b')::uuid); RAISE EXCEPTION 'FAIL cross-cell summary'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN PERFORM public.report_guild_chat_message(current_setting('chat_test.guild_b')::uuid,current_setting('chat_test.traveler_b')::uuid,current_setting('chat_test.message_a')::uuid,'other'); RAISE EXCEPTION 'FAIL cross-cell report'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
-- Only transient fixture memberships change. No original membership exists for them.
RESET ROLE;
UPDATE public.guild_members SET status='removed' WHERE guild_id=current_setting('chat_test.guild_b')::uuid AND traveler_id=current_setting('chat_test.traveler_b')::uuid;
INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_b')::uuid,'member','active');
SET LOCAL ROLE authenticated;
DO $$ DECLARE g uuid:=current_setting('chat_test.guild_a')::uuid; t uuid:=current_setting('chat_test.traveler_b')::uuid; checkpoint bigint; n bigint; BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.guild_chat_messages WHERE id=current_setting('chat_test.message_a')::uuid AND author_name IS NOT NULL AND author_body_type IS NOT NULL) THEN RAISE EXCEPTION 'FAIL same-cell identity'; END IF;
  SELECT unread_count INTO n FROM public.guild_chat_summary(g,t); IF n<>1 THEN RAISE EXCEPTION 'FAIL unread'; END IF;
  SELECT sequence INTO checkpoint FROM public.guild_chat_messages WHERE id=current_setting('chat_test.message_a')::uuid;
  PERFORM public.mark_guild_chat_read(g,t,checkpoint);
  SELECT unread_count INTO n FROM public.guild_chat_summary(g,t); IF n<>0 THEN RAISE EXCEPTION 'FAIL mark read'; END IF;
  BEGIN PERFORM public.send_guild_chat_message(g,t,gen_random_uuid(),'Forged announcement',true); RAISE EXCEPTION 'FAIL member announcement'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN PERFORM public.moderate_guild_chat_message(g,t,current_setting('chat_test.message_a')::uuid,'remove','Test removal'); RAISE EXCEPTION 'FAIL member moderation'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  PERFORM public.report_guild_chat_message(g,t,current_setting('chat_test.message_a')::uuid,'other');
  PERFORM public.report_guild_chat_message(g,t,current_setting('chat_test.message_a')::uuid,'other');
  IF EXISTS(SELECT 1 FROM public.guild_chat_reports) OR EXISTS(SELECT 1 FROM public.guild_chat_moderation_log) THEN RAISE EXCEPTION 'FAIL reports confidentiality'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('chat_test.user_a'),true),set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.user_a'),'role','authenticated')::text,true);
DO $$ DECLARE g uuid:=current_setting('chat_test.guild_a')::uuid; t uuid:=current_setting('chat_test.traveler_a')::uuid; BEGIN
  IF (SELECT count(*) FROM public.guild_chat_reports WHERE guild_id=g)<>1 THEN RAISE EXCEPTION 'FAIL report retry'; END IF;
  PERFORM public.moderate_guild_chat_message(g,t,current_setting('chat_test.message_a')::uuid,'remove','Test removal');
  PERFORM public.moderate_guild_chat_message(g,t,current_setting('chat_test.message_a')::uuid,'remove','Test removal');
  IF NOT EXISTS(SELECT 1 FROM public.guild_chat_messages WHERE id=current_setting('chat_test.message_a')::uuid AND body IS NULL AND removed_at IS NOT NULL) THEN RAISE EXCEPTION 'FAIL tombstone'; END IF;
  IF (SELECT count(*) FROM public.guild_chat_moderation_log WHERE guild_id=g)<>1 THEN RAISE EXCEPTION 'FAIL atomic/idempotent audit'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.guild_chat_reports WHERE guild_id=g AND status='removed') THEN RAISE EXCEPTION 'FAIL report resolution'; END IF;
END $$;
RESET ROLE;
-- Moderator role is database-controlled and does not grant announcement rights.
UPDATE public.guild_members SET role='moderator' WHERE guild_id=current_setting('chat_test.guild_a')::uuid AND traveler_id=current_setting('chat_test.traveler_b')::uuid;
SELECT set_config('request.jwt.claim.sub',current_setting('chat_test.user_b'),true),set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.user_b'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE s record; BEGIN
  SELECT * INTO s FROM public.guild_chat_summary(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_b')::uuid);
  IF NOT s.can_moderate OR s.can_announce THEN RAISE EXCEPTION 'FAIL moderator role'; END IF;
  BEGIN PERFORM public.moderate_guild_chat_message(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_b')::uuid,current_setting('chat_test.message_b')::uuid,'remove','Cross-cell attack'); RAISE EXCEPTION 'FAIL moderator cross-cell'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.guilds SET status='archived' WHERE id=current_setting('chat_test.guild_a')::uuid;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.guild_chat_messages WHERE guild_id=current_setting('chat_test.guild_a')::uuid) THEN RAISE EXCEPTION 'FAIL archived guild'; END IF;
  BEGIN PERFORM public.guild_chat_summary(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_b')::uuid); RAISE EXCEPTION 'FAIL archived summary'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.guilds SET status='active' WHERE id=current_setting('chat_test.guild_a')::uuid;
SELECT set_config('request.jwt.claim.sub',current_setting('chat_test.user_a'),true),set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.user_a'),'role','authenticated')::text,true);
-- Test window cap without sleeping or changing any original data.
UPDATE guild_chat_private.rate_limits SET last_at=clock_timestamp()-interval '4 seconds',hits=10 WHERE user_id=current_setting('chat_test.user_a')::uuid AND kind='send';
SET LOCAL ROLE authenticated;
DO $$ BEGIN BEGIN
  PERFORM public.send_guild_chat_message(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_a')::uuid,gen_random_uuid(),'Window cap',false);
  RAISE EXCEPTION 'FAIL account window cap'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'Chat rate limit' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
UPDATE public.guild_members SET status='removed' WHERE guild_id=current_setting('chat_test.guild_a')::uuid AND traveler_id=current_setting('chat_test.traveler_b')::uuid;
SELECT set_config('request.jwt.claim.sub',current_setting('chat_test.user_b'),true),set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.user_b'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.guild_chat_messages) THEN RAISE EXCEPTION 'FAIL revoked membership SELECT'; END IF;
  BEGIN PERFORM public.guild_chat_summary(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_b')::uuid); RAISE EXCEPTION 'FAIL revoked summary'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM * FROM public.guild_chat_messages; RAISE EXCEPTION 'FAIL anon read'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  BEGIN PERFORM public.guild_chat_summary(current_setting('chat_test.guild_a')::uuid,current_setting('chat_test.traveler_a')::uuid); RAISE EXCEPTION 'FAIL anon RPC'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'PASS: SQL isolation, ownership, announcements, read cursor, limits, reports, moderation, revocation, anon' AS result;
ROLLBACK;

