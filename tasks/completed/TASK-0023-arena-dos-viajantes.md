# TASK-0023 → Arena dos Viajantes — MVP funcional
ID: TASK-0023
TITLE: Arena dos Viajantes — MVP funcional
OBJECTIVE: Entregar uma Arena 1x1 por turnos, jogável do início ao resultado, usando atributos e equipamentos reais dos Viajantes.
PRIORITY: P1 High
STATUS: DONE
SCOPE: `packages/game-engine/`, `apps/web/app/journey/arena/`, `apps/web/features/journey/`, navegação, persistência local exclusiva da Arena, testes e documentação desta tarefa.
OUT_OF_SCOPE: WebSocket, PvP remoto real, ranking competitivo, 2x2, chefe de Guilda, expedição e mudanças nos fluxos existentes da Jornada.
DEPENDENCIES: TASK-0022.
ASSIGNED_AGENT: FRONTEND com autorização do orquestrador para integrar regras centrais em `packages/game-engine/` e persistência local da Arena, conforme pedido explícito do usuário.
REQUIRED_CONTEXT: `.agent/GLOBAL_CONTEXT.md`, `.agent/memory/CURRENT_STATE.md`, `docs/game-design/BATTLE-SYSTEM.md`, modelos de Viajante, atributos, equipamentos e armazenamento atuais.
SECURITY_CONSIDERATIONS: O runtime atual não possui backend/autenticação. Resultados locais não serão apresentados como PvP seguro; contratos de snapshot serão preparados para futura validação no servidor. Entradas persistidas serão validadas e limitadas.
ACCEPTANCE_CRITERIA:
- Arena acessível pela navegação principal e responsiva.
- Jogador seleciona adversário salvo ou de treino, inicia duelo, escolhe Atacar/Defender/Focar/Habilidade e chega a vitória ou derrota.
- HP, dano, Defesa, Sabedoria, Foco, iniciativa e poder de combate usam configuração/funções centralizadas.
- Equipamentos equipados geram snapshot e efeitos de batalha extensíveis.
- Histórico, recompensas limitadas e anti-farm funcionam localmente sem anunciar multiplayer real.
- Engine usa seed e snapshots imutáveis; estados e contratos assíncronos estão definidos.
- Testes cobrem regras centrais e cenários de builds; lint, typecheck, build e testes aplicáveis passam.
TEST_PLAN:
- Vitest para fórmulas, determinismo, ações, efeitos, cooldown/uso, fim, recompensa, anti-farm, snapshot e cenários de builds.
- Teste de componente/integração da Arena e E2E desktop/mobile do fluxo completo.
- Inspeção visual da Arena em desktop e mobile, incluindo movimento reduzido.
DEFINITION_OF_DONE:
- Critérios observáveis atendidos, checks aplicáveis registrados, sem regressão crítica, memória atualizada e tarefa movida para `tasks/completed/`.

## Implementação

- Motor puro e seeded em `packages/game-engine`, com snapshots, ações, iniciativa, efeitos, estatísticas e resultado.
- Arena responsiva em `/journey/arena`, com lobby, matchmaking local, pré-batalha, duelo, log, resultado e replay.
- Adversários de treino e Viajantes salvos localmente disponíveis como snapshots controlados pelo sistema.
- Histórico e anti-farm em storage separado; limpeza geral também remove os registros da Arena.
- PvP remoto identificado na interface e documentação como indisponível por ausência de backend/autenticação.

## Self validate e gates

- BUILD PASS: `npm run build`; 18 páginas geradas, incluindo `/journey/arena`.
- LINT PASS: `npm run lint`.
- TYPECHECK PASS: `npm run typecheck` em todos os workspaces.
- UNIT TEST PASS: `npm test -- --run`; 16 arquivos, 97 testes.
- INTEGRATION TEST PASS: `npm run test:e2e`; 27 testes aprovados e 1 caso desktop intencionalmente ignorado por ser específico de mobile.
- ACCEPTANCE CRITERIA PASS: fluxo entrar → selecionar → iniciar → agir → concluir → resultado → voltar → repetir observado em desktop e mobile; histórico permaneceu após reload.
- SECURITY REVIEW PASS (revisão do próprio autor): storage limitado e validado, IDs de batalha idempotentes, nenhum secret, dado pessoal novo ou alegação de autoridade remota. Limite conhecido: resultados e recompensas continuam sob autoridade local.
- DOCUMENTATION UPDATED: `docs/architecture/ARENA-MVP.md`.
- NO SECRETS PASS.
- NO KNOWN CRITICAL REGRESSIONS PASS: suíte E2E completa aprovada.
- QA visual PASS: capturas desktop/mobile inspecionadas; HUD, log, resultado e quatro ações legíveis. Duelo inicial recalibrado de 30 para 9 rodadas na sequência automática de ataque.
