# Fechamento das semânticas — 14/11/2026

**Implementação local em validação; sem migration remota, Preview, merge ou publicação.** O proprietário aprovou as semânticas de pedidos descritas abaixo. A aprovação não resolve a retenção jurídica do marcador de criação após exclusão/recuperação Auth.

- Migration local `20261114110000_community_043b_join_request_quotas_test.sql`: trigger privado na tabela existente. Até cinco pedidos persistidos por conta Auth em 24 horas móveis, somando avatares; cancelados/rejeitados continuam contando; replay de pedido pendente não cria nem conta outro; uma pendência por avatar/Guilda continua usando a unicidade existente. Cooldown de 24 horas após rejeição por avatar/Guilda. Trava compartilhada serializa concorrência e timestamps vêm do banco.
- Na aprovação, a autoridade atual do líder continua necessária; a migration também revalida que o avatar-alvo está ativo e que a conta está confirmada, não anônima, não excluída e não suspensa. Recusa aborta a transação e mantém o pedido pendente. A compra/convite não cria admissão automática.
- Quotas de membership e links já preparadas na migration anterior permanecem: até cinco associações ativas por avatar, 50 membros por Guilda, dez links ativos, 50 usos e sete dias para novos links. Hashes, datas, revogações e usos históricos não são reescritos; links históricos retêm o limite legado. Link revogado não admite novo uso.
- Convite individual (20/dia) e renomeação (7 dias) continuam adiados: os comandos não existem. Colíder permanece sem autoridade presumida; teste confirma negação em revisão da própria e de outra Guilda sem delegação. O código não contém um registro/API com operações granulares delegáveis; não foi criada permissão genérica que pudesse ampliar acesso. Fechar isso requer contrato explícito da lista de operações e fluxo de concessão/revogação.
- A retenção do marcador de uma Guilda criada por conta após exclusão/recuperação Auth segue pendente de decisão jurídica. Por isso, mesmo com checks aprovados, criação/rollout PROD não pode ser declarado completo.

**Checks desta revisão:** `node --check` e `git diff --check` PASS. O PostgreSQL descartável não pôde ser executado localmente: este worktree não tem o pacote `pg` nem o binário do PostgreSQL já instalado; nenhuma dependência foi instalada. A migration e os novos cenários foram ligados ao harness PostgreSQL que já é obrigatório no CI. O CI do novo SHA ainda precisa confirmar SQL, testes, lint, TypeScript e build. Os 35 cenários e os CI aprovados de `bd8703173b8aa9bf00c2b7cc9e7eb9cef16ab19a` são preservados e não são contabilizados como validação do SHA novo.

**Estado das PRs:** #53 e #54 permanecem dependências abertas; #55 permanece Draft e sem merge. Sem migration remota/TEST, Preview, alteração de dados, Auth/RLS ou PROD. Homologação TEST futura depende primeiro de resolver a sequência autorizada das PRs #53/#54 e dos critérios legais de retenção; a ausência de uma semântica granular de delegação também precisa ser resolvida antes de habilitar poderes de colíder.

# Quota audit and closure — 14/11/2026

Historical snapshot written before the owner approved request-consumption and cooldown semantics. The current state and remaining blockers are in “Fechamento das semânticas” above.

**PR55 remains Draft; no remote migration, Preview, merge, or production change.** CI on SHA `bd8703173b8aa9bf00c2b7cc9e7eb9cef16ab19a`: push [43533144941](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/43533144941) and PR [43533138363](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/43533138363) both **SUCCESS**. Tests/lint/types/build, PostgreSQL and RSC/mobile passed; conditional Preview job was **SKIPPED**, not PASS. The 35 earlier isolated PostgreSQL scenarios remain valid, and the new regression for approval at 50 members passed in the PostgreSQL CI job. It was not run locally: this worktree lacks `pg` and the execution policy rejected creating a temporary dependency junction.

## Existing command audit

| Approved quota | Existing authority/path | Current state |
| --- | --- | --- |
| 1 created Guild/account | `community_create_own_guild` and the existing governance audit | Enforced by the account-level creation ledger. Retention after Auth deletion/recovery is still a legal/policy decision; do not claim durable lifetime enforcement through account deletion. |
| 5 active memberships/avatar | All `guild_members` insert/reactivation paths | Enforced by private serialized trigger. |
| 50 active members/Guild | `review_guild_join_request` → `guild_admin_private.guild_command('review')` → membership insert; link acceptance also inserts membership | Enforced by the same trigger. Added a focused test that fills a Guild, attempts approval 51, and asserts the transaction rolls back while the request stays pending. |
| 10 active community links/Guild | `guild_scoped_create_invite` → `guild_invite_private.create_invite` | Existing server-side cap retained under advisory lock. |
| Link validity ≤30 days | Same community-link creator | New links retain the current seven-day expiry, within the approved maximum. Existing expirations are untouched. |
| 50 uses per new community link | `legacy_accept` consumes only on the existing direct membership acceptance path | Version-1 links cap at 50; NULL-version historical links retain their prior 100-use contract and rows are not rewritten. The separate question of counting pending-link requests does not apply to this existing direct-enrollment path; do not extend it to a future pending-link flow without product approval. |
| One pending request/avatar/Guild | `request_join_guild` → `guild_command('join')` | Existing partial uniqueness returns the current pending request without creating another. |

The audited individual invitation endpoint does **not** exist. `guild_scoped_create_invite` creates a reusable Guild link, while `ebd_member_invite_create` creates a separate class/EBD link invitation (currently with its own 100-use/active bounds). Applying “20 individual invites/Guild/24h” to either would change the wrong contract or invent a new recipient-based command; neither was changed.

The existing join-request path is `public.request_join_guild` (compatibility wrapper) and the scoped `guild_command('join')`; review is through `public.review_guild_join_request`. Current duplicate-pending handling is already present. The five-per-account rolling-day limit and 24-hour rejection cooldown remain **blocked** because the approved documents still label their consumption/refund and cooldown scope as proposals awaiting product confirmation. The existing migration exposes no Guild rename action: `guild_command` accepts only create/join/review/leave/remove. A seven-day rename cooldown cannot be attached until a separately authorized rename operation exists.

### Decisions and rollout gates still open

- Confirm request-quota semantics: count only a newly persisted request across all avatars on the Auth account, whether rejection/cancellation consumes quota, and how client retries identify the original request.
- Confirm rejection cooldown scope (proposed avatar/Guild pair) and the server timestamp/retention source; this is not currently enforced.
- Confirm the 50-use meaning for any future link flow that creates pending requests and whether revoking/expiring a link affects requests already submitted. The existing community-link command enrolls directly, so the current versioned counter is consumed only by successful membership and this change does not add a pending-link path.
- Decide whether a future invitation flow should be recipient-specific and how it differs from class/EBD links before applying the 20/day cap.
- Authorize/specify a Guild rename command before applying the one-per-seven-days quota.
- Obtain legal/privacy direction for retaining the lifetime creation marker after account deletion/recovery. No retroactive retention rule was added.
- PR53 and PR54 remain open. PR53 must be integrated and migration history checked before any remote migration. TEST migration, Preview, and authenticated smoke are a later authorized phase.

No Auth/RLS/ACL, ECONOMY-041, historical invitation rows, player data, production flags, or Vercel configuration changed. Directory, automatic admission, expanded admin permissions, and public rollout remain out of scope. **Do not mark IMPLEMENTED_LOCAL complete, merge, or publish while the listed controls and gates remain unresolved.**

---

# Quota completion update — 13/11/2026

Local implementation added in migration `20261113232954_community_043b_membership_link_quotas.sql` (explicit local/TEST opt-in only). One private database trigger now enforces at most five active Guild memberships per avatar and 50 active members per Guild across every existing membership insertion/reactivation path; the existing governance advisory lock serializes concurrent writes. New community links are marked quota version 1 and stop at 50 successful uses. Existing links remain `NULL` version and preserve token hash, dates, revocations and use records; they keep the prior 100-use behavior. New links retain the existing seven-day lifetime, below the approved 30-day maximum. The existing 10-active-link limit and one-pending-request-per-avatar/Guild constraint were already enforced and remain unchanged.

The focused disposable PostgreSQL harness now reports **35/35 PASS** (the previous 25 plus 10 quota, compatibility, ACL and concurrency checks). It verifies historical link preservation, 50-use boundary/replay, legacy 100-use behavior, five-membership and 50-member limits under concurrency, slot release, private trigger execution and preservation of existing function ACLs. ESLint and Prettier for the modified harness pass. Full TypeScript typecheck passes after a temporary local path mapping to this worktree's workspace packages; the mapping was removed. Local Turbopack build was attempted but stopped before compilation because the reused `node_modules` junction is outside Turbopack's filesystem root. The temporary Next patch and generated/config changes were restored. The updated SHA's mandatory CI build remains the final build gate.

Not inferred/implemented: the five-requests-per-account daily limit and 24-hour rejection cooldown still require the unresolved consumption/refund semantics; there is no matching individual Guild-invite command to safely attach the 20-per-day quota (EBD/class invitations are a separate contract); no Guild rename command exists for the seven-day cooldown. No new UI or permissions were added for absent commands. Creation authority/flags remain closed for PROD. No remote migration, Preview, merge, deployment or player-data write was performed. PR53 remains required before any remote migration; account deletion/recovery retention for the one-Guild-per-account marker remains a legal/policy blocker for rollout.

**PR55 remains Draft.** Updated CI for the new candidate is pending. TEST/Preview and PROD remain untouched.

---

# COMMUNITY-043B-IMPL-1 — criação controlada local

13/11/2026. **VALIDATING / incremento local preparado; sem publicação.** Branch `codex/rpg-community-043b-impl-1`, base `724f0e76`. Contratos B.1/B.2 consultados no commit documental `95e6196f34908d52620b12e9f55444a847337f8d` da PR54, sem integrar essa PR ou a PR53.

- Autoridade específica `community_create_own_guild`: reutiliza identidade, ownership, revogação, trava de governança e ledger existentes; confere conta confirmada/não suspensa, sessão ainda existente e avatar próprio ativo. Guilda, líder e auditoria são atômicos. Replay mantém resultado e payload divergente é negado. Criação prévia por qualquer avatar da conta impede outra; quinta participação pode ser criada, sexta é negada.
- Não substitui `create_guild`, comandos administrativos, funções/ACLs existentes ou fontes econômicas. Nenhum grant global é emitido. Dois controles privados desligados por padrão e o marcador TEST `release_scope` negam uso em PROD. A rota ativa `ReleaseGuild/GuildCommunity` reutiliza formulário e intenção persistida; a opção nova requer chave de interface TEST e backend TEST. A chave não substitui autorização no banco.
- A quota de criação usa o ledger de governança já existente, sem criar tabela de marcador ou estabelecer nova retenção. **Isso não resolve a política jurídica de exclusão/recuperação Auth.** Produção permanece bloqueada para essa decisão. Casos históricos sem identificação comprovável também requerem preflight específico.
- Quotas numéricas aprovadas preparadas em `community_quota_contract`; criação/account e limite de participação durante criação possuem enforcement. **As quotas adicionais de convites, pedidos, capacidade em aprovações e renomeação ainda não foram integradas aos comandos existentes.** Convites históricos não foram reescritos. Delegações novas e diretório não implementados.

**Evidência local:** 25 cenários PostgreSQL isolados PASS; 14 unitários direcionados PASS (6 novos/8 existentes); lint afetado, TypeScript e build Turbopack com gates de artefatos PASS. Corridas, revogação durante lock, rollback por erro de auditoria, replay, quinta/sexta membership, avatar alternativo da mesma conta, sessão revogada, ACLs, escopo PROD negado e preservação de dados econômicos/funções anteriores cobertos. Não é smoke hospedado. Logs privados em `build/community-043b-impl-1`. Falhas preparatórias: Python ausente, aspas/delimitador SQL no novo harness e helpers não utilizados; corrigidos apenas preparação/teste, sem relaxar assertions. A integração inicialmente preparada na tela antiga foi transferida à rota ativa antes do candidato final, restaurando a tela antiga.

Dependências reaproveitadas por junction temporário, lockfiles idênticos; nenhuma dependência de projeto instalada. Build usou `turbopack.root` temporário para resolução do junction; configuração, arquivo gerado e patch compartilhado do Next restaurados depois. QA/Security pelo autor, sem independência.

**Migrations:** `20261113215415_community_043b_controlled_creation_test.sql`, gerada pela CLI2.122.0 e aplicada somente em cluster local descartável. CLI temporária obtida do release oficial com digest SHA-256 conferido, sem instalação de dependências de projeto. Exige opt-in explícito e marcador TEST antes do DDL. Nenhum pacote PROD preparado. PR53 continua obrigatória antes de qualquer migration remota; PR54 documental preservada. Nenhuma migration remota, grant remoto, dado de jogador ou variável Vercel foi alterado.

**Recuperação:** desligar `community_creation_enabled` no controle privado sob a mesma trava; preservar ledger e novas Guildas. Pacote em `packages/database/proposals/community-043b-recovery-empty.sql.in`. Recuperação vazia/reinstalação, recusa com histórico e contenção preservadora ensaiadas localmente. Não executar downgrade destrutivo ou apagar auditoria.

**Git/CI:** [PR55 Draft](https://github.com/CarlosJr30/rpgjovemcristao/pull/55) aberta; candidato `740315adc6da177aa2536513a8f13fb2d91d423b`, [CI43515907322](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/43515907322) success no SHA exato: 1218unit PASS/74SKIP, qualidade/PG/RSC/móvel PASS; Preview condicional SKIP. O projeto mantém `apps/web/vercel.json` com `**: false` e `main: true`; o job condicional de Preview também não aceita esta branch. PR53 permanece aberta em c98638a e PR54 aberta em95e6196. Deployment Vercel anterior permaneceu dpl_5VvSi4LELKSCCke3ogRGRVSa3sz6; nenhum novo deployment. Não executar merge. A tag de backup aprovada continua em `3cfa561ab4cd76d86e89e9757d31ad3e11d504e1`.

**Pendências reais:** quotas adicionais nos comandos existentes e revisão final do pacote; resolução autorizada da PR53, TEST/Preview e smoke autenticado futuros; política de retenção antes de qualquer rollout PROD. **Não IMPLEMENTED_LOCAL completo, DONE ou DEPLOY_COMPLETE.** Fechamento documental local separado, sem novo CI ou deploy artificial.

O job de qualidade do CI `43515401651` no candidato `d98fea4` falhou em um teste antigo de foco de revenda: 1217 PASS/1 FAIL/74 SKIP, sem alterar runtime econômico. A assertion aguardava a mensagem, mas não a atualização de foco por efeito. Ajustada somente a sincronização da mesma assertion com `waitFor`; esse único teste afetado passou localmente, com lint/formatação. Total direcionado: 15 casos distintos, incluindo esse teste existente; não é teste transacional novo. A falha anterior permanece registrada; o candidato corrigido passou no próprio CI indicado acima.

## CI fixture correction — 14/11/2026

Runs `43549606124`, `43550327860`, `43550697653`, and `43551086971` failed and remain recorded as failures. The first three exposed, in sequence, an invalid duplicate-active-avatar setup/restoration order, a missing `FROM pg_proc`, and an inactive target in the revoked-link test; the latter was changed to a separate active disposable avatar. The fourth passed the new quota tests but an older historical-use fixture selected multiple memberships for the same avatar, producing duplicate invitation/avatar rows. The setup query now chooses one existing membership per avatar with `DISTINCT ON`. These are harness/assertion issues, not application runtime failures or PASS results for the failed runs. Syntax, Prettier, and diff checks pass. New-SHA CI is pending; no remote database or player data changed.
