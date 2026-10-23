# TASK-0082 — Painel da Guilda e missões personalizadas
ID: TASK-0082
TITLE: Painel completo do líder — contexto 02/09
OBJECTIVE: Entregar primeira versão funcional local de criação/publicação, submissão, decisão e acompanhamento de missões/desafios, reutilizando Guilda existente.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: apps/web/features/guild-missions, integração das rotas e área de missões existentes, repositories/tipos, SQL local versionado em packages/database/proposals, testes direcionados, docs e memória próprios.
OUT_OF_SCOPE: main, merge, push/deploy, serviços/dados reais, SQL remoto, economia/TASK-0078, Auth/QR da TASK-0080, progressão/contrato TASK-0081, novos chat/EBD/ranking/calendário, dependências/assets novos.
DEPENDENCIES: Base local bb547c6 da TASK-0081 (inclui Auth/QR0080); TASK-0078 somente para futura concessão econômica.
ASSIGNED_AGENT: Autor assume Architect, Frontend, Backend, Database, Game Designer, QA e Security; sem delegação/revisão independente.
REQUIRED_CONTEXT: AGENTS/WORKFLOW/RULES/SECURITY, perfis e skills já lidos; contratos reais TASK-0016/0030; migrations 0001/0003/0004 e repositórios/componentes de Guilda existentes.
SECURITY_CONSIDERATIONS: RLS por Guilda e elegibilidade; autoridade no servidor; sem autoaprovação inclusive entre avatares da mesma conta; locks/versões/idempotência; comprovação textual limitada e privada; recompensa pendente, sem saldo paralelo.
ACCEPTANCE_CRITERIA:
- Painel da Guilda responsivo com visão geral/membros/pedidos/missões/desafios/aprovações/recompensas/histórico e QR preservado.
- Missão com título/descrição/objetivo/referência opcional/início/prazo/instruções/comprovação/tier/público/estados e edição de rascunho.
- Membro elegível inicia/envia/acompanha; líder decide com motivo para rejeição/correção, não aprova a si mesmo; tentativas e decisões auditadas.
- Sem concessão econômica fictícia; aprovação aguarda integração, um recibo/conclusão; nenhum gate narrativo.
- SQL local testado em PostgreSQL sintético; lint/tipos/build/testes direcionados e evidências.
TEST_PLAN:
- SQL: permissões/isolamento/rascunho/elegibilidade/datas/concorrência/duplicação/autoaprovação/decisão/histórico e proteção das APIs antigas na proposta.
- Unit/UI: validação/estados/formulário/falhas/recompensa pendente.
- Browser: líder cria/publica, membro submete, líder decide, membro acompanha; desktop/celular; regressões QR/membros e independência de História.
DEFINITION_OF_DONE: Aceite/gates comprovados; integração econômica/hospedada não demonstrada fica BLOCKED, nunca PASS fictício.

## Contexto mínimo e auditoria
- Nova instrução do usuário autoriza contexto 02/09, substituindo o limite anterior de não avançar; não autoriza publicar.
- Worktree isolado build/task-0082-guild-panel/checkout; branch codex/guild-leader-missions; base bb547c6, sem presumir publicação remota.
- Existe GuildManageScreen, OnlineGuildHub, guildRepository, guildMissionRepository, guildAdminRepository, GuildInvitePanel e tabelas guild_missions/guild_mission_progress/guild_reward_claims/guild_activity_log. Não criar novo sistema de Guilda/membros/identidade/carteira.
- Lacunas: objetivo/instruções/comprovação/público, decisões obrigatoriamente justificadas, tentativas/versionamento e aprovação separada da concessão. Endpoints antigos concedem economia ao aprovar; a proposta deve fechar esse caminho de escrita no novo fluxo.
- Orquestrador autoriza perfis selecionados a editar os caminhos do SCOPE, testes/docs/memória da tarefa, dentro do pedido local.
- Comprovações: texto objetivo até 500 caracteres; uploads/URLs pessoais não previstos, sem bucket público ou infraestrutura nova. Conteúdo é do líder e não é declaração bíblica oficial nem avaliação espiritual.

## Checklist
- [x] Auditoria, contexto e base isolada
- [x] Contratos/SQL/RLS e testes sintéticos
- [x] Painel/editor/publicação
- [x] Submissão/decisão/histórico/recompensa pendente
- [x] QA/Security e checks finais
- [x] Relatório e controle de aceite local
- [ ] Aceite hospedado/econômico: SQL autorizado, Auth/JWT/PostgREST e aparelhos reais; adapter TASK-0078

## SELF VALIDATE / QA / SECURITY / ACCEPTANCE

Versão local concluída, com recompensa pendente intencional. BLOCKED descreve o aceite integral/hospedado, não um teste local falhando. Sem nova solicitação de aprovação nesta etapa, pois o pedido atual proíbe execução remota. Autor assumiu todos os perfis; não houve revisão independente.

| Gate | Resultado |
| --- | --- |
| UNIT | PASS: 47/47 em 8 arquivos, `unit-acceptance.log` |
| SQL | PASS: 13 nós (12 cenários + pai), 0 FAIL/SKIP, `postgres-acceptance.log`; baseline completo 0000–0008 + QR0080 em PG17 real/sintético/offline |
| BROWSER | PASS: 9 cenários de Guilda (3 projetos × 3 fluxos), `e2e-final.log`; os 3 fluxos completos afetados pela correção final de métricas foram repetidos e passaram em `e2e-acceptance.log` |
| STORY REGRESSION | PASS: 1 E2E desktop, `e2e-story-regression.log`, mais unitários de progressão e comparação de arquivos protegidos |
| LINT / TYPECHECK / BUILD | PASS: `lint-acceptance.log`, `typecheck-acceptance.log`, `build-final.log` |
| VISUAL / ACCESSIBILITY | PASS local: painel/editor 320px, pendência 390px/WebKit e membro desktop inspecionados; labels/controles sem overflow; teste físico pendente |
| SECURITY | PASS do diff/proposta local, limites no parecer próprio; sem secret novo/pacote/serviço/dado real |
| BIBLICAL | N/A para nova narrativa oficial: campos de autoria do líder e textos de interface; nenhuma passagem/roteiro/quiz novo gerado |
| DOCS / MEMORY | Relatório e parecer próprios, checklist e memória atualizados; nenhum contrato anterior alterado |
| ACEITE INTEGRAL | BLOCKED pelo ambiente autorizado, cutover/migration/schema, integração econômica e validação hospedada/física |

Reworks preservados: snapshot inicialmente incluía missão destinada a outro avatar da mesma conta (corrigido e cenário negativo PASS); 7 expectativas antigas de UI/concessão atualizadas ao novo contrato; fixture TypeScript incompleta corrigida; E2E inicial confundiu o resumo do herói com o cartão e tentou navegar antes da hidratação móvel; revisão visual final separou contagem de aprovação/recompensa e corrigiu texto vazio. Nenhuma falha final aberta nos checks executados.

Relatório: [TASK-0082-GUILD-PANEL](../../docs/architecture/TASK-0082-GUILD-PANEL.md). Segurança: [TASK-0082-GUILD-SECURITY](../../docs/security/TASK-0082-GUILD-SECURITY.md). Logs/recibo em build/task-0082-guild-panel fora do versionamento. Commit local da implementação validada: `b0aa00af0d5601a16583dd08bf76b47f818a216d`; controle seguinte altera apenas este contrato e o relatório. Não houve push/deploy/merge/migration remota/acesso a dados reais; main/TASK-0078/AuthQR0080/Story0081 preservados. Contexto 03/09 não iniciado.
