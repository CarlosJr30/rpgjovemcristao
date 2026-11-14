# PROD-only migrations

This directory is reserved exclusively for reviewed, target-guarded COMMUNITY-043B production SQL. Keep TEST source files in `supabase/migrations`; never copy them here unchanged.

Expected order, filenames, and dependencies:

1. `20261113215415_community_043b_controlled_creation_production.sql` — add production controls and creation authority, default disabled.
2. `20261113232954_community_043b_membership_link_quotas_production.sql` — membership capacity and versioned link quotas; depends on the foundation.
3. `20261114110000_community_043b_join_request_quotas_production.sql` — request quotas; depends on the foundation and existing request command.

Three GUILD-028B SQL review drafts are present, executed unchanged in disposable PostgreSQL17.10 during GUILD-028C (49 checks; see `../validation-summary.json`). Their hashes remain under `candidateMigrations`; the executable release list is empty and the manifest remains `blocked` pending recovery, retention, CI and remaining release requirements. Do not apply these drafts remotely.
