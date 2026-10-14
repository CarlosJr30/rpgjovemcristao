# TASK-0063 — Rework de isolamento e publicação mobile

## Release validada — retomada em 2026-10-10

STATUS: **VALIDATING — RELEASE_GATES_PASS / publicação pendente**. O CLI autenticado resolveu o bloqueio de acesso anterior. Projeto existente e integração Git confirmados por consulta real: `carlos-junior-s-projects/rpgjovemcristao-web`, Root Directory `apps/web`, Next.js, Node24.x, GitHub `CarlosJr30/rpgjovemcristao`, productionBranch `main`. Variáveis públicas necessárias presentes em Production; valores não impressos. Fetch origin PASS, divergência0/0 antes do commit.

| Item final solicitado | Resultado deste checkpoint |
|---|---|
| Arquivos selecionados | 133 caminhos no diff staged, incluindo oito renomes100%: cinco CSS mobile, config Next/package, scripts de isolamento/DEV/QA, testes/configs, manifest/fontes privadas, documentação pertinente e82 screenshots0062. `.gitignore` contém somente hunks0062/0063 no index. Alterações0059 e memória/checklist mistos continuam locais. Lista em release-plan.json. |
| Gates repetidos | Unit56 PASS/12 arquivos; lint e typecheck PASS; build local PASS; build do snapshot staged sem.env PASS;54 HD; public209/artefato723 sem achados; oitoURLs404. DEV5 casos distintos e produção33 aceitos/5skips após followups sequenciais. |
| Segurança | Staging revisado sem achados; oito fontes privadas mantêm SHA/receipts e Git reconhece renomes100%. Nenhum original excluído, Body-Fit aprovado, Supabase alterado ou dado real utilizado.16 registros do trabalho excluído0059/HD-documentação permanecem idênticos. |
| Commit / push / hash remoto | Pendentes neste checkpoint; HEAD204ba56fc8b0ded2a4d99310818094210ddbbea2. Revisar remoto novamente antes do push normal. |
| Deployment / URL / status | Nenhum novo deployment neste checkpoint. Acompanhar somente o deploy automático disparado pelo push ao projeto existente; alias https://rpgjovemcristao-web-inky.vercel.app/. Não DEPLOY_COMPLETE ainda. |
| Pendências | Commit/push, READY do hash correto, smoke publicado e URLs404. Validação física e login real permanecem fora das provas realizadas. |

Falhas desta repetição preservadas: DEV4PASS/1FAIL e produção32PASS/1FAIL/5SKIP nas execuções paralelas; mensagens de JSON incompleto/truncado e target fechado. Os dois casos afetados passaram separadamente, sem alterar runtime, assets ou critérios: produção1PASS e DEV1PASS em seis viewports. A causa precisa da instabilidade do transporte não foi comprovada; não atribuir esses erros a uma correção inexistente no jogo. As execuções brutas permanecem locais. `rework-qa-summary.json.finalRelease` consolida casos por título/perfil e preserva os resultados anteriores.

Snapshot do index: build/task-0063-deployment-audit/release-snapshot-1791644467183, sem.env privado e sem mudanças locais0059. Build com configuração pública QA fictícia e dependências existentes reutilizadas; clean npm ci não executado. Gates físicos723/zero achados/8 hashes PASS no cache padrão apps/web/.next, além do cache isolado da working tree. Mudanças posteriores ao snapshot são registros de QA/documentação e whitespace de.gitignore, sem mudança no código compilado. Nunca enviar esse build fictício via --prebuilt.

## Histórico — checkpoint anterior de isolamento local e bloqueio do conector

Estado atual em 2026-10-10, notebook `D:\Projetos IA\rpgjovemcristao`: **BLOCKED — VERCEL_ACCESS_REQUIRED**. O rework e os gates locais passaram. Nenhum commit, push ou novo deployment foi realizado; **não DEPLOY_COMPLETE**. O diagnóstico inicial e suas falhas permanecem no histórico abaixo.

| Entrega solicitada | Evidência atual |
|---|---|
| 1. Causa raiz | Os oito OGG estavam em `apps/web/public/assets/audio`; catálogo vazio e guarda DEV não impediam distribuição física. |
| 2. Localização anterior | `apps/web/public/assets/audio/music/arena_training.ogg` e sete arquivos em `apps/web/public/assets/audio/effects/`. |
| 3. Estratégia e localização atual | Relocação byte a byte para `assets-source/arena-audio-prototype/audio/`; servidor auxiliar exclusivo DEV, em loopback, sem cópias em public. Gates antes de build/start e inspeção física depois do build. |
| 4. Hashes preservados | Oito SHA-256 iguais aos originais e às receipts. Mapa completo de caminho anterior, atual e hash em [PROTOTYPE-AUDIO-ISOLATION-V1.json](PROTOTYPE-AUDIO-ISOLATION-V1.json). Nenhuma licença ou aprovação comercial alterada. |
| 5. Alterações | Scripts DEV/isolation e declarações de tipos; `apps/web/package.json`; `apps/web/next.config.ts`; auditor do protótipo; testes/configuração QA; manifest e README das fontes; evidências e documentação. Lista revisável em [release-plan.json](../../build/task-0063-deployment-audit/release-plan.json). As cinco folhas CSS mobile da0062 são candidatas à release; o trabalho0059 permanece separado. |
| 6. DEV | Música e sete efeitos com reprodução/decodificação nativa em Edge; controles de volume/mute, persistência de preferências, eventos sem repetição e falhas sem interromper combate: cinco casos distintos PASS. Followup de encerramento automático: um PASS. |
| 7. Produção local | Nenhum dos oito arquivos em public, static, server ou traces de deployment. Catálogo comercial continua vazio; runtime não recebe bindings de protótipo. |
| 8. HTTP | Oito URLs antigas retornam404. E2E também verificou404 para os oito caminhos de fontes privadas e rotas de laboratório/galerias. [Receipt HTTP](../../build/task-0063-deployment-audit/rework-http-isolation.json). |
| 9. Artefatos | Inspeção física local de723 arquivos, zero achados; nomes, SHA, assinaturas de áudio, cópias renomeadas, URLs concretas e traces inspecionados. [Receipt físico](../../build/task-0063-deployment-audit/rework-artifact-audit.json). Artefato remoto Vercel ainda não verificado. |
| 10. Testes | Unit:73 testes distintos em12 arquivos (32 áudio/isolation e41 mobile). DEV:5 casos distintos PASS. Produção:33 casos distintos aceitos após followup, cinco skips planejados. Falhas e correções discriminadas abaixo. |
| 11. Lint | PASS, `npm.cmd run lint`; auditor físico novamente validado por ESLint após a última ampliação da lista de diretórios. |
| 12. Typecheck | PASS, `npm.cmd run typecheck`; configs QA incluídos. `next-env.d.ts` restaurado aos bytes anteriores e typecheck do app novamente PASS. |
| 13. Build | PASS, `npm.cmd run build` com cache QA isolado `.next/task-0062-mobile`. Gate público209 arquivos PASS; auditor54 HD PASS; Next produção PASS; gate físico723 arquivos PASS. |
| 14. Commit | Não criado. Branchmain, HEAD `204ba56fc8b0ded2a4d99310818094210ddbbea2`; index vazio. Mensagem planejada: `fix: improve mobile RPG experience`. |
| 15. Push | Não executado. Consulta fresca `git ls-remote origin refs/heads/main` em2026-10-10 confirma o mesmo hash; referência localorigin/main igual, divergência0/0. |
| 16. Vercel / deployment | Projeto existente `rpgjovemcristao-web`, ID `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`; equipe `team_FWD8MfZ9vARK8EBovoyTn9Ox`. Nenhum deployment novo. Deployment antigo `dpl_CrF9BZkNNpstBhG1nS7b1wiQERrZ`, READY/gitmain/204ba56, não comprova este rework. |
| 17. Verificação publicada | Não realizada para uma nova release. Alias previsto: [site existente](https://rpgjovemcristao-web-inky.vercel.app/). Root Directory, configuração atual de productionBranch e artefatos remotos pendentes por HTTP403. |
| 18. Pendências / status | Acesso efetivo ao escopo da equipe, confirmação da configuração Vercel, revisão final do index e remoto, commit/push, acompanhamento READY e smoke publicado. **TASK-0063 BLOCKED; não DONE.** |

## Fluxo implementado e proteção de produção

`npm.cmd run dev` inicia o Next e um servidor auxiliar ligado a127.0.0.1 em porta aleatória. Só os oito caminhos aprovados para protótipo são atendidos, com hash verificado, suporte aGET/HEAD/ranges e resposta404 para fonte ausente, modificada ou caminho desconhecido. O processo recusa execução com NODE_ENV de produção. As fontes permanecem fora depublic durante toda a sessão. Encerramento limpa apenas os processos filhos criados pela sessão, sem manipular servidores preexistentes.

`npm.cmd run build` valida fontes/receipts e public antes de compilar, audita54 HD, compila e verifica fisicamente o resultado. `npm.cmd run start` também exige o gate de artefato. O config protege chamadas diretas aNext build/start com o gate público. O scanner rejeita os oito nomes/SHA, áudio sem receipt comercial válida e referências privadas em traces; fixtures comprovam rejeição de cópias renomeadas com extensão não sonora e de OGG modificado. O gate falhou corretamente nos oito arquivos antes da relocação e passou após a correção.

Há rewrites somente em DEV para transportar o áudio ao servidor auxiliar. A exclusão de produção depende da relocação física e dos gates; não depende de ocultar URLs. `outputFileTracingExcludes` complementa o controle de traces. O contrato Next distingue arquivospublic de traces de servidor: [public folder](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder) e [output tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

Os oito originais totalizam1.774.577 bytes. Licença `SUNO_FREE_NON_COMMERCIAL`, scope `NON_COMMERCIAL_PROTOTYPE_DEVELOPMENT_ONLY` e `commercialProductionApproved=false` permanecem. O gate comercial daTASK-0042 continua pendente para eventual áudio em produção; esta release exclui esses arquivos do conteúdo distribuído ao jogador.

## QA, falhas corrigidas e limites

| Execução | Resultado e interpretação |
|---|---|
| Unit áudio/isolation | Quatro arquivos,32 PASS; testes de hash/receipt, negativas de cópias/traces, servidor DEV e catálogo comercial. |
| Unit mobile | Oito arquivos,41 PASS; execuções por grupos, não uma execução única de73 testes. |
| Followup final do scanner | Cinco testes de isolamento PASS e ESLint PASS após incluir também `apps/web/.vercel/output` na inspeção. Não houve nova alteração no runtime compilado. |
| DEV completo | `dev-e2e.json`:5 PASS. Música/sete efeitos decodificados/reproduzidos por navegador real; preferências e falhas exercitadas. Teardown inicial ficou preso e exigiu encerrar somente a árvore de processos QA comprovadamente pertencente à sessão. |
| DEV encerramento corrigido | `dev-shutdown-e2e.json`:1 PASS em26,4s, encerramento automático após comando direto do wrapper e ajuste de lifecycle. |
| Produção inicial | `production-e2e.json`:30 PASS /3 FAIL /5 SKIP. Um target do navegador caiu antes de abrir Arena; dois testes usavam o rótulo incorreto `Email` em vez de `E-mail`. |
| Produção followup | `production-followup-e2e.json`:4 PASS, Arena Level1 nos dois perfis e dois testes corrigidos de formulário. Consolidado:33 casos distintos aceitos /5 skips planejados; a primeira execução com falhas permanece preservada. |
| HTTP e artefato | URLs restritas404 e723 arquivos sem achados; são provas de produção **local**, não de um deployment remoto. |

Resumo versionável sem perfis/traces privados: [rework-qa-summary.json](../../build/task-0063-deployment-audit/rework-qa-summary.json). Os relatórios brutos e as traces são locais e permanecem ignorados. A galeria antes/depois da0062 continua em [review/index.html](../../build/task-0062-mobile-experience/review/index.html), com82 screenshots preservados.

O ambiente inicial de teste DEV não tinha configuração pública de autenticação e quatro casos falharam; a configuração QA recebeu exclusivamente valores fictícios locais, com tráfego externo bloqueado. Nenhuma implementação de autenticação, credencial real ou Supabase foi alterada. A validação inicial de codec unitário dependia deffprobe ausente; a metadata unitária usa mock identificado e a prova de codec é a reprodução nativa das oito fontes no navegador. Erros de tipos do probe e do config webServer causaram falhas intermediárias de build/typecheck e foram corrigidos antes dos checks finais.

Mobile e desktop foram exercitados por emulação Edge, incluindo a matriz0062 de dez viewports, toque/teclado, overflow, reduced motion, Equipamentos, Arena e formulário de login. O teste de login valida apresentação e validação nativa do formulário; não autentica contas reais. CLS sob CPU4×: perfil mobile0; perfil desktop0,04317/0,05075. Uma identidade HD requisitada, sem carregar as54 simultaneamente. Não houve teste em celular físico, iOS Safari, leitor de tela ou conta autenticada remota.

O build local usa configuração pública QA fictícia e **não deve ser enviado como prebuilt de produção**. A eventual publicação deve construir no projeto existente com seu ambiente Production confirmado. Nomes `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` foram observados nas consultas resumidas anteriores; valores não foram exibidos nem validados funcionalmente.

## Revisão Git, segurança e preservação

O plano local identifica arquivos0062/0063, oito relocations, exclusões e hunks seletivos de`.gitignore`. Nenhum arquivo foi staged. Alterações0059, galeria offline, scripts de equipamentos e reconciliações de seus contratos permanecem locais e fora do plano da release. Memória/checklist contêm trabalho misto e exigem revisão separada antes de eventual inclusão.

[rework-preservation-final.json](../../build/task-0063-deployment-audit/rework-preservation-final.json) compara os 2.002 registros anteriores: 1.982 intactos, 12 mudanças autorizadas e oito relocações com os mesmos bytes; zero mudanças inesperadas. Fontes/receipts HD, Body-Fit, economia, saves, IDs, engine, autenticação e trabalho0059 preservados. Body-Fit: sete revisões humanas pendentes, um READY somente staging e zero V2 ativos; nenhum gate promovido.

A revisão de candidatos e arquivos textuais rastreados verifica padrões de chaves privadas, tokens de provedores, strings de conexão com senha e JWT privilegiado, sem imprimir valores e sem ler arquivos privados de ambiente. Evidência/resultados e limites constam de [release-plan.json](../../build/task-0063-deployment-audit/release-plan.json) e [Security review](../security/TASK-0063-PRODUCTION-REVIEW.md). QA e Security pelo autor, sem independência.

## Bloqueio externo e retomada

Mesmo após o usuário informar reconexão concluída, as consultas detalhadas `get_project` e `list_deployment_files` com o projeto/equipe existentes retornaramHTTP403: falta de autorização ao escopo `carlos-junior-s-projects`. Respostas resumidas sem escopo não expõem Root Directory/productionBranch e não substituem essas confirmações. CLI Vercel autenticado não está disponível neste notebook. Não foi criado projeto alternativo nem instalada ferramenta para contornar o acesso.

Para retomar a mesmaTASK, disponibilizar acesso efetivo ao projeto nessa equipe pelo conector ou por CLI autenticado. Não enviar tokens na conversa. Após resolver o acesso: confirmar rootdir/framework/branch e nomes do ambiente, atualizar somente os checks invalidados por novas alterações, revisar diff/index e remoto fresco, criar o commit, executar push normal, acompanhar o novo hash atéREADY e validar o site/URLs/artefatos publicados. Push foi suspenso porque pode disparar deploy automático com configuração ainda incerta. [Checklist mestre](EQUIPMENT-MASTER-CHECKLIST-V1.md), contrato e memória registram este bloqueio.

## Histórico preservado — auditoria inicial de 2026-10-09

### Relatório de publicação mobile anterior ao rework

STATUS: **BLOCKED — SECURITY_GATE_FAILED**. Não DEPLOY_COMPLETE. Auditoria realizada em 2026-10-09 no notebook `D:\Projetos IA\rpgjovemcristao`; evidência HTTP em UTC2026-10-10T00:59:49.590Z. Publicação interrompida antes de commit/push/deploy conforme instrução explícita do usuário.

| Item solicitado | Resultado comprovado |
|---|---|
| 1. Branch inicial | main |
| 2. Arquivos publicados | Nenhum. Working tree preserva0059 e0062 locais; index vazio. |
| 3. Testes | Nesta0063:8verificações de áudio FAIL,4rotas DEV/privadas404 PASS. Unit/E2E mobile da release pendentes após falha do gate. |
| 4. Build | Nenhum build novo0063. Usado build produção anterior0062 para diagnósticoHTTP, BUILD_ID8Ys4Y6xfgGeDMgWu2OsMl. |
| 5. Commit criado | Nenhum; HEAD204ba56fc8b0ded2a4d99310818094210ddbbea2 preservado. |
| 6. Push/hash remoto | Nenhum push. Consulta fresca git ls-remote origin refs/heads/main:204ba56fc8b0ded2a4d99310818094210ddbbea2; referência local igual,0/0. |
| 7. Projeto Vercel | rpgjovemcristao-web; prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG; team_FWD8MfZ9vARK8EBovoyTn9Ox; frameworknextjs. Nenhum projeto criado/configurado. |
| 8. Deployment ID/URL | Deployment **preexistente** dpl_CrF9BZkNNpstBhG1nS7b1wiQERrZ; https://rpgjovemcristao-538dhxx9v-carlos-junior-s-projects.vercel.app/; alias https://rpgjovemcristao-web-inky.vercel.app/. Nenhum novo deployment. |
| 9. Status da publicação | Nova publicação bloqueada. Deployment antigoREADY, sourcegit/main, hash204ba56; não contém as alterações locais0062. READY antigo não prova entrega0063. |
| 10. Problemas | Oito áudios SunoFree não comerciais servidos diretamente em produção local; Root Directory/configuração da branch de produção não confirmados pelas respostas disponíveis. |
| 11. Pendências | Isolar fisicamente áudio restrito; comprovar artefato/HTTP; confirmar Root Directory e conexão atualmain; executar gates novos da release e revisão final de secrets/index; então commit/push/deploy/smoke publicados. |
| 12. Checklist atualizado | [Checklist mestre](EQUIPMENT-MASTER-CHECKLIST-V1.md), [contrato ativo](../../tasks/active/TASK-0063-publish-mobile-fixes-vercel.md) e [.agent/memory/CURRENT_STATE.md](../../.agent/memory/CURRENT_STATE.md) registram bloqueio, preservando históricos0059/0062. |

## Causa comprovada

APPROVED_MUSIC e APPROVED_EFFECTS permanecem vazios; os bindings SunoFree são limitados a NODE_ENV=development. Porém os arquivos físicos continuam rastreados em `apps/web/public/assets/audio`. O servidor `next start` do build de produção0062 retorna o conteúdo original sem qualquer acesso de protótipo.

| Caminho relativo a public | HTTP produção local | Licença/receipt | Bytes servidos = original/receipt |
|---|---|---|---|
| assets/audio/music/arena_training.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |
| assets/audio/effects/arena_attack.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |
| assets/audio/effects/arena_defense.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |
| assets/audio/effects/arena_focus.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |
| assets/audio/effects/arena_dodge.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |
| assets/audio/effects/player_hit.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |
| assets/audio/effects/victory.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |
| assets/audio/effects/defeat.ogg | 200/audio/ogg | SUNO_FREE_NON_COMMERCIAL; comercialfalse | Sim |

Hashes completos, tamanho, assinaturaOgg e resultados em [production-isolation.json](../../build/task-0063-deployment-audit/production-isolation.json), evidência local ignorada. Isso demonstra falha de isolamento no servidor de produção local; não foi realizado download desses arquivos do deployment remoto e não se afirma que sua configuração privada seja idêntica. A distribuição de arquivospublic na raiz é o comportamento documentado do [Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder). A TASK-0042 já registra que presença física empublic não autoriza publicação comercial.

Quatro rotas locais verificadas404: `/tools/arena-lab/`, `/assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png`, `/build/task-0059-equipment-recovery/review/index.html`, `/build/task-0062-mobile-experience/review/index.html`. É uma amostra de isolamento, não certificação de todas as rotas/devassets.

## Separação do trabalho local

Arquivos runtime0062 candidatos a um commit futuro: auth/auth.module.css; journey/journey.module.css; components/diary-experience.module.css; equipment-portal.module.css; guild-experience.module.css; apps/web/next.config.ts. Testes/harness/configPlaywright e relatório/contrato/evidências0062 associados precisam de revisão final antes de staging. A memória e checklist contêm trabalho compartilhado/histórico e exigem staging seletivo se incluídos. Nada foi staged.

Os scripts/reports/checkpoints0059, galeria offline, reconciliação0048/0049G/0049H/0049/0050 e mudança de contrato0059 active→completed continuam locais. Não foram incluídos em commit/deploy. Body-Fit mantém8FIT_PASS/1NEEDS_REWORK/7NEEDS_NEW_ART,7aprovações humanas pendentes,1READY somente staging e0V2ativos; Calças somente proposta. Nenhum asset, save, economia, auth ou Supabase alterado.

## Configuração Vercel e segurança

Consultas autenticadas somente leitura confirmaram o projeto/alias, frameworkNext.js e deployment antigo sourcegit/main/204ba56. A lista de ambienteProduction contém NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, sem exibir valores, sem puxar env, sem mudanças. Nomes presentes não provam valores corretos nem autenticação funcional. Root Directory e configuração atual de productionBranch não vieram nas respostas consultadas; não se presume apps/web nem se altera configuração incerta.

Arquivo local apps/web/.env.local continua ignorado; os únicos arquivos `.env` rastreados são exemplos. A auditoria de produção não leu seu conteúdo nem exibiu credenciais. Nenhum commit preparado; varredura final de todo o candidato/index ainda pendente, sem declarar certificação completa de ausência de secrets. Revisão Security pelo autor, sem independência, FAIL para o gate de distribuição/licença.

## QA, limites e retomada

O [relatório0062](TASK-0062-MOBILE-EXPERIENCE-REPORT.md) contém evidências anteriores:41unitPASS,72E2E distintos aceitos/10skips, lint/typecheck/buildPASS,200cenários antes/depois e82screenshots. Esses resultados são históricos; não foram reexecutados nesta0063 e não são promovidos a gate fresco de release. Novos unit/E2E/lint/typecheck/build e smoke publicado não executados porque o gate de segurança falhou primeiro. Nenhum teste físico realizado.

Servidor temporário loopback3163, separado de servidores preexistentes, utilizou cacheprodução isolado0062 e variáveis públicasSupabase vazias; encerrado ao terminar. Tentativa inicial pelo scriptnpmraiz falhou no encaminhamento do argumentoport; corrigida chamando diretamente o workspace, sem mudar arquivos. Nenhuma instalação, escrita em Vercel/Supabase, operação Git destrutiva, commit, push ou deploy.

Preservação final PASS: dos 1.999 caminhos do inventário inicial, 1.997 mantiveram estado e bytes; somente memória e checklist existentes receberam atualizações autorizadas. Entre os caminhos preservados, 245 assets públicos/fontes e 146 arquivos associados à0059 permanecem idênticos. Os novos arquivos são exclusivamente contrato/relatório/parecer0063 e evidência local ignorada. HEAD inalterado, index vazio, `git diff --check` PASS. Detalhes em [preservation-final.json](../../build/task-0063-deployment-audit/preservation-final.json). Nenhuma correção mobile anterior foi descartada.

Retomar a mesma TASK-0063 após excluir os oito arquivos restritos do artefato público de produção e preservar originais para DEV, ou após substituição futura devidamente licenciada. Catálogo silencioso/JavaScript tree-shaken não basta. Comprovar ausência física e404 no artefato final, repetir gates necessários, confirmar configuração do projeto e remoto, revisar diff/secrets e só então executar o commit autorizado, push normal e publicação. Não há necessidade de abrir outra tarefa para registrar este bloqueio.
