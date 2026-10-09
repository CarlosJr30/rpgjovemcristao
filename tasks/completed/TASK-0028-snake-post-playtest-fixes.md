# TASK-0028 → Correções pós-playtest da Fuga da Serpente
ID: TASK-0028
TITLE: Landscape touch, balanceamento mobile e mensagens da Fuga da Serpente
OBJECTIVE: Corrigir os dois bloqueios altos encontrados no playtest e preservar portrait, tablet e desktop.
PRIORITY: P1 High
STATUS: DONE
SCOPE: estilos, componente, motor e testes exclusivos da Fuga da Serpente; polimento visual pequeno dos obstáculos; tarefa e memória.
OUT_OF_SCOPE: Auth, Supabase, RLS, migrations, Guilda, Arena, Jornada narrativa, Travelers, inventário, equipamentos e persistência.
DEPENDENCIES: TASK-0027 concluída; estado local existente preservado.
ASSIGNED_AGENT: orquestrador atuando como frontend, game designer e QA; revisão própria, sem independência.
REQUIRED_CONTEXT: pedido anexado, TASK-0027, `snake-chase-game.tsx`, `snake-game-engine.ts`, estilos e testes dirigidos.
SECURITY_CONSIDERATIONS: sem dados, rede, autenticação ou persistência; saída testada sem signOut e sem request de logout.
ACCEPTANCE_CRITERIA:
- Em 844×390, canvas, HUD, Sair e todos os controles touch ficam integralmente dentro de 100dvh sem scroll necessário.
- Velocidade efetiva mobile cai 8–10% sem alterar desktop; grace period, respawn e assistência permanecem.
- Uma partida mobile completa alcança 3/3, ativa o portal e termina em vitória; reinício e saída funcionam.
- Mensagens críticas usam até duas linhas e não truncam no portrait.
- Obstáculos ganham variação visual discreta sem alterar colisões.
- Portrait 360×800, 390×844 e 412×915; landscape 844×390; tablet 768×1024 e desktop 1440×900 não regridem.
TEST_PLAN:
- Unitários da curva desktop/mobile, colisão, rota, respawn e componente.
- E2E responsivo com bounding boxes de todos os botões dentro da viewport e ausência de scroll necessário.
- Playthrough real até vitória, portal, reinício e saída; capturas visuais nas seis viewports.
- Lint, typecheck, build, suíte unitária e `git diff --check`.
DEFINITION_OF_DONE: critérios comprovados, gates aplicáveis registrados, memória atualizada e nenhum bloqueio alto conhecido.

## Implementação

- Causa do landscape: HUD e mensagem eram autoalocados em uma grade de apenas duas linhas enquanto o palco preservava altura intrínseca; o canvas excedia a faixa disponível e o direcional era empurrado abaixo da viewport.
- Layout novo: grade `auto auto minmax(0, 1fr)` para HUD, mensagem e palco. O direcional virou overlay absoluto no canto inferior esquerdo, com safe area, 52×52 px, fundo translúcido e `z-index` acima do canvas.
- Velocidade: `MOBILE_SERPENT_SPEED_FACTOR = .9` aplicado somente quando o perfil não é desktop. Desktop continua 77%→88%→96%; mobile passa a 69,3%→79,2%→86,4%. Grace 2,3 s, respawn 1,35 s e ajuda após derrotas foram preservados.
- HUD: `white-space: normal`, wrap e clamp de duas linhas. Sondas com as quatro mensagens críticas cabem nas larguras mobile testadas.
- Visual: silhuetas das sebes variam raio, rotação e agrupamento secundário; decoração, sombra e colisão lógica permanecem independentes.

## Evidências e gates — 2026-09-29

| Check | Resultado | Evidência |
| --- | --- | --- |
| BUILD | PASS | `npm run build`; 19 páginas estáticas |
| LINT | PASS | `npm run lint` |
| TYPECHECK | PASS | `npm run typecheck` |
| UNIT TEST | PASS | `npm test`; 29 arquivos, 147/147 |
| E2E RESPONSIVO | PASS | `snake-responsive.spec.ts`; projetos desktop/mobile, seis viewports, 2/2 |
| PLAYTHROUGH | PASS | `snake-playthrough.spec.ts`; mobile 390×844, 3/3, Portal, vitória, reinício e saída; 1 PASS + 1 skip intencional no projeto desktop |
| VISUAL QA | PASS | Capturas 360×800, 390×844, 412×915, 844×390, 768×1024, 1440×900 e vitória inspecionadas |
| ACCEPTANCE | PASS | Landscape dentro da viewport; vitória em 10 s com 3 vidas, 100 pontos e 143 m; reinício 0/3 |
| SECURITY REVIEW | PASS | Revisão do próprio autor; nenhum Auth/Supabase alterado, zero request de logout e Viajante local preservado ao sair |
| DOCUMENTATION | PASS | Tarefa e `CURRENT_STATE.md` atualizados |
| NO SECRETS | PASS | Nenhum segredo adicionado ou registrado |
| NO KNOWN CRITICAL REGRESSIONS | PASS | `git diff --check`, suíte completa e E2E dirigidos aprovados |

## Bounding boxes em landscape

O E2E valida para cada botão: `top >= 0`, `left >= 0`, `right <= innerWidth` e `bottom <= innerHeight`. Os quatro controles passaram em 844×390; o corpo permanece com overflow bloqueado e o overlay mede 100dvh.
