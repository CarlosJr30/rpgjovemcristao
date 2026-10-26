# RPG-DEV-001 — Preparação isolada de equipamentos, Arena e Torre

Data: 24/10/2026. **BLOCKED para liberação dos módulos de gameplay.** Guilda/EBD permanecem publicadas em `808433a`. Este trabalho não remove as restrições do lançamento parcial.

## Estado confirmado e preservação — DONE

- `origin/main`: `808433a780e96a048c4a3f2d7e419351ab85e5a3`; CI [40127254263](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40127254263) success.
- Produção: <https://rpgjovemcristao-web-inky.vercel.app>, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, READY, SHA acima. Alias oficial reconferido via API autenticada.
- PROD `wspafhlbtlpabypzymjo`; TEST `wkdvdzfkbwvhyjmamrsg`, ambos ACTIVE_HEALTHY. Histórico remoto: PROD seis migrations, TEST 24; nenhuma reaplicada.
- Nova worktree `C:/Users/carlo/rpg-worktrees/rpg-dev-001`, branch `codex/rpg-dev-001`, baseada em `561d613` (encerramento documental do lançamento, descendente de `808433a`). Worktrees e alterações anteriores preservadas.
- Lidos política de release, relatório final RELEASE-EBD-001 e relatório FIX-PROD-008. Correções visuais e testes determinísticos anteriores não foram refeitos como implementação.

## Problemas e correções — DONE no candidato isolado

Respostas assíncronas usavam somente o UID como controle de validade. Uma leitura antiga podia substituir uma leitura mais recente do equipamento; hidratação atrasada, inclusive com erro, podia trocar ou limpar o avatar ativo após mudança de conta. Seleção atrasada também podia marcar o avatar da sessão anterior como ativo no cliente. Quatro falhas foram reproduzidas antes da correção, com log preservado.

`online-sync.ts` agora distingue sessões consecutivas, descarta hidratações/seleções substituídas e ordena leituras por Viajante. `online-equipment.ts` verifica a revisão da sessão depois do RPC, inclusive quando a mesma conta saiu e entrou novamente. Não há compensação de saldo nem tentativa de desfazer um RPC já confirmado no servidor.

Regressões cobrem troca de conta, logout/login do mesmo UID, respostas fora de ordem, hidratação atrasada com sucesso/erro, seleção e concorrência com leitura de equipamento. São testes isolados de comportamento; não se apresentam como testes hospedados de Auth/RLS.

## Equipamentos e avatar

| Item | Estado | Evidência/limite |
| --- | --- | --- |
| Couraça 3 e empunhadura | DONE na preservação e ensaio | PNGs, manifestos e compositor não foram alterados. Gate: cinco PNGs/seis composições aprovadas, zero pendentes publicados. Na Preview, hashes dos cinco overlays e três corpos conferem com o registro aprovado (oito verificações PASS). |
| Equipar/desequipar, atributos, persistência | DONE no ensaio local | Comandos reais de estado e compositor real no Chromium 1440 e WebKit 390; reload preserva estado e inventário. |
| Troca positiva no mesmo slot | DONE somente em fixture | Segunda espada explicitamente sintética, sem arte homologada ou aquisição real. Confere substituição do bônus sem acumular nem consumir itens. |
| Troca hospedada entre itens homologados | BLOCKED | Falta segunda variante homologada/adquirida e ambiente de gameplay hospedado com acesso autorizado. |
| Elmo/escudo/botas/medalhão no corpo alvo | REWORK | Continuam sem overlay homologado para esse corpo. Não reutilizadas calibrações arquivadas como aprovação. |
| Celular físico | BLOCKED | Indisponível; WebKit móvel é emulação, não teste físico. |

Fixture nova em `tests/fixtures/equipment-recovery-harness/`, servida exclusivamente em loopback por Vite. Não é rota Next, não muda o catálogo e não integra a aplicação publicada. O navegador bloqueia requisições externas durante o ensaio. O estado sintético não pertence a jogadores.

## Arena, Torre e economia

| Item | Estado | Resultado |
| --- | --- | --- |
| Arena: regras e controles existentes | DONE na preservação | Suíte unitária atual inclui motor, baralho, autoridade e recibos; nenhum grant novo. |
| Catálogo oficial/aquisição hospedada | BLOCKED | PROD tem zero entradas no catálogo; TEST tem sete entradas de teste. Catálogo de teste não homologa produção. |
| Torre determinística 1–7/campeão | DONE isoladamente | Evidência anterior preservada e, após a solicitação de investigar as omissões, reexecutados dez determinísticos e 36 checks de autoridade/settlement, todos PASS, sem mudança no motor/SQL. Duas réplicas completam os sete andares e o campeão, com progressão/recibos idênticos e 430 XP/215 moedas/um épico por réplica sintética. Não é prova hospedada nem homologação econômica. |
| Vitórias hospedadas 2–7 e campeão | BLOCKED | Pendência anterior permanece. TEST agora está isolado por RELEASE-EBD-001; não foram reabertas permissões para fabricar execução positiva. |
| Contrato de recompensa | BLOCKED para créditos reais | Proposta 430 XP/215 moedas/um baú épico, somente primeira vitória. TEST mantém `enabled=false`, sem homologação e com zero claims. Contrato não antecipado em PROD. |
| Reconciliação 16 XP/6 moedas | BLOCKED | Nova leitura: 33 operações com recibos, zero batalhas do alvo, delta continua 16/6 e `economic_verified_at=NULL`. Não apareceu evento canônico que comprove a origem. |

A investigação anterior de checkpoints e logs permanece válida: compatibilidade aritmética com dois treinos não comprova ocorrência. Nenhuma correção manual, certificação retroativa, abertura de baú, aquisição de carta ou vitória forçada foi executada.

PROD mantém 24 Viajantes, 245376 XP, 1006767 moedas e 37 entradas de inventário. Zero tabelas públicas sem RLS. TEST e PROD retornam `release_scope=guild-ebd-001`, sem EXECUTE de autoridade/equipamentos para authenticated. Em PROD o RPC novo de equipamento e a política de Torre ainda nem estão instalados; não são falhas do escopo Guilda/EBD e não foram antecipados.

## Testes e falhas preservadas

| Gate | Estado | Resultado |
| --- | --- | --- |
| Regressões de sincronização/equipamento | DONE | 24 PASS em execução dedicada. |
| Unitários integrais | DONE | Execução final: 764 PASS/74 SKIP, 116 arquivos aprovados/sete omitidos. SKIP não é PASS. |
| PostgreSQL descartável | DONE | Todos os 74 casos omitidos no comando unitário foram executados separadamente e passaram: primeira rodada 17; adicional 57 mais um check estático já existente. Rede desativada; nenhum banco hospedado foi modificado. |
| Equipamento em navegador | DONE | Dois testes PASS, Chromium desktop e WebKit móvel. Capturas inspecionadas; couraça e empunhadura preservadas. |
| Fronteira de release em navegador | DONE | Quatro PASS desktop/móvel: rotas e API excluídas negadas, recuperação pública acessível. Não repete envio de e-mail. |
| Lint/TypeScript/build | DONE local | Lint e TypeScript completos finais com exit 0; build aprovado, incluindo gate de assets e isolamento de áudio. |
| Protocolo de publicação | DONE | 25 PASS. |
| QA/Security | DONE na revisão; aceite geral BLOCKED | Revisão pelo autor, sem independência alegada. Fronteiras, ACLs, assets, diff e ausência de secrets revisados; WebKit e homologações pendentes não foram aprovados. |

Rodada PG inicial: nove timeouts no limite padrão de cinco segundos do runner ao atravessar WSL, oito PASS. Reexecução integral com `--testTimeout=60000`, mesmas asserções, resultou em 17 PASS. Sem alteração de SQL ou controles para passar.

A fixture visual inicial foi rejeitada pelo próprio parser porque o timestamp não usava milissegundos ISO; corrigido somente o timestamp sintético. Typecheck da nova fixture exigiu JSX e tipos Vite/CSS no projeto de testes. Falhas e logs iniciais preservados; não foram classificados como aprovados.

## Arquivos alterados

- `apps/web/lib/supabase/online-sync.ts` e testes; `online-equipment.ts` e testes.
- `tests/fixtures/equipment-recovery-harness/`, `tests/e2e/equipment-recovery.spec.ts`, `playwright.rpg-dev-001.config.ts`.
- `playwright.config.ts` separa o ensaio loopback; `tsconfig.json` inclui os novos testes e tipos JSX.
- Contrato RPG-DEV-001, este relatório e memória.

## GitHub, Preview e produção

[PR #11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), única PR desta tarefa, mantida em rascunho. Candidato runtime [`2d0132e5fd57f65a670dd551d2e811ccbc79911f`](https://github.com/CarlosJr30/rpgjovemcristao/commit/2d0132e5fd57f65a670dd551d2e811ccbc79911f).

**DONE:** CI do SHA exato, tanto [push 40130559262](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40130559262) quanto [PR 40130578445](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40130578445), completed/success. Nenhuma correção adicional do código foi necessária para o CI.

**DONE:** [Preview READY](https://rpgjovemcristao-nu38qe2u0-carlos-junior-s-projects.vercel.app), `dpl_6nLjgXqu6GrzJeoAfGnU5sntcn6U`, SHA `2d0132e`. Configuração somente da branch `codex/rpg-dev-001`; backend TEST `wkdvdzfkbwvhyjmamrsg`, chave pública publishable, sem service_role no cliente. Hosts das requisições reais confirmaram TEST e ausência de PROD.

**DONE:** 48 checks reais na Preview, com Chromium desktop e Chromium móvel 390, três contas autorizadas já existentes: login/getUser, mesmo avatar ativo após reload, leitura de Guilda/EBD, permissões existentes, logout, isolamento das rotas de gameplay e API. Nenhum novo avatar, item, carta, convite ou recompensa foi criado. O rótulo da conta de teste não foi usado como autorização: o workspace do líder já permite ensino; os avatares ativos das contas chamadas professor/aluno preservaram `teacher=false`. Não houve promoção de papel para preencher um teste.

**BLOCKED:** em WebKit houve uma execução móvel com 16 checks PASS, mas execuções completas posteriores registraram mensagens intermitentes de prefetch RSC/CORS na Preview protegida. Essa execução isolada não homologa Safari. O harness também precisou aguardar as navegações efetivas de login/logout, em vez de apenas um botão/título intermediário. Logs iniciais preservados; nenhuma configuração de CORS, Auth ou proteção Vercel foi relaxada. O gate WebKit permanece BLOCKED enquanto a falha não estiver explicada e reproduzivelmente resolvida.

**BLOCKED para fluxos positivos hospedados:** equipamentos, Arena e Torre retornam 403 na Preview porque ela mantém a fronteira `guild-ebd-001`, também presente nas ACLs TEST. A negação foi comprovada, mas não é validação positiva de equipar, jogar ou vencer. Não foi habilitada uma flag/rota alternativa para contornar catálogo, aquisição ou economia pendentes. Vitórias, progressão, campeão e recompensas hospedadas continuam sem nova prova positiva.

Oito conjuntos de jogo (travelers, wallets, inventory, equipped_items, traveler_stats, traveler_chests, chest_operations e battles) foram comparados por quantidade/hash antes e depois dos testes hospedados: **todos iguais em TEST e em PROD**. Logs e sessões normais de Auth não estão incluídos nessa afirmação de imutabilidade dos dados de jogo.

Nenhum merge ou deployment produtivo desta tarefa. Evidências privadas em `build/rpg-dev-001/`, ignoradas pelo Git. Não publicar logs de sessão ou credenciais. O commit documental de encerramento não exige outro deployment da mesma aplicação.

## Investigação das 74 omissões

As 74 omissões do comando unitário foram inventariadas por nome/arquivo em `skipped-inventory.json`. São oito grupos PostgreSQL sob opt-in `RPG_LOCAL_PG=1`, não falhas silenciosamente convertidas em PASS. Sete arquivos ficam totalmente omitidos; `deploy002.test.ts` executa seus checks estáticos e omite quatro checks de banco. Os dois grupos de recuperação também dependem de snapshots privados de TEST, que não são publicados no GitHub.

| Arquivo/grupo | Casos omitidos no comando unitário | Situação nesta tarefa |
| --- | ---: | --- |
| release-ebd.postgres.test.ts | 8 | DONE: executados separadamente, PASS |
| equipment.postgres.integration.test.ts | 9 | DONE: executados separadamente, PASS |
| authority/postgres.integration.test.ts | 28 | DONE: PASS, rodada adicional isolada |
| authority/tower-deterministic.postgres.test.ts | 10 | DONE: PASS, duas réplicas/sequência completa |
| authority/tower-settlement.postgres.test.ts | 8 | DONE: PASS, transações/idempotência/falhas |
| database/tests/deploy002.test.ts | 4 | DONE: PASS; mais um check estático reexecutado |
| fixprod003/recovery.postgres.test.ts | 6 | DONE: PASS, snapshot TEST existente em clone sem rede |
| fixprod005/recovery.postgres.test.ts | 1 | DONE: PASS, snapshot estrutural TEST existente |

Inventário individual cruzado com o resultado adicional: os 57 nomes antes omitidos correspondem a 57 PASS; os 17 restantes já passaram na rodada dedicada desta tarefa. Evidência `omissions-resolution.json`: zero omissões sem investigação. Essa execução adicional não altera os 764 PASS/74 SKIP do comando unitário e não transforma uma prova PostgreSQL isolada em validação hospedada real.

**Migrations aplicadas: nenhuma.** Auth, URLs, redirects e limites de e-mail não foram alterados. Não foram promovidos jogadores nem modificados papéis de Guilda/EBD.

## Estado final da produção e aceite

**DONE na preservação:** reconferidos `origin/main=808433a`, alias oficial no mesmo deployment READY e sete respostas HTTP esperadas: raiz/Auth/Guilda/EBD 200; Arena/Torre/equipamentos 403. Essa checagem HTTP não substitui teste autenticado; os 89 checks produtivos aprovados no lançamento continuam referenciados em RELEASE-EBD-001, mesmo runtime. Nenhum novo teste de escrita produtiva foi executado.

**BLOCKED para merge/publicação de gameplay:** faltam proveniência de 16 XP/6 moedas, catálogo/aquisição e política econômica homologados, variantes e overlays pendentes, fluxos positivos hospedados e resolução reproduzível do erro WebKit. Nenhuma carta, crédito ou prêmio real foi liberado. Não há DEPLOY_COMPLETE desta tarefa; a Preview não foi promovida.

Próxima tarefa recomendada: localizar evento/recibo canônico ou backup contemporâneo que comprove o delta, homologar catálogo/política e preparar ambiente hospedado de gameplay separado do TEST da Preview Guilda/EBD. Depois validar aquisição/troca legítimas e vitórias 2–7/campeão sem progressão manual; investigar o erro WebKit/RSC sem relaxar CORS/proteção. Manter produção intacta enquanto esses gates estiverem pendentes.
