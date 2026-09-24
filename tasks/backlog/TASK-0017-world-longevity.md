# TASK-0017 → Coleções, exploração e eventos
ID: TASK-0017
TITLE: Sistemas de longevidade e rejogabilidade
OBJECTIVE: Sustentar campanha, Viajante, exploração e Guilda entre fases com progresso claro e conteúdo repetível.
PRIORITY: P2 Normal
STATUS: BACKLOG
SCOPE: Códice por slot e silhuetas, conquistas de gameplay, progresso de área, segredos/baús/missões secundárias, eventos rotativos locais e missões diárias/semanais leves.
OUT_OF_SCOPE: Obrigações de login, métricas de fé, serviços online de tempo real e conteúdo de fases ainda não roteirizadas.
DEPENDENCIES: TASK-0015 e TASK-0016 para catálogo, economia e conteúdo da Guilda.
ASSIGNED_AGENT: Orquestrador com game designer, frontend, backend e QA locais.
REQUIRED_CONTEXT: Pedido anexado seções 21–26 e 35, exploração atual e Códice existente.
SECURITY_CONSIDERATIONS: Não expor dados privados de Viajantes; eventos locais não implicam sincronização entre usuários.
ACCEPTANCE_CRITERIA:
- Progresso da área distingue história, exploração, segredos, baús e equipamentos descobertos.
- Conquistas e eventos dão recompensas de gameplay idempotentes; missões recorrentes não pressionam presença religiosa.
- Reload e troca de Viajante mantêm isolamento e estado consistente.
TEST_PLAN:
- Testes de contagem, recorrência, idempotência, migração e fluxos E2E.
DEFINITION_OF_DONE:
- Critérios e gates aplicáveis aprovados, memória atualizada.
