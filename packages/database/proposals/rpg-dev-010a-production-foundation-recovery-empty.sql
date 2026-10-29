-- PROD foundation-only compensation when compatibility was not applied; transaction required.
SET LOCAL lock_timeout='5s';
DO $owner$ BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' OR auth.uid() IS NOT NULL
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001' THEN RAISE EXCEPTION 'Protected production owner operation required';END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
END $owner$;
DO $empty$ BEGIN IF to_regclass('guild_admin_private.multiguild_control') IS NOT NULL
 OR EXISTS(SELECT 1 FROM guild_admin_private.admin_grants) OR EXISTS(SELECT 1 FROM guild_admin_private.audit)
 OR EXISTS(SELECT 1 FROM guild_admin_private.leadership_invites) OR EXISTS(SELECT 1 FROM guild_admin_private.leader_authorizations)
 THEN RAISE EXCEPTION 'Foundation is not empty or compatibility is installed; preserve issued state';END IF;END $empty$;
DROP FUNCTION public.guild_governance_status(),public.guild_governance_command(text,uuid,uuid,jsonb),
 public.guild_leadership_preview(text),public.guild_governance_workspace(integer),public.guild_governance_history(integer);
DROP TRIGGER governance_audit_immutable ON guild_admin_private.audit;
DROP FUNCTION guild_admin_private.immutable_audit(),guild_admin_private.account_uid(),
 guild_admin_private.allowed_permissions(text[]),guild_admin_private.require_admin(text),
 guild_admin_private.exact_keys(jsonb,text[]),guild_admin_private.bootstrap_admin(uuid,text[],text,uuid),
 guild_admin_private.status(),guild_admin_private.command(text,uuid,uuid,jsonb),guild_admin_private.preview(text),
 guild_admin_private.workspace(integer),guild_admin_private.history(integer);
DROP TABLE guild_admin_private.leader_authorizations;
DROP TABLE guild_admin_private.leadership_invites;
DROP TABLE guild_admin_private.admin_grants;
DROP TABLE guild_admin_private.audit;
DROP SCHEMA guild_admin_private;
NOTIFY pgrst,'reload schema';
