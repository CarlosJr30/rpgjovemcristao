# FIX-PROD-004 — Torre e pendências de produção

**Estado: BLOCKED. Produção não publicada nem modificada nesta tarefa.** Referência runtime `f9f7c36b440010a310e3254d5316e8d1cdaed796`; branch documental FIX-PROD-003 `755ac82b6c6f245776281ff5e16bc2df19bcfd54`. Estado remoto conferido antes do trabalho em 24/10/2026 UTC. Resultados aprovados do FIX-PROD-003 foram preservados; nenhuma migration foi reaplicada.

## Aceite por item

| Item | Estado | Resultado real / causa |
| --- | --- | --- |
| Preservação e conferência de ambientes | DONE | GitHub main5edc93f, Preview f9f7c36 READY, produção5edc93f READY; Supabase testes21 migrations/prod4. Worktrees e alterações prévias preservadas. |
| Retomada e tentativa legítima Torre2 | DONE | Sessão real retomou nextFloor2. Nova batalha legítima terminou em derrota, emitiu recibo, manteve andar2 e não creditou recursos. Reconexão confirmou exatamente o estado encerrado. |
| Vitórias Torre2–7 / campeão | BLOCKED | Conta de testes permanece nível1/16XP, só botas legitimamente possuídas. Derrota real no andar2 impede entrada legítima no3. Não se reduziram adversários nem se concederam nível, XP, equipamentos ou seed para fabricar vitória. |
| Recompensas / recibos da Torre | BLOCKED | Recibo de derrota conferido e sem créditos; positivo de concessão continua sem tabela/fontes/limites homologados. Servidor conserva `tower-economy-unapproved`, inclusive para vitória anterior no andar1. Informação de prêmios solicitada ao usuário; não inventada nem liberada. |
| Proteção contra salto de andar | DONE | Tentativa de iniciar campeão/andar7 foi rejeitada com HTTP403 e não alterou o progresso. |
| Proveniência administrativa do alvo | DONE | Localizados contrato TASK-0077, relatório e recibo privado da operação original; hash do backup privado confere com o recibo de provisionamento. Isso supera a ausência de evidência de origem da concessão inicial, sem provar eventos posteriores. |
| Conferência aritmética de itens e baús | DONE | Seis quantidades de equipamentos e cinco quantidades de baús batem com a alocação documentada e as aberturas/compras registradas. Não equivale a provar autenticidade de todos os eventos do período de escrita econômica vulnerável. |
| Reconciliação completa de XP/moedas | BLOCKED | Permanecem +16XP/+6moedas sem recibo de batalha autoritativo; não confundir esses valores produtivos com as vitórias FIX-PROD-003 do banco de testes. `economic_verified_at` preservado NULL; saldos não alterados. |
| Aparência integral no avatar alvo | BLOCKED | Somente quatro overlays aprovados, espada/couraça para corpo curto/musgo/pele média. Alvo feminino/escuro/longo/azul diverge desse escopo. Não há camada elegível para todos os seis itens; mudar posição/escala não resolve falta de arte compatível. Não se ativou arte arquivada nem se declarou nova aprovação humana. |
| Equipamentos / atributos / persistência desktop e móvel | DONE | 14 verificações reais em Chromium1440/WebKit390, incluindo equipar/desequipar, atributos, reload, posse persistida, ausência de overflow/erro de página. Emulação não é aparelho físico nem prova do encaixe corporal inexistente. |
| Identidade e liderança Teste Chat A | BLOCKED | Dois IDs e papéis cadastrais confirmados pelo histórico; acesso à sessão do Chrome tentou inicializar e falhou em kernel assets. UID autenticado atual não comprovado; não alterar role, líder da Guilda ou Auth. Validação líder/EBD do alvo não executada. |
| Testes locais afetados | DONE | 704 PASS / 0 FAIL / 47 opt-in não executados nessa suíte; lint/types/build exit0. SQL diagnóstico testado contra dados reais somente em leitura; Torre14 e browser14 verificações aprovadas. |
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

Para concluir o positivo completo é necessária uma identidade de testes legitimamente elegível, com origem econômica reconciliada, ou progressão normal que alcance o desafio. Copiar recursos do nível50, editar stats, baixar a dificuldade ou editar o progresso não satisfaz esse gate. A regra de recompensas precisa definir valores, fonte, primeira vitória/repetição/limites e recibo antes de implementar concessão. A tarefa atual não fornece esses valores.

## Visual, permissões e testes

O resolver em `equipmentAssets.ts` exige aprovação do corpo e igualdade exata de avatarSource; o registro `equipmentBodyFitV3.ts` contém somente os quatro assets anteriormente aprovados. O bloqueio visual é de ausência de camada aprovada compatível, não de RPC de equipamento. Os hashes/escopos e as preferências do alvo foram preservados. Nenhum novo bitmap ou ativação de overlay foi realizado. Próximo trabalho visual concreto: obter camadas de espada/couraça/elmo/escudo/botas/medalhão para o corpo efetivo, revisar proporção/oclusão/posições em desktop e móvel e registrar aprovação antes da ativação pública.

Teste Chat A ativo permanece `31b70059-deca-44c8-a6df-f21ea68b6e42`, membro; antigo `9b83ca7f-0154-4492-9ad3-1deedb7411f4`, líder, mesma conta/Guilda. A ferramenta CUA retornou `failed to write kernel assets` nesta tarefa. Não foram extraídos tokens de perfis nem alterados privilégios usando somente nome ou UID cadastral. Processo transacional/auditável preparado no FIX-PROD-002 permanece válido como preparação, sem aplicação. Ser proprietário de um avatar líder não altera automaticamente o papel do outro.

Testes do runtime sem alterações foram executados no checkout755ac82/f9f7c36 com dependências já instaladas do lockfile, preservando as worktrees. Nenhuma dependência instalada/atualizada nesta tarefa. A suíte teve704PASS/0FAIL/47SKIP opt-in, sem contar skips como aprovação; lint/typecheck/build exit0. Os seis PG de recuperação e as migrations já aprovadas do FIX-PROD-003 foram preservados, não reaplicados nem anunciados como nova execução. O teste PostgreSQL afetado, a nova consulta de auditoria, foi executado em leitura real. Navegador14PASS em login real, API/banco reais, Chromium1440 eWebKit390. QA/Security pelo autor, sem independência alegada. Um primeiro executor de navegador tinha caminho de evidência incorreto; corrigido e execução final14/14 exit0, sem mascarar falha de produto.

## Git, URLs e ambientes

Base de trabalho `755ac82` inclui somente encerramento documental sobre `f9f7c36`. Branch isolada `codex/fix-prod-004`, worktree `C:/Users/carlo/rpg-worktrees/fix-prod-004`. Arquivos desta entrega: este relatório, contrato ativo FIX-PROD-004, consulta de auditoria e memória raiz. Nenhum arquivo runtime da aplicação ou migration alterado.

Runtime candidato continua [f9f7c36](https://github.com/CarlosJr30/rpgjovemcristao/commit/f9f7c36b440010a310e3254d5316e8d1cdaed796), [CI aprovado40053526036](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40053526036). O commit FIX-PROD-004 de auditoria/documentação é publicado separadamente; seu CI deve ser consultado pelo SHA exato e registrado no contrato. Como não muda artefato publicável, não criar deployment artificial apenas para encerrar documentação, conforme RELEASE_POLICY.

- **Preview existente READY**, `dpl_C4FfjuYW47CKguqTPTkmWzLDJe9v`, SHAf9f7c36: [abrir Preview](https://rpgjovemcristao-iqdt2cq9o-carlos-junior-s-projects.vercel.app). Novos testes reais executados nessa URL.
- **Produção existente READY**, `dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv`, main/SHA5edc93f5857b26a59b183e8abfb963110831f90c: [abrir produção](https://rpgjovemcristao-web-inky.vercel.app). Não promovida nesta tarefa.
- Supabase testes `wkdvdzfkbwvhyjmamrsg`, protocolo3,21migrations, última20261024021946; produção `wspafhlbtlpabypzymjo`, protocolo3,4migrations, última20261023213654. Nenhuma migration nova, reexecução, alteração de variável produtiva ou escrita produtiva realizada.
- Estado produtivo inicial:20Viajantes,37inventário,37recibos,0batalhas,0cartas; total245376XP/1006767moedas. O alvo e seus seis equipamentos permaneceram preservados. Testes de derrota nesta tarefa afetam somente o jogador isolado de testes.

Evidências locais ignoradas em `build/fix-prod-004/` no novo worktree: `admin-baseline-proof.json`, `tower.json`, `tower-process.json`, `unit.json`, `gates.json`, `browser.json` e screenshots. Backups/credenciais do histórico permanecem nos locais privados originais. Nenhuma senha, token ou chave privada foi incluída.

## Próximas condições de desbloqueio

1. Fornecer prova autorizada dos eventos que geraram os16XP/6moedas restantes, ou definir procedimento administrativo auditável para tratar o delta sem apagar o saldo original; revisar os demais perfis antes de promover legado.
2. Definir contrato econômico das recompensas da Torre e usar identidade elegível legítima para vitórias2–7/campeão, reconexão e idempotência; não criar progresso artificial.
3. Disponibilizar/revisar arte compatível com o corpo real do alvo; não atribuir aprovação humana a imagens não revisadas.
4. Restabelecer acesso à sessão autenticada do alvo, conferir getUser/UID e executar somente o procedimento de liderança aprovado com auditoria e testes Guilda/EBD.
5. Após resolver esses gates, testar alterações, CI do SHA, recuperação/migrations quando necessárias, Preview e fluxos reais; só então promover automaticamente e conferir produção. Nenhuma das condições ausentes foi tratada como concluída.
