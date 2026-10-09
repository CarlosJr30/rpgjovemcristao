# TASK-0015 → Economia, lojas e Arsenal do Viajante
ID: TASK-0015
TITLE: Economia funcional e equipamentos extensíveis
OBJECTIVE: Criar gasto de moedas, compra, catálogo de equipamentos, raridades e overlays compatíveis com o Avatar.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Loja do Viajante, estoque local extensível do Mercador e Loja da Guilda, raridades e loot configurados, catálogo escalável, dados bíblicos por item, conjuntos, venda/desmonte, Oficina limitada, Códice e animação ao equipar com assets aprovados.
OUT_OF_SCOPE: Servidor em tempo real e arte improvisada; registrar OVERLAY PENDENTE para itens sem asset correto.
DEPENDENCIES: TASK-0014; assets específicos de overlays para aceite visual dessa parte.
ASSIGNED_AGENT: Orquestrador com frontend, backend, game designer, conteúdo bíblico, QA e Security locais.
REQUIRED_CONTEXT: Pedido anexado seções 5–22, schemas de equipamento, Avatar runtime, persistência, dados bíblicos e telas de inventário.
SECURITY_CONSIDERATIONS: Validar compras, saldo, duplicatas e propriedade do item na fronteira; simulação local não fornece autoridade de servidor.
ACCEPTANCE_CRITERIA:
- Comprar reduz moedas uma vez e inclui item correto somente no Viajante ativo; saldo insuficiente impede compra.
- Configurações centrais cobrem raridade, preço, loot e upgrades finitos; melhores itens dependem de exploração/desafio.
- Cada item criado tem inspiração bíblica documentada e botão para abrir a referência, sem alegar poder espiritual.
- Equipar e trocar preservam a composição visual onde houver overlay compatível; demais itens exibem OVERLAY PENDENTE sem sobreposição ruim.
TEST_PLAN:
- Testes de transação, persistência e isolamento; revisão bíblica dos itens, QA visual e checks do workflow.
DEFINITION_OF_DONE:
- Critérios e gates aplicáveis aprovados, memória atualizada.

## Ampliação autorizada — Sistema de Baús (2026-09-29)

O pedido atual autoriza catálogo/loot central, persistência local e Supabase, migration/RLS/RPC, compra e abertura atômicas, integração mínima de recompensas, Mochila responsiva, testes e documentação. Auth, Fuga, Arena, narrativa, Avatar e Guilda fora do grant de recompensa permanecem fora do escopo.

### Auditoria inicial

- `garden-exploration.tsx` chama de Baú dois pontos que são consumidos imediatamente e persistem apenas IDs em `gardenOpenedChests` + moedas; não existe posse transferível para a Mochila.
- `guildRewards.ts`/`guildMissionRewards` possuem `chestLabel`, mas os claims locais e a RPC remota concedem apenas XP/moedas. O texto “Baú” não corresponde a uma entidade persistida.
- `inventory` remoto representa itens/equipamentos por `item_id`; reutilizá-lo para Baús perderia origem, operação idempotente e histórico de abertura e misturaria ciclos de vida diferentes.
- `spend_coins` é atômico apenas para o saldo. Compra de Baú exige uma RPC única que valide ownership, debite e conceda na mesma transação, com chave de operação.

### Aceite adicional

- Mochila expõe Itens, Equipamentos e Baús; Baús mostra posse, badge, vazio, catálogo comprável e resultado animado.
- Cinco tiers têm catálogo, preço, disponibilidade e loot centralizados; UI não usa `Math.random()`.
- Local e remoto acumulam quantidades e preservam origem/histórico; grant, compra e abertura são idempotentes.
- Supabase valida `travelers.user_id = auth.uid()` e não permite mutações diretas nas tabelas de Baús.
- Missões da Guilda passam a conceder Baú persistido sem alterar suas demais regras.
- Migration real e teste de duas contas permanecem manuais caso não haja banco autorizado nesta execução.

## Validação local — Baús V1 (2026-09-29)

- BUILD: PASS — `npm run build`, 19 páginas incluindo `/journey/backpack`.
- LINT: PASS — `npm run lint`, zero warnings.
- TYPECHECK: PASS — `npm run typecheck` em todos os workspaces.
- UNIT/COMPONENT/STATIC INTEGRATION: PASS — 36 arquivos e 172 testes; 22 dirigidos cobrem catálogo, RNG injetado, grant/compra/abertura, duplicatas, repositories, schema e migration.
- E2E LOCAL: PASS — compra, F5, abertura, reward único, estado vazio e responsividade em 360×800, 390×844, 412×915, 768×1024 e 1440×900; conclusão da fase concede um único Baú após reload. Desktop e mobile aprovados.
- DRIZZLE: PASS — 15 tabelas e `No schema changes, nothing to migrate` após snapshot `0002`.
- SECURITY REVIEW: CONDICIONAL — revisão pelo próprio autor em `docs/security/CHESTS-SUPABASE-V1-REVIEW.md`; sem secret ou achado crítico no diff, mas locks/RLS ainda não comprovados no banco real.
- DOCUMENTATION: PASS — modelo, preços, loot, fluxos, aplicação manual e roteiro remoto em `docs/architecture/CHESTS-SUPABASE-V1.md`.

## Condição de desbloqueio

A migration `0002_traveler_chests.sql` foi confirmada como aplicada pelo usuário. Falta concluir o roteiro remoto com duas contas, incluindo ownership, saldo insuficiente, requisito de nível, retries concorrentes, equipamento duplicado e isolamento. Até essas evidências existirem, o código fica validado localmente, mas o aceite Supabase amplo permanece bloqueado.

## Correção — revelação de equipamento ao abrir Baú (2026-09-30)

- O contexto fornecido pelo usuário confirma que a migration `0002` já foi aplicada no Supabase real. O bloqueio remanescente da tarefa ampla é somente o roteiro remoto completo com duas contas; esta correção não alterou migration, RLS, RNG, preços ou chances.
- Auditoria do fluxo confirmou que `open_chest` já concede moedas e faz `INSERT ... ON CONFLICT ... quantity + 1` em `inventory`, na mesma transação que consome o Baú. O modo local também já inseria/incrementava o item e registrava a operação para retry idempotente. O defeito observado era de apresentação.
- Payload real do RPC: `chestType`, `coins`, `itemId`, `itemName`, `source`, `remainingQuantity` e `duplicate`. Raridade e asset não vêm do servidor; a UI agora resolve `itemId` no `EQUIPMENT_CATALOG` e no manifesto fechado de assets.
- O modal revela separadamente todas as recompensas presentes: moedas com ícone e equipamento com imagem grande, nome oficial, raridade, `+1` e mensagem de quantidade aumentada quando já possuído. Inclui animação curta, redução de movimento, Escape, foco em Continuar e atalho “Ver na Mochila”.
- Após abertura, o modo local publica o novo snapshot imediatamente; o modo online recarrega wallet/inventory/equipment e publica o cache antes de recarregar a contagem de Baús. Falha excepcional de sincronização é comunicada sem esconder a recompensa já concedida.
- QA: `npm test` PASS — 36 arquivos/176 testes; dirigidos PASS — 3 arquivos/12 testes; `npm run typecheck`, `npm run lint`, `npm run build` e `git diff --check` PASS; E2E de Baús PASS — 4/4 em projetos desktop/mobile, medindo cards em cinco viewports e o modal em 390×844 e 1440×900.
- Security review pelo próprio autor: PASS para o diff. Metadados visuais são resolvidos pelo catálogo local fechado, o browser não envia RNG/recompensa e nenhum controle de Auth/RLS/persistência foi relaxado.
