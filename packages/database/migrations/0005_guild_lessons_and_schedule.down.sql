DROP FUNCTION IF EXISTS public.guild_public_member_profile(uuid,uuid);
DROP TRIGGER IF EXISTS guild_lesson_activity ON public.guild_lessons;
DROP FUNCTION IF EXISTS public.guild_lesson_activity_capture();
DROP FUNCTION IF EXISTS public.set_guild_lesson_status(uuid,uuid,text);
DROP FUNCTION IF EXISTS public.save_guild_lesson(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,text,timestamptz,uuid,boolean);
DROP TABLE IF EXISTS public.guild_lessons;
