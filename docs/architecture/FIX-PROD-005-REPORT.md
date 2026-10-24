# FIX-PROD-005 — integração da Torre e bloqueios de produção

Data:24/10/2026. Estado geral **BLOCKED**: a integração transacional avançou, mas não há aceite para produção. Não há DEPLOY_COMPLETE.

## Estado inicial e preservação

Lidos política de publicação, contexto/memória, contrato e FIX-PROD-004. Confirmados os commits456f8fb0b8f92b87b8f756703d1fadbc2a90a144/e997afe233f1b3782253820ff6971421eaf6126f; worktree isolado `C:/Users/carlo/rpg-worktrees/fix-prod-005`, branch `codex/fix-prod-005`, basee997afe. Alterações do workspace principal, outros worktrees, dados e resultados aprovados preservados. Não se procurou um FIX-PROD-001 inexistente nem se repetiram migrations antigas.

Produção inicial: GitHub main e Vercel no SHA5edc93f5857b26a59b183e8abfb963110831f90c; deploymentdpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv READY. Supabase produtivo `wspafhlbtlpabypzymjo`: protocolo3,4migrations, última20261023213654,20Viajantes/37inventário/37recibos/0batalhas/0cartas; totais245376XP/1006767moedas e20legados não verificados. Projeto de testes separado `wkdvdzfkbwvhyjmamrsg`:21migrations,18batalhas encerradas,20recibos,18inventário,16XP/6moedas. Estes16/6 de testes possuem histórico próprio e não explicam os16/6 produtivos.

## Resultado por item

| Item | Estado | Evidência e limite |
| --- | --- | --- |
| Integração transacional da Torre | DONE no candidato e em testes | XP/nível/carteira/baú fechado/claim/recibo/encerramento na transação do comando final; política disabled e nenhuma aprovação ou crédito real. |
| Contrato430XP/215moedas/um baú épico | DONE como implementação bloqueada | Valores propostos por andar preservados; primeiro pagamento por Viajante/versão/andar; sem bônus adicional de moedas; homologação continua BLOCKED. |
| Atomicidade, concorrência, segurança e recuperação | DONE nos testes executados |37PG PASS:28regressões da autoridade/Auth/RLS,8Torre e1recuperação exata com CRLF. Não equivalem a vitória hospedada com fixture legítima. |
| Origem econômica16XP/6moedas | BLOCKED | Origem administrativa e estoque confirmados no004; novos logs rastreiam escritas, mas faltam payload e evento autoritativo para certificar o delta. Não houve alteração de saldo ou verified. |
| Vitórias hospedadas2–7/campeão | BLOCKED | Nova tentativa legítima no2 terminou em derrota; outra identidade foi derrotada no1. Não há acesso legítimo aos andares3–7; vitórias offline não substituem este aceite. |
| Equipamentos visuais | BLOCKED | Registro mantém quatro camadas aprovadas para short/moss/medium; alvo female/escuro/longo/azul não tem composição aprovada compatível. Não se declarou aprovação humana nem alterou aparência do jogador. |
| Equipar/desequipar/persistência/atributos | DONE nos fluxos executados |14checks de navegador no Preview atual, desktopChromium1440 eWebKit390, com botas já possuídas e API/banco reais. |
| Troca por outro item / visual completo / celular físico | BLOCKED | Não há segundo item alternativo legitimamente possuído para testar a troca na UI; camadas compatíveis e aparelho físico ausentes. Emulação não foi apresentada como teste físico. |
| Teste Chat A / liderança / Guilda / EBD | BLOCKED | Ativo nível50 permanece membro; getUser da sessão alvo inacessível por falha do CUA. Nenhuma promoção administrativa, auditoria fictícia ou modificação do avatar antigo. |
| GitHub/CI/Preview | DONE para candidato | da07a86 enviado; CI40058214730 success; Preview exato READY. Não implica aceite produtivo. |
| Produção | BLOCKED para nova publicação | Gates econômicos, positivos hospedados, visual e identidade não resolvidos. Produção anterior preservada. |

## Causas e correção implementada

A Torre já tinha motor, progressão e recibo de resultado, mas o ramo SQL apenas produzia zero créditos bloqueados. A migration nova acrescenta `economy_private.tower_reward_policies`, `tower_reward_claims` e helper privado `settle_tower_battle`, chamado apenas pelo ramo Torre da RPC existente. A Arena conserva seus valores, limites e conflitosHTTP409. O cliente continua enviando ações e IDs; não envia resultado, valor, aprovação ou saldo.

A política proposta nasce false, sem catálogo/data/referência de aprovação. As tabelas têm RLS, sem acesso direto por anon/authenticated/service_role; o helper só permite execução ao owner. A RPC pública permanece exclusiva do servidor. A concessão futura exige conta não anônima, propriedade, reconciliação, resultado canônico encerrado, catálogo correspondente, batalha iniciada após aprovação e andares anteriores vencidos. A identidade de primeira vitória independe da versão da tabela e do battleId, vinculando conta, batalha, política e recibo. Derrotas e repetições não pagam. Vitórias antigas bloqueadas não geram backfill automático; sua política ainda precisa de decisão explícita.

Valores por andar:20/30/40/50/60/80/150XP;10/15/20/25/30/40/75moedas. Apenas andar7 acrescenta um baú épico fechado. A consulta de progresso mantém rewardStatus blocked conservador; ativação futura requer revisão de contrato/apresentação e homologação, não somente mudança de flag.

## Investigação econômica em leitura

Baseline administrativo TASK-0077:245000XP/999999moedas;28aberturas somam7160moedas e5compras custam900. Atual245016XP/1006265moedas, contra1006259 contabilizados. Quantidades de inventário e baús reconciliadas no004 foram preservadas. Marca economic_verified_at continua NULL; não se fabricaram recibos nem account_id para34operações legadas.

Logs históricos do Supabase recuperados entre15/10 19:30Z e16/10 04:10Z mostram sete PATCH204 de travelers filtrados pelo ID/UID do alvo e um POST200 em add_coins. Exemplos rastreáveis: PATCH16/10 04:07:36.520Z, request01a142e4-d948-7f92-b7e8-e3536462ca8f; add_coins04:07:36.830Z, request01a142e4-da7e-7631-9306-e8c309ac8aae. Wallet.updated_at é04:08:38.985684Z; Traveler.updated_at19/10 03:58:58.409696Z pode refletir outros campos. Metadata não contém valores anteriores/posteriores ou recibo canônico de batalha. Portanto não comprova duas vitórias8XP/3moedas. Produção possui zero batalhas no ledger atual. Evidência sanitizada privada: `build/fix-prod-005/economic-legacy-trace.json`; consulta004 continua somente SELECT. Para desbloquear é necessária fonte autoritativa ou procedimento administrativo auditado aprovado para tratar o delta preservando o saldo original.

## Migration, backup e segurança

CI aprovado antes da DDL. Aplicada **somente em testes** `fix_prod_005_tower_settlement`, journal remoto **20261024032756**; corresponde ao arquivo local20261024025957, não deve ser reaplicada por diferença de timestamp. Journal21→22, protocolo3 preservado. Produção segue4migrations e não recebeu DDL.

Snapshot privado de definição/ACL e hashes anterior: `build/fix-prod-005/pre-migration-backup.json`, SHA256bf6b318861501c366a2814af64a57150c6eab0252801049a9e28ac7620465ae4. A função hospedada exata foi restaurada em transação descartável offline, com comparação de definição/ACL e manutenção dos ledgers; ensaio revertido. Plano em `packages/database/deployments/fixprod005/README.md`: restaurar somente função anterior por nova migration de recuperação, preservar tabelas/claims/dados, nunca reset/drop/contas. Hashes de travelers/wallets/inventory/traveler_chests/chest_operations/battles iguais antes e imediatamente após DDL; evidência migration-preservation.json. Depois da DDL: política false,claims0,RLStrue,helperACL apenaspostgres,publicRPC apenaspostgres/service_role e cincoPT409 preservados. Batalhas de teste posteriores são operações reais próprias do ambiente de testes, registradas separadamente.

Advisories de testes mantêm WARNs anteriores:20funções definer autenticadas, proteção contra senha vazada e2initplansRLS; a mudança não concede ACL adicional. Duas novas tabelas privadas aumentam de14para16 os avisos informativos de RLS sem policy, deliberadamente inacessíveis. Não foram desativados Auth/RLS. Referências de remediação: [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [definer autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). QA/Security feitos pelo autor, sem alegação de independência.

## Testes e publicação do candidato

PostgreSQL17 descartável sem rede:28regressões existentes contra a nova migration,8casos da Torre e1recuperação exata/CRLF,37PASS/0FAIL. As sete vitórias/champion offline são derivadas pelo motor real, mas usam catálogo/atributos/approval de fixture; jamais copiados ou concedidos em hospedagem. Validam430/215/um baú, recibos vinculados, sequência, retomada, replay, concorrência, isolamento, derrota e rollback por carteira ausente e capacidade do baú. REWORK corrigido: comparação CRLF do baseline, timeout5s inadequado para WSL e assertions por status409 real. Nenhuma falha foi tratada como PASS.

Suíte local inicial721PASS/54SKIP, seguida dos novos testes opt-in executados; lint/typecheck/buildPASS, protocolo25PASS. CI final do candidato:721PASS/56SKIP,114arquivosPASS/5SKIP, lint/types/build e protocolo aprovados. Skips não são testes aprovados; os37PG acima têm execução independente registrada. Ensaios003 não afetados e evidências004 continuam históricos, sem nova aprovação inventada.

Candidato [da07a865f9d68a68a6762ff4bbdc8c22d4a02304](https://github.com/CarlosJr30/rpgjovemcristao/commit/da07a865f9d68a68a6762ff4bbdc8c22d4a02304), [CI40058214730](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40058214730), job120765809562. Arquivos: migration nova, teste Torre, teste recuperação, regressãoPG existente, README de implantação e contrato005; este relatório e memória são encerramento documental posterior. Nenhum arquivo de segredo/backup/harness privado foi versionado.

Preview único **READY**, dpl_HFEAPYzZnZLqEKhneKJZYLHTsznD, targetPreview, SHAda07a86: [abrir Preview005](https://rpgjovemcristao-5fyw536mg-carlos-junior-s-projects.vercel.app). Variáveis exclusivas da branch apontam ao projeto de testes. Conector Vercel403; CLI autenticada e escopada usada como fallback, sem trocar conta/projeto nem expor valores.

## Verificação real e estado final

**46checks de API PASS/0FAIL** no Preview005: getUser de duas identidades de teste, cartas já possuídas, progresso/recibos históricos preservados, negação de replay concorrente, homologação/valores pelo cliente rejeitados, outra conta/semAuth negados. Duas novas batalhas usam somente comandos legais e cartas preexistentes, sem starter, seed escolhido, atributos alterados ou concessão manual:

| Batalha real | Andar | Recibo | Resultado | Prêmio / próximo andar |
| --- | --- | --- | --- | --- |
|7cbf98ea-dda2-4e20-803c-808c7faf1463|2|a849d37d-e6f3-4175-b6cb-9cefc0d04a61|derrota|0XP/0moedas/0baús; próximo2|
|c7563620-a18e-4047-95cb-730d26a70900|1|157a14f1-c58f-4664-b6f4-1db904b6f797|derrota|0XP/0moedas/0baús; próximo1|

Banco confirmou recibo=recompensa da batalha e account_id=proprietário nos dois casos. Reconexão retorna estado exato; nenhuma derrota avançou progresso. Estado final de testes:20batalhas encerradas/22recibos,16XP/6moedas,0claimsTorre,políticafalse. Os andares2–7 não tiveram novas vitórias;3–7/campeão não foram iniciados por faltar desbloqueio legítimo. Pagamento hospedado positivo continua não validado, BLOCKED até identidade elegível e homologação. A integração está pronta para esses ensaios, não homologada para créditos reais.

**14checks de navegador PASS/0FAIL**: login real, rota de equipamentos, desequipar botas com recálculo de atributo, persistência após reload, reequipar recuperando valor anterior, cartas preexistentes preservadas, sem erro de página ou overflow. Chromium1440 eWebKit390; screenshots inspecionadas em `build/fix-prod-005/chromium1440-equipment.png` e`webkit390-equipment.png`. Não houve aquisição automática de carta, troca entre itens distintos, teste do alvo produtivo ou aparelho físico. O bitmap nativo com roupas/botas não prova que um overlay ausente foi corrigido. Aparência completa permanece BLOCKED.

Conferência final da produção mantém20Viajantes/37inventário/37recibos/0batalhas,245376XP/1006767moedas,4migrations/última20261023213654. Alvo e antigo mantêm níveis, papéis e verificaçãoNULL. Consulta de reconciliação004 reexecutada somente em leitura: `BLOCKED_MISSING_EVENT_PROVENANCE`, delta16/6. GitHubmain e Vercel permanecem5edc93f. Cinco rotas existentes (`/`, `/auth`, `/journey/equipment`, `/journey/arena`, `/journey/arena/tower`) responderamHTTP200 em leitura semAuth; isso não é aceite de gameplay autenticado. Uma primeira sondagem usou o endereço incorreto `/journey/arena-tower` e obteve404; caminho corrigido a partir do build, sem alteração de aplicação.

Evidências privadas ignoradas: local-gates.json,unit.log,tower-pg-approved.json,authority-pg-approved.json,recovery-approved.json,ci.json,pre-migration-backup.json,migration-preservation.json,economic-legacy-trace.json,preview-env.json,preview.json,preview-checks.json,preview-checks-process.json,browser.json,production-final.json eproduction-http.json. Arquivos de implementação versionados: `supabase/migrations/20261024025957_fix_prod_005_tower_settlement.sql`, `apps/web/lib/authority/tower-settlement.postgres.test.ts`, `apps/web/lib/authority/postgres.integration.test.ts`, `packages/database/deployments/fixprod005/recovery.postgres.test.ts`, `packages/database/deployments/fixprod005/README.md`, contrato005; relatório e memória encerram a documentação, sem novo deploy artificial.

Ativo Teste Chat A:31b70059-deca-44c8-a6df-f21ea68b6e42, proprietário78729453-8e04-478c-96ae-d37cead1bc8c,nível50/245016XP/1006265moedas,membro. Antigo9b83ca7f-0154-4492-9ad3-1deedb7411f4,nível1,líder,inativo,mesmaGuildac9041d27-28ee-41fa-9ae4-59043ee15143. CUA retornou novamente `failed to write kernel assets`; sessão getUser do alvo indisponível. Nenhum token de perfil/cookie foi extraído, nenhum privilégio global ou service_role foi concedido e o antigo não foi alterado. Aplicação de liderança e validação Guilda/EBD não executadas, BLOCKED.

Produção existente [READY](https://rpgjovemcristao-web-inky.vercel.app), SHA5edc93f, sem promoção005. Testes produtivos autenticados da nova versão não executados, pois não houve publicação. Resolver origem econômica, positivos legítimos2–7/champion, homologação de recompensas/catálogo, composição visual e identidade/liderança/aparelho físico antes de retomar os gates produtivos. Não solicitar homologação final de pagamento enquanto essas validações estiverem incompletas.
