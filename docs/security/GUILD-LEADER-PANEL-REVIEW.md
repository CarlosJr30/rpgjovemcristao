# Revisão local — Painel do Líder (2026-09-30)

Escopo: `0004_guild_leader_panel.sql`, repositories e UI autenticada. Esta é uma revisão estática; nenhuma migração foi executada no Supabase real.

- Leitura de `guild_activity_log`: RLS exige líder ativo da mesma Guilda e ownership por `auth.uid()`; cliente recebe apenas SELECT. Triggers escrevem em transações de ações existentes. Nenhum e-mail, conteúdo do Diário, oração ou notas é gravado no metadata (sempre `{}`).
- `update_guild_mission_draft` e `delete_guild_mission_draft`: exigem Traveler do chamador, liderança ativa, status `draft` e ausência de progresso. Exclusão é cancelamento lógico.
- `close_guild_mission` e `remove_guild_member`: exigem Traveler do chamador e liderança ativa na Guilda da entidade. Remoção não permite líder nem apaga Traveler.
- `review_guild_mission_with_guidance`: limita a orientação a 500 caracteres e delega a transição/recompensa ao `review_guild_mission` existente. A concessão continua protegida pelo ledger único e pela chave determinística do Baú da `0003`; uma falha posterior reverte a transação inteira.
- `guild_admin_stats` exige ownership e liderança; não expõe notas. A UI não usa ocultação de botão como controle de segurança nem envia valores de XP/moedas/Baú.

Risco residual: confirmar em duas contas reais isolamento entre Guildas, `anon`/membro contra cada RPC, RLS do log, concorrência de aprovação e idempotência de recompensas. A migração `0004` depende da `0003`; até aplicação manual e esse ensaio remoto, aceite de segurança é condicional.
