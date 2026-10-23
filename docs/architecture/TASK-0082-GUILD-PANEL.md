# TASK-0082 — Painel da Guilda / contexto 02 de 09

STATUS: **BLOCKED para aceite integral/hospedado**. Primeira versão funcional local concluída e validada; recompensa pendente é estado esperado desta versão. Não representa instalação, concessão econômica ou aceite em serviços hospedados.

Branch `codex/guild-leader-missions`, worktree `build/task-0082-guild-panel/checkout`, base **bb547c6** da TASK-0081. O código de Auth/QR da TASK-0080 já está nessa ancestralidade; os arquivos locais pendentes daqueles checkouts não foram copiados como fonte. Não se presume publicação remota. Commit local da implementação validada: **b0aa00af0d5601a16583dd08bf76b47f818a216d**. O commit seguinte registra somente o controle documental final.

## Auditoria e reaproveitamento

Contratos reais encontrados: TASK-0016 (Guilda Supabase e painel inicial) e TASK-0030 (painel V2). Existiam `guilds`, `guild_members`, pedidos/convites, `guild_missions`, `guild_mission_progress`, `guild_reward_claims`, `guild_activity_log`, repositórios e o componente OnlineGuildHub. As missões tinham tier, publicação, prazos, nota opcional e aprovação, mas o fluxo antigo concedia a recompensa durante a decisão e não oferecia contrato completo de objetivo/instruções/comprovação/público/tentativas.

Reutilizados: `/journey/guild/manage`, Shell/RequireTraveler/Auth, OnlineGuildHub como entrada, clientes e repositórios de contexto/membros/pedidos, GuildInvitePanel/QR, tiers e baús de `guildMissionRewards`, lista/visibilidade/relógio da Guilda e tabelas existentes. Não há segunda Guilda, identidade, carteira ou sistema de membros. Nenhum pacote ou asset foi instalado/gerado.

O novo painel assume o modo `management` do componente existente. O hub comum mantém onboarding, membros, recursos anteriores e leitura de conteúdo já existente; suas missões usam o novo cartão de submissão. O editor antigo deixa de ser oferecido nessa área e direciona ao painel único. Código administrativo antigo foi preservado para histórico, mas a entrada pública do componente não o monta. Não se implementaram chat, EBD, ranking ou calendário novos; o novo painel se limita às oito áreas pedidas. Os testes de administração anterior foram adaptados ao contrato novo; a leitura de aulas já existente continua com teste de regressão.

## Painel e missões

Oito áreas: Visão geral; Membros; Pedidos de entrada; Missões; Desafios especiais; Aprovações pendentes; Recompensas; Histórico de atividades. Desktop usa botões com estado; celular usa um único seletor. Os mesmos convites QR são acessíveis por Convidar membros. Membros/pedidos reutilizam operações existentes, incluindo aprovação de entrada e remoção de membro.

Editor: título, descrição, objetivo, referência opcional, início/prazo, instruções, critério de comprovação, tipo, tier e todos os membros ativos ou seleção de até 100 membros. Usa quatro tiers existentes, sem campos de XP/moedas arbitrários. Primeiro salva rascunho; publicação é uma decisão separada. Rascunho é editável com revisão otimista; publicada pode ser encerrada ou cancelada. Desafios usam o mesmo modelo, tipo especial e destaque visual.

Conteúdo é decidido pelo líder. Nenhuma missão foi criada em Guilda real. Textos e referências inseridos pelo líder não são certificados como Escritura oficial ou avaliação espiritual. O código novo não inclui roteiro/quiz bíblico gerado.

## Fluxo de conclusão

`Disponível → Em andamento → Aguardando aprovação → Aprovada / Rejeitada / Correção solicitada`.

Correção/rejeição permitem nova tentativa dentro da disponibilidade, com nova versão e nova prova, preservando tentativas e decisões anteriores. Motivo é obrigatório para rejeitar/corrigir; o membro o vê no cartão. O líder vê nome do Viajante, missão, prova objetiva, tentativa e data. A decisão registra revisor, data, resultado e motivo. Não há autoaprovação nem mesmo entre dois Viajantes da mesma conta Auth.

Nesta primeira versão, o fluxo de missões customizadas exige aprovação e não oferece auto-concessão `self_complete`. Missões legadas continuam visíveis e seus estados/concessões anteriores são preservados; novas submissões passam pelo contrato seguro. Pendências anteriores são importadas como tentativas marcadas legadas; prova ausente não é inventada, não pode ser aprovada e exige reenvio. `completed` histórico não vira recompensa nova.

Missão encerrada bloqueia novos envios, mas permite decidir o que foi enviado antes. Cancelamento bloqueia novos envios/decisões; o histórico e as aprovações já registradas permanecem. A política de eventual liquidação de recompensas após cancelamento/saída deverá ser verificada na integração econômica; este código não concede saldo.

## Recompensa e integração econômica

`approved` é aprovação com **recompensa pendente**, distinta de `completed`/`reward_claimed_at`. O novo servidor não chama a rotina econômica, não altera XP, moedas, baús ou claims e não emite recibo de concessão. O membro é informado dessa pendência. Recompensas já processadas no histórico só são descritas como registradas quando possuem `reward_claimed_at`.

O ledger econômico continua sendo `guild_reward_claims` e os registros de baús já existentes. Não há saldo/outbox financeiro paralelo. A TASK-0078 deverá fornecer futura integração revisada e atômica, com chave única missão/Viajante, validação da decisão/eligibilidade/cancelamento e reconciliação do recibo. Seu contrato e SQLs não foram alterados. A idempotência comprovada aqui cobre tentativas/decisões e a ausência de concessão repetida; não equivale a uma concessão econômica hospedada end-to-end.

## SQL e autorização

Proposta versionada `packages/database/proposals/task0082-guild-missions.sql`, não registrada no journal nem aplicada em ambiente remoto. Baseline testado: 0000–0008 + SQL de convite QR da TASK-0080. A proposta de Story0081 é independente e não foi alterada.

Amplia `guild_missions` com requisitos/público/revisão e `guild_mission_progress` com versão da submissão/estados novos. Acrescenta somente a tabela de tentativas e decisões `guild_mission_attempts`, vinculada às missões/membros existentes. Constraints, índices, RLS, grants e funções fazem parte da mesma transação.

Novas RPCs: `guild_mission_workspace`, `save_guild_mission_v2`, `transition_guild_mission_v2`, `act_guild_mission_v2`, `review_guild_mission_v2`. Servidor valida conta real não anônima, propriedade do Viajante, Guilda/membership ativa e liderança consistente com o dono da Guilda. Funções com privilégios usam search_path vazio, relações qualificadas e EXECUTE explícito. Linhas/versões são bloqueadas antes da decisão; datas usam relógio após o lock. Chaves repetidas não criam nova tentativa/decisão. Motivo/prova e estados são validados pelo banco.

Na futura aplicação conjunta do cliente/SQL, as antigas RPCs de escrita de missões têm EXECUTE revogado: mantê-las abertas permitiria bypass de público/prova/justificativa e pagamento pela API antiga. APIs de convite, membros, chat e conteúdo anterior não são alteradas. Cliente novo com backend antigo falha de forma explícita, sem substituição por dados locais/simulados.

## Provas, privacidade e histórico

Texto objetivo até 500 caracteres, somente ao membro proprietário e liderança ativa da Guilda. Não há upload, bucket, link público de arquivo, preview HTML ou anexos nesta versão. Conteúdo é renderizado como texto React. Formulário orienta evitar dados pessoais, relatos sensíveis e Diário. O log geral armazena referências/ator/resultado, sem copiar a prova; detalhes de tentativas ficam protegidos. Histórico pagina eventos em lotes de 20.

## Gates e evidências

| Verificação | Resultado final e evidência |
| --- | --- |
| Unitários | 47 PASS, 8 arquivos, 0 FAIL; `unit-acceptance.log` |
| PostgreSQL17 | 13 nós PASS (12 cenários + pai), 0 FAIL/SKIP; `postgres-acceptance.log` |
| E2E Guilda | 9 cenários PASS em desktop Chromium 1440×900, móvel Chromium 320×740 e móvel WebKit 390×844; `e2e-final.log` |
| Aceite após ajuste de métricas | 3 fluxos completos repetidos (um por projeto) PASS; `e2e-acceptance.log`; seis cenários não afetados reutilizados |
| Regressão Modo História | 1 E2E desktop PASS, `e2e-story-regression.log`; próximo capítulo sem Guilda; arquivos/contrato/proposta0081 iguais à base |
| Lint, TypeScript, build | PASS: `lint-acceptance.log`, `typecheck-acceptance.log`, `build-final.log` |
| QA visual | Capturas painel/editor desktop e 320px, recompensa 390px e membro desktop inspecionadas; contador de aprovação agora exclui aprovadas e lista vazia não afirma conclusão |

Browser usa SDK/Data API simulados e dois contextos de navegador para o fluxo líder/membro. SQL executa baseline completo e proposta reais em banco sintético offline. Não são provas de Auth/JWT/PostgREST hospedados nem de aparelho físico. Nenhuma suíte geral longa/auditoria DEV encerrada foi reaberta. Regressões locais de QR, membros, visibilidade, tiers e leitura já existente reaproveitam componentes reais.

Relatório de segurança: [TASK-0082-GUILD-SECURITY](../security/TASK-0082-GUILD-SECURITY.md). QA/Security pelo autor, sem independência. Artefatos locais em `build/task-0082-guild-panel/` e capturas dentro do checkout/build/task-0082-guild-panel. Falhas iniciais e correções foram preservadas: filtro de avatar no snapshot, expectativas antigas de concessão/UI, fixture tipada incompleta, espera da hidratação móvel e seletor confundindo resumo com cartão. Estado passou por REWORK; rodadas finais acima sem falhas.

## Arquivos alterados

- `apps/web/features/guild-missions/contracts.ts`, `contracts.test.ts`, `leader-panel.tsx`, `member-mission.tsx`, `mission-editor.tsx`, `panel.module.css`, `panel.test.tsx`.
- `apps/web/features/journey/components/online-guild-hub.tsx`, `data/guildPlayerVisibility.ts`, `online-guild-hub.test.tsx`.
- `apps/web/lib/supabase/database.types.ts` e `repositories/guild-mission-workspace-repository.ts`.
- `packages/database/proposals/task0082-guild-missions.sql` e `packages/database/tests/guild-panel.postgres.test.mjs`.
- `playwright.guild-panel.config.ts` e `tests/e2e/guild-panel.spec.ts`.
- Este relatório, parecer de segurança próprio, contrato TASK-0082 e CURRENT_STATE. Arquivo gerado `next-env.d.ts` restaurado. Nenhum manifest, lockfile, migration existente, Auth/QR, código de Story ou contrato anterior alterado.

## Checklist e pendências

- [x] Auditoria/base/branch isoladas e contratos reais encontrados.
- [x] Painel, edição/publicação/cancelamento, submissão, correção/rejeição/aprovação, histórico e pendência de recompensa.
- [x] RLS/ACL/constraints/índices/locks, privacidade e idempotência testados localmente.
- [x] Gates locais, relatório, checklist e memória da tarefa.
- [ ] SQL/schema/migration e cutover revisados/aplicados em ambiente isolado autorizado.
- [ ] Auth/JWT/PostgREST reais, duas contas/aparelhos e integração econômica da TASK-0078.

## Aplicação futura e recuperação

1. Revisar a proposta contra o schema efetivo autorizado e a solução econômica da TASK-0078; gerar migration/schema Drizzle revisados sem reaplicar o baseline em projeto existente.
2. Em ambiente isolado autorizado, validar backup/restore, permissões reais Auth/JWT/PostgREST e compatibilidade do cliente. Somente então planejar cutover coordenado; cliente antigo não poderá continuar usando endpoints revogados.
3. Não fazer rollback destrutivo das tentativas nem restaurar antigas concessões apenas para fazer o cliente antigo funcionar. Em falha de cutover, congelar mutações de missões, preservar dados/auditoria e aplicar correção/reconciliação revisada. Nenhum script automático de downgrade/data loss foi entregue.
4. Integrar/validar recompensas com recibo único e aparelhos reais antes do aceite hospedado. Não publicar por consequência deste preparo.

Nenhum push, merge, deploy, acesso a dados reais ou SQL remoto. Main, TASK-0078, Auth/QR0080 e progressão/contrato0081 ficam preservados. Foi acrescentada também uma entrada de controle à memória do checkout raiz, com corpo anterior preservado byte a byte e sem commit ou mudança de sua branch/ref. Próxima etapa: resolver o ambiente isolado autorizado e o adapter de recompensa; não iniciar automaticamente contexto 03/09.
