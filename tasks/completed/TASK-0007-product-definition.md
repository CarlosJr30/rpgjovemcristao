# TASK-0007 → Viajante, Quiz e contrato de fase

ID: TASK-0007
TITLE: Atualização oficial de produto após TASK-0006
OBJECTIVE: Consolidar as decisões do usuário em fontes únicas e consistentes.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Fontes necessárias em docs/game-design, docs/biblical, análise de impacto em docs/architecture, projeto/roadmap e memória.
OUT_OF_SCOPE: Código, aplicação, schema, banco, dependências, implementação de personagem/Quiz/talentos, fases completas e próxima tarefa.
DEPENDENCIES: TASK-0006 concluída.
ASSIGNED_AGENT: ORCHESTRATOR; perfis GAME DESIGN, ARCHITECT, BIBLICAL CONTENT e SECURITY assumidos localmente; PRODUCT pelo orquestrador, sem perfil dedicado. Revisões pelo autor, sem independência.
REQUIRED_CONTEXT: AGENTS, GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, ORCHESTRATOR, TOKEN_POLICY, RULES, SECURITY; TASK-0006, fontes atuais e procedimentos dos perfis selecionados.
SECURITY_CONSIDERATIONS: Revisão documental de autoridade, concessões/replay, privacidade e integração externa pendente; nenhum acesso a serviço ou dado real.

## Autorização e ownership

Orquestrador autoriza os perfis locais a atualizar somente as fontes acima dentro do pedido. Não há delegação. TASK-0007 era apenas recomendação sem contrato; este pedido usa o ID disponível. Detalhamento do slice passa à recomendação TASK-0008, não contratada.

## ACCEPTANCE_CRITERIA

1. Personagem inicial único denominado provisoriamente Viajante, nível 1 e base igual.
2. Sem classe/especialização inicial; escolha anterior SUPERSEDED; retorno exige decisão explícita.
3. Quatro atributos mecânicos com limites espirituais explícitos.
4. Evolução pela jornada e criação visual separada da conta/comunidade.
5. Quiz Bíblico obrigatório em cada fase principal com capacidades futuras registradas.
6. Quiz distinto de reflexão e grande desafio.
7. Consulta bíblica sem penalidade ou impedimento de recompensa.
8. Recompensas/replay sem farming infinito e sem valores finais.
9. Contrato completo de fase com ordem flexível.
10. Oito atos como direção refinável; slice Gênesis 2–3 preservado.
11. Treze áreas de impacto analisadas; revisões exigidas, memória e fontes consistentes.

## TEST_PLAN

Inspeção cruzada e cenários de mesa; busca de regras antigas; UTF-8 estrito e links locais; comparação SHA-256 com baseline de 122 arquivos existentes (excluídos .git, node_modules e .next). Git está untracked na entrada, portanto diff não basta. Registrar resultados reais e limitações.

## DEFINITION_OF_DONE

Aceite e revisões documentais aprovados; memória atualizada; contrato em completed. Build/lint/typecheck/unit/integration N/A por ausência de mudança executável. Nenhuma alegação de playtest ou validação de segurança implementada.

## Revisão e aceite — 2026-09-17

Fluxo: BACKLOG → ACTIVE → REWORK → ACTIVE → VALIDATING → DONE após aceite. Uma edição por pipe Python recebeu texto ASCII do PowerShell e interrompeu a substituição da campanha, deixando uma palavra com `?`. Corrigida a codificação do pipe para UTF-8, refeito o trecho e verificados todos os documentos alterados. Nenhuma mudança executável decorreu da falha.

| Revisão pelo orquestrador/autor, sem independência | Resultado e evidência |
| --- | --- |
| GAME DESIGN | PASS documental: personagem sem escolha de classe, base igual, cosméticos sem vantagem; Quiz distinto de reflexão/desafio; prêmio principal único e bônus futuro limitado. Nome/atributos provisórios não autorizam balanceamento ou árvore de talentos |
| PRODUCT | PASS documental: índice MVP aponta fontes por assunto, atos são direção refinável e slice permanece fase 1.1. Exatamente uma próxima recomendação; sem execução ou contratação da TASK-0008 |
| ARCHITECT | PASS documental: 13 áreas na seção TASK-0007 do impacto; dados anteriores tratados como histórico; ausência de equivalência presumida com stats de combate, sorteio fixado e resultado/recorde/concessão atômicos. Não escolhe schema nem troca stack |
| BIBLICAL CONTENT | PASS documental: regras de perguntas/gabaritos/distratores e explicações adicionadas ao gate editorial; Sabedoria não espiritual; consulta livre. Sem afirmação bíblica nova, citação literal ou perguntas prontas; Gênesis 2–3 apenas conserva recorte fornecido pelo usuário. Pesquisa exegética e licença não declaradas aprovadas |
| SECURITY | PASS documental pelo perfil local: cliente sem autoridade sobre score/prêmio; ownership, retry e concessão única preservados; consulta não é trapaça; ranking/retenção/integração não autorizados. Nenhum achado alto/crítico nesta mudança; controles executáveis e exceções anteriores não reavaliados |
| QA estrutural | PASS pelo autor: documentação sem mudança executável, múltiplos módulos implementados ou integração; revisão estrutural permitida pelo workflow. UTF-8, links, busca de conflitos e hashes abaixo; sem alegação de QA independente |

### Matriz de aceite

| Critério | Evidência / resultado |
| --- | --- |
| 1. Personagem inicial | CHARACTER-SYSTEM, Criação e classes: Viajante provisório, nível 1 e configuração comum — PASS |
| 2. Ausência de classes | CHARACTER-SYSTEM e DEC-024: escolha anterior SUPERSEDED, retorno exige decisão explícita — PASS |
| 3. Atributos | CHARACTER-SYSTEM: Vigor, Percepção, Destreza, Sabedoria e seus limites — PASS |
| 4. Jornada | CHARACTER-SYSTEM: evolução, equipamentos, talentos, build, exploração e recompensas; conta/comunidade separadas — PASS |
| 5. Quiz por fase | QUIZ-SYSTEM: banco, sorteio, alternativas, resposta, explicação, referência, pontuação, recorde, replay, dificuldade, antifarming e cerca de 10 perguntas configuráveis — PASS |
| 6. Quiz/reflexão | CORE-GAMEPLAY-LOOP: quatro pilares distintos, reflexão sem nota espiritual — PASS |
| 7. Bíblia no Quiz | QUIZ-SYSTEM: consulta livre sem perda de pontos/prêmio; integração e licença pendentes — PASS |
| 8. Prêmios/replay | QUIZ-SYSTEM e CHARACTER-SYSTEM: possibilidades, principal único, bônus limitado futuro, sem valores finais — PASS |
| 9. Contrato de fase | CORE-GAMEPLAY-LOOP: dez elementos e ordem flexível — PASS |
| 10. Campanha | CAMPAIGN-STRUCTURE: oito atos refináveis, fase 1.1 Gênesis 2–3, sem fases completas — PASS |
| 11. Impactos e consistência | CENTRAL-DYNAMICS-IMPACT, MVP, projeto e memória alinhados; histórico preservado — PASS |

### Cenários de mesa inspecionados

- Dois novos personagens com avatares distintos: mesma base; nenhuma vantagem pela aparência.
- Reflexão pulada, opinião pessoal diferente ou erro no Quiz: não há julgamento de fé; explicação do erro é objetiva. Nota mínima/desbloqueio por Quiz permanecem pendentes, sem regra inventada.
- Consulta bíblica durante Quiz: mesmos direitos de pontos, recorde e prêmio.
- Replay com nota menor: mantém recorde/conclusão, sem repagar principal. Melhoria só admite bônus por política futura limitada; troca de versão/dificuldade não reabre farming.
- Reconexão ou envio repetido: conserva sorteio/estado e recibo; concorrência não concede dois prêmios.
- Quiz completo: não substitui grande desafio. Ato VII/VIII não aprova roteiro integral nem cânone alternativo.

### Verificações executadas

- Baseline SHA-256 via PowerShell sobre 122 arquivos existentes, excluídos .git, node_modules e .next; comparação posterior via hashlib: 10 documentos existentes modificados, 112 arquivos preservados, nenhum removido. Dois Markdown novos: Quiz e contrato. Nenhum arquivo não documental alterado, incluindo aplicação, configurações, lockfile, testes e modelo/schema existente.
- Leitura UTF-8 estrita e resolução de links Markdown locais em 12 documentos: zero erros. Busca adicional por caracteres de substituição e palavras interrompidas por `?`: zero ocorrências após correção.
- `rg` por classes pendentes, exclusão de Quiz e IDs TASK-0007/0008 nas fontes vigentes: nenhuma regra antiga ativa; referências anteriores permanecem apenas em histórico ou decisões explicitamente superadas.
- Inspeção manual das fontes e cenários acima: sem secrets, dados pessoais reais, valores finais novos ou autorização de implementação.

### Definition of Done

| Check | Resultado |
| --- | --- |
| BUILD / LINT / TYPECHECK | N/A: alteração exclusivamente documental; não executados |
| UNIT / INTEGRATION TEST | N/A: nenhuma lógica ou integração executável alterada |
| ACCEPTANCE CRITERIA | PASS: matriz acima |
| SECURITY REVIEW | PASS documental pelo autor, sem independência ou teste de implementação |
| DOCUMENTATION UPDATED | PASS: fontes, projeto/roadmap, decisões, changelog e estado |
| NO SECRETS | PASS: inspeção do conteúdo produzido |
| NO KNOWN CRITICAL REGRESSIONS | PASS documental e arquivos fora do escopo preservados; riscos prévios mantidos |

## Documentos entregues

Criados: [Quiz](../../docs/game-design/QUIZ-SYSTEM.md) e este contrato.

Atualizados: [personagem](../../docs/game-design/CHARACTER-SYSTEM.md), [loop](../../docs/game-design/CORE-GAMEPLAY-LOOP.md), [campanha](../../docs/game-design/CAMPAIGN-STRUCTURE.md), [MVP](../../docs/game-design/MVP.md), [conteúdo bíblico](../../docs/biblical/README.md), [impacto](../../docs/architecture/CENTRAL-DYNAMICS-IMPACT.md), [projeto/roadmap](../../projects/RPG-JOVEM-CRISTAO.md), [estado](../../.agent/memory/CURRENT_STATE.md), [decisões](../../.agent/memory/DECISIONS.md) e [changelog](../../.agent/memory/CHANGELOG.md).

## Pendências e próxima tarefa

Nome final do Viajante e atributos provisórios; fórmulas/base/crescimento, equipamentos/talentos/build, valores econômicos; roteiro e grande desafio; perguntas, critérios de conclusão/desbloqueio, dificuldade, comparabilidade de recordes e teto/política de bônus; revisão de modelo/autosave/UI; público, privacidade, retenção, licença e integração externa. Nada disso é requisito para aceitar esta consolidação documental, nem autorização de implementação.

Única próxima TASK recomendada: **TASK-0008 — especificar documentalmente a fase 1.1 O Jardim e a Escolha**, incluindo enquadramento editorial, objetivos, exploração, reflexão, Quiz, grande desafio, recompensas, Codex, retomada e critérios de aceite. Não contratada nem iniciada.
