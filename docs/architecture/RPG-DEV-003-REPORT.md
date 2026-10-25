# RPG-DEV-003 — Diagnóstico local WebKit e quatro composições aprovadas

Data: 24/10/2026. **Estado geral: BLOCKED para publicação de gameplay.** Mesma [PR #11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), branch `codex/rpg-dev-001`, mantida em rascunho. Nenhum merge, migration, provisionamento ou deployment desta tarefa.

## Estado inicial e preservação

**DONE:** política permanente, contexto/memória, regras, segurança, workflow e relatório RPG-DEV-002 conferidos. Head inicial local/remoto `e5471820e6d3376c0b41762494eda8517f0a23ee`; commit técnico anterior `cf056ea` com CI aprovado. Worktrees e alterações anteriores preservados. Produção Guilda/EBD continua no SHA `808433a780e96a048c4a3f2d7e419351ab85e5a3`, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, READY.

**DONE:** oito conjuntos de jogo em cada ambiente (travelers, wallets, inventory, equipped_items, traveler_stats, traveler_chests, chest_operations e battles), comparados por quantidade/hash com RPG-DEV-002: **todos iguais em TEST e PROD**. Nenhum acesso de jogador alterado; nenhuma concessão de itens, cartas, liderança, moedas ou XP. Auth/RLS/economia, URLs e limites dos ambientes existentes preservados.

## WebKit/RSC — evidência nova e limites

**DONE no diagnóstico local controlado; BLOCKED na solução definitiva e homologação hospedada.** O mesmo erro de página `Fetch API cannot load ... due to access control checks` foi reproduzido em Next de produção **local**, sem Vercel, SSO, token de Preview ou dados reais. Respostas RSC concluídas observadas: HTTP 200 e `text/x-component`, sem rejeição HTTP CORS. Falhas de requisição incluem RSC cancelados durante troca completa de documento.

Cada fluxo autenticado sintético verifica login, avatar, Guilda, EBD, reload, logout e negação da EBD após logout. Três repetições por célula e por navegador. O backend da primeira matriz é uma fixture interceptada, com tráfego externo abortado. A segunda usa um servidor HTTP sintético em `127.0.0.1:3202`; na célula sem interceptação nenhuma rota Playwright é instalada. Ambos usam o mesmo Next em loopback, sem abrir gameplay.

| Controle | Chromium | WebKit |
| --- | --- | --- |
| Auth interceptada, links | 3/3 sem erros | 3/3 sem erros |
| Auth interceptada, goto sem espera adicional | 3/3 sem erros | 0/3 sem erros, 11 mensagens RSC |
| Auth interceptada, goto + route.continue local | 3/3 sem erros | 0/3 sem erros, 16 mensagens RSC |
| Auth interceptada, goto + prefetch atrasado 750 ms | 3/3 sem erros | 0/3 sem erros, 14 mensagens RSC |
| Auth HTTP local, links, sem interceptação do navegador | 3/3 sem erros | 3/3 sem erros |
| Auth HTTP local, goto, sem interceptação do navegador | 3/3 sem erros | 0/3 sem erros, 18 mensagens RSC |
| Auth HTTP local, goto + route.continue local | 3/3 sem erros | 0/3 sem erros, 12 mensagens RSC |
| Auth HTTP local, goto + prefetch atrasado 750 ms | 3/3 sem erros | 0/3 sem erros, 15 mensagens RSC |
| Auth HTTP local, goto/reload/logout após estabilizar rede | 3/3 sem erros | 3/3 sem erros |

Os **48 fluxos das duas matrizes completas terminaram funcionalmente**, mas 18 execuções WebKit apresentaram erros de página: **não são PASS de estabilidade**. O controle final acrescenta seis fluxos/42 checks funcionais sem erros ou RSC cancelados. Os scripts distinguem `functionalPassed` e `errorFree`; exit 0 da coleta não significa aprovação do gate WebKit.

Controle público adicional: **12 fluxos sem sessão e sem interceptação**, usando um proxy somente GET em `127.0.0.1:3201`, rotas públicas e atraso de 1,5 s nas respostas RSC. Três repetições por condição/navegador. Zero erros e zero requisições externas observadas; com atraso, o servidor registrou três RSC cancelados por fluxo (nove por navegador). Portanto, **cancelamento sozinho não basta para reproduzir o erro**.

Conclusões sustentadas: Vercel/SSO e interceptação do navegador não são condições necessárias; a reprodução ocorreu no fluxo autenticado com navegação completa durante requisições pendentes e desapareceu no controle com rede estabilizada. O mecanismo interno WebKit/Next ainda não foi isolado. Não concluir que houve uma correção de CORS ou que toda falha real de rede foi eliminada. Não desativar prefetch, filtrar erros ou alterar proteção por hipótese.

**Nenhuma alteração no CORS/Auth do produto ou dos serviços hospedados.** O simulador HTTP tem um contrato CORS explícito para a única origem local `http://127.0.0.1:3199`; isso serve exclusivamente ao backend sintético. Não é bypass ou configuração do Supabase. Servidores temporários de diagnóstico foram encerrados. Safari em celular físico não estava disponível; não testado nem aprovado. A matriz hospedada ainda precisa passar antes de remover o bloqueio.

Artefatos: `local-webkit-rsc.json`, `local-native-auth-rsc.json`, `local-native-auth-settled.json`, `native-rsc-cancellation.json` e `webkit-analysis.json`, em `build/rpg-dev-003/`. Fontes reproduzíveis em `tests/hosted/`; instruções no README do diretório.

## Elmo, escudo, botas e medalhão

**DONE: aprovação humana recebida e integração limitada na PR.** Após a comparação privada, Carlos respondeu **“Aprovar as quatro propostas neste corpo”**. Recibo versionado: `RPG-DEV-003-HUMAN-VISUAL-APPROVAL.json`, com SHA da página exibida, hashes das artes, geometria exata e `productionRelease=false`. O escopo é exclusivamente `female_long_blue_dark_hd.png`, SHA `8965ed75ea6fed37f0f20bda47d1e89cde09ef5bba38bcb977a8331cd2ce6e9a`.

- Elmo: nova arte transparente, rosto aberto, olhos/nariz/boca visíveis; posição/escala aprovadas.
- Botas: nova arte transparente do par, duas composições recortadas por CSS nas posições aprovadas. Nenhuma edição posterior dos pixels gerados.
- Escudo: arte existente preservada; posição, escala e inclinação aprovadas junto ao braço/mão esquerda.
- Medalhão: arte existente preservada, menor e acima do emblema da couraça; corrente SVG com geometria aprovada.

As **seis composições anteriores continuam inalteradas**, incluindo couraça 3 e empunhadura. O gate mantém os checks antigos e acrescenta o recibo novo: nove hashes de assets usados em runtime/dez composições aprovadas. Apenas dois PNGs novos foram adicionados; escudo e medalhão reutilizam dois PNGs já existentes. Isso não é publicação remota nem aprovação de variantes ou corpos diferentes.

`equipmentBodyFit003.ts` registra os quatro itens existentes, corpo exato e camadas. O resolver exige corpo/gênero/slot/identidade correspondentes e o pipeline existente continua exigindo item **possuído e equipado**. Outros corpos e fallback da imagem não recebem esses overlays. Nenhum item, preço, raridade, atributo, aquisição ou política de recompensa foi alterado.

**DONE nos testes locais:** seis novos testes unitários cobrem escopo de corpo/slot, propriedade, camadas, recortes das botas, corrente, fallback e ausência de mutação. Os 12 testes das composições anteriores passaram. Um teste antigo equipava todos os itens e esperava que apenas a couraça aparecesse neste corpo; sua fixture agora equipa somente a couraça para manter a regressão específica, enquanto os novos testes verificam os itens recém-aprovados. Não remover as verificações de propriedade, atributos ou fallback.

**DONE no navegador:** quatro PASS, Chromium desktop 1440 e WebKit móvel 390. Incluem o cenário anterior de espada/troca sintética e o novo cenário: equipar/desequipar cada uma das quatro peças, conferir sincronização, atributos restaurados ao desequipar, inventário/saldos intactos, reload, preservação do estilo da couraça/espada e ausência de erros/overflow. Capturas `integrated-desktop.png` e `integrated-mobile.png` inspecionadas pelo autor. Dados exclusivamente sintéticos; não comprova aquisição/troca autorizada hospedada entre variantes.

Comparação original preservada em `build/rpg-dev-003/visual-review/index.html`. Seus rótulos refletem o momento anterior ao aceite; o recibo acima registra a decisão posterior. Não ampliar esse aceite a outros corpos, cartas, economia ou produção.

## Economia — 16 XP e 6 moedas

**BLOCKED por ausência de proveniência.** Consulta somente leitura reconfirmou XP 245016, moedas 1006265, esperado 1006259, diferença de 16 XP/6 moedas, cinco checkpoints de compra correspondentes aos recibos e `economic_verified_at=NULL`. Zero eventos canônicos de batalha, recompensas/operações Journey, claims Guilda ou pendências EBD para explicar a diferença.

Também conferi o catálogo de tabelas públicas/privadas relacionadas a eventos/auditoria/operações/recompensas: não apareceu outra tabela de recibos/auditoria econômica além das fontes já investigadas. A busca seletiva por traces, snapshots e backups nos diretórios locais das TASK-0076/0076A e no build principal não encontrou trace de rede contemporâneo ao acréscimo. O backup anterior ao provisionamento examinado em RPG-DEV-002 continua sem comprovar a origem.

Não atribuir os valores a duas recompensas antigas de 8 XP/3 moedas somente por semelhança numérica. Não modificar saldos, criar recibos retroativos nem certificar reconciliação. Para desbloquear, falta evidência contemporânea que ligue jogador, operação, valores e saldo. Créditos da Torre e economia produtiva permanecem desativados.

## Arena, Torre, testes e revisão

**DONE na preservação:** SQL, motor, contratos econômicos e asserções da Arena/Torre não foram alterados. Reutilizados os seis cenários locais aprovados no RPG-DEV-002 e os 74 PostgreSQL executados no RPG-DEV-001, incluindo sete andares/campeão, derrotas, transações/idempotência e recuperação. Não executados novamente nem convertidos de SKIP para PASS. Proposta da Torre continua 430 XP/215 moedas/um baú épico, sem homologação econômica ou créditos reais.

| Gate | Resultado |
| --- | --- |
| Unitários completos | DONE: 777 PASS/74 SKIP, 118 arquivos PASS/sete omitidos; preserva os 771 anteriores e adiciona seis |
| Equipamentos unitários dedicados | DONE: 18 PASS, novos e anteriores |
| Navegador equipamentos | DONE: quatro PASS desktop/WebKit móvel |
| Matrizes WebKit locais | DONE no diagnóstico; estabilidade com requisições pendentes BLOCKED, conforme tabela |
| Controle público nativo | DONE: 12 fluxos, cancelamento isolado sem erro |
| Fluxos com rede estabilizada | DONE: seis fluxos/42 checks; evidência local sintética |
| Lint/TypeScript/build | DONE: comandos completos exit 0 |
| Assets/isolamento de áudio | DONE: nove hashes/dez composições; seis anteriores preservadas; zero arte pendente publicada no artefato local |
| Protocolo de publicação | DONE: 25 PASS |
| Auth/RLS/autoridade PostgreSQL hospedados | Evidências anteriores válidas preservadas; nenhum novo teste hospedado positivo alegado |
| QA/Security/React | Revisão pelo autor, sem independência alegada; aprovação de release BLOCKED |

Revisão Security: nenhuma dependência nova, credencial real em fixtures, alteração de privilégios ou SQL. Os simuladores ficam somente em loopback/testes e não são importados pelo produto. Recortes/corrente são constantes aprovadas; nenhum SVG ou estilo é derivado de entrada do usuário. Revisão React: sem novos efeitos, requests ou bibliotecas no renderer; camadas decorativas acessíveis por `aria-hidden`, falha de imagem remove também a corrente, e corpos/fallbacks permanecem limitados por identidade.

Falhas de montagem mantidas como REWORK corrigido: o primeiro controle público usava um nome antigo de link e foi corrigido antes da matriz válida; o novo gate inicialmente tentou validar os PNGs recortados antigos como canvas 1024×1536, depois recebeu validação separada de hash/alpha/proporção sem flexibilizar os PNGs full-canvas; a expectativa antiga de somente couraça foi delimitada como descrito acima. Nenhuma dessas falhas foi contada como PASS.

## GitHub, Preview, produção e pendências

Commit técnico: [`c1ffbb6088799759d2ff26a2bc90a91fee636c21`](https://github.com/CarlosJr30/rpgjovemcristao/commit/c1ffbb6088799759d2ff26a2bc90a91fee636c21), enviado à mesma PR11. **DONE:** [CI push](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40149890306) e [CI PR](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40149894784) completed/success para esse SHA exato. O commit documental posterior registra o resultado e normaliza somente uma linha vazia ao final do script de diagnóstico, sem nova alteração de comportamento.

**Preview anterior preservada:** [READY, runtime 2d0132e](https://rpgjovemcristao-nu38qe2u0-carlos-junior-s-projects.vercel.app), backend TEST `wkdvdzfkbwvhyjmamrsg`. Ela **não contém** as novas artes desta PR. Não foi criado deployment adicional enquanto o gate crítico WebKit e os fluxos positivos hospedados continuam pendentes. O candidato novo está validado localmente e aguarda os gates de publicação; não declarar publicado em Preview ou produção.

**Produção preservada:** [Guilda/EBD](https://rpgjovemcristao-web-inky.vercel.app), `808433a`/READY. Alias e sete respostas HTTP reconferidos: raiz/Auth/Guilda/EBD 200, Arena/Torre/equipamentos 403. Não repetir ou alegar novos testes produtivos autenticados: os 89 do lançamento continuam referenciados no mesmo runtime.

**Migrations: nenhuma. Provisionamentos/custos aprovados: nenhum. Merge/deploy produtivo: nenhum.** Supabase PROD `wspafhlbtlpabypzymjo` e TEST compartilhado preservados; não criada branch, banco ou hospedagem de gameplay.

Próxima tarefa: isolar o mecanismo interno do erro WebKit/Next sob navegação autenticada com prefetch pendente e, quando os gates permitirem, repetir a matriz hospedada no SHA candidato sem filtrar mensagens. Buscar evidência econômica contemporânea; manter suspenso o ambiente com custo. As quatro peças visuais já foram aprovadas para este corpo, sem nova decisão pendente de arte. A publicação de gameplay continua BLOCKED por WebKit, proveniência econômica, catálogo/aquisição/recompensas e ausência da homologação hospedada isolada.
