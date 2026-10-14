# TASK-0062 — Mobile Experience & Responsive Layout Fix V1

Projeto: `D:/Projetos IA/rpgjovemcristao`. Data: 2026-10-09.
Status: DONE no escopo de layout local, com gates automatizados concluídos. Validação em aparelho físico continua pendente.
Autor assume Frontend, QA e Security; revisão local, sem independência.

## Causa raiz

A configuração Next.js já exportava `device-width`, `initial-scale=1` e `viewport-fit=cover`. Não havia zoom global, redução global por `transform: scale` nem um telefone simulado dentro do aparelho. As escalas do mapa/câmera/animações pertencem às apresentações existentes e foram preservadas.

A apresentação pequena vinha da combinação de fontes explícitas de 9–13px, metadados e links ainda menores, cards em duas colunas no telefone e sucessivas media queries que restabeleciam fontes pequenas. Exemplos: `.actText small`/`.gardenWorldPoint small` 9px; `.ringSlot small` 9,12px; `.statStrip small` 9,28px; `.combatPower details` 9,6px; descrições dos portais 12,8px. A viewport correta não tornava esses textos legíveis.

O login tinha padding externo de32px e interno mínimo de24px. Diário/Herói somavam camadas de padding. Em landscape844/915px o layout mantinha a sidebar174px, comprimindo o conteúdo. A criação reservava190px para um canvas HD de255px; havia sobreposição do nome. No desktop, a reserva245px também era5px menor que o avatar.

Antes das correções, a matriz já não apresentava overflow horizontal. Esse resultado sozinho não garantia legibilidade ou boa experiência mobile.

## Correções e telas

- Login/cadastro: margens12px com safe areas, painel20px internos, campos/botões16px para reduzir risco de zoom de foco no iOS.
- Criação/seleção: controles e metadados maiores; avatar170×255 em área reservada280px na criação mobile, sem tocar nos PNGs; reserva255px no desktop; seleção com espaçamento menor e canvas proporcional.
- Home/Jornada: portais em uma coluna até480px, textos de corpo16px, metadados14px e maior aproveitamento da largura.
- Mapa/exploração: legendas, descrições e rótulos maiores; preservados coordenadas, câmera, eventos, regras e controles.
- Herói/equipamentos: slots e informações legíveis, links com alvos de44px, tabela com quebra de texto, avatar proporcional e retrato maior no lobby mobile da Arena.
- Arena/Guilda/Diário: texto secundário14px, painéis menos estreitos; Guilda com métricas em duas colunas no telefone; detalhes do poder deixam de flutuar sobre outros elementos no mobile.
- Leitura/devocional/quiz/Fuga: links/controles e instruções ampliados; minigame continua com seu viewport imersivo e DPR limitado existentes.
- Menu: drawer até800px e também até1024px quando `pointer: coarse`, atendendo landscape de celular sem mudar a sidebar em desktop com mouse.
- Safe areas no cabeçalho, conteúdo, footer e drawer; modal de troca com altura limitada e scroll em telas baixas.
- Carregamento inicial: contêiner principal contém as margens do aviso de preparação; reserva da sidebar/menu/cabeçalho e footer fora do primeiro viewport durante hidratação, sem modificar o estado já carregado ou os dados.

## Arquivos alterados

| Arquivo relativo à raiz | Finalidade |
| --- | --- |
| `apps/web/features/auth/auth.module.css` | Formulário mobile/safe areas |
| `apps/web/features/journey/journey.module.css` | Layout e tipografia nas telas existentes |
| `apps/web/features/journey/components/equipment-portal.module.css` | Portal/tabela/slots |
| `apps/web/features/journey/components/diary-experience.module.css` | Diário e espaços internos |
| `apps/web/features/journey/components/guild-experience.module.css` | Métricas/legibilidade |
| `apps/web/next.config.ts` | Cache `.next/task-0062-mobile` somente com `RPG_MOBILE_E2E=1` |
| `playwright.mobile.config.ts` | E2E contra servidor loopback3162 separado |
| `tests/e2e/mobile-experience.spec.ts` | Sobreposição, toque, teclado, modais, seleção, HD/CLS |
| `scripts/mobile-experience-audit.mjs` | Matriz/capturas/medições com fixtures descartáveis |
| `scripts/mobile-experience-review.mjs` | Validação das métricas e galeria antes/depois |
| `scripts/mobile-experience-preservation.mjs` | Prova SHA de arquivos existentes e HEAD |
| `.gitignore` | Somente evidências0062 permitidas; caches/traces/perfis continuam ignorados |
| `.agent/memory/CURRENT_STATE.md`, contrato0062 e este relatório | Continuidade/aceite |

O `next-env.d.ts` gerado pelo Next foi restaurado ao SHA físico anterior à tarefa; não integra a alteração final. Trabalho local anterior da0059 preservado, incluindo sua galeria/checklist e encerramento offline.

## Antes/depois e screenshots

Abrir a [galeria local](../../build/task-0062-mobile-experience/review/index.html). Contém20 telas/estados, imagens antes/depois em390×844 e links correspondentes de1440×900: login, signup, create, home, journey, hero, equipment, arena, guild, diary, backpack, shop, act, preview, explore, reading, reflection, quiz, snake e reward.

Arquivos físicos: `build/task-0062-mobile-experience/before/` e `after/`. As capturas anteriores usam dev; o indicador “N” pertence às ferramentas Next. As posteriores usam o build local de produção. Esses ambientes diferem em tooling/áudio de protótipo; não comparar seus tempos como benchmark antes/depois.

Medições: `before/metrics.json`, `after/metrics.json` e `comparison.json`. Contagens somam ocorrências em20 telas/estados por resolução, não usuários nem itens únicos. As verificações de texto cobrem `p/label/dt/small/button/a/summary` visíveis no main, não todo texto possível de animação ou marca.

Viewports:360×800,375×812,390×844,412×915,430×932,844×390,915×412,768×1024,1440×900,1920×1080. Matriz200 casos antes e200 depois; seleção/modais/jogo ativo são verificados adicionalmente nos E2E.

Resultado:0 overflow em200 casos,0 erros de página, no máximo1identidade HD por navegação. Nas larguras360–1024px, ocorrências de texto abaixo de14px passam para0 e alvos abaixo de44px passam para0 no conjunto medido. Em390px:178→0 ocorrências pequenas;23→0 alvos pequenos. Em1440/1920px, largura principal e tipografia medidas preservadas; única correção intencional da criação desktop foi reservar os255px já ocupados pelo avatar. Este diagnóstico de fontes não inclui todos os spans, marca ou animações; o HUD de exploração também foi revisado visualmente e ampliado.

Há80 capturas comparativas e2 adicionais após a correção: [seleção](../../build/task-0062-mobile-experience/after/traveler-selection-390x844.png) e [modal](../../build/task-0062-mobile-experience/after/traveler-modal-390x844.png). Screenshots de combate/Fuga ativa e traces de falhas ficam nos diretórios locais de E2E, ignorados pelo Git.

## QA

- Unit:8 arquivos/41 testes PASS — auth UI, criação, home, shell, avatar runtime, equipamentos, Diário e Guilda.
- `npm.cmd run lint`: PASS.
- `RPG_MOBILE_E2E=1 npm.cmd run typecheck`: PASS; também `tsc` depois da restauração do arquivo gerado.
- `RPG_MOBILE_E2E=1 npm.cmd run build`: PASS;20 páginas estáticas; auditoria HD54 identidades e hashes PASS.
- E2E:72 casos distintos aceitos entre as rodadas,10 skips previstos pelos testes existentes porque o projeto desktop cobre a matriz completa. A primeira rodada de82 teve71 PASS/1FAIL/10SKIP (locator do novo teste); as correções foram reexecutadas seletivamente. Último gate:2/2 PASS nos perfis desktop/mobile. Não se trata de uma única execução de82 casos sem falhas. Histórico, motivos, resultados e métricas finais em `build/task-0062-mobile-experience/qa-summary.json`;0 falhas sem tratamento no conjunto final. Inclui equipamentos/fallback, combate/recompensas, Diário privado/reflexão longa, Guilda, baús/Fuga ativa; novo teste cobre seleção/toque/teclado/modal/reduced motion/CPU4×.
- Security: inspeção pelo próprio autor. Sem novas dependências, serviços externos, secrets, alterações de auth, banco ou fronteiras de autorização. Servidor com variáveis públicas de Supabase vazias; nenhum valor privado lido/exibido. Novo harness bloqueia requisições externas e usa contexto descartável.

## Falhas encontradas e tratamento

1. Reserva insuficiente do avatar: corrigida no mobile e desktop; teste compara limites reais do canvas e nome.
2. Primeiro harness aguardava h1 visível na exploração, que o oculta intencionalmente: corrigido para esperar elemento anexado; nenhum comportamento do jogo alterado.
3. Locator do novo E2E encontrava dois links Diário: nome exato corrigido no teste.
4. Typecheck do novo teste não admitia spread de `HTMLCollection`: corrigido para `Array.from`.
5. Teste antigo de silêncio da Arena falhou no dev porque áudio de protótipo é habilitado exclusivamente nesse ambiente. Reexecutado no build de produção e PASS; nenhum arquivo de áudio/runtime ou aprovação alterado. Tentativa exploratória interrompida para passar ao ambiente final adequado, sem mascarar sua falha.
6. Novo teste usava o título de um portal, em vez do h1 do Diário: locator corrigido para “Diário do Viajante”.
7. Comparador encontrou nota Body-Fit de12px alterada para13,6px no desktop: corrigida a especificidade; aumento14px ficou restrito ao mobile. Comparador posterior PASS.
8. CPU4× no perfil desktop redimensionado para390px expôs CLS0,8815 na hidratação. Rodadas intermediárias ainda falharam (~0,108–0,121); reserva de espaço e contenção de margens foram refinadas com os nós/retângulos reportados por `PerformanceObserver`, sem relaxar o limite0,1 do teste. O link “Voltar” temporário, removido pelo shell pronto, também deslocava o main67px; ele deixa de aparecer durante o estado de preparação (continua disponível nos estados apropriados).
9. Uma rodada registrou timeout90s em equipamento com duração anormal reportada de2,8h. Causa do ambiente não confirmada; reexecução isolada passou em ambos os perfis. Falha permanece no histórico do QA.

## Performance e limites

Medição final no Herói com CPU4×: CLS0 no perfil mobile em390/1440px;0,04317 no perfil desktop em390px e0,05075 em1440px, abaixo do limite0,1 sem relaxar o teste.1identidade HD solicitada/2instâncias DOM (thumbnail+Herói), recurso codificado2.238.839bytes, ambos carregados com `object-fit: contain`. Canvas reserva razão2:3; nenhum PNG alterado. O pack original tem117.434.147bytes, mas não é carregado inteiro. CPU4× é emulação e o agregado de shifts deste carregamento não é uma medição CrUX: recursos em loopback/cache e amostra curta não representam rede celular, estabilidade de sessão inteira ou hardware real. Derivados comprimidos de HD exigiriam planejamento próprio, não foram criados nesta tarefa.

Safe areas usam variáveis CSS existentes do navegador; geometria com notch físico, Safari/iOS, Android real, GPU/termal/memória de aparelho, leitor de tela e auditoria WCAG completa não foram testados. Reduced motion e teclado são verificados no navegador. Sem declarar teste físico realizado. Cadastro/login são auditados visualmente sem criar conta nem autenticar no Supabase; gameplay usa fixture isolada, nunca saves reais.

## Preservação, Git e próximos passos

Baseline física: `build/task-0062-mobile-experience/preservation-before.json`,1903 arquivos existentes. `preservation-final.json`:1894 arquivos protegidos idênticos porSHA256, incluindo217assets e133arquivos/artefatos0059; nove caminhos com alterações autorizadas. Body-Fit, gates humanos, economia, IDs, progressão, saves reais, regras da Guilda, engine Arena e assets originais preservados. Sete revisões humanas continuam pendentes;1READY somente staging e0V2ativos.

Branch `main`; HEAD `204ba56fc8b0ded2a4d99310818094210ddbbea2`; comparação com referência local `origin/main`:0/0. `git ls-remote origin refs/heads/main` confirmou o mesmo commit remoto durante a entrega. Sem commit, push, deploy, migração ou Git destrutivo. Working tree contém trabalho0059 anterior e alterações0062 locais. Servidores desta tarefa encerrados; o servidor dev preexistente não foi manipulado.

Próximo passo após aceite automatizado: revisar a galeria e validar em celular físico, especialmente notch, teclado virtual, portrait/landscape e Fuga. Gates Body-Fit continuam independentes; nenhum READY/runtime promovido.
