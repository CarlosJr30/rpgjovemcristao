-- TEST only: removal is permitted only before any governance data was issued.
SET LOCAL lock_timeout='5s';
DO $$ BEGIN
 IF public.release_scope() IS DISTINCT FROM 'hero-equipment-006' OR
  EXISTS(SELECT 1 FROM guild_admin_private.admin_grants) OR
  EXISTS(SELECT 1 FROM guild_admin_private.leadership_invites) OR
  EXISTS(SELECT 1 FROM guild_admin_private.leader_authorizations) OR
  EXISTS(SELECT 1 FROM guild_admin_private.audit) THEN
  RAISE EXCEPTION 'Preserve issued governance data; use containment instead'; END IF;
END $$;
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
