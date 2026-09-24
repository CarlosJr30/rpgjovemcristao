# TASK-0002 → Definir a stack

ID: TASK-0002
TITLE: Definir a stack do monólito modular
OBJECTIVE: Selecionar tecnologias adequadas às restrições do projeto e registrar uma decisão revisável.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Análise documental, docs/architecture/TECH-STACK.md, docs/adr/ADR-0001-technical-stack.md, este contrato, memória, README e visão/roadmap.
OUT_OF_SCOPE: Instalar dependências, criar manifests, implementar aplicações, banco, autenticação ou gameplay.
DEPENDENCIES: TASK-0001 concluída; plataforma web desktop/celular confirmada pela solicitação; experiência, orçamento e MVP tratados como hipóteses revisáveis no TECH-STACK.
ASSIGNED_AGENT: ARCHITECT
REQUIRED_CONTEXT: projects/RPG-JOVEM-CRISTAO.md; .agent/memory/CURRENT_STATE.md; .agent/agents/architect.md; docs/adr/README.md
SECURITY_CONSIDERATIONS: Avaliar manutenção, atualizações, suporte a autenticação/autorização e gestão de secrets sem criar credenciais.
ACCEPTANCE_CRITERIA:
- Requisitos decisivos e hipóteses explícitos.
- Alternativas comparadas por simplicidade, modularidade, testabilidade, segurança e operação.
- ADR com STATUS, CONTEXT, DECISION, ALTERNATIVES e CONSEQUENCES; dúvidas que impedem escolha resolvidas.
TEST_PLAN:
- Revisar coerência do ADR com requisitos, fontes técnicas consultadas e escopo do monólito modular.
- Conferir que não houve instalação ou implementação.
DEFINITION_OF_DONE:
- Aceite documental aprovado, avaliação de segurança da escolha registrada e memória atualizada.
- Build/lint/typecheck/testes de aplicação N/A nesta tarefa documental, com justificativa.

## Execução — 2026-09-16

ORCHESTRATOR: agente principal; ARCHITECT e SECURITY assumidos localmente, sem subagentes ou revisão independente. Aplicados os procedimentos .agent/skills/architecture.md e .agent/skills/security-review.md.
Autorização de escopo: ORCHESTRATOR mantém contrato, README, projeto e memória; ARCHITECT escreve os dois documentos técnicos; parecer SECURITY registrado neste contrato pelo agente principal. Consulta somente de leitura a documentação técnica pública para fundamentar a decisão; nenhum serviço configurado.
Fluxo: BACKLOG → ACTIVE → VALIDATING → DONE. Contrato existente reutilizado, mantendo ID único; aceite documental concluído em 2026-09-16.

## Aceite ampliado da solicitação

- Cobrir frontend, backend/API, linguagem, framework, banco, ORM, autenticação, validação, testes, UI, engine, cache/storage futuros, observabilidade e deploy.
- Comparar alternativas e os critérios de maturidade, segurança, desempenho, manutenção, produtividade, comunidade, custo/hospedagem, escala, IA e adequação ao RPG.
- Separar apps/packages, domínios, aplicação, persistência, UI e engine; considerar todas as entidades solicitadas sem schema.
- Comparar React, Canvas, Phaser e híbrido; servidor autoritativo e evolução sem microserviços prematuros.
- Registrar trade-offs, pressupostos, controles futuros e próxima tarefa sem executá-la.

## SELF VALIDATE e aceite — 2026-09-16

Autor/revisor: agente principal nos perfis ARCHITECT e SECURITY, sob ORCHESTRATOR; sem revisão independente.

| Critério | Resultado e evidência |
| --- | --- |
| Requisitos e hipóteses | PASS: TECH-STACK, seção Requisitos; web confirmada, equipe/orçamento/gameplay explicitamente hipotéticos; lacunas encaminhadas para próxima definição |
| Stack completa e alternativas | PASS: tabelas Stack e Comparação cobrem todas as áreas e critérios solicitados, sem alegar benchmarks |
| Arquitetura e entidades | PASS: fronteiras, dependências, diagrama e mapa conceitual cobrem os 17 nomes de entidades solicitados, sem schema |
| Engine | PASS: comparação React/Canvas/Phaser/híbrida, núcleo de regras separado e gatilhos de reavaliação |
| ADR | PASS: ADR-0001 contém STATUS, CONTEXT, DECISION, ALTERNATIVES, CONSEQUENCES, data e tarefa |
| Segurança e evolução | PASS documental: autoridade, idempotência, concorrência, identidade, autorização e implantação futura explicitadas; parecer abaixo |
| Escopo | PASS: comparação SHA256 antes/depois identifica apenas documentação autorizada; busca por manifests, lockfiles, TS/TSX, SQL, Prisma e Dockerfile não retornou arquivos (rg exit 1 significa nenhuma correspondência) |
| Memória/roadmap | PASS: README, projeto, DECISIONS, CURRENT_STATE e CHANGELOG atualizados; próxima recomendação não executada |

Evidências executadas: Get-FileHash SHA256 sobre arquivos antes/depois; rg para referências a stack/TASK-0002/STATUS; script PowerShell verificando links Markdown locais com Test-Path e todos os nomes de entidades com regex; Select-String para padrões de chaves privadas/atribuições de secrets, sem ocorrências, complementado por leitura dos documentos. O script imprimiu por engano o rótulo fixo “18 entidades”; a lista verificada contém os 17 nomes pedidos, todos presentes. Fontes primárias consultadas estão no TECH-STACK. A leitura direta da URL não versionada de transações Prisma falhou por tipo de conteúdo; a busca encontrou referência oficial versionada, citada com esse limite.

Git CLI continua indisponível no PATH, portanto não se alega git diff/status, commit ou verificação de arquivos rastreados. Comparação de conteúdo do workspace usada nesta entrega documental; nenhum commit solicitado. Links externos foram consultados como fontes, não como teste completo de disponibilidade.

## QA e Security

QA executável N/A: não existe código alterado, integração implementada ou regressão de comportamento para executar. Revisão estrutural pelo autor aplicada à entrega documental; os módulos descritos são conceituais, não módulos executáveis alterados. Security obrigatório por decisões de auth, dados, dependências e deploy; revisão documental pelo próprio autor, conforme permissão do workflow.

| Risco | Severidade potencial | Evidência/controle exigido | Resultado |
| --- | --- | --- | --- |
| Cliente forjar estado ou repetir recompensa | Alta | TECH-STACK exige servidor autoritativo, concessão atômica, idempotência e controle de concorrência | Tratado no desenho; implementação/testes obrigatórios antes de jogo público |
| Sessão, CSRF e acesso a personagem alheio | Alta | Auth revisada, cookies, origem e autorização por recurso em cada caso de uso | Tratado no desenho; validação concreta futura |
| Injection/secrets/logs sensíveis | Alta | Parametrização, validação, menor privilégio, redação e ausência de credenciais no conteúdo | Sem achado alto/crítico documental aberto |
| Dependências/versões incompatíveis | Média residual | Sem versões instaladas; exigir releases compatíveis, revisão de suporte/licença/vulnerabilidades e lockfile | Responsável ARCHITECT na preparação futura; aceitar direção sem alegar auditoria de pacotes |
| Público/privacidade e conteúdo indefinidos | Média residual nesta fase | Não há coleta/publicação; definir antes de cadastro/social e conteúdo licenciado | Responsável ORCHESTRATOR ao selecionar próxima tarefa; acompanhamento TASK-0003 recomendado |

Conclusão: SECURITY REVIEW PASS para a decisão documental; não é aprovação de produção. Nenhuma falha de aceite ou REWORK identificado. Overengineering verificado: sem microserviços, engine gráfica, cache, filas, segundo backend ou infraestrutura antecipados. Nenhuma narrativa nova requer gate BIBLICAL CONTENT.

## Definition of Done

| Check | Resultado |
| --- | --- |
| BUILD PASS | N/A: sem artefato compilável ou build |
| LINT PASS | N/A: documentação, sem linter configurado |
| TYPECHECK PASS | N/A: TypeScript decidido, sem código/configuração para verificar |
| UNIT TEST PASS | N/A: nenhuma lógica executável alterada |
| INTEGRATION TEST PASS | N/A: integrações somente propostas |
| ACCEPTANCE CRITERIA PASS | PASS: matriz e inspeções acima |
| SECURITY REVIEW PASS | PASS documental pelo autor, limitações e acompanhamento acima |
| DOCUMENTATION UPDATED | PASS: documentos técnicos, referências e memória sincronizados |
| NO SECRETS | PASS: triagem e inspeção do conteúdo alterado |
| NO KNOWN CRITICAL REGRESSIONS | PASS no escopo documental; sem alteração de software, controles futuros não declarados implementados |
