# TASK-CONSOLIDATION-003A — Proposta da sétima ação de carta

ID: TASK-CONSOLIDATION-003A
TITLE: Revisar extensão mínima Golpe Medido antes de qualquer implementação
OBJECTIVE: Decidir uma sétima mecânica distinta sem duplicar os seis efeitos ou modificar fórmulas globais.
PRIORITY: P2 Normal
STATUS: BACKLOG
SCOPE: Somente proposta documental em docs/game-design/CONSOLIDATION-003-CARDS-AND-SEVENTH-EFFECT.md. Não há autorização runtime para esta tarefa.
OUT_OF_SCOPE: Implementar ação, cadastrar sétima carta, aprovar raridade/balanceamento final, conceder starter/posse, economia0078, autoridade004, remoto/push/deploy.
DEPENDENCIES: Aprovação explícita da ação e dos parâmetros candidatos, revisão de homologação e plano de validação; catálogo003 contém somente seis propostas.
ASSIGNED_AGENT: Não iniciado. Perfis Game Designer/Backend/QA/Security somente quando autorizado contrato runtime específico.
REQUIRED_CONTEXT: Seis ações ArenaV2, homologação0085, descrições0086, proposta003 e contrato de aquisição.
SECURITY_CONSIDERATIONS: Browser envia ID/revisão; servidor/engine escolhem parâmetros. Proposta não autoriza coleção, concessão ou combate autoritativo.
ACCEPTANCE_CRITERIA:
- Decisão explícita: aprovar/revisar/recusar candidato Golpe Medido, nível1/Foco1/multiplicador1,15 sem bônus/ganho de Foco adicional.
- Se aprovado, registrar novo contrato runtime antes de codificar, sem alterar seis efeitos existentes.
- Contrato futuro prevê equivalência da fórmula, efeito distinto mensurável, custos/níveis/equipamentos, single-use/rematch, replay/versionamento, IA e integração UI de três ações.
- Não contar proposta como sétima carta homologada ou balanceamento comprovado.
TEST_PLAN: Nesta proposta, revisão estrutural e rastreabilidade. No contrato futuro, cenários numéricos comparativos fora de piso/teto, regressões de fórmula/equipamentos e testes de rejeição/uso/replay; sem testes de nova ação alegados agora.
DEFINITION_OF_DONE: Decisão de produto registrada e, se aprovada, escopo runtime próprio autorizado; esta tarefa não foi executada nem aprovada automaticamente pela criação do documento.
