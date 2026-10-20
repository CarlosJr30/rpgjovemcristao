# TASK-CONSOLIDATION-003A — Golpe Medido local

2026-10-20. **IMPLEMENTATION_LOCAL_DONE / PRODUCT_RELEASE_BLOCKED.** Aprovação do usuário abrange implementação e balanceamento local da candidata, sem homologação, aquisição, posse, starter, publicação ou remoto. QA/Security pelo autor, não independentes.

## 1. Branch e commit

Branch `codex/consolidation-seventh-card-003a`, checkout `D:/rpg-jovem-cristao/build/task-consolidation-003a/checkout`, base003 documental limpa `158493048d9da440942ef7c5024bef61bd8284b1`, implementação anterior `c16511186a0a9c75623ded887110b3a2d01522e0`. Recibo003 conferido; snapshot de28worktrees/refs/pendências registrado antes da branch. Commit de implementação será registrado no fechamento documental; HEAD final/estado limpo/hashes no recibo da raiz `build/task-consolidation-003a/final-receipt.json`. Contrato003A existente foi movido de backlog para active, sem duplicar ID; link histórico003 atualizado.

## 2. Implementação matemática

Nova ação interna `special:measured-strike`: nível1, custo base1Foco, multiplicador1,15, sem geração de Foco/cooldown novo. Reutiliza calculateDamage: multiplica a parcela ofensiva **menos a Defesa** antes de round, depois guarda/armadura com ceil/piso, esquiva e limite de HP. Fórmulas globais intactas. Piso de custo1 extraído para constante do mesmo valor, inclusive sob desconto. [Fórmula, interações e resultados](../game-design/CONSOLIDATION-003A-BALANCE.md).

Tática preparada e espada após Defender preservados; potência própria usa clamp existente1–1,25. Reforço ativo exclusivo de Golpe do Caminho continua exclusivo dele. Candidata cardOnly excluída do loadout legado/IA e de controles/avisos/lab independentes. Comando do produto só aceita básicos/cardId com deck/identidade/rodada válidos; especial direto também recusado no legado para a candidata. Nenhuma segunda engine ou IA nova.

## 3. Catálogo

ID `arena-card-measured-strike`, nome Golpe Medido, OFFENSIVE, Comum proposta. Sete IDs/ações distintos, seis anteriores preservados. Catálogo `arena-cards-2026-10-20.2`, regras `arena-v2-measured-strike-003a.1`; todas as sete fichas continuam proposed, sem fontes autorizadas/arte/referência bíblica. Nomes de mecânicas FICTIONAL, sem citação canônica nova. Readiness agora aponta déficit0 e três propostas utilizáveis no nível1; collection/starter/aquisição continuam indisponíveis. APPROVED_ARENA_CARDS vazio.

## 4. Descrição e interface

describeCatalogCard/describeArenaAction0086 usam as constantes e snapshot para apresentar ×1,15, custo real, nível, condições, duração e uso. Texto explica multiplicação antes de guarda/arredondamento e recusa promessa de +15% no dano final. Componentes existentes exibem raridade, disponível/sem Foco/USADA e1→0usos, sem valor copiado no React ou botão novo. Só filtros cardOnly foram acrescentados aos controles legados para preservar quatro habilidades/avisos. UI/harness testam exatamente Atacar/Defender/Cartas.

## 5. Balanceamento

126linhas comparativas,14situações×3sementes×3ações; mais27batalhas completas nos três primeiros andares, sem mudar NPCs. Intermediário sem guarda: básico12/Medido13/Caminho17; avançado45/51/65; piso1/1/1; HPcap3/3/3. Desconto mantém custo mínimo1 e Caminho pode custar o mesmo com dano maior. Matriz registra bruto/final/Foco e ganho incremental por Foco.

Nas batalhas da build ensaiada, Medido não reduziu rodadas dos andares1/2; no3 passou10→9rodadas e converteu duas derrotas em vitórias. Resultado de limiar, não estimativa de win rate nem equilíbrio universal. Manter1,15 como candidata local para homologação posterior com mais builds/políticas. Artefato `build/task-consolidation-003a/balance-results.json` dentro do checkout, com seeds7/19/42. Detalhes e limites no parecer de balanceamento.

## 6. Testes e regressões

| Gate | Resultado |
| --- | --- |
| Recorte dirigido |116PASS/20arquivos, unit-final.log; engine/deck/catalog/descriptions/collection/storage/UI/Torre/lab/recibo |
| Rechecks após correções de ensaio |11PASS/3arquivos, unit-gates-rework.log; mesmo conjunto de casos afetados, não somar ao total116 |
| Hash pré/pós |64trajetórias antigas equivalentes, SHA7a15a1ef7743bf2a9afd21867e63eee9571d3f7edd38f6dbba1992edbcb0a928; captura antes de mudar engine em legacy-capture.log/legacy-before.json |
| Lint / TypeScript |PASS lint-final.log/typecheck-final.log, workspaces completos |
| Build |PASS build.log, env somente sintética .invalid;948artefatos/0achados/8protótipos preservados |
| Browser |6PASS/0falha/skip/flaky/retry, browser-initial.log e JSON nativo; Chromium1440/320 e WebKit390 |
| Produto / positivo isolado |3casos produto mantêm0/7/iniciar desabilitado;3harness sete propostas, sem Foco/usar/reloadUSADA/andar seguinte novo uso/sem chaves de concessão |
| Artefato |254JS/0marcadores de fixtures/modo candidato; production-fixture-scan.json no checkout |
| QA/React/Security |Revisão do autor, props/hooks/labels existentes, sem novo hook/efeito em produção; [parecer](../security/CONSOLIDATION-003A-SECURITY.md). Captura WebKit do painel/USADA inspecionada, largura verificada nos três projetos |
| PostgreSQL |N/A, nenhum SQL/schema/RLS/RPC alterado; não executado conforme pedido |

Reworks conservados: primeira rodada37PASS/10FAIL por fixture antiga que cresceu para8cartas e cálculo esperado sem considerar que o Guardião defende. Fixture legada manteve4especiais+3básicos; cenário sem guarda usa oponente sem perfil de defesa. Rodada47PASS. Lint exigiu mover teste comparativo do pacote engine para app da Torre; TypeScript exigiu rows tipadas, find compatível ES2022 e finishTower com quatro argumentos. Rechecks11PASS e gates finais PASS, sem relaxar engine/segurança. O caso de comparativo ganhou27simulações nessa correção; evidência atual dele é o recheck, não alegar nova rodada integral116 após essa mudança somente de testes.

Guia local Next e AGENTS/apps-web já lidos antes das edições003A, versão local mantida. Skills de React best practices/verificação de fluxo aplicadas somente localmente; bibliotecas reutilizadas por cópia com links @rpg próprios, sem instalação/upgrade. next-env gerado restaurado após build; fora do commit. Guias/contratos anteriores/banco/Guilda/EBD não tiveram novas auditorias ou suítes extensas repetidas.

## 7. Arquivos modificados

- Engine: index (tipo somente), arena-deck (ação), arena-combat-v2 (candidata/piso/guardas cardOnly), arena-card-catalog/readiness e arena-descriptions; testes pertinentes e novo measured-strike.test.ts.
- App: filtros cardOnly em arena-specials/arena-unlock-notice/arena-visual-lab e asserção de ausência de botão; novos testes de UI, replay/Torre e comparativo.
- Testes: fixture medida, manutenção da fixture legada de sete, opção somente teste no harness Torre, measured-strike.spec.ts e config Playwright própria.
- Documentos: relatório/balanceamento/segurança003A, ponte histórica003 e mesmo contrato movido/atualizado. Memória raiz somente prefixada, hashes no recibo.

Nenhum arquivo econômico/SQL/Auth/Story/Guilda/EBD/NPC/loot/inventário/asset/dependência modificado. A lista exata e hashes estão na auditoria de escopo e recibo.

## 8. Limitações conhecidas

Motor e replay locais não são autoridade de servidor ou proteção contra adulteração do navegador. Não há posse oficial de carta, backend de concessão, recibo idempotente ativo, homologação de equilíbrio ou teste em aparelho físico/Supabase hospedado. O P1 econômico herdado continua aberto; nenhuma fórmula ou API de prêmio foi corrigida ou aceita por esta tarefa. Vencer com fixture não gera recompensa e não libera produto.

## 9. Homologação e aquisição

Sete propostas tecnicamente exercitadas, zero aprovadas/liberadas/concedidas. Fonte de aquisição/arte/referência bíblica não inventadas. Starter desativado. Entrada real de Arena/Torre continua bloqueada sem sete cartas legítimas e homologadas. Sem carteira/ledger/coleção paralela, localStorage como autoridade ou batalha oficial. Nenhuma operação remota, push/fetch/merge/main/deploy.

## 10. Checklist dos22critérios

| Critérios | Evidência |
| --- | --- |
|1–3.ID/7distintas/não homologar |Catálogo/readiness, ID único, versões, approved vazio |
|4–5.Multiplicador/arredondamento |13antes de round intermediário, guardas7/6/4/4, matriz/HPcap/piso |
|6–8.Foco/piso/nível |Custo1 mesmo com desconto, nível1, sem geração; baixas condições negadas |
|9–10.Rejeição sem consumo |Sem Foco, nível0, objeto/ID/owner/round/combate errado, direto/sem deck |
|11–12.Único/duplo clique |Engine e comandos storage concorrentes, stale negado |
|13–14.Reload/nova batalha |Storage/UI/harness retomaUSADA; próximo andar restaurauso |
|15–17.Equipamentos/habilidades/IA |Interações específicas e hash64trajetórias pré/pós; filtros preservam loadout/controles |
|18.Torre |Progressão2andares, derrota não avança, config intacta,27simulações adicionais |
|19.Descrição |Constantes/snapshot e UI, texto não promete aumento fixo final |
|20.Produto bloqueado |Loader/collection e3E2E produto0/7desabilitado |
|21.Sem concessão nova |claimSettlement=false, chaves locais só Arena, economia/RPCs intactos |
|22.Sintéticos fora do build |Scan254JS0achado, harness sem rota/flag de produto |

- [x] Autorização local/HEAD/base/contrato e preservação conferidos.
- [x] Candidata implementada, sete propostas e descrição/piso corretos.
- [x] Testes/reworks/comparativos/QA/Security/gates documentados.
- [x] Relatório/memória/commits/recibo de fechamento locais.
- [ ] Homologação econômica/balanceamento, aquisição legítima e backend autoritativo.

## 11. Próxima etapa

Revisar os limiares de balanceamento e homologar a candidata em escopo próprio; preparar concessão/posse/recibo dentro do contrato econômico e autoridade004. Não iniciar essas dependências automaticamente. IMPLEMENTATION_LOCAL_DONE não autoriza preencher APPROVED_ARENA_CARDS ou publicar. PRODUCT_RELEASE_BLOCKED permanece até esses gates e ambiente/CI/autorização de publicação reais.
