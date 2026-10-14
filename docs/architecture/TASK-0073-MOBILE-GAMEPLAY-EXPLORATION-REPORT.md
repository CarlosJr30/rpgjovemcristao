# TASK-0073 — Mobile gameplay e exploração UX V1

Escopo autorizado em 14/10/2026 e reiterado pelo usuário: implementar, validar, commit/push normal e publicar no projeto Vercel existente. Base `2d4fe22a1af739192a2bbe02e10e3dd541c618d0`, que já contém o merge externo do PR#1. Trabalho isolado em `D:/rpg-jovem-cristao-task-0073`; alterações pendentes da TASK-0072B no workspace original foram preservadas. QA/Security pelo autor, sem revisão independente.

## Diagnóstico e arquitetura

O HUD combinava altura máxima de 20px, overflow/nowrap/ellipsis e tipografia antiga muito pequena. Mensagens longas perdiam a orientação durante a perseguição. A versão atual permite quebra de linha, mostra a frase curta “A serpente está atrás de você! Use os obstáculos para escapar.” e mantém a mensagem original na pausa. Valores/objetivo permitem wrapping; labels e valores mobile têm 12px/14px na escala normal, sem ellipsis. O status tem semântica `aria-live="polite"`.

A introdução anterior era um overlay sobre o canvas, coexistindo com HUD, direcional e várias instruções. A introdução atual mostra nome, objetivo, controle, Começar e Como jogar; HUD/stage/controles ficam ocultos até começar. Tutorial opcional de duas etapas, consultável pela pausa, sem interromper o movimento por novo fluxo obrigatório. Fullscreen real ou fallback existente preservado.

A exploração tinha dez pontos com nomes permanentemente posicionados sobre a arte; desafios se abriam dentro do próprio mapa em painéis absolutos distintos. Agora, até 1024px, pontos mantêm ícones/arte, recebem números e usam ✓ quando concluídos. O toque seleciona um ponto e abre nome completo, descrição, estado, objetivo/recompensa e ação. A atividade abre no mesmo componente de leitura. Desktop mantém interação direta e rótulos.

`ContextPanel` usa `<dialog>` nativo, backdrop, limite de altura, conteúdo rolável, cabeçalho/fechar acessíveis, safe areas, foco visível, Tab contido, Escape e retorno do foco. Trava o scroll somente durante o modal. Cliques do WebKit restauram o foco por foco explícito no disparador. Sequências parciais ficam em estado transitório do componente; fechar/reabrir não as apaga. Ao mudar Viajante, a chave do componente evita transferir rascunhos/timers. Quiz mobile usa alternativas em coluna única e feedback legível.

## Preservação e controles

Mundo da Serpente 24×14 e células lógicas de36px preservados. Nenhuma mudança de engine, collider, mapa, velocidades, dificuldade, itens, pontos, vitória/derrota, câmera, swipe ou buffer. O loop de render/input continua idêntico à base; arquivos de câmera/swipe/engine conferidos pelo baseline. Portrait mantém câmera ampliada acompanhando o jogador, sem voltar à visão integral antiga. Desktop mantém visão integral. Layout recalcula área disponível; direcional segue opcional. Scroll externo liberado; `touch-action:none` permanece restrito ao canvas.

Recompensas, respostas corretas, perguntas, referências/links bíblicos, devocional, aprovação do líder, catálogos, saves, Auth, repositories e banco não foram alterados. Baseline de2.062 arquivos e comparação física por SHA; nenhum arquivo protegido divergente. `next-env.d.ts` é gerado pelos checks e será restaurado antes do commit. Build confirmou54HD e oito hashes das fontes restritas intactos; nenhum Body-Fit pendente foi ativado.

## QA e evidências

Build otimizado local com `next start` em3173, diretório de teste separado `.next/task-0062-mobile`. Playwright usa Edge/Chromium e WebKit Windows; não representa aparelho físico. Todos os novos fluxos usam contextos isolados, nomes/saves sintéticos e bloqueiam serviços externos. Sem edição de dados reais. Baseline antes:66PNG em11dimensões; capturas finais depois incluem intro, tutorial, HUD/perseguição, pausa, fullscreen, exploração, painel, enigma, quiz e texto200%.

Matriz:320×568,360×800,375×812,390×844,412×915,430×932,844×390,915×412,768×1024,1440×900,1920×1080. Verifica pontos sem colisão, nenhum overflow horizontal, mensagem completa, canvas utilizável, direcional e pausa. Casos adicionais: foco/Escape/Tab, fragmentos/respostas parciais, enigma errado/correto, recompensa idempotente após reload, quiz com alternativa única, retorno à Jornada, fullscreen, swipe cardinal/curto/diagonal/cancel, teclado, câmera limitada, derrota e reinício. Playthrough/vitória e touch nativo são checks adicionais da regressão TASK-0066.

| Gate | Evidência / resultado |
| --- | --- |
| Lint | `npm run lint` PASS |
| Typecheck | `npm run typecheck` PASS |
| Unitários | `npx vitest run --maxWorkers=2`:443/67arquivos PASS |
| Build | `RPG_MOBILE_E2E=1 npm run build`:20rotas,209públicos,727artefatos,54HD,8SHA PASS |
| E2E gameplay |63PASS após revisão tipográfica;12rechecks de painel/zoom/tutorial PASS após ajuste final do título mobile |
| Regressões Home/Arena/Guilda/Auth |41PASS;1skip exclusivamente desktop do caso mobile da Arena |
| Vitória e touch nativo |2playthroughs Android/WebKit PASS;2casos de câmera/touch nativo em4orientações PASS |
| Texto200% da Serpente |3PASS, Android/WebKit/desktop; incluídos nos63finais |
| Chat |10checks UI com fixtures; integridade do código e bundle preservada. Não é aceite real de duas contas |
| HTTP local |7rotas200,8áudios404,8fontes404,5DEV404;18scripts frontend sem padrão de credencial privada ou service role; bundle chat presente |
| Segurança/preservação | PASS técnico; revisar staging e receipt antes do push |
| Vercel/produção | Pendente dos gates; somente registrar READY/SHA após confirmação |

Falhas anteriores não foram omitidas: mock nativo de dialog ausente no jsdom corrigido; WebKit precisava foco explícito; fullscreen CDP perdia override ao desconectar cedo; diretório de métricas precisava mkdir; runs concorrentes com mesmo outputDir colidiam e passaram a usar nomes distintos; seletores Home antigos ignoravam menu/accordion mobile e três presets já existentes; indicador DEV interceptava interação, eliminada ao revisar o build de produção. Um timeout de import sob concorrência alta passou na execução completa limitada a dois workers, sem mudar timeout do teste. O HTTP308 da canonicalização de `/tools/arena-lab/` termina em404; o smoke passou a conferir destino na mesma origem.

A inspeção visual final encontrou herança de fontes muito pequenas/ellipsis no HUD e a corrigiu antes da publicação. Texto200% levou a título mobile mais compacto e captura adicional dos botões após scroll.108E2E distintos aceitos, sem contar rechecks duplicados. O playthrough encontrou seletor `header` ambíguo por incluir o cabeçalho do dialog fechado; passou a usar o banner real da aplicação. A coleta WebKit registrou cancelamentos de prefetch RSC ao navegar/fechar contexto; coletor aguarda networkidle antes dessas operações e repete evidências, preservando o log original. Performance é observação curta de RAF após aquecimento, sem throttle, no host Windows. Heap/CLS indisponíveis no WebKit são null; não inferir60FPS no POCO. Métricas finais constam no receipt QA. Não houve nova dependência runtime; módulos locais existentes reutilizados. Só runtimes oficiais de browser de teste foram preparados no cache.

Evidências finais:352PNG (66antes +143depois Chromium +143depois WebKit), zero overflow horizontal/colisão de pontos/erroJS após settle de prefetch, revisão visual pelo autor. Galeria `build/task-0073-mobile-gameplay-exploration/review/index.html`; receipt `qa-summary.json` e comparação `preservation-summary.json`. Captura de feedback do Quiz reposiciona a página até o feedback, documentando o conteúdo realmente lido, além da pergunta. Navegação Próxima verificada nos três perfis,3rechecks PASS. Performance final: Android/desktop p95~7ms, WebKit Windows78ms, CLS Chromium~0,0514; amostra emulada curta, não medição física nem garantia de FPS.

Staging seletivo final:388arquivos,36textuais/352PNG, zero achados heurísticos de credencial privada/service role, zero exclusões/cache/configuração privada; next-env restaurado. Diff/check e inspeção de escopo PASS. QA/Security pelo autor. Fetch final mantém origem/main2d4fe22, permitindo push normal após commit.

## Arquivos e reprodução

Runtime: `garden-exploration.tsx`, `garden-mobile.module.css`, `context-panel.tsx/css`, `snake-chase-game.tsx`, `snake-mobile.module.css`, `journey.module.css`, `screens/phase.tsx`. QA: teste unitário da Serpente, novo `gameplay-exploration.spec.ts`, harnesses Home/auditoria/Arena/avatar/Serpente/playthrough/responsive, `playwright.gameplay-exploration.config.ts`. Scripts: coleta visual, comparação de integridade, smoke público. Governança: contrato, memória, checklist, parecer de segurança, este relatório e allowlist de evidências no `.gitignore`. Nenhuma migration.

Reproduzir com servidor de produção local em3173: `npx playwright test --config=playwright.gameplay-exploration.config.ts tests/e2e/gameplay-exploration.spec.ts tests/e2e/serpent-mobile-v2.spec.ts`. Selecionar `GAMEPLAY_QA_RUN` único por execução. Para capturas: `node scripts/mobile-gameplay-exploration-review.mjs after`, com `GAMEPLAY_QA_BROWSER=webkit` para o segundo engine. Não repetir `before`: baseline imutável. Integridade: `node scripts/mobile-gameplay-preservation.mjs`. Smoke usa `GAMEPLAY_QA_URL` e aceita somente localhost/projeto de produção esperado.

## Publicação e aceite físico

CLI autenticado na equipe `carlos-junior-s-projects`; projeto `rpgjovemcristao-web` / `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, root `apps/web`, repo CarlosJr30/rpgjovemcristao e branch produção `main` confirmados. Fetch confirmou base sem avanço antes da revisão. Fluxo: gates → staging seletivo/sem secrets → commit → push normal `HEAD:main` → automático Vercel → READY/SHA → smoke e UI pública. Não criar projeto, deploy duplicado, bypass ou alterar proteção/ambiente/banco.

URL prevista: https://rpgjovemcristao-web-inky.vercel.app/ . Commit/SHA remoto/deployment/READY e capturas públicas ainda pendentes neste registro pré-release. O encerramento será atualizado localmente após verificação, sem segundo deploy somente documental.

Chat: PR#1 integrado externamente antes desta task. UI/bundle/arquivos de chat preservados e regressões cobertas; envio real A↔B, reconexão e isolamento de duas contas da TASK-0072B continuam sem novo aceite observado. Não declarar o chat aprovado por teste real. A TASK-0073 exige regressão e acesso preservados; não altera as permissões do chat nem resolve aquele aceite humano.

POCO X7: testar URL de produção após release; intro/Como jogar, enigmas/painel, texto ampliado, portrait/landscape, swipe/curvas/câmera, direcional, pausa/fullscreen e retorno. Teste físico e game feel dependem do usuário. `DEPLOY_COMPLETE` somente após READY e validação pública; `PHYSICAL_QA_APPROVED` somente após confirmação humana.
