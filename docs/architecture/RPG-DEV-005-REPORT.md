# RPG-DEV-005 — causa e correção da concorrência WebKit/RSC

25/10/2026. Continuação da [PR #11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), branch `codex/rpg-dev-001`, base `35fa16d992898035d52fb266223b876a6e88c445`. **Correção local validada; CI e homologação hospedada pendentes nesta versão do relatório. Gameplay/produção BLOCKED.**

## Causa comprovada

Lidos o relatório004, recortes RSC/concorrência e fontes locais do Next16.4.2. A reprodução original foi preservada: quatro prefetches reais `/_tree` pendentes, seis links visíveis, navegação completa. O controle instrumentado mantém WebKit **3/3 falhas, dois pageerrors por caso**, sem Auth/banco/cookies/browser routing/fetch wrapper. Chromium e controles sem troca de documento permanecem sem erros.

Há duas etapas da mesma corrida:

1. `beforeunload` inicia a saída. WebKit cancela as quatro cargas antigas. O cache rejeita suas entradas, acorda tarefas bloqueadas e o scheduler decrementa `inProgressRequests`, agenda microtasks e inicia os dois alvos restantes. Ele não acompanha a saída do documento. O motor recusa essas novas cargas antes de `pagehide`, sem resposta HTTP.
2. Uma tarefa já pode ter saído da fila e estar aguardando `setCacheBustingSearchParam`/`crypto.subtle.digest`. Mesmo pausando o scheduler, essa continuação chega ao fetch depois de `beforeunload`. Na aplicação: saída aos699ms; envios Guilda/EBD aos700/701ms; `pagehide` aos708ms, com dois pageerrors. A fixture reduzida não exercitava esse intervalo de forma suficiente.

O novo contraste prende a conclusão de quatro hashes SHA-256 reais antes da navegação, libera suas continuações no documento provisório WebKit e não altera fetch/payload/status. **Sem patch: 3/3 falhas, seis pageerrors por caso** (as quatro continuações e mais trabalho liberado). Isso liga a segunda causa a uma reprodução determinística própria.

Hidratação/remount podem registrar trabalho novo nesse intervalo. Um estado ligado ao ciclo React de cada Link não cobre todo o trabalho interno. Não foi comprovada corrupção de payload, leitura de outra sessão ou defeito do servidor. Cache rejeitado e cancelamento são consequências/intermediários; o erro visível decorre de iniciar novas cargas no documento em saída. A classificação access-control do motor não comprova CORS incorreto. Os relatos primários [Playwright43120](https://github.com/microsoft/playwright/issues/43120) e [42823](https://github.com/microsoft/playwright/issues/42823) sustentam essa distinção; não substituem nossas provas nem comprovam Safari físico.

## Correção mínima

Patch restrito ao transporte interno `next/dist/{client,esm/client}/components/segment-cache/fetch.js` do **Next16.4.2**. No ponto imediatamente anterior ao fetch nativo, adia novas requisições internas de prioridade `low` enquanto o documento está em saída. Cobre tanto a fila reativada por cancelamentos quanto as continuações assíncronas já fora dela.

Não substitui `window.fetch`, não altera headers RSC/CORS/Auth, não captura nem filtra erros do produto, não desativa prefetch normalmente, não cancela cargas já em curso e não bloqueia navegações de prioridade `auto`. As promessas adiadas continuam pendentes e não são escritas no cache como falhas artificiais. `pageshow`, `pointerdown` e `keydown` retomam o trabalho, incluindo navegação cancelada pelo usuário. AbortSignal continua encerrando trabalho adiado e removendo seu listener/fila. Estado pertence ao módulo do documento, independente de montagem React.

Aplicação reproduzível em `scripts/next-rsc-departure-patch.mjs`, helper em `scripts/patches/next-rsc-departure.txt`. `postinstall` aplica os dois formatos, verifica versão e hashes exatos antes de escrever; fontes desconhecidas falham. `--check` protege o build; `--restore` serve apenas ao controle diagnóstico. Nenhuma dependência ou versão foi adicionada/atualizada. A manutenção do patch exige revisão explícita ao atualizar Next.

**Candidato rejeitado:** pausar apenas scheduler passou48/48 na fixture, mas teve três falhas WebKit na aplicação, dois pageerrors por caso;23/24 fluxos funcionais completaram (um timeout inicial do formulário). Não foi integrado. A antiga mitigação004 continua apenas na fixture, sem importação no produto.

## Testes e evidências

| Verificação | Resultado local |
| --- | --- |
| Reprodução nativa instrumentada |48 casos qualificados; WebKit seis links3/3FAIL, dois erros/caso preservados |
| Regressão do hash, sem patch |3/3FAIL, seis erros/caso; erro não convertido em sucesso de release |
| Patch instrumentado, fixture/aplicação |48/48 e24/24 sem pageerror; prova exploratória, seguida de versão sem instrumentação |
| Fixture final sem instrumentação |**60/60 PASS**, três repetições por condição; zero pageerror/erro DOM; prefetch real antes da saída e depois do retorno/cancelamento |
| Aplicação completa local, duas rodadas |**48/48 PASS**, Chromium/WebKit, login/avatar/Guilda/EBD/reload/logout/negação; zero pageerror/erro DOM/erro console; segunda rodada também exige zero origem externa |
| Unitários existentes |**787 preservados**, sem editar/remover testes anteriores |
| Novos testes do transporte instalado |**11 PASS**; antes do patch3PASS/8FAIL. Hash tardio, trabalho tardio, retomadas, abort, prioridade de navegação, nova saída, propagação de falhas |
| Suíte integral |**798 PASS/74 SKIP**; não converter PG omitido em PASS |
| Gates |lint/types/build/protocolo25PASS; build mantém9PNGs/10composições e isolamento de áudio |
| Provas hospedadas004 |três arquivos/60checks preservados pelos hashes originais |

As duas novas condições provisórias (hash/link tardio) são específicas de WebKit: Chromium suspende a avaliação do driver até commit. Seus controles normais de navegação, histórico, estado, SPA e diálogo cancelado são executados. O teste de link tardio monta um Link real durante saída; os testes unitários exercitam o transporte após o ponto de hidratação, não substituem hidratação React no navegador.

Primeira ampliação do harness: REWORK por contagem de um link adicional e locator bloqueado pela própria navegação retida. Corrigidos sem afrouxar estabilidade. Artefato inicial preservado; somente `final-fixture-v2` qualifica a matriz final. Histórico observado não usou BFCache (`persisted=false`); não alegar validação física/BFCache real.

Resultados seguros, hashes e timeline: [RPG-DEV-005-EVIDENCE.json](RPG-DEV-005-EVIDENCE.json). Logs/artefatos privados em `build/rpg-dev-005/`. CI Windows agora preserva o controle nativo sem patch e exige estabilidade com patch na fixture e aplicação completa offline; verde diagnóstico e estabilidade continuam distintos.

## QA, Security e release

SELF VALIDATE/QA/Security pelo autor, sem independência alegada. Revisados diff, patch fechado por versão/hash, retomada/abort, prioridades e ausência de filtros de erros. Código de Auth, CORS, RLS, banco, permissões, proteções Vercel, gameplay/economia e artes intacto. Zero migrations, novas dependências, recursos pagos ou merge.

Aplicação completa local usa o bundle real e simulador Auth/API offline existente, sem backend hospedado. Isso comprova o runtime completo local e não substitui login/fluxos reais TEST. Homologação hospedada e CI exato ainda pendentes neste checkpoint. O conector Vercel retornou403 por escopo; a próxima operação usará a CLI autenticada preexistente, no mesmo projeto/time, sem ampliar acesso ou alterar proteções.

Produção Guilda/EBD deve continuar em `808433a780e96a048c4a3f2d7e419351ab85e5a3`, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, https://rpgjovemcristao-web-inky.vercel.app. Preview anterior47ef29f preservada até CI do candidato; nenhuma publicação produtiva autorizada enquanto persistirem bloqueios críticos.

**BLOCKED prévios de gameplay:** proveniência16XP6moedas, catálogo/aquisição/recompensas, testes positivos hospedados e Safari físico. Nenhum saldo/recibo/certificação foi alterado. Seguir RELEASE_POLICY: CI do SHA exato → Preview TEST/READY → testes reais; não fazer merge/promoção de gameplay. Nenhum DEPLOY_COMPLETE produtivo nesta tarefa.
