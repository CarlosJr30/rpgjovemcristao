# TASK-CONSOLIDATION-004 — autoridade e segurança econômica

ID: TASK-CONSOLIDATION-004
TITLE: Combate autoritativo, posse e segurança econômica local
OBJECTIVE: Fechar ECON-LEGACY localmente, reutilizando economia e motor, demonstrar posse/combate/recibos com dados sintéticos.
PRIORITY: P1 High
STATUS: BLOCKED
AUTHORIZATION: Pedido explícito 04/06 de 2026-10-20; somente implementação, migrations e testes LOCAIS. Sem remoto/publicação.
SCOPE: packages/database/proposals e tests, apps/web/lib/authority e API, consumidores econômicos/Arena/Torre necessários ao cutover explícito, testes e documentos desta família. Orquestrador autor assume Architect/Backend/Database/Frontend/Game Designer/QA/Security, ampliando os caminhos dos perfis apenas neste contrato. Sem delegação.
OUT_OF_SCOPE: main/merge/push/fetch/deploy, serviço/SQL/Auth remoto, dados reais, homologar/conceder propostas, dependências novas, PvP, nova economia, apagar legado, modificar contratos anteriores silenciosamente.
DEPENDENCIES: 003A HEAD7f3e52b885caa6ae4a222f80e4f199b0290ea16e; baseline002; auditoria0078; catálogo homologado e ambiente remoto ausentes.
REQUIRED_CONTEXT: AGENTS/global/memória/workflow/rules/security, contrato0078 e código econômico4b63c90, relatórios002/003/003A, planos0085/0087, guias Next locais, skills Supabase/Postgres/Backend/Database/QA/Security.
SECURITY_CONSIDERATIONS: Autoridade só servidor; Auth verificado, ownership, grants mínimos, recibos transacionais, locks/unicidade, RLS, conflitos de rodada, seed/snapshots do servidor, nenhuma importação de vitórias locais. Revisões pelo autor, sem independência alegada.
ACCEPTANCE_CRITERIA:
- Reproduzir permissões inseguras em PostgreSQL descartável e comprovar sua negação após correções.
- Preservar leituras, dados/recibos antigos, branches e arquivos pendentes por hash.
- Posse no inventário existente com catálogo/versionamento/recibo e starter único por conta; produto sem catálogo aprovado permanece bloqueado.
- Demonstrar combate persistido no servidor com engine atual, sete cartas, sequenciamento, rejeição de manipulação/replay e progresso Torre só por vitória canônica.
- Concessões idempotentes e atômicas; regras sem homologação ficam explicitamente bloqueadas.
- Testar 25 riscos do pedido, concorrência/rollback, engine/integração, lint/tipos/build; registrar limites de Auth sintético.
- Documentar cutover/impacto0078/recuperação e checklist sem modificar contrato0078.
TEST_PLAN: Banco PG17 offline descartável com baseline002 e novas propostas; testes locais de serviço/HTTP/consumidores; gates pertinentes. Evidências em build/task-consolidation-004, sem produção.
DEFINITION_OF_DONE: Aceite local demonstrado, relatório15itens e memória/recibo/commit; contrato integral BLOCKED enquanto gates hospedados/homologação/reconciliação faltarem. Falha exige REWORK.

## Preparação

29 worktrees anteriores e nove arquivos pendentes raiz capturados por status/hashes. Checkout isolado codex/consolidation-economy-authority-004 criado da003A limpa. Primeiro script de baseline falhou por strip removendo espaço de status; corrigido para rstrip antes de qualquer edição de produto. Baseline final exclui somente o novo checkout, preservando os29 anteriores.

## Implementação e validação

EXPAND0078 copiado sem alterações de instrução, hash normalizado conferido com origem4b63c90. CONTRACT004 alternativo a0010: revokes de tabela/coluna/RPC, quarantine legado, aprovação privada vazia, provenance no inventory/chest_operations e rodadas no battles existente. Serviço/API autenticam e reutilizam engine; coleção/start/command/resume/Torre oficiais e consumidores legados com pausa explícita. Sem regra econômica nova; Torre/Guilda/EBD/Story com concessões não homologadas bloqueadas.

28casos PG finais PASS em postgres-receipts-final.log, incluindo25riscos mapeados no parecer, concorrência real de sessões psql, rollback parcial/recuperação e bônus legado registrado separadamente no receipt.77casos/11arquivos unitários/integração PASS em unit-initial.log, sem contar rechecks. Lint completo PASS/lint-final.log e rechecks dos ensaios novos PASS/lint-rechecks.log. Typecheck completo PASS/typecheck-final.log; build final PASS/build-final.log,963artefatos/0achado/8protótipos intactos. Browser/fechamento ainda em validação neste registro.

Reworks com evidência: import de fixture um nível acima corrigido; primeira rodada19PASS/7FAIL por nomes sintéticos com dígitos recusados pelo domínio e contagem Story incorreta, corrigidos só no ensaio. Segunda25PASS/1FAIL por expectativa de vida80 que ignorava botas(+1), corrigida para81 preservando fórmula/equipamento. Depois27PASS, revisão adicionou reviewRef/revogação/rollbackstarter/bônus e28PASS final com SQL congelado. TypeScript inicial identificou phase inválida e narrowing do usuário no ramo offline; fases existentes/referências offline corrigidas. Testes de UI ajustados à API de Testing Library/assinatura do construtor. Nenhuma proteção ou asserção de segurança removida para passar.

QA/Security pelo autor. Parecer docs/security/CONSOLIDATION-004-SECURITY.md, cutover/revisão0078 docs/architecture/CONSOLIDATION-004-CUTOVER.md. Sem revisão independente ou Auth hospedado alegados. CONSOLIDATION005 recebida durante validação; terminar004/preservar HEAD antes de nova branch, sem misturar escopos.

## Aceite local e bloqueios integrais

SELF VALIDATE/QA/Security locais PASS:28PG/77unit/3browser, lint/tipos/build/scan260JS0fixtures. Browser Chromium1440/320/WebKit390 sem skip/falha/retry/flaky; fluxo autenticado sintético→API503 real sem credencial→Arena/Torre bloqueadas, sem fallback/remoção de save. CapturaWebKit inspecionada; servidor3194 encerrado. React: props tipadas, efeitos com cleanup/guardlive, comandos com refpending e confirmação de estado, labels/disabled/sem HTMLdinâmico, nenhuma credencial no cliente. next-env gerado restaurado só após conferência das duas importações. Skill verification/React aplicadas, sem alegar fluxo hospedado completo.

Segurança local IMPLEMENTED e demonstração sintética PASS; contrato integral BLOCKED por Supabase isolado ausente/SQL remoto não autorizado/catálogo não homologado/reconciliação e cutover0078/CI-Auth hospedados/publicação. Relatório15itens e checklist docs/architecture/TASK-CONSOLIDATION-004-REPORT.md. Somente os critérios locais estão aceitos; não marcar DONE integral nem remover bloqueios de release. Próximo autorizado: preservar commit004 e iniciar005 em branch própria, sem mexer em economia/combate.
