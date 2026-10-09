# Painel do Líder da Guilda — V1

Rota autenticada: `/journey/guild/manage`. A entrada “Gerenciar Guilda” aparece somente para líder. Um membro que visita a rota recebe a visão normal da Guilda. O modo local não é uma autoridade administrativa.

O painel usa `OnlineGuildHub` e o mesmo `MissionCreator` da Guilda, com `guildRepository`, `guildMissionRepository` e `guildAdminRepository`. A UI não escreve tabelas diretamente. Ações de rascunho, encerramento, remoção e revisão com orientação são RPCs com ownership + liderança verificados no banco. Missão publicada não pode ser editada; rascunho é “excluído” por status `cancelled`, preservando o log. A revisão chama o fluxo existente de recompensa, incluindo o ledger único e o Baú da migração 0003. A orientação de até 500 caracteres é visível ao membro rejeitado e não entra no log.

O dashboard calcula membros ativos a partir de `list_guild_members`; missões ativas a partir de publicadas não expiradas; pendências e conclusões dos últimos 30 dias a partir de `guild_admin_stats`, agregado no banco. O total de recompensas do relatório representa conclusões, não uma segunda concessão. Missões fechadas e histórico são carregados em páginas de 20; detalhes de progresso são buscados ao abrir o relatório ou quando há pendências. Os eventos anteriores à migração não são retroativamente preenchidos.

`guild_activity_log` é alimentado por triggers transacionais em Guilda, membros, missões, progresso e claims. Não armazena e-mail, Diário, orações ou notas. O cliente autenticado possui apenas SELECT; RLS restringe leitura ao líder ativo da mesma Guilda. As funções novas usam `SECURITY DEFINER SET search_path = ''` e verificam o Traveler pertencente a `auth.uid()`.

## Implantação e rollback

1. Confirmar que `0003_guild_mission_chest_rewards.sql` está aplicada; ela depende da `0002`.
2. Aplicar manualmente `packages/database/migrations/0004_guild_leader_panel.sql` no projeto Supabase correto. Não aplicar a `*.down.sql` junto.
3. Com duas contas reais em Guildas diferentes, verificar RLS, acesso ao painel, criação/edição/publicação de rascunho, aprovação/rejeição/nova tentativa, grant único de XP/moedas/Baú, remoção, histórico e isolamento cruzado. Testar 360×800, 390×844, 412×915, 768×1024 e 1440×900.
4. Se rollback for indispensável, fazer backup antes; `0004_guild_leader_panel.down.sql` remove o histórico e as orientações armazenadas. Não executar sem aprovação explícita para perda desses dados.

## Estado de validação local

Em 2026-09-30: lint, typecheck, 186 testes unitários e build de produção passaram. Testes estáticos cobrem guards/RLS da migração; testes de componente cobrem líder, membro, contadores, rascunho, pendência, aprovação e nova tentativa. SQL real e visual do painel autenticado em todos os viewports dependem da implantação/contas de teste. Aprovação em lote foi deixada para V2 por requerer um contrato transacional próprio.
