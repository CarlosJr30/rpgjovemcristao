# FIX-PROD-004 — Torre e pendências de produção

**Estado: BLOCKED. Produção não publicada nem modificada nesta tarefa.** Referência runtime `f9f7c36b440010a310e3254d5316e8d1cdaed796`; branch documental FIX-PROD-003 `755ac82b6c6f245776281ff5e16bc2df19bcfd54`. Estado remoto conferido antes do trabalho em 24/10/2026 UTC. Resultados aprovados do FIX-PROD-003 foram preservados; nenhuma migration foi reaplicada.

## Aceite por item

| Item | Estado | Resultado real / causa |
| --- | --- | --- |
| Preservação e conferência de ambientes | DONE | GitHub main5edc93f, Preview f9f7c36 READY, produção5edc93f READY; Supabase testes21 migrations/prod4. Worktrees e alterações prévias preservadas. |
| Retomada e tentativa legítima Torre2 | DONE | Sessão real retomou nextFloor2. Nova batalha legítima terminou em derrota, emitiu recibo, manteve andar2 e não creditou recursos. Reconexão confirmou exatamente o estado encerrado. |
| Vitórias Torre2–7 / campeão | BLOCKED | Conta de testes permanece nível1/16XP, só botas legitimamente possuídas. Derrota real no andar2 impede entrada legítima no3. Não se reduziram adversários nem se concederam nível, XP, equipamentos ou seed para fabricar vitória. |
| Contrato proposto de recompensas | DONE | Usuário forneceu valores e regras. Registrados contrato e modelo isolado de revisão, sem grant, com17 testes aprovados. Orçamento430XP/215moedas/1baú épico; homologação pendente. |
| Concessão hospedada / recibos da Torre | BLOCKED | Recibo de derrota conferido e sem créditos; integração transacional e homologação final não realizadas. Servidor conserva `tower-economy-unapproved`, inclusive para vitória anterior no andar1. Proposta não foi convertida em crédito real. |
| Proteção contra salto de andar | DONE | Tentativa de iniciar campeão/andar7 foi rejeitada com HTTP403 e não alterou o progresso. |
| Proveniência administrativa do alvo | DONE | Localizados contrato TASK-0077, relatório e recibo privado da operação original; hash do backup privado confere com o recibo de provisionamento. Isso supera a ausência de evidência de origem da concessão inicial, sem provar eventos posteriores. |
| Conferência aritmética de itens e baús | DONE | Seis quantidades de equipamentos e cinco quantidades de baús batem com a alocação documentada e as aberturas/compras registradas. Não equivale a provar autenticidade de todos os eventos do período de escrita econômica vulnerável. |
| Reconciliação completa de XP/moedas | BLOCKED | Permanecem +16XP/+6moedas sem recibo de batalha autoritativo; não confundir esses valores produtivos com as vitórias FIX-PROD-003 do banco de testes. `economic_verified_at` preservado NULL; saldos não alterados. |
| Aparência integral no avatar alvo | BLOCKED | Somente quatro overlays aprovados, espada/couraça para corpo curto/musgo/pele média. Alvo feminino/escuro/longo/azul diverge desse escopo. Não há camada elegível para todos os seis itens; mudar posição/escala não resolve falta de arte compatível. Não se ativou arte arquivada nem se declarou nova aprovação humana. |
| Equipamentos / atributos / persistência desktop e móvel | DONE | 14 verificações reais em Chromium1440/WebKit390, incluindo equipar/desequipar, atributos, reload, posse persistida, ausência de overflow/erro de página. Emulação não é aparelho físico nem prova do encaixe corporal inexistente. |
| Identidade e liderança Teste Chat A | BLOCKED | Dois IDs e papéis cadastrais confirmados pelo histórico; acesso à sessão do Chrome tentou inicializar e falhou em kernel assets. UID autenticado atual não comprovado; não alterar role, líder da Guilda ou Auth. Validação líder/EBD do alvo não executada. |
| Testes e CI | DONE | CI40055780428 success no SHA456f8fb;721PASS/0FAIL/47opt-inSKIP, protocolo25PASS, lint/types/buildPASS. Proposta17PASS separadamente; auditoria SQL em leitura real; Torre14 e browser14PASS. |
| Preview do candidato004 | DONE | dpl_4V3cjstTcne18wUPxNDPjmTM86K2 READY no SHA456f8fb;10checks de Auth/estado/recibos/negações e14checks de navegador aprovados no novo URL, sem concessão. |
| Migrations/publicação produtiva | BLOCKED | Nenhuma migration necessária para a auditoria; nenhuma aplicada em qualquer ambiente. Gates de negócio/identidade/visual não resolvidos impedem produção. Sem DEPLOY_COMPLETE. |

## Economia legada — evidência nova

A tarefa administrativa foi inicialmente identificada como0076 e corrigida para **TASK-0077**; a origem histórica `task-0076-admin-test-profile` foi preservada. Evidências locais existentes em `D:/rpg-jovem-cristao-task-0076/`: contrato `tasks/active/TASK-0077-chat-a-test-profile.md`, relatórios de arquitetura/segurança TASK-0077 e recibo privado `build/task-0076-chat-a/provisioning-evidence.json`. Nenhum backup privado foi copiado para Git.

O recibo registra conferência em 15/10/2026: UUID alvo `31b70059-deca-44c8-a6df-f21ea68b6e42`, proprietário `78729453-8e04-478c-96ae-d37cead1bc8c`, nível50/245000XP/999999moedas, seis itens e500 de cada baú, com autorização administrativa específica e preservação dos outros jogadores. SHA256 do backup privado anterior: `bb91019d04139e47dfd17fc80c9beb5e10efd15a0de2239916b24556f906993a`, recalculado e igual ao registro original nesta tarefa.

| Saldo do alvo | Cálculo documentado | Atual | Lacuna |
| --- | --- | --- | --- |
| XP | 245000 administrativos | 245016 | 16 sem evento autoritativo localizado |
| Moedas | 999999 +7160 das28 aberturas −900 das5 compras | 1006265 | 6 sem evento autoritativo localizado |
| Botas / espada / couraça / escudo | 1 de cada | 1 de cada | Sem diferença quantitativa |
| Elmo | 1 inicial +3 aberturas | 4 | Sem diferença quantitativa |
| Medalhão | 1 inicial +5 aberturas | 6 | Sem diferença quantitativa |
| Baús comum / incomum / raro / épico / extraordinário | 500 /500 /500+5 /500−8 /500−20 | 500 /500 /505 /492 /480 | Sem diferença quantitativa |
| Cartas autorizadas | Catálogo produtivo vazio, sem aquisição oficial | 0 linhas com card_receipt_id | Nenhuma posse de carta foi inferida de equipamento |

O delta16/6 é compatível numericamente com duas vitórias antigas de8XP/3moedas; **compatibilidade não é prova**. Produção tem zero batalhas no ledger autoritativo atual e20 Viajantes sem reconciliação. Há34 operações do alvo sem account_id, compatíveis com registros anteriores à expansão do esquema; não preencher essa identidade ou recibos retroativamente por suposição. O próprio relatório administrativo registrava a vulnerabilidade preexistente de alteração econômica pelo dono, o que impede validar o passado apenas pela leitura do saldo.

Foi entregue `packages/database/deployments/fixprod004/reconciliation-readonly.sql`, exclusivamente SELECT. Executado em produção, retornou `BLOCKED_MISSING_EVENT_PROVENANCE`, deltas16/6 e marca de verificação NULL. Não há DML, grant, ledger novo, reconciliação automática ou migration nesse arquivo. A auditoria permite repetir a comparação depois que uma fonte de eventos válida for apresentada, sem alterar os números atuais. Os outros19 perfis também não foram promovidos a verificados.

## Torre — nova execução hospedada

Somente a identidade de testes existente e sua posse autorizada de sete cartas foram usadas. A sessão iniciou diretamente no andar2 legitimamente liberado, sem repetir migration, starter ou primeiro andar. As ações foram ataque normal e cartas de nível1 autorizadas; nenhum atributo, prêmio ou resultado foi enviado como autoridade pelo cliente.

- Nova batalha: `8ea703ce-5e49-4f6a-acd4-a8b2e6f74767`, andar2.
- Recibo: `cf9d9377-c0f7-4e3b-912d-b994831e0c36`, derrota,0XP/0moedas, prêmio blocked.
-14 verificações PASS: próximo andar persistido, sete cartas já possuídas, início legítimo, ações aceitas, encerramento/recibo, estado exato após reconexão, manutenção do progresso, ausência de crédito e salto ao campeão rejeitado.
- Andares3–7 e campeão não foram executados; não foram classificados PASS.

Para concluir o positivo completo é necessária uma identidade de testes legitimamente elegível, com origem econômica reconciliada, ou progressão normal que alcance o desafio. Copiar recursos do nível50, editar stats, baixar a dificuldade ou editar o progresso não satisfaz esse gate. O usuário forneceu posteriormente a proposta abaixo, autorizando contratos/testes antes de homologação final, expressamente sem liberar créditos reais.

### Proposta recebida e implementada para revisão

| Andar | XP proposto | Moedas propostas | Baú |
| --- | --- | --- | --- |
| 1 | 20 | 10 | — |
| 2 | 30 | 15 | — |
| 3 | 40 | 20 | — |
| 4 | 50 | 25 | — |
| 5 | 60 | 30 | — |
| 6 | 80 | 40 | — |
| 7 | 150 | 75 | 1 épico |

Total **430XP/215moedas/1baú épico fechado**, apenas primeira vitória válida de cada andar; derrota/repetição sem concessão. `TOWER-REWARD-CONTRACT.md`, `tower-rewards.proposal.ts` e teste ficam no diretório fixprod004. O modelo não é importado pelo runtime, não autentica eventos, não grava recibos/saldos e não tem chave de homologação: grant permanece0/0/0 até para campeão ou parâmetros adulterados. A saída hypothetical serve somente à revisão. A identidade da primeira vitória é estável por conta/Viajante/versão da Torre/andar, independente de battleId e versão da tabela. O escopo e o tratamento de vitórias antigas bloqueadas precisam ser confirmados na homologação; não há backfill automático.

Os17 testes isolados cobrem valores exatos, orçamento, sete andares, derrota/repetição, batalha não encerrada, salto/andar antigo, limites/identidade inválidos e tentativa de ativar créditos por campos do chamador. Não provam atomicidade/concorrência de uma integração de pagamento que ainda não foi implementada. Antes da homologação final: ensaiar lock/unicidade transacional, XP/moeda/baú/recibo na mesma transação, rollback, retry, isolamento e origem canônica. Nenhum pagamento real foi implementado. REWORK resolvido: a soma inicialmente informada530/265 estava errada; teste detectou, total corrigido430/215 sem mudar nenhum valor por andar.

## Visual, permissões e testes

O resolver em `equipmentAssets.ts` exige aprovação do corpo e igualdade exata de avatarSource; o registro `equipmentBodyFitV3.ts` contém somente os quatro assets anteriormente aprovados. O bloqueio visual é de ausência de camada aprovada compatível, não de RPC de equipamento. Os hashes/escopos e as preferências do alvo foram preservados. Nenhum novo bitmap ou ativação de overlay foi realizado. Próximo trabalho visual concreto: obter camadas de espada/couraça/elmo/escudo/botas/medalhão para o corpo efetivo, revisar proporção/oclusão/posições em desktop e móvel e registrar aprovação antes da ativação pública.

Teste Chat A ativo permanece `31b70059-deca-44c8-a6df-f21ea68b6e42`, membro; antigo `9b83ca7f-0154-4492-9ad3-1deedb7411f4`, líder, mesma conta/Guilda. A ferramenta CUA retornou `failed to write kernel assets` nesta tarefa. Não foram extraídos tokens de perfis nem alterados privilégios usando somente nome ou UID cadastral. Processo transacional/auditável preparado no FIX-PROD-002 permanece válido como preparação, sem aplicação. Ser proprietário de um avatar líder não altera automaticamente o papel do outro.

Regressão inicial do runtime sem alterações executada no checkout755ac82/f9f7c36:704PASS/0FAIL/47SKIP opt-in, sem contar skips como aprovação; lint/typecheck/build exit0. Para os novos testes da proposta, npm ci reproduziu o lockfile no worktree004, sem atualizar dependências. A primeira suíte da proposta teve720PASS/1FAIL/47SKIP pelo total derivado incorreto; o teste foi corrigido e os17 casos da proposta passaram separadamente. O CI final confirmou o conjunto completo:721PASS/0FAIL/47SKIP,114arquivos aprovados/3opt-inSKIP, protocolo25PASS, lint/typecheck/buildPASS no SHA456f8fb. Os seis PG de recuperação e as migrations já aprovadas do FIX-PROD-003 foram preservados, não reaplicados nem anunciados como nova execução. O teste PostgreSQL afetado, a nova consulta de auditoria, foi executado em leitura real. Navegador14PASS em login real, API/banco reais, Chromium1440 eWebKit390. QA/Security pelo autor, sem independência alegada. Um primeiro executor de navegador tinha caminho de evidência incorreto; corrigido e execução final14/14 exit0, sem mascarar falha de produto.

## Git, URLs e ambientes

Base de trabalho `755ac82` inclui somente encerramento documental sobre `f9f7c36`. Branch isolada `codex/fix-prod-004`, worktree `C:/Users/carlo/rpg-worktrees/fix-prod-004`. Arquivos desta entrega: este relatório, contrato ativo FIX-PROD-004, consulta de auditoria, contrato/modelo/testes isolados da proposta de recompensas e memória raiz. Nenhum arquivo runtime da aplicação ou migration alterado.

Runtime de referência [f9f7c36](https://github.com/CarlosJr30/rpgjovemcristao/commit/f9f7c36b440010a310e3254d5316e8d1cdaed796), [CI aprovado40053526036](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40053526036). Auditoria inicial FIX-PROD-004: b82cccfe9e9c4926b12b2feb2274e32d2b0653cb, CI40055317282 success. Proposta corrigida: [456f8fb0b8f92b87b8f756703d1fadbc2a90a144](https://github.com/CarlosJr30/rpgjovemcristao/commit/456f8fb0b8f92b87b8f756703d1fadbc2a90a144), [CI40055780428 success](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40055780428), job120758335732. Variáveis exclusivas de Preview004 apontam somente ao banco de testes; produção inalterada. Proposta não importada por apps/web ou pela engine, sem concessão no runtime.

- **Preview004 READY**, `dpl_4V3cjstTcne18wUPxNDPjmTM86K2`, SHA456f8fb0b8f92b87b8f756703d1fadbc2a90a144: [abrir Preview004](https://rpgjovemcristao-9gq08yh5r-carlos-junior-s-projects.vercel.app). Criada uma vez após CI aprovado. Dez verificações reais PASS: getUser, sete cartas possuídas, progresso2, vitória antiga com prêmio bloqueado, nova derrota com recibo/0créditos, replay concorrente negado, campos de aprovação/valor do browser rejeitados, outra conta/semAuth negados e saldo preservado. Navegador14/14PASS repetido nesse SHA/URL, Chromium1440 eWebKit390, zero erros/overflow; recompensas da proposta continuam desativadas.
- Preview003 preservada `dpl_C4FfjuYW47CKguqTPTkmWzLDJe9v`/f9f7c36: [abrir Preview anterior](https://rpgjovemcristao-iqdt2cq9o-carlos-junior-s-projects.vercel.app). Foi usada na tentativa legítima de Torre2 e na primeira regressão desta tarefa.
- **Produção existente READY**, `dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv`, main/SHA5edc93f5857b26a59b183e8abfb963110831f90c: [abrir produção](https://rpgjovemcristao-web-inky.vercel.app). Não promovida nesta tarefa.
- Supabase testes `wkdvdzfkbwvhyjmamrsg`, protocolo3,21migrations, última20261024021946; produção `wspafhlbtlpabypzymjo`, protocolo3,4migrations, última20261023213654. Nenhuma migration nova, reexecução, alteração de variável produtiva ou escrita produtiva realizada.
- Estado produtivo inicial:20Viajantes,37inventário,37recibos,0batalhas,0cartas; total245376XP/1006767moedas. O alvo e seus seis equipamentos permaneceram preservados. Testes de derrota nesta tarefa afetam somente o jogador isolado de testes.

Evidências locais ignoradas em `build/fix-prod-004/` no novo worktree: `admin-baseline-proof.json`, `tower.json`, `tower-process.json`, `unit.json`, `gates.json`, `browser.json`, `unit-proposal.json`, `proposal-approved.json`, `gates-proposal.json`, `ci-proposal.json`, `preview.json`, `preview-checks.json`, `preview-checks-process.json`, `browser-preview.json` e screenshots. Backups/credenciais do histórico permanecem nos locais privados originais. Nenhuma senha, token ou chave privada foi incluída.

Conferência final: teste tem18batalhas encerradas,16XP/6moedas, zero créditos de derrota,21migrations. Produção mantém20Viajantes/37inventário/37recibos, totais245376XP/1006767moedas; alvo nível50/245016XP/1006265moedas/membro/ativo/economic_verifiedNULL, zero tabelas públicas semRLS. A operação desta tarefa em produção foi somente leitura. Não solicitar homologação final de recompensas nem executar promoção enquanto os gates abaixo não forem concluídos. O encerramento documental posterior não altera o artefato candidato456f8fb e não exige outro deployment.

## Próximas condições de desbloqueio

1. Fornecer prova autorizada dos eventos que geraram os16XP/6moedas restantes, ou definir procedimento administrativo auditável para tratar o delta sem apagar o saldo original; revisar os demais perfis antes de promover legado.
2. Concluir integração e testes transacionais da proposta econômica, usar identidade elegível legítima para vitórias2–7/campeão, reconexão e idempotência e somente então solicitar homologação final; não criar progresso artificial nem liberar créditos antes disso.
3. Disponibilizar/revisar arte compatível com o corpo real do alvo; não atribuir aprovação humana a imagens não revisadas.
4. Restabelecer acesso à sessão autenticada do alvo, conferir getUser/UID e executar somente o procedimento de liderança aprovado com auditoria e testes Guilda/EBD.
5. Após resolver esses gates, testar alterações, CI do SHA, recuperação/migrations quando necessárias, Preview e fluxos reais; só então promover automaticamente e conferir produção. Nenhuma das condições ausentes foi tratada como concluída.
