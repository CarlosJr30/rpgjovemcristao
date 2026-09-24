# TASK-0016 → Conteúdo criado pela Guilda
ID: TASK-0016
TITLE: Lições, missões e desafios da Guilda
OBJECTIVE: Permitir ao líder organizar conteúdo de célula e objetivos coletivos com recompensas calculadas por tier.
PRIORITY: P1 High
STATUS: BACKLOG
SCOPE: Painel do líder, lições com passagem e perguntas, missões individuais/coletivas, calendário, submissão e validação da atividade, recompensa única por tier e projeto local de acampamento.
OUT_OF_SCOPE: Avaliação de espiritualidade, XP por oração, identidade de líder autodeclarada como autorização real e backend online sem infraestrutura aprovada.
DEPENDENCIES: TASK-0015 para economia e loot; definição de autoridade/identidade para modo multiusuário real.
ASSIGNED_AGENT: Orquestrador com backend, frontend, game designer, QA e Security locais.
REQUIRED_CONTEXT: Pedido anexado seções 27–34, gate atual da Guilda e guildRewards.
SECURITY_CONSIDERATIONS: Conteúdo do líder é entrada não confiável; limitar tamanho, validar URLs/passagens, evitar HTML executável e não tratar simulação local como autorização real.
ACCEPTANCE_CRITERIA:
- Líder cria lição e desafio com campos validados, tier e prazo; participantes veem e concluem sem compartilhar dados devocionais privados.
- Recompensa deriva da tabela central, é concedida uma vez e persiste por Viajante.
- Progresso coletivo e calendário refletem eventos locais corretamente, com limitações de autoridade explícitas.
TEST_PLAN:
- Testes de fluxo, validação, persistência, idempotência, isolamento e revisão Security.
DEFINITION_OF_DONE:
- Critérios e gates aplicáveis aprovados, memória atualizada.
