# FIX-PROD-006 — encerramento dos bloqueios

Data: 24/10/2026. Estado geral **BLOCKED para produção**. Testes determinísticos isolados concluídos; nenhum resultado sintético foi apresentado como vitória produtiva.

## Preservação e contexto

Lidos contexto/memória, política de release, regras/segurança/workflow e relatório005. Base `093ca23898477a27fd0358801eb99e4254db1fbd`, candidato anterior `da07a86`, main produtivo `5edc93f5857b26a59b183e8abfb963110831f90c`. Todos os trabalhos anteriores preservados. A tentativa de novo worktree foi abortada pelo Git por falta de espaço; não deixou checkout006 residual. Para evitar cópia de dependências, o checkout `C:/Users/carlo/rpg-worktrees/fix-prod-005` passou à branch nova `codex/fix-prod-006`, do mesmo HEAD inicial. Branch005, commits, artefatos e demais worktrees permanecem preservados. Não houve limpeza de dados do usuário.

## Situação por item

| Item | Estado | Resultado |
| --- | --- | --- |
| Torre determinística em isolamento | DONE | Dois percursos independentes completos1–7, mesma seed20261024 e mesmo estado integral de combate após normalizar somente o ID aleatório da batalha. |
| Campeão / persistência / recibos | DONE em isolamento | Andar7 vencido em ambas as réplicas pelo motor; retomada em nova conexão, ordem e vínculo conta/batalha/recibo/claim conferidos. |
| Recompensas transacionais | DONE em isolamento | Incremento exato por réplica430XP/215moedas/um baú épico fechado; concorrência, replay, derrota e política desativada conferidos. Integração005 preservada. |
| Créditos e vitórias em produção | BLOCKED | Catálogo/economia sem homologação; nenhuma concessão ou vitória artificial foi usada como prova produtiva. |
| Economia16XP/6moedas | BLOCKED | Cinco checkpoints de compras conferem, mas continuam sem origem autoritativa os valores restantes. Zero alteração de saldos/verified/recibos. |
| Equipar/desequipar/persistência | DONE nos testes isolados executados | Elmo oficial equipado, lido em nova conexão e removido, com inventário e economia idênticos. |
| Troca positiva entre variantes | BLOCKED | RPC/catálogo possuem somente um item autorizado por slot. ID de elmo comum sem homologação é corretamente rejeitado mesmo quando presente na fixture de inventário. Não foi inventado novo catálogo. |
| Aparência e posicionamento | REWORK / revisão pendente | Comparação concreta de couraça no corpo exato entregue em desktop/móvel; aprovação para esse corpo não herdada. Demais equipamentos não validados visualmente. |
| Teste Chat A / liderança | BLOCKED | Avatar ativo identificado em leitura; falta sessão getUser acessível e aplicação administrativa auditada. Antigo e permissões preservados. |
| Testes e CI | DONE nos checks executados |10PG,726unitários,lint/types/build/protocolo aprovados; skips não contam como PASS. QA/Security pelo autor. |
| Preview / Auth real | DONE nos fluxos executados |READY no SHA aprovado;18checks de API e12de navegador, sem alterar dados de jogo. Não substituem pagamentos positivos homologados ou teste físico. |
| Produção | BLOCKED | Não promovida enquanto faltarem gates econômicos, visuais, identidade e validações obrigatórias. |

## Torre: sete andares e campeão

| Andar | Réplica A | Réplica B | Rodadas finais | XP | Moedas | Baú |
| --- | --- | --- | --- | --- | --- | --- |
|1|vitória|vitória|2|20|10|0|
|2|vitória|vitória|1|30|15|0|
|3|vitória|vitória|1|40|20|0|
|4|vitória|vitória|2|50|25|0|
|5|vitória|vitória|2|60|30|0|
|6|vitória|vitória|2|80|40|0|
|7 — campeão|vitória|vitória|3|150|75|1épico fechado|

As duas bases PostgreSQL17 são descartáveis, sem rede, portas ou bind de dados reais. O template sintético de final de jogo é inicializado antes das batalhas: nível50,245000XP e atributos de fixture; não provém do Teste Chat A. Catálogo e homologação econômica são simulações exclusivamente offline. Por réplica, o saldo final245430XP representa incremento430 sobre esse template, não concessão hospedada.

A seed substitui somente a expressão de entropia na instalação da autoridade na fixture, depois de conferir o hash do SQL revisado. Nenhum SQL/migration de produto foi editado; o runtime conserva pgcrypto. Não existe parâmetro de seed no cliente/API. Nenhum winner, estado encerrado, progresso ou andar vencido foi escrito manualmente: todos resultam de comandos normais e do motor real. As duas execuções de cada andar concordaram no estado integral, incluindo HP, foco, logs, resultado e rodadas; normaliza-se apenas o ID independente da batalha. A sequência só abre o próximo andar após vitória persistida.

Os10testes PG finais incluem os sete andares em duas réplicas, derrota/política false, comandos concorrentes e equipamentos protegidos. Replay encerrado é negado, repetição de andar é negada, claims e recibos são únicos e vinculados ao proprietário. A aprovação simulada não homologa prêmios hospedados. Recuperação/rollback de carteira/baú e demais regressões005 válidas permanecem evidências anteriores, sem alegação de nova execução de todos os37casos005.

REWORK do teste: a primeira rodada teve9PASS/1FAIL porque tentava equipar `traveler-helmet-common`, fora do catálogo oficial. A regra do servidor foi preservada; o teste foi corrigido para exigir `Equipment denied`, manter o elmo oficial e comprovar estoque/saldo intactos. A rodada final integral teve10PASS/0FAIL. Não se tratou a rejeição de segurança como defeito a contornar.

## Economia — investigação adicional em leitura

Nova consulta `packages/database/deployments/fixprod006/reconciliation-checkpoints.sql`, somente SELECT, executada em produção. Os cinco recibos de compra registram exatamente os saldos acumulados previstos:1000269,1000089,999909,999729,999549. Não há diferença nesses checkpoints. Última operação com recibo:15/10/2026 19:52:08.117475Z; saldo calculado após todas as aberturas/compras1006259, atual1006265, delta6. XP administrativo245000, atual245016, delta16.

Para o alvo, os ledgers atuais retornam0batalhas,0claims de recompensa da Guilda,0eventos de recompensa da Jornada,0operações da Jornada e0recompensas EBD pendentes. Os logs005 com PATCH/add_coins permanecem úteis como trilha de requisições, mas não contêm payload ou evento canônico suficiente para certificar16/6. Conferência numérica dos recibos não prova a origem legítima de alterações antigas. Estado `BLOCKED_MISSING_EVENT_PROVENANCE`,economic_verified_atNULL. Nenhum saldo, account_id, recibo ou marca de verificação alterado. Não solicitar homologação final enquanto essa origem e as demais condições econômicas não forem resolvidas.

## Equipamentos e revisão visual

O catálogo oficial da RPC contém seis itens e um por slot; trocar por variante desconhecida deve falhar mesmo se um ID adulterado aparecer no inventário. O teste isolado comprova equipar/desequipar/persistir o elmo raro e negar elmo comum não homologado, preservando estoque e saldos. Uma troca positiva exige um segundo item homologado e aquisição autorizada; não foi criado estoque hospedado para teste.

Corpo alvo: `female_long_blue_dark_hd.png`, camadas do registro existente aprovadas apenas para outra identidade visual. Preparada comparação privada em `build/fix-prod-006/visual-review/index.html`: corpo sem camada, couraça existente na posição original e proposta CSS com escalaX1.05/escalaY1/deslocamentoX−2.5%/Y0. Imagens PNG existentes não foram editadas; hash/avatar/transform estão em `visual-proposal.json`, statusPENDING_HUMAN_REVIEW/runtimeEnabledfalse. DesktopChromium1440 eWebKit390 carregam as imagens, alternam a camada e não apresentam overflow ou erros; capturas inspecionadas. Emulação não é teste de celular físico.

Foi solicitada revisão específica dessa composição, sem transferir aprovação de outro corpo ou dos demais itens. A regra de aprovação é do projeto (`.agent/GLOBAL_CONTEXT.md` e comentário de `EquipmentAssetEntry` em equipmentAssets.ts), não uma nova autorização genérica de deploy. Sem resposta, aprovação continua pendente. Espada, escudo, elmo, botas e medalhão não receberam aceite visual.

Dois rascunhos bitmap de couraça foram gerados pela skill imagegen com referências do corpo/couraça e ferramenta image_gen. Prompts: camada isolada ajustada ao corpo, seguida de edição de transparência para retirar halo sem mover a armadura. Os resultados mudaram escala/posição ou mantiveram halo; preservados como `build/fix-prod-006/visual-review/armor-candidate-v1.png` e`armor-candidate-v2.png`, **REWORK**, sem public/registro de aprovação. A comparação CSS usa a imagem existente, sem ativação pública. Código de produção e quatro assets aprovados originais preservados.

## Liderança

Alvo ativo `31b70059-deca-44c8-a6df-f21ea68b6e42`, UID cadastral `78729453-8e04-478c-96ae-d37cead1bc8c`,nível50,membro,245016XP/1006265moedas. Antigo `9b83ca7f-0154-4492-9ad3-1deedb7411f4`,nível1,líder,inativo,mesmaGuilda. Identidade cadastral em SQL não substitui getUser da sessão. CUA e inicialização oficial de Computer Use via @oai/sky falharam com `failed to write kernel assets`. Não foram lidos perfis/cookies nem extraídos tokens. Sem identidade autenticada disponível não houve promoção, execução administrativa, auditoria fictícia ou validação de funções Guilda/EBD. Nenhum service_role/privilégio global foi concedido ao jogador; antigo preservado.

## Arquivos, testes e publicação

Alterados: `tests/fixtures/offline-authority-postgres.ts`; novo teste `apps/web/lib/authority/tower-deterministic.postgres.test.ts`; `packages/database/deployments/fixprod006/fixture.test.ts`, `reconciliation-checkpoints.sql`, `visual-proposal.json`, README; contrato006; este relatório e memória de encerramento. Arte/harnesses/backups privados permanecem ignorados. Nenhuma migration nova, reexecução remota ou dependência instalada. Migrations003/005 já registradas foram preservadas.

Checks locais:726PASS/66SKIP na suíte geral;5dos novos casos unitários rejeitam seed inválida antes de iniciar processos.10PG PASS,lintPASS,TypeScriptPASS,buildPASS,protocolo25PASS. Os66opt-ins omitidos pela suíte padrão não são classificados como aprovados por essa execução; os10PG têm execução separada real. QA/Security pelo autor. Fixtures não são importadas pelo runtime e não oferecem parâmetro remoto de vitória/seed.

Candidato [cc64a52aa55862a782e79dc89fd3663283afea71](https://github.com/CarlosJr30/rpgjovemcristao/commit/cc64a52aa55862a782e79dc89fd3663283afea71). [CI40060534000 success](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40060534000), job120772851584; teste/lint/types/build/protocolo aprovados no SHA exato. Previewdpl_41eBGzUafvZ6R8LCKwpTsvLAb8GM, [URL006](https://rpgjovemcristao-j2fsi1afx-carlos-junior-s-projects.vercel.app), variáveis exclusivas da branch006 para Supabase de testes `wkdvdzfkbwvhyjmamrsg`. Sem deploy produtivo. Conector Vercel sem acesso ao escopo; CLI autenticada/escopada usada como no005.

## Conferência final

**Preview006 READY**, SHA exato `cc64a52aa55862a782e79dc89fd3663283afea71`, targetPreview.18checks de API PASS/0FAIL: getUser de duas contas de teste preexistentes, sete cartas já possuídas por conta, progresso2/1 preservado, recibos históricos de derrota com0créditos, retomada exata em nova requisição, negação de injeção de homologação/valor, acesso cruzado e semAuth rejeitados, carteiras6/0 preservadas. Não houve starter, nova batalha, comando de progressão, item ou concessão hospedada.

**12checks de navegador PASS/0FAIL**, login real e equipamentos/cartas no mesmo Preview, Chromium1440 eWebKit390: botas já equipadas e atributos carregados, mesma informação após reload, cartas preexistentes, ausência de overflow e erro de página. Sem ação de equipar/trocar no banco hospedado; mutações funcionais foram ensaiadas somente na fixture descartável. Duas verificações privadas adicionais de viewport/toggle da revisão visual não são apresentadas como testes do jogo hospedado. Celular físico não executado, BLOCKED.

Hashes antes/depois dos testes conferem para travelers (excluindo somente updated_at),wallets,inventory,traveler_chests,chest_operations,battles,equipped_items,traveler_stats. Evidência `game-data-preservation.json`,matchtrue. Migrations22/última20261024032756,20batalhas/22recibos/16XP/6moedas,claims0/políticafalse preservados. Consulta da definição hospedada confirma uso de gen_random_bytes e ausência da seed de fixture. Nenhuma migration nova ou repetida, nenhuma alteração dos dados econômicos e nenhum bypass de segurança.

Produção,main ebranch005 conferidos novamente: main/Vercel5edc93f READY;005093ca23 preservado. Contagens/saldos e os papéis dos dois avatares iguais ao início. Leitura SQL produtiva foi a única interação com os dados desses jogadores. Não houve publicação de runtime em produção e, portanto, não houve teste produtivo autenticado da versão006. O fechamento documental pode ter commit posterior, sem repetir Preview ou migrations apenas por documentação.

Evidências privadas no checkout reutilizado, `build/fix-prod-006/`: deterministic-pg-final.json,deterministic-floors.json,fixture-unit.log,unit/lint/typecheck/build/protocol logs,ci.json,reconciliation.json,preview-env.json,preview.json,preview-checks.json,preview-process.json,browser.json,game-data-preservation.json,production-final.json evisual-review/*. A revisão da couraça permanece aguardando resposta explícita; tempo decorrido não equivale a aprovação.

Produção permanece em [5edc93f / READY](https://rpgjovemcristao-web-inky.vercel.app), dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv. SupabasePROD `wspafhlbtlpabypzymjo`:4migrations/última20261023213654,20Viajantes/37inventário/37recibos/0batalhas,245376XP/1006767moedas. Testes têm22migrations/última20261024032756,20batalhas/22recibos/16XP/6moedas,claimsTorre0/políticafalse. Os16/6 de testes não justificam o delta produtivo. Nenhuma validação ausente foi convertida em PASS; **não há DEPLOY_COMPLETE**.
