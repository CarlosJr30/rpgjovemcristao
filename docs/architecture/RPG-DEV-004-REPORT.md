# RPG-DEV-004 — Preview TEST e causa da falha RSC WebKit/líder

Atualizado em 25/10/2026, após os ensaios iniciados em 24/10. **Estado geral: BLOCKED para estabilidade WebKit com substituição de documento e publicação de gameplay.** Mesma [PR #11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), branch `codex/rpg-dev-001`, em rascunho. Nenhuma alteração produtiva.

## Estado inicial e escopo preservado — DONE

### Continuação de 25/10 — teste determinístico e mitigação rejeitada no aceite

**DONE:** criada reprodução com Next16.4.2 de produção, somente loopback, sem Auth, banco, cookies, browser routing ou wrapper de fetch/Promise. As três provas hospedadas anteriores WebKit/líder continuam **3 execuções/60 checks PASS**, com os três hashes conferidos e inalterados. Os resultados novos ficam em diretório separado; não sobrescrevem essas provas.

O proxy local aguarda **quatro requisições RSC reais de prefetch `/_tree` pendentes**. Só então inicia a ação. Com seis links visíveis, os dois alvos restantes produzem as recusas durante a substituição. No WebKit, a resposta do novo documento fica retida até os quatro cancelamentos; no Chromium, ela precisa avançar para que o motor cancele as cargas antigas. A diferença de ordenação foi registrada na montagem do controle; não foi usado atraso arbitrário para decidir o início da navegação. Timeout invalida o caso. O proxy libera respostas do Next real, sem fabricar payload RSC ou status.

| Condição final, três repetições por navegador                                     | Resultado observado                                                                                                              |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| WebKit nativo: seis links, quatro prefetches pendentes, troca de documento        | **FAIL de estabilidade em 3/3**, dois `pageerror` por caso; quatro RSC cancelados                                                |
| Chromium nativo, mesma condição                                                   | 3/3 sem `pageerror`, cancelamentos após avanço do documento                                                                      |
| Quatro links, somente cancelamentos, ambos os navegadores                         | 6/6 sem `pageerror`                                                                                                              |
| SPA e alteração de estado sem troca de documento, ambos                           | 12/12 sem `pageerror`                                                                                                            |
| Protótipo isolado: troca de documento, SPA, estado, aviso de formulário cancelado | 24/24 sem `pageerror` na fixture; prefetch normal continua observado                                                             |
| Protótipo na aplicação completa, último ensaio local                              | **REWORK: 21/24 sem erro; três execuções WebKit com quatro erros cada**, apesar de todos os 24 fluxos completarem funcionalmente |

**Causa identificada:** interação da substituição do documento com trabalho de prefetch do Next ainda pendente, seguida de recusa de novas cargas pelo WebKit. A troca de documento é a condição discriminante dos controles; Auth e troca de sessão não são condições necessárias, pois a reprodução não contém autenticação. O controle de estado usa React local e não equivale a testar logout real. Não atribuir o problema a regras de Guilda, CORS ou RLS. O cancelamento sozinho é insuficiente, conforme o braço de quatro links. O ponto interno do framework que resolveria todos os caminhos da aplicação ainda não foi comprovado.

**Correção avaliada: REWORK, retirada do produto.** Um wrapper experimental cancelava tarefas de Link em `beforeunload`, preservava prefetch normal e retomava em `pageshow`/interação. Dois testes adicionais reproduziram falhas da própria mitigação: hidratação tardia que começava com o snapshot inicial e perda do estado de saída quando o último assinante desmontava. Ambos falharam antes dos ajustes e passaram depois. Mesmo assim, o último ensaio da aplicação manteve três falhas. Por isso, todas as importações no produto foram restauradas; o wrapper e seus dez testes permanecem **somente na fixture**. Não apresentar a passagem do contraste reduzido como correção do runtime. Retorno no histórico passou, mas todos os `pageshow.persisted` observados foram false: BFCache real não foi comprovado.

**Gates finais locais DONE:** 787 unitários PASS/74 SKIP (dez testes experimentais novos), 33 regressões afetadas PASS, lint, TypeScript, build da aplicação restaurada e 25 testes do protocolo PASS. O build mantém nove hashes/dez composições aprovadas. Nenhum teste PG/SQL ou gameplay foi repetido; contratos e motor não mudaram. As falhas intermediárias de montagem e dos candidatos ficam preservadas nos artefatos privados; não foram convertidas em PASS.

**CI DONE:** novo job Windows `Reprodução e contraste RSC isolados`, com versões fixadas pelo lockfile, sem secrets ou backend. Executa os 48 casos e exige a qualificação dos controles e dos contrastes. `passedDiagnostic` significa reprodução/controle válido; `releaseStable` é separado e continua false nos três controles nativos WebKit. O verde desse job não homologa a aplicação. A Preview automática existente agora depende também desse job, preservando o gate anterior de qualidade. Commit técnico `8616b383ed14ae0a9d0bddfa195c801e38189724`: [push 40191138643](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40191138643) e [PR 40191141483](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40191141483) completed/success, incluindo qualidade e o job Windows de reprodução, sem publicação automática desta branch.

**Preservação DONE:** diff final de `apps/`, `packages/` e lockfile em relação ao início `60d1abf` vazio. Só testes, configuração de teste/CI e documentação foram enviados. Nenhum CORS, Auth, RLS, proteção Vercel, arte, aquisição ou saldo alterado. Nenhuma migration, novo recurso externo, merge ou deployment nesta continuação. Produção reconfirmada remotamente no mesmo `808433a`/READY, com as sete sondas HTTP esperadas. Preview existente preservada em `47ef29f`/TEST; não contém nem depende do protótipo.

**BLOCKED:** aceite de navegação concorrente na aplicação completa. Próximo passo é instrumentar o trabalho RSC que continua após a saída, no scheduler/cache/hidratação do framework, e validar uma correção específica contra esta reprodução e a aplicação real. Não integrar a mitigação parcial nem filtrar o erro. Gameplay/economia continuam bloqueados pelos gates já registrados abaixo. A investigação desta continuação foi exclusivamente RSC; nenhuma nova tentativa de reconciliação econômica ou alteração de conta foi realizada.

Fontes reproduzíveis: `tests/hosted/next-rsc-concurrency-probe.mjs`, fixture `tests/fixtures/rsc-lifecycle-harness/`, dez testes em `tests/document-navigation-link.test.tsx`. [Recorte dos resultados e hashes](RPG-DEV-004-CONCURRENCY-EVIDENCE.json). Artefatos privados: `build/rpg-dev-004/concurrency/`. As seções seguintes preservam a entrega anterior; esta continuação atualiza os totais de testes e o resultado da investigação.

Conferidos política permanente, contexto/memória, workflow/regras/segurança, relatórios RPG-DEV-001–003, aprovações visuais e HEAD local/remoto `47ef29f15d3a1115168a0fde6d664be4495f9e1f`. Worktrees e alterações preexistentes preservados. Após a orientação adicional de 25/10, o trabalho ficou restrito à falha WebKit/líder e registro dos resultados já obtidos.

PROD: `wspafhlbtlpabypzymjo`. TEST compartilhado: `wkdvdzfkbwvhyjmamrsg`. Ambos ACTIVE_HEALTHY na verificação inicial. Não criar outro banco ou branch paga; nenhum provisionamento executado. Auth, RLS, URLs, quotas, senhas, contas e papéis não foram alterados. Nenhum item, carta, XP ou moeda concedido.

## Preview com as dez composições — DONE no deployment, BLOCKED na homologação integral

- URL: https://rpgjovemcristao-c2ii2gaxd-carlos-junior-s-projects.vercel.app
- Deployment: `dpl_3TxRX7PZiv7y2PC17HaUTZpQkiit`, **READY**, target Preview, SHA **`47ef29f15d3a1115168a0fde6d664be4495f9e1f`**.
- CI desse SHA aprovado antes do deploy: [push 40150120910](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40150120910) e [PR 40150124095](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40150124095).
- Projeto Vercel existente `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, root `apps/web`. Variáveis efetivas da branch Preview verificadas em processo filho, sem expor chaves: backend exclusivamente TEST. Requisições reais do navegador confirmaram esse mesmo host Supabase.
- **12/12 hashes hospedados correspondentes:** nove PNGs de equipamentos e três corpos. As seis composições anteriores e as quatro aprovadas no corpo `female_long_blue_dark` estão no artefato, incluindo couraça 3 e empunhadura. Nenhuma arte, geometria ou propriedade econômica foi alterada nesta tarefa.

As operações econômicas/equipamentos continuam negadas na Preview. Portanto, **não houve ensaio positivo hospedado de aquisição/equipar**. A comprovação de montagem, escala, sobreposição, atributos, inventário, equipar/desequipar/troca e reload permanece no ensaio local isolado: quatro testes PASS em Chromium desktop e WebKit móvel emulado, preservando os estilos aprovados. Isso não homologa variantes adquiridas ou Safari físico. Os testes/documentos posteriores ao SHA da Preview não alteram `apps/`, `packages/`, lockfile ou assets; não foi necessário outro deployment apenas para instrumentação.

## WebKit/líder — causa isolada e limite da correção

**DONE na investigação; BLOCKED na correção do comportamento do motor.** A falha coincide com a substituição completa do documento EBD enquanto o Next inicia ou cancela prefetch do painel de líder. Não apareceu evidência de mudança de sessão, rejeição Auth, resposta CORS/HTTP de erro ou falha de autorização nessa requisição. A sessão ainda estava autenticada; logout é uma etapa posterior. Não extrapolar essa conclusão para toda falha de rede ou toda execução Safari.

Ambiente observado: Next 16.4.2, Playwright 1.63.0, WebKit 26.6/revisão 2359 em Windows. A instrumentação registra fase/tempo relativo, navegação/commit, lifecycle, fetch, request/response/failure, `pageerror` e eventos DOM. Os headers são selecionados por lista permitida; Cookie, Authorization, OIDC e Set-Cookie não são gravados. A URL completa contém somente o parâmetro técnico `_rsc` quando necessário para correlação. As rejeições são repropagadas, sem filtros de erro.

**Captura real sem replay:**

```text
GET https://rpgjovemcristao-c2ii2gaxd-carlos-junior-s-projects.vercel.app/journey/guild/manage?_rsc=pF60Ppc4CPk77cAI
RSC: 1
Next-Router-Prefetch: 1
Next-Router-Segment-Prefetch: /_tree
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: cors
```

No ensaio `webkit-lider-diagnostic-2`, o GET começou aos 9106 ms na EBD. A navegação completa para Arena cancelou esse prefetch aos 9161 ms; a rejeição `TypeError: Load failed` foi observada aos 9163 ms. **Status HTTP e headers de resposta: inexistentes**, pois essa requisição foi cancelada antes de receber resposta. Não registrar 403 ou um status inventado para ela. A captura completa está resumida em [RPG-DEV-004-RSC-EVIDENCE.json](RPG-DEV-004-RSC-EVIDENCE.json).

**Contraste controlado hospedado, separado do fluxo normal:** a mesma URL e os headers permitidos de um prefetch observado foram repetidos antes e depois do início da navegação. Antes: **HTTP 200**, `Content-Type: text/x-component`, cache HIT e `Vary` com os headers RSC. Após segurar somente o início da navegação de substituição: fetch iniciado pelo documento antigo aos 10504 ms, `pageerror` aos 10505 ms e rejeição tratada aos 10514 ms. **Nenhum evento request/response para esse replay recusado**; portanto, status/headers de resposta continuam nulos. `pagehide` ocorreu depois, aos 10665 ms. O HTTP 403 nesse momento pertence à navegação Arena e comprova a proteção preservada. O replay é uma requisição diagnóstica deliberada; não apresentá-lo como falha espontânea do usuário nem como aprovação funcional.

**Controle mínimo sem framework:** seis ensaios em servidor GET loopback, sem Next, Auth, banco, cookies ou interceptação. Chromium três vezes sem `pageerror`; WebKit três vezes com recusa do fetch durante a fase provisória e um `pageerror` por execução, apesar do `try/catch` e ausência de evento DOM não tratado. O GET de controle retornou 200 e a substituição terminou nos seis casos. Nenhuma chamada recusada chegou ao endpoint local. Assim, o sintoma não depende do Supabase nem da proteção Vercel.

Essa distinção coincide com o relato primário [Playwright #42823](https://github.com/microsoft/playwright/issues/42823): cancelamentos podem anteceder `pagehide`, e uma mensagem de access control não comprova erro de CORS. Já o [Playwright #43120](https://github.com/microsoft/playwright/issues/43120) identifica a recusa de novas cargas com frame provisório e sua classificação no WebCore; o mantenedor atribui a correção dessa classificação ao upstream WebKit. Nossa prova confirma o mecanismo observável na revisão instalada; não afirma ter mapeado seu binário a um commit exato do WebCore, nem que qualquer atualização de dependência resolveria o caso.

### Correção mínima implementada — DONE no ensaio, não no produto

O ensaio original misturava navegação normal de Guilda/EBD e `page.goto` para páginas econômicas bloqueadas. Essas sondas substituíam o documento enquanto um prefetch automático do painel de líder começava, inclusive após captura de tela. `networkidle` anterior não prova que a fila de prefetch futura ficou vazia.

A opção **`isolatedNegativeChecks`** executa as sondas 403 e a verificação pós-logout em abas adicionais no mesmo contexto. A aba Guilda/EBD usa seus links normais. Todas as abas continuam com observadores de erros e os controles reais do servidor. O contraste de hard navigation permanece em outro artefato e continua reprovado. Nenhum prefetch foi desativado, nenhum erro foi ignorado, nenhuma configuração de CORS/Auth/RLS/Vercel foi alterada.

**Três repetições WebKit/líder: 60/60 checks PASS**, zero `pageerror`/erro DOM não tratado. A primeira incluiu o wrapper observador de fetch; as duas seguintes rodaram sem ele. Login, avatar, seleção de outro avatar possuído, reload, restauração do original, Guilda/EBD, logout e negativas reais concluídos. Isso comprova esse fluxo funcional e a correção do acoplamento do teste; **não comprova estabilidade durante substituição completa concorrente**. Não houve patch especulativo no produto ou dependência para esconder o diagnóstico do motor. A correção dessa condição continua BLOCKED, exigindo uma mudança específica de lifecycle/framework/motor comprovada contra o contraste preservado e contra fluxos normais.

## Resultados hospedados e regressões

| Gate                                                 | Estado e evidência                                                                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matriz inicial real, três contas em dois navegadores | 5/6 PASS; todos os passos funcionais concluídos. WebKit/líder FAIL pelo único `pageerror` RSC; preservado, não convertido em PASS                                     |
| Dois fluxos diagnósticos adicionais WebKit/líder     | 2/2 PASS; prefetch cancelado observado; isso não elimina intermitência                                                                                                |
| Replay hospedado durante substituição                | FAIL esperado na reprodução, release BLOCKED; um `pageerror`, zero erros DOM não tratados                                                                             |
| Fluxo WebKit/líder com sondas separadas              | DONE: 3/3, 60 checks PASS, erro monitorado em todas as abas                                                                                                           |
| UID/Auth/RLS/isolamento Guilda/EBD reais TEST        | DONE: 12 checks PASS, três contas. Leitura de avatar alheio vazia por RLS e workspace com ator de outra Guilda recusado HTTP 403/SQLSTATE 42501                       |
| Regressões de sincronização                          | DONE: 15 PASS em `online-sync.test.ts`, inclusive leitura antiga após login/troca e hidratação atrasada; também incluídas na suíte completa                           |
| Unitários completos                                  | DONE: 777 PASS/74 SKIP. Primeira execução teve timeout de um teste de áudio sob concorrência; nova suíte completa com dois workers passou sem aumentar timeout        |
| Equipamentos navegador                               | DONE local: quatro PASS desktop/WebKit móvel emulado; não ensaio econômico hospedado                                                                                  |
| Lint/TypeScript/build/protocolo                      | DONE: comandos completos exit 0; 25 testes do protocolo PASS. Lint específico da instrumentação posterior PASS                                                        |
| PostgreSQL afetados                                  | Nenhuma mudança em SQL/motor/contratos. Evidências dos 74 PG executados em RPG-DEV-001 preservadas e reutilizadas; não reexecutados nem convertidos de SKIP para PASS |
| Arena/Torre determinísticos                          | Evidências anteriores preservadas; não repetidas sem mudança relevante. Hospedagem positiva e homologação econômica continuam BLOCKED                                 |
| Celular físico/Safari real                           | BLOCKED: dispositivo/sessão física não disponível; emulação não é PASS físico                                                                                         |

Na primeira coleta Chromium houve erro do próprio ensaio: o seletor EBD existe, mas fica oculto no desktop. A expectativa de visibilidade foi corrigida para presença no DOM; a resposta real do workspace e a captura continuam exigidas. O FAIL inicial foi mantido em artefato distinto. Não houve correção funcional da EBD neste ponto.

## Economia e dados — preservação DONE, reconciliação BLOCKED

A consulta somente leitura reconfirmou o avatar produtivo `31b70059-deca-44c8-a6df-f21ea68b6e42`: XP 245016, moedas 1006265, esperado por recibos 1006259; diferença de 16 XP/6 moedas. Os cinco checkpoints de compra coincidem e `economic_verified_at` continua NULL. Último recibo: 15/10/2026 19:52:08.117475Z. Zero eventos de batalha/claims Guilda/recompensas ou operações Journey/pendências EBD comprovam o delta.

Os logs e backups preservados já examinados nos relatórios002/003 não fornecem payload contemporâneo que ligue jogador, evento e valores. O backup anterior ao provisionamento e a coincidência numérica com recompensas antigas não são prova. Não houve evidência nova suficiente, ajuste de saldo, recibo retroativo ou certificação. Após a priorização adicional, a investigação econômica não foi ampliada; mantém **BLOCKED** por proveniência ausente.

Oito conjuntos de jogo em **PROD com quantidade/hash exatamente iguais antes/depois**: travelers, wallets, inventory, equipped_items, traveler_stats, traveler_chests, chest_operations e battles. Em TEST, sete conjuntos econômicos permaneceram exatamente iguais; o hash integral de travelers mudou durante a seleção normal dos avatares TEST, que atualiza timestamps. Os três avatares originais ativos foram restaurados e verificados pelo mecanismo oficial, sem recuperação administrativa/SQL. **Não alegar hash integral TEST inalterado.** Nenhuma conta real produtiva usada para os testes.

## GitHub, arquivos, CI e infraestrutura

**DONE no envio à mesma PR:**

- `7613eaaa404039d4a9a0ed9204bc3df04c0af89f`: reprodução mínima, harness hospedado e configuração local004. CI [push 40151827015](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40151827015) e [PR 40151830235](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40151830235) completed/success.
- `1758241fe8eb4e42f36710f6bd771b5dde1c206c`: timeline segura, contraste provisório e separação das sondas negativas. CI [push 40188156711](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40188156711) e [PR 40188159220](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40188159220) completed/success, SHA exato; inclui novamente os gates completos do workflow.
- Preview contém o runtime/arte `47ef29f`; os commits004 modificam somente testes, configuração de teste, governança e relatório. Comparação de `apps/`, `packages/`, lockfile e assets com `47ef29f`: sem diferenças.

Arquivos004: `tests/hosted/webkit-provisional-fetch-probe.mjs`, `tests/hosted/release-preview-validation.mjs`, `tests/hosted/README.md`, `playwright.rpg-dev-004.config.ts`, contrato ativo004, este relatório, `RPG-DEV-004-RSC-EVIDENCE.json` e memória. Não foram modificadas artes aprovadas nem implementações de Auth/economia/Guilda/EBD.

**Migrations: nenhuma.** Nenhum banco, branch Supabase, projeto ou recurso pago criado. Foi criado somente um deployment Preview autorizado no projeto Vercel existente; sem promoção, merge ou mudança de aliases produtivos. Não alegar custo zero de execução da infraestrutura; não foi contratado recurso adicional.

QA e Security feitos pelo autor, sem independência alegada. Revisados isolamento TEST/PROD, origem do OIDC, lista de headers, ausência de secrets versionados, instrumentação fora do produto, preservação de controles e dados, status separados de PASS/FAIL/SKIP/BLOCKED. O teste de concorrência permanece visível e bloqueante. Nenhum gate foi dispensado para publicar.

## Produção e próximos bloqueios

**DONE na preservação:** https://rpgjovemcristao-web-inky.vercel.app continua no SHA **`808433a780e96a048c4a3f2d7e419351ab85e5a3`**, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, target production/READY e alias conferidos remotamente. Sete sondas somente leitura: início/Auth/Guilda/EBD HTTP 200; Arena/Torre/equipamentos HTTP 403. Isso é smoke HTTP, não nova homologação produtiva autenticada. Guilda/EBD mantidas.

**BLOCKED:** estabilidade WebKit em hard navigation concorrente; proveniência16XP6moedas; catálogo/aquisição/recompensas; variantes legítimas e fluxos positivos hospedados de gameplay; ambiente separado suspenso por proibição de novos custos; Safari físico indisponível. As dez composições já estão aprovadas no escopo dos recibos e não exigem nova decisão de arte para o mesmo corpo.

Próxima atividade técnica: validar uma correção upstream específica de lifecycle/classificação ou uma correção estreita do framework, quando identificada, contra a prova provisória e as três regressões normais, sem remover as verificações de erro. Não há atualização/patch comprovado para aplicar automaticamente agora. A produção e a PR em rascunho permanecem preservadas; **não declarar DEPLOY_COMPLETE de gameplay**.

Evidências privadas: `build/rpg-dev-004/` contém Preview/configuração verificada, hashes de assets/dados, matriz inicial, timelines/replays, três regressões WebKit/líder, restauração de seleção, RLS, reconciliação, logs dos gates e verificações CI/produção. O JSON versionado contém recorte seguro da requisição e hashes dos artefatos, sem sessões ou credenciais.
