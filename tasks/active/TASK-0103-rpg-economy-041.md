# TASK-0103 — Expansão econômica 041

ID: TASK-0103
TITLE: RPG-ECONOMY-041 — baús, duplicatas e recompensas de progressão
OBJECTIVE: Integrar cinco baús compráveis, sorteios server-side de cartas/equipamentos, revenda opcional de cópias excedentes e recompensas de missões/História, reutilizando autoridades/ledgers existentes e preservando dados e fontes históricas.
PRIORITY: P1 High
STATUS: ACTIVE — contratos aprovados expressamente no pedido anexado em 11/11/2026.
SCOPE: branch `codex/rpg-economy-041`, base `3cfa561ab4cd76d86e89e9757d31ad3e11d504e1`; contratos propostos em `docs/architecture/RPG-ECONOMY-041-DECISIONS.md`.
OUT_OF_SCOPE: conceder recursos retroativos; alterar resultados/recibos antigos; compras artificiais em PROD; transferir saldo; habilitar tabela de protótipo por inferência; alterar Auth/RLS além da extensão estritamente necessária e revisada.
DEPENDENCIES: decisão do proprietário para probabilidades/payouts dos cinco baús, revenda por raridade, recompensas de missão/História, limites e comportamento sem pool; gates RELEASE_POLICY.md.
ASSIGNED_AGENT: autor como implementação econômica, frontend, backend, QA e Security; revisão pelo autor sem independência. Escopo específico autorizado em apps/web, packages/game-engine, packages/database, supabase/migrations, tests/hosted, docs e memória. A autorização expressa da ECONOMY-041 prevalece sobre limites da fase de fundação.
REQUIRED_CONTEXT: `.agent/RELEASE_POLICY.md`; `ECONOMY-CONTENT-001-REPORT.md`; `RPG-CONTENT-040A-CARDS.md`; `RPG-CONTENT-040B-EQUIPMENT.md`; `TASK-0081-STORY-WORLDS.md`; `TASK-0082-GUILD-PANEL.md`.
SECURITY_CONSIDERATIONS: sorteio apenas server-side; atomicidade, idempotência, posse/conta/avatar, última cópia, autorização, rate limit e preservação de recibos exigem revisão de segurança.
ACCEPTANCE_CRITERIA:

- Cinco preços pedidos aparecem somente após contratos completos aprovados.
- Compra/abertura/revenda/recompensa usam authorities e ledgers existentes, sem saldo ou inventário paralelo.
- Duplicatas só são revendidas por decisão explícita; última cópia/equipado preservados.
- Claims verificados são únicos, sem recompensas retroativas.
- Dados e economia de PROD preservados, salvo transações futuras legítimas dos jogadores.
  TEST_PLAN:
- Após aprovação, testes direcionados de atomicidade, saldo, sorteio, entrega, replay, última cópia, isolamento Auth/avatar, quotas e falha/recuperação de pool.
- Reutilizar CI e evidências ainda válidas; seguir migration/Preview/fluxos autenticados obrigatórios da RELEASE_POLICY.md.
  DEFINITION_OF_DONE:
- Decisões aprovadas registradas; código/SQL revisados; checks aplicáveis PASS; Preview e fluxos críticos autenticados aprovados; CI exato aprovado; publicação PROD confirmada por SHA/deployment/alias; memória e relatório atualizados.
