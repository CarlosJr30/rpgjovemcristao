# TASK-0099 — General economic access correction

ID: TASK-0099
TITLE: RPG-ECONOMY-FIX-012
OBJECTIVE: Identify and correct general economic initialization/access defects for eligible players while preserving legacy provenance gates and all existing data.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Read-only aggregate PROD audit; existing economic creation/reconciliation/shop authorities; existing Shop access/rendering; narrowly affected tests, TEST-first release packages if necessary, report and memory. User explicitly authorizes this runtime correction.
OUT_OF_SCOPE: Mass PROD updates without specific approval; legacy balance acceptance; direct verification flags; modifications to Teste Chat A or other player data; parallel wallets/inventories; Auth/RLS bypass; expansion content/acquisition integrations; purchases or grants for diagnosis.
ASSIGNED_AGENT: Primary Codex, applying database/backend/frontend and QA/Security profiles within the user-approved scope; no subagents.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, RELEASE_POLICY; existing shop, creation, reconciliation and private training contracts.
SECURITY_CONSIDERATIONS: Read-only privacy-preserving aggregates; retain ownership/session/receipt checks; zero balance is not proof of no history; private QA is distinct from canonical economy. Any automatic initialization requires a server-proven clean baseline and cannot approve legacy value.
ACCEPTANCE_CRITERIA:
- Document actual affected counts and the rule distinguishing the designated approved avatar.
- Distinguish new, old without economic history, old with history, and the preserved approved avatar.
- Show the Shop catalog while disabling only unauthorized operations.
- Preserve every balance, item, receipt, provenance gate and account/avatar boundary.
- Required targeted checks and TEST gates precede production; no unapproved mass updates.
TEST_PLAN: Only initialization/classification, Shop display/denials, preserved approved avatar, identity isolation and directly affected checks; required CI and release policy; reuse unchanged transaction evidence.
DEFINITION_OF_DONE: Evidence-backed cause and correction; gates complete; report identifies regularized versus legitimately blocked cases, risks and actual deployment status; memory updated.
