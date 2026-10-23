-- DEPLOY-002: postgres-owned application objects must not inherit API grants.
-- The public schema remains quarantined until the separately checked release.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
 REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
 REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
 REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;
-- PUBLIC execute is a global default; a schema-local REVOKE cannot remove it.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE USAGE ON SCHEMA public FROM PUBLIC, anon, authenticated;
