# TASK-0100 - RPG-ECONOMY-FIX-012A Shop presentation

ID: TASK-0100
TITLE: Publish the Shop catalog while preserving current economic authorization
OBJECTIVE: Keep the published Shop catalog visible to authenticated players while retaining all current server eligibility and purchase rules.
PRIORITY: P1 High
STATUS: DONE
SCOPE: `apps/web/features/qa-shop/access.tsx`, `apps/web/features/journey/screens/shop.tsx`, directly affected tests, this task contract, report, and memory.
OUT_OF_SCOPE: PR #46 initializer RPC/button/migration; database, Auth/RLS, balances, XP, items, receipts, purchases, grants, equipment, cards, expansion content, and any production data writes.
DEPENDENCIES: Owner explicitly authorized a separate presentation-only PR and automatic production publication after required gates.
ASSIGNED_AGENT: Primary Codex; frontend and QA profiles, no subagents.
REQUIRED_CONTEXT: `.agent/GLOBAL_CONTEXT.md`, `.agent/memory/CURRENT_STATE.md`, `.agent/WORKFLOW.md`, `.agent/RULES.md`, `.agent/SECURITY.md`, `.agent/RELEASE_POLICY.md`, PR #46 / RPG-ECONOMY-FIX-012 report.
SECURITY_CONSIDERATIONS: Shop stays behind normal authenticated journey access. Operations are disabled until the existing canonical read reports `enabled` and `balanceVerified`; server-side purchase authority is unchanged. No database or identity changes.
ACCEPTANCE_CRITERIA:

- Authenticated players can see the existing Shop catalog while access is loading, blocked, or unavailable.
- Purchase, recovery, and chest opening controls remain disabled until the existing authority confirms eligibility.
- Existing eligibility behavior remains available to authorized states.
- PR #46 remains unchanged and the initializer RPC/migration are absent from this PR.
- Preview uses TEST only, CI passes on exact SHA, and production deploy is READY on merge SHA before completion.
TEST_PLAN:
- Directly affected `shop.test.tsx` cases for loading/blocked/error visibility, disabled operations, and authorized flow.
- Targeted lint, Prettier, TypeScript, `git diff --check`; mandatory exact-SHA CI provides required project tests/build/RSC/mobile gates.
- Normal authenticated Preview smoke for catalog visibility and blocked state; no transaction.
DEFINITION_OF_DONE: Separate PR merged normally after all required gates; verify production deployment SHA/READY/official domain and the main Shop route; document absence of migrations and data writes.

RESULT: PR #47 merged normally: candidate `8f293e90b3edc7ab9c9e28d23bf2578481102b3b`, merge `9b32b1364573400c3e4c41b5a15119eeb8d044cf`. Nine affected component tests, lint, Prettier, TypeScript, diff check, and exact-SHA CI PASS. Preview `dpl_HmXAxCowgYu12zWRrRCvgy5Vi6gj` READY and owner-authenticated smoke PASS. Production `dpl_EnZ7r2TmcU8BxtpU5crBb1qrDNdv` READY/production on merge SHA; official `/journey/shop` HTTP 200 and deployed bundle points to PROD. No migration or agent-executed data write. Owner-reported Teste Chat A purchase was verified by targeted read-only query: one post-deploy canonical common chest purchase (40) and matching opening receipt (+25), no item; official wallet 1,006,135, level 50 / XP 245,016; QA profile remains at 9,960 with no new QA receipt. A separate pre-deploy purchase/open pair also exists; no duplicate receipt/replay observed. PR #46 remains open/draft and untouched.
