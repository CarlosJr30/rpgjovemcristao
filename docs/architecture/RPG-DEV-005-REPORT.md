# RPG-DEV-005 — causa e correção da concorrência WebKit/RSC

25/10/2026. Continuação da [PR #11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), branch `codex/rpg-dev-001`, base `35fa16d992898035d52fb266223b876a6e88c445`. **DONE no escopo da correção RSC conservadora: fixture, aplicação completa local, CI e Preview TEST real validados. Gameplay/produção BLOCKED pelos gates anteriores.** Runtime candidato `d95cd4cf3516c56d6d6b8060bc5bf394f79dbba8`; PR continua em rascunho.

## Causa comprovada

Lidos o relatório004, recortes RSC/concorrência e fontes locais do Next16.4.2. A reprodução original foi preservada: quatro prefetches reais `/_tree` pendentes, seis links visíveis, navegação completa. O controle instrumentado mantém WebKit **3/3 falhas, dois pageerrors por caso**, sem Auth/banco/cookies/browser routing/fetch wrapper. Chromium e controles sem troca de documento permanecem sem erros.

Há duas etapas da mesma corrida:

1. `beforeunload` inicia a saída. WebKit cancela as quatro cargas antigas. O cache rejeita suas entradas, acorda tarefas bloqueadas e o scheduler decrementa `inProgressRequests`, agenda microtasks e inicia os dois alvos restantes. Ele não acompanha a saída do documento. O motor recusa essas novas cargas antes de `pagehide`, sem resposta HTTP.
2. Uma tarefa já pode ter saído da fila e estar aguardando `setCacheBustingSearchParam`/`crypto.subtle.digest`. Mesmo pausando o scheduler, essa continuação chega ao fetch depois de `beforeunload`. Na aplicação: saída aos699ms; envios Guilda/EBD aos700/701ms; `pagehide` aos708ms, com dois pageerrors. A fixture reduzida não exercitava esse intervalo de forma suficiente.

O novo contraste prende a conclusão de quatro hashes SHA-256 reais antes da navegação, libera suas continuações no documento provisório WebKit e não altera fetch/payload/status. **Sem patch: 3/3 falhas, seis pageerrors por caso** (as quatro continuações e mais trabalho liberado). Isso liga a segunda causa a uma reprodução determinística própria.

Hidratação/remount podem registrar trabalho novo nesse intervalo. Um estado ligado ao ciclo React de cada Link não cobre todo o trabalho interno. Não foi comprovada corrupção de payload, leitura de outra sessão ou defeito do servidor. Cache rejeitado e cancelamento são consequências/intermediários; o erro visível decorre de iniciar novas cargas no documento em saída. A classificação access-control do motor não comprova CORS incorreto. Os relatos primários [Playwright43120](https://github.com/microsoft/playwright/issues/43120) e [42823](https://github.com/microsoft/playwright/issues/42823) sustentam essa distinção; não substituem nossas provas nem comprovam Safari físico.

## Correção mínima

Patch restrito ao transporte interno `next/dist/{client,esm/client}/components/segment-cache/fetch.js` do **Next16.4.2**. No ponto imediatamente anterior ao fetch nativo, adia novas requisições internas de prioridade `low` enquanto o documento está em saída. Cobre tanto a fila reativada por cancelamentos quanto as continuações assíncronas já fora dela.

Não substitui `window.fetch`, não altera headers RSC/CORS/Auth, não captura nem filtra erros do produto, não cancela cargas já em curso e não bloqueia navegações de prioridade `auto`. As promessas adiadas continuam pendentes e não são escritas no cache como falhas artificiais. **Somente `pageshow` retoma trabalho do documento preservado**; um documento novo começa normalmente. AbortSignal continua encerrando trabalho adiado e removendo seu listener/fila. Estado pertence ao módulo do documento, independente de montagem React.

**Limitação deliberada de desempenho:** após cancelar um diálogo beforeunload, a interface/estado e a navegação SPA continuam funcionando, mas novos prefetches de fundo daquele documento permanecem adiados até restauração/fresh document. Isso evita adivinhar o resultado da navegação. Os quatro pedidos já em curso não são abortados pelo patch. O ensaio exige SPA funcional após cancelar e seis prefetches normais após retorno/recarga. Não declarar retomada imediata de prefetch após cancelar um diálogo.

**Terceira corrida comprovada, candidato com interação rejeitado:** a retomada por pointerdown/keydown parecia funcionar nos60 casos iniciais e48 fluxos completos, mas um clique real no documento ainda provisório reacendeu as duas cargas recusadas:3/3FAIL, dois pageerrors/caso. Eventos da Navigation API também não notificaram o cancelamento do diálogo na revisão instalada; não foram adotados como garantia. A nova regressão mantém a navegação provisória e clica fora dos links. A correção final remove a heurística de interação; o CI anterior não basta para homologar esse candidato.

Aplicação reproduzível em `scripts/next-rsc-departure-patch.mjs`, helper em `scripts/patches/next-rsc-departure.txt`. Os comandos explícitos de teste e build aplicam os dois formatos, verificando versão e hashes exatos antes de escrever; fontes desconhecidas falham. `--check` verifica o estado; `--restore` serve apenas ao controle diagnóstico. `.npmrc` mantém `ignore-scripts=true`, sem habilitar hooks de dependências. Nenhuma dependência ou versão foi adicionada/atualizada. A manutenção do patch exige revisão explícita ao atualizar Next.

**REWORK no primeiro CI (`4d0ab58`):** o hook postinstall proposto não executou devido a essa proteção existente; os oito testes negativos falharam como esperado para código sem patch. Nenhuma Preview foi criada com esse SHA. A integração foi corrigida para comandos próprios explícitos, preservando `ignore-scripts=true`; o lockfile permanece igual à base.

**Candidato rejeitado:** pausar apenas scheduler passou48/48 na fixture, mas teve três falhas WebKit na aplicação, dois pageerrors por caso;23/24 fluxos funcionais completaram (um timeout inicial do formulário). Não foi integrado. A antiga mitigação004 continua apenas na fixture, sem importação no produto.

## Testes e evidências

| Verificação | Resultado local |
| --- | --- |
| Reprodução nativa instrumentada |48 casos qualificados; WebKit seis links3/3FAIL, dois erros/caso preservados |
| Regressão do hash, sem patch |3/3FAIL, seis erros/caso; erro não convertido em sucesso de release |
| Patch instrumentado, fixture/aplicação |48/48 e24/24 sem pageerror; prova exploratória, seguida de versão sem instrumentação |
| Fixture final sem instrumentação |**63/63 PASS**, incluindo clique durante saída; artefato `final-safe-fixture`, zero pageerror/erro DOM; três repetições por condição |
| Aplicação completa local, duas rodadas |**48/48 PASS**, Chromium/WebKit, login/avatar/Guilda/EBD/reload/logout/negação; zero pageerror/erro DOM/erro console; segunda rodada também exige zero origem externa |
| Unitários existentes |**787 preservados**, sem editar/remover testes anteriores |
| Novos testes do transporte instalado |**11 PASS**; antes do patch3PASS/8FAIL. Hash tardio, trabalho tardio, retomadas, abort, prioridade de navegação, nova saída, propagação de falhas |
| Suíte integral |**798 PASS/74 SKIP**; não converter PG omitido em PASS |
| Gates |lint/types/build/protocolo25PASS; build mantém9PNGs/10composições e isolamento de áudio |
| Provas hospedadas004 |três arquivos/60checks preservados pelos hashes originais |
| Preview real, matriz de perfis |**6/6 fluxos,126checks PASS**, Chromium/WebKit × líder/professor/aluno; login/avatar/seleção/reload/Guilda/EBD/logout/negações; sem pageerror/erro DOM/erro RSC de console |
| Preview real, concorrência WebKit/líder |**3 repetições qualificadas,66checks PASS**; quatro pedidos RSC genuínos pendentes antes da substituição, mesma aba EBD→Arena403, sem pageerror/erro DOM/erro RSC de console |
| Auth/RLS reais TEST |**12checks PASS**; UID verificado, workspace próprio, viajante alheio invisível e ator de outra Guilda recusado403/42501; nenhuma política alterada |
| Assets da Preview |**12/12 hashes PASS**, nove PNGs e três corpos; dez composições preservadas |

As duas novas condições provisórias (hash/link tardio) são específicas de WebKit: Chromium suspende a avaliação do driver até commit. Seus controles normais de navegação, histórico, estado, SPA e diálogo cancelado são executados. O teste de link tardio monta um Link real durante saída; os testes unitários exercitam o transporte após o ponto de hidratação, não substituem hidratação React no navegador.

Primeira ampliação do harness: REWORK por contagem de um link adicional e locator bloqueado pela própria navegação retida. Corrigidos sem afrouxar estabilidade. Artefatos iniciais preservados. `final-fixture-v2` passou60casos, mas o candidato foi reprovado pelo contraste adicional de interação; não representa a homologação final. Histórico observado não usou BFCache (`persisted=false`); não alegar validação física/BFCache real.

Resultados seguros, hashes e timeline: [RPG-DEV-005-EVIDENCE.json](RPG-DEV-005-EVIDENCE.json). [Provas hospedadas/CI/dados](RPG-DEV-005-HOSTED-EVIDENCE.json). Logs/artefatos privados em `build/rpg-dev-005/`. CI Windows preserva48controles nativos e exige63casos estáveis com patch mais24fluxos da aplicação completa offline; verde diagnóstico e estabilidade continuam distintos.

## CI e Preview TEST — DONE

Runtime `d95cd4cf3516c56d6d6b8060bc5bf394f79dbba8`: CI [push40195978867](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40195978867) e [PR40195981694](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40195981694) completed/success, incluindo qualidade e Windows. O job de qualidade confirmou798PASS/74SKIP, protocolo25, lint/types/build. Job Windows121176779353 confirmou48controles qualificados,63contrastes corrigidos estáveis e24fluxos completos. O primeiro CI4d0ab58 e o candidato de retomada por interação permanecem REWORK no histórico, sem promoção.

Preview **READY**, deployment `dpl_AeogfSbkQRjcTzs4nPb5fmFGiLxE`, no projeto existente `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, root `apps/web`, commit exato acima:

https://rpgjovemcristao-pxf5m3jfd-carlos-junior-s-projects.vercel.app

Backend **TESTwkdvdzfkbwvhyjmamrsg**, verificado nas variáveis efetivas da branch sem imprimir valores e confirmado pelas requisições de todos os navegadores. API Vercel usa targetnull para esta Preview, nunca production. Logs do build confirmaram aplicação do patch nos dois formatos e gate das composições. Uma única nova Preview foi criada, depois dos dois CIs; não foram criados banco/branch/projeto/plano pagos.

As três provas concorrentes estritas retêm no harness pedidos que o Next iniciou de verdade; não criam fetch de replay, status ou payload. Essa instrumentação hospedada usa o routing necessário ao OIDC da Preview; a prova loopback nativa anterior, sem browser routing/fetch wrapper, permanece separada. Não confundir retenção pelo driver com quatro respostas do CDN já recebidas. Listeners de erro observam todas as abas; todos os erros de console são preservados, e qualquer mensagem RSC/access-control/Loadfailed/CORS reprova o gate. HTTP403 das negativas deliberadas continua403.

**Tentativa preservada, sem conversão para PASS:** `webkit-lider-strict-3` parou num timeout de clique após trocar avatar, antes de atingir a barreira concorrente; zero pageerror/erro DOM. A recuperação oficial retornou204 válido, mas o helper privado antigo exigia200 e relatou falha incorretamente. Corrigida somente essa expectativa para200/204 e conferidos os três originais por getUser/leitura de posse. Novo artefato `webkit-lider-strict-3-rerun` concluiu22checks e integra as três provas qualificadas; o arquivo FAIL anterior permanece. A matriz completa6/6 também passou. Não atribuir o timeout de clique a RSC nem alegar correção de uma causa de UI não comprovada. Captura em falha foi acrescentada ao ensaio para diagnóstico futuro.

## Preservação e release — produção intacta, gameplay BLOCKED

PROD: oito conjuntos de jogo **e20tabelas Guilda/EBD** com contagens/hashes iguais antes/depois dos ensaios. TEST: sete conjuntos econômicos iguais; hash `travelers` mudou durante as seleções normais de avatares. Todos os três avatares ativos originais foram verificados restaurados. Nenhum saldo/recibo, grant, papel, permissão, configuração Auth/CORS/RLS ou proteção Vercel foi editado para viabilizar os testes. Não alegar hash TEST integral igual nem ausência de escritas das seleções oficiais.

## QA, Security e release

SELF VALIDATE/QA/Security pelo autor, sem independência alegada. Revisados diff, patch fechado por versão/hash, retomada/abort, prioridades e ausência de filtros de erros. Código de Auth, CORS, RLS, banco, permissões, proteções Vercel, gameplay/economia e artes intacto. Zero migrations, novas dependências, recursos pagos ou merge.

Aplicação completa local usa o bundle real e simulador Auth/API offline existente. As provas hospedadas posteriores usam login/fluxos TEST reais e não são substituídas por esse simulador. O conector Vercel retornou403 por escopo; utilizada a CLI autenticada preexistente no mesmo projeto/time, sem ampliar acesso ou alterar proteções.

Produção Guilda/EBD **reconfirmada** em `808433a780e96a048c4a3f2d7e419351ab85e5a3`, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, READY/alias oficial https://rpgjovemcristao-web-inky.vercel.app. Sete sondas HTTP somente leitura: início/Auth/Guilda/EBD200, Arena/Torre/equipamentos403. Isso não é uma nova homologação produtiva autenticada. Nenhum merge/promoção/publicação produtiva foi feito. A Preview anterior47ef29f permanece preservada; o candidato novo é a Preview acima.

**BLOCKED prévios de gameplay:** proveniência16XP6moedas, catálogo/aquisição/recompensas, testes positivos hospedados e Safari físico. Nenhum saldo/recibo/certificação foi alterado. Seguido RELEASE_POLICY: CI do SHA exato → Preview TEST/READY → testes reais; produção interrompida nos bloqueios existentes. A limitação de prefetch após cancelar diálogo e a manutenção do patch são riscos residuais explícitos da solução conservadora, revisados pelo autor; não equivalem a Safari físico/BFCache homologado. Nenhum DEPLOY_COMPLETE produtivo nesta tarefa. Commits posteriores de relatório/ensaio não alteram o runtime d95cd4c e não justificam deploy artificial.
