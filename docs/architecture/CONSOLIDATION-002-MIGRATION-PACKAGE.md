# Consolidação 002 — pacote SQL e mapa do banco

Preparação local validada sobre `a0c6639791476d167ca48d5bd76a487ed481cfad` (fechamento 001). Não altera SQL, IDs, journal, economia ou históricos anteriores. **Não é autorização de instalação hospedada.**

## Receita congelada e reprodução

O [lock revisado](../../packages/database/reviewed/consolidation-002.lock.json) contém os caminhos completos, SHA256, tamanho, blob Git, ordem e situação no journal de cada fonte. A única normalização é UTF-8 sem BOM e CRLF para LF. Não há transformação de instruções SQL.

| Ordem | Arquivo existente | Registro e dependência |
| --- | --- | --- |
| 1 | 0000_initial_supabase_gameplay.sql | Drizzle; Auth, pgcrypto/roles previamente disponíveis |
| 2 | 0001_guild_supabase_v1.sql | Drizzle; Traveler e Guilda |
| 3 | 0002_traveler_chests.sql | Drizzle; Traveler/carteira/inventário |
| 4 | 0003_guild_mission_chest_rewards.sql | Drizzle; missões/baús |
| 5 | 0004_guild_leader_panel.sql | Drizzle; painel e progressos |
| 6 | 0005_guild_lessons_and_schedule.sql | Drizzle; aulas e agenda |
| 7 | 0006_traveler_journey_progress.sql | Drizzle; Traveler |
| 8 | 0007_guild_chat.sql | Drizzle; membros, mensagens/moderação |
| 9 | 0008_guild_chat_commit_order.sql | Drizzle; ordem do chat |
| 10 | 20261019054314_guild_link_invites.sql | Versionado, fora do journal Drizzle; Guilda + pgcrypto |
| 11 | task0081-story-progress.sql | Proposta não registrada; Auth/Traveler; independe de Guilda |
| 12 | task0082-guild-missions.sql | Proposta não registrada; baseline + convites 0080 |
| 13 | task0083-guild-ebd.sql | Proposta não registrada; missões 0082 + aulas anteriores |

As nove primeiras estão em `packages/database/migrations/`; a décima também, sem entrada no `_journal.json`. As três últimas estão em `packages/database/proposals/`. A ordem acima foi efetivamente instalada no ensaio cumulativo. 0081 não depende de 0082/83; a sequência fixa facilita a auditoria. 0084–89 não acrescentam SQL. Os arquivos econômicos 0009/0010 pendentes na raiz e as sete pendências 0080 não foram importados.

Na raiz deste checkout, executar somente localmente:

```powershell
node scripts/database/prepare-test-db-package.mjs
node --test scripts/database/prepare-test-db-package.test.mjs
node --test packages/database/tests/consolidation-002.postgres.test.mjs
```

O último comando usa a distribuição WSL e a imagem PostgreSQL já disponíveis; não instala dependências ou baixa imagem. Não executar sem esse ambiente. Ele cria somente um banco descartável offline, instala as cópias e depois encerra seu próprio contêiner. Os stubs Auth/roles/identidades/aula sintéticos pertencem ao teste, nunca ao pacote SQL ou a Supabase hospedado.

Saída local: `build/task-consolidation-002/db-package/` **neste checkout**, com 16 arquivos: 13 SQL, journal original, manifesto e README. Identidade `85cf7ba4c743f74f0f1561d6862e953d713b112820c783698e116fda38555591`. O ZIP de entrega fica em `D:/rpg-jovem-cristao/build/task-consolidation-002/db-package-85cf7ba4.zip`, SHA256 `25c3bac35aeddf236c8db394daf3d6cea9fec60c0bc31afcad78c637042f67b6`. A verificação confere os bytes de todas as entradas, o manifesto e o README; recusa fonte alterada, saída diferente, arquivos extras, travessia e links/junctions de saída, sem apagar ou sobrescrever divergências. O comando não aceita alvo remoto ou modo apply.

## Inventário efetivo após a instalação limpa

O teste gera `build/task-consolidation-002/catalog-audit.json` **dentro do checkout**, antes das identidades e aulas sintéticas. SHA256 `73eee44a4cd12a817aa770d1a8ca4ffc4042f6e8f1c96c1cede897c1525a9451`. É o mapa completo por objeto: colunas/tipos/nullability, 227 constraints (113 CHECK, 32 PK, 15 UNIQUE e 67 FK), 77 índices com definição, 39 políticas com roles/USING/WITH CHECK, 73 funções com assinatura/definer/search_path/EXECUTE e 44 grants de tabela aos papéis de API. Todas as 32 tabelas inventariadas têm RLS habilitada. As funções se dividem em 55 DEFINER e 18 INVOKER. Esses números descrevem o banco offline; não presumem ACL/configuração do futuro Supabase.

O [SQL de inspeção](../../packages/database/reviewed/consolidation-002.inspect.sql) reproduz a consulta estrutural já executada, em transação READ ONLY com ROLLBACK. Não integra as 13 migrations, não aplica DDL e não consulta linhas de usuários. Sua execução remota continua dependente de alvo isolado confirmado e autorização.

| Área | Tabelas efetivas |
| --- | --- |
| Conta/Avatar/posse | public.profiles, travelers, traveler_stats, inventory, equipped_items, wallets |
| Baús/recibos legados | public.traveler_chests, chest_operations, guild_reward_claims |
| Guilda/entrada/auditoria | public.guilds, guild_members, guild_invites, guild_join_requests, guild_activity_log; guild_invite_private.link_invites |
| Chat | public.guild_chat_messages, guild_chat_reads, guild_chat_reports, guild_chat_moderation_log |
| Missões | public.guild_missions, guild_mission_progress, guild_mission_attempts |
| Aulas/EBD | public.guild_lessons, guild_ebd_teachers, guild_ebd_activities, guild_ebd_answers, guild_ebd_attendance, guild_ebd_history, guild_ebd_reward_pending |
| História | public.story_definitions, story_progress; story_private.step_receipts |

As constraints preservam ownership/FKs, unicidade de posse/equipamento e operation_key, estados/revisões/públicos de missões/aulas, tentativas/choice/answer_key e recibo por ator/história/revisão/etapa. Os índices abrangem chaves, consultas por Guilda/ator/estado e convites ativos. Não se criou índice, seed de lição ou ID de jogador para satisfazer instalação. O inventário JSON mantém todas as definições, sem resumir uma policy a “RLS ligado”.

## RPCs, grants, RLS e cutover

| Superfície | Resultado e limite |
| --- | --- |
| QR 0080 | Wrappers públicos INVOKER chamam implementações privadas DEFINER com identidade/ownership/líder atual. Apenas preview limitado pode ser anônimo. Token bruto não é persistido no inventário/log; tabela privada sem leitura direta. Solicitação gera pending, sem membership ou liderança automática |
| Missões 0082 | save/transition/act/review_v2/workspace verificam ator, Guilda, público, estado, revisão e request_id; aprovação não paga economia. Attempts/progress não recebem mutations diretas do cliente |
| EBD 0083 | guild_ebd_command/workspace públicos INVOKER; ebd_ops privado com DEFINER e search_path vazio. Professor depende de concessão por Guilda e permissões; criação/publicação/resposta/presença/histórico/pendência não confere poder de líder. Aluno não lê answers diretamente; gabarito omitido antes da resposta, revelado após conclusão conforme contrato existente |
| História 0081 | complete_story verifica conta/ator, dependências, etapas e recibos privados, com lock/idempotência; não depende de aprovação do líder. Definições começam com flags false. Sem vídeo/conteúdo/validador autorizado, continua bloqueada e não paga recompensa |
| Isolamento | Novos schemas privados fora da exposição PostgREST; grants de EXECUTE necessários ao wrapper não autorizam expor schema. Tests com roles não administrativas, duas Guildas e sete atores sintéticos verificam negativas e saldos/XP invariantes |
| Economia herdada | UPDATE próprio de wallets/XP permanece; funções legadas de concessão e tabelas de posse exigem hardening/cutover 0078. RLS habilitada não fecha esse P1. A reprodução com rollback da 001 e o grant ainda presente na 002 são diagnóstico, não aprovação |

Onze mutations antigas de missão/aula ficam sem EXECUTE para anon/authenticated após 0082/83: `create_guild_mission`, `update_guild_mission_draft`, `delete_guild_mission_draft`, `publish_guild_mission`, `close_guild_mission`, `start_guild_mission`, `submit_guild_mission`, `review_guild_mission`, `review_guild_mission_with_guidance`, `save_guild_lesson`, `set_guild_lesson_status`. Assinaturas e grants estão no catálogo; o teste cumulativo 001 verificou as onze. Não religá-las para contornar erro de frontend. Não remover por suposição as policies de missões ainda usadas para SELECT; conferir grants, comandos e USING/WITH CHECK juntos.

O teste novo parte de privilégios padrão restritivos (sem grants automáticos de tabela/sequência e sem EXECUTE público automático). Os grants explícitos do SQL bastaram para os fluxos ensaiados. Isso não valida defaults, Auth, REST/JWT, exposição de schema ou e-mail reais do provedor. O [plano remoto](CONSOLIDATION-002-ENVIRONMENT-AND-AUTH.md) mantém esses gates.

## Aplicação e recuperação futuras

1. Confirmar alvo novo/vazio, ref/host/região/plano e separação de produção, extensões/roles/Auth/publication gerenciados e ambos os históricos de migration. Não criar stubs de auth.users/uid/jwt no provedor. Em alvo não vazio, reconciliar objetos/hashes/históricos antes; CREATE existente não é idempotência geral.
2. Resolver o gate econômico para o perfil de exposição aprovado, selecionar SHA/CI, snapshot/exportação autorizada e manifesto congelado. Esta receita não registra propostas como aplicadas nem substitui ferramentas de histórico. Escolher explicitamente a estratégia Supabase/Drizzle antes da operação autorizada, sem duplicar execução.
3. Aplicar em ordem somente com autorização específica. Respeitar BEGIN/COMMIT próprios das propostas; envolver os demais por transação controlada. Interromper no primeiro erro e registrar sucesso/falha por etapa e checksum, sem retries cegos.
4. Antes do commit, ROLLBACK desfaz a etapa malsucedida; o ensaio 001 já demonstrou rollback QR. Depois do commit, suspender o módulo afetado e preservar linhas/recibos/evidências. Fazer correção incremental revisada, sem DROP/down destrutivo, restauração por cima ou reativação de RPC revogada. Backup isolado só se plano comprovar preservação de dados novos.
5. Conferir inventário pós-DDL e negativas com JWT/roles reais antes de conectar testadores. Nenhum serviço de banco/Auth/REST hospedado foi alterado por esta tarefa.
