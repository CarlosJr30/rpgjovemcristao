# TASK-0016 → Conteúdo criado pela Guilda
ID: TASK-0016
TITLE: Lições, missões e desafios da Guilda
OBJECTIVE: Permitir ao líder organizar conteúdo de célula e objetivos coletivos com recompensas calculadas por tier.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Painel do líder, lições com passagem e perguntas, missões individuais/coletivas, calendário, submissão e validação da atividade, recompensa única por tier e projeto local de acampamento.
OUT_OF_SCOPE: Avaliação de espiritualidade, XP por oração, identidade de líder autodeclarada como autorização real e backend online sem infraestrutura aprovada.
DEPENDENCIES: TASK-0015 para economia e loot; definição de autoridade/identidade para modo multiusuário real.
ASSIGNED_AGENT: Orquestrador com backend, frontend, game designer, QA e Security locais.
REQUIRED_CONTEXT: Pedido anexado seções 27–34, gate atual da Guilda e guildRewards.
SECURITY_CONSIDERATIONS: Conteúdo do líder é entrada não confiável; limitar tamanho, validar URLs/passagens, evitar HTML executável e não tratar simulação local como autorização real.
ACCEPTANCE_CRITERIA:
- Líder cria lição e desafio com campos validados, tier e prazo; participantes veem e concluem sem compartilhar dados devocionais privados.
- Recompensa deriva da tabela central, é concedida uma vez e persiste por Viajante.
- Progresso coletivo e calendário refletem eventos locais corretamente, com limitações de autoridade explícitas.
TEST_PLAN:
- Testes de fluxo, validação, persistência, idempotência, isolamento e revisão Security.
DEFINITION_OF_DONE:
- Critérios e gates aplicáveis aprovados, memória atualizada.

## Ampliação autorizada — Guilda Supabase V1 (2026-09-29)

O pedido atual autoriza persistência remota, schema/migration, RLS, RPCs, repositories e UI autenticada. O modo local explícito continua como fallback isolado; Auth e Travelers existentes são reutilizados sem substituição. Aplicar a migration no projeto real continua manual e não está implícito nesta execução.

### Auditoria pré-implementação

- A rota `/journey/guild` monta `GuildHub`; `GuildScreen` é legado não referenciado.
- `localGuilds.ts` persiste identidade/código/líder; `guildContent.ts` persiste conteúdo; progresso e claims vivem no `Traveler` local. A liderança atual é um toggle de UI, não autorização.
- `GuildContentBoard` e estilos podem ser reaproveitados conceitualmente, mas suas mutações diretas em localStorage não atendem multiusuário/RLS.
- Os quatro tiers já existem no domínio local; serão unificados e espelhados no SQL autoritativo.
- Auth, `travelers`, wallet, cliente singleton e repositories já existem. O UUID remoto do Traveler coincide com o cache/activeTraveler.
- A migration 0000 tem `add_coins` client-callable e updates diretos de XP/wallet, risco residual preexistente documentado. Guilda V1 não usará valores enviados pelo browser: o banco calculará e aplicará o tier internamente.
- Viram remotos: Guildas, membros, pedidos, missões, progresso, aprovação e ledger idempotente de recompensa.

### Aceite adicional

- Criador autenticado vira leader; Traveler fica em no máximo uma Guilda ativa.
- Entrada usa request pendente e aprovação; membro não cria/publica missão.
- Líder escolhe tier, nunca XP/moedas; self-complete e aprovação concedem recompensa atômica uma vez.
- RLS isola Guildas e ownership por `travelers.user_id = auth.uid()`; dados Auth/Diário/reflexões não entram no modelo.
- UI autenticada usa Supabase como fonte principal e cobre loading/error/empty/expired/pending em mobile/desktop.
- Schema, migration, repositories, UI, testes e `docs/architecture/GUILD-SUPABASE-V1.md` entregues; teste real de duas contas e aplicação da migration ficam explicitamente manuais se o ambiente não estiver disponível.

## Validação local — 2026-09-29

- BUILD: PASS — `npm run build`; 19 páginas estáticas, incluindo `/journey/guild`.
- LINT: PASS — `npm run lint`, zero warnings.
- TYPECHECK: PASS — `npm run typecheck` em todos os workspaces.
- UNIT TEST: PASS — `npm test`, 32 arquivos e 158 testes.
- INTEGRATION LOCAL: PASS — repositories/RPC contracts e migration cobertos; Drizzle confirmou `No schema changes, nothing to migrate` após gerar o snapshot `0001`.
- E2E LOCAL: PASS — painel local e publicação/persistência da Guilda em desktop/mobile, 4/4 cenários dirigidos.
- SECURITY REVIEW: CONDICIONAL — revisão pelo próprio autor em `docs/security/GUILD-SUPABASE-V1-REVIEW.md`; sem secret ou achado crítico no diff, mas sem comprovação RLS real.
- DOCUMENTATION: PASS — arquitetura, aplicação manual, rollback e roteiro de aceite real documentados.
- Regressão conhecida fora do escopo: a execução ampla de `home.spec.ts` tem 14 casos antigos que ainda não selecionam o modo local explícito; os cenários de Guilda foram atualizados e passam.

## Condição de desbloqueio anterior

A aplicação da sequência até `0002_traveler_chests.sql` foi confirmada pelo usuário em 2026-09-30. O roteiro de duas contas continuou pendente e a condição vigente está atualizada abaixo para incluir a incremental `0003`.

## Ampliação — Baús nas recompensas das Missões (2026-09-30)

- O usuário confirmou que `0002_traveler_chests.sql` já está aplicada. A fonte compartilhada `guildMissionRewards`, em `@rpg/game-engine`, agora centraliza `xp`, `coins`, `chestType`, `chestQuantity` e `chestLabel`; `guildTierChest` é apenas uma projeção derivada para compatibilidade.
- Mapeamento fechado: Normal = 80 XP + 25 moedas + 1 Comum; Grande = 240 + 100 + 1 Incomum; Épica = 480 + 220 + 1 Raro; Extraordinária = 720 + 360 + 1 Épico. Nenhum tier de Missão concede Baú Extraordinário.
- Preview do líder e cards do membro usam componentes compartilhados e exibem a recompensa completa. O líder continua enviando somente o tier; XP, moedas e Baú não são campos editáveis.
- No modo local, aprovação válida processa XP, moedas e Baú no mesmo save e muda o status para `claimed`; a chave `guild_activity:{contentId}` impede novo grant. O claim separado permanece somente para compatibilidade com saves antigos já em `approved`.
- No Supabase, `0003_guild_mission_chest_rewards.sql` substitui somente `apply_guild_mission_reward`. O ledger `UNIQUE(mission_id, traveler_id)` decide a primeira aplicação, e `grant_traveler_chest` recebe a chave determinística `guild_mission:{missionId}:{travelerId}` dentro da mesma transação. Submissão com aprovação não concede nada; `self_complete` concede diretamente.
- Cache online do próprio Viajante é recarregado após `self_complete` e ao carregar progresso com `reward_claimed_at`, permitindo que a Mochila reflita a posse remota sem F5 no fluxo normal. A aprovação de outro usuário permanece dependente de nova consulta/navegação, pois a V1 não possui realtime.
- QA: `npm test` PASS — 36 arquivos/179 testes; dirigidos PASS — 6 arquivos/25 testes; build/typecheck/lint e `git diff --check` PASS; E2E local Guilda PASS — 2/2 desktop/mobile, incluindo preview, concessão imediata, isolamento por Traveler, Mochila e reload sem duplicação.
- Security review pelo próprio autor: PASS local. `0003` não altera tabelas/RLS, mantém `search_path = ''`, revoga execução pública/autenticada da função interna e não aceita valores econômicos do browser. Aceite remoto continua condicionado à aplicação da `0003` e ao roteiro de duas contas.

## Condição de desbloqueio atualizada

Aplicar administrativamente `0003_guild_mission_chest_rewards.sql` após a `0002` já confirmada e concluir o roteiro real de duas contas, comprovando os quatro tiers, ausência de grant antes da aprovação, idempotência concorrente e isolamento. Até essas evidências existirem, a integração está concluída localmente, mas a TASK-0016 ampla permanece BLOCKED no ambiente real.

## Ampliação — Painel do Líder (2026-09-30)

- Rota `/journey/guild/manage` e entrada exclusiva do líder na Guilda autenticada. Membro na rota recebe a visão comum. O formulário de criação já existente é reutilizado; edição só em rascunho. Ações incluem publicar, cancelar rascunho, encerrar missão, revisar com orientação e remover membro, todas por RPC.
- Dashboard e relatório usam agregação real `guild_admin_stats`; pendências são carregadas por missão, histórico e missões antigas em páginas de 20. `guild_activity_log` é leader-only, alimentado por triggers, sem dados privados. `0004_guild_leader_panel.sql` e rollback entregues, não aplicados.
- QA local: lint, typecheck, 186 testes e build PASS; nova rota no build. Testes de componente e contratos SQL cobrem acesso e operações principais. Segurança local revisada; validação de RLS e reward em Supabase real, bem como QA visual autenticado nos cinco viewports solicitados, permanecem pendentes.
- STATUS permanece BLOCKED para aceite remoto. Aplicar `0003` e depois `0004` manualmente, executar roteiro de duas contas e viewport. Ver `docs/architecture/GUILD-LEADER-PANEL.md`.
