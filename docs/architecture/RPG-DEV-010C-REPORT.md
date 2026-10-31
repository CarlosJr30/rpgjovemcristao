# RPG-DEV-010C — Células e atividades

## 010C.1 — homologação TEST concluída; pacote PROD preparado

31/10/2026. No runtime90c1d86/PR22: **6preflight+14fluxo+3WebKit+3atividade/histórico PASS**, duas identidades normais distintas, avatar Admin original preservado. Motivo Unicode250caracteres íntegro, log legado máximo190bytes; histórico restrito, replay único, corrida200/409PT409, revogação imediata na mesma sessão e correção após encerramento. WebKit390 emulado, não físico; captura autorizada inspecionada. Primeira tentativa encontrou dois campos Descrição e parou antes de salvar; corrigido somente escopo do coletor, falha preservada. Nenhuma autoridade/limite/assertion relaxada.

Depois dos ensaios:59conjuntos originais TEST estritamente iguais; quatro deltas legítimos de missões/progresso/tentativas/log discriminados. Ao excluir somente registros010C novos,63conjuntos originais iguais; dados de jogo/EBD/vínculos anteriores preservados. Delegações temporárias revogadas, motivos/auditorias preservados; emissãoXP/baús0.58PROD iguais. [Evidência](RPG-DEV-010C1-TEST-EVIDENCE.json).

[Pacote PROD próprio](RPG-DEV-010C1-PRODUCTION-PLAN.md) gerado após homologação; **12PG isolados PASS**,9casos de histórico reutilizados+2bootstrap+1guarda PROD. **10preflight PROD somente leitura PASS**, conta já aprovada/ativo50/quatro permissões existentes, sem novo grant ou avatar antigo. Uma definição legada difere sóLF/CRLF, comparada integralmente; guard canônico normaliza essa representação, sem substituir rotina. Nenhum DDL/deploy/merge010C PROD executado. CI do pacote, Preview final e demais gates produtivos pendentes. **Não DEPLOY_COMPLETE.** Checkpoints abaixo históricos.


## 010C.1 — CI aprovado / Preview TEST READY; homologação pendente

31/10/2026. [PR22 aberta/draft](https://github.com/CarlosJr30/rpgjovemcristao/pull/22), candidato **90c1d86779017b66cbf4bfac1cd35759cd43232b**. CI [push41167646035](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/41167646035) e [PR41167649219](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/41167649219) **success, tentativa1/SHA exato**:980unit PASS/74SKIP,148arquivos/7opt-in, lint/tipos/build/protocolo25/PostgreSQL/RSC aprovados. Publicação condicional SKIP, nãoPASS. Preservados23PG anteriores; somente9checks adicionais de histórico/autorização (+2bootstrap compartilhados) executados localmente. Primeiro workflow teve indentação incorreta, corrigida; execução cancelada do candidato superado não é PASS. Ajuste visual final reutiliza notice para quebrar motivos longos, sem arte/CSS novo.

Migration **somente TEST20261031042002**, arquivo20261031033721:38migrations/68tabelas/187funções. **63conjuntos anteriores idênticos apósDDL**,180funções/ACLs e39policies preservadas. Cinco privadas vazias/RLS deny-all; sete funções novas com wrappers INVOKER, execução autenticada limitada. Somente colunas/constraint/índice previstos nas duas tabelas antigas. Snapshot/recuperação/contenção isoladas aprovadas; nenhuma compensação remota necessária. Log legado512bytes intacto; motivos integrais append-only, replay único e leitura só por responsáveis atuais. Nenhum XP/moeda/baú emitido.

[Preview TEST](https://rpgjovemcristao-i6l93i48f-carlos-junior-s-projects.vercel.app), **dpl_D8YCUNRAudpKzCDXx78hH9jKTcJM /READY /90c1d86 /backendTEST**; somente duas configurações públicas TEST na branch, proteção preservada. Segunda QA entrou normalmente, sem copiar sessão: **6preflight reais de leitura/negação PASS**. Login Admin na nova origem solicitado; correções/histórico positivo/replay/corrida/revogação e regressão essencial Chromium/WebKit continuam **PENDING**, não cobertos por esse preflight. Teste móvel será emulado, sem alegação de aparelho físico.

**PROD intacta010B.3/4ded3c5/dpl_4s1wFrncQr8xrod1HTyzRmNxmx7o**, READY/production/alias oficial, autoAssign=true/SSO originais;58conjuntos novamente iguais. PR12draft61b7177 ePR18draftfd6f149 preservadas. Sem pacote/migration010C PROD, merge ou promoção. Advisors TEST:44deny-allINFO (cinco novas privadas intencionalmente fechadas),12definerWARN e proteção de senhasWARN legadas; [RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [definer](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Sem mudança de configuração para passar gates.

[Evidência sanitizada](RPG-DEV-010C1-TEST-EVIDENCE.json). Artefatos privados em build/rpg-dev-010c; QA/Security pelo autor, sem independência. **Não DONE/DEPLOY_COMPLETE**: primeiro concluir homologação real TEST; somente depois preparar pacote produtivo próprio e demais gates.010C.2/3 separados; economia bloqueada. Checkpoints abaixo históricos.

## 31/10/2026 — 010C.1 / histórico privado validado localmente

Autorização do proprietário: preservar os motivos completos em histórico privado, mantendo o limite legado de **512 bytes**. Implementação acrescenta registros append-only por solicitação/revisão, com autor, beneficiário, estados anterior/posterior e data. Somente líder atual ou substituto autorizado para aquele encontro/atividade consulta o histórico completo; o participante consulta seu resultado e orientação atuais. Revogação é conferida novamente no servidor. Replay não duplica histórico ou auditoria. O log anterior guarda apenas contexto compacto e digest do motivo; registros e contrato anteriores preservados.

**9 verificações adicionais PostgreSQL PASS**, além de dois checks compartilhados de bootstrap (11 na rodada), cobrindo Unicode completo, autorização/isolamento, replay, corrida com um vencedor/PT409, revogação imediata, recusa de UPDATE/DELETE, rejeição de padrões de credenciais/contatos e contenção preservadora. Os **23 checks anteriores permanecem arquivados**, sem repetir a suíte completa ou somar bootstrap como casos novos. Primeira rodada adicional interrompida por revisão incorreta na fixture de delegação; corrigida somente a fixture e repetido este conjunto, sem mudar limites/assertions/autoridade. Guardas de definições/ACLs canônicas também passaram no mesmo ensaio isolado.

17 unitários direcionados anteriores preservados; lint, TypeScript, build e protocolo25 aprovados nos respectivos checkpoints. Nenhuma dependência, arte ou autoridade econômica acrescentada. QA/Security/React pelo autor, sem revisão independente. Sem DDL/deploy010C remoto ou alteração PROD neste checkpoint. Próximos gates: commit/CI exato, migration somente TEST, Preview TEST e homologação real com as duas identidades autorizadas. **Não DONE/DEPLOY_COMPLETE.** Os registros abaixo são históricos.

Decisão para010C.3 registrada separadamente: cada Guilda é equipe; média da lista fixada antes do início, ausentes zero e uma identidade por equipe concorrente/evento. Não libera competição neste incremento.

## 31/10/2026 — ACTIVE /010C.1 em implementação

Pedido completo autoriza implementação/publicação progressiva, sem economia. Branch `codex/rpg-dev-010c-guild-activities` criada da main4ded3c5, com fechamento documental a03c1c0 incorporado; dez worktrees e arquivos anteriores preservados. PROD4ded3c5/dpl_4s1wFrncQr8xrod1HTyzRmNxmx7oREADY/alias/configuração originais reconfirmados; CImerge41162803090success. TEST37migrations63tabelas180funções;PROD14/58/172,39policies cada; baselines63TEST/58PROD privados capturados. NenhumDDL/deploy/grant010C remoto.

Auditoria: reutilizar guild_missions/progress/attempts/activity_log, MissionEditor/CSS, GuildScope e permissões010A; sete comandos/consultas de missões antigos continuam owner-only, não serão desbloqueados. Novos wrappers terão Guilda explícita e autorização atual. Complementos privados para encontros/acesso/delegação/elegibilidade futura, sem converter legado, misturar classesEBD ou conceder recompensas. 010C.1 entrega encontros/atividades manuais;010C.2 quiz7/equipes;010C.3 aceite entreGuildas/equilíbrio/limites. Formato competitivo solicitado ao proprietário enquanto trabalho independente continua. Nenhum teste010C declaradoPASS nesta preparação.

## 31/10/2026 — preparação documental após010B.3

Dependências010A e010B publicadas; referência atual4ded3c5/010B.3. [Preparação separada](RPG-DEV-010C-PREPARATION.md) identifica reutilização, fronteiras e decisõesD1–D6 pendentes. Nenhuma regra competitiva/conteúdo aprovada automaticamente. Sem runtime, testes010C, migration ou publicação010C; XP/moedas/baús continuam bloqueados até010D. Backlog próprio, fora da PR21. O checkpoint abaixo é histórico; não declarar010C DONE.

28/10/2026 — **PENDING; publicação BLOCKED por dependências010A/B**. Reutilizar guild_missions/guild_ops/revisão educativa. Encontros presenciais/digitais, estudos, desafios e campanhas sem impor fotos/localização precisa. Validação presencial por responsável autorizado e auditado; não pontuar fé/oração/reflexão.

Eventos conjuntos exigem aceite de todos os líderes, regras fixadas antes do início, equipes equilibradas e pontuação proporcional aos elegíveis. Uma conta não integra equipes concorrentes no mesmo evento; participação/recompensa compartilhada tem uma identidade canônica global. Sem listas públicas de adolescentes.

Nenhuma implementação/teste/migration/publicação010C realizada nesta preparação. Definição de algoritmo de equilíbrio/elegibilidade e integração escopada devem ser verificadas, sem inventar resultados de eventos. [Matriz geral](RPG-DEV-010-REPORT.md).
