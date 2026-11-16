# RPG-COMMUNITY-043B-TEST-1 — prontidão para homologação

**14/11/2026 — Preparação somente leitura concluída; homologação ainda BLOCKED.** Nenhuma PR foi integrada, migration remota aplicada, Preview criada, flag ativada ou Guilda criada nesta etapa. PROD e dados de jogadores permaneceram sem escrita.

## PRs, SHA e CI

| PR | Estado remoto | Head | CI no SHA exato | Escopo/impacto |
| --- | --- | --- | --- | --- |
| [#53](https://github.com/CarlosJr30/rpgjovemcristao/pull/53) | Aberta, não Draft, não integrada | `c98638aecec0ff37db1ad3b933b3dbc12992d036` | `43458777891` SUCCESS | Alinha o nome/manifesto da migration ECONOMY-041 já aplicada em PROD; sem mudança funcional esperada. |
| [#54](https://github.com/CarlosJr30/rpgjovemcristao/pull/54) | Aberta, não Draft, não integrada | `95e6196f34908d52620b12e9f55444a847337f8d` | `43488443489` SUCCESS | Somente documentos de contrato COMMUNITY-043. |
| [#55](https://github.com/CarlosJr30/rpgjovemcristao/pull/55) | Aberta, Draft, não integrada | `f3e9ed19d3702b4064a3ad19e7b7e4502fa7e3f0` | `43553123476` SUCCESS | Implementação controlada e migrations locais TEST-only. 1.218 unit PASS / 74 SKIP; 45 cenários PostgreSQL isolados PASS; qualidade/build e RSC/mobile PASS. Preview condicional SKIPPED, não PASS. |

PRs #53 e #54 têm base `724f0e76`; PR #55 também se baseia nesse main. Ordem proposta para uma etapa autorizada: **integrar #53 → confirmar main e deployment automático → integrar #54 → confirmar main e deployment automático → atualizar/rebasear #55 e rodar novamente CI no novo SHA → continuar o preflight TEST**. Cada merge em `main` pode iniciar deployment automático da Vercel; não fazer deploy manual duplicado. Esta etapa não integra nenhuma PR. A tag remota `backup/rpg-equipment-fix-014-aprovado-2026-11-11` existe e aponta para `3cfa561ab4cd76d86e89e9757d31ad3e11d504e1`.

## Migration history e dependências

- O Supabase **PROD** é `RPGJOVEMCRISTAO` (`wspafhlbtlpabypzymjo`, ACTIVE_HEALTHY). O histórico remoto contém a migration ECONOMY-041 `20261113153902_economy_041_production`.
- O Supabase **TEST** é `rpgjovemcristao-test` (`wkdvdzfkbwvhyjmamrsg`, ACTIVE_HEALTHY, sa-east-1). O histórico inclui ECONOMY-041 TEST `20261111100618` e fixtures posteriores, mas **não contém nenhuma migration COMMUNITY-043B**.
- A versão atual da branch #55 ainda guarda ECONOMY-041 no caminho antigo `20261111063736`. O blob Git dessa versão, o arquivo renomeado no head remoto #53 e o SQL do manifesto PROD têm conteúdo SHA-256 idêntico: `1f377a035c68cde8921909536820a2e8fe3cc8d9c6b4d3c8dafe8901c6609ad0`. A leitura remota PROD confirma `20261113153902`; portanto #53 deve entrar antes de qualquer futura migration comunitária. A migration PROD não foi reaplicada.
- Migrations candidatas na ordem local de TEST — não aplicadas remotamente:

| Versão/arquivo | Finalidade e guarda | SHA-256 do blob do candidato |
| --- | --- | --- |
| `20261113215415_community_043b_controlled_creation_test.sql` | Acrescenta controles e autoridade de criação própria; exige `rpg.community043b.install=local-test` e `release_scope()='hero-equipment-006'`; os novos campos têm defaults fechados (`false`/`disabled`). | `bba81f315579d2992264aa2a01f22cd8590f581e167fcc1e5f4ab0c38415cc43` |
| `20261113232954_community_043b_membership_link_quotas.sql` | Enforcement de capacidade e quota dos links novos; exige guarda `rpg.community043b.quotas_install=local-test` e baseline anterior. | `7f2b995a3989067c09f82c174e04b11cc386e799d7aa63967712fd0063dee012` |
| `20261114110000_community_043b_join_request_quotas_test.sql` | Enforcement dos pedidos e cooldown; exige `rpg.community043b.request_quotas_install=local-test` e baseline verificado. | `1a15efc5b4f6d42803bc38586a12a0098bc973fe1ddc77aed76834abb2e11635` |

Não usar `db push` até #53 estar integrada e o histórico TEST ser novamente comparado. As guardas locais não constituem, por si, procedimento aprovado de instalação remota; escolher uma execução que preserve o GUC transacional exige validação explícita antes da aplicação.

## Snapshot TEST sem dados pessoais

Leitura somente de metadados em 14/11: 17 avatares/8 contas; 9 Guildas, 18 memberships e 10 pedidos. RLS habilitado em `guilds`, `guild_members` e `guild_join_requests` (três policies observadas nessas tabelas). Não foram lidas nem registradas linhas pessoais, e-mails ou IDs de contas.

As rotinas administrativas atuais permanecem separadas: os RPCs públicos existentes `create_guild`, `request_join_guild` e `review_guild_join_request` são `SECURITY DEFINER` e têm `EXECUTE` para `authenticated`/`postgres`; `guild_admin_private.guild_command` também permanece com essa ACL, enquanto `require_writes` só admite `postgres`. Isso não transforma um jogador em administrador global: as verificações internas existentes seguem responsáveis pela autorização.

No TEST, `guild_admin_private.multiguild_control.writes_enabled=true` (revisão 3), mas os campos específicos de criação ainda não existem. `community_create_own_guild`, o helper de criação e ambos os triggers das quotas COMMUNITY-043B estão ausentes. O `release_scope()` atual retorna `hero-equipment-006`. Em PROD, somente leitura confirmou que a nova RPC, os dois campos de controle e o trigger de pedidos também estão ausentes; PROD permanece sem esta funcionalidade.

Consulta agregada encontrou **quatro contas e quatro avatares ativos** que, no snapshot, satisfazem os predicados estáticos de criação: conta não anônima/confirmada/não excluída/não suspensa, avatar ativo e não revogado, sem criação anterior registrada para a conta e abaixo de cinco memberships. Isso não identifica qual conta o proprietário ou operador controla, não comprova sessão/login disponível e precisa ser reavaliado depois da instalação. Não registrar e-mail ou UUID aqui. O avatar `Teste Chat A` de PROD não é candidato para TEST.

## Preview — mecanismo e bloqueios atuais

- Projeto Vercel `rpgjovemcristao-web`, ID `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`; SSO está habilitado para deployments, padrão `all_except_custom_domains`.
- `apps/web/vercel.json` permite deployment Git automático apenas para `main`; demais branches estão desativadas. Não há deployment para `codex/rpg-community-043b-impl-1`, e a consulta de variáveis por essa branch não retornou configuração específica. Valores não foram descriptografados.
- Há workflow oficial de Preview imutável, mas exige push em `preview/*` ou `codex/pinned-preview-ci`, run inicial, sucesso do job de qualidade, variável `RPG_PINNED_PREVIEW_ENABLED=true` e secrets no ambiente protegido `preview-deploy`. O script valida SHA/repositório/projeto/host e não repete POST de deployment. O status dessa variável/secrets não é legível pelos conectores usados.
- **Bloqueio adicional confirmado:** o teste local `node scripts/ci/demo-isolation.mjs` no candidato #55 retorna `eligible=false`. O workflow usa a mesma verificação; o candidato não satisfaz o gate dos blobs de isolamento revisados. Portanto apenas criar uma branch `preview/*` não torna este SHA elegível. Não contornar o gate nem editar `vercel.json`. Uma etapa futura precisa de um mecanismo Preview TEST aprovado que preserve o isolamento revisado, ou de uma atualização autorizada e revisada desse contrato. Também é necessária configuração de variáveis públicas TEST estritamente escopadas à Preview/branch; nenhuma variável foi alterada.

Mesmo com a Preview, a UI exige `NEXT_PUBLIC_COMMUNITY_CREATION_TEST=1` e URL TEST. No banco, a migration deixaria a feature desativada por padrão. Não foi encontrado um RPC estreito para ativar os novos campos privados; a forma de ativar **somente TEST** precisa ser especificada e aprovada, sem UPDATE ad hoc nesta tarefa.

## Smoke autenticado futuro

Depois de dependências, migrations, backup, Preview e ativação TEST aprovados:

1. Entrar normalmente na Preview protegida com uma conta TEST autorizada e selecionar um avatar próprio entre os candidatos que continuarem elegíveis.
2. Confirmar backend TEST, flag somente TEST e ausência de acesso a PROD.
3. Registrar baseline agregado de guilds, memberships, auditoria e tabelas econômicas pertinentes; não copiar dados pessoais.
4. Criar uma Guilda de teste com nome único e identificável. Verificar Guilda, membership `leader` e evento de auditoria ligados somente à conta/avatar autorizados.
5. Repetir a mesma solicitação com o mesmo request ID: deve retornar replay sem segunda Guilda. Reusar o ID com payload diferente deve ser negado.
6. Confirmar que não existe diretório público/adesão automática e que nenhuma economia, XP, carta, equipamento ou recurso foi alterado.
7. Manter a Guilda e a auditoria como registros de teste. **Não apagar** a Guilda para “restaurar” o baseline.

Esse smoke ainda não ocorreu. A criação real em TEST exige autorização da etapa de homologação e designação de operador/conta com login normal.

## Recuperação e proteção de menores

- Não foi possível comprovar um snapshot/PITR restaurável: a integração de leitura Supabase disponível informa identidade/saúde/migrations, mas não expõe referência, data ou ensaio de restore. Antes de DDL remota, o operador deve confirmar backup gerenciado/PITR aplicável, janela e caminho de recuperação no painel oficial. Até isso, aplicação SQL permanece bloqueada.
- Em incidente, interromper novas criações e desativar a feature flag/controle privado por procedimento autorizado, preservando Guilda, memberships, ledger de governança e auditoria. Recuperação não deve excluir dados. O pacote `community-043b-recovery-empty.sql.in` aborta se já existir evento de criação e só serve à instalação vazia descartável; não é rollback de TEST com histórico.
- Reverter código não reverte migrations nem transações. Não aplicar `DROP` nem restaurar snapshot depois de atividade sem análise de compatibilidade e autorização específica; preferir contenção e correção forward. Guildas e memberships criadas devem permanecer preservadas.
- Diretório público, descoberta geral, adesão automática, chat global/privado irrestrito e abertura pública continuam fora de escopo. Revisão jurídica/operacional para menores e retenção do marcador após exclusão/recuperação Auth seguem pendentes; convite individual, rename e delegação granular de colíder também não estão implementados.

## Gates ainda necessários

1. Integrar #53 pelo fluxo normal e confirmar o histórico/SQL, sem reaplicar ECONOMY-041; depois integrar #54. Ambos os merges podem gerar deploys automáticos em PROD.
2. Atualizar/rebasear #55, verificar CI no SHA novo e manter feature flags fechadas em PROD.
3. Resolver o gate de isolamento do pinned Preview, preparar variáveis branch-scoped TEST e validar backend/SSO/READY sem expor valores.
4. Confirmar recuperação Supabase TEST verificável; instalar as três migrations na ordem, só após preflight do histórico e validação do mecanismo do GUC.
5. Definir autorização operacional para habilitar o controle privado apenas em TEST e designar uma conta/operador elegível com sessão normal.
6. Executar uma única homologação autenticada conforme o plano acima e documentar evidência real. CI, SQL isolado e fixtures não substituem esse smoke.
7. Revisão legal da retenção antes de qualquer rollout PROD; esta prontidão não autoriza produção.

## Resultado desta preparação

READINESS documental concluído para o preflight conhecido; **TEST e rollout continuam BLOCKED**. PRs, migrations, Vercel, flags e dados ficaram sem escrita. Não houve smoke, CI novo, aplicação SQL ou deployment nesta tarefa. `git diff --check` passou para a revisão documental; `node scripts/ci/demo-isolation.mjs` foi usado somente como verificação local e retornou `eligible=false`.
