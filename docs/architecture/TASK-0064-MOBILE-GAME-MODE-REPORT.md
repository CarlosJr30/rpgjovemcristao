# TASK-0064 — Mobile Game Mode V1

Projeto: `D:/Projetos IA/rpgjovemcristao`. Execução local em 2026-10-10. Base `main`, HEAD `90aa0fc821b2856f03f114698e5e9e8b8b040a3d`. Publicação TASK-0063 consultada apenas para baseline: https://rpgjovemcristao-web-inky.vercel.app/.

**Estado final: DONE — somente no escopo local.** Implementação, emulação, evidências e gates locais concluídos. Teste físico no POCO X7 e publicação específica permanecem pendentes. Nenhum commit, push, deploy ou alteração de serviço executado nesta tarefa. QA e Security pelo próprio autor, sem revisão independente alegada.

## 1–3. Causa raiz e arquitetura

Não foi encontrada uma viewport desktop simulada no telefone, iframe, `zoom` global ou `transform: scale` no shell. Em 390×844, `innerWidth`, `clientWidth` e `scrollWidth` do baseline eram 390; metadata `width=device-width, initial-scale=1, viewport-fit=cover`; root/shell/main sem transformação, zoom 1. A largura útil do main, descontando 12 px por lado, já era 366/390 = **93,8%**. Ausência de overflow e largura correta não comprovavam boa jogabilidade.

A organização anterior empilhava marca, HUD, títulos, painéis decorativos, informações secundárias e ações. A área principal começava em y=188,9. O Avatar da Home era um thumbnail de 33×49,5 px. O combate começava em y=836, com a ação ATACAR em y=1334. A tela de Equipamentos tinha um Avatar grande, mas seus slots ficavam abaixo da primeira tela. A preparação do minigame tinha um campo alto dentro de outros painéis, empurrando o início para y=1056.

O novo `MOBILE_GAME_MODE` é uma apresentação do mesmo jogo para largura ≤1024 px, com variação em landscape de pouca altura. Usa topo compacto, contexto/jogador, perfil com informações adicionais, menu acessível e navegação inferior de cinco rotas existentes. Home prioriza objetivo/Avatar/CTA; Equipamentos separa seis slots e inventário expansível; Arena organiza campo/HUD/ações antes das explicações. Formulários, Guilda, Diário e fase aproveitam a largura e reduzem molduras. O minigame ativo reutiliza o modo imersivo existente; a preparação e orientação visual foram adaptadas. Não há outro app, iframe ou engine nova.

`ResponsivePanel` usa `<details>/<summary>` nativos: conteúdo disponível por teclado/toque no mobile e aberto no desktop, sem uma camada modal adicional. Não se exige fullscreen ou instalação para jogar. Safe areas usam `env(safe-area-inset-*)`; altura dinâmica usa `dvh` nos locais adequados. O menu e a troca de Viajante gerenciam foco, Escape e retorno; a página/nav ficam inert quando o drawer está aberto. As rotas mantêm sua semântica.

## 4–5. Arquivos e telas

Apresentação alterada:

- `apps/web/features/journey/components/shell.tsx`, `mobile-game-mode.module.css`, `responsive-panel.tsx`.
- `apps/web/features/journey/journey.module.css`.
- `apps/web/features/journey/screens/{home,equipment,arena,create,phase}.tsx`.
- `apps/web/features/journey/components/{equipment-portal,arena-stage,guild-experience,diary-experience}.module.css`.
- `apps/web/features/journey/components/guild-artwork.tsx`: fallback mobile usa a variante existente também no `src`, evitando download duplicado observado no WebKit.
- `apps/web/features/journey/components/snake-chase-game.tsx`: apenas orientação visual estática, sem lógica de input/engine alterada.
- `apps/web/features/auth/auth.module.css`: apresentação; nenhum fluxo de autenticação alterado.

QA: `responsive-panel.test.tsx`, `playwright.game-mode.config.ts`, `tests/e2e/mobile-game-mode.spec.ts`, scripts `mobile-game-mode-{bootstrap,audit,performance,review,webkit-navigation,acceptance}.mjs`. Quatro testes existentes foram adaptados: `equipment-portal.spec.ts` considera alvos realmente visíveis e intercepta também URLs do otimizador na simulação de arte ausente; `snake-playthrough.spec.ts` reconhece Android/WebKit; `diary-experience.spec.ts` aguarda aplicação assíncrona da media query; `guild-experience-v2.spec.ts` mede recursos do documento atual e captura em CSS pixels. Assertions de proporção, toque, fallback, ausência de download desktop e regras foram mantidas. Fixtures descartáveis, cenários, recompensas e regras reais foram preservados.

Documentação: este relatório, contrato TASK-0064, `CURRENT_STATE.md` e checklist mestre. Evidências exclusivamente em `build/task-0064-mobile-game-mode/`. `.gitignore` e trabalhos anteriores 0059/0063 não foram editados pela TASK-0064. O arquivo Next `next-env.d.ts` gerado pelos gates é restaurado ao conteúdo anterior ao encerrar.

Telas abrangidas: Home, Jornada/mapa, Herói, Equipamentos, Arena/lobby/batalha, Guilda, Diário, Mochila, Loja, Ato, preview, exploração, leitura, reflexão, quiz, preparação/minigame/recompensa, login/cadastro e criação de Viajante.

## 6–7. Medições, thresholds e screenshots

Baseline antes das alterações: `chromium/before` (42 observações, 2 dimensões) e `baseline-verified/before` (10 observações dos cinco casos principais, DPR 3, 2 dimensões). Ambos consultam a release publicada 90aa0fc com fixtures somente no navegador de QA; nenhum save real ou serviço alterado. As medições de combate do primeiro coletor usavam um seletor incompleto; a comparação usa `baseline-verified`.

| Em 390×844, CSS px | Antes / TASK-0063 | Depois local |
| --- | ---: | ---: |
| Main: início vertical | 188,9 | 64 |
| Largura útil do main | 93,8% | 93,8% |
| Avatar da Home | 33×49,5 | 135×202,5 |
| Área visível do Avatar da Home | 1.633,5 px² | 27.350,2 px² (16,7×) |
| CTA continuar: topo | 710 | 505,3 |
| Campo de batalha: topo | 836 | 104 |
| Campo de batalha: tamanho | 350×390 | 358×430 |
| Avatar do jogador no combate: área visível inicial | 0 px² | 37.215,5 px² |
| ATACAR: topo | 1.334 | 573,7 |
| Preparação Fuga: campo | 368,8×573,9 em y=765,1 | 370×295,4 em y=343,8 |
| Começar perseguição: topo | 1.055,6 | 495 |

As caixas acima são os canvases/imagens e não a contagem de pixels opacos da silhueta. Avatar usa proporção 2:3, `object-fit: contain` e espaço reservado; nenhum PNG esticado/editado. O Avatar de Equipamentos foi reorganizado junto aos slots, sem aumento indiscriminado de tamanho. Informações longas, leitura, diário, mochila e criação continuam podendo exigir scroll vertical intencional.

Critérios com finalidade prática:

- Conteúdo mobile usa aproximadamente 92–94% da largura nas telas de jogo (24 px de respiro total); formulários podem ter 32 px. Não exigir 100% como incentivo a encostar texto nas bordas.
- Home: Avatar com altura ≥135 px nas dimensões contratadas e CTA totalmente acima da barra nas telas portrait a partir de 568 px. Landscape distribui a área em colunas e permite scroll quando o conteúdo exige.
- Arena: campo ≥85% da largura abaixo de 768 px; em tablet/landscape com ações ao lado, mínimo 55%. Três ações inteiramente acima da barra nos viewports mobile, ≥44 px; nenhuma interseção HUD/personagem.
- Equipamentos: seis slots acessíveis; inventário/seletores dentro da largura, proporção do Avatar 2:3, comparação e cinematic preservados. Os slots compactos mantêm nome/item/raridade/stats na descrição acessível e no inventário completo.
- Corpo de leitura/formulários 16 px; descrições relevantes ao combate ≥14 px. Kickers decorativos e rótulos curtos de Foco/nível usam 12 px; não são texto longo de leitura. Desktop mantém tipografia existente, sem impor os limites mobile a todos os seus links.
- Fuga ativa: controles existentes ≥48 px, campo proporcional 12:7, DPR de backing ≤2, mapa sem HUD/d-pad por cima, saída e fullscreen opcionais. Portrait não altera aspect ratio/mecânicas para preencher espaço; landscape oferece maior mapa útil.
- CLS observado no ambiente controlado e comparação visual; não transformar medições locais em certificação de Core Web Vitals de aparelhos reais.

Galeria local: [antes/depois e screenshots por motor](../../build/task-0064-mobile-game-mode/review/index.html). Dados: [resumo consolidado](../../build/task-0064-mobile-game-mode/qa-layout-summary.json). Os JSON originais e falhas são mantidos; a consolidação usa os followups somente para os casos alterados.

Matriz contratada: 320×568, 360×800, 375×812, 390×844, 412×915, 430×932, 844×390, 915×412, 768×1024, 1440×900 e 1920×1080. Cada motor tem 21 estados/telas por dimensão (231). Screenshots de visão inicial em 320, 390, 844 e 1440 px; regressões também capturam comparação/cinematic, líderes/missões, reflexão longa, Foco cheio, adversários e Fuga ativa. CSS pixels das capturas atuais diferem do DPR de alguns baselines; comparar as medidas CSS, não o tamanho bruto do PNG.

## 8–13. Resultados por tela

**Home:** Avatar maior ao lado da identificação; objetivo, progresso do objetivo e CTA visíveis. Progresso agregado/portais continuam no painel secundário. Navegação inferior evita procurar pequenos atalhos em cards. Desktop mantém sua ordem e apresentação.

**Equipamentos:** Avatar central, Poder em linha e seis slots 3×2 no portrait. Toque abre e leva ao inventário; Enter mantém foco no slot e abre o conteúdo para navegação por teclado. Raridade, stats, link bíblico, comparison/equip/unequip/cinematic existentes mantidos; não ativar Body-Fit pendente. Em landscape, Avatar à esquerda e slots à direita.

**Arena:** campo/atores/HUD de vida e Foco antes das ações. A ajuda permanece em painel expansível, intenção/equipamentos/log/resultados continuam disponíveis. Heading repetido da batalha e descrições duplicadas dos botões usam representação acessível compacta; não há remoção de HP/Foco nem mudanças de dano/recompensas/engine. Os resumos de anúncio foram compactados visualmente, mantendo anúncio principal, medidores, feedback e log. A regressão cobre oponentes, níveis, skills, vitória/derrota/reload e áudio silencioso de produção.

**Fuga da Serpente:** preparação sem a sucessão de grandes molduras/banners, começo alcançável e orientação para girar opcionalmente. Jogo ativo já ocupava `100dvh` na TASK-0062; foi reutilizado, sem alterar engine, quatro direções, hold/slide/multitouch/cancel/fullscreen ou saída. A navegação do shell é escondida durante o modo imersivo existente. Não se declara melhora numérica fictícia na engine/magnitude do mapa ativo.

**Guilda/Diário:** menos molduras/altura decorativa; cards e páginas em uma coluna quando necessário, leitura/reflexão 16 px. Cenários de membro/líder, aprovação e recompensa única são testes locais controlados dos cenários existentes. Nenhuma aprovação real registrada. Reflexões continuam privadas e são verificadas com outro Viajante e reload.

**Login/criação:** formulário ocupa a largura disponível, inputs 16 px, criação com Avatar reservado e atributos recolhíveis. Viewport reduzida 390×440 testa scroll/foco/confirmar texto; não equivale ao teclado virtual do POCO X7 ou iOS. Não houve login real, troca de senha ou chamada a serviço remoto.

## 14. Performance, fullscreen e PWA

As capturas controladas Chromium registraram no máximo uma identidade HD por documento, com `contain`; imagens de header escondido continuam lazy e não são tratadas como recurso quebrado quando não requisitadas. Nunca carregar as 54 identidades globalmente. Os 54 originais somam 117.434.147 bytes no audit de build, não bytes transferidos em uma tela. Navegação inferior não faz prefetch automático das cinco rotas.

Observações finais CPU 4×/cache desabilitado em [performance-icons/observations.json](../../build/task-0064-mobile-game-mode/performance-icons/observations.json): Home/Equipamentos/Arena/retorno, LCP 836/412/288/224 ms; CLS 0,00083/0/0/0; heap JS aproximadamente 9,4/13,2/15,5/18,3 MB; abertura do inventário em 160 ms, incluindo automação e dois frames. São quatro visitas locais, sem limite de banda móvel ou GC forçado: não comprovam INP/LCP de campo, memória GPU/telefone, retorno do heap ao baseline ou ausência de leaks de longo prazo. WebKit sem observador CLS retorna `null`.

Equipamentos inicialmente transferia 11.958.272 bytes: os seis ícones pequenos requisitavam PNGs grandes. `lazy` e adiamento do inventário isoladamente não resolveram a transferência; suas medições históricas permanecem. As miniaturas agora usam o otimizador já existente do Next (`Image`), com dimensões reservadas, e os ícones do inventário são montados quando o painel mobile abre. Transferência final inicial: **2.698.751 bytes, redução de 77,4%**; Home 2.840.444 e Arena 2.682.593 bytes. Um único Avatar HD responde por cerca de 2,24 MB por documento sem cache nesta fixture: permanece uma limitação de rede móvel, sem alteração dos 54 originais ou de seu contrato. Não houve geração de novas artes; variantes de ícones são cache derivado do Next. Reduced motion e animações/cinematic/combate foram exercitados nas regressões.

Não existe manifest/SW novo. PWA, ícone/fluxo de instalação e estratégia de atualização/cache ficam separados: a correção não depende deles. Fullscreen existente da Fuga segue feature detection e fallback, e o teste Chromium não prova igualdade de API em iOS. Referências primárias consultadas: [critérios de instalação Chrome](https://web.dev/articles/install-criteria), [WebKit e web apps na tela inicial](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Safari 26 / WebKit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/). A viabilidade de instalação sem fluxo específico não autoriza um SW/cache novo.

## 15–19. Gates de QA

| Gate | Resultado e evidência |
| --- | --- |
| Unitários afetados | 67 casos distintos PASS em 13 arquivos; followups de shell/painel, Guilda e Equipamentos após alterações correspondentes |
| E2E novo modo | 9 PASS em desktop, Android Chrome e WebKit; followup após CSS/seletor |
| E2E consolidado | 63 casos distintos PASS / 1 SKIP intencional (playthrough exige mobile); sem falhas finais. JSONs e followups por cenário em `qa-acceptance.json` |
| Matriz visual | 231 observações por motor, 11 dimensões; 462 sem overflow, erros de página ou sobreposição HUD/atores. Followups somente dos casos alterados; CLS Chromium matriz 0 / WebKit indisponível |
| Lint | PASS, zero avisos; `lint-final.log` |
| Typecheck | PASS: todos os workspaces e raiz, incluindo Next typegen |
| Build de produção | PASS, 20 páginas estáticas geradas, 209 arquivos públicos / 726 artefatos inspecionados / 8 SHA preservados / 54 HD PASS; `build-final.log` |
| Isolamento HTTP | PASS, `production-http.json`: 21 respostas 404 (oito URLs restritas + oito fontes + cinco DEV/galerias/Body-Fit) e quatro páginas 200, produção local |
| Segurança/preservação | PASS, `preservation-final.json`: baseline SHA de 2.017 arquivos, sem mudança inesperada ou exclusão; apenas alterações autorizadas e movimentação do próprio contrato. HEAD preservado; sem operações remotas |
| Galeria | PASS: 243 referências a arquivos locais existentes; não distribuída em public |

Ambiente: Node 24.20.0, Next 16.3.5, Playwright 1.63, Chromium 153 e WebKit distribuído pelo Playwright para Windows. O projeto Android usa preset Pixel 7; coletor usa UA sintética mencionando POCO, sem alegar que OS/navegador do usuário foram confirmados. Browser contexts são descartáveis, dados sintéticos e tráfego externo bloqueado. Servidor Next de produção apenas loopback 3165. Build usa public config fictícia de QA e diretório isolado `.next/task-0062-mobile` já contratado; **não usar este artefato como prebuilt de publicação**.

Histórico de reworks preservado: `initial-e2e` 1/2, `rework-e2e` 6/3, `layout-followup` e `layout-diagnostic` falharam por ações abaixo da barra em 320×568; `layout-followup-2` corrigiu a prioridade/duplicação do heading. Coletor inicial aguardava imagem lazy escondida; espera limitada às imagens visíveis corrigiu o travamento. CSS de thumbnail sobrepunha a dimensão pretendida da Home e foi corrigido com seletor de escopo. Primeiro coletor WebKit revelou overflow de exploração (margens antigas de desktop) e min-content nativo do select; corrigidos na apresentação. As seis falhas iniciais de Equipamentos apontavam proporção da caixa por borda inferior e summary desktop não visível, corrigidas sem relaxar a proporção 2:3 nem os 44 px dos alvos expostos. Script de performance inicial falhou por seletor textual de slot incorreto; corrigido para o identificador existente. Lint intermediário apontou referência em cleanup e imports/variáveis não utilizados; corrigidos. JSON/traces/screenshots antigos não foram substituídos para ocultar FAIL.

O primeiro WebKit registrou erros `_rsc` durante hard navigations. O diagnóstico separado de cinco toques SPA, hard navigations e resize não registrou pageerrors; encontrou cancelamento de requisição durante navegação. Isso indica interferência do ciclo de vida do coletor, sem provar a causa individual de cada erro histórico. A matriz final usa página nova por observação, mantém contexto/fixture e registra todos os erros da página corrente: 231 estados, zero erros. Os resultados antigos continuam disponíveis. O init script de autenticação local foi movido para o contexto para essas páginas descartáveis.

Outros reworks: esperar a media query do Diário; corrigir download desktop duplicado real na Guilda; timeout ao capturar página gigante em DPR 3 corrigido por screenshot em CSS pixels; playthrough Android falhou sob QA concorrente e passou isoladamente, sem mudança de engine/timing. A primeira preservação detectou LF/CRLF de `next-env.d.ts`; restauração byte a byte ao baseline corrigiu. A introdução de `Image` duplicou atributos JSX e falhou no build/lint; atributos duplicados removidos, gates repetidos PASS. Dois fallbacks de arte falharam porque interceptavam só URLs originais: interceptação adicional `/_next/image` manteve o cenário e ambos passaram. Erros de invocação do coletor (modo/porta) foram corrigidos antes de gerar a recaptura final; não foram tratados como resultados de layout.

## 20–21. Desktop e acessibilidade

Desktop 1440×900 e 1920×1080 preserva shell lateral, estrutura, superfícies, fontes, imagens e funcionalidades. Painéis novos abertos e `display: contents`; ordem da Home restaurada via CSS. Matriz e screenshots comparativos não afirmam identidade pixel a pixel de todos os estados. As regressões verificam função, layout, comparação/cinematic, missões/líder, reflexão privada, combate e minigame.

Toque nativo emulado na navegação; links com rótulo e `aria-current`; alvos principais ≥44 px, controles Fuga ≥48; focus-visible; detalhes nativos; Escape/retorno de foco; foco da troca de Viajante confinado no diálogo; menu com background inert. Reduced motion, fallback de imagem, nomes longos e keyboard presentes nos testes. Sem auditoria com leitor de tela físico/assistivo, contraste instrumental de todos os assets ou teclado nativo do celular: não declarar certificação WCAG.

## 22. Pendências e validação física POCO X7

O usuário informou **POCO X7**. Sistema, versão de navegador, escala de texto/display e barras do aparelho não foram confirmados. Nenhum teste físico foi executado pelo agente. A publicação atual continua TASK-0063; não usar esse site como prova de TASK-0064.

Roteiro para a versão 0064 depois de disponibilização autorizada separadamente:

1. Registrar navegador/versão, sistema, escala de texto/display e URL/hash; testar em portrait com barras do navegador expandidas e retraídas, sem zoom manual.
2. Home: Avatar claramente visível, objetivo/CTA destacados, cinco destinos sem sobreposição; perfil/mais/menu/voltar funcionando.
3. Equipamentos: seis slots, inventário e filtros completos; comparação/equipamento/cinematic e retorno; nenhum overlay pendente.
4. Arena: HP/Foco/nome/intenção legíveis, campo e três ações; abrir ajuda/especiais, verificar foco cheio e vitória/derrota sem elemento encoberto.
5. Fuga: iniciar sem fullscreen, portrait/landscape, segurar/deslizar, dois dedos, cancel ao sair da aba, tela cheia opcional, saída; HUD/d-pad/mapa visíveis com barras/notch.
6. Login/criação/devocional: teclado real, mensagens, rolar até confirmação; testar troca de Viajante/privacidade e navegação voltar. Guilda membro/líder somente com conta de teste autorizada.
7. Registrar capturas e resultado humano. Publicação exige pedido próprio; nenhum deploy foi feito por esta tarefa.

Supabase/auth/saves/engines/IDs/economia/progressão/originais/licenças/Body-Fit/catálogos/isolamento de áudio não mudaram. Pendências anteriores continuam: 8 FIT_PASS, 1 NEEDS_REWORK, 7 NEEDS_NEW_ART, 7 revisões humanas, 1 READY apenas staging, 0 V2 runtime. Catálogo real: comum 2, incomum 1, raro 3, épico 0, extraordinário 0; Calças somente proposta. Nenhum desses gates foi fechado por alteração de layout.

## 23–24. Checklist e estado final

Checklist mestre e memória atualizados; contrato único movido para `tasks/completed/TASK-0064-mobile-game-mode-v1.md`, **STATUS DONE com aceite exclusivamente local**. Fases 1–13 executadas no escopo aplicável; validação física preparada, sem resultado inventado. Relatórios JSON, traces e falhas históricas preservados. Servidor temporário de QA encerrado ao terminar.

Git permanece `main`, HEAD `90aa0fc821b2856f03f114698e5e9e8b8b040a3d`, index vazio; alterações anteriores e novas continuam locais. Comparação com referência `origin/main` já disponível: 0/0; não houve fetch novo ou comprovação de sincronização remota fresca nesta TASK. Nenhum commit/push/deploy. O site publicado continua TASK-0063.

Próxima ação: revisar a galeria e, mediante autorização específica de disponibilização/publicação, testar esta versão no POCO X7, identificando navegador/sistema. Não iniciar mecânicas, assets ou PWA automaticamente. Teste físico, teclado real, safe areas reais, autenticação online e condições de rede móvel permanecem limitações explícitas deste aceite local.
