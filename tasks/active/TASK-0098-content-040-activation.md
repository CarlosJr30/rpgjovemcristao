# TASK-0098 — Activate approved 40-card and 40-equipment catalogs
ID: TASK-0098
TITLE: Activate approved CONTENT-040A/B in production
OBJECTIVE: Integrate the 67 ART-040 illustrations and activate the 33 newly approved card definitions and 34 equipment definitions without enabling any unapproved acquisition or economic source.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: This isolated branch, based on art/art-040 and the latest origin/main; public art assets and mappings; the approved CONTENT-040A/B definitions; narrowly scoped runtime catalog/engine support; tests; required catalog data migration only if the existing production authority requires it; report and memory. User explicitly approved activation of the 33 cards and 34 equipment definitions in PROD on 2026-11-09.
OUT_OF_SCOPE: Any new purchase, chest/loot table, starter grant, card/equipment grant, conversion, duplicate compensation, XP/coins, reward issuance, changes to the original seven cards or six equipment definitions, unrelated PR merging, changes to player data, broad Auth/RLS changes, payment systems, or undocumented mechanics.
DEPENDENCIES: ART-040 approved illustration source; CONTENT-040A/B proposed specifications now explicitly approved for implementation by the user; current production catalog and acquisition contracts; RELEASE_POLICY; Supabase documentation and exact project verification if a migration is required.
ASSIGNED_AGENT: Primary Codex agent; no subagents.
REQUIRED_CONTEXT: .agent/GLOBAL_CONTEXT.md, memory/CURRENT_STATE.md, WORKFLOW.md, RULES.md, SECURITY.md, RELEASE_POLICY.md; RPG-ART-040 report; CONTENT-040A card specs; CONTENT-040B equipment specs; current engine/catalog and production manifest.
SECURITY_CONSIDERATIONS: Server-known IDs and versioned approval metadata only; browser cannot supply definitions, costs, effects, equipment bonuses, ownership, or acquisition. No new acquisition authority is enabled. Keep migration/data changes additive and limited to definitions; preserve existing receipts, inventories, loadouts, accounts, and QA training. Validate RLS/ACLs and run advisors if schema/function/policy changes are necessary.
ACCEPTANCE_CRITERIA:
- All 33 card definitions and 34 equipment definitions match the approved source specifications and map to the 67 approved individual illustrations.
- Existing seven card definitions/illustrations and six equipment definitions/behaviors remain unchanged.
- Existing 7-card deck, once-per-battle use, Arena/Tower rules, and all unchanged economy paths remain intact.
- New definitions are usable only through existing authenticated ownership checks; no acquisition, sale, grant, or reward source is added by this task.
- Production catalog activation is additive, versioned, auditable, and preserves all player data/receipts.
- Required CI, targeted tests, Preview, production deployment, and post-release checks pass on the exact candidate SHA.
TEST_PLAN:
- Targeted data/schema checks for catalog count/version/ID uniqueness, approved definition-to-art mapping, unchanged canonical entries, and acquisition source deny/pending behavior.
- Targeted engine tests for each new effect class, validation, ownership, once-per-battle use, and equipment snapshot effects; reuse prior unchanged Arena/Tower and economy evidence.
- Required lint, typecheck, build, CI, security, Supabase migration/advisor and data-preservation gates as applicable.
- Preview confirms rendering/mapping and availability gates with authorized test context; do not grant or transact with player data.
DEFINITION_OF_DONE:
- The exact approved specifications and assets are integrated without unapproved acquisition paths; all gates pass; PR is merged normally; production deployment is READY on the merge SHA and verified; report and memory are updated. Any blocking incompatibility or failed gate prevents production activation.
