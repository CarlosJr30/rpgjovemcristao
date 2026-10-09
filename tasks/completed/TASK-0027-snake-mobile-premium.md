# TASK-0027 → Fuga da Serpente mobile premium
ID: TASK-0027
TITLE: Fullscreen mobile, conforto de gameplay e Fragmentos de Luz
OBJECTIVE: Tornar a Fuga da Serpente legível e confortável no mobile, preservar o desktop e substituir integralmente a maçã por Fragmento de Luz.
PRIORITY: P1 High
STATUS: DONE
SCOPE: componente, motor, estilos, assets e testes exclusivos da Fuga da Serpente; registro de evidências e memória.
OUT_OF_SCOPE: Supabase, Auth, RLS, migrations, Guilda, Arena, Quiz, Jornada narrativa, Travelers, inventário, equipamentos e persistência global.
DEPENDENCIES: estado funcional da TASK-0014; mudanças locais preexistentes foram preservadas.
ASSIGNED_AGENT: orquestrador atuando como frontend, game designer e QA; revisão própria, sem independência.
REQUIRED_CONTEXT: pedido anexado, `snake-chase-game.tsx`, `snake-game-engine.ts`, estilos e testes dirigidos.
SECURITY_CONSIDERATIONS: sem dados, rede, autenticação ou persistência; Fullscreen API somente por gesto explícito e com saída restaurável.
ACCEPTANCE_CRITERIA:
- Mobile usa 100vw × 100dvh, safe areas, scroll bloqueado e restaura a interface externa ao sair.
- Câmera segue o Viajante com zoom por viewport e clamp nas bordas; desktop mantém o enquadramento próprio.
- Corredores ganham 25–35% de largura útil sem ampliar colliders; movimento e colisão permanecem estáveis.
- Curva da Serpente, grace period, respawn, três vidas e assistência mantêm tensão sem injustiça.
- Maçã, referências e asset são removidos do minigame; seis Fragmentos de Luz preservam mecânica e pontuação.
- Três Fragmentos de Sabedoria continuam distintos e são o único gate do Portal.
- HUD, controles, efeitos, canvas/DPR e limite de partículas atendem mobile sem regressão desktop.
TEST_PLAN:
- Lint, typecheck, build e suíte unitária completa.
- Testes de mapa, rotas, colisão, curva, respawn, escala e semântica do componente.
- Playwright em 360×800, 390×844, 412×915, 844×390, 768×1024 e 1440×900; inspecionar capturas.
- Confirmar ativação e restauração do modo mobile ao sair.
DEFINITION_OF_DONE: aceite atendido, checks aplicáveis aprovados, asset salvo no projeto e memória atualizada.

## Implementação e valores finais

- Causa original: buffer fixo 720×420 reduzido por CSS, miniaturizando toda a cena antes de o zoom interno produzir ganho visual.
- Mundo: 720×420 com células de 30 → 864×504 com células de 36. Collider do Viajante permanece 6×4; largura útil de um corredor passou de 18 para 24 (+33,3%). Collider da Serpente permanece 9×6 e independente do sprite.
- Canvas sincroniza tamanho CSS, buffer interno e DPR limitado a 2. Partículas simultâneas limitadas a 80.
- Perfis de câmera: portrait 1,4×; landscape 1,25×; tablet 1,3×; desktop 1×. Follow interpola por `min(1, deltaTime × 8)` e faz clamp no mapa.
- Movimento mantém deltaTime limitado a 33 ms, diagonal normalizada, resolução X/Y e corner forgiveness simétrico.
- Curva anterior registrada: 84% inicial, 97% intermediária/final por tempo e 104% com portal. Curva vigente: 77% inicial, até 88% por tempo e 96% com portal, com velocidade efetiva limitada a 100%; ajuda opcional reduz outros 10% após duas derrotas.
- Grace period 2,3 s; invulnerabilidade após dano 1,35 s; três vidas preservadas.
- Mobile ativo usa `position: fixed`, 100vw × 100dvh, safe areas, bloqueio de scroll/overscroll, HUD e controles; header, sidebar, footer, breadcrumbs e conteúdo externo ficam ocultos. “Sair” restaura a página. Fullscreen API é ação opcional e não é requisito do layout.
- HUD mostra vidas, Sabedoria 0/3, pontos e objetivo. Touch usa 56×52 px em portrait e 52×52 px em landscape, com cancelamento seguro de ponteiro.
- Seis maçãs foram substituídas por seis Fragmentos de Luz nos mesmos pontos e com a mesma colisão; cada um mantém 100 pontos. `apple_red.png` e o componente legado não utilizado foram removidos.
- Novo asset raster transparente: `apps/web/public/assets/minigame/pickups/light_fragment.png` (1254×1254, RGBA), gerado pela ferramenta de imagem integrada como cristal radiante dourado/marfim com acento teal, sem fruta ou símbolo de fruto proibido.
- Fragmentos de Sabedoria preservam o cristal azul e gate 3/3; Fragmentos de Luz usam cristal dourado com glow/pulse. Powerups, portal inativo/ativo, sombras, bob, inclinação, ring, flash, shake leve, bursts e overlays foram preservados/refinados.

## Gates — 2026-09-29

| Check | Resultado | Evidência |
| --- | --- | --- |
| BUILD | PASS | `npm run build`; 19 páginas estáticas |
| LINT | PASS | `npm run lint` |
| TYPECHECK | PASS | `npm run typecheck` |
| UNIT TEST | PASS | `npm test`; 29 arquivos, 146/146 |
| INTEGRATION / E2E | PASS | `npm run test:e2e -- tests/e2e/snake-responsive.spec.ts`; desktop e mobile 2/2, seis viewports por projeto |
| VISUAL QA | PASS | Capturas 360×800, 390×844, 412×915, 844×390, 768×1024 e 1440×900 inspecionadas; HUD, câmera, controles e distinção dos cristais legíveis |
| ACCEPTANCE | PASS | Ativação mobile, DPR, dimensões, touch, saída e restauração automatizados; movimento/rota/respawn cobertos por unitários |
| SECURITY REVIEW | PASS | Revisão do próprio autor; sem secrets, dados, rede ou mudança de autorização/persistência |
| DOCUMENTATION | PASS | Tarefa e `CURRENT_STATE.md` atualizados |
| NO SECRETS | PASS | Nenhum segredo adicionado |
| NO KNOWN CRITICAL REGRESSIONS | PASS | Suíte completa, build e E2E dirigido aprovados |

O playtest manual completo até vitória e derrota herdado pela TASK-0014 continua como pendência daquela tarefa; não invalida os critérios automatizados e visuais deste pacote.
