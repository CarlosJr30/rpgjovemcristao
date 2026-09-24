# TASK-0008 → Jornada visual local

ID: TASK-0008
TITLE: Onboarding do Viajante e mapa navegável
OBJECTIVE: Experiência local funcional Home → criação → introdução → mapa → Ato I → apresentação da fase 1.1.
PRIORITY: P1 High
STATUS: DONE
SCOPE: apps/web, UI compartilhada quando útil, testes, documentação técnica única do protótipo, projeto/roadmap e memória.
OUT_OF_SCOPE: Banco/schema, autenticação, conta real, igreja/líder, APIs externas, narrativa de Gênesis, Quiz, combate, minigame, recompensas, multiplayer e outra TASK.
DEPENDENCIES: TASK-0005, TASK-0006 e TASK-0007 concluídas.
ASSIGNED_AGENT: ORCHESTRATOR assume FRONTEND, GAME DESIGN, ARCHITECT, SECURITY e QA; UX/UI pelo orquestrador. Revisões pelo mesmo executor, sem independência.
REQUIRED_CONTEXT: Governança, fontes oficiais TASK-0006/0007, stack/bootstrap, código/testes existentes e guias locais da versão Next instalada.
SECURITY_CONSIDERATIONS: Storage não confiável, nomes renderizados como texto, dados mínimos sem credenciais, sem rede externa. LocalStorage é exceção temporária explícita autorizada pelo usuário, não autoridade para futura economia real.

## Autorização e ownership

Pedido atual substitui a recomendação documental de TASK-0008. Autoriza implementação local e testes/servidor; preserva stack. Orquestrador autoriza Frontend a implementar domínio puro mínimo, estado e adapter local separados em apps/web/features/journey, sem alterar banco ou engine de combate. Não criar novas dependências. Perfis aplicados localmente, sem subagentes.

## ACCEPTANCE_CRITERIA

1. Home e CTA encaminham segundo existência de Viajante.
2. Criação válida com nome, nível 1, sem classes, atributos comuns e aparência independente.
3. Persistência via adapter, validação de leitura e recuperação segura de corrupção/indisponibilidade.
4. Introdução e mapa com oito atos, somente Ato I disponível; fase 1.1 e apresentação acessíveis.
5. Começar fase abre placeholder, sem conteúdo bíblico ou sistemas adicionais.
6. Desktop/mobile, teclado, foco, labels, estados de bloqueio textuais e reduced-motion.
7. Testes cobrem os 13 comportamentos do pedido; format/lint/typecheck/test/build/E2E aprovados, servidor e fluxo visual verificados sem erros relevantes.
8. Sem secrets/dependências/infraestrutura; arquitetura modular, reset e limites documentados; memória atualizada e uma recomendação não executada.

## TEST_PLAN

Vitest para criação/validação/cosméticos e adapter, preservando testes válidos. Playwright desktop/mobile para navegação, recarga, rotas diretas, estados inválidos e bloqueios. Inspeção visual local, console e terminal. Checks npm exigidos. Hashes de dependências/schema para confirmar limites.

## DEFINITION_OF_DONE

Aceite 1–22 do pedido mapeado nas evidências finais; todos os checks aplicáveis PASS, revisões proporcionais registradas, documentação/memória atualizadas, contrato movido para completed. Falhas exigem REWORK. Não executar próxima tarefa.

## Implementação entregue

Rotas, módulos, modelo local, reset e limites têm fonte única em [LOCAL-JOURNEY](../../docs/architecture/LOCAL-JOURNEY.md). UI original de aventura com SVG/CSS local, avatar pixelado em 27 combinações, mapa espacial e caminho vertical mobile, lista alternativa e HUD. Um personagem por origem/navegador, sem conta. Nível 1, XP/moedas 0 e quatro atributos de protótipo iguais a 1, sem balanceamento definitivo. Fase termina em placeholder; nenhum conteúdo de Gênesis foi implementado.

## REWORK e ambiente

Fluxo: BACKLOG → ACTIVE → VALIDATING → REWORK → ACTIVE → VALIDATING → DONE após os checks abaixo.

- Título quebrado em linhas era exposto sem espaço no nome acessível; corrigido o nome acessível, preservando teste semântico.
- E2E inicialmente confundia alertas da aplicação com o anunciador de rotas Next; escopo do locator corrigido para main, sem desabilitar anúncios.
- Console detectou favicon.ico 404; ícone SVG local via convenção Next eliminou o erro. Revisão visual corrigiu link de salto fora de foco e rótulo decorativo sobreposto no mapa.
- Axe encontrou contraste insuficiente no painel de personagem, numerais bloqueados e texto do placeholder; cores ajustadas e todas as sete telas revalidadas sem violações A/AA detectadas.
- Vitest/build inicialmente bloqueados por spawn EPERM; executados com escalonamento autorizado pelo ambiente, sem alterar scripts/dependências ou desabilitar verificações.
- Porta 3000 já tinha Next dev do próprio workspace. Não encerrado. E2E passou a usar produção na porta 3108; tentativa de segundo dev em 3109 encerrou por lock e não deixou processo extra. Inspeção do fluxo usou o dev existente em 3000.
- Execução final com oito workers sofreu ERR_NO_BUFFER_SPACE no carregamento de recurso de um browser (trace), mantendo botão sem hidratação. Configurado limite de dois workers; suíte completa passou, sem retries locais ou relaxamento de asserts.
- Browser integrado não inicializou por erro de metadados do sandbox em duas chamadas. Fallback para Playwright/Edge instalado; inspeção visual pelo autor a partir das capturas. Não alegar interação no Browser integrado.

## Validação executada — 2026-09-17

| Check | Resultado e evidência |
| --- | --- |
| FORMAT | PASS: npm run format e npm run format:check |
| LINT | PASS: npm run lint, zero warnings |
| TYPECHECK | PASS: npm run typecheck em web/database/engine/shared/ui e configuração raiz |
| UNIT / COMPONENT / ADAPTER | PASS: npm test, 37 testes em 5 arquivos; preservados testes da engine/database e atualizado teste antigo de CTA desabilitado |
| BUILD | PASS: npm run build; sete rotas de experiência, ícone e not-found pré-renderizados |
| E2E / INTEGRAÇÃO LOCAL | PASS: npm run test:e2e, 8/8 em dois workers, desktop e mobile; navegação, recarga, validação, corrupção, falha de gravação, guarda, bloqueios e 360 px/reduced-motion |
| SERVIDOR / VISUAL | PASS: E2E inicia e encerra servidor de produção local; inspeção adicional no dev 3000 com contexto de browser isolado percorreu até preview. Capturas desktop 1280/1440 e mobile 390, teste adicional 360 px sem overflow |
| CONSOLE / TERMINAL | PASS final: zero pageerrors/console errors no fluxo E2E e inspeção adicional. Últimas entradas de dev mostram compilações normais; erros transitórios enquanto arquivos eram criados ficaram resolvidos. Aviso NO_COLOR/FORCE_COLOR dos testes é apenas de formatação |
| ACESSIBILIDADE BÁSICA | PASS: labels/radio groups/teclado/foco/salto e alternativa em lista; seleção por setas/tab confirmada (longo/ocre/escuro) e submit por Enter. Axe-core já instalado, injetado só na inspeção local, retornou [] para sete telas nas regras WCAG2 A/AA. Sem certificação abrangente ou teste com leitor de tela real |
| SECURITY REVIEW / NO SECRETS | PASS no escopo local, parecer abaixo |
| DOCUMENTATION UPDATED | PASS: guia único, README, roadmap, decisões/changelog/estado e contrato |
| NO KNOWN CRITICAL REGRESSIONS | PASS nos checks executados; riscos históricos de dependências permanecem documentados, não reavaliados por auditoria de rede |

### Cobertura dos 13 comportamentos de teste solicitados

Criação e trim; nomes inválidos; atributos comuns; 27 combinações cosméticas sem alteração mecânica; salvar/recuperar/reset; storage inválido/indisponível; Home → Create; Create → Intro; Intro → Journey; Ato I disponível; sete atos bloqueados; fase 1.1 disponível; apresentação e placeholder. Todos cobertos por journey.test.tsx, page.test.tsx e tests/e2e/home.spec.ts.

### Matriz dos 22 critérios do pedido

| Critérios | Evidência | Resultado |
| --- | --- | --- |
| 1–2 Home e CTA | Teste de componente e E2E com/sem Viajante | PASS |
| 3 criação | Domínio, form, E2E e passagem adicional no dev | PASS |
| 4 sem classes | Modelo/catálogo sem classe; criação contém somente nome e três grupos cosméticos | PASS |
| 5–7 atributos iguais e personalização independente | Teste das 27 combinações, captura do avatar e opções | PASS |
| 8 persistência | Adapter, E2E após reload, retorno Home/guarda de criação existente | PASS |
| 9 introdução | E2E e gravação de introCompleted sem recompensa | PASS |
| 10–12 mapa/oito atos/somente Ato I | Oito listitems, sete bloqueios textuais e um link no mapa; nenhum link de ato futuro | PASS |
| 13–14 fase e apresentação | Navegação via ato e CTA até placeholder | PASS |
| 15 responsividade | Capturas desktop/mobile; 360 px com nome máximo sem overflow | PASS |
| 16 acessibilidade | Semântica, teclado/foco, reduced-motion e axe descritos acima | PASS |
| 17 testes | 37 unit/component/adapter e 8 E2E aprovados | PASS |
| 18 lint | Saída final zero erros/warnings | PASS |
| 19 typecheck | Todos os workspaces aprovados | PASS |
| 20 build | Compilação e pré-renderização aprovadas | PASS |
| 21 nenhum secret | Revisão de código e busca por APIs inseguras; nenhum .env/credencial novo | PASS |
| 22 documentação/memória | Guia, README, roadmap, três memórias e este contrato | PASS |

## Revisões por perfil

Todos os pareceres são do mesmo executor/orquestrador; **não independentes**.

- ORCHESTRATOR: escopo explícito substitui recomendação anterior, IDs preservados, não iniciou tarefa posterior; aceite mapeado acima.
- FRONTEND: páginas finas e telas/componentes separados; client storage somente após assinatura, snapshot SSR estável, erros de armazenamento exibidos; desktop/mobile e estados vazios revisados.
- UX/UI: paisagem e caminho como foco, HUD discreto; avatar original, retorno consistente, controles nativos e nenhum CTA que promete gameplay não implementado. Capturas inspecionadas pelo autor.
- GAME DESIGN: nome Viajante provisório, nível 1 e base comum; cosméticos sem bônus; sem ganho de XP/moedas ou desbloqueio falso; Sabedoria mecânica. Valores 1 isolados como protótipo. Oito atos oficiais e Gênesis 2–3 preservados.
- ARCHITECT: domínio puro, dados de campanha, estado, adapter e composição separados no módulo; shared/ui reutilizados; sem novo framework ou serviço. Storage local não pode migrar como autoridade de servidor. Modelo mínimo não antecipa tabelas ou engine de quiz.
- SECURITY: validação estrita do envelope e allowlists, limite de tamanho, parse seguro, texto escapado React, UUID local, sem dados sensíveis/rede; chamadas localStorage apenas no adapter. Corrupção não é apagada silenciosamente e falha de save não avança. Reset exige excluir só a chave documentada. Sem auth real, antifraude ou integridade transacional reivindicados. Nenhum achado alto/crítico no escopo; riscos anteriores de bootstrap mantidos.
- QA: testes proporcionais, casos negativos e revisão visual; nenhuma falha de aceite aberta. Falhas reais e de ambiente acima foram tratadas sem mascaramento.
- BIBLICAL CONTENT (verificação de limites já lidos): arte é FICTIONAL decorativa e frases são onboarding, não texto bíblico; referência fornecida pelo produto, sem roteiro/citação nova. Não aprova conteúdo futuro nem resolve tradução/licença.

## Integridade e evidências visuais

SHA-256 preservados antes/depois:

- package-lock.json: `958D4406A36AF8125CC7BCF59685D41A5E579706619BB7219E099A07BEAA7CDF`.
- package.json: `6990573F688B1DF1554381978E044FA05B9E6CED1BAB76570D2FA3CC70EA9AAE`.
- packages/database/src/schema.ts: `225E478274B7D117930AD67955A316B9F24E661EAAF8931D4362A5F2EA468A46`.

Busca de localStorage no código: somente adapter; sem eval/dangerouslySetInnerHTML, scripts externos, credenciais ou mudança de banco. Git estava untracked, portanto não usar diff como evidência exclusiva.

Capturas finais em `test-results/home-fluxo-completo-teclado-persistência-e-mapa-acessível-desktop/` e pasta equivalente `-mobile/`: 01-home.png, 02-create.png, 03-intro.png, 04-map.png e 05-phase.png. Artefatos descartáveis dos testes, regenerados por E2E. Inspeção adicional assistida por Playwright no dev confirmou setas/tab/Enter e console vazio; não foi teste com participante humano nem revisão independente.

## Próxima recomendação única

**TASK-0009 — especificar documentalmente a fase 1.1 O Jardim e a Escolha**, com enquadramento editorial, objetivos, exploração, reflexão, Quiz, grande desafio, recompensas e aceite. Não contratada nem iniciada; nenhuma implementação adicional nesta entrega.
