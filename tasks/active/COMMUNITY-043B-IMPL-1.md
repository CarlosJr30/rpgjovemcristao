# COMMUNITY-043B-IMPL-1 — criação controlada

STATUS: VALIDATING
OBJECTIVE: preparar criação de Guilda própria por conta elegível em branch isolada.
SCOPE: autoridade local, cliente/formulário reutilizado, quotas preparadas, testes isolados, PR Draft e CI.
OUT_OF_SCOPE: merges, migrations remotas, Preview, PROD, diretório, contato ou economia.
DEPENDENCIES: PR53 para migrations remotas; contratos B1/B2 no SHA95e6196; retenção jurídica para rollout.
ASSIGNED_AGENT: autor, perfis Database/Frontend/Security; revisão sem independência.
SECURITY_CONSIDERATIONS: ownership/sessão revalidados, trava compartilhada de governança, atomicidade, idempotência por conta, default fechado/TEST, grants mínimos.
ACCEPTANCE_CRITERIA: conta elegível cria uma única Guilda/líder/auditoria; nenhum privilégio global ou recurso econômico; legado preservado; não publicar.
TEST_PLAN: 35 cenários PostgreSQL isolados PASS e 14 unitários direcionados anteriores preservados. Esta revisão adiciona 9 checks PostgreSQL ao harness existente: quota agregada, janela móvel, cancelamento/rejeição, cooldown, replay, concorrência, revalidação de elegibilidade, revogação de link e negação de colíder sem delegação. `node --check`/`git diff --check` PASS. PostgreSQL local indisponível neste worktree (sem pacote `pg` ou binário preinstalado); não instalar dependências. CI exato do novo SHA deve confirmar SQL, testes, lint, TypeScript e build.
DEFINITION_OF_DONE: aplicar semânticas aprovadas nos pedidos, preservar quotas/links anteriores, atualizar PR55 Draft e obter CI exato. Não executar merge, migration remota, Preview ou PROD. PR53/#54 seguem dependências; retenção jurídica bloqueia rollout; poderes de colíder ficam negados até haver lista explícita de operações delegáveis.

## 14/11/2026 — TEST-3 preparação

Relatório: [RPG-COMMUNITY-043B-TEST-3-REPORT.md](../../docs/architecture/RPG-COMMUNITY-043B-TEST-3-REPORT.md). Preflight Preview separado, read-only, sem alterar gate Arena e sem acionar deployment; exige uma deployment Git única preexistente, CI/SHA exatos, projeto/root/SSO e backend TEST isolados. Operação privada postgres-only de enable/disable preparada e ensaiada em PG descartável. 52 testes Node direcionados PASS; harness PG descartável PASS. No ambiente atual falta link/root e escopo de branch das variáveis no projeto Vercel dedicado; backup/PITR não verificado; nenhum operador com login normal controla avatar elegível. CI do novo SHA e todos os passos remotos continuam pendentes. Sem migrations/Preview/ativação/merge/PROD. Status: BLOCKED para homologação; não marcar DONE.

Estado/evidências e limitações: [relatório](../../docs/architecture/RPG-COMMUNITY-043B-IMPL-1-REPORT.md).

## 14/11/2026 — fechamento local das quotas

Adicionada migration local/teste com enforcement privado dos pedidos (5/conta/24h, cooldown 24h/avatar-Guilda, replay pendente sem consumo e revalidação no aceite). Harness estendido com nove verificações novas; execução local do PostgreSQL indisponível sem `pg`/binário instalado. Não instalar. Reportar somente após CI do SHA final. PR55 continua Draft; #53/#54 permanecem dependências; zero migration remota, Preview, merge ou PROD.
## 14/11/2026 — quota audit checkpoint

PR #55 remains Draft. CI success for push `43533144941` and PR `43533138363` on SHA `bd8703173b8aa9bf00c2b7cc9e7eb9cef16ab19a`; tests/lint/types/build, PostgreSQL and RSC/mobile pass; conditional Preview skipped. The 35 previously approved isolated PostgreSQL cases were reused. The new focused regression for request approval at 50 members passed in CI; local execution was blocked before startup because this worktree lacks `pg` and the execution policy rejected a temporary dependency junction.

Audit: current link invite RPC has the 10-active limit, seven-day new-link expiry and versioned 50-use successful-membership cap; historical links remain unchanged with legacy cap. Five active memberships/avatar and 50 active members/Guild are protected by the shared private trigger, including approval insert; one pending request/avatar/Guild already uses partial uniqueness. No recipient-specific Guild invite or Guild rename RPC exists. Five requests/account/day and 24-hour rejection cooldown remain proposals pending explicit semantics confirmation. Lifetime marker retention after Auth deletion/recovery remains a legal/policy blocker. PR53/54 still open; no remote DDL, Preview, merge, or deploy.

Quota audit and CI checkpoint are recorded in the report. Do not mark IMPLEMENTED_LOCAL complete or proceed to TEST until the documented product/legal decisions are resolved.

## 14/11/2026 — CI fixture correction

Runs `43549606124`, `43550327860`, `43550697653`, and `43551086971` failed and remain recorded as failures. They exposed duplicate-active-avatar setup/restore order, a missing `FROM pg_proc`, an inactive target in revoked-link testing, then duplicate historical-use fixture rows for avatars with multiple memberships. The corresponding harness setup/assertions have been corrected without changing runtime migration. These remain failed attempts, not PASS. Syntax, formatter, and diff checks pass. New-SHA CI pending. No remote database or player data changed.

The 50-member approval regression initially reused account/avatar 152 after the new quota tests had correctly exhausted its five-request allowance. It now uses fresh synthetic account/avatar 154. CI `43551490880` remains failed; new-SHA CI pending.

CI `43551889479` reached the final preservation assertion; active-avatar switching updated bookkeeping timestamps on the two synthetic avatars. The check now ignores only those expected `updated_at` changes and asserts active flags restored, while retaining all other traveler/game/economic comparisons. Failed run preserved; new-SHA CI pending.

CI `43552307309` still failed the final full game-data snapshot after expected timestamps were normalized. The runner truncated the compared JSON, so the harness now reports compact changed table/avatar rows before failing. Diagnostic-only; invariant remains unchanged. New-SHA CI pending; prior run remains non-PASS.

Diagnostic-only CI identified the final snapshot delta: `updated_at` on synthetic avatar 146 from the existing timestamp trigger during active-target eligibility testing. The harness now explicitly asserts restoration to active and excludes only that fixture timestamp from the baseline comparison. All other player/game/economic fields remain checked. New-SHA CI pending.

## Estado após CI final — 14/11/2026

SHA `f3e9ed19d3702b4064a3ad19e7b7e4502fa7e3f0`; CI [43553123476](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/43553123476) SUCCESS: 1.218 unit PASS/74 SKIP, 45 casos do harness PostgreSQL isolado PASS, quality/build e RSC/mobile PASS; Preview condicional SKIPPED. PR #55 permanece aberta/Draft, sem merge; PR #53/#54 abertas. O relatório final e a descrição da PR listam semânticas implementadas, quotas adiadas e bloqueios. Nenhuma migration remota, Preview, alteração de PROD ou dados foi executada. Não marcar IMPLEMENTED_LOCAL completo: retenção Auth pós-exclusão continua gate jurídico; convite individual, rename e delegação de colíder aguardam comandos/contratos específicos.

## 14/11/2026 — COMMUNITY-043B-TEST-1 readiness somente leitura

Relatório [RPG-COMMUNITY-043B-TEST-1-READINESS.md](../../docs/architecture/RPG-COMMUNITY-043B-TEST-1-READINESS.md). Estados atuais e CI exatos das PRs #53/#54/#55 confirmados. Supabase TEST identificado; as três migrations 043B não estão aplicadas. Quatro contas satisfazem predicados estáticos sem divulgar IDs/e-mails, mas login/sessão do operador não foi verificado. PROD permanece sem a nova RPC, flags e triggers. Preview do branch não existe, não há variáveis branch-scoped e o candidato retorna `eligible=false` no gate de isolamento; backup/PITR TEST não foi verificável pela integração disponível. Nenhuma escrita remota, merge, migration, ativação de flag ou deployment executado. Readiness documental preparado; smoke/TEST permanece BLOCKED nos gates do relatório.

COMMUNITY-043B-TEST-2 14/11/2026: local Preview diagnostics patch, 27 directed Node tests PASS, security gate unchanged. Report docs/architecture/RPG-COMMUNITY-043B-TEST-2-REPORT.md. Three owner-accessible TEST avatars have account creation quota already used; no eligible operator login available. Backup/PITR not verifiable through available connector/no explicitly supplied API credential. Activation and separate TEST Preview contract proposed, not implemented or executed. PR53/54/55 heads and existing CI confirmed. No remote writes, merge, migration, restore, activation or deployment. Local patch uncommitted; future SHA requires CI.
