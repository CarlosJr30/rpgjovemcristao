# TASK-0012 → Balanceamento da Fuga da Serpente e limpeza local
ID: TASK-0012
TITLE: Balanceamento da Fuga da Serpente e limpeza local dos Viajantes
OBJECTIVE: Reduzir levemente a dificuldade e remover os Viajantes de teste deste ambiente local.
PRIORITY: P2 Normal
STATUS: REWORK
SCOPE: motor e componente da Fuga da Serpente, testes relacionados, chaves locais de Viajantes, texto do botão inicial, memória da tarefa.
OUT_OF_SCOPE: redesign, outros modos e telas, assets, dados globais, dependências.
DEPENDENCIES: nenhuma.
ASSIGNED_AGENT: orquestrador assumindo implementação, QA e Security; revisões próprias, sem independência.
REQUIRED_CONTEXT: AGENTS.md, .agent/GLOBAL_CONTEXT.md, .agent/memory/CURRENT_STATE.md, .agent/WORKFLOW.md, .agent/RULES.md, .agent/SECURITY.md e arquivos afetados.
SECURITY_CONSIDERATIONS: remoção seletiva de dados locais; preservar chaves não relacionadas. Não registrar dados pessoais.
ACCEPTANCE_CRITERIA:
- Velocidade efetiva da Serpente não supera a do jogador; início e meio mais lentos, portal tensionante.
- Preparo inicial de 2 a 2,5 s; invulnerabilidade de 1 a 1,5 s após dano.
- Três vidas, Fragmentos, mapa, power-ups, portal, recompensas e visual preservados.
- Chaves de perfis e sessão removidas no navegador local, sem apagar dados globais; zero Viajantes após reload e nova abertura.
- Home oferece Criar Viajante e novo personagem pode ser criado isoladamente.
TEST_PLAN:
- Lint, typecheck, build e testes relevantes.
- Testes da curva de velocidade, colisão em corredor e quina, rota dos Fragmentos e portal, respawn.
- Inspecionar storage da origem, remover somente chaves identificadas, recarregar e testar criação.
DEFINITION_OF_DONE: critérios demonstrados, checks aplicáveis aprovados, memória atualizada.

## Evidências

## Implementação e validação

- Curva nominal anterior: 84% no início, 97% após 75 s, 104% com portal. Ciclo de respiração de ±7% podia elevar a velocidade efetiva a 111,28% da velocidade do jogador.
- Curva nominal nova: 77% no início, 88% após 75 s, 96% com portal. Oscilação mantida e velocidade efetiva limitada a 100%.
- Preparo inicial: 1,7 s → 2,3 s, sem colisão durante o preparo.
- Invulnerabilidade após perda de vida: 2,25 s → 1,35 s, com checkpoint e reposicionamento da Serpente preservados. Esta redução aproxima o tempo da faixa pedida; a reposição segura continua.
- Auditadas as gravações de produção: `rpg-jovem-cristao:journey:v1` contém todos os perfis, XP, inventário, equipamentos e progresso; `rpg-jovem-cristao:active-traveler:v1` contém a sessão; `rpg-jovem-cristao:active-traveler-id:v1` contém o ID ativo. `clear()` remove apenas essas três chaves.
- `load()` e `listSaved()` não semeiam Viajantes: com a chave ausente retornam vazio. Migração só transforma dados encontrados na chave do save.
- Teste unitário cobre remoção seletiva, sessão inativa, zero perfis e criação de um novo. E2E em contexto isolado cobre reload, reabertura por nova aba, botão Criar Viajante e novo perfil único.
- Lint PASS; typecheck PASS; build PASS; Vitest 67/67 PASS; Playwright desktop 5/5 PASS e mobile 5/5 PASS.
- Security review pelo próprio autor: remoção restrita às chaves mapeadas, dados globais preservados no teste, nenhum segredo acessado.

## Pendência de aceite

- Em 2026-09-23, o banco local real da partição `vscode-browser` foi auditado por cópia: 10 Viajantes presentes antes da limpeza. Uma limpeza temporária executada pelo próprio aplicativo removeu exatamente as três chaves de Viajantes. O código temporário e seu marcador foram removidos depois.
- Cópia nova do armazenamento real, aberta em navegador isolado após remover o código temporário e recarregada, confirmou `savedTravelers = 0`, `activeTravelerId = null`, `activeSession = false`, nenhuma chave `rpg-jovem-cristao:*` e botão `Criar Viajante`. O estado real do banco também foi verificado como vazio por cópia antes desse reload.
- Revisão de ghost restore: `load()` retorna `empty` sem a chave de save; `listSaved()` retorna lista vazia; migração só processa candidato já presente; não há seed/mock de Viajante em produção; quiz usa seed apenas para embaralhamento.
- Cópias de inspeção em `%TEMP%` ainda contêm dados antigos. Duas tentativas de exclusão com `Remove-Item` foram rejeitadas por revisão automática de aprovação (`blocked by policy`), incluindo uma tentativa com caminho absoluto resolvido e conferido. Nenhum arquivo do projeto foi apagado. Os diretórios pendentes são `rpg-vscode-storage-inspection-20260923`, `rpg-vscode-storage-check-20260923`, `rpg-vscode-storage-check2-20260923`, `rpg-vscode-storage-check3-20260923` e `rpg-vscode-storage-final-20260923` em `%TEMP%`. Arquivos `.mjs` temporários de inspeção no mesmo local também permanecem.
- O playtest visual manual da perseguição completa, coleta e dano no navegador do usuário não foi executado. Simulação da rota até o portal e testes de colisão passaram.
- Retomar para excluir as cópias temporárias quando a política permitir. A parte de limpeza da aplicação e seu aceite estão concluídos; a tarefa permanece em REWORK somente pela exclusão temporária e pelo playtest visual herdado do escopo inicial.
