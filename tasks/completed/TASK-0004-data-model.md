# TASK-0004 → Modelagem do banco do MVP
ID: TASK-0004
TITLE: Modelo conceitual e invariantes de persistência
OBJECTIVE: Documentar entidades, relações, ownership e contratos transacionais do MVP PostgreSQL/Drizzle.
PRIORITY: P1 High
STATUS: DONE
SCOPE: docs/architecture/DATA-MODEL.md; docs/architecture/DATABASE-RULES.md; ADR se necessário; este contrato; memória; atualização pontual do roadmap.
OUT_OF_SCOPE: Instalações, npm/npx, schema TypeScript, SQL executável, migrations, banco, API, auth, engine e próxima tarefa.
DEPENDENCIES: TASK-0002, TASK-0003 (concluídas)
ASSIGNED_AGENT: ORCHESTRATOR; perfis DATABASE, ARCHITECT, BACKEND, SECURITY e QA assumidos localmente pelo mesmo autor.
REQUIRED_CONTEXT: AGENTS; GLOBAL_CONTEXT; CURRENT_STATE; WORKFLOW; ORCHESTRATOR; TOKEN_POLICY; RULES; SECURITY; projeto; TECH-STACK; MVP; CHARACTER-SYSTEM; BATTLE-SYSTEM; CAMPAIGN-STRUCTURE; CORE-GAMEPLAY-LOOP para retomada; ADR-0001; perfis/procedimentos selecionados; memória para atualização.
SECURITY_CONSIDERATIONS: Autorização por proprietário, dados privados, manipulação de estado, enumeração, concorrência e concessão duplicada exigem revisão SECURITY documental.
ACCEPTANCE_CRITERIA:
- Analisar todas as entidades solicitadas, inclusive as representadas por projeções ou especializações; justificar extras.
- Definir cardinalidades, campos, ownership, FKs, constraints, índices e fronteiras content/progress.
- Cobrir retomada, falha/retry, concorrência, concessão única e isolamento entre usuários sem alterar gameplay.
- Modelar classificação/referências por unidade, sem texto protegido; registrar pendências de produto.
- Registrar validações dos quatro especialistas, QA, limitações, memória e exatamente uma próxima tarefa.
TEST_PLAN:
- Inspeção documental contra os critérios e cenários adversariais de DATABASE-RULES; registrar resultados por perfil.
- Checar links locais, IDs/status, arquivos entregues e ausência de artefatos executáveis novos.
DEFINITION_OF_DONE:
- Critérios e gates documentais aprovados, nenhum achado alto/crítico aberto, memória atualizada e contrato movido a completed.

## Autorização e escopo dos perfis

Pedido atual seleciona modelagem para TASK-0004, substituindo a recomendação ainda não contratada de políticas. Políticas permanecem pendentes antes do piloto. ORCHESTRATOR autoriza DATABASE/BACKEND a documentar nos dois arquivos de arquitetura e SECURITY/QA a registrar parecer neste contrato. ARCHITECT cobre ADR e fronteiras; ORCHESTRATOR mantém tarefa, memória e roadmap. Não há delegação nem revisão independente.

## SELF VALIDATE e pareceres — 2026-09-16

Todas as revisões abaixo foram feitas pelo mesmo autor assumindo os perfis locais. PASS indica coerência documental, não execução de banco ou proteção já instalada.

| Perfil | Verificação e evidência | Resultado |
| --- | --- | --- |
| DATABASE | DATA-MODEL: tabelas de entidades e chaves; relações 1:1 e 1:N; PK de posse/progresso; FKs compostas vinculam encontro/missão, grant/batalha e posse/origem. Nível/stats/progresso derivados; XP e snapshots são redundâncias justificadas. DATABASE-RULES DB-01..13 e revisão de mesa cobrem integridade | PASS documental |
| ARCHITECT | Identidade não contém gameplay; engine não depende de banco; aplicação coordena transação via portas. Boss/Inventory/PlayerProgress/CharacterStats/BattleTurn não viram subsistemas ou tabelas sem necessidade. ADR-0002 registra decisão nova de serialização/estado mínimo, sem repetir escolha da stack | PASS documental |
| BACKEND | Casos de criação, início, cena, desafio, rodada, retry, abandono, equipamento e finalização têm persistência e fronteiras definidas. Recibo consultado antes de versão vencida; chave reaproveitada com intenção diferente falha; resposta perdida recupera resultado | PASS documental |
| SECURITY | Risco alto de acesso cruzado: mitigação especificada por predicado de dono e FKs compostas; risco alto de mass assignment/progressão forjada: allowlist + engine; risco alto de duplicação: grant/recibo/lock/commit indivisível. Conferidos cenários de A/B, duas abas e rollback. Nenhum achado alto/crítico documental aberto | PASS documental |
| QA | Gate aplicado por afetar vários módulos conceituais. Revisão dos 14 cenários em DATABASE-RULES: sucesso, falhas, versão, origem, concessão, abandono, retomada e imutabilidade coerentes com loop/MVP. Totais M1/M2/M3: 100/200/300 XP, níveis 2/2/3, I1/I2/I3; boss sem prêmio próprio | PASS documental |

Revisão editorial BIBLICAL CONTENT: N/A, sem narrativa/referência nova nem alteração das unidades aprovadas; somente estrutura para seus metadados. Procedimento coding: N/A, não há código autorizado. Migração/recuperação de banco: N/A nesta modelagem, não existe banco; implementação futura exigirá testes em banco descartável e plano de restauração.

## Evidências reproduzíveis

- PowerShell: leitura UTF-8 dos quatro novos documentos, extração de links Markdown relativos com regex e Test-Path; PASS, todos resolvidos. Checagem de caractere de substituição Unicode: PASS.
- Get-ChildItem apps,packages,tests -Recurse -File: apenas sete arquivos .gitkeep, sem implementação nesses diretórios.
- Get-Command git -ErrorAction SilentlyContinue: nenhum executável encontrado no PATH; diff/status Git indisponíveis, sem alegar validação nativa. Inspeção feita pelos caminhos explícitos das edições.
- Inspeção do texto produzido: somente modelagem/governança; sem secrets, dados pessoais reais, SQL executável, instalação ou citações bíblicas protegidas.
- Verificação final PowerShell nos oito documentos envolvidos: PASS para links locais, UTF-8, presença das 22 entidades e busca limitada de padrões de chave privada/connection string. Listagem de contratos confirma ID TASK-0004 único. Mermaid revisado textualmente; renderização não executada.

Histórico: BACKLOG → ACTIVE → VALIDATING → DONE em 2026-09-16; nenhum gate documental falhou. Contrato aceito pelo ORCHESTRATOR e movido para completed após validação.

## Acceptance check e Definition of Done

| Check | Resultado/evidência |
| --- | --- |
| Entidades solicitadas | PASS: todas as 22 analisadas, incluindo projeções e papel Boss; extras ContentUnit/BiblicalReference/RewardGrant/OperationReceipt justificados |
| Relações, ownership, campos, constraints e índices | PASS: tabelas, ER e seção de consultas em DATA-MODEL; garantias banco/aplicação diferenciadas |
| Progressão/concorrência/segurança | PASS: DB-01..13, protocolo de lock/versão/recibo e cenários adversariais |
| Conteúdo e pendências | PASS: referências e classificação por unidade; licença/edição e políticas continuam pendentes |
| BUILD / LINT / TYPECHECK | N/A: documentação, sem aplicação/configuração executável |
| UNIT / INTEGRATION TEST | N/A: nenhuma lógica executável alterada; testes futuros explicitados, não executados |
| ACCEPTANCE CRITERIA | PASS documental, matriz acima |
| SECURITY REVIEW | PASS documental pelo autor, conforme parecer; controles reais pendentes |
| DOCUMENTATION UPDATED | PASS: documentos, ADR, projeto, decisões, changelog e estado atual |
| NO SECRETS | PASS: inspeção dos textos produzidos, sem credenciais ou dados reais |
| NO KNOWN CRITICAL REGRESSIONS | PASS documental: regras numéricas/fluxos do design preservados; sem garantia sobre software inexistente |

Riscos residuais: retenção/eliminação, licença e políticas operacionais dependem de produto/SECURITY antes do piloto; implementação deve comprovar os controles e compatibilidade das versões. Não bloqueiam a modelagem nem autorizam cadastro/publicação.

Próxima tarefa recomendada, exatamente uma: TASK-0005 — fechar documentalmente políticas do piloto (público operacional, privacidade/contas, retenção/exclusão de recibos, progresso e backups, edição/licença portuguesa). Não contratada nem iniciada.
