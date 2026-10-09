# TASK-0029 → Mapa completo da Fuga da Serpente no mobile
ID: TASK-0029
TITLE: Fit-to-view integral da Fuga da Serpente em mobile e tablet
OBJECTIVE: Mostrar 100% do mapa durante toda a partida em portrait, landscape e tablet, sem sobreposição do HUD/controles e sem alterar gameplay.
PRIORITY: P1 High
STATUS: DONE
SCOPE: renderização, layout responsivo e testes exclusivos da Fuga da Serpente; capturas nas seis viewports pedidas; tarefa e memória.
OUT_OF_SCOPE: velocidade, dificuldade, vidas, respawn, grace period, colisores, spawn, mapa lógico, pontuação, Fragmentos, Auth, Supabase e persistência.
DEPENDENCIES: TASK-0028 concluída.
ASSIGNED_AGENT: orquestrador atuando como frontend e QA; revisão própria, sem independência.
REQUIRED_CONTEXT: pedido anexado, TASK-0028, `snake-chase-game.tsx`, estilos e testes dirigidos.
SECURITY_CONSIDERATIONS: N/A; mudança local de apresentação, sem dados, rede, autenticação, dependências ou persistência.
ACCEPTANCE_CRITERIA:
- 100% do mundo 864×504 aparece em 360×800, 390×844, 412×915, 844×390 e 768×1024.
- Mobile/tablet não usa zoom fixo nem camera follow; fit preserva aspect ratio e centraliza o mapa.
- HUD, mensagem e controles ficam fora dos limites renderizados do mapa; desktop 1440×900 não regride.
- Viajante, Serpente, Fragmentos, powerups e portal mantêm tamanho visual mínimo sem alterar colliders.
- Teste automático comprova que `mapRect` cabe entre HUD e controles e dentro da viewport.
TEST_PLAN:
- Unitários do perfil responsivo e do cálculo de fit/centralização.
- E2E responsivo nas seis viewports, incluindo limites do mapa, HUD, mensagem, controles e screenshot.
- Lint, typecheck, build, suíte unitária, E2E dirigido e `git diff --check`.
DEFINITION_OF_DONE: aceite comprovado, gates aplicáveis registrados, capturas inspecionadas, memória atualizada e tarefa movida para `completed/`.

## Implementação

- Causa: mobile/tablet aplicavam zoom fixo de 1,4×, 1,25× e 1,3× e moviam a câmera para seguir o Viajante. A janela lógica ficava menor que o mundo 864×504 e cortava suas bordas.
- `getMapFit` calcula `min(availableWidth / 864, availableHeight / 504)` e offsets centrais. A câmera fica em 0,0; movimento, look-ahead e shake globais não deslocam o mapa em mobile/tablet.
- Escala visual permanece separada: atores têm piso de 24 px e pickups de 14 px na tela, sem mudar colliders.
- Portrait/tablet usam palco 12:7 entre HUD/mensagem e controles. Landscape usa controles em coluna lateral própria, sem overlay.
- Canvas CSS observados, arredondados: 349×203 (360×800), 379×221 (390×844), 401×234 (412×915), 638×264 (844×390), 757×441 (768×1024) e cerca de 994×580 (1440×900). O mapa ocupa o maior retângulo 12:7 contido no canvas; em landscape sobra espaço lateral intencional.

## Evidências e gates — 2026-09-29

| Check | Resultado | Evidência |
| --- | --- | --- |
| BUILD | PASS | `npm run build`; 19 páginas estáticas |
| LINT | PASS | `npm run lint` |
| TYPECHECK | PASS | `npm run typecheck` |
| UNIT TEST | PASS | suíte completa 29 arquivos, 148/148; teste dirigido 4/4 |
| E2E RESPONSIVO | PASS | `snake-responsive.spec.ts`; projetos desktop/mobile 2/2, seis viewports em cada projeto |
| E2E PLAYTHROUGH | PASS | mobile completa 3/3, Portal, vitória, reinício e saída; 1 PASS + 1 skip desktop intencional |
| VISUAL QA | PASS | seis PNGs por projeto em `test-results/snake-responsive-*/`; mapa inteiro e elementos legíveis inspecionados |
| ACCEPTANCE | PASS | `mapRect` dentro da viewport, abaixo da mensagem e sem interseção com controles em todas as viewports |
| SECURITY REVIEW | N/A | revisão do próprio autor; nenhuma superfície de segurança, dado, rede, Auth ou persistência alterada |
| DOCUMENTATION | PASS | tarefa e `CURRENT_STATE.md` atualizados |
| NO SECRETS | PASS | nenhum segredo adicionado ou registrado |
| NO KNOWN CRITICAL REGRESSIONS | PASS | desktop inspecionado; gameplay e suíte completa preservados; `git diff --check` PASS |

## Capturas

- `snake-phone-360x800.png`
- `snake-phone-390x844.png`
- `snake-phone-412x915.png`
- `snake-landscape-844x390.png`
- `snake-tablet-768x1024.png`
- `snake-desktop-1440x900.png`

As capturas finais estão nos diretórios de resultado dos projetos desktop e mobile do Playwright.
