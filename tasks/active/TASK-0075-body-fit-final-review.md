# TASK-0075 — Body-Fit final rework and human approval

ID: TASK-0075
OBJECTIVE: Reuse TASK-0074 evidence, investigate seven pending candidates, produce private whole-body/zoom/triple-combination evidence and a mobile human-review gallery.
PRIORITY: P1 High
STATUS: BLOCKED
AUDIT_STATUS: COMPLETE_WITH_DEFECTS
ACCEPTANCE_STATUS: ORIGINAL_VISUAL_DECISIONS_RECORDED_DERIVATIVES_AND_FUNCTIONAL_GATES_PENDING
BASE: 100492bfa1f93dc49a4122f935544c001dcd96cb (origin/main)
DEPENDENCIES: TASK-0074; explicit human approval of each exact hash/Avatar before activation.
ASSIGNED_AGENT: Main agent assuming Frontend, QA and Security profiles; no independent review claimed.
SCOPE: New TASK-0075 scripts, private ignored build/task-0075-body-fit-final-review, generic offline gallery template, task/report/security/memory documentation. Private non-destructive art alternatives only when a concrete visual defect warrants them. Existing TASK-0074 pipeline and sources reused.
OUT_OF_SCOPE: HD edits, historical receipt edits, catalog additions, rare-armor runtime, pending-candidate runtime, Supabase, production player data, protection changes, force push, unrelated game mechanics. No deployment for private review changes alone.
REQUIRED_CONTEXT: User TASK-0075 attachment; global/current context and workflow; TASK-0074 inventory, gallery, compatibility and inspection scripts; DEC-037.
SECURITY_CONSIDERATIONS: Gallery and experimental PNGs remain ignored/offline, no secrets or real-player data; only synthetic browser storage. Self-review must verify preservation and public build isolation.
ACCEPTANCE_CRITERIA:
- Verify 16 original candidates, eight technical FIT_PASS, seven pending, one human-approved and one active exact female scope.
- Inspect seven candidates separately and with same-Avatar armor/sword/shield combinations; preserve original hashes.
- Preserve adequate art; separate any experimental derivative hash/status from original technical fit.
- Private mobile gallery identifies exact hash/Avatar and never automatically records human decisions.
- Execute PNG/hash/alpha, gallery/mobile, game/equipment/attributes/persistence/Home/Arena, unit/lint/typecheck/build/media/security checks and record actual limits.
- No human approval or activation inferred. Completion requires explicit decisions; otherwise BLOCKED with concrete review deliverables.
TEST_PLAN: Read-only baseline hash manifest; browser screenshots/decoded images and offline CSP checks; production local build and existing E2E suites; preservation verification and review archive inspection. QA ownership allows scoped test harness diagnosis. Final retained correction: tests/e2e/arena-v2.spec.ts waits for the native busy lock to clear and activates the deliberately aria-disabled action with keyboard, preserving negative-action assertions. Attempts to change reload timing and omit desktop captures did not solve the issue and were discarded; attributes/home/body-fit/portal tests restored exactly. No runtime change authorized by these test fixes.
DEFINITION_OF_DONE: Authorized local work complete, evidence delivered, applicable checks pass, human acceptance recorded and memory updated. Pending human review does not equal DONE.

## Initial verification

2026-10-14: origin/main remains 100492b. TASK-0074 dirty closure documents and evidence preserved in their original worktree. New branch feat/body-fit-final-review-0075 has separate ownership. Historical attachment staging wording is stale: the single approved female armor is already active for female_short_moss_medium only.

## SELF VALIDATE / QA / Security — 2026-10-15

- Baseline 2460 files recorded; 54 HD, 16 original sources, 16 existing bakes and historical approval receipts unchanged. Runtime/camera/swipe/engine/auth/chat/DB/saves unchanged. Temporary changes to four E2E files restored byte-for-byte; generated next-env restored after checks.
- Inventory/PNG/SHA/CRC/alpha: PASS. 16 original targets, eight historical FIT_PASS, seven human pending, one approved/active exact female scope; one NEEDS_REWORK and seven NEEDS_NEW_ART unchanged.
- Art: male uncommon armor and both common swords kept exactly. Rare armors inspected as archived definitions only. Two shields need convincing arm fixation. Four built-in imagegen alternatives failed fit/alpha/placement inspection; zero new FIT_PASS. All original/derived SHA are in alternatives.json and the report.
- Private gallery: 22 engine/viewport checks PASS, 16 references plus four rejected experiments; zero remote requests, decision clicks or localStorage writes. Exact hash/Avatar binding, separate drafts per version, original/experimental comparison, zoom, three layers, keyboard/touch checks. Approve disabled on shield rework/experiments and non-pending references.
- Compatibility: four original and eight experimental unique armor+sword+shield trios, each at 390 and 1440; 24 compositions/104 captures. Static render PASS; visual acceptance BLOCKED by shield fixation. 43 individual candidate captures selected for the review package.
- Unit: 447 tests/68 files PASS. Lint, typecheck and production optimized build PASS. Initial local dependency-junction build failure corrected without changing runtime or lockfile.
- Final E2E: **144 PASS / 14 FAIL / 10 expected skips**, 168 cases. Full results retained, not replaced with prior TASK-0074 results. Eleven desktop failures cover navigation/reload in Chrome; prior Edge reproductions also failed. Three WebKit failures cover prefetch access-control errors/navigation; focused recheck is separate evidence. Root cause not demonstrated. No CORS/auth/protection disabled and no assertion/capture suppression retained.
- Retained test correction: native busy readiness and keyboard activation of deliberately aria-disabled special actions. Two focused WebKit negative-action cases PASS; original guard/assertions retained. This does not prove physical touch behavior.
- Three new WebKit failures from the complete run were rechecked individually, without code changes: 3 PASS. This establishes intermittent/context-dependent behavior in this host; it does not replace the complete 144/14/10 run or clear the functional gate.
- Media/security: local and public seven routes 200, eight restricted audios/eight sources/five DEV/56 private paths 404; no experimental asset in public/static; no frontend service role identified. Vercel existing deployment dpl_B6HAwZUACcR7zsD6cVF7X21jiBHt remains READY at 100492b; main unchanged. GET-only inspection, no Supabase access/migration or remote configuration change.
- QA/Security performed by main agent; no independent review claimed. Artifacts: build/task-0075-body-fit-final-review/{RELATORIO.md,qa-summary.json,review/index.html,review-package/SHA256.json,package-inspection.json}. ZIP integrity is recorded separately; no traces/HAR/profiles/env/54 raw HD in the package.

## Acceptance and next step

### Human feedback received — 2026-10-15

Carlos explicitly approved all original candidates except the two helmets and both pairs of boots; the follow-up answer confirms that female boots also require correction. Record a separate documentary receipt bound to the 16 original hashes and their exact reference Avatars. Twelve original visual decisions are APPROVED (including the already-approved female armor, whose historical receipt remains untouched); four are CORRECTION_REQUESTED. Approval applies to original gallery candidates, never to the four rejected shield experiments or any future derivative. Technical findings and production eligibility remain separate and unchanged.

Authorized follow-up scope: create four non-destructive private imagegen derivatives for helmet_traveler_rare_female_v2, helmet_traveler_rare_male_v2, boots_traveler_common_female_v2 and boots_traveler_common_male_v2; inspect transparency, scale and registration on each unchanged HD Avatar, provide a separate private comparison and exact hashes. No runtime activation or remote changes. Main agent assumes scoped Frontend/QA ownership of scripts, private art, documentary receipt and gallery. New versions require a new human decision; the existing functional E2E failures remain blockers.

Current human decisions supersede the initial pending state above: 12 original versions visually approved, including the preserved historical female armor; both helmets and both boots require correction. Receipt: docs/architecture/TASK-0075-HUMAN-VISUAL-DECISIONS.json. This is visual acceptance only; technical findings, archived definitions and runtime gates remain separate. No rejected shield experiment is approved. Four targets have 13 private generated attempts: two exact helmet derivatives are prepared for human review, while both boots remain NEEDS_REWORK due to alignment/silhouette/duplicate footwear. The male helmet has 105 pixels in a conservative facial rectangle; visual inspection shows eyes clear but brow clearance still requires human judgment. New derivatives inherit no approval. Functional E2E gate remains FAIL. Do not mark DONE or activate candidates. No push or deployment for this private checkpoint.

Follow-up QA: 16 original/source/Avatar hash bindings reverified; all 13 new PNGs CRC/decode/RGBA1024x1536 inspected. Comparison gallery: 12 Edge/WebKit viewport cases PASS, 38 decoded images per viewport, navigation/zoom/no overflow, zero remote requests/storage writes/decision clicks; four private path denials PASS. Initial 2px horizontal overflow corrected by wrapping long identifiers. Gallery: http://127.0.0.1:8076/ (only loopback) or build/task-0075-body-fit-final-review/size-rework/review.html. Original gallery and ZIP remain historical, unchanged. Prompts: tools/equipment-body-fit-size-rework-prompts.json. Runtime unchanged; prior failed E2E remains authoritative, not rerun or claimed fixed. Review by main agent, not independent.
