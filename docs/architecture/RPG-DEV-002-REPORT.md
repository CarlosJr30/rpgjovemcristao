# RPG-DEV-002 — Estabilização e homologação de gameplay

Data: 24/10/2026. **Estado geral: BLOCKED.** Continuação exclusiva da [PR #11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), branch `codex/rpg-dev-001`. Nenhum merge, provisionamento, migration ou publicação produtiva.

## Estado confirmado e escopo preservado

**DONE:** candidato inicial `2d0132e5fd57f65a670dd551d2e811ccbc79911f`, relatório anterior em `5bcd8cd3bb602fd11fcffddb4c495a3d00fcd767`. CI anterior aprovado, conforme RPG-DEV-001. Root/worktrees antigos, dados e assets preservados. As correções anteriores de sincronização/equipamento continuam intactas.

**DONE:** produção no SHA `808433a780e96a048c4a3f2d7e419351ab85e5a3`, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, target production/READY, alias oficial [Guilda/EBD](https://rpgjovemcristao-web-inky.vercel.app). Conferência remota nesta tarefa: raiz/Auth/Guilda/EBD HTTP 200; Arena/Torre/equipamentos HTTP 403. Isso é conferência HTTP, não repetição dos 89 testes autenticados do lançamento.

PROD `wspafhlbtlpabypzymjo`; TEST compartilhado Guilda/EBD `wkdvdzfkbwvhyjmamrsg`. Nenhuma alteração de URLs Auth, redirects, limites de e-mail, senhas, quotas, RLS, papéis ou flags. Oito datasets por ambiente comparados por quantidade e hash com o encerramento de RPG-DEV-001: **todos iguais em TEST e PROD**. Sessões normais de Auth não estão incluídas nessa afirmação de imutabilidade dos dados de jogo.

## WebKit: reprodução e limites da investigação

**BLOCKED: causa definitiva e correção da aplicação não comprovadas.** Na Preview protegida do mesmo runtime, comparei navegação por links com navegação completa `goto`, mantendo conta TEST autorizada, viewport WebKit 390×844, login, avatar, Guilda, EBD, reload, logout e negação após logout. Aguardei a navegação efetiva e os conteúdos autenticados, sem desativar prefetch ou ignorar erros de página.

| Matriz com evidência preservada | Resultado |
| --- | --- |
| Transporte `route.continue`, links da aplicação, cinco repetições | DONE: 5/5 sem erros, 35 verificações funcionais |
| Mesma navegação, execução adicional do script versionado | DONE: 1/1 sem erros, sete verificações |
| `route.continue`, navegação completa, três repetições | BLOCKED: 2/3 sem erros; uma execução com erro RSC/CORS |
| Transporte alternativo `route.fetch`/`fulfill`, navegação completa, cinco repetições | BLOCKED: 2/5 sem erros; três execuções com quatro erros de página no total |

Todos os passos funcionais terminaram nas execuções completas, inclusive naquelas reprovadas pelo erro de página. As respostas RSC concluídas observadas foram HTTP 200, `text/x-component`, sem redirect SSO, erro Vercel ou rejeição HTTP de CORS/Auth. Há requisições canceladas (`Load request cancelled`) durante navegação completa. Inventário de cookies vazio nesses contextos; a sessão Supabase é persistida pelo cliente no armazenamento local. Não registrar valores de cookies/tokens.

Essas observações **não provam** que a falha seja exclusivamente da automação, do prefetch ou da proteção Vercel. O experimento de transporte não resolveu a intermitência e não é uma correção pronta para release. Não modificar CORS, cookies, proteção ou prefetch por hipótese. Safari em dispositivo físico não estava disponível e não foi aprovado.

**DONE na instrumentação:** script versionado `tests/hosted/protected-preview-probe.mjs`, com origem TEST-backed explicitamente delimitada, credenciais somente por stdin, token de desenvolvimento somente em memória, saídas minimizadas e exit 1 se algum caso reprovar. Helper experimental limita token à origem exata e não segue redirects no fetch nem reescreve headers CORS. Sete testes validam isolamento do token, rejeição de alvos e preservação da resposta. O helper permanece classificado como diagnóstico, não solução.

## Ambiente de gameplay hospedado

**DONE na preparação; BLOCKED no provisionamento e na validação remota.** [Plano e cotação](RPG-DEV-002-HOSTED-PLAN.md) preparados. A tentativa inicial de branch foi recusada pelo provedor antes da criação, exigindo confirmação de custo. Carlos determinou depois **não criar banco, branch paga ou recurso com custos**. Nenhuma confirmação de cobrança foi enviada. Listagem posterior de branches do TEST: vazia.

Cotação read-only: US$ 0,01344/h, aproximadamente **US$ 9,81 por 730 horas somente de computação**. Micro: CPU compartilhada, 1 GB RAM, banco recomendado de até 10 GB, 60 conexões Postgres/200 clientes do pooler. Exige Pro ou superior; assinatura/upgrade e demais usos não estão incluídos nessa estimativa. Branches não são cobertas pelo Spend Cap e podem cobrar disco/Storage/egress adicionais. Referências e condições completas no plano. Não há autorização para executar o plano agora.

O ambiente deverá possuir banco/Auth/Storage próprios, contas normais dedicadas, backend distinto de TEST/PROD e perfil de aplicação exclusivo, bloqueado por padrão. O runtime atual fixa `GAMEPLAY_ENABLED=false`: não liberar gameplay na Preview Guilda/EBD mudando somente backend/variável ou reabrindo ACLs do TEST. Endereços reais e autorização das contas do futuro ambiente ainda devem ser definidos. Não reutilizar projetos de outros sistemas.

## Arena e Torre

**DONE isolado:** nova configuração `playwright.gameplay-isolated.config.ts` reutiliza as fixtures existentes, inicia somente Vite em loopback e bloqueia tráfego externo nos testes. Não inicia Next nem conecta a Supabase. Matriz final: **6/6 PASS**, um cenário Arena e um Torre em Chromium desktop 1440, Chromium móvel 320 e WebKit móvel 390.

Arena: coleção sintética de 40 cartas da fixture, seleção de sete distintas, persistência de cartas usadas, serialização entre abas e nova revanche. Essa coleção **não é o catálogo oficial** nem comprova aquisição legítima hospedada. Os testes do catálogo candidato de sete cartas continuam na suíte unitária: propostas, zero cartas homologadas/zero fontes de aquisição autorizadas. Nenhuma carta concedida.

Torre: nos três perfis, sete vitórias por ações normais da fixture, andares sequenciais, IDs de batalha distintos, uso único de carta, campeão final, reload/reconexão local e isolamento entre identidades sintéticas. Sem escrever progresso ou resultado para forçar vitória. Atributos e baralho são sintéticos e inicializados antes do combate, como já previsto pela fixture; isso **não é prova hospedada**. Nenhuma recompensa real.

A primeira matriz teve 5 PASS/1 FAIL: o teste desktop aguardou cinco segundos pelo resultado confirmado e expirou durante a fila de apresentação. A captura após a falha mostra vitória e resultado persistido. A única alteração foi permitir até 15 segundos nesse poll, mantendo o mesmo resultado exigido e as mesmas ações; matriz final 6 PASS. Não alterar motor, atributos ou progresso para obter o resultado. Logs iniciais preservados.

**DONE por evidência anterior reutilizada:** 74 testes PostgreSQL omitidos por opt-in na suíte comum foram executados separadamente no RPG-DEV-001, incluindo autoridade econômica, equipamentos, Torre determinística/transacional, idempotência, derrotas e recuperação. SQL e motor não mudaram nesta tarefa; não repetir essas simulações nem marcar SKIP como PASS. A prova determinística anterior cobre sete andares/campeão e liquidação candidata de primeira vitória, duplicação/falhas. O contrato continua **proposto**, total 430 XP/215 moedas/um baú épico, sem habilitação de créditos reais.

**BLOCKED hospedado:** vitórias/derrotas Arena, aquisição autorizada, sete andares/campeão, recibos e reconexão no servidor aguardam ambiente isolado e homologação aplicável. Os HTTP 403 da Preview são negações corretas, não testes positivos de gameplay.

## Reconciliação econômica

**BLOCKED:** leitura atual confirma avatar `31b70059-deca-44c8-a6df-f21ea68b6e42`, UID `78729453-8e04-478c-96ae-d37cead1bc8c`, nível 50, XP 245016 e moedas 1006265. `economic_verified_at` continua NULL; nenhuma certificação manual.

Baseline autorizado e já documentado em 15/10 às 19:31:33.9727Z: XP 245000/moedas 999999. Após esse ponto: 28 aberturas somam 7160 moedas e cinco compras somam 900; saldo esperado **1006259**. Os cinco checkpoints das compras conferem exatamente. Última operação com recibo: 15/10 às 19:52:08.117475Z. Diferença permanece **16 XP e 6 moedas**, sem eventos canônicos de batalha, operações/recompensas Journey, claims Guilda ou pendências EBD que a expliquem.

A contagem global do avatar é 34 operações: uma concessão anterior ao baseline, 28 aberturas e cinco compras. As 33 operações após baseline dos relatórios anteriores não são outro conjunto de créditos. Não atribuir a diferença à concessão anterior.

Examinei metadados/saldos do backup privado `D:/rpg-jovem-cristao-task-0076/build/task-0076-chat-a/private-backup-before.json`, SHA-256 `bb91019d04139e47dfd17fc80c9beb5e10efd15a0de2239916b24556f906993a`: snapshot anterior ao provisionamento, XP 0/nível 1/moedas 90, atualização de 15/10 às 19:14:58.15584Z. Ele não é um snapshot contemporâneo do acréscimo inexplicado. Os manifests locais da preparação de recuperação registram hashes/configuração, sem comprovar o evento econômico ausente.

Os indícios de PATCH/add_coins e a semelhança com duas recompensas antigas de 8 XP/3 moedas, descritos nas investigações anteriores, continuam hipóteses sem payload/recibo canônico. Não criar recibos retroativos, ajustar saldos, confirmar economic_verified_at ou declarar origem comprovada. Créditos produtivos e da Torre permanecem bloqueados. Desbloqueio exige evidência contemporânea que vincule ator, operação, valores e saldo.

## Equipamentos e aparência

**DONE na preservação:** build gate confirma cinco PNGs/seis composições aprovadas, incluindo couraça 3 e empunhadura no corpo atual. Nenhum arquivo em `apps/web` ou `packages` foi alterado nesta tarefa. Os testes positivos anteriores de equipar/desequipar, atributos e persistência continuam válidos no ambiente isolado do RPG-DEV-001, sem alegar nova execução hospedada.

**REWORK:** comparações privadas antes/depois de elmo, escudo, botas e medalhão em `build/rpg-dev-002/visual-review/index.html`, com capturas desktop/móvel e hashes. Só HTML/CSS e artes antigas existentes; nenhum bitmap redesenhado ou integrado. Revisão visual do autor: elmo encobre rosto, botas não acompanham o corpo e as demais composições também precisam revisão antes de solicitar aceite. Não apresentar esses rascunhos como homologados. Captura móvel sem overflow; isso não aprova proporção/arte.

**BLOCKED:** troca positiva hospedada entre duas variantes adquiridas e homologadas ainda depende da existência dessas variantes e do contrato econômico autorizado. Nenhum item concedido para fabricar o teste.

## Gates, arquivos e publicação

| Gate | Estado e evidência |
| --- | --- |
| Unitários completos | DONE: 771 PASS/74 SKIP, 117 arquivos PASS/sete omitidos. Preserva os 764 e acrescenta sete checks do transporte |
| Primeira execução unitária | REWORK resolvido na execução: 770 PASS/1 timeout ao importar adaptador DB sob carga concorrente; mesmas asserções, rerun integral `--maxWorkers=2`: 771 PASS, sem aumentar timeout ou mudar produto |
| PostgreSQL/Auth/RLS/economia | DONE por evidência válida do RPG-DEV-001, 74 casos executados separadamente; não executados novamente nesta tarefa, sem mudança de SQL/motor |
| Navegador local Arena/Torre | DONE: seis PASS; não comprova servidor hospedado |
| Chromium hospedado | DONE por 48 checks prévios do mesmo runtime, preservados; não repetidos sem mudança da aplicação |
| WebKit hospedado | BLOCKED na matriz completa; links 42 checks novos PASS, navegação completa ainda intermitente |
| API/ACL release | DONE por evidência anterior inalterada; sete respostas HTTP de produção reconferidas; gameplay positivo hospedado BLOCKED |
| Lint/TypeScript/build | DONE: comandos completos exit 0; assets e isolamento do áudio PASS |
| Protocolo CI/publicação | DONE: 25 PASS |
| Celular físico | BLOCKED: não disponível; emulação executada não é dispositivo físico |
| QA/Security | DONE na revisão pelo autor, sem alegar independência; aceite geral BLOCKED |

Arquivos técnicos: `tests/hosted/{protected-preview-probe.mjs,README.md}`, `tests/fixtures/protected-preview-route.ts`, `tests/protected-preview-route.test.ts`, `playwright.gameplay-isolated.config.ts`, `tests/e2e/arena-tower.spec.ts`, `vitest.config.ts`, `tsconfig.json`. Documentação: plano hospedado, este relatório, contrato e memória. Nenhuma dependência nova.

Commit técnico enviado à mesma PR: [`cf056ead2da2efd5bba8d80224f53736a1ca21ba`](https://github.com/CarlosJr30/rpgjovemcristao/commit/cf056ead2da2efd5bba8d80224f53736a1ca21ba). **DONE:** [CI do SHA exato](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40147803696) completed/success, incluindo unitários, lint, tipos, build e protocolo. O job de deployment foi corretamente SKIP por se tratar da branch de desenvolvimento; SKIP não é publicação. O commit documental posterior registra esta evidência, sem modificar a aplicação.

**Preview preservada:** [deployment READY do runtime 2d0132e](https://rpgjovemcristao-nu38qe2u0-carlos-junior-s-projects.vercel.app), `dpl_6nLjgXqu6GrzJeoAfGnU5sntcn6U`, backend TEST. O commit atual altera somente testes/documentação, sem novo artefato de aplicação; nenhum deployment adicional foi criado. Não alegar que a Preview serve o SHA dos novos testes.

**Migrations aplicadas: nenhuma. Recursos criados: nenhum. Produção: preservada em 808433a/READY, sem merge/deploy de gameplay.** Evidências privadas, inclusive falhas iniciais, em `build/rpg-dev-002/`; não publicar credenciais/sessões.

## Próxima tarefa recomendada

Manter PR11 em rascunho. Isolar a causa WebKit com prova de cancelamento/navegação em ambiente controlado e Safari quando disponível, sem flexibilizar proteções. Prosseguir apenas localmente enquanto a criação de recursos estiver suspensa. Para a validação hospedada futura, revalidar orçamento e obter autorização específica antes de provisionar; homologar catálogo/aquisição/recompensas e contas do novo ambiente. Buscar evento/backup contemporâneo da diferença econômica e refazer as peças visuais antes de solicitar aprovação. Esses bloqueios impedem a publicação de gameplay; Guilda/EBD continuam disponíveis.
