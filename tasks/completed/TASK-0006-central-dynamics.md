# TASK-0006 → Consolidação da dinâmica central

ID: TASK-0006
TITLE: Leis do jogo e início em Gênesis
OBJECTIVE: Consolidar fontes oficiais de produto e registrar impactos sem implementação.
PRIORITY: P1 High
STATUS: DONE
SCOPE: docs/game-design, docs/biblical, análise de impacto e avisos em docs/architecture e ADR-0002, projects/RPG-JOVEM-CRISTAO.md, memória e este contrato.
OUT_OF_SCOPE: Código, schema, migrations, banco, dependências, auth/RBAC, integrações, minigames executáveis, Bíblia/Codex completos e próxima tarefa.
DEPENDENCIES: TASK-0003, TASK-0004 e TASK-0005 concluídas; novo pedido substitui o recorte anterior.
ASSIGNED_AGENT: ORCHESTRATOR com GAME DESIGN; revisores BIBLICAL CONTENT, ARCHITECT, SECURITY e QA; PRODUCT assumido pelo orquestrador, pois não há perfil local dedicado.
REQUIRED_CONTEXT: AGENTS, GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, ORCHESTRATOR, RULES, SECURITY, TOKEN_POLICY; design existente; modelo e invariantes apenas para impactos.
SECURITY_CONSIDERATIONS: Associação comunitária, autorização de líderes, minimização de dados, isolamento entre comunidades e concessão idempotente; revisão documental obrigatória.

## Autorização e ownership

Orquestrador edita documentos de design/projeto/memória e registra contrato. Autoriza BIBLICAL CONTENT a editar docs/biblical; ARCHITECT a editar somente análise de impacto e avisos de precedência técnica. SECURITY/QA revisam sem alterar produto. Revisões de GAME DESIGN e PRODUCT pelo autor; demais independentes quando delegadas. Nenhuma permissão para código ou schema.

## ACCEPTANCE_CRITERIA

- Oito assuntos têm fonte oficial única e referências; campanha começa em Gênesis 2–3, fase 1.1 O Jardim e a Escolha.
- Neemias explicitamente SUPERSEDED como início; histórico preservado; batalha opcional e classes pendentes.
- Missões automáticas/comunitárias, liderança, progressão, replay, Codex e grandes desafios coerentes, sem pontuação espiritual ou pay-to-win.
- Classificação por unidade, referência bíblica e limites canônicos; sem aprovação tácita de roteiro ainda inexistente.
- Impactos em MVP, arquitetura e entidades solicitadas documentados sem alterar schema/código.
- Revisões dos seis perfis, evidências e limitações registradas; memória/roadmap atualizados; exatamente uma próxima tarefa recomendada.

## TEST_PLAN

- Inspeção cruzada de fontes e busca de regras antigas: nenhuma regra superseded apresentada como atual.
- Validar links locais e UTF-8 dos documentos alterados.
- Comparar hashes de apps/packages/tests e arquivos técnicos para assegurar escopo documental.
- Revisão de mesa: sem igreja, recusa/reenvio, aprovações concorrentes, replay, falha do desafio e fidelidade canônica.

## DEFINITION_OF_DONE

Aceite documental comprovado, revisões aplicáveis aprovadas, memória atualizada e contrato movido para completed. Diversão, acessibilidade real e segurança implementada exigem validação futura; não alegar playtest.

## Revisões e evidências — 2026-09-16

Fluxo realizado: ACTIVE → VALIDATING → DONE após verificações abaixo. Nenhuma falha de aceite encontrada; REWORK não necessário.

| Perfil / autoria | Resultado documental | Evidência e limite |
| --- | --- | --- |
| GAME DESIGN — orquestrador/autor | PASS | Inspeção de loop, missões, personagem, campanha e Codex: objetivos principais in-game, replay sem farming, desafio obrigatório por fase, combate opcional, curva pendente sem herdar números antigos. Diversão é hipótese a testar |
| BIBLICAL CONTENT — subagente biblical e revisão final pelo autor | PASS | Subagente atualizou README e revisou loop/missões; revisão cruzada final pelo autor inclui campanha/Codex. Nenhum roteiro, citação ou unidade CANONICAL nova aprovada. Referências Gênesis 2–3, 2:15–3:24 e 2–5 são recortes/exemplos do pedido, não pesquisa exegética. Subagente encerrou por limite de uso antes da revisão final; não alegar independência integral |
| ARCHITECT — subagente architecture, independente da redação de gameplay | PASS | CENTRAL-DYNAMICS-IMPACT e avisos técnicos; battle_id obrigatório, etapas fixas, ACTIVE global, ator diferente do beneficiário e revogação concorrente identificados. Stack preservada |
| SECURITY — orquestrador sob perfil local, sem independência | PASS documental | MISSION-SYSTEM e impacto: deny by default, autorização por comunidade/ação, sem autoaprovação, revogação/retry reautorizados, decisão e prêmio atômicos, sem coleta íntima obrigatória. Nenhum achado alto/crítico aberto no escopo documental; implementação/políticas continuam gates futuros |
| PRODUCT — orquestrador/autor, sem perfil local dedicado | PASS | Oito assuntos mapeados em MVP; acesso solo separado; Genesis atual, Neemias histórico; nenhuma nova classe/integração/monetização escolhida. Visão e roadmap atualizados |
| QA — orquestrador sob perfil local, sem independência | PASS documental | Leitura cruzada e cenários de mesa abaixo; links, codificação e hashes verificados. Nenhum playtest ou teste executável alegado |

### Cenários revisados

| Cenário | Resultado esperado e evidência de design |
| --- | --- |
| Jogador sem igreja ou líder indisponível | Campanha avança por objetivos in-game; MISSION-SYSTEM e CORE-GAMEPLAY-LOOP |
| Recusa e reenvio | Sem prêmio/perda anterior; nova submissão identificável e decisão atrasada não afeta a nova; MISSION-SYSTEM e impacto |
| Aprovação concorrente/repetida ou resposta perdida | Uma concessão; conflito ou recibo, nunca segundo pagamento; MISSION-SYSTEM/CHARACTER-SYSTEM |
| Líder de outra comunidade, autoaprovação ou revogado | Negar; revalidar vínculo inclusive commit/retry; impacto exige protocolo futuro de concorrência |
| Reflexão pulada/opinião distinta | Sem efeito em XP/acesso; CORE-GAMEPLAY-LOOP |
| Falha, ajuda e replay | Retry/checkpoint, sem perda permanente, conclusão preservada, descoberta inédita única; loop/campanha/personagem |
| Puzzle no Jardim ou precisão em história de Davi | Não altera desfecho nem substitui protagonista; campanha e regras bíblicas |
| Mobile e dificuldade | Critérios de toque/teclado/360 px/pausa e desafio significativo documentados; avaliação real futura |

### Verificações executadas

- PowerShell: leitura UTF-8 estrita e resolução dos links Markdown locais de 22 documentos no escopo → 22 legíveis, 0 links quebrados.
- SHA-256 antes/depois dos 41 arquivos existentes em apps/packages/tests, excluídos artefatos node_modules/.next → 0 arquivos alterados. Operações desta tarefa limitaram-se à documentação; nenhum comando de instalação/build/migration ou edição de configuração foi executado.
- Busca `rg` por Neemias, três missões e IDs de tarefa no MVP/projeto/estado → referências anteriores identificadas como históricas/SUPERSEDED, próximo passo coerente.
- Repositório já estava inteiramente untracked na entrada; `git diff` não é evidência suficiente nesta sessão. Histórico preservado em quatro documentos com links ajustados e aviso SUPERSEDED.
- Anexo reenviado pelo usuário tem mesmo SHA-256 do pedido inicial; escopo preservado.

### Definition of Done

| Check | Resultado |
| --- | --- |
| BUILD / LINT / TYPECHECK | N/A nesta mudança exclusivamente documental; resultados históricos do bootstrap não foram reapresentados como execução atual |
| UNIT / INTEGRATION TEST | N/A: nenhuma lógica ou fronteira executável alterada |
| ACCEPTANCE CRITERIA | PASS: oito fontes, novo slice, histórico, impactos e seis revisões documentados |
| SECURITY REVIEW | PASS documental pelo autor; controles executáveis não avaliados |
| DOCUMENTATION UPDATED | PASS: fontes, precedência técnica, projeto/roadmap e memória |
| NO SECRETS | PASS: inspeção do conteúdo criado/alterado, somente regras, caminhos e referências públicas |
| NO KNOWN CRITICAL REGRESSIONS | PASS no escopo documental; código preservado; riscos anteriores do bootstrap não reavaliados |

## Arquivos entregues

Criados: MISSION-SYSTEM.md, CODEX-COLLECTION.md, CENTRAL-DYNAMICS-IMPACT.md, quatro históricos em docs/game-design/history e este contrato. Atualizados: MVP.md, CORE-GAMEPLAY-LOOP.md, CHARACTER-SYSTEM.md, CAMPAIGN-STRUCTURE.md, BATTLE-SYSTEM.md, docs/biblical/README.md, DATA-MODEL.md, DATABASE-RULES.md, ADR-0002, projeto, CURRENT_STATE, DECISIONS e CHANGELOG.

## Pendências e próxima tarefa

Roteiro/enquadramento em Gênesis, grande desafio, balanceamento/economia/equipamento, classes, entradas iniciais/nome do Codex, políticas comunitárias/piloto e licença portuguesa permanecem pendentes nos respectivos gates. Única próxima tarefa recomendada: TASK-0007 — especificar documentalmente a fase 1.1 O Jardim e a Escolha, incluindo objetivos, exploração, desafio, recompensas, Codex e aceite. Não iniciada.

