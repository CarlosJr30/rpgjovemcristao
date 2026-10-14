-- Safe operational rollback: disables only the new chat API and preserves data.
-- Do NOT drop chat tables/history or disable RLS. Apply only when rolling back V1.
REVOKE ALL ON public.guild_chat_messages,public.guild_chat_reads,public.guild_chat_reports,public.guild_chat_moderation_log FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA guild_chat_private FROM authenticated;
REVOKE ALL ON FUNCTION public.send_guild_chat_message(uuid,uuid,uuid,text,boolean),public.guild_chat_summary(uuid,uuid),public.mark_guild_chat_read(uuid,uuid,bigint),public.report_guild_chat_message(uuid,uuid,uuid,text),public.moderate_guild_chat_message(uuid,uuid,uuid,text,text) FROM authenticated;
ALTER PUBLICATION supabase_realtime DROP TABLE public.guild_chat_messages;
-- Re-enable by restoring the GRANT statements and publication in 0006, not rerunning CREATE.
