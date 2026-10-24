# FIX-PROD-008 — Pendências finais de produção

Data: 24/10/2026. Estado geral: **BLOCKED para produção**. Não há evidência suficiente para reconciliar o delta produtivo ou promover o avatar ativo. A nova execução hospedada registra uma derrota legítima, sem concessões.

## Preparação e preservação — DONE

Lidos `.agent/RELEASE_POLICY.md`, contexto/memória, workflow/regras/segurança, contrato008 e relatório007. Confirmados localmente e no remoto `23f95ae02a332665405e63951e4dcb80a72061a9` (runtime) e `ccfa5236042fafcd5c7ca443a296fa4013ff8232` (relatório007). Nova branch `codex/fix-prod-008` parte de ccfa523 no checkout físico reutilizado `C:/Users/carlo/rpg-worktrees/fix-prod-005`; demais branches/worktrees e alterações da raiz preservados. Nenhuma limpeza, reset ou dependência instalada.

## Situação por item

| Item | Estado | Resultado |
| --- | --- | --- |
| Reconciliação16XP/6moedas | BLOCKED | Baseline e checkpoints conferem; nenhum evento canônico comprova o delta. Hipótese de dois treinos não é homologação. |
| UID/avatar ativo e antigo | DONE em leitura | Identificados de forma inequívoca no cadastro; titularidade autenticada não demonstrada por essa consulta. |
| Liderança/Guilda/EBD do alvo | BLOCKED | Falha do navegador conectado impede getUser da sessão e processo administrativo auditado. Nenhuma promoção executada. |
| Composição3 e quatro anteriores | DONE na preservação | Cinco composições/quatro PNGs com hashes conferidos; gate213arquivosPASS. |
| Espada no corpo atual | BLOCKED para ativação | Preparada comparação privada concreta, sem alterar PNG/posição ou runtime; revisão humana específica pendente. |
| Elmo/escudo/botas/medalhão | REWORK | Definições atuais NEEDS_NEW_OVERLAY e sem aprovação nesse corpo; não ativar calibração arquivada como arte homologada. |
| Troca positiva no mesmo slot | BLOCKED | Catálogo contém seis itens, um por slot; falta segunda variante homologada e adquirida legitimamente. |
| Atributos/persistência/desktop/móvel | DONE nos cenários007 já executados | Evidência válida preservada; nenhum código afetado. Revisão privada008 em dois viewports também executada; não equivale a equipar hospedado ou aparelho físico. |
| Torre hospedada, derrota/recibo/reconexão | DONE no cenário008 | Nova tentativa legítima no andar2, derrota rodada7,16checksPASS;0XP/0moedas/0baús e progresso mantido2. |
| Torre hospedada, vitórias2–7/campeão | BLOCKED | Tentativa não venceu o andar2; não abrir3–7 ou elevar atributos manualmente. |
| Arena hospedada | DONE nos cenários003/007 preservados; demais positivos BLOCKED | Não repetir concessões/partidas sem necessidade; nenhuma recompensa nova de Arena em008. |
| Produção | BLOCKED | Ambiente anterior READY preservado; sem promoção com gates pendentes. |

## Economia: evidências e limites

Reexaminado o recibo administrativo original `D:/rpg-jovem-cristao-task-0076/build/task-0076-chat-a/provisioning-evidence.json`:readback de15/10/2026 19:31:33.9727Z registra245000XP/999999moedas,nível50,UID e avatar corretos. Isso comprova o provisionamento inicial já aceito no004, não os eventos posteriores.

Nova execução somente SELECT de `packages/database/deployments/fixprod006/reconciliation-checkpoints.sql` no **PRODwspafhlbtlpabypzymjo**: cinco compras têm saldos previstos/registrados iguais1000269/1000089/999909/999729/999549.28aberturas somam7160moedas e cinco compras custam900; esperado999999+7160−900=1006259, atual1006265. XP esperado245000, atual245016. Último recibo15/10/2026 19:52:08.117475Z. Para o alvo continuam0batalhas,0claimsGuilda,0eventosJornada,0operaçõesJornada e0recompensasEBD pendentes. `economic_verified_at` permaneceNULL.

Hipótese adicional examinada: o contrato de treino no código produtivo5edc93f possui8XP/3moedas por vitória.16/6 é compatível com dois treinos, mas coincidência aritmética não prova ocorrência, proprietário ou legitimidade das batalhas. A trilha005 contém7PATCH de travelers e umPOSTadd_coins (request01a142e4-da7e-7631-9306-e8c309ac8aae em16/10 04:07:36.830Z), sem payload/recibo canônico suficiente. Não transformar essa hipótese em `economic_verified_at` ou crédito aprovado.

Consulta histórica adicional ao stream produtivo, janela explícita16/10/2026 03:55–04:10Z:122registrosedge e2postgres. Filtro dos eventosPostgres por UUID do alvo/coins/reward retorna0entradas; não encontrou SQL/evento que certifique o delta. A ausência nessa janela não demonstra ausência histórica absoluta. Colunas disponíveis de eventos/histórico foram inspecionadas antes de ampliar a auditoria; não surgiu ledger alternativo que justifique16/6. Sem ajustes de saldo, reconstrução fictícia de recibos ou alterações de titularidade. Resultado **BLOCKED_MISSING_EVENT_PROVENANCE**.

## Liderança e identidade

Ativo `31b70059-deca-44c8-a6df-f21ea68b6e42`, UID `78729453-8e04-478c-96ae-d37cead1bc8c`,nível50,membro,245016XP/1006265moedas. Antigo `9b83ca7f-0154-4492-9ad3-1deedb7411f4`,mesmoUID,nível1,líder,inativo,0XP/0moedas. MesmaGuilda `c9041d27-28ee-41fa-9ae4-59043ee15143`; ambos preservados.

Nova tentativa oficial de consultar o navegador conectado falhou antes de listar as superfícies: `failed to write kernel assets: O sistema não pode encontrar o caminho especificado`. Não foram acessados perfis/cookies nem extraídos tokens. Identidade cadastral e autorização geral do usuário não substituem sessão getUser e autoridade administrativa do ator. Sem liderança aplicada, sem auditoria de promoção inventada, sem service_role/privilégio global ao jogador e sem validação positiva de Guilda/EBD do alvo. Condição de desbloqueio: sessão utilizável e execução pelo mecanismo administrativo permitido, com auditoria.

## Equipamentos e revisão visual

Auditoria executável do catálogo/resolver real (`build/fix-prod-008/equipment-audit.mjs/json`) confirma seis itens e um por slot. No corpo `female_long_blue_dark_hd.png`, somente `traveler-armor-uncommon` resolve camada visível. Espada possui arteREADY aprovada para outro corpo; elmo, escudo, botas e medalhão permanecemNEEDS_NEW_OVERLAY. Essas restrições são preservadas; posse/atributos não autorizam automaticamente arte corporal.

Gate `node scripts/equipment-body-fit-v3-production-gate.mjs`:PASS,4PNGs/5composições,213arquivos verificados,0pendentes publicados. Hashes do corpo e overlay de cada uma das cinco composições conferem. Nenhum arquivo de runtime, arte, calibração, regra econômica ou migration foi modificado em008 até esta revisão.

Preparada revisão privada concreta de espada existente com a couraça3: `build/fix-prod-008/visual-review.html`. Comparação lado a lado do atual aprovado e da proposta adicionando apenas a espada existente, sem ajuste de posicionamento; não é ativação. Chromium1440/WebKit390 carregaram todas as imagens, sem overflow/erros, com toggle conferido; capturas inspecionadas. Pergunta de aprovação específica enviada ao usuário; ausência de resposta não concede aceite. Elmo/escudo/botas/medalhão não estão homologados por essa revisão. Teste de celular físico indisponível, não declaradoPASS.

## Torre: execução real nova

Usado exclusivamente **TESTwkdvdzfkbwvhyjmamrsg**, Preview007 noSHA23f95aeREADY, conta de testes preexistente confirmada por getUser e avatar `fb68ba8e-e5f0-4692-ad88-64a88765fd97` (nível1,16XP/6moedas,sem alteração manual). Sete cartas já possuídas e andar2 já desbloqueado; nenhum starter, item ou recompensa adicionado. Estratégia usa apenas turno/Foco públicos, ataque, defesa e cartas possuídas. Não lê seed para prever entropia nem escreve estado/vitória/progresso.

Batalha **90c11431-9190-433d-91c2-f1fb2972fffc**, andar2, derrota na rodada7. Recibo **afee9700-f7c1-4ef1-9d46-aaa963737d08**,operation_type`tower-result`,mesmoViajante/conta confirmados no servidor;reward0XP/0moedas/0baús,statusblocked/rewardedfalse. Comandos por rodada:attack,card:arena-card-measured-strike,card:arena-card-basic-defense,attack,attack,defend,attack.16checks reaisPASS: identidade, coleção, andar permitido, comandos legítimos, encerramento/recibo, política econômica, retomada idêntica em nova requisição, progresso2 preservado eHTTP409 no replay encerrado. Parou na primeira derrota; nenhum salto para3–7 ou sequência de tentativas para fabricar vitória.

Harness008 inicialmente acessou incorretamente ownedCard.id e foi corrigido para ownedCard.card.id conforme o contrato; falha ocorreu antes de iniciar partida. Não é defeito do aplicativo nem teste positivo. Consultas diagnósticas com nomes de coluna incompatíveis também foram corrigidas conforme o contrato e não classificadas como validaçãoPASS. Recibo final foi conferido porSELECT; versões iniciais de diagnóstico não são a evidência final.

Estado finalTEST:21batalhas/23recibos (acréscimo autorizado de uma batalha/um recibo),16XP/6moedas,0claimsTorre e políticaenabledfalse. Comparação de hashes dos oito conjuntos existentes antes/depois exclui **somente os dois IDs novos explicitamente registrados**:travelers(excluiupdated_at),wallets,inventory,chests,receipts,battles,equipment,stats todos iguais. Não alegar ausência de escrita no banco de testes: houve a partida legítima descrita. Nenhum dado preexistente de jogo alterado e nenhuma escrita produtiva.

## Testes preservados, CI e ambientes

Sem mudança de runtime em relação ao23f95ae: `git diff 23f95ae HEAD -- apps packages tests scripts` vazio antes do fechamento documental. Evidências007 continuam válidas:727unitPASS/66SKIP,36PG finaisPASS,18API/12navegadorPASS,lint/types/build/protocolo25PASS. As66omissões não sãoPASS. Evidências006 determinísticas (10PG,duas réplicas completas1–7/dois campeões/430XP215moedas1épico fechado por réplica) foram preservadas, sem nova simulação desnecessária ou alegação de execução hospedada. QA/Security pelo autor, sem revisão independente.

[Runtime23f95ae](https://github.com/CarlosJr30/rpgjovemcristao/commit/23f95ae02a332665405e63951e4dcb80a72061a9) tem [CI40098578298success](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40098578298). [Documentação007ccfa523](https://github.com/CarlosJr30/rpgjovemcristao/commit/ccfa5236042fafcd5c7ca443a296fa4013ff8232) também tem [CI40099363235success](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40099363235), conferidos remotamente em008. O commit de fechamento008 será documental; seu SHA consta no histórico Git e na entrega final. Não substituir a correspondência da Preview pelo SHA documental.

**[Preview existente READY](https://rpgjovemcristao-d8vdfpfdw-carlos-junior-s-projects.vercel.app)**,dpl_832W4mCPLH5Gi8swgFQqtQHnmGSC,SHA23f95ae. Testes008 realizados nessa versão imutável. Nenhuma nova Preview artificial para documentação. ConectorVercel retornou403; fallbackCLI autenticada/escopada ao mesmo projeto/team conferiu deployment eSHA, sem alterar permissões ou ambientes.

Migrations remotas reconferidas:PROD4/última20261023213654;TEST22/última20261024032756. **Nenhuma migration aplicada/repetida**, sem novaDDL ou dependência. Créditos da Torre mantidos desativados. A ausência de código publicável novo dispensa novo deploy/build artificial pela política; não dispensa os gates aindaBLOCKED para promover a versão já existente.

Produção/main continuam **5edc93f5857b26a59b183e8abfb963110831f90c**,VercelREADYdpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv,[URLprodutiva](https://rpgjovemcristao-web-inky.vercel.app). Contagem produtiva20Viajantes/37inventário/37recibos/0batalhas,245376XP/1006767moedas,0tabelas públicas semRLS;alvo e antigo intactos. Nenhum teste autenticado produtivo da versão007/008 ou publicação007/008 foi declarado. **SemDEPLOY_COMPLETE**.

## Evidências e desbloqueio

Artefatos privados em `build/fix-prod-008/`:reconciliation.json,identity.json,hosted-tower.json,hosted-process.json,hosted-receipt-final.json,game-data-preservation.json,equipment-audit.json,visual-review.html/capturas/JSON,prior-ci.json,preview.json,production.json,evidence-index.json. Índice comSHA256 de sete fontes/evidências, incluindo provisionamento original e trilha005; conteúdo privado não copiado para Git. Dados sensíveis não foram versionados.

Desbloqueios necessários: evento rastreável que comprove16/6 e homologação econômica/catálogo; sessão autenticada e processo administrativo auditável; composição visual aprovada por peça/corpo; segundo equipamento homologado e adquirido para troca positiva; condições legítimas para vitórias hospedadas pendentes. Não resolver por concessão manual, desativação de proteção ou alteração de avatar antigo. Estado da tarefa permaneceBLOCKED enquanto faltarem essas evidências.
